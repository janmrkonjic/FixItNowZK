package com.example.backend.common;

import java.math.BigInteger;
import java.util.Locale;
import java.util.Map;

/**
 * IBAN validation: format check (per-country length) + mod-97 checksum.
 * <p>
 * The mod-97 algorithm catches single-digit and most transposition typos and
 * is the official ISO 13616 / ECBS check.
 */
public final class IbanValidator {

    private IbanValidator() {}

    // Required IBAN lengths per country code. Covers the EEA / SEPA zone and a
    // handful of common non-EEA countries we're likely to see. Extend as needed.
    private static final Map<String, Integer> LENGTHS = Map.ofEntries(
        Map.entry("AD", 24), Map.entry("AE", 23), Map.entry("AL", 28), Map.entry("AT", 20),
        Map.entry("AZ", 28), Map.entry("BA", 20), Map.entry("BE", 16), Map.entry("BG", 22),
        Map.entry("BH", 22), Map.entry("BR", 29), Map.entry("BY", 28), Map.entry("CH", 21),
        Map.entry("CR", 22), Map.entry("CY", 28), Map.entry("CZ", 24), Map.entry("DE", 22),
        Map.entry("DK", 18), Map.entry("DO", 28), Map.entry("EE", 20), Map.entry("EG", 29),
        Map.entry("ES", 24), Map.entry("FI", 18), Map.entry("FO", 18), Map.entry("FR", 27),
        Map.entry("GB", 22), Map.entry("GE", 22), Map.entry("GI", 23), Map.entry("GL", 18),
        Map.entry("GR", 27), Map.entry("GT", 28), Map.entry("HR", 21), Map.entry("HU", 28),
        Map.entry("IE", 22), Map.entry("IL", 23), Map.entry("IS", 26), Map.entry("IT", 27),
        Map.entry("JO", 30), Map.entry("KW", 30), Map.entry("KZ", 20), Map.entry("LB", 28),
        Map.entry("LI", 21), Map.entry("LT", 20), Map.entry("LU", 20), Map.entry("LV", 21),
        Map.entry("MC", 27), Map.entry("MD", 24), Map.entry("ME", 22), Map.entry("MK", 19),
        Map.entry("MR", 27), Map.entry("MT", 31), Map.entry("MU", 30), Map.entry("NL", 18),
        Map.entry("NO", 15), Map.entry("PK", 24), Map.entry("PL", 28), Map.entry("PS", 29),
        Map.entry("PT", 25), Map.entry("QA", 29), Map.entry("RO", 24), Map.entry("RS", 22),
        Map.entry("SA", 24), Map.entry("SE", 24), Map.entry("SI", 19), Map.entry("SK", 24),
        Map.entry("SM", 27), Map.entry("TN", 24), Map.entry("TR", 26), Map.entry("UA", 29),
        Map.entry("VG", 24), Map.entry("XK", 20)
    );

    /** Strip spaces, uppercase. Returns "" for null input. */
    public static String normalize(String raw) {
        if (raw == null) return "";
        return raw.replaceAll("\\s+", "").toUpperCase(Locale.ROOT);
    }

    /**
     * @return true if {@code iban} (after normalization) has the correct length
     *         for its country code, contains only A–Z / 0–9, and passes mod-97.
     */
    public static boolean isValid(String iban) {
        if (iban == null) return false;
        String s = normalize(iban);
        if (s.length() < 4) return false;
        if (!s.chars().allMatch(c -> (c >= '0' && c <= '9') || (c >= 'A' && c <= 'Z'))) {
            return false;
        }

        // Check digits must be ASCII digits, even when the checksum passes.
        if (s.charAt(2) < '0' || s.charAt(2) > '9'
                || s.charAt(3) < '0' || s.charAt(3) > '9') {
            return false;
        }

        String country = s.substring(0, 2);
        Integer expected = LENGTHS.get(country);
        if (expected == null || s.length() != expected) return false;

        // Move the leading 4 chars (CC + 2-digit check) to the end, then convert
        // letters A=10, B=11 … Z=35. The resulting integer must be ≡ 1 (mod 97).
        String rearranged = s.substring(4) + s.substring(0, 4);
        StringBuilder numeric = new StringBuilder(rearranged.length() * 2);
        for (int i = 0; i < rearranged.length(); i++) {
            char c = rearranged.charAt(i);
            if (c >= '0' && c <= '9') {
                numeric.append(c);
            } else {
                numeric.append(c - 'A' + 10);
            }
        }
        return new BigInteger(numeric.toString()).mod(BigInteger.valueOf(97)).intValue() == 1;
    }
}
