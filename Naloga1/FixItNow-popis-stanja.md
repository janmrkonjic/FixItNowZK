# Naloga 1

## 1. Zagon aplikacije in odprava začetnih težav

Ko smo pognali zaledje aplikacije s komando: `mvn spring-boot:run` smo dobili naslednji error:

![image1.png](slike/image1.png)

To se je zgodilo, ker `pom.xml` datoteka vsebuje dvojno definicijo istega groupId-ja / vtičnika:

![image2.png](slike/image2.png)

Ko smo to popravili, se je zaledje uspešno zagnalo.

Ko smo pognali frontend `npm install` ukaz, smo dobili naslednji error (vendar to ni napaka z aplikacijsko kodo, temveč z Windows sistemom in pravicami, na katerem smo pognali ukaz; po dodelitvi ustreznih pravic je ukaz deloval normalno):

![image3.png](slike/image3.png)

Če poizkusimo zdaj uporabljati aplikacijo, vidimo, da dobivamo CORS težave, saj je še en problem s privzetim portom frontenda: v zaledju je nastavljen na 3000, medtem ko React/Vite privzeto začne na 5173. Ob uskladitvi tega spletna aplikacija zdaj deluje, le da je še brez podatkov.

Ena težava, ki smo jo opazili, ko baza še nima podatkov, je, da je ostal statičen tekst namesto dinamičnega:

![image5.png](slike/image5.png)

---

## 2. Standardi kodiranja v projektu FixItNow

V sklopu analize projekta smo preverili obstoj dokumentacije standardov, definirali standarde kodiranja, analizirali njihovo doslednost v kodi ter identificirali odstopanja in dobre prakse.

### 2.1 Pregled obstoječih standardov v projektu

Pred analizo smo preučili, ali so v repozitoriju standardi kodiranja že kje formalno dokumentirani:
- **Formalni dokument standardov:** V projektu **ni bilo enotnega, samostojnega dokumenta** (npr. `CODING_STANDARDS.md`), ki bi ekipi predpisoval celovite standarde kodiranja za zagotavljanje kakovosti.
- **Interna navodila (`CLAUDE.md` datoteke):** V datotekah `CLAUDE.md`, `backend/CLAUDE.md` in `frontend/CLAUDE.md` so bila zapisana ključna arhitekturna pravila, konvencije poimenovanja plasti (DTO, storitve, krmilniki, domena) ter varnostne zahteve.
- **Konfiguracija stila (`.editorconfig`):** V obeh delih projekta (`backend/.editorconfig` in `frontend/.editorconfig`) so določena pravila formatiranja: nabor znakov UTF-8, zaključki vrstic LF, odstranjevanje odvečnih presledkov, zamiki (4 presledki za Javo, 2 za TypeScript/JSON) ter omejitev dolžine vrstice na 120 znakov v zaledju.
- **Statična analiza na odjemalcu (`eslint.config.js`):** Za spletni del je konfiguriran ESLint s pravili za TypeScript, React Hooks in Vite.
- **Zaledje (Maven):** V `backend/pom.xml` **ni bilo vključenega orodja za statično analizo kode** (kot sta Checkstyle ali Spotless), kar pomeni, da se standardi stila na zaledju niso avtomatsko preverjali med prevajanjem.

---

### 2.2 Definicija standardov kodiranja za projekt FixItNow

Ker projekt ni imel samostojne formalne specifikacije, smo na podlagi uveljavljenih dobrih praks za uporabljeni tehnološki sklad (Java 21 / Spring Boot 3 ter React 19 / TypeScript) definirali naslednje standarde:

#### Konvencije poimenovanja (Naming Conventions)

| Element | Konvencija | Primer Backend | Primer Frontend |
| :--- | :--- | :--- | :--- |
| **Razredi / Komponente** | `PascalCase` samostalnik | `TicketController`, `ChatRateLimiter` | `TicketCard`, `LoginForm` |
| **Vmesniki (Interfaces)** | `PascalCase` brez predpone `I` | `TicketService`, `UserRepository` | `interface AuthState` |
| **Metode in funkcije** | `camelCase`, glagolski začetek | `createTicket()`, `findByEmail()` | `fetchTickets()`, `formatDate()` |
| **React Hooks** | `camelCase` s predpono `use` | / | `useTicketsQuery`, `useAuth` |
| **Spremenljivke in polja**| `camelCase` brez madžarske notacije | `customerEmail`, `ticketStatus` | `isPending`, `selectedDate` |
| **Konstante** | `SCREAMING_SNAKE_CASE` | `MAX_LENGTH`, `DEFAULT_PAGE_SIZE` | `API_BASE_URL` |
| **Enumi** | Tip `PascalCase`, vrednosti `SCREAMING_SNAKE_CASE` | `TicketStatus.IN_PROGRESS` | `UserRole.PROVIDER` |
| **Paketi in mape** | Male črke, brez podčrtajev | `com.example.backend.service` | `src/components/common` |
| **Datoteke** | Skladno z elementom, ki ga vsebujejo | `TicketServiceImpl.java` | Komponente: `PascalCase.tsx`, Pomožne: `camelCase.ts` |
| **REST poti** | `kebab-case` (pri večbesednih virih in akcijah), množinski samostalniki, verzije | `/api/v1/saved-providers`, `/api/v1/auth/confirm-email` | / |

#### Oblikovanje kode (Code Formatting & Nesting)
- **Zamiki (Indentation):** 4 presledki za Java kodo, 2 presledka za TypeScript/JSX in konfiguracije. Tabulatorji niso dovoljeni.
- **Dolžina vrstic (Line Length):** Največ 120 znakov. Daljše stavke, veriženje metod ali dolge JSX lastnosti je potrebno prelomiti v več vrstic.
- **Oklepaji (Braces):** K&R stil – odprti zaviti oklepaj `{` stoji v isti vrstici kot deklaracija ali pogoj.
- **Gnezdenje (Nesting Depth):** Izogibanje gnezdenju globlje od 3–4 nivojev. Zahteva se uporaba vzorca zgodnjega izhoda (*guard clauses* / *early return*), namesto globoko gnezdenih `if-else` stavkov.

#### Komentiranje in dokumentacija
- **Dokumentacijski komentarji:** Vsi javni API krmilniki, servisni vmesniki in kompleksnejša poslovna logika morajo imeti `JavaDoc` oziroma `TSDoc` komentarje z opisom namena, parametrov in izjem.
- **Namen komentarjev:** Komentarji morajo razlagati *razloge* in ozadje odločitev ("zakaj"), ne pa dobesednega prepisa delovanja kode ("kaj").
- **Čistoča repozitorija:** Zakomentirana "mrtva" koda ni dovoljena; za sledenje zgodovini se uporablja sistem Git.

#### Arhitekturna in strukturna pravila
- **Krmilniki (Controllers):** Sprejmejo zahtevo, validirajo vnos z `@Valid`, delegirajo klic točno eni servisni metodi ter vrnejo `ResponseEntity`. Poslovna logika in neposredni klici repozitorijev v krmilnikih niso dovoljeni.
- **DTO vzorec:** JPA entitete nikoli ne prečkajo meje krmilnika; uporabljajo se namenski DTO objekti (`*Request`, `*Response`).
- **Injekcija odvisnosti:** Zahtevana je konstruktorska injekcija (preko Lombok `@RequiredArgsConstructor`). Uporaba `@Autowired` na poljih razreda je prepovedana.
- **Tipizacija:** V TypeScriptu je prepovedana raba tipa `any`; vsi tipi morajo biti eksplicitno določeni.

---

### 2.3 Analiza upoštevanja standardov in ugotovljena odstopanja

Opravili smo statično analizo celotne kode (167 Java datotek z 10.933 vrsticami in 217 TypeScript/TSX datotek s 25.468 vrsticami).

#### 2.3.1 Kje smo se standardov dosledno držali:
1. **Doslednost poimenovanja:**
   - Vsi Java razredi (100 %) dosledno sledijo `PascalCase`.
   - Vse Java metode (100 %) in funkcije na frontendu dosledno sledijo `camelCase`.
   - Vse React komponente (razen ene izjeme spodaj) sledijo `PascalCase`.
   - Vsi React hooki imajo predpono `use` (npr. `useTicketsQuery`).
2. **Konstruktorska injekcija (Dependency Injection):**
   - V celotnem zaledju je **0 primerov** nevarne injekcije polj (`@Autowired`). Povsod je uporabljena konstruktorska injekcija s pomočjo `@RequiredArgsConstructor`.
3. **Stroga tipizacija v TypeScriptu:**
   - Vseh 25.468 vrstic TypeScript kode ima **0 primerov uporabe `any`**, kar dokazuje izredno visoko raven tipske varnosti in discipline pri razvoju odjemalca.
4. **Enosmerna večnivojska arhitektura:**
   - Krmilniki ne komunicirajo neposredno z bazo, entitete se ne izpostavljajo v REST odgovorih, temveč se preslikujejo preko namenskih DTO razredov.

#### 2.3.2 Ugotovljena odstopanja:
1. **Izjema pri poimenovanju datotek v frontendu:**
   - Komponenta `frontend/src/components/confirm-email-card.tsx` je poimenovana v `kebab-case`, medtem ko vse ostale komponente uporabljajo `PascalCase` (`ConfirmEmailCard.tsx`).
2. **Preseganje dolžine vrstice (več kot 120 znakov):**
   - V zaledju je **84 vrstic**, ki presegajo 120 znakov (predvsem kompleksnejše JPQL poizvedbe in dolge anotacije).
   - Na frontendu je **764 vrstic** daljših od 120 znakov – gre predvsem za dolge sezname Tailwind CSS razredov v JSX elementih, ki niso bili prelomljeni v več vrstic.
3. **Globoko gnezdenje stavkov:**
   - V zaledju je bilo identificiranih **362 blokov kode** z gnezdenjem na 5 ali več nivojih (zlasti pri kompleksnih preverjanjih urnikov v koledarju in lambdah).
4. **Nizka gostota dokumentacijskih komentarjev:**
   - Delež komentarjev v zaledju znaša **6,9 %** (179 JavaDoc blokov na 167 datotek), na frontendu pa zgolj **2,8 %**. Javni DTO-ji in številne servisne metode nimajo formalnih opisov parametrov.
5. **Paketno poimenovanje zaledja:**
   - Uporablja se privzeto ogrodno poimenovanje `com.example.backend` namesto domensko specifičnega paketa (npr. `si.um.feri.fixitnow`).
6. **Podvojene konfiguracijske datoteke:**
   - Na frontendu sočasno obstajata `eslint.config.js` in `eslint.config.ts`.
   - V `backend/pom.xml` je bil vtičnik `maven-compiler-plugin` deklariran dvakrat (kar je povzročilo začetno napako pri zagonu).
7. **Pomanjkljivosti v CI/CD cevovodu:**
   - V GitHub Actions delotokih (`backend.yml` in `frontend.yml`) se testi izvajajo z nastavitvijo `continue-on-error: true`, prav tako pa cevovoda ne vsebujeta koraka za avtomatizirano preverjanje stila kode (linter).
8. **Odstopanja pri REST končnih točkah (Path variables in verzije):**
   - Pri večbesednih segmentih se sicer uporablja `kebab-case` (npr. `/saved-providers`, `/confirm-email`), vendar pa spremenljivke poti (Path variables) uporabljajo `camelCase` znotraj parametrov: `{ticketId}`, `{chatRoomId}`, `{providerId}`, `{blockId}` namesto enotnega `{id}`.
   - Nekonsistentnost pri verziranju: krmilniki `AdminController`, `AuthController` in `UserController` uporabljajo predpono `/api/v1/...`, medtem ko `TicketController` (`/api/tickets`), `ChatController` (`/api/chat`) in `NotificationController` (`/api/notifications`) tečejo pod `/api/...` brez verzije.

---

### 2.4 Pregled dobrih inženirskih praks v projektu

Poleg upoštevanja standardov projekt izkazuje številne napredne inženirske prakse:

1. **Centralizirano obravnavanje napak (Global Exception Handling):**
   - Vpeljan je `GlobalExceptionHandler` (`@RestControllerAdvice`), ki prestreže napake in jih enotno strukturira v format `ErrorResponse` z ločenim zemljevidom napak po posameznih poljih (`fieldErrors`).
2. **Validacija podatkov na vstopu:**
   - Uporaba Jakarta Validation anotacij (`@NotNull`, `@NotBlank`, `@Size`, `@Email`) na vhodnih DTO-jih v kombinaciji z `@Valid` v krmilnikih. Na frontendu se za validacijo uporablja knjižnica Zod.
3. **Nadzorovano upravljanje baze podatkov z migracijami (Flyway):**
   - Vse spremembe baze tečejo preko verzijskih skript (`V1__...`). Hibernate ima nastavljeno `ddl-auto: validate`, kar preprečuje samodejno spreminjanje strukture podatkovne baze brez revizije.
4. **Varnostni mehanizmi:**
   - Varno zgoščevanje gesel z algoritmom BCrypt.
   - Brezstanjna avtentikacija z JWT in varnim mehanizmom rotacije osvežitvenih žetonov (Refresh Tokens).
   - Integrirana dvofaktorska avtentikacija (TOTP).
   - Skrivnosti (JWT ključi, gesla baze, API ključi) se prebirajo izključno iz okoljskih spremenljivk (`.env`) in niso del izvorne kode.
5. **Ločitev stanja in preslikava podatkov na odjemalcu:**
   - Uporaba TanStack Query za upravljanje strežniškega predpomnilnika.
   - Vzpostavljena jasna plast preslikovalnikov (`mappers/`), ki pretvarja omrežne DTO oblike v domenske modele aplikacije, s čimer je uporabniški vmesnik zaščiten pred neposrednimi spremembami API-ja.

---

### 2.5 Predlogi ukrepov za izboljšanje kakovosti (QA)

Za nadaljnje zagotavljanje kakovosti projekta predlagamo naslednje ukrepe:
1. **Avtomatizacija preverjanja stila v zaledju:** V `backend/pom.xml` vključiti `maven-checkstyle-plugin` ali `spotless-maven-plugin` z vnaprej definiranim pravilnikom Google Java Style.
2. **Vključitev statične analize v CI/CD:** V GitHub Actions dodati koraka `mvn checkstyle:check` in `npm run lint` ter odstraniti `continue-on-error: true` pri izvajanju testov.
3. **Čiščenje podvojitev:** Odstraniti odvečni `eslint.config.ts` (obdržati `eslint.config.js`) ter preimenovati `confirm-email-card.tsx` v `ConfirmEmailCard.tsx`.
4. **Povečanje testne pokritosti:** Glede na obseg 167 razredov v zaledju razširiti zbirko 22 obstoječih testnih razredov s testi enot in integracijskimi testi za ključne poslovne servise.


# Pregled testiranja in zagotavljanja kakovosti – FixItNow

Pregled je bil izveden 12. 10. 2026 na lokalni veji `dev`, pri reviziji `c9067f0`. Projekt vsebuje zaledje Java/Spring Boot in odjemalec React/TypeScript. Ugotovitve temeljijo na pregledu izvorne kode, konfiguracij ter lokalnem zagonu testov in statičnih preverjanj. Stanje zadnjih zagonov na GitHub Actions ni bilo preverjeno.

## Aktivnosti, ki so že prisotne

| Vrsta aktivnosti | Stanje | Pokriti del rešitve | Orodja in ogrodja |
|---|---|---|---|
| Testi enot poslovne logike | Implementirani in uspešno izvedeni v tem pregledu | Ustvarjanje zahtevkov, prehodi statusov, iskanje izvajalcev, administracija, izbris računa in uporabniške ocene | JUnit 5, Mockito, Spring Boot Starter Test, Maven Surefire |
| Testi varnostne logike | Implementirani in uspešno izvedeni | Registracija in prijava, zavrnitev napačnih prijavnih podatkov, JWT, lastnosti uporabniškega računa in dvostopenjska avtentikacija | JUnit 5, Mockito, knjižnice JWT in TOTP |
| Testi klepeta in omejevanja sporočil | Implementirani in uspešno izvedeni | Shranjevanje, urejanje, brisanje ter statusi sporočil, pravice udeležencev, dolžina, podvajanje in omejevanje pogostosti sporočil | JUnit 5, Mockito |
| Testi pomožnih funkcij in e-pošte | Implementirani in uspešno izvedeni | Geografske razdalje, veljavnost in normalizacija IBAN, preslikava izjem v odgovore ter sestava potrditvenih sporočil in sporočil za ponastavitev gesla | JUnit 5, parametrizirani testi, Mockito |
| Testi kontrolerjev oziroma HTTP-vmesnika | Implementirani in uspešno izvedeni | Končne točke za zahtevke, avtentikacijo, administracijo, izvajalce, ocene, shranjene izvajalce in obvestila; preverjanje statusov HTTP in vsebine JSON | Spring MockMvc s standaloneSetup, Mockito, JUnit 5 |
| Statična analiza odjemalca | Nastavljena in izvedena; zaznanih 5 napak in 1 opozorilo | Izvorna koda odjemalca, pravila TypeScript in pravilna uporaba React Hooks | ESLint, typescript-eslint, eslint-plugin-react-hooks, eslint-plugin-react-refresh |
| Statično preverjanje tipov | Nastavljeno kot del gradnje; lokalno preverjanje aplikacije je neuspešno | Koda React/TypeScript ter konfiguracija Vite | TypeScript; ukaz za gradnjo vsebuje tsc -b && vite build |
| Avtomatizacija preverjanj in gradnje v CI/CD | Konfigurirana; uspešnost dejanskih oddaljenih zagonov ni preverjena; ugotovljene pomanjkljivosti | Zaledje: testi in gradnja JAR; odjemalec: predvideni testi in gradnja; nato objava | GitHub Actions, Maven, Node.js/npm, Heroku in Netlify |

## Rezultati lokalnega preverjanja

- Zaledje: **185 izvedenih testnih primerov v 22 testnih razredih; 0 neuspešnih, 0 napak in 0 preskočenih**.
- Odjemalec, ESLint: **5 napak in 1 opozorilo**. Napake se nanašajo na pravilo `react-hooks/set-state-in-effect` v `LiveTrackingPanel.tsx`, `LocationModal.tsx`, `NewTicketsPage.tsx` in `TicketDetailPage.tsx`. Opozorilo se nanaša na manjkajočo odvisnost `t` pri `useMemo` v `ChatPage.tsx`.
- TypeScript, aplikacija: **1 napaka** v `src/components/provider-account/VisitorProfile.tsx`, vrstica 39: lastnost `phoneNumber` ni definirana v tipu `ProviderDto`.
- TypeScript, konfiguracija Vite: preverjanje je zaključeno brez diagnostičnih napak.
- Celotna produkcijska gradnja odjemalca ni bila izvedena. Zaznana napaka tipov preprečuje uspešen zaključek koraka TypeScript v nastavljenem ukazu za gradnjo.

Za zaledje je predvidena Java 21, lokalno pa je bila na voljo Java 25.0.2. Prvi zagon `mvn -o test` je izvedel 185 primerov, vendar je 116 primerov končalo z napako zaradi neuspešne inicializacije Mockito/Byte Buddy (samodejna priključitev agenta na JVM). Ponovni zagon z izrecno naloženim agentom je bil uspešen:

```sh
mvn -o test -DargLine="-javaagent:${HOME}/.m2/repository/net/bytebuddy/byte-buddy-agent/1.14.19/byte-buddy-agent-1.14.19.jar"
```

Ta pot do agenta velja za uporabljeno lokalno okolje. Za običajen zagon projekta z Javo 21 je predviden `mvn test`; uspešen zagon z Javo 21 v tem pregledu ni bil potrjen. Testiranje zaledja je potekalo v ločeni kopiji kode brez starih rezultatov iz mape `target` in brez datotek `.env`.

Odjemalec je bil preverjen z `npm run lint` in neposrednima ukazoma `tsc -p tsconfig.app.json` ter `tsc -p tsconfig.node.json`, z izrecno nastavljenima lokacijama za datoteki `tsBuildInfoFile` v delovni mapi pregleda. Lokalna različica Node.js je bila 25.9.0, CI pa določa Node.js 20. Razliko okolij je treba upoštevati pri ponavljanju preverjanj.

## Omejitve pokritosti in CI

Testi storitev večinoma uporabljajo Mockito za simulacijo odvisnosti. Testi kontrolerjev uporabljajo `MockMvcBuilders.standaloneSetup` s simuliranimi storitvami. Zato potrjujejo vedenje posameznih komponent in spletnega sloja, ne pa celotne povezave med odjemalcem, strežnikom in pravo podatkovno bazo ali dejanskimi zunanjimi storitvami.

V pregledani kodi in konfiguracijah niso bili najdeni avtomatizirani testi odjemalca, testi celotnih uporabniških poti (E2E), testi povezave s pravo podatkovno bazo ali nastavljeno merjenje pokritosti kode z JaCoCo. Število uspešnih testov ne določa odstotka pokritosti kode. Namenski avtomatizirani testi dejanskih integracij Stripe, Gemini, Cloudinary ter celotnega WebSocket in GPS toka v tem pregledu niso bili najdeni.

Oba workflowa GitHub Actions imata pri koraku testiranja `continue-on-error: true`, zato neuspešni testi ne preprečijo nadaljevanja do gradnje in morebitne objave. Zaledje se nato gradi z `mvn package -DskipTests`. Workflow odjemalca kliče `npm test -- --run`, vendar `frontend/package.json` nima skripte `test` in nima namenskega testnega ogrodja. Ta korak zato trenutno ne predstavlja delujočega preverjanja odjemalca. Ukaz `npm run lint` v pregledanem workflowu ni vključen. Workflowa se sprožita ob spremembah ustreznega dela na veji `main`; zaledje omogoča tudi ročni zagon. Preverjanje ob pull requestu ni nastavljeno.


# Ročno funkcionalno testiranje – FixItNow

Datum izvedbe: 12.10.2026 
Brskalnik in različica: Safari 27.0.1 in Brave 1.96.61
Naprava in operacijski sistem: MacBook Pro s OS golden gate 27.0.1 

Namen testiranja je preveriti osnovne uporabniške poti stranke in izvajalca ter odziv aplikacije na nepravilne vnose. Spodnji scenariji so pripravljeni za izvedbo; njihova izvedba in rezultati še niso potrjeni. Testiranje poteka s testnimi računi in izmišljenimi zahtevki v lokalnem ali testnem okolju.

## Testni scenariji

Pri vsakem scenariju zabeležim konkretni dejanski rezultat in izberem stanje: uspešno, neuspešno, blokirano ali ni izvedeno. Če je scenarij neuspešen, dodam korake za ponovitev in po možnosti posnetek zaslona ali povezavo do GitHub issue. V dokumentacijo ne vključim gesel, žetonov ali osebnih podatkov.

| ID | Scenarij in koraki | Pričakovani rezultat | Dejanski rezultat |
|---|---|---|---|
| RT-01 | **Uspešna prijava.** Odprem prijavo, vnesem veljavne podatke potrjenega testnega računa brez 2FA in oddam obrazec. | Prijava uspe; na voljo je uporabniški del aplikacije. |  Prijava uspe.|
| RT-02 | **Napačno geslo.** Odjavim se in poskusim prijavo z istim računom ter napačnim geslom. | Prijava je zavrnjena; prikazano je obvestilo o napaki. Uporabniški del ni dostopen kot prijavljen uporabnik. |  prijava je zavrnjena.|
| RT-03 | **Ustvarjanje zahtevka.** Prijavim se kot stranka, odprem obrazec za nov zahtevek, izpolnim obvezna polja s testnimi podatki in oddam obrazec. Zabeležim ID zahtevka. | Zahtevek se ustvari; prikazani podatki ustrezajo vnosu, zahtevek je viden med zahtevki stranke. |  zahtevek se ustvari.|
| RT-04 | **Manjkajoči obvezni podatki.** Odprem obrazec za nov zahtevek, pustim eno obvezno polje prazno in poskusim oddati obrazec. Zabeležim izbrano polje. | Zahtevek se ne ustvari; uporabnik dobi razumljivo informacijo o manjkajočem podatku. |  zahtevek se ne ustvari|
| RT-05 | **Iskanje izvajalcev.** Odprem iskanje, izberem kategorijo, za katero obstaja aktiven testni izvajalec, in uporabim filter. Odprem njegov profil. | Rezultati ustrezajo izbranemu filtru; profil izbranega izvajalca je dostopen in prikazuje njegove podatke. | Rezultati ustrezajo izbranemu filtru |
| RT-06 | **Sprejem zahtevka.** Z aktivnim testnim izvajalcem ustrezne kategorije odprem razpoložljiv testni zahtevek in uporabim možnost sprejema. Nato preverim zahtevek še kot stranka. | Sprejem uspe; izvajalec je povezan z zahtevkom in obe strani vidita ustrezno posodobitev stanja. | Sprejem uspe |
| RT-07 | **Klepet.** Stranko in izvajalca iz RT-06 odprem v ločenih sejah brskalnika. V pripadajočem pogovoru pošljem testno sporočilo od stranke izvajalcu in nato odgovor nazaj. | Sporočili sta prikazani obema udeležencema v ustreznem pogovoru brez ročne osvežitve strani. | Sporočili sta prikazani obema udeležencema v ustreznem pogovoru brez ročne osvežitve strani. |
| RT-08 | **Odjava.** Odjavim se in poskusim ponovno odpreti stran, ki zahteva prijavo. | Seja ni več prijavljena; zaščitena stran zahteva prijavo oziroma ne omogoča zaščitenih dejanj. | Seja ni več prijavljena |

## Rezultati

Izvedeni scenariji: 8. Uspešni: 8. Neuspešni: 0. Blokirani: 0. 

## Povzetek za glavno poročilo – izpolnim po izvedbi

Ročno funkcionalno testiranje sem izvedel 12.10.2026 v testen okolju, z brskalnikom Safari 27.0.1 in Brave 1.96.61 na MacBook Pro s OS golden gate 27.0.1 . Preveril sem prijavo, odjavo, nove zahtevke, klepet, iskanje izvajalaca. Od 8 izvedenih scenarijev jih je bilo 8 uspešnih in 0 neuspešnih. 



## Uporaba umetne inteligence

OpenAI Codex sem uporabil kot pomoč pri pripravi pregleda testiranja, dokumentacije in osnutka ročnih testnih scenarijev. Navedeni rezultati avtomatiziranih preverjanj temeljijo na izpisih ESLint in TypeScript ter poročilih Maven Surefire, ugotovitve o konfiguraciji pa na pregledu izvorne kode in konfiguracijskih datotek.

Ročne testne scenarije sem izvedel sam in v dokument vnesel dejanske rezultate. Umetna inteligenca mi je pri tem pomagala pri pripravi scenarijev in urejanju evidence rezultatov.

## Ocena trenutnega stanja in nadaljnji koraki

Projekt FixItNow že vsebuje avtomatizirane teste zaledja, teste HTTP-kontrolerjev, statično analizo odjemalca, preverjanje tipov in konfiguracijo CI/CD. V lokalnem pregledu je po prilagoditvi zagona Mockito lokalnemu okolju uspešno prestalo preverjanje vseh 185 testnih primerov zaledja. Preverjanji odjemalca sta zaznali napake, ki jih je treba odpraviti. Glavne vrzeli so odsotnost avtomatiziranih testov odjemalca in celotnih uporabniških poti, nepotrjena pokritost dejanskih integracij ter konfiguracija CI, ki dopušča nadaljevanje po neuspešnih testih. Prednostni nadaljnji koraki so odprava zaznanih napak odjemalca, ureditev testnega koraka odjemalca v CI, preprečitev objave ob neuspešnih testih in uvedba testov ključnih uporabniških poti.

## Evidenca testnih razredov

| Razred | Izvedeni primeri | Rezultat |
|---|---:|---|
| `ChatServiceTest` | 17 | Uspešno |
| `TicketControllerTest` | 5 | Uspešno |
| `TicketServiceTest` | 6 | Uspešno |
| `GeoUtilsTest` | 6 | Uspešno |
| `IbanValidatorTest` | 15 | Uspešno |
| `GlobalExceptionHandlerTest` | 9 | Uspešno |
| `JwtTokenProviderTest` | 4 | Uspešno |
| `UserPrincipalTest` | 13 | Uspešno |
| `AccountDeletionServiceTest` | 8 | Uspešno |
| `AdminServiceImplTest` | 19 | Uspešno |
| `ChatRateLimiterTest` | 12 | Uspešno |
| `ProviderSearchServiceImplTest` | 8 | Uspešno |
| `ReviewServiceImplTest` | 12 | Uspešno |
| `TwoFactorServiceImplTest` | 10 | Uspešno |
| `AuthServiceImplTest` | 7 | Uspešno |
| `EmailServiceImplTest` | 2 | Uspešno |
| `AdminControllerTest` | 10 | Uspešno |
| `AuthControllerTest` | 2 | Uspešno |
| `NotificationControllerTest` | 5 | Uspešno |
| `ProviderControllerTest` | 4 | Uspešno |
| `ReviewControllerTest` | 5 | Uspešno |
| `SavedProviderControllerTest` | 6 | Uspešno |

Vsota: 185 izvedenih primerov. Parametrizirani test IBAN prispeva dva primera.
