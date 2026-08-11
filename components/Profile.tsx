"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, LogOut, Monitor, Trash2 } from "lucide-react";
import { usersApi } from "@/lib/api";
import type { ResearchPreference, UserProfile, UserSession } from "@/lib/api";
import { clearTokens } from "@/lib/api/axios";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { useDashboard } from "@/contexts/DashboardContext";
import { AsyncSection } from "./AsyncState";
import { ConfirmDialog } from "./ConfirmDialog";

type ProfileDraft = {
  initials: string;
  name: string;
  role: string;
  email: string;
  workspace: string;
  accountRole: string;
  jurisdiction: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function validateDraft(draft: ProfileDraft): Partial<Record<keyof ProfileDraft, string>> {
  const errors: Partial<Record<keyof ProfileDraft, string>> = {};
  if (!draft.name.trim()) errors.name = "Full name is required.";
  if (!draft.role.trim()) errors.role = "Professional title is required.";
  if (!draft.initials.trim()) errors.initials = "Initials are required.";
  else if (draft.initials.trim().length > 3) errors.initials = "Use at most three characters.";
  if (!draft.email.trim()) errors.email = "Email is required.";
  else if (!EMAIL_RE.test(draft.email.trim())) errors.email = "Enter a valid email address.";
  if (!draft.workspace.trim()) errors.workspace = "Workspace is required.";
  if (!draft.jurisdiction.trim()) errors.jurisdiction = "Jurisdiction is required.";
  return errors;
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

function formatSeen(iso: string): string {
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return iso;
  const minutes = Math.round((Date.now() - parsed) / 60000);
  if (minutes < 1) return "Active now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return new Date(parsed).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function AvatarEditor({
  profile,
  onChanged,
}: {
  profile: UserProfile;
  onChanged: (next: UserProfile) => void;
}) {
  const { showToast } = useDashboard();
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useApiMutation((file: File) => usersApi.uploadAvatar(file));
  const remove = useApiMutation(() => usersApi.removeAvatar());

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const updated = await upload.mutate(file);
    if (updated) {
      onChanged(updated);
      showToast("Profile picture updated.");
    }
  }

  async function handleRemove() {
    const updated = await remove.mutate();
    if (updated) {
      onChanged(updated);
      showToast("Profile picture removed.");
    }
  }

  const busy = upload.pending || remove.pending;

  return (
    <div className="profile-avatar-editor">
      <div className="profile-avatar-lg">
        {profile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatarUrl} alt="" className="profile-avatar-img" />
        ) : (
          <span aria-hidden="true">{profile.initials || "—"}</span>
        )}
      </div>
      <div className="profile-avatar-actions">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          <Camera size={12} aria-hidden="true" />
          {upload.pending ? "Uploading…" : "Change photo"}
        </button>
        {profile.avatarUrl && (
          <button
            type="button"
            className="btn btn-link btn-sm"
            onClick={handleRemove}
            disabled={busy}
          >
            Remove
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        onChange={handleFile}
        aria-label="Upload a profile picture"
      />
      {(upload.error || remove.error) && (
        <p className="profile-inline-error" role="alert">
          {upload.error ?? remove.error}
        </p>
      )}
    </div>
  );
}

function ChangePasswordCard() {
  const { showToast } = useDashboard();
  const currentId = useId();
  const nextId = useId();
  const confirmId = useId();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const change = useApiMutation((a: string, b: string) => usersApi.changePassword(a, b));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLocalError(null);

    if (next.length < 8) {
      setLocalError("New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      setLocalError("New password and confirmation do not match.");
      return;
    }

    const result = await change.mutate(current, next);
    if (result) {
      setCurrent("");
      setNext("");
      setConfirm("");
      showToast("Password changed. Other devices were signed out.");
    }
  }

  return (
    <div className="profile-card">
      <div className="profile-card-label">Change password</div>
      <form className="profile-form" onSubmit={submit}>
        {(localError || change.error) && (
          <p className="profile-inline-error" role="alert">
            {localError ?? change.error}
          </p>
        )}
        <div className="profile-field">
          <label htmlFor={currentId}>Current password</label>
          <input
            id={currentId}
            type="password"
            className="form-input"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
          />
        </div>
        <div className="profile-field">
          <label htmlFor={nextId}>New password</label>
          <input
            id={nextId}
            type="password"
            className="form-input"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            required
          />
        </div>
        <div className="profile-field">
          <label htmlFor={confirmId}>Confirm new password</label>
          <input
            id={confirmId}
            type="password"
            className="form-input"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-secondary btn-sm"
          disabled={change.pending || !current || !next || !confirm}
        >
          {change.pending ? "Changing…" : "Change password"}
        </button>
      </form>
    </div>
  );
}

function SessionsCard() {
  const { showToast } = useDashboard();
  const sessionsQuery = useApiQuery("users:sessions", () => usersApi.sessions());
  const revoke = useApiMutation((id: string) => usersApi.revokeSession(id));
  const revokeOthers = useApiMutation(() => usersApi.revokeOtherSessions());

  async function handleRevoke(session: UserSession) {
    const done = await revoke.mutate(session.id);
    if (done) {
      sessionsQuery.setData((sessionsQuery.data ?? []).filter((s) => s.id !== session.id));
      showToast("Device signed out.");
    }
  }

  async function handleRevokeOthers() {
    const result = await revokeOthers.mutate();
    if (result) {
      sessionsQuery.setData((sessionsQuery.data ?? []).filter((s) => s.current));
      showToast(
        result.revoked === 0
          ? "No other devices were signed in."
          : `Signed out of ${result.revoked} other device${result.revoked === 1 ? "" : "s"}.`,
      );
    }
  }

  const others = (sessionsQuery.data ?? []).filter((s) => !s.current).length;

  return (
    <div className="profile-card">
      <div className="profile-card-head">
        <div className="profile-card-label">Signed-in devices</div>
        {others > 0 && (
          <button
            type="button"
            className="btn btn-link btn-sm"
            onClick={handleRevokeOthers}
            disabled={revokeOthers.pending}
          >
            <LogOut size={12} aria-hidden="true" />
            {revokeOthers.pending ? "Signing out…" : "Sign out others"}
          </button>
        )}
      </div>
      {(revoke.error || revokeOthers.error) && (
        <p className="profile-inline-error" role="alert">
          {revoke.error ?? revokeOthers.error}
        </p>
      )}
      <AsyncSection
        query={sessionsQuery}
        loadingLabel="Loading devices…"
        emptyMessage="No active sessions recorded."
      >
        {(sessions) =>
          sessions.map((session) => (
            <div className="session-row" key={session.id}>
              <Monitor size={14} className="session-icon" aria-hidden="true" />
              <div className="session-info">
                <div className="session-agent">
                  {session.userAgent ?? "Unknown device"}
                  {session.current && <span className="session-current">This device</span>}
                </div>
                <div className="session-meta">
                  {session.ipAddress ? `${session.ipAddress} · ` : ""}
                  {formatSeen(session.lastSeenAt)}
                </div>
              </div>
              {!session.current && (
                <button
                  type="button"
                  className="btn btn-link btn-sm"
                  onClick={() => handleRevoke(session)}
                  disabled={revoke.pending}
                  aria-label={`Sign out ${session.userAgent ?? "this device"}`}
                >
                  Sign out
                </button>
              )}
            </div>
          ))
        }
      </AsyncSection>
    </div>
  );
}

function DangerZoneCard() {
  const router = useRouter();
  const passwordId = useId();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const remove = useApiMutation((pw: string) => usersApi.deleteAccount(pw));

  async function confirmDelete() {
    const result = await remove.mutate(password);
    if (result) {
      clearTokens();
      router.replace("/login");
    }
  }

  return (
    <div className="profile-card profile-card--danger">
      <div className="profile-card-label">Delete account</div>
      <p className="profile-danger-copy">
        Permanently deletes your account, saved folders, matters, drafts and research history.
        This cannot be undone.
      </p>
      {remove.error && (
        <p className="profile-inline-error" role="alert">
          {remove.error}
        </p>
      )}
      <div className="profile-field">
        <label htmlFor={passwordId}>Confirm your password</label>
        <input
          id={passwordId}
          type="password"
          className="form-input"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button
        type="button"
        className="btn btn-danger btn-sm"
        onClick={() => setOpen(true)}
        disabled={!password || remove.pending}
      >
        <Trash2 size={12} aria-hidden="true" /> Delete my account
      </button>
      <ConfirmDialog
        open={open}
        title="Delete your account?"
        body="Your account and everything saved in it will be removed immediately. This cannot be undone."
        confirmLabel="Delete account"
        destructive
        busy={remove.pending}
        onConfirm={confirmDelete}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}

function ProfileContent({
  profile,
  onProfileChange,
}: {
  profile: UserProfile;
  onProfileChange: (next: UserProfile) => void;
}) {
  const { showToast } = useDashboard();
  const [draft, setDraft] = useState<ProfileDraft>(() => profileToDraft(profile));
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const nameId = useId();
  const roleId = useId();
  const initialsId = useId();
  const emailId = useId();
  const workspaceId = useId();
  const jurisdictionId = useId();

  const preferencesQuery = useApiQuery("users:preferences", () => usersApi.preferences());
  const activityQuery = useApiQuery("users:activity", () => usersApi.activity());
  const subscriptionQuery = useApiQuery("users:subscription", () => usersApi.subscription());

  const saveMutation = useApiMutation((body: Partial<ProfileDraft>) => usersApi.updateProfile(body));
  const prefMutation = useApiMutation((prefs: ResearchPreference[]) =>
    usersApi.updatePreferences(prefs),
  );

  useEffect(() => {
    setDraft(profileToDraft(profile));
    setShowErrors(false);
  }, [profile]);

  const saved = useMemo(() => profileToDraft(profile), [profile]);
  const errors = useMemo(() => validateDraft(draft), [draft]);
  const dirty = useMemo(
    () => (Object.keys(saved) as (keyof ProfileDraft)[]).some((k) => saved[k] !== draft[k]),
    [saved, draft],
  );
  const hasErrors = Object.keys(errors).length > 0;

  function updateField<K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function fieldError(key: keyof ProfileDraft) {
    return showErrors ? errors[key] : undefined;
  }

  async function handleSave() {
    setStatusMessage(null);
    setShowErrors(true);
    if (hasErrors) {
      setStatusMessage("Fix the highlighted fields before saving.");
      return;
    }

    const updated = await saveMutation.mutate({
      initials: draft.initials.trim(),
      name: draft.name.trim(),
      role: draft.role.trim(),
      email: draft.email.trim(),
      workspace: draft.workspace.trim(),
      jurisdiction: draft.jurisdiction.trim(),
    });
    if (updated) {
      onProfileChange(updated);
      setDraft(profileToDraft(updated));
      setShowErrors(false);
      setStatusMessage("Profile changes saved.");
      showToast("Profile changes saved.");
    }
  }

  function handleReset() {
    setDraft(saved);
    setShowErrors(false);
    setStatusMessage("Changes discarded.");
  }

  async function togglePreference(pref: ResearchPreference) {
    setStatusMessage(null);
    const next = { label: pref.label, enabled: !pref.enabled };
    const before = preferencesQuery.data ?? [];

    preferencesQuery.setData(
      before.map((p) => (p.label === next.label ? { ...p, enabled: next.enabled } : p)),
    );

    const updated = await prefMutation.mutate([next]);
    if (updated) {
      setStatusMessage(`Preference updated: ${next.label}.`);
    } else {
      preferencesQuery.setData(before);
      setStatusMessage(`Could not update: ${next.label}.`);
    }
  }

  return (
    <>
      <div className="profile-status-region sr-only" aria-live="polite">
        {statusMessage}
      </div>
      {saveMutation.error && (
        <p className="profile-inline-error" role="alert">{saveMutation.error}</p>
      )}
      <div className="profile-hero-card">
        <AvatarEditor profile={profile} onChanged={onProfileChange} />
        <div className="profile-hero-fields">
          <p className="label">User profile</p>
          <div className="profile-field">
            <label htmlFor={nameId}>Full name</label>
            <input
              id={nameId}
              className="profile-name"
              value={draft.name}
              onChange={(e) => updateField("name", e.target.value)}
              aria-invalid={Boolean(fieldError("name"))}
            />
            {fieldError("name") && <span className="profile-field-error">{fieldError("name")}</span>}
          </div>
          <div className="profile-field">
            <label htmlFor={roleId}>Professional title</label>
            <input
              id={roleId}
              className="profile-role"
              value={draft.role}
              onChange={(e) => updateField("role", e.target.value)}
              aria-invalid={Boolean(fieldError("role"))}
            />
            {fieldError("role") && <span className="profile-field-error">{fieldError("role")}</span>}
          </div>
          <div className="profile-field profile-field--narrow">
            <label htmlFor={initialsId}>Initials</label>
            <input
              id={initialsId}
              className="form-input"
              maxLength={3}
              value={draft.initials}
              onChange={(e) => updateField("initials", e.target.value.toUpperCase())}
              aria-invalid={Boolean(fieldError("initials"))}
            />
            {fieldError("initials") && (
              <span className="profile-field-error">{fieldError("initials")}</span>
            )}
          </div>
        </div>
        <div className="profile-hero-actions">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={saveMutation.pending || !dirty}
          >
            {saveMutation.pending ? "Saving…" : "Save changes"}
          </button>
          {dirty && (
            <button
              type="button"
              className="btn btn-link btn-sm"
              onClick={handleReset}
              disabled={saveMutation.pending}
            >
              Discard
            </button>
          )}
        </div>
      </div>
      <div className="grid-2">
        <div className="profile-card">
          <div className="profile-card-label">Account details</div>
          <div className="profile-form">
            <div className="profile-field">
              <label htmlFor={emailId}>Email</label>
              <input
                id={emailId}
                type="email"
                className="form-input"
                value={draft.email}
                onChange={(e) => updateField("email", e.target.value)}
                aria-invalid={Boolean(fieldError("email"))}
              />
              {fieldError("email") && (
                <span className="profile-field-error">{fieldError("email")}</span>
              )}
            </div>
            <div className="profile-field">
              <label htmlFor={workspaceId}>Workspace</label>
              <input
                id={workspaceId}
                className="form-input"
                value={draft.workspace}
                onChange={(e) => updateField("workspace", e.target.value)}
                aria-invalid={Boolean(fieldError("workspace"))}
              />
              {fieldError("workspace") && (
                <span className="profile-field-error">{fieldError("workspace")}</span>
              )}
            </div>
            <div className="profile-field">
              <label htmlFor={jurisdictionId}>Jurisdiction</label>
              <input
                id={jurisdictionId}
                className="form-input"
                value={draft.jurisdiction}
                onChange={(e) => updateField("jurisdiction", e.target.value)}
                aria-invalid={Boolean(fieldError("jurisdiction"))}
              />
              {fieldError("jurisdiction") && (
                <span className="profile-field-error">{fieldError("jurisdiction")}</span>
              )}
            </div>
            <div className="profile-field">
              <span className="profile-readonly-label">Role</span>
              <span className="profile-readonly-value">{draft.accountRole}</span>
            </div>
          </div>
        </div>
        <div className="profile-card">
          <div className="profile-card-label">Subscription</div>
          <AsyncSection query={subscriptionQuery} loadingLabel="Loading subscription…">
            {(subscription) => (
              <div className="plan-box">
                <div className="plan-name">{subscription.planName}</div>
                <div className="plan-seats">{subscription.seatsActive} seats active</div>
                <div className="plan-desc">{subscription.description}</div>
              </div>
            )}
          </AsyncSection>
        </div>
        <ChangePasswordCard />
        <SessionsCard />
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
        <DangerZoneCard />
      </div>
    </>
  );
}

export function Profile() {
  const profileQuery = useApiQuery("users:profile", () => usersApi.profile());

  return (
    <AsyncSection query={profileQuery} loadingLabel="Loading profile…">
      {(profile) => (
        <ProfileContent profile={profile} onProfileChange={profileQuery.setData} />
      )}
    </AsyncSection>
  );
}
