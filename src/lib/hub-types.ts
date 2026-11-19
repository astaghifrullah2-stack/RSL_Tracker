export type FinderEntry = {
  key: string;
  type: "Player" | "Team" | "Competition" | "Page";
  title: string;
  detail: string;
  href: string;
  keywords: string;
  image?: string | null;
  playerId?: number;
};

export type Leader = {
  id: number;
  rank: number;
  name: string;
  avatar: string;
  club: string;
  position: string;
  className: string | null;
  value: number;
};

export type LeaderBoard = {
  id: "rating" | "index" | "trophies" | "goals";
  label: string;
  source: string;
  unit: string;
  href: string;
  rows: Leader[];
};
