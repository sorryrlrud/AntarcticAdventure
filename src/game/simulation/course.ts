import { createRng } from "./rng";
import type { CourseObject, CourseObjectKind } from "./types";

const LANES = [-0.78, -0.52, -0.26, 0, 0.26, 0.52, 0.78] as const;

function kindForRoll(roll: number): CourseObjectKind {
  if (roll < 0.25) return "hole";
  if (roll < 0.42) return "crevasse";
  if (roll < 0.61) return "seal";
  if (roll < 0.84) return "flag";
  return "fish";
}

export function createCourse(stageIndex: number, length: number, seed: number): CourseObject[] {
  const rng = createRng(seed + stageIndex * 9973);
  const objects: CourseObject[] = [];
  let distance = 240;
  let objectIndex = 0;

  while (distance < length - 180) {
    const kind = kindForRoll(rng.next());
    const variant = rng.int(0, 3);
    const lane = kind === "crevasse" && rng.next() < 0.46 ? rng.pick([-0.34, 0, 0.34]) : rng.pick(LANES);
    const width = kind === "crevasse" ? rng.pick([0.58, 0.72, 0.9]) : kind === "seal" ? 0.3 : 0.24;
    const bonus =
      kind === "flag" ? [500, 600, 700, 1000][variant] : kind === "fish" ? [300, 500, 700, 1000][variant] : 0;

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

    distance += rng.int(120, Math.max(150, 220 - stageIndex * 4));
    objectIndex += 1;
  }

  for (let marker = 900; marker < length - 400; marker += 1200) {
    objects.push({
      id: `${stageIndex}-gate-${marker}`,
      kind: "flag",
      distance: marker + rng.int(-70, 70),
      lane: rng.pick([-0.62, 0.62]),
      width: 0.24,
      bonus: 700,
      variant: 2,
      collected: false,
      hit: false
    });
  }

  return objects.sort((a, b) => a.distance - b.distance);
}
