/** Route builders, so link targets are defined once rather than composed at each call site. */

export const routes = {
  case: (id: string) => `/dashboard/cases/${encodeURIComponent(id)}`,
  statute: (id: string) => `/dashboard/legislation/${encodeURIComponent(id)}`,
  statuteSection: (id: string, section: string) =>
    `${routes.statute(id)}/sections/${encodeURIComponent(section)}`,
  instrument: (id: string) => `/dashboard/practice/instruments/${encodeURIComponent(id)}`,
  form: (id: string) => `/dashboard/practice/forms/${encodeURIComponent(id)}`,
  dictionaryEntry: (id: string) => `/dashboard/dictionary?entry=${encodeURIComponent(id)}`,
  reportBatch: (id: string) => `/dashboard/reports/${encodeURIComponent(id)}`,
};

/**
 * Citations record sections as printed — "s 68", "ss 222-224", "s 12(1)(a)". Only a
 * label naming exactly one section can be resolved to a section page; a range or an
 * unparseable label falls back to the statute itself.
 */
export function statuteHref(statuteId: string, sectionLabel?: string | null): string {
  const section = singleSectionNumber(sectionLabel);
  return section ? routes.statuteSection(statuteId, section) : routes.statute(statuteId);
}

function singleSectionNumber(label?: string | null): string | null {
  if (!label) return null;
  const trimmed = label.trim();
  if (/[-–—,&]|\band\b|\bto\b/i.test(trimmed)) return null;
  const match = /\d+[A-Za-z]*/.exec(trimmed);
  return match ? match[0] : null;
}
