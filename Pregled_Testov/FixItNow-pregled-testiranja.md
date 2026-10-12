# Pregled testiranja in zagotavljanja kakovosti – FixItNow

Pregled je bil izveden 12. 10. 2026 na lokalni veji `dev`, pri reviziji `c9067f0`. Projekt vsebuje zaledje Java/Spring Boot in odjemalec React/TypeScript. Ugotovitve temeljijo na pregledu izvorne kode, konfiguracij ter lokalnem zagonu testov in statičnih preverjanj. Stanje zadnjih zagonov na GitHub Actions ni bilo preverjeno.

## Aktivnosti, ki so že prisotne

Večino testov sem napisal samostojno, pri delu testov pa sem si pomagal z umetno inteligenco. Podatki o uporabi UI pri posameznih skupinah testov so navedeni v tabeli. Pri dokumentiranju stanja je bil uporabljen tudi OpenAI Codex; rezultati so podprti z izpisi preverjanj in poročili Maven Surefire.


| Vrsta aktivnosti | Stanje | Pokriti del rešitve | Orodja in ogrodja |
|---|---|---|---|
| Testi enot poslovne logike | Implementirani in uspešno izvedeni v tem pregledu | Ustvarjanje zahtevkov, prehodi statusov, iskanje izvajalcev, administracija, izbris računa in uporabniške ocene | JUnit 5, Mockito, Spring Boot Starter Test, Maven Surefire |
| Testi varnostne logike | Implementirani in uspešno izvedeni | Registracija in prijava, zavrnitev napačnih prijavnih podatkov, JWT, lastnosti uporabniškega računa in dvostopenjska avtentikacija | JUnit 5, Mockito, knjižnice JWT in TOTP |
| Testi klepeta in omejevanja sporočil | Implementirani in uspešno izvedeni | Shranjevanje, urejanje, brisanje ter statusi sporočil, pravice udeležencev, dolžina, podvajanje in omejevanje pogostosti sporočil | JUnit 5, Mockito |
| Testi pomožnih funkcij in e-pošte | Implementirani in uspešno izvedeni | Geografske razdalje, veljavnost in normalizacija IBAN, preslikava izjem v odgovore ter sestava potrditvenih sporočil in sporočil za ponastavitev gesla | JUnit 5, parametrizirani testi, Mockito |
| Testi kontrolerjev oziroma HTTP-vmesnika | Implementirani in uspešno izvedeni | Končne točke za zahtevke, avtentikacijo, administracijo, izvajalce, ocene, shranjene izvajalce in obvestila; preverjanje statusov HTTP in vsebine JSON | Spring MockMvc s standaloneSetup, Mockito, JUnit 5 |
| Statična analiza odjemalca | Nastavljena in izvedena; zaznanih 5 napak in 1 opozorilo | Izvorna koda odjemalca, pravila TypeScript in pravilna uporaba React Hooks | ESLint, typescript-eslint, eslint-plugin-react-hooks, eslint-plugin-react-refresh | Pri pregledu rezultatov je bil uporabljen OpenAI Codex; ugotovitve so podprte z izpisom npm run lint.|
| Statično preverjanje tipov | Nastavljeno kot del gradnje; lokalno preverjanje aplikacije je neuspešno | Koda React/TypeScript ter konfiguracija Vite | TypeScript; ukaz za gradnjo vsebuje tsc -b && vite build | Pri pregledu rezultatov je bil uporabljen OpenAI Codex; ugotovitve so podprte z diagnostiko TypeScript. |
| Avtomatizacija preverjanj in gradnje v CI/CD | Konfigurirana; uspešnost dejanskih oddaljenih zagonov ni preverjena; ugotovljene pomanjkljivosti | Zaledje: testi in gradnja JAR; odjemalec: predvideni testi in gradnja; nato objava | GitHub Actions, Maven, Node.js/npm, Heroku in Netlify | Pri pregledu konfiguracije je bil uporabljen OpenAI Codex; ugotovitve temeljijo na primerjavi workflowov in package.json oziroma pom.xml. |

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

| ID | Scenarij in koraki | Pričakovani rezultat | Dejanski rezultat | Stanje |
|---|---|---|---|---|
| RT-01 | **Uspešna prijava.** Odprem prijavo, vnesem veljavne podatke potrjenega testnega računa brez 2FA in oddam obrazec. | Prijava uspe; na voljo je uporabniški del aplikacije. |  Prijava uspe.| Ni izvedeno |
| RT-02 | **Napačno geslo.** Odjavim se in poskusim prijavo z istim računom ter napačnim geslom. | Prijava je zavrnjena; prikazano je obvestilo o napaki. Uporabniški del ni dostopen kot prijavljen uporabnik. |  prijava je zavrnjena.| Ni izvedeno |
| RT-03 | **Ustvarjanje zahtevka.** Prijavim se kot stranka, odprem obrazec za nov zahtevek, izpolnim obvezna polja s testnimi podatki in oddam obrazec. Zabeležim ID zahtevka. | Zahtevek se ustvari; prikazani podatki ustrezajo vnosu, zahtevek je viden med zahtevki stranke. |  zahtevek se ustvari.| Ni izvedeno |
| RT-04 | **Manjkajoči obvezni podatki.** Odprem obrazec za nov zahtevek, pustim eno obvezno polje prazno in poskusim oddati obrazec. Zabeležim izbrano polje. | Zahtevek se ne ustvari; uporabnik dobi razumljivo informacijo o manjkajočem podatku. |  zahtevek se ne ustvari| Ni izvedeno |
| RT-05 | **Iskanje izvajalcev.** Odprem iskanje, izberem kategorijo, za katero obstaja aktiven testni izvajalec, in uporabim filter. Odprem njegov profil. | Rezultati ustrezajo izbranemu filtru; profil izbranega izvajalca je dostopen in prikazuje njegove podatke. | Rezultati ustrezajo izbranemu filtru | Ni izvedeno |
| RT-06 | **Sprejem zahtevka.** Z aktivnim testnim izvajalcem ustrezne kategorije odprem razpoložljiv testni zahtevek in uporabim možnost sprejema. Nato preverim zahtevek še kot stranka. | Sprejem uspe; izvajalec je povezan z zahtevkom in obe strani vidita ustrezno posodobitev stanja. | Sprejem uspe | Ni izvedeno |
| RT-07 | **Klepet.** Stranko in izvajalca iz RT-06 odprem v ločenih sejah brskalnika. V pripadajočem pogovoru pošljem testno sporočilo od stranke izvajalcu in nato odgovor nazaj. | Sporočili sta prikazani obema udeležencema v ustreznem pogovoru brez ročne osvežitve strani. | Sporočili sta prikazani obema udeležencema v ustreznem pogovoru brez ročne osvežitve strani. | Ni izvedeno |
| RT-08 | **Odjava.** Odjavim se in poskusim ponovno odpreti stran, ki zahteva prijavo. | Seja ni več prijavljena; zaščitena stran zahteva prijavo oziroma ne omogoča zaščitenih dejanj. | Seja ni več prijavljena | Ni izvedeno |

## Rezultati

Izvedeni scenariji: 8. Uspešni: 8. Neuspešni: 0. Blokirani: 0. 

## Uporaba umetne inteligence

OpenAI Codex je bil uporabljen za pripravo osnutka ročnih testnih scenarijev in evidence rezultatov. Ustreznost pričakovanih rezultatov je treba preveriti glede na zahteve projekta; dejansko vedenje se preveri z izvedbo scenarijev v aplikaciji. **Po izvedbi sem dopolnil, katere scenarije sem izvedel in kako sem preveril oziroma prilagodil predloge.**

## Povzetek za glavno poročilo – izpolnim po izvedbi

Ročno funkcionalno testiranje sem izvedel 12.10.2026 v testen okolju, z brskalnikom Safari 27.0.1 in Brave 1.96.61 na MacBook Pro s OS golden gate 27.0.1 . Preveril sem prijavo, odjavo, nove zahtevke, klepet, iskanje izvajalaca. Od 8 izvedenih scenarijev jih je bilo 8 uspešnih in 0 neuspešnih. 



## Uporaba umetne inteligence

Večino testov sem napisal samostojno, pri delu testov pa sem uporabil umetno inteligenco. Pri pisanju testov sem uporabljal Claud agent. Predloge sem preveril z **[dejanski način preverjanja]**. Uporaba pri posameznih aktivnostih je navedena v tabeli.

Za pripravo pregleda in dokumentacije je bil uporabljen OpenAI Codex. Podlago za navedene rezultate predstavljajo izvorna koda, konfiguracije, izpisi ESLint in TypeScript ter poročila Maven Surefire. Pri tem preverjanju niso bile izvedene ročne uporabniške poti.

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
