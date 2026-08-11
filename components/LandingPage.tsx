"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BadgeCheck, Landmark, Scale } from "lucide-react";
import { catalogApi, reportsApi } from "@/lib/api";
import type { ArchiveFilters, Coverage } from "@/lib/api";
import { useApiQuery } from "@/lib/api/hooks";
import { LandingFinalCta, LandingSearchPreview, LandingStory } from "@/components/LandingSections";

function formatCount(n: number): string {
  return n.toLocaleString();
}

function statsFromArchive(coverage: Coverage[], filters: ArchiveFilters | null) {
  const judgmentTotal = coverage.reduce((sum, row) => sum + (parseInt(row.count, 10) || 0), 0);

  let yearMin: number | null = filters?.years.min ?? null;
  let yearMax: number | null = filters?.years.max ?? null;

  if (yearMin === null || yearMax === null) {
    for (const row of coverage) {
      const match = row.years.match(/(\d{4})\s*[-–]\s*(\d{4})/);
      if (!match) continue;
      const from = parseInt(match[1], 10);
      const to = parseInt(match[2], 10);
      if (yearMin === null || from < yearMin) yearMin = from;
      if (yearMax === null || to > yearMax) yearMax = to;
    }
  }

  const courtCount = filters?.courts.length ?? coverage.filter((r) => parseInt(r.count, 10) > 0).length;

  return {
    judgmentTotal,
    yearMin,
    yearMax,
    courtCount,
  };
}

export function LandingPage() {
  const coverageQuery = useApiQuery("catalog:coverage", () => catalogApi.coverage());
  const filtersQuery = useApiQuery("catalog:filters", () => catalogApi.filters());
  const queueQuery = useApiQuery("reports:queue:4", () => reportsApi.queue(4));

  const coverageRows = coverageQuery.data ?? [];
  const reportQueue = queueQuery.data ?? [];
  const showQueue = !queueQuery.error && reportQueue.length > 0;

  const archiveReady = !coverageQuery.error && coverageRows.length > 0;
  const stats = archiveReady
    ? statsFromArchive(coverageRows, filtersQuery.error ? null : filtersQuery.data)
    : null;

  const statItems = stats
    ? [
        {
          num: formatCount(stats.judgmentTotal),
          desc: "Verified judgments",
        },
        stats.yearMin !== null && stats.yearMax !== null
          ? {
              num: `${stats.yearMax - stats.yearMin} yrs`,
              desc: `Coverage: ${stats.yearMin} – ${stats.yearMax}`,
            }
          : null,
        stats.courtCount > 0
          ? { num: `${stats.courtCount} courts`, desc: "From Supreme Court to NICN" }
          : null,
        showQueue
          ? { num: "Daily", desc: "Editorial updates" }
          : { num: "Live", desc: "Archive-backed catalogue" },
      ].filter(Boolean) as { num: string; desc: string }[]
    : [];

  return (
    <div className="landing">
      <nav className="l-nav">
        <div className="l-nav-inner">
          <Link href="/" className="sidebar-brand">
            <div className="sidebar-mark">Lr</div>
            <span className="sidebar-brand-name" style={{ color: "var(--l-ink)" }}>LexReport</span>
          </Link>
          <div className="l-nav-links">
            <a href="#platform">Reports</a>
            <a href="#workflow">Workflow</a>
            <a href="#coverage">Coverage</a>
            <a href="#standards">Standards</a>
          </div>
          <Link href="/login" className="l-nav-login">Log in</Link>
        </div>
      </nav>

      <section className="l-hero-section">
        <div className="l-hero">
          <div className="l-hero-copy">
            <p className="l-hero-eyebrow">Nigerian legal intelligence</p>
            <h1 className="l-hero-h1">
              The authority behind every argument.
            </h1>
            <p className="l-hero-sub">
              Research Nigerian judgments with verified headnotes, clear ratios and complete
              citation treatment — then organise every authority around the matter you are building.
            </p>
            <div className="l-hero-cta">
              <Link href="/login" className="btn btn-primary">
                Open research desk <ArrowRight size={14} />
              </Link>
              <a href="/sample/lexreport-sample-report.pdf" download className="btn btn-secondary">Read sample report</a>
            </div>
            <div className="l-hero-proof" aria-label="LexReport research standards">
              <span><BadgeCheck size={14} /> Editorially verified</span>
              <span><Landmark size={14} /> Nigerian courts</span>
              <span><Scale size={14} /> Treatment tracked</span>
            </div>
          </div>

          <div className="l-hero-visual">
            <div className="l-justice-frame">
              <Image
                className="l-lady-justice"
                src="/images/lady-justice-engraving.png"
                alt="An engraved depiction of Lady Justice holding balanced scales"
                width={1024}
                height={1366}
                priority
                sizes="(max-width: 640px) 92vw, (max-width: 1080px) 600px, 540px"
              />
              <div className="l-justice-caption">
                <Scale size={15} />
                <span>Law, clearly reported</span>
              </div>
            </div>
            <div className="l-authority-card">
              <div className="l-authority-status"><BadgeCheck size={13} /> Verified authority</div>
              <div className="l-authority-cite">(2026) 4 LRR 221 (SC)</div>
              <div className="l-authority-title">Zenith Trustees Ltd v. Adebayo &amp; Sons Holdings</div>
              <div className="l-authority-rule">Priority of floating charges and crystallisation.</div>
              <div className="l-authority-meta">
                <span>Followed 14</span>
                <span>Strength 96%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LandingSearchPreview />

      <div className="l-stats">
        <div className="l-stats-inner">
          {statItems.length > 0 ? (
            statItems.map(({ num, desc }) => (
              <div className="l-stat" key={desc}>
                <div className="l-stat-num">{num}</div>
                <div className="l-stat-desc">{desc}</div>
              </div>
            ))
          ) : (
            <div className="l-stat l-stat-unavailable">
              <div className="l-stat-desc">
                {coverageQuery.loading || filtersQuery.loading
                  ? "Loading archive statistics…"
                  : "Archive statistics unavailable."}
              </div>
            </div>
          )}
        </div>
      </div>

      <LandingStory coverageRows={coverageRows} coverageLoading={coverageQuery.loading} />

      <LandingFinalCta />

      <footer className="l-footer">
        <div className="sidebar-brand">
          <div className="sidebar-mark" style={{ width: 28, height: 28, fontSize: "0.8rem" }}>Lr</div>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>LexReport</span>
        </div>
        <span className="l-footer-copy">© 2026 LexReport. Nigerian law intelligence.</span>
      </footer>
    </div>
  );
}
