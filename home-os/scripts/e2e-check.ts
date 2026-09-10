import { chromium } from "playwright-core";

const BASE = "http://localhost:3000";
const EXE = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

async function main() {
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });

  console.log("1. Open week view...");
  await page.goto(`${BASE}/week/2026-09-07`, { waitUntil: "networkidle" });
  const conflictCountBefore = await page.locator("text=Accepteer voorstel").count();
  console.log(`   Conflicts visible: ${conflictCountBefore}`);

  if (conflictCountBefore > 0) {
    console.log("2. Click 'Accepteer voorstel' on first conflict...");
    await page.locator("text=Accepteer voorstel").first().click();
    await page.waitForLoadState("networkidle");
    const conflictCountAfter = await page.locator("text=Accepteer voorstel").count();
    console.log(`   Conflicts visible after accept: ${conflictCountAfter} (expected ${conflictCountBefore - 1})`);
  }

  console.log("3. Go to Wednesday, open the learning activity...");
  await page.goto(`${BASE}/week/2026-09-07/2026-09-09`, { waitUntil: "networkidle" });
  const activityLink = page.locator('a[href^="/activity/"]').first();
  const href = await activityLink.getAttribute("href");
  console.log(`   Activity link: ${href}`);
  await activityLink.click();
  await page.waitForLoadState("networkidle");
  const title = await page.locator("h1").first().textContent();
  console.log(`   Activity page title: ${title?.trim()}`);

  console.log("4. Mark activity as done...");
  await page.locator("text=Activiteit afgerond").click();
  await page.waitForLoadState("networkidle");
  const doneBadge = await page.locator("text=Afgerond").count();
  console.log(`   'Afgerond' badge present: ${doneBadge > 0}`);

  console.log("5. Check learning goal progress on /learning...");
  await page.goto(`${BASE}/learning`, { waitUntil: "networkidle" });
  const progressText = await page.locator("text=%").first().textContent();
  console.log(`   Progress shown: ${progressText}`);

  console.log("6. Toggle a household task on /tasks...");
  await page.goto(`${BASE}/tasks`, { waitUntil: "networkidle" });
  const firstTaskButton = page.locator("form button").first();
  await firstTaskButton.click();
  await page.waitForLoadState("networkidle");
  console.log("   Household task toggled (no crash).");

  console.log("7. Toggle a shopping item on /shopping...");
  await page.goto(`${BASE}/shopping`, { waitUntil: "networkidle" });
  const shoppingButtons = page.locator("form button");
  const countBefore = await shoppingButtons.count();
  if (countBefore > 0) {
    await shoppingButtons.first().click();
    await page.waitForLoadState("networkidle");
    console.log("   Shopping item toggled (no crash).");
  } else {
    console.log("   No pending shopping items to toggle.");
  }

  console.log("8. Submit Sunday intentions text on week page...");
  await page.goto(`${BASE}/week/2026-09-07`, { waitUntil: "networkidle" });
  await page.locator('textarea[name="rawText"]').fill(
    "Deze week moet ik dinsdag naar de tandarts. Woensdag wil ik met de kinderen naar het strand."
  );
  await page.locator("text=Verwerk in planning").click();
  await page.waitForLoadState("networkidle");
  const deviationCount = await page.locator("text=Deze week anders").count();
  console.log(`   'Deze week anders' section present after submit: ${deviationCount > 0}`);

  console.log("\nAll interactive checks completed.");
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
