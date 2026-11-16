import { test, expect } from "@playwright/test";
import {
  MockBackend,
  disableServiceWorkersAndTileLoads,
} from "./fixtures/mockBackend";

test.describe("TS-04: Registracija uporabnika/izvajalca, preverjanje moči gesla ter prijava z 2FA TOTP", () => {
  test("izvede izbiro vloge, validacijo gesla in pogojev uporabe, registracijo stranke in izvajalca ter prijavo z 2FA TOTP kodo", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    await context.addInitScript(() => {
      window.localStorage.setItem("i18nextLng", "en");
    });
    const backend = new MockBackend();
    await disableServiceWorkersAndTileLoads(context);
    await backend.attachToContext(context);

    const page = await context.newPage();

    // Korak 1: Odpri /register, preveri obe kartici vlog in izberi "01 I need things fixed"
    await page.goto("/register");
    await expect(
      page.getByRole("heading", { name: /How will you use FixItNow\?/i })
    ).toBeVisible();
    await expect(page.getByText("Recommended")).toBeVisible();
    await expect(page.getByText("I need things fixed")).toBeVisible();
    await expect(page.getByText("I'm a provider")).toBeVisible();

    await page.getByRole("link", { name: /I need things fixed/i }).click();
    await expect(page).toHaveURL(/\/register\/user$/);

    // Korak 2: Preveri validacijo prekratkega gesla ("abc12" -> pw-meter s1 + napaka)
    await page.locator("#reg-first").fill("Jan");
    await page.locator("#reg-last").fill("Mrkonjič");
    await page.locator("#reg-email").fill("jan.test@fixitnow.si");
    await page.locator("#reg-phone").fill("+386 41 555 123");
    await page.locator("#reg-password").fill("abc12");
    await page.locator('input[type="checkbox"]').check();

    await expect(page.locator(".pw-meter.s1")).toBeVisible();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(
      page.getByText("Password must be at least 8 characters.")
    ).toBeVisible();

    if (process.env.CAPTURE_SCREENSHOTS === "true") {
      await page.screenshot({
        path: "../Naloga5/slike/ts04-password-validation.png",
      });
    }

    // Korak 3: Popravi geslo v močno ("VarnoGeslo2026!" -> pw-meter s4), odkljukaj pogoje uporabe in preveri napako
    await page.locator("#reg-password").fill("VarnoGeslo2026!");
    await expect(page.locator(".pw-meter.s4")).toBeVisible();
    await page.locator('input[type="checkbox"]').uncheck();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(
      page.getByText("You must accept the Terms and Privacy Policy to continue.")
    ).toBeVisible();

    // Korak 4: Obkljukaj pogoje uporabe in uspešno ustvari račun stranke ("You're in!")
    await page.locator('input[type="checkbox"]').check();
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(
      page.getByRole("heading", { name: "You're in!" })
    ).toBeVisible();
    await expect(
      page.getByText("Your account is ready. Sign in to get started.")
    ).toBeVisible();
    await expect(page.getByText("jan.test@fixitnow.si")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Sign in now/i })
    ).toBeVisible();

    // Korak 5: Odpri /register/provider in preveri validacijo praznega obrazca
    await page.goto("/register/provider");
    await page.getByRole("button", { name: "Submit application" }).click();

    await expect(page.getByText("First name is required.")).toBeVisible();
    await expect(page.getByText("Street name is required.")).toBeVisible();
    await expect(page.getByText("Select at least one trade.")).toBeVisible();
    await expect(page.getByText("Select a service radius.")).toBeVisible();
    await expect(
      page.getByText("You must accept the Terms and Privacy Policy to continue.")
    ).toBeVisible();

    // Korak 6: Izpolni vseh 6 sekcij za registracijo izvajalca in oddaj vlogo
    await page.locator("#prov-first").fill("Jan");
    await page.locator("#prov-last").fill("Serviser");
    await page.locator("#prov-email").fill("jan.provider@fixitnow.si");
    await page.locator("#prov-password").fill("Mojster2026!");
    await page.locator("#prov-phone").fill("+386 31 888 999");

    await page.locator("#prov-street").fill("Smetanova ulica");
    await page.locator("#prov-streetno").fill("17");
    await page.locator("#prov-postal").fill("2000");
    await page.locator("#prov-city").fill("Maribor");
    await page.locator("#prov-country").fill("Slovenia");

    await page.getByRole("button", { name: "Electrical", exact: true }).click();
    await page.locator("#prov-years").fill("6");
    await page.locator("#prov-radius").selectOption("25");
    await page
      .locator("#prov-bio")
      .fill(
        "Pooblaščeni električar za hišne inštalacije, razdelilne omarice in meritve."
      );
    await page.locator('input[type="checkbox"]').check();

    await page.getByRole("button", { name: "Submit application" }).click();

    await expect(
      page.getByRole("heading", { name: "Application submitted!" })
    ).toBeVisible();
    await expect(
      page.getByText(/Your application is pending administrator approval/i)
    ).toBeVisible();

    if (process.env.CAPTURE_SCREENSHOTS === "true") {
      await page.screenshot({
        path: "../Naloga5/slike/ts04-provider-application-submitted.png",
      });
    }

    // Korak 7: Prijava stranke z vklopljenim 2FA (/login -> /two-factor)
    await page.goto("/login");
    await page.locator("#login-email").fill("jan.test@fixitnow.si");
    await page.locator("#login-password").fill("VarnoGeslo2026!");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await expect(page).toHaveURL(/\/two-factor$/);
    await expect(
      page.getByRole("heading", { name: "Verify your identity" })
    ).toBeVisible();
    await expect(page.locator("#verify-temp")).toHaveValue(
      "temp-2fa-token-jan-001"
    );

    // Korak 8: Preveri zavrnitev neveljavne 4-mestne kode ("1234") in uspešno potrditev 6-mestne TOTP kode ("482910")
    await page.locator("#verify-code").fill("1234");
    await page.getByRole("button", { name: "Verify 2FA" }).click();
    await expect(page.getByText("Enter the 6-digit code.")).toBeVisible();

    if (process.env.CAPTURE_SCREENSHOTS === "true") {
      await page.screenshot({
        path: "../Naloga5/slike/ts04-2fa-verify.png",
      });
    }

    await page.locator("#verify-code").fill("482910");
    await page.getByRole("button", { name: "Verify 2FA" }).click();

    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByRole("heading", { name: /Jan Mrkonjič/i })).toBeVisible();
    await expect(page.getByText("jan.test@fixitnow.si").first()).toBeVisible();

    await context.close();
  });
});
