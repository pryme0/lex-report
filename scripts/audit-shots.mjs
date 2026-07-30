import { chromium } from "playwright";
import { mkdirSync } from "fs";

const BASE = "http://localhost:3000";
const OUT = "audit/shots";

// [path, name, optional action to run before the shot]
const TARGETS = [
  ["/dashboard", "research"],
  ["/dashboard/reports", "reports"],
  ["/dashboard/library", "library"],
  ["/dashboard/digest", "digest"],
  ["/dashboard/legislation", "legislation"],
  ["/dashboard/practice", "practice"],
  ["/dashboard/draft-studio", "draft-studio"],
  ["/dashboard/citation-graph", "citation-graph"],
  ["/dashboard/admin/judgments", "admin-judgments"],
  ["/dashboard/cases/SC-1988", "judgment"],
  ["/dashboard/legislation/cama-2020", "statute"],
  ["/dashboard/practice/instruments/sc-rules-2024", "instrument"],
  ["/", "landing"],
];

const width = Number(process.argv[2] ?? 1440);
const height = Number(process.argv[3] ?? 900);

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width, height } });
await context.addInitScript(() => sessionStorage.setItem("lr-auth", "1"));
const page = await context.newPage();

for (const [path, name] of TARGETS) {
  await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
  await page
    .waitForFunction(() => !/Loading|Loading…/.test(document.body.innerText.slice(0, 400)), null, {
      timeout: 15000,
    })
    .catch(() => {});
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/${width}-${name}.png` });
  console.log(`${OUT}/${width}-${name}.png`);
}

await browser.close();
