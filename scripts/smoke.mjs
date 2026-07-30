import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const OUT = process.argv[2] ?? "smoke";

const routes = [
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
];

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
// The dashboard is gated on the prototype's session flag; without it every route
// silently renders the login screen and the whole run would pass vacuously.
await context.addInitScript(() => sessionStorage.setItem("lr-auth", "1"));
const page = await context.newPage();

const problems = [];
page.on("console", (msg) => {
  if (msg.type() === "error") problems.push(`console: ${msg.text()}`);
});
page.on("pageerror", (err) => problems.push(`pageerror: ${err.message}`));
page.on("response", (res) => {
  if (res.status() >= 400) problems.push(`http ${res.status()}: ${res.url()}`);
});

async function visit(path, name, { expect404 = false } = {}) {
  problems.length = 0;
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  const text = await page.locator("body").innerText();
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });

  const notes = [];
  if (text.trim().length < 40) notes.push("blank page");
  if (path !== "/" && page.url().includes("/login")) notes.push("bounced to login");
  const relevant = expect404 ? problems.filter((p) => !/404/.test(p)) : problems;

  const ok = relevant.length === 0 && notes.length === 0;
  console.log(`${ok ? "OK  " : "FAIL"} ${path}${notes.length ? "  [" + notes.join(", ") + "]" : ""}`);
  for (const p of [...new Set(relevant)]) console.log(`       ${p}`);
  return ok;
}

let failures = 0;
for (const [path, name] of routes) {
  if (!(await visit(path, name))) failures++;
}

// Deep links that depend on real ids.
const caseId = await fetch("http://localhost:3001/api/cases/search?limit=1")
  .then((r) => r.json())
  .then((j) => j.data[0].id);
const statute = await fetch("http://localhost:3001/api/legislation")
  .then((r) => r.json())
  .then((j) => j[0]);
const instrument = await fetch("http://localhost:3001/api/practice/instruments")
  .then((r) => r.json())
  .then((j) => j[0].id);
const section = await fetch(`http://localhost:3001/api/legislation/${statute.id}`)
  .then((r) => r.json())
  .then((j) => j.sections[0]);

const deep = [
  [`/dashboard/cases/${caseId}`, "case-permalink"],
  [`/dashboard/legislation/${statute.id}`, "statute-detail"],
  [`/dashboard/legislation/${statute.id}/sections/${section.id}`, "statute-section-by-id"],
  [`/dashboard/legislation/${statute.id}/sections/${section.number}`, "statute-section-by-number"],
  [`/dashboard/practice/instruments/${instrument}`, "instrument-detail"],
  ["/dashboard/cases/does-not-exist", "case-404"],
];

for (const [path, name] of deep) {
  if (!(await visit(path, name, { expect404: name.endsWith("404") }))) failures++;
}

await browser.close();
console.log(failures === 0 ? "\nAll routes rendered." : `\n${failures} route(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
