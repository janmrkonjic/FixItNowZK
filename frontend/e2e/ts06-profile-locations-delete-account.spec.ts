import { test, expect } from "@playwright/test";
import {
  MockBackend,
  authenticateJanContext,
  disableServiceWorkersAndTileLoads,
} from "./fixtures/mockBackend";

test.describe("TS-06: Upravljanje uporabniškega profila, dodajanje lokacij, sprememba gesla in mehki izbris računa", () => {
  test("pregleduje profil, doda privzeto lokacijo, posodobi osebne podatke in geslo ter preveri blokado in izvedbo mehkega izbrisa računa", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const backend = new MockBackend();
    await authenticateJanContext(context);
    await disableServiceWorkersAndTileLoads(context);
    await backend.attachToContext(context);

    const page = await context.newPage();

    // Korak 1: Odpri /profile in preveri razdelke v zavihku Overview
    await page.goto("/profile");
    await expect(
      page.getByRole("heading", { name: /Jan Mrkonjič/i })
    ).toBeVisible();
    await expect(page.getByText("jan.test@fixitnow.si").first()).toBeVisible();
    await expect(page.getByText("VERIFIED", { exact: true })).toBeVisible();
    await expect(page.getByText("Personal info")).toBeVisible();
    await expect(page.getByText("Recent tickets")).toBeVisible();
    await expect(page.getByText("Buildings & locations")).toBeVisible();
    await expect(
      page.getByText(
        "Add your default location to pre-fill it when filing tickets."
      )
    ).toBeVisible();

    // Korak 2: V razdelku 03 Buildings & locations dodaj privzeto lokacijo ("Slomškov trg 15, 2000 Maribor, Slovenija")
    await page
      .getByRole("button", { name: "+ Add location" })
      .first()
      .click();
    await expect(
      page.getByRole("heading", { name: "Add default location" })
    ).toBeVisible();

    const modalInput = page.locator('input[placeholder="Start typing…"]');
    await modalInput.fill("Slomškov trg 15");
    await page
      .getByRole("button", {
        name: /Slomškov trg 15, 2000 Maribor, Slovenija/i,
      })
      .click();
    await page.getByRole("button", { name: "Save location" }).click();

    await expect(
      page.getByText("Slomškov trg 15, 2000 Maribor, Slovenija")
    ).toBeVisible();
    await expect(page.getByText("Default location saved.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Remove" })).toBeVisible();

    if (process.env.CAPTURE_SCREENSHOTS === "true") {
      await page.screenshot({
        path: "../Naloga5/slike/ts06-profile-location-saved.png",
      });
    }

    // Korak 3: Odpri /profile/edit in posodobi osebne podatke (priimek in telefon)
    await page.getByRole("link", { name: "Edit profile" }).click();
    await expect(page).toHaveURL(/\/profile\/edit$/);

    await page.locator("#edit-last").fill("Mrkonjič - Posodobljeno");
    await page.locator("#edit-phone").fill("+386 41 999 000");
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page.getByText("Saved.", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Slomškov trg 15, 2000 Maribor, Slovenija")
    ).toBeVisible();

    // Korak 4: Preveri validacijo neujemajočih se gesel v razdelku Change password
    await page.locator("#cp-current").fill("VarnoGeslo2026!");
    await page.locator("#cp-new").fill("NovoGeslo2026#");
    await page.locator("#cp-confirm").fill("DrugacnoGeslo99!");
    await expect(page.locator(".pw-meter.s4")).toBeVisible();

    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page.getByText("Passwords do not match.")).toBeVisible();

    if (process.env.CAPTURE_SCREENSHOTS === "true") {
      await page.screenshot({
        path: "../Naloga5/slike/ts06-edit-profile-password-mismatch.png",
      });
    }

    // Korak 5: Popravi potrditev gesla v ujemajoče geslo in uspešno posodobi geslo
    await page.locator("#cp-confirm").fill("NovoGeslo2026#");
    await page.getByRole("button", { name: "Update password" }).click();

    await expect(
      page.getByText("Password updated.", { exact: true })
    ).toBeVisible();
    await expect(page.locator("#cp-current")).toHaveValue("");
    await expect(page.locator("#cp-new")).toHaveValue("");
    await expect(page.locator("#cp-confirm")).toHaveValue("");

    // Korak 6: V razdelku Danger zone poskusi izbrisati račun ob aktivnem zahtevku (blokada 400 Bad Request)
    await page
      .getByRole("button", { name: "Delete Account" })
      .first()
      .click();
    await expect(
      page.getByRole("heading", { name: "Delete Account" })
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Delete Account" })
      .nth(1)
      .click();

    await expect(
      page.getByText(
        "You cannot delete your account while you have active tickets, disputes, or pending payments."
      )
    ).toBeVisible();

    if (process.env.CAPTURE_SCREENSHOTS === "true") {
      await page.screenshot({
        path: "../Naloga5/slike/ts06-delete-account-blocked.png",
      });
    }

    // Korak 7: Po zaključku vseh aktivnih zahtevkov potrdi mehki izbris računa in preveri odjavo ter preusmeritev
    backend.janHasActiveTickets = false;
    await page
      .getByRole("button", { name: "Delete Account" })
      .nth(1)
      .click();

    await expect(page).toHaveURL(/\/(login)?$/);
    await expect(
      page.getByRole("heading", { name: /Sign in to your account/i })
    ).toBeVisible();

    await context.close();
  });
});
