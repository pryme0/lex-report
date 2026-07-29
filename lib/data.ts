import type { CaseItem } from "./types";

export const cases: CaseItem[] = [
  {
    id: "SC-2034",
    title: "Zenith Trustees Ltd v. Adebayo & Sons Holdings",
    citation: "(2026) 4 LRR 221 (SC)",
    court: "Supreme Court", year: 2026,
    judges: "Agim JSC; Ogunwumiju JSC; Garba JSC",
    area: "Banking and secured credit", digestArea: "Banking & Secured Credit → Floating Charges", posture: "Appeal allowed in part",
    ratio: "A floating charge crystallises on receivership, but priority still turns on perfection, notice, and the time third-party rights attached.",
    treatment: "Followed", strength: 96, readTime: "11 min",
    facts: "The lender appointed a receiver after default. The borrower had already transferred assets to a purchaser who had notice of the lender's debenture.",
    holding: "The Supreme Court held that notice alone did not cure defects in perfection, but the purchaser could not rely on priority where the transfer was completed after crystallisation.",
    issues: ["Priority of floating charge", "Effect of notice", "Crystallisation after receivership"],
    citedCases: [{ title: "U.B.N. Plc v. Tropic Foods Ltd" }, { title: "Intercity Bank v. Fashola" }],
    citedStatutes: [{ title: "CAMA 2020", section: "ss 222–224" }],
    directHistory: [
      { court: "Federal High Court", outcome: "Reversed", citation: "(2023) FHC/L/CS/1187/2023", year: 2023 },
      { court: "Court of Appeal", outcome: "Affirmed", citation: "(2025) 7 LRR 340 (CA)", year: 2025 },
    ],
    citingCases: [
      { title: "Trustbridge Capital v. Adeyemi Estates", citation: "(2026) 5 LRR 88 (CA)", treatment: "Followed", year: 2026 },
      { title: "Fidelity Assets Ltd v. Okonjo Receivers", citation: "(2026) 9 LRR 12 (FHC)", treatment: "Followed", year: 2026 },
    ],
  },
  {
    id: "CA-1188",
    title: "Attorney-General of Lagos State v. Westbridge Mobility Plc",
    citation: "(2025) 19 LRR 73 (CA)",
    court: "Court of Appeal", year: 2025,
    judges: "Barka JCA; Tukur JCA; Obaseki-Adejumo JCA",
    area: "Constitutional and regulatory powers", digestArea: "Constitutional & Administrative Law → State Regulatory Powers", posture: "Cross-appeal dismissed",
    ratio: "A state regulator may impose platform safety duties where federal legislation has not exhaustively occupied the field.",
    treatment: "Distinguished", strength: 91, readTime: "9 min",
    facts: "A mobility platform challenged state compliance rules, arguing federal transport and digital commerce laws had covered the field.",
    holding: "The Court of Appeal upheld concurrent safety obligations where state rules were operational and not inconsistent with federal law.",
    issues: ["Covering the field", "Platform regulation", "State public safety powers"],
    citedCases: [{ title: "A.G. Ogun State v. Aberuagba" }, { title: "A.G. Lagos State v. Eko Hotels" }],
    citedStatutes: [{ title: "1999 Constitution", section: "s 4" }],
    directHistory: [
      { court: "Federal High Court", outcome: "Affirmed", citation: "(2024) FHC/L/CS/560/2024", year: 2024 },
    ],
    citingCases: [
      { title: "Ride-Share Nigeria Ltd v. Kano State Government", citation: "(2026) 3 LRR 210 (CA)", treatment: "Distinguished", year: 2026 },
      { title: "A.G. Rivers State v. Swiftlink Logistics", citation: "(2025) 22 LRR 401 (CA)", treatment: "Followed", year: 2025 },
    ],
  },
  {
    id: "NIC-441",
    title: "Okorie v. Meridian Energy Services",
    citation: "(2026) 2 LRR 590 (NICN)",
    court: "National Industrial Court", year: 2026,
    judges: "Kanyip PNICN",
    area: "Employment and workplace data", digestArea: "Labour & Employment → Workplace Data Privacy", posture: "Claim partly granted",
    ratio: "Employee monitoring policies must be explicit, proportionate, and supported by a lawful basis before disciplinary reliance.",
    treatment: "Followed", strength: 88, readTime: "7 min",
    facts: "An employee was dismissed after internal monitoring tools flagged alleged misconduct. The policy was vague and had not been acknowledged.",
    holding: "The court found the dismissal procedurally unfair and awarded limited compensation because misconduct was not independently proved.",
    issues: ["Workplace surveillance", "Procedural fairness", "Data protection in employment"],
    citedCases: [{ title: "Aloysius v. Diamond Bank Plc" }],
    citedStatutes: [{ title: "Nigeria Data Protection Act 2023" }, { title: "Labour Act" }],
    directHistory: [],
    citingCases: [],
  },
];

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
