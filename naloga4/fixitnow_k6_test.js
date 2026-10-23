import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// Prilagojene metrike po končnih točkah
const searchDuration = new Trend('search_duration', true);
const loginDuration = new Trend('login_duration', true);
const createTicketDuration = new Trend('create_ticket_duration', true);
const businessErrorRate = new Rate('business_error_rate');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const PROFILE = __ENV.PROFILE || 'load'; // 'load' | 'stress' | 'spike'

const profiles = {
  load: [
    { duration: '1m', target: 20 }, // Postopno naraščanje na normalno obremenitev
    { duration: '2m', target: 20 }, // Vzdrževanje normalne obremenitve
    { duration: '1m', target: 50 }, // Povečanje na vršno obremenitev
    { duration: '1m', target: 50 }, // Vzdrževanje vršne obremenitve
    { duration: '1m', target: 0 },  // Postopno zmanjševanje (ramp-down)
  ],
  stress: [
    { duration: '1m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '1m', target: 200 },
    { duration: '1m', target: 0 },
  ],
  spike: [
    { duration: '30s', target: 10 },
    { duration: '20s', target: 150 },
    { duration: '1m', target: 150 },
    { duration: '20s', target: 10 },
    { duration: '1m', target: 10 },
  ],
};

export const options = {
  stages: profiles[PROFILE] || profiles.load,
  thresholds: {
    http_req_failed: ['rate<0.01'],                       // Manj kot 1 % napak HTTP
    http_req_duration: ['p(95)<500', 'p(99)<1000'],       // Splošni SLA odzivnega časa
    search_duration: ['p(95)<350'],                       // SLA za iskanje izvajalcev
    login_duration: ['p(95)<800'],                        // SLA za BCrypt prijavo
    create_ticket_duration: ['p(95)<600'],                // SLA za ustvarjanje zahtevka
    checks: ['rate>0.99'],                                // Nad 99 % uspešnih preverjanj
  },
};

export default function () {
  let accessToken = null;

  // 1. SKLOP (ST-01): Javno brskanje in prostorsko iskanje izvajalcev
  group('ST-01: Javno brskanje in iskanje izvajalcev', () => {
    const statsRes = http.get(`${BASE_URL}/api/v1/stats/public`, {
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
      email: __ENV.TEST_EMAIL || 'ana.kovac@example.com',
      password: __ENV.TEST_PASSWORD || 'Password123!',
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

      // Z verjetnostjo 25 % uporabnik v iteraciji odda tudi nov zahtevek (realistično razmerje branje:pisanje)
      if (Math.random() < 0.25) {
        const ticketPayload = JSON.stringify({
          title: 'Puščanje sifona pod kuhinjskim koritom (k6 test)',
          description: 'Voda kaplja pri tesnilu pod pomivalnim koritom.',
          serviceCategory: 'PLUMBING',
          urgency: 'MEDIUM',
          address: 'Smetanova ulica 17, 2000 Maribor',
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
