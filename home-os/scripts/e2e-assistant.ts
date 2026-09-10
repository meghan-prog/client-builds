import { chromium } from "playwright-core";

const BASE = "http://localhost:3000";
const EXE = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

async function main() {
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await browser.newPage({ viewport: { width: 900, height: 1000 } });

  await page.goto(`${BASE}/assistant`, { waitUntil: "networkidle" });
  await page.screenshot({ path: "/tmp/assistant-empty.png" });

  const input = page.locator('input[placeholder="Typ een bericht…"]');

  await input.fill("Focus deze week op tandenpoetsen");
  await input.press("Enter");
  await page.waitForTimeout(1200);
  await page.waitForLoadState("networkidle");

  await input.fill("Allebei");
  await input.press("Enter");
  await page.waitForTimeout(1200);
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "/tmp/assistant-proposal.png", fullPage: true });

  await page.locator("text=Toevoegen aan planning").click();
  await page.waitForTimeout(800);
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "/tmp/assistant-applied.png", fullPage: true });

  console.log("Done.");
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
