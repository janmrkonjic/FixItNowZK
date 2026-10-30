import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// Prilagojene metrike po končnih točkah
const searchDuration = new Trend('search_duration', true);
const loginDuration = new Trend('login_duration', true);
const createTicketDuration = new Trend('create_ticket_duration', true);
const businessErrorRate = new Rate('business_error_rate');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const PROFILE = __ENV.PROFILE || 'stress'; // 'load' | 'stress' | 'spike'

// Bazen uporabnikov iz seed_api.py (geslo za vse je Password1!)
const SEED_USERS = [
  'barbara.rant@mail.si',
  'klemen.ferlinc@mail.si',
  'mateja.krajnc@mail.si',
  'maja.zagar@mail.si',
  'petra.stefanic@mail.si',
  'borut.zagar@mail.si',
  'mojca.gaberc@mail.si',
  'klemen.fras@mail.si',
  'nina.gasparic@mail.si',
  'janez.susnik@mail.si',
  'bostjan.heric@mail.si',
  'eva.majcen@mail.si',
  'andrej.krajnc@mail.si',
  'jure.mlakar@mail.si',
  'bostjan.meznaric@mail.si',
  'barbara.meznaric@mail.si',
  'tadej.susnik@mail.si',
  'dejan.novak@mail.si',
  'matej.kokol@mail.si',
  'primoz.breznik@mail.si',
  'alenka.mlakar@mail.si',
  'primoz.hribar@mail.si',
  'matej.kerec@mail.si',
  'tadej.meznaric@mail.si',
  'primoz.stuhec@mail.si',
  'katja.senk@mail.si',
  'valter.kerec@mail.si',
  'eva.divjak@mail.si',
  'andrej.vukovic@mail.si',
  'jure.cafuta@mail.si',
];

const SEED_PASSWORD = 'Password1!';

const profiles = {
  load: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  // Agresivni stresni test za iskanje točke preloma in preobremenitev strežnika
  stress: [
    { duration: '30s', target: 50 },   // Hiter zagon
    { duration: '1m', target: 150 },   // Prehod v visoko obremenitev
    { duration: '1m', target: 300 },   // Zasičenje bazena povezav in CPU (BCrypt)
    { duration: '1m', target: 500 },   // Ekstremni stres - točka preloma (crash / 500 / timeout)
    { duration: '1m', target: 800 },   // Maksimalno izčrpanje virov
    { duration: '30s', target: 0 },    // Preverjanje okrevanja (recovery)
  ],
  spike: [
    { duration: '20s', target: 20 },
    { duration: '15s', target: 400 },  // Hiter masiven sunek (spike)
    { duration: '1m', target: 400 },
    { duration: '20s', target: 20 },
    { duration: '30s', target: 0 },
  ],
};

// Privzeto nastavljeno na agresivni stresni profil
export const options = {
  stages: profiles[__ENV.PROFILE || 'stress'],
  thresholds: {
    http_req_failed: ['rate<0.05'],                       // Pri stresu pričakujemo do 5% napak ob zlomu
    http_req_duration: ['p(95)<1500', 'p(99)<3000'],     // Mejni SLA pod stresom
    search_duration: ['p(95)<1000'],
    login_duration: ['p(95)<2500'],
    create_ticket_duration: ['p(95)<1800'],
    checks: ['rate>0.90'],
  },
};

export default function () {
  let accessToken = null;

  // Izbira uporabnika iz seznama glede na VU ID (ali naključno)
  const userEmail = SEED_USERS[(__VU - 1) % SEED_USERS.length] || SEED_USERS[0];

  // 1. SKLOP (ST-01): Javno brskanje in prostorsko iskanje izvajalcev
  group('ST-01: Javno brskanje in iskanje izvajalcev', () => {
    const statsRes = http.get(`${BASE_URL}/api/v1/public/stats`, {
      tags: { endpoint: 'public_stats' },
    });
    check(statsRes, {
      'javna statistika vrne 200 OK': (r) => r.status === 200,
    });

    const categoriesRes = http.get(`${BASE_URL}/api/v1/providers/categories`, {
      tags: { endpoint: 'categories' },
    });
    check(categoriesRes, {
      'kategorije vrnejo 200 OK': (r) => r.status === 200,
    });

    const searchUrl =
      `${BASE_URL}/api/v1/providers/search?category=PLUMBING&maxPrice=80` +
      `&minExperience=2&latitude=46.5547&longitude=15.6459&radiusKm=25&page=0&size=12`;
    const searchRes = http.get(searchUrl, {
      tags: { endpoint: 'search' },
    });
    searchDuration.add(searchRes.timings.duration);

    const searchOk = check(searchRes, {
      'iskanje izvajalcev vrne 200 OK': (r) => r.status === 200,
      'odgovor vsebuje paginirano polje content': (r) => {
        try {
          return Array.isArray(JSON.parse(r.body).content);
        } catch (_) {
          return false;
        }
      },
    });
    businessErrorRate.add(!searchOk);
  });

  sleep(1);

  // 2. SKLOP (ST-02): Avtentikacija uporabnika (BCrypt + JWT)
  group('ST-02: Prijava uporabnika in pridobitev profila', () => {
    const loginPayload = JSON.stringify({
      email: userEmail,
      password: SEED_PASSWORD,
    });

    const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, loginPayload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { endpoint: 'login' },
    });
    loginDuration.add(loginRes.timings.duration);

    const loginOk = check(loginRes, {
      'prijava vrne 200 OK': (r) => r.status === 200,
      'odgovor vsebuje accessToken': (r) => {
        try {
          const body = JSON.parse(r.body);
          accessToken = body.accessToken;
          return Boolean(accessToken);
        } catch (_) {
          return false;
        }
      },
    });
    businessErrorRate.add(!loginOk);
  });

  sleep(1);

  // 3. SKLOP (ST-03): Avtenticirani klici - obvestila in servisni zahtevki
  if (accessToken) {
    const authHeaders = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    };

    group('ST-03: Obvestila in upravljanje zahtevkov', () => {
      const unreadRes = http.get(
        `${BASE_URL}/api/notifications/unread-count`,
        authHeaders
      );
      check(unreadRes, {
        'neprebrana obvestila vrnejo 200 OK': (r) => r.status === 200,
      });

      const ticketsRes = http.get(`${BASE_URL}/api/tickets`, authHeaders);
      check(ticketsRes, {
        'seznam zahtevkov vrne 200 OK': (r) => r.status === 200,
      });

      // Z verjetnostjo 25 % uporabnik v iteraciji odda tudi nov zahtevek
      if (Math.random() < 0.25) {
        const ticketPayload = JSON.stringify({
          serviceType: 'Popravilo sifona',
          category: 'PLUMBING',
          description: 'Voda kaplja pri tesnilu pod pomivalnim koritom.',
          priority: 'MEDIUM',
          location: 'Smetanova ulica 17, 2000 Maribor',
          latitude: 46.559,
          longitude: 15.638,
        });

        const createRes = http.post(
          `${BASE_URL}/api/tickets`,
          ticketPayload,
          Object.assign({}, authHeaders, { tags: { endpoint: 'create_ticket' } })
        );
        createTicketDuration.add(createRes.timings.duration);

        check(createRes, {
          'ustvarjanje zahtevka vrne 201 Created': (r) => r.status === 201,
        });
      }
    });
  }

  sleep(1);
}
