# Poročilo – Naloga 2: Testiranje enot

## Enota 1: `NotificationController`

### 1. Utemeljitev izbire in specifikacija delovanja

**Utemeljitev izbire in izvor obvestil v arhitekturi:**
Razred `NotificationController` predstavlja REST API vstopno točko (`/api/notifications`) za branje in upravljanje uporabniških obvestil v aplikaciji. Sama obvestila (`Notification`) se ne ustvarjajo preko javne REST končne točke, temveč interno v storitvenem sloju v razredu `NotificationServiceImpl` (v metodah `createTicketScoped` in `notifyNewMessage`), kjer se preverijo uporabniške nastavitve (`isEnabled`), 2-minutno okno za preprečevanje podvajanja (`isRecentDuplicate`), agregacija sporočil klepeta (`aggregateCount`) ter pošiljanje preko WebSocketa (`broadcast`). Ustvarjanje obvestil sprožajo ostale storitve ob domenskih dogodkih:
- `TicketService` (`notifyInboundRequest`, `notifyPaymentReceived`, `notifyTicketStatusChange`),
- `ChatServiceImpl` (`notifyNewMessage`),
- `ReviewServiceImpl` (`notifyReviewReceived`),
- `TrackingService` (`notifyProviderNearby`).

**Specifikacija delovanja:**
Vse končne točke v `NotificationController` zahtevajo avtenticiranega uporabnika (`@PreAuthorize("isAuthenticated()")`). Krmilnik mora pri vsakem klicu **preveriti identiteto in `userId` (`UUID`) prijavljenega uporabnika** iz objekta `UserPrincipal` (`userDetails.getUser().getId()`) – preveriti mora, da prijavljeni uporabnik in njegov `userId` obstajata (nista `null`), ter zagotoviti, da se v storitveni sloj vedno posreduje točno ta `userId`, s čimer se prepreči dostop do obvestil drugih uporabnikov:

1. **`GET /api/notifications` (`list`):**
   - **Namen:** Vrne seznam obvestil prijavljenega uporabnika.
   - **Pričakovano delovanje:** Preveri `userId` prijavljenega uporabnika, pokliče `notificationService.getNotifications(userId)` s točno tem `UUID` in vrne status `200 OK` ter JSON seznam objektov `NotificationResponse` z vsemi pripadajočimi polji (`id`, `type`, `title`, `body`, `titleKey`, `bodyKey`, `params`, `ticketId`, `chatRoomId`, `aggregateCount`, `read`, `createdAt`).
   - **Robni primeri:** Če uporabnik nima obvestil, vrne `200 OK` in prazen JSON seznam `[]`.

2. **`GET /api/notifications/unread-count` (`unreadCount`):**
   - **Namen:** Vrne število neprebranih obvestil prijavljenega uporabnika.
   - **Pričakovano delovanje:** Preveri `userId` prijavljenega uporabnika, pokliče `notificationService.getUnreadCount(userId)` za ta `userId` in vrne status `200 OK` ter JSON objekt `{"count": <število>}`.
   - **Robni primeri:** Ob 0 neprebranih obvestilih vrne `{"count": 0}`; pravilno obravnava tudi velike vrednosti tipa `Long`.

3. **`PUT /api/notifications/{id}/read` (`markRead`):**
   - **Namen:** Označi posamezno obvestilo z danim `id` kot prebrano za prijavljenega uporabnika.
   - **Pričakovano delovanje:** Preveri `userId` prijavljenega uporabnika ter pokliče `notificationService.markAsRead(id, userId)` z natančno podanim `id` iz poti in preverjenim `userId` prijavljenega uporabnika, nato vrne `200 OK` z JSON odgovorom `{"success": true}`.
   - **Neveljavni vhodi in izjeme:**
     - Če `{id}` v poti ni veljavno celo število (npr. `/api/notifications/abc/read`), mora krmilnik zavrniti zahtevo s statusom `400 Bad Request` brez klica storitve.
     - Če `userId` prijavljenega uporabnika ne ustreza lastniku obvestila in storitev proži `AccessDeniedException` (ali drugo izjemo), zahteva ne sme vrniti `200 OK`.

4. **`PUT /api/notifications/read-all` (`markAllRead`):**
   - **Namen:** Označi vsa obvestila prijavljenega uporabnika kot prebrana.
   - **Pričakovano delovanje:** Preveri `userId` prijavljenega uporabnika, točno enkrat pokliče `notificationService.markAllAsRead(userId)` s tem `userId` in vrne status `200 OK` z JSON odgovorom `{"success": true}`.

5. **`DELETE /api/notifications` (`deleteAll`):**
   - **Namen:** Trajno izbriše vsa obvestila prijavljenega uporabnika.
   - **Pričakovano delovanje:** Preveri `userId` prijavljenega uporabnika, točno enkrat pokliče `notificationService.deleteAll(userId)` s tem `userId` in vrne status `200 OK` z JSON odgovorom `{"success": true}`.
   - **Izjeme ob neveljavnem uporabniku / `userId`:** Če `UserPrincipal`, `User` ali uporabnikov `userId` manjka (`null`) oziroma storitev vrže izjemo, klic ne sme uspeti s `200 OK`.

---

### 2. Analiza obstoječih testov (`NotificationControllerTest`) – zakaj so pomanjkljivi

Obstoječi testi v razredu `NotificationControllerTest` so pomanjkljivi, saj **so bili izpeljani neposredno iz obstoječe implementacije kode in ne iz specifikacije zahtev**:

- **Testiranje zgolj trenutne implementacije ("happy path"):** Vseh 5 testov preverja le osnovni scenarij uspešnega klica (HTTP 200 OK) z vnaprej pripravljenim lažnim odgovorom, ki zgolj zrcali trenutno napisano kodo krmilnika.
- **Odsotnost preverjanja dejanskih klicev storitve (`verify`):** Pri metodah `markRead`, `markAllRead` in `deleteAll` testi nastavijo `doNothing().when(notificationService)...` in preverijo le statični odgovor `{"success": true}`, ki ga krmilnik vrne v vsakem primeru. Če v krmilniku izbrišemo klic metode `notificationService`, obstoječi testi še vedno uspejo (lažno pozitivni testi).
- **Nepopolno preverjanje izhodnih podatkov:** Test `listNotificationsShouldReturn200` preveri le eno polje (`$[0].title`), ostalih polj objekta `NotificationResponse` (npr. `id`, `type`, `body`, `read`, `aggregateCount`) ter primera praznega seznama obvestil pa sploh ne preveri.
- **Brez robnih primerov, neveljavnih vhodov in izjem:** Testi ne preverjajo obnašanja ob neveljavnem parametru poti (npr. nečrkovni ali negativni `{id}`), ob neprijavljenem uporabniku (`null` principal), niti ob izjemah iz storitvenega sloja (npr. `AccessDeniedException`, ko uporabnik poskuša označiti tuje obvestilo kot prebrano, ali `ResourceNotFoundException`).

---

### 3. Generiranje novih testov na podlagi specifikacije in rezultati zagona

Na podlagi zgornje specifikacije smo z uporabo ogrodja **JUnit 5**, **Spring MockMvc** in **Mockito** (`@Mock`, `@InjectMocks`, `ArgumentCaptor`, `verify`, `verifyNoInteractions`, `verifyNoMoreInteractions`) na novo ustvarili **36 testov enot**, ki so poimenovani po konvenciji `metoda_koJePogoj_najPričakovanRezultat` in razdeljeni v 5 ločenih pod-datotek (po ena za vsako končno točko) v paketu `com.example.backend.web.controller.notification`:
- `NotificationControllerListTest.java` (8 testov)
- `NotificationControllerUnreadCountTest.java` (8 testov)
- `NotificationControllerMarkReadTest.java` (8 testov)
- `NotificationControllerMarkAllReadTest.java` (6 testov)
- `NotificationControllerDeleteAllTest.java` (6 testov)

Ob prvem zagonu novih testov je **31 testov uspelo, 5 testov pa je bilo neuspešnih** (po en test `*_whenPrincipalUserIdIsNull_shouldRejectAndNeverCallService` v vsaki izmed petih datotek). Testi so odkrili, da obstoječa koda v `NotificationController` ne preverja robnega primera, ko je `userDetails.getUser().getId()` enak `null`, temveč posreduje `null` v `NotificationService` in vrne status `200 OK` namesto zavrnitve zahtevka:

![Rezultat zagona novih testov – 5 neuspešnih testov](slike/failed_tests_notification_controller.png)

---

### 4. Posodobitev CI/CD cevovoda (`.github/workflows/backend.yml`)

V datoteki `.github/workflows/backend.yml` smo:
- Odstranili zastavico `continue-on-error: true` pri koraku `Run tests` (`mvn test`), tako da vsak neuspešen test enot takoj ustavi in označi izvajanje cevovoda kot neuspešno.
- Zakomentirali korake gradnje produkcijskega paketa in objave na Heroku (`Build JAR`, `Install Heroku CLI`, `Deploy to Heroku`), tako da cevovod izvaja izključno preverjanje s testi enot.

---

### 5. Uporaba orodij umetne inteligence (del za `NotificationController`)

- **Uporabljeni model:** Gemini 4 Argon (Medium)
- **Namen uporabe:** Pomoč pri pregledu in posodobitvi CI/CD cevovoda (`.github/workflows/backend.yml`), da se ob neuspešnih testih izvajanje ustavi in se preskoči objava, ter pomoč pri analizi pomanjkljivosti obstoječih testov v `NotificationControllerTest` in zapisu tega dela poročila. Specifikacija delovanja krmilnika je bila napisana ročno, na njeni podlagi pa so bili nato z agentom ponovno generirani izboljšani testi enot.

---


## Enota 2: `IbanValidator`

### 1. Utemeljitev izbire in specifikacija delovanja

**Utemeljitev izbire:**

Razred `IbanValidator` je namenjen normalizaciji in preverjanju veljavnosti
številk IBAN. Izbran je zaradi netrivialne logike, ki vključuje obdelavo
vhodnega niza, preverjanje dovoljenih znakov, preverjanje dolžine glede
na državo in izračun kontrolne vsote MOD-97.

Napačno delovanje lahko povzroči sprejetje neveljavnega ali zavrnitev
veljavnega IBAN-a. Razred nima zunanjih odvisnosti, zato ga lahko
testiramo izolirano, brez baze podatkov in zagona aplikacije.

**Specifikacija delovanja:**

1. **Normalizacija (`normalize`):**
   - Za vhod `null` vrne prazen niz.
   - Odstrani presledke, tabulatorje in prelome vrstic.
   - Male črke pretvori v velike neodvisno od privzete lokalizacije.
   - Drugih znakov ne odstranjuje.
   - Za prazen niz ali niz samih belih znakov vrne prazen niz.
   - Primer: `" gb29 nwbk 6016 1331 9268 19 "` pretvori v
     `"GB29NWBK60161331926819"`.

2. **Preverjanje vhodov in oblike (`isValid`):**
   - Za `null`, prazen niz ali niz samih belih znakov vrne `false`.
   - Vhod pred preverjanjem normalizira, zato sprejme tudi veljavne
     IBAN-e z malimi črkami in presledki.
   - IBAN se mora začeti z dvema črkama podprte države, ki jima
     sledita dve kontrolni števki.
   - Po normalizaciji sme vsebovati samo znake A–Z in 0–9.
   - Nepodprte oznake držav zavrne.
   - Dolžina mora natančno ustrezati državi; za Slovenijo je 19,
     Nemčijo 22 in Veliko Britanijo 22 znakov.
   - Prekratek ali predolg IBAN zavrne.
   - Neveljavni vhodi morajo vrniti `false`, ne sprožiti izjeme.

3. **Preverjanje kontrolne vsote (`isValid`):**
   - Prve štiri znake normaliziranega IBAN-a prestavi na konec.
   - Črke pretvori v številčne vrednosti A = 10, B = 11, …, Z = 35.
   - IBAN sprejme le, če je ostanek dobljenega števila pri deljenju
     z 97 enak 1 in so izpolnjene tudi zahteve glede oblike in dolžine.
   - `DE89370400440532013000` in `GB29NWBK60161331926819` sta
     primera veljavnih vhodov.
   - `DE89370400440532013001` mora zavrniti zaradi napačne
     kontrolne vsote.

### 2. Generiranje testov, vnos napak in analiza pomanjkljivih testov

**Izhodišče in pravila načrtovanja:**

Testiranje smo zasnovali na specifikaciji zahtev (črna škatla), ne na prilagajanju pričakovanj trenutni implementaciji. Upoštevali smo napotke s prosojnic *10_ZK_Testiranje Objava 1*, predvsem strani 21–22 (vnaprej določeni pravilni rezultati, napačni vhodi in zapisnik), 25 (dopustni, nedopustni in mejni vhodi) ter 32 (lastnosti dobrega testa enote). Odkrita odstopanja dokumentiramo; izvorne kode zaradi uspeha testov ne popravljamo.

**Ukaz agentu UI:**

> Na podlagi specifikacije dopolni `IbanValidatorTest` z JUnit 5. Za sorodne primere uporabi parametrizirane teste. Pokrij običajne primere, robne dolžine, neveljavne vhode in zahtevo, da neveljavni vhodi ne sprožijo izjem. Uporabi poimenovanje `metoda_koJePogoj_najPricakovanRezultat`. Vsak test naj preverja eno jasno vedenje in ima razvidno pripravo vhoda, izvedbo ter preverjanje rezultata. Pričakovane rezultate določi vnaprej iz SZ; ne izračunavaj jih s testirano metodo in ne podvajaj algoritma MOD-97. Ne uporabljaj mockov, ker razred nima zunanjih odvisnosti. Testi naj bodo izolirani, deterministični in samodejni. Preglej obstoječe teste ter poročaj o rezultatih. Nato ločeno začasno vnesi dve napaki, po vsaki poženi teste in zapiši rezultate. Obe napaki odstrani in ponovi teste.

**Analiza pomanjkljivih testov in popravki:**

Obstoječih **15 testnih primerov** je ob začetnem zagonu uspelo. Vsebovali so konkretna preverjanja, vendar niso pokrivali celotne SZ:

- **Normalizacija:** Manjkali so tabulatorji, prelomi vrstic, sami beli znaki in ohranjanje drugih znakov. Dodali smo primere z vnaprej določenimi pričakovanimi nizi.
- **Lokalizacija:** Dodali smo primer s turško privzeto lokalizacijo. Prvotna nastavitev se obnovi v bloku `finally`, test pa uporablja `@ResourceLock` za usklajevanje dostopa do nastavitve.
- **Mejne dolžine:** Dodali smo za en znak prekratke in predolge IBAN-e za SI, DE in GB ter veljavne primere pravilnih dolžin.
- **Neveljavni vhodi:** Razširili smo preverjanje oznak držav, nedovoljenih znakov in napačnih kontrolnih vsot.
- **Kontrolni števki:** Dodali smo dva fiksna vhoda s črko na tretjem oziroma četrtem mestu, ki sicer prestaneta MOD-97. Tako zavrnitve ne povzroči že napačna kontrolna vsota.
- **Preglednost:** Sorodne scenarije smo združili v parametrizirane teste. Pri klicih so rezultat in preverjanja zapisani izrecno z lokalno spremenljivko `actual`; pri primerjavah nizov je pričakovana vrednost podana vnaprej. Odstranili smo pomožno metodo, ki je skrivala klic in preverjanje neveljavnih vhodov.

Testi ne dostopajo do zasebnih članov, ne zaganjajo Spring konteksta in ne uporabljajo baze, omrežja ali datotek. Mocki niso potrebni. Vsak parametriziran primer preverja konkretni rezultat. Pri neveljavnih vhodih `assertDoesNotThrow` in `assertFalse` skupaj preverjata pogodbo zavrnitve brez izjeme. Anotacij `@BeforeEach` in `@AfterEach` ne dodajamo brez potrebe, ker validator nima stanja za inicializacijo oziroma čiščenje.

**Rezultati na nespremenjeni izvorni kodi:**

Izvedenih je bilo **45 testnih primerov: 43 uspešnih in 2 neuspešna**, brez napak izvajanja in preskočenih primerov. Oba neuspešna primera pripadata testu `isValid_koKontrolniMestiVsebujetaCrko_najVrneFalseBrezIzjeme`:

| Vhod | Vnaprej pričakovani rezultat po SZ | Dejanski rezultat |
|---|---|---|
| `DEA9370400440532013051` | `false` | `true` |
| `DE8A370400440532013089` | `false` | `true` |

Vhoda imata ustrezno dolžino in prestaneta MOD-97, vendar vsebujeta črko na kontrolnem mestu. Implementacija ne preverja izrecno, ali sta tretji in četrti znak števki. Testa ostajata neuspešna, saj pravilno zaznata odstopanje od SZ. Pričakovanj ne prilagajamo implementaciji in izvorne kode ne popravljamo zaradi uspeha testov.

Agent je v predhodnem koraku neupravičeno dodal preverjanje kontrolnih števk v produkcijsko kodo. Ta popravek je bil odstranjen in `IbanValidator.java` je obnovljen v prvotno stanje. Predhodni uspešni zagon 45/45 zato ni rezultat testiranja končne, nespremenjene implementacije.

**Stanje namernega vnosa napak:**

V predhodnem poskusu sta bili ločeno preizkušeni odstranitev `.toUpperCase(Locale.ROOT)` in sprememba pogoja MOD-97 iz `== 1` v `== 0`. Vsaka je povzročila 7 neuspešnih primerov, vendar sta bila poskusa opravljena na začasno popravljeni osnovi. Dnevnika `iban-napaka-1.log` in `iban-napaka-2.log` sta zgodovinska izpisa tega poskusa in ne predstavljata rezultatov na prvotni osnovi. Za dokazovanje dveh namernih napak na prvotni osnovi je treba ta korak ponoviti kot ločen eksperiment. V trenutni izvorni kodi ni nobene od teh sprememb.

**Zapisnik testiranja:**

Kontekst: lokalni zagon na macOS, Java 25.0.2, Maven 3.9.14 in JUnit 5. Ukaz iz korena projekta: `mvn -f backend/pom.xml -Dtest=IbanValidatorTest test`. Število 45 pomeni izvedene primere, vključno s posameznimi vhodi parametriziranih testov.

| Stanje enote | Pričakovano po SZ | Dobljeni rezultat | Sklep |
|---|---|---|---|
| Prvotna implementacija, dopolnjeni testi | Oba vhoda s črko na kontrolnem mestu sta zavrnjena | 43 uspešnih, 2 neuspešna | Odkrito odstopanje od SZ |
| Končno stanje po obnovitvi izvorne kode | Oba vhoda s črko na kontrolnem mestu sta zavrnjena | 43 uspešnih, 2 neuspešna | Odstopanje ostaja dokumentirano |

**Omejitev preverjanja celotnega projekta:**

Poskus zagona vseh testov z `mvn -f backend/pom.xml test` je izvedel 251 primerov z 0 neuspešnimi preverjanji in 147 napakami izvajanja. Testi drugih enot se niso mogli pravilno izvesti zaradi napake inicializacije Mockito `MockMaker` pri pripenjanju agenta v lokalnem okolju. Zato uspeha 45 primerov validatorja ne enačimo z uspehom celotnega projekta.

**CI in pokritost:**

Obstoječi korak `Run tests` v `.github/workflows/backend.yml` izvaja `mvn test` brez `continue-on-error`, zato se vanj samodejno vključuje tudi `IbanValidatorTest`, neuspešen test pa povzroči neuspeh koraka. V tem delu nismo izvedli oddaljenega zagona GitHub Actions. Poročilo o pokritosti še ni konfigurirano; pred oddajo ga je treba dodati med rezultate cevovoda. Število uspešnih testov ne predstavlja odstotka pokritosti.


![Rezultat zagona novih testov – 2 neuspešna testa](slike/failed_tests_ibanvalidator.png)

---

### 3. Uporaba orodij umetne inteligence (del za 2. enoto)

- **Uporabljeno orodje:** OpenAI Codex.
- **Namen uporabe:** Pomoč pri pripravi SZ, analizi obstoječih testov, generiranju in dopolnitvi testov z JUnit 5, prilagoditvi priporočilom profesorjevih prosojnic, analizi odkrite napake, poskusnem namernem vnosu dveh napak, izvedbi testov in pripravi zapisnika ter poročila.
- **Preverjanje kakovosti:** Pričakovanja so bila določena iz SZ pred zagonom. Pregledali smo konkretna preverjanja, robne in neveljavne vhode, neodvisnost testov ter odsotnost podvajanja algoritma v testih. Zaznavanje napak smo preverili z dvema dejanskima začasnima spremembama implementacije. Vse spremembe produkcijske kode so odstranjene. Končni zagon na prvotni implementaciji vsebuje dva neuspešna primera, ki dokumentirata odstopanje od SZ.

---

## Enota 3: `[Ime 3. enote]` 

### 1. Utemeljitev izbire in specifikacija delovanja
*(Tukaj vpišite utemeljitev izbire in specifikacijo delovanja 3. enote)*

### 2. Generiranje testov, vnos napak in analiza pomanjkljivih testov
*(Tukaj opišite ukaz agentu, vnesene napake, analizo pomanjkljivih testov ter njihove popravke)*

### 3. Uporaba orodij umetne inteligence (del za 3. enoto)
*(Tukaj navedite uporabljeni model UI in namen uporabe)*

