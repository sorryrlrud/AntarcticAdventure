import { describe, expect, it } from "vitest";
import { stageForIndex } from "../../src/game/content/stages";
import { createActionState } from "../../src/game/input/actions";
import { createInitialState, startOrContinue, updateGame } from "../../src/game/simulation/game";
import { createCourse } from "../../src/game/simulation/course";
import { SCORE_VALUES } from "../../src/game/simulation/scoring";

function runSeconds(seconds: number, update: (dt: number) => void): void {
  for (let t = 0; t < seconds; t += 1 / 60) update(1 / 60);
}

describe("polar runner simulation", () => {
  it("starts from ready and spends time while moving forward", () => {
    const state = createInitialState(7);
    const input = createActionState();
    startOrContinue(state);
    runSeconds(1, (dt) => updateGame(state, input, dt));
    expect(state.phase).toBe("running");
    expect(state.distanceTravelled).toBeGreaterThan(200);
    expect(state.timeLeft).toBeLessThan(state.stage.timeLimit);
  });

  it("accelerates and steers with explicit action state", () => {
    const state = createInitialState(11);
    const input = createActionState();
    startOrContinue(state);
    input.fast = true;
    input.right = true;
    runSeconds(1.2, (dt) => updateGame(state, input, dt));
    expect(state.player.speed).toBeGreaterThan(300);
    expect(state.player.lane).toBeGreaterThan(0.5);
  });

  it("collects a flag when the player overlaps its lane", () => {
    const state = createInitialState(13);
    const input = createActionState();
    state.objects = [
      {
        id: "flag",
        kind: "flag",
        distance: 15,
        lane: 0,
        width: 0.3,
        bonus: SCORE_VALUES.flag,
        variant: 2,
        collected: false,
        hit: false
      }
    ];
    startOrContinue(state);
    const events = updateGame(state, input, 1 / 60);
    expect(events.some((event) => event.type === "collect")).toBe(true);
    expect(state.score).toBe(SCORE_VALUES.flag);
    expect(state.objects[0].collected).toBe(true);
  });

  it("uses fixed flag and fish score values while generating courses", () => {
    const objects = createCourse(0, 2400, 1983, 0);
    const flags = objects.filter((object) => object.kind === "flag");
    const fish = objects.filter((object) => object.kind === "fish");
    expect(flags.length).toBeGreaterThan(0);
    expect(fish.length).toBeGreaterThan(0);
    expect(flags.every((object) => object.bonus === SCORE_VALUES.flag)).toBe(true);
    expect(fish.every((object) => object.bonus === SCORE_VALUES.fish)).toBe(true);
  });

  it("stumbles on a hole when not jumping", () => {
    const state = createInitialState(17);
    const input = createActionState();
    state.objects = [
      { id: "hole", kind: "hole", distance: 15, lane: 0, width: 0.3, bonus: 0, variant: 0, collected: false, hit: false }
    ];
    startOrContinue(state);
    const events = updateGame(state, input, 1 / 60);
    expect(events.some((event) => event.type === "hit")).toBe(true);
    expect(state.player.stumbleTimer).toBeGreaterThan(0);
  });

  it("awards the small jump bonus for clearing hazards", () => {
    const state = createInitialState(18);
    const input = createActionState();
    state.objects = [
      { id: "hole", kind: "hole", distance: 15, lane: 0, width: 0.3, bonus: 0, variant: 0, collected: false, hit: false }
    ];
    state.player.jumpY = 58;
    startOrContinue(state);
    const events = updateGame(state, input, 1 / 60);
    expect(events.some((event) => event.type === "collect" && event.points === SCORE_VALUES.jump)).toBe(true);
    expect(state.score).toBe(SCORE_VALUES.jump);
    expect(state.objects[0].collected).toBe(true);
  });

  it("clears the stage and grants a time bonus", () => {
    const state = createInitialState(19);
    const input = createActionState();
    startOrContinue(state);
    state.distanceTravelled = state.stage.length - 3;
    const before = state.score;
    updateGame(state, input, 1 / 60);
    expect(state.phase).toBe("stage-clear");
    expect(state.score).toBeGreaterThan(before);
  });

  it("shows the Antarctic route map between stages before running again", () => {
    const state = createInitialState(23);
    const input = createActionState();
    startOrContinue(state);
    state.distanceTravelled = state.stage.length - 3;
    updateGame(state, input, 1 / 60);
    expect(state.phase).toBe("stage-clear");
    runSeconds(2.6, (dt) => updateGame(state, input, dt));
    expect(state.phase).toBe("map");
    expect(state.stageIndex).toBe(1);
    runSeconds(1.9, (dt) => updateGame(state, input, dt));
    expect(state.phase).toBe("running");
  });

  it("loops after ten courses and increases next lap pressure", () => {
    const state = createInitialState(29);
    state.stageIndex = 9;
    state.stage = stageForIndex(9);
    state.lap = 0;
    state.distanceTravelled = state.stage.length - 3;
    startOrContinue(state);
    updateGame(state, createActionState(), 1 / 60);
    runSeconds(2.6, (dt) => updateGame(state, createActionState(), dt));
    expect(state.phase).toBe("map");
    expect(state.stageIndex).toBe(0);
    expect(state.lap).toBe(1);
  });

  it("places more course objects on later laps", () => {
    const firstLap = createCourse(3, 5000, 1983, 0);
    const secondLap = createCourse(3, 5000, 1983, 1);
    expect(secondLap.length).toBeGreaterThan(firstLap.length);
  });
});
