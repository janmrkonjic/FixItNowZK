# Pregled testiranja in zagotavljanja kakovosti – FixItNow

Pregled je bil izveden 12. 10. 2026 na lokalni veji `dev`, pri reviziji `c9067f0`. Projekt vsebuje zaledje Java/Spring Boot in odjemalec React/TypeScript. Ugotovitve temeljijo na pregledu izvorne kode, konfiguracij ter lokalnem zagonu testov in statičnih preverjanj. Stanje zadnjih zagonov na GitHub Actions ni bilo preverjeno.

## Aktivnosti, ki so že prisotne

Večino testov sem napisal samostojno, pri delu testov pa sem si pomagal z umetno inteligenco. Podatki o uporabi UI pri posameznih skupinah testov so navedeni v tabeli. Pri dokumentiranju stanja je bil uporabljen tudi OpenAI Codex; rezultati so podprti z izpisi preverjanj in poročili Maven Surefire.

> **Pred oddajo dopolnim:** uporabljeno orodje za pisanje testov, njegovo vlogo, skupine testov, pri katerih sem ga uporabljal, in način preverjanja predlogov.

| Vrsta aktivnosti | Stanje | Pokriti del rešitve | Orodja in ogrodja | Uporaba umetne inteligence in preverjanje |
|---|---|---|---|---|
| Testi enot poslovne logike | Implementirani in uspešno izvedeni v tem pregledu | Ustvarjanje zahtevkov, prehodi statusov, iskanje izvajalcev, administracija, izbris računa in uporabniške ocene | JUnit 5, Mockito, Spring Boot Starter Test, Maven Surefire | Del testov je bil pripravljen s pomočjo UI, večino sem napisal sam. Za to skupino dopolnim: **[orodje oziroma brez UI; način uporabe; preverjanje predlogov]**. Rezultat zagona je potrjen s poročili Surefire. |
| Testi varnostne logike | Implementirani in uspešno izvedeni | Registracija in prijava, zavrnitev napačnih prijavnih podatkov, JWT, lastnosti uporabniškega računa in dvostopenjska avtentikacija | JUnit 5, Mockito, knjižnice JWT in TOTP | Del testov je bil pripravljen s pomočjo UI, večino sem napisal sam. Za to skupino dopolnim: **[orodje oziroma brez UI; način uporabe; preverjanje predlogov]**. Rezultat zagona je potrjen s poročili Surefire. |
| Testi klepeta in omejevanja sporočil | Implementirani in uspešno izvedeni | Shranjevanje, urejanje, brisanje ter statusi sporočil, pravice udeležencev, dolžina, podvajanje in omejevanje pogostosti sporočil | JUnit 5, Mockito | Del testov je bil pripravljen s pomočjo UI, večino sem napisal sam. Za to skupino dopolnim: **[orodje oziroma brez UI; način uporabe; preverjanje predlogov]**. Rezultat zagona je potrjen s poročili Surefire. |
| Testi pomožnih funkcij in e-pošte | Implementirani in uspešno izvedeni | Geografske razdalje, veljavnost in normalizacija IBAN, preslikava izjem v odgovore ter sestava potrditvenih sporočil in sporočil za ponastavitev gesla | JUnit 5, parametrizirani testi, Mockito | Del testov je bil pripravljen s pomočjo UI, večino sem napisal sam. Za to skupino dopolnim: **[orodje oziroma brez UI; način uporabe; preverjanje predlogov]**. Rezultat zagona je potrjen s poročili Surefire. |
| Testi kontrolerjev oziroma HTTP-vmesnika | Implementirani in uspešno izvedeni | Končne točke za zahtevke, avtentikacijo, administracijo, izvajalce, ocene, shranjene izvajalce in obvestila; preverjanje statusov HTTP in vsebine JSON | Spring MockMvc s standaloneSetup, Mockito, JUnit 5 | Del testov je bil pripravljen s pomočjo UI, večino sem napisal sam. Za to skupino dopolnim: **[orodje oziroma brez UI; način uporabe; preverjanje predlogov]**. Rezultat zagona je potrjen s poročili Surefire. |
| Statična analiza odjemalca | Nastavljena in izvedena; zaznanih 5 napak in 1 opozorilo | Izvorna koda odjemalca, pravila TypeScript in pravilna uporaba React Hooks | ESLint, typescript-eslint, eslint-plugin-react-hooks, eslint-plugin-react-refresh | Pri pregledu rezultatov je bil uporabljen OpenAI Codex; ugotovitve so podprte z izpisom npm run lint. Uporaba UI pri pripravi konfiguracije: **[dopolnim]**. |
| Statično preverjanje tipov | Nastavljeno kot del gradnje; lokalno preverjanje aplikacije je neuspešno | Koda React/TypeScript ter konfiguracija Vite | TypeScript; ukaz za gradnjo vsebuje tsc -b && vite build | Pri pregledu rezultatov je bil uporabljen OpenAI Codex; ugotovitve so podprte z diagnostiko TypeScript. Uporaba UI pri pripravi konfiguracije: **[dopolnim]**. |
| Avtomatizacija preverjanj in gradnje v CI/CD | Konfigurirana; uspešnost dejanskih oddaljenih zagonov ni preverjena; ugotovljene pomanjkljivosti | Zaledje: testi in gradnja JAR; odjemalec: predvideni testi in gradnja; nato objava | GitHub Actions, Maven, Node.js/npm, Heroku in Netlify | Pri pregledu konfiguracije je bil uporabljen OpenAI Codex; ugotovitve temeljijo na primerjavi workflowov in package.json oziroma pom.xml. Uporaba UI pri pripravi workflowov: **[dopolnim]**. |

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

## Ročno testiranje in pregledi kode

Za ročno testiranje še ni vključena evidenca izvedenih scenarijev. **[Dopolnim dejansko izvedene scenarije, datum, okolje, pričakovani rezultat in dejanski rezultat.]**

Zgodovina projekta vsebuje delo z vejami in združitve. Formalni pregledi kode v tem poročilu niso dokumentirani. **[Če so bili izvedeni, dopolnim način pregleda, pokrite dele in povezave do dokazov.]**

## Uporaba umetne inteligence

Večino testov sem napisal samostojno, pri delu testov pa sem uporabil umetno inteligenco. Pri pisanju testov sem uporabljal **[ime orodja]** za **[dejanski namen uporabe]**. Predloge sem preveril z **[dejanski način preverjanja]**. Uporaba pri posameznih aktivnostih je navedena v tabeli.

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
