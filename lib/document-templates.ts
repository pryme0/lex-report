export type FieldType = "text" | "textarea" | "date" | "select" | "party-list" | "numbered-list";

export interface TemplateField {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: string[]; // for select type
  rows?: number; // for textarea
}

export interface TemplateSection {
  id: string;
  title: string;
  fields: TemplateField[];
}

export interface DocumentTemplate {
  id: string;
  name: string;
  category: "pleading" | "motion" | "affidavit" | "appeal" | "brief" | "originating";
  description: string;
  headerFields: TemplateField[];
  sections: TemplateSection[];
  signatureLabel: string;
}

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: "written-address",
    name: "Written Address",
    category: "brief",
    description: "Final written submission to the court",
    headerFields: [
      { id: "court", label: "Court", type: "text", placeholder: "e.g. Supreme Court", required: true },
      { id: "location", label: "Holden at", type: "text", placeholder: "e.g. Abuja" },
      { id: "suitNo", label: "Suit Number", type: "text", placeholder: "e.g. SC/123/2026", required: true },
      { id: "appellant", label: "Appellant / Claimant", type: "text", required: true },
      { id: "respondent", label: "Respondent / Defendant", type: "text", required: true },
    ],
    sections: [
      {
        id: "intro",
        title: "Introduction",
        fields: [
          { id: "intro", label: "Introduction", type: "textarea", placeholder: "Set out the nature of the proceedings, the relief sought, and a brief summary of the facts…", rows: 5 },
        ],
      },
      {
        id: "issues",
        title: "Issues for Determination",
        fields: [
          { id: "issues", label: "Issues", type: "numbered-list", placeholder: "State each issue for determination" },
        ],
      },
      {
        id: "arguments",
        title: "Arguments",
        fields: [
          { id: "arguments", label: "Arguments", type: "textarea", placeholder: "Present your arguments on each issue…", rows: 10 },
        ],
      },
      {
        id: "conclusion",
        title: "Conclusion",
        fields: [
          { id: "conclusion", label: "Conclusion", type: "textarea", placeholder: "Summarise your arguments and reiterate the relief sought…", rows: 4 },
        ],
      },
      {
        id: "relief",
        title: "Relief Sought",
        fields: [
          { id: "relief", label: "Relief", type: "textarea", placeholder: "State precisely the orders you are inviting the court to make…", rows: 4 },
        ],
      },
    ],
    signatureLabel: "Counsel for the Appellant",
  },
  {
    id: "statement-of-claim",
    name: "Statement of Claim",
    category: "pleading",
    description: "Originating pleading setting out the claimant's case",
    headerFields: [
      { id: "court", label: "Court", type: "text", placeholder: "e.g. Federal High Court", required: true },
      { id: "division", label: "Division", type: "text", placeholder: "e.g. Lagos Division" },
      { id: "suitNo", label: "Suit Number", type: "text", placeholder: "e.g. FHC/L/CS/123/2026", required: true },
      { id: "claimant", label: "Claimant", type: "text", required: true },
      { id: "defendant", label: "Defendant", type: "text", required: true },
    ],
    sections: [
      {
        id: "parties",
        title: "The Parties",
        fields: [
          { id: "claimantDescription", label: "Description of Claimant", type: "textarea", placeholder: "The Claimant is a company incorporated under the laws of the Federal Republic of Nigeria…", rows: 3 },
          { id: "defendantDescription", label: "Description of Defendant", type: "textarea", placeholder: "The Defendant is…", rows: 3 },
        ],
      },
      {
        id: "facts",
        title: "Facts",
        fields: [
          { id: "facts", label: "Statement of Facts", type: "numbered-list", placeholder: "State each material fact" },
        ],
      },
      {
        id: "claims",
        title: "Claims",
        fields: [
          { id: "claims", label: "Reliefs Claimed", type: "numbered-list", placeholder: "State each relief sought" },
        ],
      },
    ],
    signatureLabel: "Counsel for the Claimant",
  },
  {
    id: "statement-of-defence",
    name: "Statement of Defence",
    category: "pleading",
    description: "Response to the Statement of Claim",
    headerFields: [
      { id: "court", label: "Court", type: "text", required: true },
      { id: "division", label: "Division", type: "text" },
      { id: "suitNo", label: "Suit Number", type: "text", required: true },
      { id: "claimant", label: "Claimant", type: "text", required: true },
      { id: "defendant", label: "Defendant", type: "text", required: true },
    ],
    sections: [
      {
        id: "response",
        title: "Response to Statement of Claim",
        fields: [
          { id: "admissions", label: "Admissions", type: "numbered-list", placeholder: "Paragraphs admitted" },
          { id: "denials", label: "Denials", type: "numbered-list", placeholder: "Paragraphs denied and reasons" },
          { id: "noKnowledge", label: "No Knowledge", type: "numbered-list", placeholder: "Paragraphs not admitted for lack of knowledge" },
        ],
      },
      {
        id: "defence",
        title: "Defence",
        fields: [
          { id: "defenceFacts", label: "Facts in Defence", type: "numbered-list", placeholder: "State facts in support of defence" },
        ],
      },
    ],
    signatureLabel: "Counsel for the Defendant",
  },
  {
    id: "motion-on-notice",
    name: "Motion on Notice",
    category: "motion",
    description: "Application to the court with notice to other parties",
    headerFields: [
      { id: "court", label: "Court", type: "text", required: true },
      { id: "division", label: "Division", type: "text" },
      { id: "suitNo", label: "Suit Number", type: "text", required: true },
      { id: "applicant", label: "Applicant / Movant", type: "text", required: true },
      { id: "respondent", label: "Respondent", type: "text", required: true },
    ],
    sections: [
      {
        id: "orders",
        title: "Orders Sought",
        fields: [
          { id: "orders", label: "Prayers", type: "numbered-list", placeholder: "State each order sought" },
        ],
      },
      {
        id: "grounds",
        title: "Grounds",
        fields: [
          { id: "grounds", label: "Grounds of Application", type: "numbered-list", placeholder: "State each ground" },
        ],
      },
    ],
    signatureLabel: "Counsel for the Applicant",
  },
  {
    id: "affidavit",
    name: "Affidavit in Support",
    category: "affidavit",
    description: "Sworn statement in support of an application",
    headerFields: [
      { id: "court", label: "Court", type: "text", required: true },
      { id: "suitNo", label: "Suit Number", type: "text", required: true },
      { id: "applicant", label: "Applicant", type: "text", required: true },
      { id: "respondent", label: "Respondent", type: "text", required: true },
      { id: "deponentName", label: "Deponent Name", type: "text", required: true },
      { id: "deponentAddress", label: "Deponent Address", type: "text" },
      { id: "deponentOccupation", label: "Deponent Occupation", type: "text" },
    ],
    sections: [
      {
        id: "averments",
        title: "Averments",
        fields: [
          { id: "averments", label: "Sworn Statements", type: "numbered-list", placeholder: "That I am the Applicant/a staff of the Applicant..." },
        ],
      },
      {
        id: "verification",
        title: "Verification",
        fields: [
          { id: "verification", label: "Verification Clause", type: "textarea", placeholder: "That I depose to this Affidavit in good faith believing the contents to be true and correct...", rows: 3 },
        ],
      },
    ],
    signatureLabel: "Deponent",
  },
  {
    id: "counter-affidavit",
    name: "Counter Affidavit",
    category: "affidavit",
    description: "Sworn response to an affidavit",
    headerFields: [
      { id: "court", label: "Court", type: "text", required: true },
      { id: "suitNo", label: "Suit Number", type: "text", required: true },
      { id: "applicant", label: "Applicant", type: "text", required: true },
      { id: "respondent", label: "Respondent", type: "text", required: true },
      { id: "deponentName", label: "Deponent Name", type: "text", required: true },
    ],
    sections: [
      {
        id: "response",
        title: "Response to Applicant's Affidavit",
        fields: [
          { id: "response", label: "Counter Statements", type: "numbered-list", placeholder: "That I have read the Affidavit in Support..." },
        ],
      },
    ],
    signatureLabel: "Deponent",
  },
  {
    id: "notice-of-appeal",
    name: "Notice of Appeal",
    category: "appeal",
    description: "Notice initiating an appeal",
    headerFields: [
      { id: "court", label: "Appellate Court", type: "text", placeholder: "e.g. Court of Appeal", required: true },
      { id: "lowerCourt", label: "Lower Court", type: "text", placeholder: "Court appealed from", required: true },
      { id: "suitNo", label: "Appeal Number", type: "text" },
      { id: "lowerCourtSuitNo", label: "Lower Court Suit Number", type: "text", required: true },
      { id: "appellant", label: "Appellant", type: "text", required: true },
      { id: "respondent", label: "Respondent", type: "text", required: true },
      { id: "judgmentDate", label: "Date of Judgment", type: "date", required: true },
    ],
    sections: [
      {
        id: "decision",
        title: "Decision Appealed Against",
        fields: [
          { id: "decisionSummary", label: "Summary of Decision", type: "textarea", placeholder: "The Appellant being dissatisfied with the judgment/ruling of...", rows: 4 },
        ],
      },
      {
        id: "grounds",
        title: "Grounds of Appeal",
        fields: [
          { id: "grounds", label: "Grounds", type: "numbered-list", placeholder: "State each ground of appeal" },
        ],
      },
      {
        id: "reliefs",
        title: "Reliefs Sought",
        fields: [
          { id: "reliefs", label: "Reliefs", type: "numbered-list", placeholder: "State reliefs sought from the appellate court" },
        ],
      },
    ],
    signatureLabel: "Counsel for the Appellant",
  },
  {
    id: "appellants-brief",
    name: "Appellant's Brief",
    category: "appeal",
    description: "Written argument of the appellant",
    headerFields: [
      { id: "court", label: "Court", type: "text", required: true },
      { id: "suitNo", label: "Appeal Number", type: "text", required: true },
      { id: "appellant", label: "Appellant", type: "text", required: true },
      { id: "respondent", label: "Respondent", type: "text", required: true },
    ],
    sections: [
      {
        id: "issues",
        title: "Issues for Determination",
        fields: [
          { id: "issues", label: "Issues", type: "numbered-list", placeholder: "Distilled issues for determination" },
        ],
      },
      {
        id: "summary",
        title: "Summary of Facts",
        fields: [
          { id: "summary", label: "Brief Statement of Facts", type: "textarea", rows: 6 },
        ],
      },
      {
        id: "arguments",
        title: "Arguments",
        fields: [
          { id: "arguments", label: "Arguments on Issues", type: "textarea", placeholder: "Present arguments on each issue...", rows: 12 },
        ],
      },
      {
        id: "conclusion",
        title: "Conclusion",
        fields: [
          { id: "conclusion", label: "Conclusion", type: "textarea", rows: 4 },
        ],
      },
    ],
    signatureLabel: "Counsel for the Appellant",
  },
  {
    id: "respondents-brief",
    name: "Respondent's Brief",
    category: "appeal",
    description: "Written argument of the respondent",
    headerFields: [
      { id: "court", label: "Court", type: "text", required: true },
      { id: "suitNo", label: "Appeal Number", type: "text", required: true },
      { id: "appellant", label: "Appellant", type: "text", required: true },
      { id: "respondent", label: "Respondent", type: "text", required: true },
    ],
    sections: [
      {
        id: "issues",
        title: "Issues for Determination",
        fields: [
          { id: "issues", label: "Issues (as formulated or re-formulated)", type: "numbered-list" },
        ],
      },
      {
        id: "summary",
        title: "Summary of Facts",
        fields: [
          { id: "summary", label: "Brief Statement of Facts", type: "textarea", rows: 6 },
        ],
      },
      {
        id: "arguments",
        title: "Arguments",
        fields: [
          { id: "arguments", label: "Arguments in Response", type: "textarea", rows: 12 },
        ],
      },
      {
        id: "conclusion",
        title: "Conclusion",
        fields: [
          { id: "conclusion", label: "Conclusion", type: "textarea", rows: 4 },
        ],
      },
    ],
    signatureLabel: "Counsel for the Respondent",
  },
  {
    id: "originating-summons",
    name: "Originating Summons",
    category: "originating",
    description: "Application to court for determination of questions of law or construction",
    headerFields: [
      { id: "court", label: "Court", type: "text", required: true },
      { id: "division", label: "Division", type: "text" },
      { id: "suitNo", label: "Suit Number", type: "text" },
      { id: "applicant", label: "Applicant", type: "text", required: true },
      { id: "respondent", label: "Respondent", type: "text", required: true },
    ],
    sections: [
      {
        id: "questions",
        title: "Questions for Determination",
        fields: [
          { id: "questions", label: "Questions", type: "numbered-list", placeholder: "State each question for the court's determination" },
        ],
      },
      {
        id: "reliefs",
        title: "Reliefs Sought",
        fields: [
          { id: "reliefs", label: "Reliefs", type: "numbered-list", placeholder: "State each relief consequent upon the determination" },
        ],
      },
      {
        id: "grounds",
        title: "Grounds",
        fields: [
          { id: "grounds", label: "Grounds", type: "numbered-list", placeholder: "State the grounds of the application" },
        ],
      },
    ],
    signatureLabel: "Counsel for the Applicant",
  },
];

export const TEMPLATE_CATEGORIES = [
  { id: "pleading", name: "Pleadings" },
  { id: "motion", name: "Motions" },
  { id: "affidavit", name: "Affidavits" },
  { id: "appeal", name: "Appeals" },
  { id: "brief", name: "Briefs" },
  { id: "originating", name: "Originating Processes" },
] as const;

export function getTemplateById(id: string): DocumentTemplate | undefined {
  return DOCUMENT_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: string): DocumentTemplate[] {
  return DOCUMENT_TEMPLATES.filter((t) => t.category === category);
}
