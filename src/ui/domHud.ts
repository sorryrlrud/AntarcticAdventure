import type { GameAction } from "../game/input/actions";
import type { GameSnapshot } from "../game/simulation/types";

function text(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing #${id}`);
  return element;
}

function dispatchAction(action: GameAction, pressed: boolean): void {
  window.dispatchEvent(new CustomEvent("polar-action", { detail: { action, pressed } }));
}

export function mountHud(): void {
  const score = text("score");
  const hiScore = text("hi-score");
  const course = text("course");
  const time = text("time");
  const rest = text("rest");
  const speed = text("speed");
  const message = text("message");
  const station = text("station");
  const titlePanel = text("title-panel");
  const startButton = text("start-button") as HTMLButtonElement;
  const muteButton = text("mute-button") as HTMLButtonElement;

  startButton.addEventListener("click", () => {
    dispatchAction("start", true);
    setTimeout(() => dispatchAction("start", false), 40);
  });

  muteButton.addEventListener("click", () => {
    dispatchAction("mute", true);
    setTimeout(() => dispatchAction("mute", false), 40);
  });

  window.addEventListener("polar-muted", (event) => {
    const muted = (event as CustomEvent<{ muted: boolean }>).detail.muted;
    muteButton.classList.toggle("is-muted", muted);
    muteButton.textContent = muted ? "×" : "♪";
  });

  window.addEventListener("polar-state", (event) => {
    const state = (event as CustomEvent<GameSnapshot>).detail;
    score.textContent = Math.floor(state.score).toString().padStart(6, "0");
    hiScore.textContent = Math.floor(state.hiScore).toString().padStart(6, "0");
    course.textContent = state.lap > 0 ? `${state.stageIndex + 1}/${state.stageCount} L${state.lap + 1}` : `${state.stageIndex + 1}/${state.stageCount}`;
    time.textContent = Math.ceil(state.timeLeft).toString().padStart(2, "0");
    rest.textContent = Math.ceil(state.distanceLeft).toString().padStart(4, "0");
    speed.textContent = Math.round(state.speed).toString().padStart(3, "0");
    message.textContent =
      state.message ||
      (state.phase === "map"
        ? `지도: ${state.stageName}`
        : state.phase === "running"
        ? `${Math.ceil(state.distanceLeft)}m`
        : state.phase === "paused"
          ? "일시정지"
          : "ENTER 또는 START");
    station.textContent = state.stageName.toUpperCase();
    titlePanel.classList.toggle("is-hidden", state.phase !== "ready" && state.phase !== "game-over");
    startButton.textContent = state.phase === "game-over" ? "RESTART" : "START";
  });
}

export function mountMobileControls(): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>("[data-action]");

  const release = (button: HTMLButtonElement) => {
    const action = button.dataset.action as GameAction;
    if (!action) return;
    button.classList.remove("is-pressed");
    dispatchAction(action, false);
  };

  for (const button of buttons) {
    const action = button.dataset.action as GameAction;
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      button.classList.add("is-pressed");
      dispatchAction(action, true);
    });
    button.addEventListener("pointerup", () => release(button));
    button.addEventListener("pointercancel", () => release(button));
    button.addEventListener("lostpointercapture", () => release(button));
    button.addEventListener("contextmenu", (event) => event.preventDefault());
  }
}
