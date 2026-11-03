import random
from locust import HttpUser, task, between

# Seznam predpripravljenih strank iz baze (seed_api.py, geslo: Password1!)
SEED_USERS = [
    "eva.znidaric@mail.si",
    "igor.kolar@mail.si",
    "alenka.breznik@mail.si",
    "katja.mlakar@mail.si",
    "lea.vukovic@mail.si",
    "barbara.ferlinc@mail.si",
    "petra.zagar@mail.si",
    "katja.gaberc@mail.si",
    "valter.novak@mail.si",
    "janez.fras@mail.si",
    "sara.stuhec@mail.si",
    "helena.vukovic@mail.si",
    "primoz.krajnc@mail.si",
    "karmen.majcen@mail.si",
    "ziva.meznaric@mail.si",
    "ana.ferlinc@mail.si",
    "katja.vogel@mail.si",
    "lea.leskovec@mail.si",
    "blaz.skorjanc@mail.si",
    "nina.veber@mail.si",
    "spela.planinc@mail.si",
    "jure.potocnik@mail.si",
    "simona.skorjanc@mail.si",
    "valter.heric@mail.si",
    "ziga.vukovic@mail.si",
    "marko.kokol@mail.si",
    "mateja.ferlinc@mail.si",
    "ales.fras@mail.si",
    "dejan.oblak@mail.si",
    "miha.divjak@mail.si",
]

SEED_PASSWORD = "Password1!"

CATEGORIES = [
    "PLUMBING",
    "ELECTRICAL",
    "IT_SUPPORT",
    "CLEANING",
    "CARPENTRY",
    "HVAC",
    "APPLIANCE_REPAIR",
    "PAINTING",
]


class FixItNowSoakAndChaosUser(HttpUser):
    """
    Simulira dolgotrajno aktivnega uporabnika platforme FixItNow za:
      1. Testiranje vzdržljivosti (Soak / Endurance Testing) in skalabilnosti
      2. Testiranje okrevanja po izpadu podatkovne baze (Recovery Testing s Pumbo)
    """

    wait_time = between(1.0, 2.5)

    def on_start(self):
        self.email = random.choice(SEED_USERS)
        self.access_token = None
        self.refresh_token = None
        self._authenticate()

    def _authenticate(self):
        payload = {"email": self.email, "password": SEED_PASSWORD}
        with self.client.post(
            "/api/v1/auth/login",
            json=payload,
            name="ST-A1: POST /api/v1/auth/login",
            timeout=10.0,
            catch_response=True,
        ) as res:
            if res.status_code == 200:
                try:
                    data = res.json()
                    self.access_token = data.get("accessToken")
                    self.refresh_token = data.get("refreshToken")
                    if self.access_token:
                        res.success()
                    else:
                        res.failure("Manjka accessToken v odgovoru prijave")
                except Exception as exc:
                    res.failure(f"Neveljaven JSON pri prijavi: {exc}")
            else:
                res.failure(f"Prijava neuspešna (HTTP {res.status_code})")

    def _auth_headers(self):
        if not self.access_token:
            self._authenticate()
        if not self.access_token:
            return {}
        return {"Authorization": f"Bearer {self.access_token}"}

    @task(4)
    def browse_and_search_providers(self):
        """
        Bralno intenzivni sklop: javna statistika, kategorije in prostorsko iskanje.
        Preverja stabilnost bralnih poizvedb v PostgreSQL in hitrost vračanja HikariCP povezav.
        """
        with self.client.get(
            "/api/v1/public/stats",
            name="ST-A2: GET /api/v1/public/stats",
            timeout=8.0,
            catch_response=True,
        ) as stats_res:
            if stats_res.status_code == 200:
                stats_res.success()
            else:
                stats_res.failure(f"HTTP {stats_res.status_code}")

        category = random.choice(CATEGORIES)
        search_url = (
            f"/api/v1/providers/search?category={category}&maxPrice=90"
            f"&minExperience=1&latitude=46.5547&longitude=15.6459&radiusKm=35&page=0&size=12"
        )
        with self.client.get(
            search_url,
            name="ST-A2: GET /api/v1/providers/search",
            timeout=8.0,
            catch_response=True,
        ) as search_res:
            if search_res.status_code == 200:
                try:
                    body = search_res.json()
                    if isinstance(body.get("content"), list):
                        search_res.success()
                    else:
                        search_res.failure("Manjka polje content v paginaciji")
                except Exception as exc:
                    search_res.failure(f"JSON napaka: {exc}")
            else:
                search_res.failure(f"HTTP {search_res.status_code}")

    @task(3)
    def check_dashboard_and_notifications(self):
        """
        Periodično preverjanje obvestil in seznama zahtevkov prijavljene stranke.
        Simulira odprto sejo v brskalniku (NotificationBell polling + MyTickets).
        """
        headers = self._auth_headers()
        if not headers:
            return

        with self.client.get(
            "/api/notifications/unread-count",
            headers=headers,
            name="ST-A3: GET /api/notifications/unread-count",
            timeout=8.0,
            catch_response=True,
        ) as notif_res:
            if notif_res.status_code == 200:
                notif_res.success()
            elif notif_res.status_code == 401:
                self.access_token = None
                notif_res.failure("Seja potekla (401)")
            else:
                notif_res.failure(f"HTTP {notif_res.status_code}")

        with self.client.get(
            "/api/tickets",
            headers=headers,
            name="ST-A3: GET /api/tickets",
            timeout=8.0,
            catch_response=True,
        ) as tickets_res:
            if tickets_res.status_code == 200:
                tickets_res.success()
            else:
                tickets_res.failure(f"HTTP {tickets_res.status_code}")

    @task(2)
    def create_service_ticket(self):
        """
        Transakcijski pisalni sklop: oddaja novega servisnega zahtevka.
        Preverja morebitno puščanje transakcij/povezav (HikariCP) in rast porabe pomnilnika.
        """
        headers = self._auth_headers()
        if not headers:
            return

        category = random.choice(CATEGORIES)
        payload = {
            "serviceType": f"Vzdrževalni pregled ({category})",
            "category": category,
            "description": "Preverjanje dolgotrajne vzdržljivosti sistema (Locust Soak Test).",
            "priority": random.choice(["LOW", "MEDIUM", "HIGH"]),
            "location": "Koroška cesta 46, 2000 Maribor",
            "latitude": 46.5576,
            "longitude": 15.6418,
        }

        with self.client.post(
            "/api/tickets",
            json=payload,
            headers=headers,
            name="ST-A4: POST /api/tickets",
            timeout=10.0,
            catch_response=True,
        ) as create_res:
            if create_res.status_code in (200, 201):
                create_res.success()
            else:
                create_res.failure(f"HTTP {create_res.status_code}")

    @task(1)
    def verify_profile_and_session_health(self):
        """
        Preverjanje aktivnega profila uporabnika (/api/v1/users/me).
        """
        headers = self._auth_headers()
        if not headers:
            return

        with self.client.get(
            "/api/v1/users/me",
            headers=headers,
            name="ST-A1: GET /api/v1/users/me",
            timeout=8.0,
            catch_response=True,
        ) as me_res:
            if me_res.status_code == 200:
                me_res.success()
            else:
                me_res.failure(f"HTTP {me_res.status_code}")
