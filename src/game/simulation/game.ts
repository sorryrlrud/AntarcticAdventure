import { STAGES, stageForIndex, TOTAL_STAGES } from "../content/stages";
import type { ActionState } from "../input/actions";
import { createCourse } from "./course";
import { SCORE_VALUES } from "./scoring";
import type { CourseObject, GameEvent, GameSnapshot, GameState } from "./types";

const MIN_SPEED = 120;
const CRUISE_SPEED = 245;
const MAX_SPEED = 390;
const VIEW_DISTANCE = 1120;

export { VIEW_DISTANCE };

function timeLimitFor(stageTimeLimit: number, lap: number): number {
  return Math.max(45, stageTimeLimit - lap * 4);
}

function makeStageState(seed: number, stageIndex: number, lap: number, score: number, hiScore: number): GameState {
  const stage = stageForIndex(stageIndex);
  return {
    phase: "ready",
    seed,
    stageIndex,
    lap,
    stage,
    distanceTravelled: 0,
    timeLeft: timeLimitFor(stage.timeLimit, lap),
    score,
    hiScore: Math.max(hiScore, score),
    player: {
      lane: 0,
      speed: CRUISE_SPEED,
      jumpY: 0,
      jumpVelocity: 0,
      stumbleTimer: 0,
      boostTimer: 0
    },
    objects: createCourse(stageIndex, stage.length, seed, lap),
    message: "ENTER 또는 START로 출발",
    messageTimer: 0,
    clearTimer: 0,
    mapTimer: 0
  };
}

export function createInitialState(seed = 1983): GameState {
  return makeStageState(seed, 0, 0, 0, 0);
}

export function createInitialStateWithHighScore(seed = 1983, hiScore = 0): GameState {
  return makeStageState(seed, 0, 0, 0, hiScore);
}

function awardPoints(state: GameState, points: number): void {
  state.score += points;
  state.hiScore = Math.max(state.hiScore, state.score);
}

export function startOrContinue(state: GameState): GameEvent[] {
  if (state.phase === "ready") {
    state.phase = "running";
    state.message = "남극 기지로 출발!";
    state.messageTimer = 1.6;
    return [{ type: "start", message: state.message }];
  }

  if (state.phase === "game-over") {
    const next = makeStageState(state.seed + 1, 0, 0, 0, state.hiScore);
    Object.assign(state, next, { phase: "running", message: "다시 출발!" });
    state.messageTimer = 1.6;
    return [{ type: "start", message: state.message }];
  }

  if (state.phase === "paused") {
    state.phase = "running";
    state.message = "재개";
    state.messageTimer = 0.8;
    return [];
  }

  if (state.phase === "stage-clear") {
    return advanceStage(state);
  }

  if (state.phase === "map") {
    state.phase = "running";
    state.message = "READY";
    state.messageTimer = 0.8;
    return [{ type: "start", message: state.message }];
  }

  return [];
}

export function togglePause(state: GameState): void {
  if (state.phase === "running") {
    state.phase = "paused";
    state.message = "일시정지";
  } else if (state.phase === "paused") {
    state.phase = "running";
    state.message = "재개";
    state.messageTimer = 0.8;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function collideLane(playerLane: number, object: CourseObject): boolean {
  return Math.abs(playerLane - object.lane) <= object.width + 0.12;
}

function addMessage(state: GameState, message: string, seconds = 1.1): void {
  state.message = message;
  state.messageTimer = seconds;
}

function handleCollision(state: GameState, object: CourseObject, events: GameEvent[]): void {
  if (object.collected || object.hit) return;

  const isJumpingHigh = state.player.jumpY > 42;
  const isJumpingVeryHigh = state.player.jumpY > 72;

  if (object.kind === "flag") {
    object.collected = true;
    awardPoints(state, object.bonus);
    addMessage(state, `깃발 +${object.bonus}`);
    events.push({ type: "collect", kind: object.kind, points: object.bonus, message: state.message });
    return;
  }

  if (object.kind === "fish" && isJumpingHigh) {
    object.collected = true;
    awardPoints(state, object.bonus);
    addMessage(state, `물고기 +${object.bonus}`);
    events.push({ type: "collect", kind: object.kind, points: object.bonus, message: state.message });
    return;
  }

  if ((object.kind === "hole" || object.kind === "crevasse") && isJumpingHigh) {
    object.collected = true;
    awardPoints(state, SCORE_VALUES.jump);
    addMessage(state, `점프 +${SCORE_VALUES.jump}`, 0.7);
    events.push({ type: "collect", kind: object.kind, points: SCORE_VALUES.jump, message: state.message });
    return;
  }

  if ((object.kind === "hole" || object.kind === "crevasse") && !isJumpingHigh) {
    object.hit = true;
    state.player.stumbleTimer = object.kind === "crevasse" ? 1.15 : 0.86;
    state.player.speed = MIN_SPEED;
    state.timeLeft = Math.max(0, state.timeLeft - 1.5);
    addMessage(state, object.kind === "crevasse" ? "크레바스!" : "빙판 구멍!");
    events.push({ type: "hit", kind: object.kind, message: state.message });
    return;
  }

  if (object.kind === "seal" && !isJumpingVeryHigh) {
    object.hit = true;
    state.player.stumbleTimer = 1.05;
    state.player.speed = MIN_SPEED;
    state.timeLeft = Math.max(0, state.timeLeft - 1);
    addMessage(state, "물개와 충돌!");
    events.push({ type: "hit", kind: object.kind, message: state.message });
    return;
  }

  if (object.kind === "seal" && isJumpingVeryHigh) {
    object.collected = true;
    awardPoints(state, SCORE_VALUES.jump);
    addMessage(state, `물개 점프 +${SCORE_VALUES.jump}`);
    events.push({ type: "collect", kind: object.kind, points: SCORE_VALUES.jump, message: state.message });
  }
}

function advanceStage(state: GameState): GameEvent[] {
  const nextStageIndex = state.stageIndex + 1;
  const nextLap = state.lap + (nextStageIndex >= TOTAL_STAGES ? 1 : 0);
  const score = state.score;
  const next = makeStageState(state.seed, nextStageIndex % TOTAL_STAGES, nextLap, score, state.hiScore);
  Object.assign(state, next, { phase: "map", message: "남극 지도 확인" });
  state.mapTimer = 1.8;
  return [{ type: "map", message: state.message }];
}

export function updateGame(state: GameState, input: ActionState, deltaSeconds: number): GameEvent[] {
  const dt = clamp(deltaSeconds, 0, 1 / 20);
  const events: GameEvent[] = [];

  if (state.messageTimer > 0) {
    state.messageTimer = Math.max(0, state.messageTimer - dt);
    if (state.messageTimer === 0 && state.phase === "running") state.message = "";
  }

  if (state.phase === "stage-clear") {
    state.clearTimer -= dt;
    if (input.start || state.clearTimer <= 0) {
      events.push(...advanceStage(state));
    }
    return events;
  }

  if (state.phase === "map") {
    state.mapTimer -= dt;
    if (input.start || state.mapTimer <= 0) {
      state.phase = "running";
      state.message = state.lap > 0 ? `LAP ${state.lap + 1} READY` : "READY";
      state.messageTimer = 1.0;
      events.push({ type: "next-stage", message: state.message });
    }
    return events;
  }

  if (state.phase !== "running") return events;

  if (input.left !== input.right) {
    state.player.lane += (input.left ? -1 : 1) * 1.55 * dt;
  }
  state.player.lane = clamp(state.player.lane, -0.94, 0.94);

  if (input.fast) state.player.speed += 165 * dt;
  else if (input.slow) state.player.speed -= 190 * dt;
  else state.player.speed += (CRUISE_SPEED - state.player.speed) * 0.55 * dt;

  if (state.player.boostTimer > 0) {
    state.player.boostTimer = Math.max(0, state.player.boostTimer - dt);
    state.player.speed += 42 * dt;
  }

  if (state.player.stumbleTimer > 0) {
    state.player.stumbleTimer = Math.max(0, state.player.stumbleTimer - dt);
    state.player.speed += (MIN_SPEED - state.player.speed) * 3.2 * dt;
  }

  state.player.speed = clamp(state.player.speed, MIN_SPEED, MAX_SPEED + (state.player.boostTimer > 0 ? 52 : 0));

  if (input.jump && state.player.jumpY <= 0.5 && state.player.stumbleTimer <= 0) {
    state.player.jumpVelocity = 735;
    state.player.jumpY = 1;
    events.push({ type: "jump" });
  }

  if (state.player.jumpY > 0 || state.player.jumpVelocity > 0) {
    state.player.jumpVelocity -= 1700 * dt;
    state.player.jumpY += state.player.jumpVelocity * dt;
    if (state.player.jumpY <= 0) {
      state.player.jumpY = 0;
      state.player.jumpVelocity = 0;
    }
  }

  const travelled = state.player.speed * dt;
  state.distanceTravelled = Math.min(state.stage.length, state.distanceTravelled + travelled);
  state.timeLeft = Math.max(0, state.timeLeft - dt);

  for (const object of state.objects) {
    if (object.collected || object.hit) continue;
    const relative = object.distance - state.distanceTravelled;
    if (relative < -55) {
      object.hit = true;
      continue;
    }
    if (relative > 42 || relative < -34) continue;
    if (collideLane(state.player.lane, object)) {
      handleCollision(state, object, events);
    }
  }

  if (state.timeLeft <= 0) {
    state.phase = "game-over";
    state.message = "TIME OVER";
    events.push({ type: "game-over", message: state.message });
    return events;
  }

  if (state.distanceTravelled >= state.stage.length) {
    const timeBonus = Math.ceil(state.timeLeft) * SCORE_VALUES.timeSecond;
    awardPoints(state, timeBonus);
    state.phase = "stage-clear";
    state.clearTimer = 2.5;
    state.message = `도착! TIME BONUS +${timeBonus}`;
    events.push({ type: "stage-clear", points: timeBonus, message: state.message });
  }

  return events;
}

export function getVisibleObjects(state: GameState): CourseObject[] {
  return state.objects.filter((object) => {
    if (object.collected || object.hit) return false;
    const relative = object.distance - state.distanceTravelled;
    return relative > -90 && relative < VIEW_DISTANCE;
  });
}

export function createSnapshot(state: GameState): GameSnapshot {
  return {
    phase: state.phase,
    score: state.score,
    hiScore: state.hiScore,
    stageIndex: state.stageIndex,
    stageCount: STAGES.length,
    lap: state.lap,
    stageName: state.stage.name,
    timeLeft: state.timeLeft,
    speed: state.player.speed,
    distanceLeft: Math.max(0, state.stage.length - state.distanceTravelled),
    message: state.message
  };
}
