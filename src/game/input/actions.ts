export type GameAction = "left" | "right" | "fast" | "slow" | "jump" | "start" | "pause" | "mute";

export interface ActionState {
  left: boolean;
  right: boolean;
  fast: boolean;
  slow: boolean;
  jump: boolean;
  start: boolean;
  pause: boolean;
  mute: boolean;
}

export function createActionState(): ActionState {
  return {
    left: false,
    right: false,
    fast: false,
    slow: false,
    jump: false,
    start: false,
    pause: false,
    mute: false
  };
}

export function setAction(input: ActionState, action: GameAction, pressed: boolean): void {
  input[action] = pressed;
}
