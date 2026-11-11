/**
 * Captures README screenshots from a running demo instance using the locally installed Chrome.
 *   npm run build && npm run start:demo   (in one terminal)
 *   npm run screenshots                   (in another)
 * Env: BASE_URL (default http://localhost:3000), OUT_DIR (default docs), LOCALE (default en).
 */
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright-core";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const outDir = process.env.OUT_DIR ?? "docs";
const locale = process.env.LOCALE ?? "en";
const schemes = (process.env.SCHEMES ?? "light,dark").split(",");

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL ?? "chrome" });

for (const colorScheme of schemes) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, colorScheme });
  await context.addCookies([{ name: "locale", value: locale, url: base }]);
  const page = await context.newPage();
  const suffix = colorScheme === "light" ? "" : `-${colorScheme}`;

  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${outDir}/dashboard${suffix}.png`, fullPage: true });

  await page.goto(`${base}/outreach`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${outDir}/emails${suffix}.png` });

  // Use an interested lead, so the detail shows the full timeline and the reply.
  await page.goto(`${base}/outreach?status=INTERESTED`, { waitUntil: "networkidle" });
  const href = await page.locator("tbody a").first().getAttribute("href");
  await page.goto(`${base}${href}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${outDir}/detail${suffix}.png` });

  await context.close();
}

await browser.close();
console.log(`Screenshots saved to ${outDir}/`);
