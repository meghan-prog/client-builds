import { chromium } from "playwright-core";

async function main() {
  const url = process.argv[2] ?? "http://localhost:3000/week/2026-09-07";
  const out = process.argv[3] ?? "/tmp/screenshot.png";
  const width = Number(process.argv[4] ?? 1280);
  const height = Number(process.argv[5] ?? 900);

  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.screenshot({ path: out, fullPage: true });
  await browser.close();
  console.log("Saved to", out);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
