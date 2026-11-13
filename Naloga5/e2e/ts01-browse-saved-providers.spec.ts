import { test, expect } from "@playwright/test";
import {
  MockBackend,
  authenticateContext,
  disableServiceWorkersAndTileLoads,
} from "./fixtures/mockBackend";

test.describe("TS-01: Večkriterijsko iskanje mojstrov, zemljevid in priljubljeni mojstri (Saved Providers)", () => {
  test("izvede celoten tok iskanja, filtriranja, razvrščanja, prikaza zemljevida ter shranjevanja in odstranjevanja mojstra", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const backend = new MockBackend();
    await authenticateContext(context, "CUSTOMER");
    await disableServiceWorkersAndTileLoads(context);
    await backend.attachToContext(context);

    const page = await context.newPage();

    // Korak 1: Odpri stran za brskanje mojstrov (/browse)
    await page.goto("/browse");
    await expect(
      page.getByRole("heading", { name: /Find someone who can show up today/i })
    ).toBeVisible();
    await expect(page.getByText("Matej Novak")).toBeVisible();
    await expect(page.getByText("Gregor Kovač")).toBeVisible();
    await expect(page.getByText("Marko Krajnc")).toBeVisible();

    // Korak 2: V stranski vrstici izberi kategorijo "Plumbing", Max € = 50, Min Experience = "5+ yr"
    const sidebar = page.locator("aside");
    await sidebar.getByText("Plumbing", { exact: true }).click();
    await sidebar.locator('input[placeholder="Max €"]').fill("50");
    await sidebar.getByRole("button", { name: "5+ yr" }).click();

    // Preveri, da sta prikazana samo Matej Novak (€45/hr, 8 let) in Gregor Kovač (€35/hr, 6 let),
    // medtem ko Bojan Horvat (€60/hr), Tomaž Zupan (2 leti) in Marko Krajnc (Electrical) niso prikazani
    await expect(page.getByText("Matej Novak")).toBeVisible();
    await expect(page.getByText("Gregor Kovač")).toBeVisible();
    await expect(page.getByText("Bojan Horvat")).toHaveCount(0);
    await expect(page.getByText("Tomaž Zupan")).toHaveCount(0);
    await expect(page.getByText("Marko Krajnc")).toHaveCount(0);

    // Korak 3: Spremeni vrstni red razvrščanja na "Lowest price" (price_asc)
    await page.getByRole("button", { name: /Best match/i }).click();
    await page.getByRole("button", { name: "Lowest price" }).click();

    // Preveri vrstni red kartic: Gregor Kovač (€35) mora biti pred Matejem Novakom (€45)
    const providerHeadings = page.locator("h3");
    await expect(providerHeadings.nth(0)).toContainText("Gregor Kovač");
    await expect(providerHeadings.nth(1)).toContainText("Matej Novak");

    // Korak 4: Preklopi prikaz zemljevida z gumbom "Show on map"
    await page.getByRole("button", { name: /Show on map/i }).click();
    await expect(page.locator(".leaflet-container")).toBeVisible();
    await expect(page.getByText(/2 providers shown/i)).toBeVisible();
    if (process.env.CAPTURE_SCREENSHOTS === "true") {
      await page.screenshot({ path: "../Naloga5/slike/ts01-browse-map.png" });
    }

    // Korak 5: V iskalno polje vpiši neobstoječi niz "xyznonexistent123" in nato klikni "Reset"
    const searchInput = page.locator('input[placeholder*="Search providers"]');
    await searchInput.fill("xyznonexistent123");
    await expect(
      page.getByText("No providers match your current filters.")
    ).toBeVisible();

    await sidebar.getByRole("button", { name: "Reset" }).click();
    await expect(page.getByText("Matej Novak")).toBeVisible();
    await expect(page.getByText("Marko Krajnc")).toBeVisible();

    // Korak 6: Klikni na kartico mojstra Matej Novak in ga shrani ("☆ Save" -> "★ Saved")
    await page.getByRole("link", { name: "View Matej Novak's profile" }).click();
    await expect(page).toHaveURL(/\/providers\/prov-matej-001$/);

    const saveBtn = page.getByRole("button", { name: /Save$/i });
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    const savedBtn = page.getByRole("button", { name: /Saved$/i });
    await expect(savedBtn).toBeVisible();
    await expect(savedBtn).toHaveAttribute("aria-pressed", "true");

    // Korak 7: Odpri profil naročnika (/profile), preklopi na zavihek "Saved providers" in osveži stran (F5)
    await page.goto("/profile");
    await page.getByRole("tab", { name: /Saved providers/i }).click();
    await expect(page.getByText("01 SAVED")).toBeVisible();
    await expect(page.getByText("Matej Novak")).toBeVisible();

    await page.reload();
    await page.getByRole("tab", { name: /Saved providers/i }).click();
    await expect(page.getByText("01 SAVED")).toBeVisible();
    await expect(page.getByText("Matej Novak")).toBeVisible();
    if (process.env.CAPTURE_SCREENSHOTS === "true") {
      await page.screenshot({ path: "../Naloga5/slike/ts01-saved-providers.png" });
    }

    // Korak 8: Odstrani mojstra iz priljubljenih in preveri prazen seznam
    await page.getByRole("button", { name: "Unsave provider" }).click();
    await expect(page.getByText("00 SAVED")).toBeVisible();
    await expect(
      page.getByText("You haven't saved any providers yet.")
    ).toBeVisible();

    await context.close();
  });
});
