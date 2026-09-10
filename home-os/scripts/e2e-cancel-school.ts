import { chromium } from "playwright-core";

const BASE = "http://localhost:3000";
const EXE = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

async function main() {
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });

  await page.goto(`${BASE}/week/2026-09-07`, { waitUntil: "networkidle" });
  await page.locator("text=School afgelast melden").click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: "/tmp/cancel-form.png" });

  await page.locator('input[type="date"]').fill("2026-09-11");
  await page.locator("text=Melden en planning aanpassen").click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
  await page.screenshot({ path: "/tmp/cancel-result.png", fullPage: true });

  console.log("URL after submit:", page.url());
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
