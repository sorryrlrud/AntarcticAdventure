export interface StageConfig {
  index: number;
  name: string;
  flagName: string;
  length: number;
  timeLimit: number;
  accent: number;
  sky: number;
}

export const STAGES: StageConfig[] = [
  { index: 0, name: "Australia Base", flagName: "AUS", length: 4200, timeLimit: 70, accent: 0x1c57a6, sky: 0x70cdf7 },
  { index: 1, name: "France Camp", flagName: "FRA", length: 4500, timeLimit: 72, accent: 0xececf0, sky: 0x7fd7ff },
  { index: 2, name: "Aurora Station", flagName: "AUS", length: 4800, timeLimit: 74, accent: 0xffd34a, sky: 0x78d2ff },
  { index: 3, name: "New Zealand Hut", flagName: "NZL", length: 5000, timeLimit: 76, accent: 0xd33f49, sky: 0x62c9ee },
  { index: 4, name: "Pole Marker", flagName: "SOUTH", length: 5300, timeLimit: 78, accent: 0xffffff, sky: 0x8adffc },
  { index: 5, name: "Liberty Dome", flagName: "USA", length: 5600, timeLimit: 80, accent: 0xe44646, sky: 0x74d9f2 },
  { index: 6, name: "Pampa Shelter", flagName: "ARG", length: 5900, timeLimit: 82, accent: 0x6bc6ef, sky: 0x66c2ee },
  { index: 7, name: "Eagle Relay", flagName: "USA", length: 6200, timeLimit: 84, accent: 0x244c66, sky: 0x77cef5 },
  { index: 8, name: "Britannia Camp", flagName: "GBR", length: 6500, timeLimit: 86, accent: 0x3465d9, sky: 0x83daf5 },
  { index: 9, name: "Sunrise Base", flagName: "JPN", length: 6800, timeLimit: 88, accent: 0xf25546, sky: 0x91e6ff }
];

export const TOTAL_STAGES = STAGES.length;

export function stageForIndex(stageIndex: number): StageConfig {
  return STAGES[((stageIndex % TOTAL_STAGES) + TOTAL_STAGES) % TOTAL_STAGES];
}
