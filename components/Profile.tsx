"use client";

import { useDashboard } from "@/contexts/DashboardContext";

export function Profile() {
  const { showToast } = useDashboard();
  return (
    <>
      <div className="profile-hero-card">
        <div className="profile-avatar-lg">AO</div>
        <div style={{ flex: 1 }}>
          <p className="label">User profile</p>
          <div className="profile-name">Adanna Okafor</div>
          <div className="profile-role">Partner, Disputes Practice · Meridian &amp; Cole LLP</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => showToast("Profile changes saved.")}>Save changes</button>
      </div>
      <div className="grid-2">
        <div className="profile-card">
          <div className="profile-card-label">Account details</div>
          <dl className="meta-dl">
            <dt>Email</dt><dd>partner@lawfirm.ng</dd>
            <dt>Workspace</dt><dd>Meridian &amp; Cole LLP</dd>
            <dt>Role</dt><dd>Firm administrator</dd>
            <dt>Jurisdiction</dt><dd>Nigeria</dd>
          </dl>
        </div>
        <div className="profile-card">
          <div className="profile-card-label">Subscription</div>
          <div className="plan-box">
            <div className="plan-name">Professional Firm</div>
            <div className="plan-seats">24 seats active</div>
            <div className="plan-desc">Supreme Court, Court of Appeal, FHC, NICN, tribunal reports, citation graph, and export bundles.</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => showToast("Billing workspace opened.")}>Manage billing</button>
        </div>
        <div className="profile-card">
          <div className="profile-card-label">Research preferences</div>
          {["Prefer Supreme Court authorities", "Show negative treatment warnings", "Include statute links in results", "Email weekly court digest"].map(p => (
            <label className="pref-row" key={p}><span>{p}</span><input type="checkbox" defaultChecked /></label>
          ))}
        </div>
        <div className="profile-card">
          <div className="profile-card-label">Security activity</div>
          {[["Today, 03:18", "Signed in from Lagos"], ["Yesterday, 18:42", "Exported research bundle"], ["29 May 2026", "Updated Court Watch alerts"]].map(([time, desc]) => (
            <div className="activity-row" key={time}>
              <div className="activity-dot" />
              <div className="activity-time">{time}</div>
              <div className="activity-desc">{desc}</div>
            </div>
          ))}
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 14 }} onClick={() => showToast("Two-factor setup opened.")}>
            Set up two-factor authentication
          </button>
        </div>
      </div>
    </>
  );
}
