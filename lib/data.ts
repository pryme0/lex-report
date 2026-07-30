/**
 * Court Watch is deliberately out of scope for the API, so its feed is still local sample data.
 * Every other screen now reads from the LexReport API via `lib/api`.
 */
export const alerts = [
  { court: "Supreme Court",   topic: "Land title priority",    change: "2 new decisions added with conflicting treatment notes", time: "18m" },
  { court: "Court of Appeal", topic: "Fintech licensing",      change: "Panel split detected across Lagos and Abuja divisions",  time: "42m" },
  { court: "NICN",            topic: "Constructive dismissal", change: "Draft digest ready for editorial review",                time: "2h" },
];
