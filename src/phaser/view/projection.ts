import { VIEW_DISTANCE } from "../../game/simulation/game";

export interface ProjectedPoint {
  x: number;
  y: number;
  scale: number;
  depth: number;
  laneWidth: number;
}

export function projectTrackPoint(lane: number, relativeDistance: number, width: number, height: number): ProjectedPoint {
  const horizon = height * 0.36;
  const floor = height * 0.86;
  const progress = Math.max(0, Math.min(1, 1 - relativeDistance / VIEW_DISTANCE));
  const eased = progress * progress;
  const laneWidth = width * (0.12 + 0.52 * eased);
  return {
    x: width * 0.5 + lane * laneWidth,
    y: horizon + eased * (floor - horizon),
    scale: 0.18 + eased * 1.55,
    depth: progress,
    laneWidth
  };
}
