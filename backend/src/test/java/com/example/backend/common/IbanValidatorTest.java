package com.example.backend.common;

import java.util.Locale;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.ResourceLock;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

class IbanValidatorTest {

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" ", "\t\n\r "})
    void normalize_koJeVhodPrazen_najVrnePrazenNiz(String raw) {
        assertEquals("", IbanValidator.normalize(raw));
    }

    @ParameterizedTest
    @ValueSource(strings = {
        " gb29 nwbk 6016 1331 9268 19 ",
        "\tgb29\nnwbk\r6016\t1331 9268 19\n",
        "GB29NWBK60161331926819"
    })
    void normalize_koSoPrisotneCrkeInBeliZnaki_najVrneNormaliziranNiz(String raw) {
        assertEquals("GB29NWBK60161331926819", IbanValidator.normalize(raw));
    }

    @ParameterizedTest
    @CsvSource({"de89-3704!, DE89-3704!", "čž_/@, ČŽ_/@", "123, 123"})
    void normalize_koSoPrisotniDrugiZnaki_najJihOhrani(String raw, String expected) {
        assertEquals(expected, IbanValidator.normalize(raw));
    }

    @Test
    @ResourceLock("java.util.Locale.default")
    void normalize_koJePrivzetaLokalizacijaTurska_najUporabiNeodvisnoPretvorbo() {
        Locale previous = Locale.getDefault();
        try {
            Locale.setDefault(Locale.forLanguageTag("tr-TR"));
            assertEquals("SI56191000000123438", IbanValidator.normalize("si56 1910 0000 0123 438"));
        } finally {
            Locale.setDefault(previous);
        }
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "SI56191000000123438",
        "DE89370400440532013000",
        "GB29NWBK60161331926819",
        "gb29nwbk60161331926819",
        " GB29 NWBK 6016 1331 9268 19 ",
        "\tgb29\nnwbk\r6016\t1331 9268 19\n"
    })
    void isValid_koJeIbanVeljaven_najVrneTrue(String iban) {
        assertTrue(assertDoesNotThrow(() -> IbanValidator.isValid(iban)));
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" ", "\t\n\r", "D", "DE", "DE8", "DE89"})
    void isValid_koJeVhodPrazenAliZeloKratek_najVrneFalseBrezIzjeme(String iban) {
        assertRejected(iban);
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "DE8937040044053201300", "DE893704004405320130000",
        "SI5619100000012343", "SI561910000001234380",
        "GB29NWBK6016133192681", "GB29NWBK601613319268190"
    })
    void isValid_koJeDolzinaZaEnZnakNapacna_najVrneFalseBrezIzjeme(String iban) {
        assertRejected(iban);
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "ZZ89370400440532013000", "1289370400440532013000", "D189370400440532013000"
    })
    void isValid_koOznakaDrzaveNiPodprta_najVrneFalseBrezIzjeme(String iban) {
        assertRejected(iban);
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "DE8937040044053201300!", "DE89-370400440532013000",
        "DE8937040044053201300č", "DE8937040044053201300１",
        "DE8937040044053201300/"
    })
    void isValid_koVsebujeNedovoljeneZnake_najVrneFalseBrezIzjeme(String iban) {
        assertRejected(iban);
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "DE89370400440532013001", "DE88370400440532013000",
        "GB29NWBK60161331926818", "SI56191000000123439"
    })
    void isValid_koJeKontrolnaVsotaNapacna_najVrneFalseBrezIzjeme(String iban) {
        assertRejected(iban);
    }

    @ParameterizedTest
    // Fixed fixtures have the DE length and MOD-97 remainder 1. A checksum-only
    // implementation would accept them, but each has a letter in a check-digit position.
    @ValueSource(strings = {"DEA9370400440532013051", "DE8A370400440532013089"})
    void isValid_koKontrolniMestiVsebujetaCrko_najVrneFalseBrezIzjeme(String iban) {
        assertRejected(iban);
    }

    private static void assertRejected(String iban) {
        assertFalse(assertDoesNotThrow(() -> IbanValidator.isValid(iban)),
            () -> "Neveljaven IBAN mora biti zavrnjen: " + iban);
    }
}
