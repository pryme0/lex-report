"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { coverageData, reportQueue } from "@/lib/data";

export function LandingPage() {
  return (
    <div className="landing">
      <nav className="l-nav">
        <div className="l-nav-inner">
          <Link href="/" className="sidebar-brand">
            <div className="sidebar-mark">Lr</div>
            <span className="sidebar-brand-name" style={{ color: "rgba(255,255,255,0.9)" }}>LexReport</span>
          </Link>
          <div className="l-nav-links">
            <a href="#platform">Platform</a>
            <a href="#coverage">Coverage</a>
          </div>
          <Link href="/login" className="l-nav-login">Log in</Link>
        </div>
      </nav>

      <section className="l-hero">
        <div className="l-hero-copy">
          <p className="l-hero-eyebrow">Nigerian law reports — rebuilt for active practice</p>
          <h1 className="l-hero-h1">
            Find the report.<br />
            Trust the treatment.<br />
            Move the matter.
          </h1>
          <p className="l-hero-sub">
            LexReport turns judgments into usable litigation intelligence — verified headnotes,
            ratio tracking, citation history, court alerts, and matter-ready bundles for the
            practising lawyer.
          </p>
          <div className="l-hero-cta">
            <Link href="/login" className="btn btn-primary">
              Open research desk <ArrowRight size={14} />
            </Link>
            <Link href="/login" className="btn btn-secondary">Read sample judgment</Link>
          </div>
        </div>

        <div className="report-preview">
          <div className="rp-header">
            <span className="rp-header-label">Daily report desk</span>
            <span className="rp-header-date">2 June 2026</span>
          </div>
          <div className="rp-body">
            <div className="rp-case">
              <div className="rp-vol">LRR 4 / SC / 221</div>
              <div className="rp-title">Zenith Trustees Ltd v. Adebayo &amp; Sons Holdings</div>
              <div className="rp-ratio">Floating charge priority, crystallisation, purchaser with notice.</div>
              <div className="rp-tags">
                <span className="rp-tag">Followed 14</span>
                <span className="rp-tag">Questioned 1</span>
                <span className="rp-tag">Strength 96%</span>
              </div>
            </div>
            <div className="rp-grid">
              <div className="rp-panel">
                <div className="rp-panel-label">Incoming courts</div>
                {reportQueue.map(({ court, topic, status }) => (
                  <div className="rp-court-row" key={topic}>
                    <div className="rp-court-ico">{court}</div>
                    <div>
                      <div className="rp-court-name">{topic}</div>
                      <div className="rp-court-status">{status}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rp-panel">
                <div className="rp-panel-label">Citation treatment</div>
                {[["Followed", 92], ["Distinguished", 75], ["Limited", 58], ["Overruled", 24]].map(([label, pct]) => (
                  <div className="rp-bar" key={label as string}>
                    <div className="rp-bar-track">
                      <div className="rp-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="rp-bar-label">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="l-stats">
        <div className="l-stats-inner">
          {[
            { num: "47,000+", desc: "Verified judgments" },
            { num: "136 yrs", desc: "Coverage: 1890 – 2026" },
            { num: "6 courts", desc: "From Supreme Court to NICN" },
            { num: "Daily",    desc: "Editorial updates" },
          ].map(({ num, desc }) => (
            <div className="l-stat" key={desc}>
              <div className="l-stat-num">{num}</div>
              <div className="l-stat-desc">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      <section className="l-caps" id="platform">
        <div className="l-caps-inner">
          <div className="l-caps-intro">
            <h2>What practitioners actually need from a law report.</h2>
            <p>
              Every report on LexReport is editorially verified — headnote, ratio, issues,
              authorities, and citation treatment. Not a raw judgment dump. Not keyword search
              over PDFs. A proper report, built the way Nigerian legal practice demands it.
            </p>
          </div>
          <div className="l-caps-grid">
            {[
              { num: "01", title: "Report-first reading", desc: "Every judgment opens as a structured report: verified facts, issues framed for practitioners, holdings, ratio, and the full authority trail." },
              { num: "02", title: "Citation treatment tracking", desc: "See exactly how each case has been treated — followed, distinguished, questioned, or overruled — with the citing cases listed and linked." },
              { num: "03", title: "Court watch and alerts", desc: "Fresh decisions, panel splits, and pending digests surface in real time. Set alerts on practice areas or specific courts." },
              { num: "04", title: "Matter-ready bundles", desc: "Save cases into client matters, build argument outlines from verified authorities, and export formatted research bundles ready for brief or court." },
            ].map(({ num, title, desc }) => (
              <div className="l-cap-item" key={num}>
                <div className="l-cap-num">{num}</div>
                <div className="l-cap-title">{title}</div>
                <div className="l-cap-desc">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="l-coverage" id="coverage">
        <div className="l-coverage-header">
          <div>
            <p className="l-hero-eyebrow">Editorial coverage</p>
            <h2>Every court that matters to Nigerian practice.</h2>
          </div>
          <Link href="/login" className="btn btn-secondary">View full catalogue</Link>
        </div>
        <div className="l-coverage-table">
          <div className="l-cov-row header">
            <span className="l-cov-label">Court</span>
            <span className="l-cov-label">Years covered</span>
            <span className="l-cov-label">Judgments</span>
          </div>
          {coverageData.map(({ court, years, count }) => (
            <div className="l-cov-row" key={court}>
              <span className="l-cov-court">{court}</span>
              <span className="l-cov-years">{years}</span>
              <span className="l-cov-count">{count}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="l-cta">
        <h2>Start your research.<br />Close your matter.</h2>
        <p>Join firms, chambers, and in-house teams across Nigeria using LexReport for daily legal research.</p>
        <div className="l-cta-btns">
          <Link href="/login" className="btn btn-light">Open research desk</Link>
          <Link href="/login" className="btn btn-outline-light">Book a demo</Link>
        </div>
      </section>

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
