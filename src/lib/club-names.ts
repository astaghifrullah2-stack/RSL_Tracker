// Canonical club naming used by sheets, transfers and the arcade dataset so
// "REAL MADRID C.F." (sheet) and "Real Madrid C.F." (teams table) mean the same club.

const CANONICAL: Record<string, string> = {
  villareal: "Villareal",
  villarreal: "Villareal",
  girona: "Girona",
  "real madrid": "Real Madrid C.F.",
  "real madrid c.f.": "Real Madrid C.F.",
  "real madrid cf": "Real Madrid C.F.",
  barcelona: "F.C. Barcelona",
  "f.c. barcelona": "F.C. Barcelona",
  "fc barcelona": "F.C. Barcelona",
  "sporting cp": "Sporting CP",
  "sporting": "Sporting CP",
  "atletico madrid": "Atletico Madrid",
  "atlético madrid": "Atletico Madrid",
  "athletic club": "Athletic Club",
  ath: "Athletic Club",
  "f.c. porto": "F.C. Porto",
  porto: "F.C. Porto",
  "a.c. milan": "A.C. Milan",
  "ac milan": "A.C. Milan",
  milan: "A.C. Milan",
  "s.s. lazio": "S.S. Lazio",
  lazio: "S.S. Lazio",
  "como 1907": "Como 1907",
  como: "Como 1907",
  "bologna f.c.": "Bologna F.C.",
  bologna: "Bologna F.C.",
  "inter milan": "Inter Milan",
  inter: "Inter Milan",
  "atalanta b.c.": "Atalanta B.C.",
  atalanta: "Atalanta B.C.",
  "a.c.f. fiorentina": "A.C.F. Fiorentina",
  fiorentina: "A.C.F. Fiorentina",
  "s.s.c. napoli": "S.S.C. Napoli",
  napoli: "S.S.C. Napoli",
  juventus: "Juventus",
  netherlands: "Netherlands",
  belgium: "Belgium",
  spain: "Spain",
  italy: "Italy",
  portugal: "Portugal",
};

const FREE_LABELS = new Set([
  "",
  "free agent",
  "free agents",
  "fa",
  "—",
  "-",
  "none",
  "tbd",
]);

const CLUB_SHORT: Record<string, string> = {
  Villareal: "VIL",
  Girona: "GIR",
  "Real Madrid C.F.": "RMA",
  "F.C. Barcelona": "BAR",
  "Sporting CP": "SPO",
  "Atletico Madrid": "ATM",
  "Athletic Club": "ATH",
  "F.C. Porto": "POR",
  "A.C. Milan": "MIL",
  "S.S. Lazio": "LAZ",
  "Como 1907": "COM",
  "Bologna F.C.": "BOL",
  "Inter Milan": "INT",
  "Atalanta B.C.": "ATA",
  "A.C.F. Fiorentina": "FIO",
  "S.S.C. Napoli": "NAP",
  Juventus: "JUV",
  Netherlands: "NED",
  Belgium: "BEL",
  Spain: "ESP",
  Italy: "ITA",
  Portugal: "PRT",
  "Free Agent": "FA",
  "No record": "—",
};

const CLUB_COLOR: Record<string, string> = {
  Villareal: "#f7d21e",
  Girona: "#d82333",
  "Real Madrid C.F.": "#f1d6a0",
  "F.C. Barcelona": "#ad1644",
  "Sporting CP": "#25a868",
  "Atletico Madrid": "#e02f3a",
  "Athletic Club": "#e0242b",
  "F.C. Porto": "#1f5fbf",
  "A.C. Milan": "#db262c",
  "S.S. Lazio": "#92c5ed",
  "Como 1907": "#377ac4",
  "Bologna F.C.": "#a21c26",
  "Inter Milan": "#2563eb",
  "Atalanta B.C.": "#1e40af",
  "A.C.F. Fiorentina": "#7c3aed",
  "S.S.C. Napoli": "#38bdf8",
  Juventus: "#94a3b8",
  Netherlands: "#ff7518",
  Belgium: "#f7c739",
  Spain: "#d82333",
  Italy: "#1f5fbf",
  Portugal: "#16a34a",
  "Free Agent": "#64748b",
  "No record": "#334155",
};

const NATION_SET = new Set(["Netherlands", "Belgium", "Spain", "Italy", "Portugal"]);

/** Canonical club name, preserving unknown historical teams as archive text. */
export function canonicalClubName(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (FREE_LABELS.has(trimmed.toLowerCase())) return null;
  return CANONICAL[trimmed.toLowerCase()] ?? trimmed;
}

export function clubShortName(name: string | null | undefined): string {
  if (!name) return "FA";
  const letters = name.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();
  return CLUB_SHORT[name] ?? (letters || name.slice(0, 3).toUpperCase());
}

export function clubColor(name: string | null | undefined): string {
  if (!name) return "#64748b";
  return CLUB_COLOR[name] ?? "#64748b";
}

export function isNationClub(name: string | null | undefined): boolean {
  return !!name && NATION_SET.has(name);
}

export const NATION_COLS = ["Netherlands", "Belgium", "Spain", "Italy", "Portugal"] as const;
