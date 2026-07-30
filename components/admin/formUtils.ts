import { ApiError } from "@/lib/api/client";

/**
 * A message per field, plus `_form` for errors that belong to no single field.
 * Values are optional so a validator can assign the result of a check directly
 * without first testing whether it passed.
 */
export type FieldErrors = Record<string, string | undefined>;

export function emptyErrors(): FieldErrors {
  return {};
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.values(errors).some(Boolean);
}

/** Client-side required check before hitting the API. */
export function required(value: string, label: string): string | undefined {
  if (!value.trim()) return `${label} is required.`;
  return undefined;
}

export function requiredNumber(
  value: string,
  label: string,
  min?: number,
  max?: number,
): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return `${label} is required.`;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return `${label} must be a number.`;
  if (min !== undefined && n < min) return `${label} must be at least ${min}.`;
  if (max !== undefined && n > max) return `${label} must be at most ${max}.`;
  return undefined;
}

/**
 * Maps a server validation message onto known form fields when the API does not
 * return structured field errors.
 */
export function mapServerError(message: string, fields: string[]): FieldErrors {
  const lower = message.toLowerCase();
  for (const field of fields) {
    if (lower.includes(field.toLowerCase())) {
      return { [field]: message };
    }
  }
  return { _form: message };
}

export function errorFromUnknown(err: unknown, fields: string[]): FieldErrors {
  if (err instanceof ApiError) return mapServerError(err.message, fields);
  if (err instanceof Error) return { _form: err.message };
  return { _form: "Something went wrong." };
}

export function parseLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function joinLines(values: string[] | undefined): string {
  return values?.join("\n") ?? "";
}
