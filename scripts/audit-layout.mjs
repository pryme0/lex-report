import { chromium } from "playwright";
import { mkdirSync } from "fs";

const BASE = "http://localhost:3000";
const OUT = "audit";

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "laptop", width: 1180, height: 800 },
  { name: "tablet", width: 820, height: 1100 },
  { name: "mobile", width: 390, height: 844 },
];

const ROUTES = [
  ["/", "landing"],
  ["/dashboard", "research"],
  ["/dashboard/reports", "reports"],
  ["/dashboard/citation-graph", "citation-graph"],
  ["/dashboard/draft-studio", "draft-studio"],
  ["/dashboard/library", "library"],
  ["/dashboard/digest", "digest"],
  ["/dashboard/legislation", "legislation"],
  ["/dashboard/practice", "practice"],
  ["/dashboard/dictionary", "dictionary"],
  ["/dashboard/profile", "profile"],
  ["/dashboard/admin/judgments", "admin-judgments"],
  ["/dashboard/admin/legislation", "admin-legislation"],
  ["/dashboard/admin/dictionary", "admin-dictionary"],
  ["/dashboard/admin/practice", "admin-practice"],
  ["/dashboard/admin/coverage", "admin-coverage"],
  ["/dashboard/cases/SC-1988", "judgment"],
  ["/dashboard/legislation/cama-2020", "statute"],
  ["/dashboard/practice/instruments/sc-rules-2024", "instrument"],
];

/** Runs in the page: finds layout defects that are visible but hard to eyeball. */
function collectDefects() {
  const out = [];
  const vw = document.documentElement.clientWidth;
  const seen = new Set();

  const describe = (el) => {
    const cls = typeof el.className === "string" ? el.className.split(/\s+/).slice(0, 3).join(".") : "";
    return `${el.tagName.toLowerCase()}${cls ? "." + cls : ""}`;
  };
  const push = (type, el, detail) => {
    const key = `${type}|${describe(el)}|${detail}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ type, el: describe(el), detail });
  };

  if (document.documentElement.scrollWidth > vw + 1) {
    out.push({
      type: "page-overflow",
      el: "html",
      detail: `scrollWidth ${document.documentElement.scrollWidth} > viewport ${vw}`,
    });
  }

  // Overflowing inside a horizontally scrollable box (a tab strip, a data table)
  // is intended, so only report elements that escape the page itself.
  const inScroller = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const o = getComputedStyle(p).overflowX;
      if (o === "auto" || o === "scroll" || o === "hidden") return true;
    }
    return false;
  };

  for (const el of document.querySelectorAll("body *")) {
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") continue;
    if (el.classList.contains("sr-only")) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;

    // Content spilling past the right edge of the viewport.
    if (r.right > vw + 2 && style.position !== "fixed" && !inScroller(el)) {
      push("overflows-viewport", el, `right ${Math.round(r.right)} > ${vw}`);
    }

    // A form control that has grown absurdly wide reads as a broken layout.
    if (/^(select|input)$/i.test(el.tagName) && r.width > 620) {
      push("control-too-wide", el, `${Math.round(r.width)}px`);
    }

    // Text clipped by a fixed height.
    if (el.scrollHeight > el.clientHeight + 4 && style.overflowY === "hidden" && el.clientHeight > 0) {
      push("clipped-vertically", el, `content ${el.scrollHeight} > box ${el.clientHeight}`);
    }

    // Interactive targets too small to hit reliably.
    const interactive = el.matches("button, a, [role='button'], select, input[type='checkbox']");
    if (interactive && r.height > 0 && r.height < 22 && r.width < 200) {
      push("tap-target-small", el, `${Math.round(r.width)}x${Math.round(r.height)}`);
    }
  }
  return out;
}

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext();
await context.addInitScript(() => sessionStorage.setItem("lr-auth", "1"));

const report = [];
for (const vp of VIEWPORTS) {
  const page = await context.newPage();
  await page.setViewportSize({ width: vp.width, height: vp.height });
  for (const [path, name] of ROUTES) {
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    const defects = await page.evaluate(collectDefects);
    await page.screenshot({ path: `${OUT}/${vp.name}-${name}.png`, fullPage: true });
    if (defects.length) report.push({ viewport: vp.name, path, defects });
  }
  await page.close();
}

await browser.close();

if (!report.length) {
  console.log("No layout defects detected.");
} else {
  for (const entry of report) {
    console.log(`\n${entry.viewport}  ${entry.path}`);
    const byType = {};
    for (const d of entry.defects) (byType[d.type] ??= []).push(d);
    for (const [type, items] of Object.entries(byType)) {
      console.log(`  ${type} (${items.length})`);
      for (const i of items.slice(0, 6)) console.log(`     ${i.el} — ${i.detail}`);
      if (items.length > 6) console.log(`     …${items.length - 6} more`);
    }
  }
}
