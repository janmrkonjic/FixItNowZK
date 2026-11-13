import { test, expect } from "@playwright/test";
import {
  MockBackend,
  authenticateContext,
  disableServiceWorkersAndTileLoads,
} from "./fixtures/mockBackend";

test.describe("TS-03: Klepet v realnem času (WebSocket/STOMP), urejanje sporočil in obvestila", () => {
  test("izvede dvosmerni klepet v živo, urejanje in brisanje sporočil ter upravljanje obvestil", async ({
    browser,
  }) => {
    const backend = new MockBackend();

    // Okno A (Customer) in Okno B (Provider)
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

    // Korak 1: V oknu B (Provider) odpri nadzorno ploščo, v oknu A (Customer) pa klepet (/chat) za FIX-0042
    await providerPage.goto("/dashboard/provider");
    await customerPage.goto("/chat?room=room-fix-0042");

    await expect(customerPage.getByText("LIVE", { exact: true })).toBeVisible();
    await expect(customerPage.getByText("FIX-0042").first()).toBeVisible();

    // Korak 2: V oknu A (Customer) pošlji sporočilo
    const customerComposer = customerPage.locator(".composer-wrap textarea");
    await customerComposer.fill("Pozdravljeni, ali lahko pridete danes ob 14:00?");
    await customerPage.getByRole("button", { name: "Send", exact: true }).click();

    await expect(
      customerPage.locator(".bubble").filter({
        hasText: "Pozdravljeni, ali lahko pridete danes ob 14:00?",
      })
    ).toBeVisible();

    // Korak 3: V oknu B (Provider) preveri značko neprebranih obvestil na zvončku in klikni obvestilo
    const bellButton = providerPage.locator('button[title="Notifications"]');
    await expect(bellButton).toContainText("1");
    await bellButton.click();

    const notifItem = providerPage
      .getByText("Pozdravljeni, ali lahko pridete danes ob 14:00?")
      .first();
    await expect(notifItem).toBeVisible();
    await notifItem.click();

    // Preusmeritev na /chat?room=room-fix-0042 v oknu B
    await expect(providerPage).toHaveURL(/\/chat\?room=room-fix-0042/);
    await expect(providerPage.getByText("LIVE", { exact: true })).toBeVisible();
    await expect(
      providerPage.locator(".bubble").filter({
        hasText: "Pozdravljeni, ali lahko pridete danes ob 14:00?",
      })
    ).toBeVisible();

    // Korak 4: V oknu B (Provider) odgovori naročniku in preveri takojšnji prikaz v oknu A
    const providerComposer = providerPage.locator(".composer-wrap textarea");
    await providerComposer.fill("Pozdravljeni, seveda, ob 14:00 bom pri vas.");
    await providerPage.getByRole("button", { name: "Send", exact: true }).click();

    await expect(
      customerPage.locator(".bubble").filter({
        hasText: "Pozdravljeni, seveda, ob 14:00 bom pri vas.",
      })
    ).toBeVisible();

    // Korak 5: V oknu A (Customer) uredi poslano sporočilo in preveri oznako "edited" v obeh oknih
    const customerMsgRow = customerPage
      .locator(".msg-row.mine")
      .filter({ hasText: "Pozdravljeni, ali lahko pridete danes ob 14:00?" });
    await customerMsgRow.getByRole("button", { name: "Edit" }).click();

    const editTextarea = customerPage.locator(".msg-row.mine textarea");
    await editTextarea.fill("Pozdravljeni, ali lahko pridete danes ob 14:30?");
    await customerPage.getByRole("button", { name: "Save" }).click();

    const editedCustomerRow = customerPage
      .locator(".msg-row.mine")
      .filter({ hasText: "Pozdravljeni, ali lahko pridete danes ob 14:30?" });
    await expect(editedCustomerRow).toBeVisible();
    await expect(editedCustomerRow.getByText(/edited/i)).toBeVisible();

    const editedProviderRow = providerPage
      .locator(".msg-row")
      .filter({ hasText: "Pozdravljeni, ali lahko pridete danes ob 14:30?" });
    await expect(editedProviderRow).toBeVisible();
    await expect(editedProviderRow.getByText(/edited/i)).toBeVisible();

    // Korak 6: V oknu A (Customer) pošlji začasno sporočilo in ga izbriši
    await customerComposer.fill("Pomota, zanemarite zadnje sporočilo.");
    await customerPage.getByRole("button", { name: "Send", exact: true }).click();

    const tempMsgRow = customerPage
      .locator(".msg-row.mine")
      .filter({ hasText: "Pomota, zanemarite zadnje sporočilo." });
    await expect(tempMsgRow).toBeVisible();
    await tempMsgRow.getByRole("button", { name: "Delete" }).click();

    await expect(
      customerPage.getByText("This message was deleted")
    ).toBeVisible();
    await expect(
      providerPage.getByText("This message was deleted")
    ).toBeVisible();
    if (process.env.CAPTURE_SCREENSHOTS === "true") {
      await customerPage.screenshot({ path: "../Naloga5/slike/ts03-realtime-chat.png" });
    }

    // Korak 7: V oknu A (Customer) odpri NotificationBell, klikni "Mark all read" in nato "Clear all"
    const customerBell = customerPage.locator('button[title="Notifications"]');
    await customerBell.click();

    const markAllReadBtn = customerPage.getByRole("button", {
      name: "Mark all read",
    });
    if (await markAllReadBtn.isVisible()) {
      await markAllReadBtn.click();
    }

    await customerPage.getByRole("button", { name: "Clear all" }).click();
    await expect(
      customerPage.getByText("You're all caught up.")
    ).toBeVisible();

    await customerContext.close();
    await providerContext.close();
  });
});
