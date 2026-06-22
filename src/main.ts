import Phaser from "phaser";
import "./style.css";
import { GameScene } from "./phaser/scenes/GameScene";
import { mountHud, mountMobileControls } from "./ui/domHud";

mountHud();
mountMobileControls();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: 512,
  height: 384,
  backgroundColor: "#75d7fb",
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 512,
    height: 384
  },
  render: {
    antialias: false,
    pixelArt: true
  },
  scene: [GameScene]
};

new Phaser.Game(config);
