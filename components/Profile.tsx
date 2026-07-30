"use client";

import { useEffect, useId, useState } from "react";
import { usersApi } from "@/lib/api";
import type { ResearchPreference, UserProfile } from "@/lib/api";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { useDashboard } from "@/contexts/DashboardContext";
import { AsyncSection } from "./AsyncState";

type ProfileDraft = {
  initials: string;
  name: string;
  role: string;
  email: string;
  workspace: string;
  accountRole: string;
  jurisdiction: string;
};

function profileToDraft(profile: UserProfile): ProfileDraft {
  return {
    initials: profile.initials,
    name: profile.name,
    role: profile.role,
    email: profile.email,
    workspace: profile.workspace,
    accountRole: profile.accountRole,
    jurisdiction: profile.jurisdiction,
  };
}

function formatActivityTime(timestamp: string): string {
  const parsed = Date.parse(timestamp);
  if (Number.isNaN(parsed)) return timestamp;

  const date = new Date(parsed);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / (1000 * 60 * 60 * 24));
  const time = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  if (diffDays === 0) return `Today, ${time}`;
  if (diffDays === 1) return `Yesterday, ${time}`;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function ProfileContent({ profile }: { profile: UserProfile }) {
  const { showToast } = useDashboard();
  const [draft, setDraft] = useState<ProfileDraft>(() => profileToDraft(profile));
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const nameId = useId();
  const roleId = useId();
  const emailId = useId();
  const workspaceId = useId();
  const jurisdictionId = useId();

  const preferencesQuery = useApiQuery("users:preferences", () => usersApi.preferences());
  const activityQuery = useApiQuery("users:activity", () => usersApi.activity());

  const saveMutation = useApiMutation((body: Partial<ProfileDraft>) => usersApi.updateProfile(body));
  const prefMutation = useApiMutation((prefs: ResearchPreference[]) =>
    usersApi.updatePreferences(prefs),
  );

  useEffect(() => {
    setDraft(profileToDraft(profile));
  }, [profile]);

  function updateField<K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setStatusMessage(null);
    const updated = await saveMutation.mutate({
      initials: draft.initials,
      name: draft.name,
      role: draft.role,
      email: draft.email,
      workspace: draft.workspace,
      jurisdiction: draft.jurisdiction,
    });
    if (updated) {
      setDraft(profileToDraft(updated));
      setStatusMessage("Profile changes saved.");
      showToast("Profile changes saved.");
    }
  }

  async function togglePreference(pref: ResearchPreference) {
    setStatusMessage(null);
    const next = { label: pref.label, enabled: !pref.enabled };
    const updated = await prefMutation.mutate([next]);
    if (updated && preferencesQuery.data) {
      preferencesQuery.setData(
        preferencesQuery.data.map((p) =>
          p.label === next.label ? { ...p, enabled: next.enabled } : p,
        ),
      );
      setStatusMessage(`Preference updated: ${next.label}.`);
    }
  }

  const { subscription } = profile;

  return (
    <>
      <div className="profile-status-region sr-only" aria-live="polite">
        {statusMessage}
      </div>
      {saveMutation.error && (
        <p className="profile-inline-error" role="alert">{saveMutation.error}</p>
      )}
      <div className="profile-hero-card">
        <div className="profile-avatar-lg" aria-hidden="true">{draft.initials || "—"}</div>
        <div className="profile-hero-fields">
          <p className="label">User profile</p>
          <div className="profile-field">
            <label htmlFor={nameId}>Full name</label>
            <input
              id={nameId}
              className="profile-name"
              value={draft.name}
              onChange={(e) => updateField("name", e.target.value)}
            />
          </div>
          <div className="profile-field">
            <label htmlFor={roleId}>Professional title</label>
            <input
              id={roleId}
              className="profile-role"
              value={draft.role}
              onChange={(e) => updateField("role", e.target.value)}
            />
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleSave}
          disabled={saveMutation.pending}
        >
          {saveMutation.pending ? "Saving…" : "Save changes"}
        </button>
      </div>
      <div className="grid-2">
        <div className="profile-card">
          <div className="profile-card-label">Account details</div>
          <dl className="meta-dl">
            <dt><label htmlFor={emailId}>Email</label></dt>
            <dd>
              <input
                id={emailId}
                type="email"
                value={draft.email}
                onChange={(e) => updateField("email", e.target.value)}
                style={{ width: "100%", border: "none", background: "transparent", font: "inherit", color: "inherit", padding: 0 }}
              />
            </dd>
            <dt><label htmlFor={workspaceId}>Workspace</label></dt>
            <dd>
              <input
                id={workspaceId}
                value={draft.workspace}
                onChange={(e) => updateField("workspace", e.target.value)}
                style={{ width: "100%", border: "none", background: "transparent", font: "inherit", color: "inherit", padding: 0 }}
              />
            </dd>
            <dt>Role</dt>
            <dd>{draft.accountRole}</dd>
            <dt><label htmlFor={jurisdictionId}>Jurisdiction</label></dt>
            <dd>
              <input
                id={jurisdictionId}
                value={draft.jurisdiction}
                onChange={(e) => updateField("jurisdiction", e.target.value)}
                style={{ width: "100%", border: "none", background: "transparent", font: "inherit", color: "inherit", padding: 0 }}
              />
            </dd>
          </dl>
        </div>
        <div className="profile-card">
          <div className="profile-card-label">Subscription</div>
          <div className="plan-box">
            <div className="plan-name">{subscription.planName}</div>
            <div className="plan-seats">{subscription.seatsActive} seats active</div>
            <div className="plan-desc">{subscription.description}</div>
          </div>
        </div>
        <div className="profile-card">
          <div className="profile-card-label">Research preferences</div>
          {prefMutation.error && (
            <p className="profile-inline-error" role="alert">{prefMutation.error}</p>
          )}
          <AsyncSection query={preferencesQuery} loadingLabel="Loading preferences…" emptyMessage="No preferences configured.">
            {(preferences) =>
              preferences.map((p) => (
                <label className="pref-row" key={p.label}>
                  <span>{p.label}</span>
                  <input
                    type="checkbox"
                    checked={p.enabled}
                    disabled={prefMutation.pending}
                    onChange={() => togglePreference(p)}
                  />
                </label>
              ))
            }
          </AsyncSection>
        </div>
        <div className="profile-card">
          <div className="profile-card-label">Security activity</div>
          <AsyncSection query={activityQuery} loadingLabel="Loading activity…" emptyMessage="No recent activity recorded.">
            {(activity) =>
              activity.map((item) => (
                <div className="activity-row" key={item.id}>
                  <div className="activity-dot" aria-hidden="true" />
                  <div className="activity-time">{formatActivityTime(item.timestamp)}</div>
                  <div className="activity-desc">{item.description}</div>
                </div>
              ))
            }
          </AsyncSection>
        </div>
      </div>
    </>
  );
}

export function Profile() {
  const profileQuery = useApiQuery("users:profile", () => usersApi.profile());

  return (
    <AsyncSection query={profileQuery} loadingLabel="Loading profile…">
      {(profile) => <ProfileContent profile={profile} />}
    </AsyncSection>
  );
}
