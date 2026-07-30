import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript(() => sessionStorage.setItem("lr-auth", "1"));
const page = await context.newPage();

const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

let failed = 0;
function check(label, ok, detail = "") {
  console.log(`${ok ? "OK  " : "FAIL"} ${label}${detail ? "  — " + detail : ""}`);
  if (!ok) failed++;
}

// ── Search: query, snippet highlighting, URL state ────────────────────────────
await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
await page.fill(".search-input", "natural justice");
await page.keyboard.press("Enter");
await page.waitForTimeout(1500);
check("search returns results", (await page.locator(".case-entry").count()) > 0);
check("search highlights matched terms", (await page.locator(".case-snippet strong").count()) > 0);
check("search state is in the URL", page.url().includes("q=natural"), page.url());

await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1200);
check("search survives a reload", (await page.inputValue(".search-input")) === "natural justice");

// ── Command palette ───────────────────────────────────────────────────────────
await page.keyboard.press("Control+k");
await page.waitForTimeout(500);
const paletteInput = page.locator("input[class*='palette']").first();
check("palette opens on Ctrl+K", await paletteInput.isVisible().catch(() => false));
await paletteInput.fill("jurisdiction");
await page.waitForTimeout(1500);
const hitCount = await page.locator("[class*='palette'] button").count();
check("palette shows results", hitCount > 0, `${hitCount} hits`);
const urlBefore = page.url();
await page.keyboard.press("ArrowDown");
await page.keyboard.press("Enter");
await page.waitForTimeout(1500);
// A hit either routes somewhere new or opens the judgment overlay in place.
const routed = page.url() !== urlBefore;
const overlay = (await page.locator(".judgment-title, .judgment-header").count()) > 0;
const paletteClosed = !(await paletteInput.isVisible().catch(() => false));
check("palette result opens its target", routed || overlay, page.url());
check("palette closes after selection", paletteClosed);
await page.screenshot({ path: "smoke/palette-navigated.png" });

// ── Save-to-folder menu opens and dismisses on Escape ─────────────────────────
await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.getByRole("button", { name: "Save to folder" }).first().click();
await page.waitForTimeout(700);
check("save-to-folder menu opens", await page.locator(".save-to-folder-menu").first().isVisible());
await page.keyboard.press("Escape");
await page.waitForTimeout(400);
check("save menu dismisses on Escape", (await page.locator(".save-to-folder-menu").count()) === 0);

// ── Citation graph keyboard access ────────────────────────────────────────────
await page.goto(`${BASE}/dashboard/citation-graph`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const focusable = await page.locator("svg button, svg [tabindex='0']").count();
check("graph nodes are keyboard reachable", focusable > 0, `${focusable} focusable nodes`);
const alt = await page.locator(".sr-only, [class*='graph-alt']").count();
check("graph has a text alternative", alt > 0);

// ── Legislation: repeal status and amendment history ──────────────────────────
await page.goto(`${BASE}/dashboard/legislation`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const body = await page.locator("body").innerText();
check("legislation shows in-force status", /in force|repealed/i.test(body));

check("no uncaught script errors", errors.length === 0, errors.join(" | "));

await browser.close();
console.log(failed === 0 ? "\nAll interactions passed." : `\n${failed} interaction(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
