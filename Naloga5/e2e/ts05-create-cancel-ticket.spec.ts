import { test, expect } from "@playwright/test";
import {
  MockBackend,
  authenticateJanContext,
  disableServiceWorkersAndTileLoads,
} from "./fixtures/mockBackend";

const SAMPLE_PNG_BUFFER = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

test.describe("TS-05: Ustvarjanje novega zahtevka z validacijo polj, sliko, izbiro izvajalca ter preklic zahtevka", () => {
  test("preveri validacijo praznega obrazca, izpolni zahtevek s sliko, lokacijo, izvajalcem in terminom ter prekliče ustvarjeni zahtevek FIX-0088", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const backend = new MockBackend();
    await authenticateJanContext(context);
    await disableServiceWorkersAndTileLoads(context);
    await backend.attachToContext(context);

    const page = await context.newPage();

    // Korak 1: Odpri /tickets/new in preveri validacijo vseh obveznih polj ob prazni oddaji
    await page.goto("/tickets/new");
    await page.getByRole("button", { name: "Submit ticket" }).click();

    await expect(page.getByText("Title is required.")).toBeVisible();
    await expect(page.getByText("Please select a category.")).toBeVisible();
    await expect(page.getByText("Description is required.")).toBeVisible();
    await expect(page.getByText("Location is required.")).toBeVisible();
    await expect(
      page.getByText("Please select an urgency level.")
    ).toBeVisible();

    if (process.env.CAPTURE_SCREENSHOTS === "true") {
      await page.screenshot({
        path: "../Naloga5/slike/ts05-empty-validation.png",
      });
    }

    // Korak 2: Izpolni sekcijo 01 What's broken? (naziv, kategorija Electrical, opis, fotografija)
    await page
      .locator('input[placeholder*="Kitchen sink leaking"]')
      .fill("Menjava okvarjene varovalke v razdelilni omarici");
    await page.locator("select.fselect").first().selectOption("ELECTRICAL");
    await page
      .locator("textarea.textarea")
      .fill(
        "Glavna varovalka v kuhinjskem tokokrogu se ob vklopu pečice sproži, potrebna menjava in pregled napeljave."
      );

    await page.locator('input[type="file"]').setInputFiles({
      name: "okvara-varovalka.png",
      mimeType: "image/png",
      buffer: SAMPLE_PNG_BUFFER,
    });

    await expect(page.locator("img.new-ticket-photo")).toBeVisible();
    const summaryCard = page.locator(".summary-card");
    await expect(summaryCard).toContainText(
      "Menjava okvarjene varovalke v razdelilni omarici"
    );
    await expect(summaryCard).toContainText("Electrical");
    await expect(summaryCard).toContainText("1 selected");

    // Korak 3: Izpolni sekcijo 02 Where & how urgent? (AddressAutocomplete + 03 · High)
    const locationInput = page.locator('input[placeholder="Start typing…"]');
    await locationInput.fill("Koroška cesta 46, Maribor");
    await page
      .getByRole("button", {
        name: /Koroška cesta 46, 2000 Maribor, Slovenija/i,
      })
      .click();

    await expect(
      page.getByText("✓ Address pinned — navigation will be accurate.")
    ).toBeVisible();

    await page.getByRole("button", { name: /03 · High/i }).click();
    await expect(summaryCard).toContainText(
      "03 · High · Blocking work or comfort."
    );
    await expect(summaryCard).toContainText(
      "Koroška cesta 46, 2000 Maribor, Slovenija"
    );

    // Korak 4: V sekciji 03 izberi Specific provider -> Browse providers -> Luka Kovač (Select ->)
    await page.getByRole("button", { name: "Specific provider" }).click();
    await page.getByRole("button", { name: /Browse providers/i }).click();
    await expect(page).toHaveURL(/\/providers$/);

    const lukaCard = page
      .locator(".browse-provider-card")
      .filter({ hasText: "Luka Kovač" });
    await expect(lukaCard).toBeVisible();
    await lukaCard.getByRole("button", { name: /Select/i }).click();

    await expect(page).toHaveURL(/\/tickets\/new$/);
    await expect(page.getByText("Luka Kovač").first()).toBeVisible();
    await expect(page.getByText("✓ Selected")).toBeVisible();

    // Ponovno dodaj fotografijo po vrnitvi iz izbire izvajalca
    await page.locator('input[type="file"]').setInputFiles({
      name: "okvara-varovalka.png",
      mimeType: "image/png",
      buffer: SAMPLE_PNG_BUFFER,
    });
    await expect(summaryCard).toContainText("1 selected");

    // Korak 5: V komponenti Request a time izberi prost termin izvajalca in oddaj zahtevek
    const availSlot = page.locator(".avail-slot").first();
    await expect(availSlot).toBeVisible();
    await availSlot.click();
    await expect(page.locator(".avail-slot-active")).toBeVisible();

    if (process.env.CAPTURE_SCREENSHOTS === "true") {
      await page.screenshot({
        path: "../Naloga5/slike/ts05-filled-ticket-form.png",
      });
    }

    await page.getByRole("button", { name: "Submit ticket" }).click();
    await expect(
      page.getByText("Ticket successfully submitted! ✓")
    ).toBeVisible();

    // Korak 6: Odpri stran ustvarjenega zahtevka /tickets/88 (FIX-0088) in preveri vse podatke
    await page.goto("/tickets/88");
    await expect(page.getByText("FIX-0088").first()).toBeVisible();
    await expect(page.getByText("Awaiting provider").first()).toBeVisible();
    await expect(page.getByText("Luka Kovač").first()).toBeVisible();
    await expect(page.getByText("Jan Mrkonjič").first()).toBeVisible();
    await expect(page.getByText("Requested start")).toBeVisible();
    await expect(page.getByText("Requested end")).toBeVisible();
    await expect(page.getByText("1 attached")).toBeVisible();
    await expect(page.getByText("1 events")).toBeVisible();

    if (process.env.CAPTURE_SCREENSHOTS === "true") {
      await page.screenshot({
        path: "../Naloga5/slike/ts05-ticket-created.png",
      });
    }

    // Korak 7: Prekliči zahtevek (Cancel ticket -> Yes, cancel ticket) in preveri stanje CANCELLED
    await page.getByRole("button", { name: "Cancel ticket" }).click();
    await page.getByRole("button", { name: "Yes, cancel ticket" }).click();

    await expect(
      page.getByText("This ticket has been cancelled.")
    ).toBeVisible();
    await expect(
      page.getByText("Ticket cancelled", { exact: true }).first()
    ).toBeVisible();
    await expect(page.getByText("2 events")).toBeVisible();
    await expect(page.getByText("Ticket was cancelled.")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Cancel ticket" })
    ).toHaveCount(0);

    if (process.env.CAPTURE_SCREENSHOTS === "true") {
      await page.screenshot({
        path: "../Naloga5/slike/ts05-ticket-cancelled.png",
      });
    }

    await context.close();
  });
});
