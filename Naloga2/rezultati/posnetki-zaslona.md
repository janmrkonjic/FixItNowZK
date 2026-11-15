# Posnetki zaslona za IbanValidator

## 1. Končni zagon na nespremenjeni implementaciji

Iz korena projekta zaženi:

```bash
mvn -f backend/pom.xml -Dtest=IbanValidatorTest test
```

Zajemi obe neuspešni preverjanji za `DEA9370400440532013051` in `DE8A370400440532013089`, razliko `expected: <false> but was: <true>`, povzetek `Tests run: 45, Failures: 2, Errors: 0, Skipped: 0` in `BUILD FAILURE`.

Shrani kot `Naloga2/slike/iban-koncni-zagon.png`. V poročilo dodaj:

```markdown
![Dva testa zaznata odstopanje prvotne implementacije od SZ](slike/iban-koncni-zagon.png)
```

## 2. Primer kakovostnega testa

V urejevalniku zajemi metodo `normalize_koSoPrisotneCrkeInBeliZnaki_najVrneNormaliziranNiz` skupaj z anotacijo in vhodi. Vidni naj bodo vnaprej določeni `expected`, klic metode z rezultatom `actual` in `assertEquals(expected, actual)`.

## 3. Nespremenjena izvorna koda

```bash
git diff -- backend/src/main/java/com/example/backend/common/IbanValidator.java
```

Prazen izpis potrdi, da datoteka nima sprememb glede na trenutni commit.

## Pretekli izpisi

Dnevnik `iban-po-popravku.log` in prejšnja poskusa `iban-napaka-1.log` ter `iban-napaka-2.log` so nastali na začasno popravljeni osnovi. Niso dokazila za končno nespremenjeno implementacijo. Ne uporabljaj jih kot dokaz uspeha trenutne kode ali kot poskusa vnosa napak na prvotni osnovi.
