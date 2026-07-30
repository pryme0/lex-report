// Case data now comes from the API (see lib/api.ts) — lexreport-server,
// seeded from this exact same dataset (prisma/seed.ts). Court Watch and the
// landing page's marketing stats below have no backend yet, so they stay mock.

export const alerts = [
  { court: "Supreme Court",   topic: "Land title priority",    change: "2 new decisions added with conflicting treatment notes", time: "18m" },
  { court: "Court of Appeal", topic: "Fintech licensing",      change: "Panel split detected across Lagos and Abuja divisions",  time: "42m" },
  { court: "NICN",            topic: "Constructive dismissal", change: "Draft digest ready for editorial review",                time: "2h" },
];

export const reportQueue = [
  { court: "SC",   topic: "Banking priority",   status: "Published" },
  { court: "CA",   topic: "Platform regulation", status: "Editorial review" },
  { court: "NICN", topic: "Workplace data",      status: "Digesting" },
  { court: "FHC",  topic: "Health privacy",      status: "Treatment check" },
];

export const coverageData = [
  { court: "Supreme Court",              years: "1946 – 2026", count: "11,420" },
  { court: "Court of Appeal",            years: "1976 – 2026", count: "18,640" },
  { court: "Federal High Court",         years: "1973 – 2026", count: "9,810" },
  { court: "National Industrial Court",  years: "2006 – 2026", count: "4,230" },
  { court: "Election Petition Tribunals",years: "1999 – 2023", count: "2,100" },
  { court: "State High Courts (select)", years: "1890 – 2026", count: "1,800+" },
];
