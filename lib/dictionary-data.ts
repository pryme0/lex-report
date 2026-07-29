import type { DictionaryEntry } from "./types";

export const dictionaryEntries: DictionaryEntry[] = [
  {
    id: "floating-charge",
    term: "Floating charge",
    kind: "term",
    definition: "A form of security over a class of a company's assets, present and future, that leaves the company free to deal with those assets in the ordinary course of business until the charge crystallises into a fixed charge.",
    appliedIn: ["SC-2034"],
  },
  {
    id: "crystallisation",
    term: "Crystallisation",
    kind: "term",
    definition: "The process by which a floating charge converts into a fixed charge on the occurrence of a specified event, such as the appointment of a receiver or the commencement of winding up.",
    appliedIn: ["SC-2034"],
  },
  {
    id: "perfection",
    term: "Perfection",
    kind: "term",
    definition: "The steps required by law — typically registration or notice — to make a security interest enforceable against third parties, not merely as between the parties to it.",
    appliedIn: ["SC-2034"],
  },
  {
    id: "covering-the-field",
    term: "Covering the field",
    kind: "term",
    definition: "A doctrine under which validly enacted federal legislation on a subject is treated as having occupied that regulatory space so exhaustively that inconsistent state legislation on the same subject is void.",
    appliedIn: ["CA-1188"],
  },
  {
    id: "audi-alteram-partem",
    term: "Audi alteram partem",
    kind: "maxim",
    definition: "\"Hear the other side.\" A foundational rule of natural justice requiring that no person be condemned or have their rights affected without a fair opportunity to be heard.",
    appliedIn: ["NIC-441"],
  },
  {
    id: "ubi-jus-ibi-remedium",
    term: "Ubi jus ibi remedium",
    kind: "maxim",
    definition: "\"Where there is a right, there is a remedy.\" The principle that the law will not recognise a legal right without also providing a means of enforcing or vindicating it.",
    appliedIn: [],
  },
  {
    id: "res-ipsa-loquitur",
    term: "Res ipsa loquitur",
    kind: "maxim",
    definition: "\"The thing speaks for itself.\" A rule of evidence permitting an inference of negligence from the mere occurrence of an event, where such an event would not ordinarily happen without negligence.",
    appliedIn: [],
  },
  {
    id: "ratio-decidendi",
    term: "Ratio decidendi",
    kind: "term",
    definition: "The point or points in a case which determine the outcome, and which form the binding precedent for later courts — as distinct from obiter dicta, remarks made in passing that are not binding.",
    appliedIn: ["SC-2034", "CA-1188", "NIC-441"],
  },
];
