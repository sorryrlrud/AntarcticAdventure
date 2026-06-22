function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function sealEmergence(relativeDistance: number, variant: number): number {
  const popDistance = 12 + variant * 7;
  return clamp01(1 - Math.abs(relativeDistance - popDistance) / 14);
}

export function fishJump(relativeDistance: number, variant: number): number {
  const apexDistance = 18 + variant * 3;
  return clamp01(1 - Math.abs(relativeDistance - apexDistance) / 34);
}
