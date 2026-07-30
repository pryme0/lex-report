"use client";

import type { FieldErrors } from "./formUtils";

type BaseProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
};

export function FormField({
  id,
  label,
  error,
  hint,
  children,
}: BaseProps & { children: React.ReactNode }) {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`admin-field${error ? " admin-field-error" : ""}`}>
      <label className="form-label" htmlFor={id}>
        {label}
      </label>
      {hint && (
        <p id={hintId} className="admin-field-hint">
          {hint}
        </p>
      )}
      <div aria-describedby={describedBy}>{children}</div>
      {error && (
        <p id={errorId} className="admin-field-error-msg" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextInput({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  placeholder,
  disabled,
  type = "text",
}: BaseProps & {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <FormField id={id} label={label} error={error} hint={hint}>
      <input
        id={id}
        type={type}
        className="form-input"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        onChange={(e) => onChange(e.target.value)}
      />
    </FormField>
  );
}

export function TextArea({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  placeholder,
  disabled,
  rows = 4,
}: BaseProps & {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
}) {
  return (
    <FormField id={id} label={label} error={error} hint={hint}>
      <textarea
        id={id}
        className="admin-textarea"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        aria-invalid={Boolean(error)}
        onChange={(e) => onChange(e.target.value)}
      />
    </FormField>
  );
}

export function SelectInput({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  disabled,
  options,
}: BaseProps & {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  options: { value: string; label: string }[];
}) {
  return (
    <FormField id={id} label={label} error={error} hint={hint}>
      <select
        id={id}
        className="form-input admin-select"
        value={value}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}

export function FormBanner({ errors }: { errors: FieldErrors }) {
  if (!errors._form) return null;
  return (
    <p className="admin-form-banner" role="alert">
      {errors._form}
    </p>
  );
}
