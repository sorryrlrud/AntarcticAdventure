import { createRng } from "./rng";
import { SCORE_VALUES } from "./scoring";
import type { CourseObject, CourseObjectKind } from "./types";

const LANES = [-0.78, -0.52, -0.26, 0, 0.26, 0.52, 0.78] as const;

function kindForRoll(roll: number, difficulty: number): CourseObjectKind {
  const hazardBias = Math.min(0.12, difficulty * 0.035);
  if (roll < 0.25 + hazardBias) return "hole";
  if (roll < 0.42 + hazardBias) return "crevasse";
  if (roll < 0.61 + hazardBias) return "seal";
  if (roll < 0.84) return "flag";
  return "fish";
}

export function createCourse(stageIndex: number, length: number, seed: number, lap = 0): CourseObject[] {
  const rng = createRng(seed + stageIndex * 9973 + lap * 7193);
  const objects: CourseObject[] = [];
  let distance = 240;
  let objectIndex = 0;
  const difficulty = stageIndex * 0.07 + lap * 0.42;
  const spacingMin = Math.max(86, 120 - lap * 8 - stageIndex * 2);
  const spacingMax = Math.max(124, 220 - lap * 12 - stageIndex * 4);

  while (distance < length - 180) {
    const kind = kindForRoll(rng.next(), difficulty);
    const variant = rng.int(0, 3);
    const lane = kind === "crevasse" && rng.next() < 0.46 ? rng.pick([-0.34, 0, 0.34]) : rng.pick(LANES);
    const width = kind === "crevasse" ? rng.pick([0.58, 0.72, 0.9]) : kind === "seal" ? 0.3 : 0.24;
    const bonus = kind === "flag" ? SCORE_VALUES.flag : kind === "fish" ? SCORE_VALUES.fish : 0;

    objects.push({
      id: `${stageIndex}-${objectIndex}`,
      kind,
      distance,
      lane,
      width,
      bonus,
      variant,
      collected: false,
      hit: false
    });

    distance += rng.int(spacingMin, spacingMax);
    objectIndex += 1;
  }

  for (let marker = 900; marker < length - 400; marker += 1200) {
    objects.push({
      id: `${stageIndex}-gate-${marker}`,
      kind: "flag",
      distance: marker + rng.int(-70, 70),
      lane: rng.pick([-0.62, 0.62]),
      width: 0.24,
      bonus: SCORE_VALUES.flag,
      variant: 2,
      collected: false,
      hit: false
    });
  }

  return objects.sort((a, b) => a.distance - b.distance);
}
