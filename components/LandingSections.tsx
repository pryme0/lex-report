"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Check,
  Download,
  FileText,
  FolderPlus,
  GraduationCap,
  Landmark,
  Network,
  Quote,
  Scale,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import type { Coverage } from "@/lib/api";

const SEARCH_EXAMPLES = [
  '"natural justice"',
  "ratio:floating charge",
  "court:SC treatment:followed",
];

export function LandingSearchPreview() {
  const [query, setQuery] = useState(SEARCH_EXAMPLES[0]);
  const [submitted, setSubmitted] = useState(SEARCH_EXAMPLES[0]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(query.trim() || SEARCH_EXAMPLES[0]);
  }

  return (
    <section className="lx-search-section" aria-labelledby="search-preview-title">
      <div className="lx-section-heading lx-section-heading-center">
        <p className="l-hero-eyebrow">Search the law, not a folder of PDFs</p>
        <h2 id="search-preview-title">Start with the question your matter needs answered.</h2>
        <p>Use ordinary language or precise legal fields. LexReport returns structured authorities, not isolated keyword hits.</p>
      </div>

      <div className="lx-search-demo">
        <form className="lx-search-form" onSubmit={submit}>
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Try a legal research query"
          />
          <button type="submit">Search archive <ArrowRight size={14} /></button>
        </form>
        <div className="lx-query-examples" aria-label="Example searches">
          <span>Try:</span>
          {SEARCH_EXAMPLES.map((example) => (
            <button key={example} type="button" onClick={() => { setQuery(example); setSubmitted(example); }}>
              {example}
            </button>
          ))}
        </div>

        <div className="lx-result-toolbar">
          <span><SlidersHorizontal size={14} /> Supreme Court · Ratio only · Verified</span>
          <strong>442 authorities</strong>
        </div>
        <div className="lx-result-grid">
          <article className="lx-result-card lx-result-card-primary">
            <div className="lx-result-kicker"><BadgeCheck size={13} /> Best verified match for <code>{submitted}</code></div>
            <h3>S. Anaja v. United Bank for Africa</h3>
            <p className="lx-result-cite">(2025) ELR-000214 (SC)</p>
            <p>Where a decision affecting civil rights is taken without giving the affected party an opportunity to be heard, the decision cannot stand.</p>
            <div className="lx-result-tags"><span>Ratio</span><span>Followed 22</span><span>98% strength</span></div>
          </article>
          <article className="lx-result-card">
            <div className="lx-result-kicker">Related authority</div>
            <h3>Garba v. University of Maiduguri</h3>
            <p className="lx-result-cite">(1986) 1 NWLR (Pt. 18) 550</p>
            <p>Disciplinary proceedings must preserve the constitutional right to fair hearing.</p>
            <div className="lx-result-tags"><span>Leading case</span><span>Considered 41</span></div>
          </article>
        </div>
      </div>
    </section>
  );
}

const REPORT_PARTS = [
  { key: "01", title: "Facts", text: "A concise record of the material facts and procedural history." },
  { key: "02", title: "Issues", text: "The legal questions framed in the form the court resolved them." },
  { key: "03", title: "Holding", text: "The court's answer to each issue, separated from commentary." },
  { key: "04", title: "Ratio", text: "The binding proposition extracted and editorially verified." },
  { key: "05", title: "Authorities", text: "Every relied-on authority linked to its own treatment history." },
];

function ReportAnatomy() {
  const [activePart, setActivePart] = useState("04");
  const active = REPORT_PARTS.find((part) => part.key === activePart) ?? REPORT_PARTS[3];

  return (
    <section className="lx-anatomy-section" id="platform" aria-labelledby="anatomy-title">
      <div className="lx-anatomy-wrap">
        <div className="lx-report-sheet" aria-label="Example structured law report">
          <div className="lx-report-masthead"><span>LexReport</span><span>Supreme Court · 2026</span></div>
          <p className="lx-report-series">(2026) ELR-000001 (SC)</p>
          <h3>Zenith Trustees Ltd v. Adebayo &amp; Sons Holdings</h3>
          <div className="lx-report-rule" />
          <div className="lx-report-section"><strong>Coram</strong><p>Okoro, Agim, Jauro, Abubakar and Idris JJSC</p></div>
          <div className="lx-report-section"><strong>Issue</strong><p>Whether a floating charge crystallised before the subsequent disposition of the charged assets.</p></div>
          <div className="lx-report-section lx-report-highlight"><strong>{active.title}</strong><p>{active.text}</p></div>
          <div className="lx-report-foot"><span>Editorially verified</span><span>Updated 10 Aug 2026</span></div>
        </div>

        <div className="lx-anatomy-copy">
          <div className="lx-section-heading">
            <p className="l-hero-eyebrow">Anatomy of a verified report</p>
            <h2 id="anatomy-title">A judgment organised for legal reasoning.</h2>
            <p>Every report separates what happened, what was argued and what the court actually decided.</p>
          </div>
          <div className="lx-anatomy-list">
            {REPORT_PARTS.map((part) => (
              <button
                key={part.key}
                type="button"
                className={activePart === part.key ? "active" : ""}
                onClick={() => setActivePart(part.key)}
              >
                <span>{part.key}</span>
                <span><strong>{part.title}</strong><small>{part.text}</small></span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TreatmentTimeline() {
  const events = [
    { year: "1986", treatment: "Origin", title: "Garba v. University of Maiduguri", tone: "origin" },
    { year: "2003", treatment: "Followed", title: "Bamgboye v. University of Ilorin", tone: "positive" },
    { year: "2014", treatment: "Distinguished", title: "University of Calabar v. Esiaga", tone: "neutral" },
    { year: "2025", treatment: "Applied", title: "Essien v. Akwa Ibom State", tone: "positive" },
  ];

  return (
    <section className="lx-treatment-section" aria-labelledby="treatment-title">
      <div className="lx-section-heading lx-section-heading-center">
        <p className="l-hero-eyebrow">Precedent through time</p>
        <h2 id="treatment-title">Know whether an authority still carries weight.</h2>
        <p>Follow the judicial history of a proposition from the originating case to its latest application.</p>
      </div>
      <div className="lx-treatment-line">
        {events.map((event) => (
          <article key={`${event.year}-${event.title}`} className={`lx-treatment-event ${event.tone}`}>
            <span className="lx-treatment-year">{event.year}</span>
            <span className="lx-treatment-dot" />
            <span className="lx-treatment-kind">{event.treatment}</span>
            <h3>{event.title}</h3>
          </article>
        ))}
      </div>
    </section>
  );
}

function Workflow() {
  const steps = [
    { icon: Search, title: "Search", text: "Find the strongest authorities for the legal issue." },
    { icon: ShieldCheck, title: "Verify", text: "Read the ratio and inspect every subsequent treatment." },
    { icon: FolderPlus, title: "Build the matter", text: "Save authorities with notes, folders and argument themes." },
    { icon: Download, title: "Export", text: "Create a court-ready research bundle or drafting brief." },
  ];

  return (
    <section className="lx-workflow-section" id="workflow" aria-labelledby="workflow-title">
      <div className="lx-section-heading">
        <p className="l-hero-eyebrow">One research workflow</p>
        <h2 id="workflow-title">From open question to defensible submission.</h2>
      </div>
      <div className="lx-workflow-grid">
        {steps.map(({ icon: Icon, title, text }, index) => (
          <article key={title}>
            <div className="lx-workflow-index">0{index + 1}</div>
            <Icon size={20} />
            <h3>{title}</h3>
            <p>{text}</p>
            {index < steps.length - 1 && <ArrowRight className="lx-workflow-arrow" size={18} />}
          </article>
        ))}
      </div>
    </section>
  );
}

const PRODUCT_TABS = ["Research", "Matters", "Reports"] as const;
type ProductTab = (typeof PRODUCT_TABS)[number];

function ProductViews() {
  const [tab, setTab] = useState<ProductTab>("Research");
  return (
    <section className="lx-product-section" aria-labelledby="product-title">
      <div className="lx-product-copy">
        <div className="lx-section-heading">
          <p className="l-hero-eyebrow">Built around legal work</p>
          <h2 id="product-title">A research desk that understands the matter.</h2>
          <p>Move from an authority to its citation graph, save it to the correct client matter and export the complete research record.</p>
        </div>
        <div className="lx-product-tabs" role="tablist" aria-label="Product views">
          {PRODUCT_TABS.map((item) => (
            <button key={item} type="button" role="tab" aria-selected={tab === item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>
          ))}
        </div>
        <ul className="lx-product-benefits">
          <li><Check size={14} /> Structured reports instead of raw documents</li>
          <li><Check size={14} /> Matter-level notes, folders and authority trails</li>
          <li><Check size={14} /> Consistent exports for counsel and clients</li>
        </ul>
      </div>

      <div className="lx-product-window">
        <div className="lx-window-top"><span /><span /><span /><strong>LexReport / {tab.toLowerCase()}</strong></div>
        <div className="lx-window-body">
          <aside><div className="lx-window-logo">Lr</div>{[Search, FileText, Network, BriefcaseBusiness, BookOpen].map((Icon, i) => <Icon key={i} size={16} className={i === (tab === "Research" ? 0 : tab === "Matters" ? 3 : 1) ? "active" : ""} />)}</aside>
          <main>
            <div className="lx-window-heading"><span>{tab}</span><BadgeCheck size={15} /></div>
            {tab === "Research" && <><div className="lx-window-search"><Search size={14} /> natural justice</div><div className="lx-window-card"><small>SUPREME COURT · VERIFIED</small><strong>S. Anaja v. United Bank for Africa</strong><span>(2025) ELR-000214 (SC)</span><p>Fair hearing · Followed 22 · Strength 98%</p></div><div className="lx-window-card muted" /></>}
            {tab === "Matters" && <><div className="lx-window-matter"><small>FHC/L/CS/284/2026</small><strong>Adebayo Holdings — Commercial dispute</strong><span>12 authorities · 4 notes · Bundle ready</span></div><div className="lx-window-columns"><div /><div /><div /></div></>}
            {tab === "Reports" && <><div className="lx-window-matter"><small>RESEARCH BUNDLE</small><strong>Authorities on crystallisation</strong><span>Verified 10 August 2026</span></div><div className="lx-window-report-lines">{[88, 72, 94, 66, 82].map((width) => <i key={width} style={{ width: `${width}%` }} />)}</div></>}
          </main>
        </div>
      </div>
    </section>
  );
}

function UseCases() {
  const cases = [
    { icon: Scale, title: "Litigation teams", text: "Test every proposition against current authority before filing." },
    { icon: Building2, title: "In-house counsel", text: "Turn external opinions into an auditable internal research record." },
    { icon: BriefcaseBusiness, title: "Chambers", text: "Organise authorities and drafting notes across active briefs." },
    { icon: GraduationCap, title: "Academia", text: "Trace doctrinal development across courts and reporting periods." },
    { icon: Users, title: "Law students", text: "Learn from judgments presented in a consistent legal structure." },
  ];
  return (
    <section className="lx-use-section" aria-labelledby="use-title">
      <div className="lx-section-heading lx-section-heading-center">
        <p className="l-hero-eyebrow">Designed for the profession</p>
        <h2 id="use-title">One archive. Different standards of legal work.</h2>
      </div>
      <div className="lx-use-grid">
        {cases.map(({ icon: Icon, title, text }) => <article key={title}><Icon size={20} /><h3>{title}</h3><p>{text}</p></article>)}
      </div>
    </section>
  );
}

function CoverageMap({ rows, loading }: { rows: Coverage[]; loading: boolean }) {
  const visibleRows = rows.slice(0, 5);
  return (
    <section className="lx-coverage-section" id="coverage" aria-labelledby="coverage-title">
      <div className="lx-coverage-copy">
        <div className="lx-section-heading">
          <p className="l-hero-eyebrow">National court coverage</p>
          <h2 id="coverage-title">Authorities across Nigeria's court system.</h2>
          <p>Research appellate and specialist courts from one consistently classified archive.</p>
        </div>
        <div className="lx-court-list">
          {loading ? <p>Loading live coverage…</p> : visibleRows.length ? visibleRows.map((row) => <div key={row.id}><span><Landmark size={14} /> {row.court}</span><strong>{row.years}</strong><em>{row.count} reports</em></div>) : <p>Coverage catalogue temporarily unavailable.</p>}
        </div>
      </div>
      <div className="lx-court-map" aria-label="Nigerian court hierarchy">
        <div className="lx-map-orbit lx-map-orbit-one" />
        <div className="lx-map-orbit lx-map-orbit-two" />
        <div className="lx-court-node lx-court-supreme"><Scale size={18} /><strong>Supreme Court</strong><span>Final appellate authority</span></div>
        <div className="lx-map-line lx-map-line-one" />
        <div className="lx-court-node lx-court-appeal"><Landmark size={18} /><strong>Court of Appeal</strong><span>National divisions</span></div>
        <div className="lx-map-line lx-map-line-two" />
        <div className="lx-court-branches"><span>Federal High Court</span><span>State High Courts</span><span>NICN</span><span>Specialist courts</span></div>
      </div>
    </section>
  );
}

function EditorialStandards() {
  return (
    <section className="lx-standards-section" id="standards" aria-labelledby="standards-title">
      <div className="lx-standard-seal" aria-hidden="true"><span>LR</span><strong>Verified</strong><small>Editorial standard</small></div>
      <div className="lx-standards-copy">
        <div className="lx-section-heading">
          <p className="l-hero-eyebrow">The LexReport editorial standard</p>
          <h2 id="standards-title">Trust is a process, not a badge.</h2>
          <p>Each published report passes through a consistent legal editorial workflow before it enters the research archive.</p>
        </div>
        <div className="lx-standard-grid">
          <div><ShieldCheck size={18} /><span><strong>Source checked</strong><small>Judgment identity, court, panel and dates confirmed.</small></span></div>
          <div><Quote size={18} /><span><strong>Ratio verified</strong><small>Propositions checked against the court's reasoning.</small></span></div>
          <div><Network size={18} /><span><strong>Treatment linked</strong><small>Subsequent judicial consideration classified and connected.</small></span></div>
          <div><Bell size={18} /><span><strong>Continuously updated</strong><small>Material treatment changes surface across saved matters.</small></span></div>
        </div>
        <a className="lx-sample-download" href="/sample/lexreport-sample-report.pdf" download>
          <Download size={15} /> Download a sample verified report <ArrowRight size={14} />
        </a>
      </div>
    </section>
  );
}

export function LandingStory({ coverageRows, coverageLoading }: { coverageRows: Coverage[]; coverageLoading: boolean }) {
  return (
    <>
      <ReportAnatomy />
      <TreatmentTimeline />
      <Workflow />
      <ProductViews />
      <UseCases />
      <CoverageMap rows={coverageRows} loading={coverageLoading} />
      <EditorialStandards />
    </>
  );
}

export function LandingFinalCta({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <section className="lx-final-cta">
      <div className="lx-final-mark"><Scale size={28} /></div>
      <p>LexReport · Nigerian legal intelligence</p>
      <h2>Build your argument on verified authority.</h2>
      <span>Search the archive, follow the precedent and keep every authority connected to the matter.</span>
      <div>
        <Link href={signedIn ? "/dashboard" : "/login"} className="btn btn-light">
          {signedIn ? "Return to research desk" : "Open research desk"} <ArrowRight size={14} />
        </Link>
        <a href="/sample/lexreport-sample-report.pdf" download className="btn btn-outline-light">Download sample report</a>
      </div>
    </section>
  );
}
