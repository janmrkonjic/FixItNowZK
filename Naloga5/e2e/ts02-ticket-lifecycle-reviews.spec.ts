import { test, expect } from "@playwright/test";
import {
  MockBackend,
  authenticateContext,
  disableServiceWorkersAndTileLoads,
  suppressGeoPrompt,
} from "./fixtures/mockBackend";

test.describe("TS-02: Življenjski cikel naročila, izdaja računa, PDF prenos in oddaja ocene", () => {
  test("izvede celoten življenjski cikel zahtevka FIX-0042 med naročnikom in mojstrom ter upravljanje ocen", async ({
    browser,
  }) => {
    const backend = new MockBackend();

    // Okno A (Customer - Luka Grobelnik) in Okno B (Provider - Matej Novak)
    const customerContext = await browser.newContext();
    const providerContext = await browser.newContext();
    await authenticateContext(customerContext, "CUSTOMER");
    await authenticateContext(providerContext, "PROVIDER");
    await disableServiceWorkersAndTileLoads(customerContext);
    await disableServiceWorkersAndTileLoads(providerContext);
    await backend.attachToContext(customerContext);
    await backend.attachToContext(providerContext);

    const customerPage = await customerContext.newPage();
    const providerPage = await providerContext.newPage();
    await suppressGeoPrompt(customerPage);
    await suppressGeoPrompt(providerPage);

    // Korak 1: V oknu A (Customer) preveri, da oddaja ocene še ni mogoča pred zaključkom naročila
    await customerPage.goto("/providers/prov-matej-001");
    await expect(
      customerPage.getByText(
        "Reviews are open once a ticket between you two is marked Completed."
      )
    ).toBeVisible();
    await expect(
      customerPage.getByRole("button", { name: "Write a review" })
    ).toHaveCount(0);

    // Korak 2: V oknu B (Provider) odpri zahtevek FIX-0042 (/tickets/42) in ga sprejmi
    await providerPage.goto("/tickets/42");
    await expect(providerPage.getByText("FIX-0042")).toBeVisible();
    await providerPage
      .getByRole("button", { name: /Confirm & schedule|Accept Ticket/i })
      .click();
    await expect(providerPage.getByText("Accepted").first()).toBeVisible();

    // Korak 3: V oknu B (Provider) klikni "Mark as In Transit →" in preveri prikaz sledenja v živo
    await providerPage
      .getByRole("button", { name: /Mark as In Transit/i })
      .click();
    await expect(providerPage.getByText("On site").first()).toBeVisible();
    await expect(providerPage.getByText("Live tracking")).toBeVisible();

    // Korak 4: V oknu B (Provider) klikni "Mark as Work Complete →" in preveri obrazec za izdajo računa
    await providerPage
      .getByRole("button", { name: /Mark as Work Complete/i })
      .click();
    await expect(
      providerPage.getByText("Issue Invoice", { exact: true })
    ).toBeVisible();

    // Korak 5: V oknu B (Provider) preveri validacijo minimalnega zneska računa (0.50 € < 1.00 €)
    const invoiceInput = providerPage.locator('input[placeholder="1.00"]');
    await invoiceInput.fill("0.50");
    await providerPage.getByRole("button", { name: "Preview" }).click();
    await expect(
      providerPage.getByText("The minimum amount is €1.00.")
    ).toBeVisible();

    // Korak 6: V oknu B (Provider) vpiši veljaven znesek 65.00 in pošlji račun
    await invoiceInput.fill("65.00");
    await providerPage.getByRole("button", { name: /Send Invoice/i }).click();
    await expect(providerPage.getByText("€65.00").first()).toBeVisible();

    // Korak 7: V oknu A (Customer) odpri /tickets/42 in prenesi PDF račun
    await customerPage.goto("/tickets/42");
    await expect(customerPage.getByText("€65.00").first()).toBeVisible();
    if (process.env.CAPTURE_SCREENSHOTS === "true") {
      await customerPage.screenshot({ path: "../Naloga5/slike/ts02-invoice-issued.png" });
    }
    const downloadPromise = customerPage.waitForEvent("download");
    await customerPage
      .getByRole("button", { name: /Download Invoice PDF/i })
      .click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("Invoice-FIX-0042.pdf");

    // Korak 8: V oknu B (Provider) označi plačilo kot prejeto ("Mark Payment Received →")
    await providerPage
      .getByRole("button", { name: /Mark Payment Received/i })
      .click();
    await expect(providerPage.getByText("Completed").first()).toBeVisible();

    // Korak 9: V oknu A (Customer) odpri profil mojstra (/providers/prov-matej-001) in oddaj oceno 5 ★
    await customerPage.goto("/providers/prov-matej-001");
    const writeReviewBtn = customerPage.getByRole("button", {
      name: "Write a review",
    });
    await expect(writeReviewBtn).toBeVisible();
    await writeReviewBtn.click();

    await customerPage.getByRole("radio", { name: "5 stars" }).click();
    await customerPage
      .locator("#review-comment")
      .fill("Odlično in hitro popravilo puščajočega sifona, priporočam!");
    await customerPage.getByRole("button", { name: "Post review" }).click();

    await expect(
      customerPage.getByText(
        "Odlično in hitro popravilo puščajočega sifona, priporočam!"
      )
    ).toBeVisible();
    await expect(customerPage.getByText("You", { exact: true })).toBeVisible();
    if (process.env.CAPTURE_SCREENSHOTS === "true") {
      await customerPage.screenshot({ path: "../Naloga5/slike/ts02-review-posted.png" });
    }

    // Korak 10: V oknu A (Customer) uredi svojo oceno na 4 ★ in posodobi komentar
    await customerPage.getByRole("button", { name: "Edit", exact: true }).click();
    await customerPage.getByRole("radio", { name: "4 stars" }).click();
    await customerPage
      .locator("#review-comment")
      .fill(
        "Zelo dobro opravljeno delo, mojster je nekoliko zamudil, a vse uredil profesionalno."
      );
    await customerPage.getByRole("button", { name: "Update review" }).click();

    await expect(
      customerPage.getByText(
        "Zelo dobro opravljeno delo, mojster je nekoliko zamudil, a vse uredil profesionalno."
      )
    ).toBeVisible();

    // Korak 11: V oknu A (Customer) izbriši svojo oceno in potrdi v pogovornem oknu
    await customerPage.getByRole("button", { name: "Delete" }).click();
    await customerPage.getByRole("button", { name: "Delete review" }).click();

    await expect(
      customerPage.getByText(
        "Zelo dobro opravljeno delo, mojster je nekoliko zamudil, a vse uredil profesionalno."
      )
    ).toHaveCount(0);
    await expect(
      customerPage.getByRole("button", { name: "Write a review" })
    ).toBeVisible();

    await customerContext.close();
    await providerContext.close();
  });
});
