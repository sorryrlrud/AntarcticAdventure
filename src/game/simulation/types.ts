import type { StageConfig } from "../content/stages";

export type GamePhase = "ready" | "running" | "paused" | "stage-clear" | "map" | "game-over";

export type CourseObjectKind = "hole" | "crevasse" | "seal" | "flag" | "fish";

export interface CourseObject {
  id: string;
  kind: CourseObjectKind;
  distance: number;
  lane: number;
  width: number;
  bonus: number;
  variant: number;
  collected: boolean;
  hit: boolean;
}

export interface PlayerState {
  lane: number;
  speed: number;
  jumpY: number;
  jumpVelocity: number;
  stumbleTimer: number;
  boostTimer: number;
}

export interface GameState {
  phase: GamePhase;
  seed: number;
  stageIndex: number;
  lap: number;
  stage: StageConfig;
  distanceTravelled: number;
  timeLeft: number;
  score: number;
  player: PlayerState;
  objects: CourseObject[];
  message: string;
  messageTimer: number;
  clearTimer: number;
  mapTimer: number;
}

export type GameEventType =
  | "start"
  | "jump"
  | "collect"
  | "hit"
  | "stage-clear"
  | "map"
  | "next-stage"
  | "game-over";

export interface GameEvent {
  type: GameEventType;
  points?: number;
  kind?: CourseObjectKind;
  message?: string;
}

export interface GameSnapshot {
  phase: GamePhase;
  score: number;
  stageIndex: number;
  stageCount: number;
  lap: number;
  stageName: string;
  timeLeft: number;
  speed: number;
  distanceLeft: number;
  message: string;
}
