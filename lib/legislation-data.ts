import type { Statute } from "./types";

export const statutes: Statute[] = [
  {
    id: "cama-2020",
    title: "Companies and Allied Matters Act 2020",
    shortTitle: "CAMA 2020",
    year: 2020,
    sections: [
      {
        number: "222",
        heading: "Registration of charges",
        text: "A charge created by a company shall, so far as any security on the company's property or undertaking is thereby conferred, be void against the liquidator and any creditor of the company, unless the prescribed particulars of the charge are delivered to or received by the Commission for registration.",
      },
      {
        number: "223",
        heading: "Priority of charges",
        text: "Charges registered under this Act shall, in the case of debentures entitling the holder by virtue of any instrument to a charge on the same property, have priority in accordance with the order in which they are registered.",
      },
      {
        number: "224",
        heading: "Crystallisation of floating charges",
        text: "A floating charge shall crystallise into a fixed charge on the happening of the event specified in the debenture, including the appointment of a receiver, the commencement of winding up, or cessation of the company's business.",
      },
    ],
  },
  {
    id: "constitution-1999",
    title: "Constitution of the Federal Republic of Nigeria 1999",
    shortTitle: "1999 Constitution",
    year: 1999,
    sections: [
      {
        number: "4",
        heading: "Legislative powers",
        text: "The legislative powers of the Federation shall be vested in a National Assembly, and the legislative powers of a State shall be vested in the House of Assembly of the State.",
      },
    ],
  },
  {
    id: "ndpa-2023",
    title: "Nigeria Data Protection Act 2023",
    shortTitle: "Nigeria Data Protection Act 2023",
    year: 2023,
    sections: [
      {
        number: "24",
        heading: "Lawful basis for processing",
        text: "Personal data shall not be processed unless there is a lawful basis for the processing, including consent, contractual necessity, or a legitimate interest that is not overridden by the rights of the data subject.",
      },
      {
        number: "25",
        heading: "Processing in the employment context",
        text: "An employer who processes the personal data of an employee for monitoring purposes shall do so on an explicit, proportionate, and lawful basis, and shall notify the employee of the monitoring policy.",
      },
    ],
  },
  {
    id: "labour-act",
    title: "Labour Act (Cap. L1, Laws of the Federation of Nigeria 2004)",
    shortTitle: "Labour Act",
    year: 2004,
    sections: [
      {
        number: "11",
        heading: "Termination of contract",
        text: "Either party to a contract of employment may terminate the contract on the expiration of notice given by that party to the other of an intention to do so.",
      },
    ],
  },
];
