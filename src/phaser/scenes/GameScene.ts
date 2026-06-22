import Phaser from "phaser";
import { AuroraAudio } from "../../game/audio/synth";
import type { GameAction } from "../../game/input/actions";
import { createActionState, setAction } from "../../game/input/actions";
import {
  createInitialState,
  createInitialStateWithHighScore,
  createSnapshot,
  getVisibleObjects,
  startOrContinue,
  togglePause,
  updateGame,
  VIEW_DISTANCE
} from "../../game/simulation/game";
import { fishJump, sealEmergence } from "../../game/simulation/objectMotion";
import type { CourseObject, GameEvent, GameState } from "../../game/simulation/types";
import { projectTrackPoint } from "../view/projection";
import { createGameTextures } from "../view/textures";

interface ActionEventDetail {
  action: GameAction;
  pressed: boolean;
}

interface DebugEventDetail {
  command: "finish-stage";
}

export class GameScene extends Phaser.Scene {
  private state: GameState = createInitialState();
  private inputState = createActionState();
  private graphics!: Phaser.GameObjects.Graphics;
  private player!: Phaser.GameObjects.Image;
  private station!: Phaser.GameObjects.Image;
  private objectSprites = new Map<string, Phaser.GameObjects.Image>();
  private audio = new AuroraAudio();
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys?: Record<string, Phaser.Input.Keyboard.Key>;
  private heldKeyboardActions = new Set<GameAction>();
  private previousPause = false;
  private previousStart = false;
  private previousMute = false;
  private previousJump = false;
  private muted = false;
  private persistedHiScore = 0;

  constructor() {
    super("game");
  }

  create(): void {
    this.persistedHiScore = this.loadHighScore();
    this.state = createInitialStateWithHighScore(1983, this.persistedHiScore);
    createGameTextures(this);
    this.graphics = this.add.graphics();
    this.station = this.add.image(0, 0, "station").setVisible(false).setDepth(7);
    this.player = this.add.image(0, 0, "player").setDepth(20);
    this.cameras.main.setBackgroundColor("#78d6fa");

    this.input.keyboard?.addCapture(["UP", "DOWN", "LEFT", "RIGHT", "SPACE"]);
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.keys = this.input.keyboard?.addKeys("W,A,S,D,Z,X,ENTER,P,M,SPACE") as Record<string, Phaser.Input.Keyboard.Key>;

    window.addEventListener("polar-action", this.onExternalAction);
    if (this.isLocalDebugHost()) window.addEventListener("polar-debug", this.onDebugAction);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener("polar-action", this.onExternalAction);
      if (this.isLocalDebugHost()) window.removeEventListener("polar-debug", this.onDebugAction);
      window.removeEventListener("keydown", this.onKeyDown);
      window.removeEventListener("keyup", this.onKeyUp);
    });

    this.publishState();
  }

  override update(_: number, delta: number): void {
    const dt = delta / 1000;
    this.syncKeyboard();
    this.handleEdgeActions();
    const events = updateGame(this.state, this.inputState, dt);
    this.handleEvents(events);
    this.audio.update(dt, this.state.phase === "running");
    this.render();
    this.publishState();
  }

  private onExternalAction = (event: Event): void => {
    const detail = (event as CustomEvent<ActionEventDetail>).detail;
    if (!detail) return;
    if (detail.action === "start" && detail.pressed) {
      void this.audio.ensure();
      this.handleEvents(startOrContinue(this.state));
    }
    if (detail.action === "pause" && detail.pressed) togglePause(this.state);
    if (detail.action === "mute" && detail.pressed) this.toggleMute();
    setAction(this.inputState, detail.action, detail.pressed);
  };

  private onDebugAction = (event: Event): void => {
    const detail = (event as CustomEvent<DebugEventDetail>).detail;
    if (!detail || detail.command !== "finish-stage" || this.state.phase !== "running") return;
    this.state.objects = [];
    this.state.distanceTravelled = Math.max(0, this.state.stage.length - 3);
  };

  private isLocalDebugHost(): boolean {
    return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    const action = this.actionForKey(event.key);
    if (!action) return;
    event.preventDefault();
    this.heldKeyboardActions.add(action);
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    const action = this.actionForKey(event.key);
    if (!action) return;
    event.preventDefault();
    this.heldKeyboardActions.delete(action);
  };

  private actionForKey(key: string): GameAction | null {
    switch (key) {
      case "ArrowLeft":
      case "a":
      case "A":
        return "left";
      case "ArrowRight":
      case "d":
      case "D":
        return "right";
      case "ArrowUp":
      case "w":
      case "W":
        return "fast";
      case "ArrowDown":
      case "s":
      case "S":
        return "slow";
      case " ":
      case "z":
      case "Z":
      case "x":
      case "X":
        return "jump";
      case "Enter":
        return "start";
      case "p":
      case "P":
        return "pause";
      case "m":
      case "M":
        return "mute";
      default:
        return null;
    }
  }

  private syncKeyboard(): void {
    if (!this.cursors || !this.keys) return;
    this.inputState.left = this.cursors.left.isDown || this.keys.A.isDown || this.heldKeyboardActions.has("left");
    this.inputState.right = this.cursors.right.isDown || this.keys.D.isDown || this.heldKeyboardActions.has("right");
    this.inputState.fast = this.cursors.up.isDown || this.keys.W.isDown || this.heldKeyboardActions.has("fast");
    this.inputState.slow = this.cursors.down.isDown || this.keys.S.isDown || this.heldKeyboardActions.has("slow");
    this.inputState.jump =
      this.cursors.space.isDown ||
      this.keys.Z.isDown ||
      this.keys.X.isDown ||
      this.keys.SPACE.isDown ||
      this.heldKeyboardActions.has("jump");
    this.inputState.start = this.keys.ENTER.isDown || this.heldKeyboardActions.has("start");
    this.inputState.pause = this.keys.P.isDown || this.heldKeyboardActions.has("pause");
    this.inputState.mute = this.keys.M.isDown || this.heldKeyboardActions.has("mute");
  }

  private handleEdgeActions(): void {
    if (this.inputState.start && !this.previousStart) {
      void this.audio.ensure();
      this.handleEvents(startOrContinue(this.state));
    }

    if (this.inputState.jump && !this.previousJump && this.state.phase === "ready") {
      void this.audio.ensure();
      this.handleEvents(startOrContinue(this.state));
    }

    if (this.inputState.pause && !this.previousPause) togglePause(this.state);
    if (this.inputState.mute && !this.previousMute) this.toggleMute();

    this.previousStart = this.inputState.start;
    this.previousPause = this.inputState.pause;
    this.previousMute = this.inputState.mute;
    this.previousJump = this.inputState.jump;
  }

  private toggleMute(): void {
    this.muted = !this.muted;
    this.audio.setMuted(this.muted);
    window.dispatchEvent(new CustomEvent("polar-muted", { detail: { muted: this.muted } }));
  }

  private handleEvents(events: GameEvent[]): void {
    for (const event of events) {
      if (event.type === "jump") this.audio.jump();
      if (event.type === "collect") this.audio.collect();
      if (event.type === "hit" || event.type === "game-over") this.audio.hit();
      if (event.type === "stage-clear") this.audio.clear();
    }
  }

  private render(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    this.drawWorld(width, height);
    this.drawStation(width, height);
    this.drawObjects(width, height);
    this.drawPlayer(width, height);
    if (this.state.phase === "map") this.drawMapOverlay(width, height);
  }

  private drawWorld(width: number, height: number): void {
    const horizon = height * 0.36;
    const floor = height * 0.88;
    const pulse = Math.sin(this.time.now / 840) * 0.04 + 1;
    this.graphics.clear();
    this.graphics.fillGradientStyle(this.state.stage.sky, this.state.stage.sky, 0xf4fbff, 0xf4fbff, 1);
    this.graphics.fillRect(0, 0, width, height);
    this.graphics.fillStyle(0xffe06a, 0.78).fillCircle(width * 0.82, height * 0.15, height * 0.045 * pulse);

    this.graphics.fillStyle(0xdff8ff, 0.92);
    this.graphics.fillTriangle(0, horizon, width * 0.2, height * 0.22, width * 0.42, horizon);
    this.graphics.fillTriangle(width * 0.25, horizon, width * 0.52, height * 0.18, width * 0.82, horizon);
    this.graphics.fillTriangle(width * 0.61, horizon, width * 0.85, height * 0.24, width, horizon);

    this.graphics.fillStyle(0xf8fdff).fillRect(0, horizon, width, height - horizon);
    this.graphics.fillStyle(0xd8f5ff).fillTriangle(width * 0.5, horizon, width * 0.02, floor, width * 0.98, floor);
    this.graphics.lineStyle(2, 0x8bd7ef, 0.7);
    for (const lane of [-0.75, -0.5, -0.25, 0.25, 0.5, 0.75]) {
      const top = projectTrackPoint(lane, VIEW_DISTANCE, width, height);
      const bottom = projectTrackPoint(lane, 0, width, height);
      this.graphics.lineBetween(top.x, top.y, bottom.x, bottom.y);
    }

    const segmentOffset = (this.state.distanceTravelled % 240) / 240;
    for (let index = 0; index < 9; index += 1) {
      const rel = VIEW_DISTANCE * ((index + segmentOffset) / 9);
      const point = projectTrackPoint(0, rel, width, height);
      this.graphics.lineStyle(Math.max(1, point.scale * 1.5), 0xb4e8f6, 0.62);
      this.graphics.lineBetween(width * 0.5 - point.laneWidth, point.y, width * 0.5 + point.laneWidth, point.y);
    }

    this.graphics.fillStyle(0xbcefff, 0.78);
    this.graphics.fillRect(0, floor, width, height - floor);
  }

  private drawStation(width: number, height: number): void {
    const rel = this.state.stage.length - this.state.distanceTravelled;
    if (rel > VIEW_DISTANCE || rel < -80) {
      this.station.setVisible(false);
      return;
    }
    const p = projectTrackPoint(0, rel, width, height);
    this.station
      .setVisible(true)
      .setPosition(p.x, p.y - 28 * p.scale)
      .setScale(Math.max(0.25, p.scale * 0.8))
      .setDepth(8 + p.depth * 10);
  }

  private drawObjects(width: number, height: number): void {
    const visible = getVisibleObjects(this.state);
    const visibleIds = new Set<string>();
    visible.sort((a, b) => b.distance - a.distance);

    for (const object of visible) {
      visibleIds.add(object.id);
      const sprite = this.getObjectSprite(object);
      const relative = object.distance - this.state.distanceTravelled;
      const p = projectTrackPoint(object.lane, relative, width, height);
      const fishLift = object.kind === "fish" ? (14 + fishJump(relative, object.variant) * 38) * p.scale : 0;
      const sealLift = object.kind === "seal" ? sealEmergence(relative, object.variant) * 14 * p.scale : 0;
      if (object.kind === "fish" || object.kind === "seal") {
        this.drawPopOutHole(p.x, p.y, p.scale);
      }
      sprite
        .setVisible(true)
        .setPosition(p.x, p.y - fishLift - sealLift)
        .setScale(Math.max(0.12, p.scale * (object.kind === "crevasse" ? object.width * 1.35 : 1)))
        .setDepth(9 + p.depth * 10)
        .setAlpha(this.objectAlpha(object, relative));
    }

    for (const [id, sprite] of this.objectSprites) {
      if (!visibleIds.has(id)) sprite.setVisible(false);
    }
  }

  private drawPopOutHole(x: number, y: number, scale: number): void {
    this.graphics.fillStyle(0x6bd7f3, 0.8).fillEllipse(x, y + 4 * scale, 42 * scale, 15 * scale);
    this.graphics.fillStyle(0x0e1a2a, 0.88).fillEllipse(x, y + 3 * scale, 32 * scale, 10 * scale);
  }

  private objectAlpha(object: CourseObject, relative: number): number {
    if (object.kind === "flag" && object.variant === 3) return 0.72 + Math.sin(this.time.now / 90) * 0.28;
    if (object.kind === "seal") return 0.18 + sealEmergence(relative, object.variant) * 0.82;
    if (object.kind === "fish") return 0.35 + fishJump(relative, object.variant) * 0.65;
    return 1;
  }

  private getObjectSprite(object: CourseObject): Phaser.GameObjects.Image {
    const existing = this.objectSprites.get(object.id);
    if (existing) return existing;

    const key =
      object.kind === "flag"
        ? `flag-${object.variant}`
        : object.kind === "fish"
          ? "fish"
          : object.kind === "hole"
            ? "hole"
            : object.kind === "crevasse"
              ? "crevasse"
              : "seal";
    const sprite = this.add.image(0, 0, key).setVisible(false);
    this.objectSprites.set(object.id, sprite);
    return sprite;
  }

  private drawPlayer(width: number, height: number): void {
    const lane = this.state.player.lane;
    const p = projectTrackPoint(lane, 0, width, height);
    const y = height * 0.82 - this.state.player.jumpY * 0.2;
    const texture = this.state.player.stumbleTimer > 0 ? "player-stumble" : "player";
    this.player
      .setTexture(texture)
      .setPosition(p.x, y)
      .setScale(Math.max(1.2, height / 210))
      .setAngle(this.state.player.stumbleTimer > 0 ? Math.sin(this.time.now / 70) * 7 : lane * 5)
      .setDepth(30);

    if (this.state.player.boostTimer > 0) {
      this.graphics.fillStyle(0xffd34a, 0.45).fillEllipse(p.x, y + 17, 50, 12);
    }
  }

  private drawMapOverlay(width: number, height: number): void {
    const panelX = width * 0.14;
    const panelY = height * 0.24;
    const panelW = width * 0.72;
    const panelH = height * 0.54;
    const route = [
      [0.18, 0.62],
      [0.29, 0.5],
      [0.4, 0.56],
      [0.49, 0.42],
      [0.58, 0.5],
      [0.67, 0.37],
      [0.76, 0.48],
      [0.69, 0.62],
      [0.51, 0.68],
      [0.34, 0.66]
    ] as const;

    this.graphics.fillStyle(0xf7fdff, 0.94).fillRoundedRect(panelX, panelY, panelW, panelH, 8);
    this.graphics.lineStyle(3, 0x244c66, 0.88).strokeRoundedRect(panelX, panelY, panelW, panelH, 8);
    this.graphics.fillStyle(0xcff4ff, 1).fillEllipse(width * 0.5, panelY + panelH * 0.54, panelW * 0.68, panelH * 0.74);
    this.graphics.lineStyle(2, 0xffffff, 0.9);
    this.graphics.strokeEllipse(width * 0.5, panelY + panelH * 0.54, panelW * 0.52, panelH * 0.55);

    for (let index = 1; index < route.length; index += 1) {
      const [aX, aY] = route[index - 1];
      const [bX, bY] = route[index];
      const completed = index <= this.state.stageIndex || this.state.lap > 0;
      this.graphics.lineStyle(completed ? 4 : 2, completed ? 0xf25546 : 0x84bfd0, completed ? 0.95 : 0.7);
      this.graphics.lineBetween(panelX + panelW * aX, panelY + panelH * aY, panelX + panelW * bX, panelY + panelH * bY);
    }

    route.forEach(([x, y], index) => {
      const px = panelX + panelW * x;
      const py = panelY + panelH * y;
      const isCurrent = index === this.state.stageIndex;
      this.graphics.fillStyle(isCurrent ? 0xffd34a : index < this.state.stageIndex || this.state.lap > 0 ? 0xf25546 : 0xffffff, 1);
      this.graphics.fillCircle(px, py, isCurrent ? 7 : 5);
      this.graphics.lineStyle(2, 0x244c66, 1).strokeCircle(px, py, isCurrent ? 7 : 5);
    });

    this.graphics.fillStyle(0x102132, 1);
    this.graphics.fillRect(panelX + panelW * 0.43, panelY + panelH * 0.09, panelW * 0.14, 4);
    this.graphics.fillCircle(panelX + panelW * 0.5, panelY + panelH * 0.09, 8);
  }

  private publishState(): void {
    const snapshot = createSnapshot(this.state);
    if (snapshot.hiScore > this.persistedHiScore) {
      this.persistedHiScore = snapshot.hiScore;
      this.saveHighScore(snapshot.hiScore);
    }
    window.dispatchEvent(new CustomEvent("polar-state", { detail: snapshot }));
  }

  private loadHighScore(): number {
    const value = Number.parseInt(window.localStorage.getItem("polar-dash-hi-score") ?? "0", 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  private saveHighScore(score: number): void {
    window.localStorage.setItem("polar-dash-hi-score", Math.floor(score).toString());
  }
}
