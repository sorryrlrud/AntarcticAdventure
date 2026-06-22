import Phaser from "phaser";

type Graphics = Phaser.GameObjects.Graphics;

function make(scene: Phaser.Scene, key: string, width: number, height: number, draw: (g: Graphics) => void): void {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, width, height);
  g.destroy();
}

export function createGameTextures(scene: Phaser.Scene): void {
  make(scene, "player", 36, 42, (g) => {
    g.fillStyle(0x101826).fillRect(11, 7, 14, 24);
    g.fillStyle(0xffffff).fillRect(14, 12, 8, 15);
    g.fillStyle(0x101826).fillRect(8, 13, 5, 16).fillRect(23, 13, 5, 16);
    g.fillStyle(0xffd34a).fillTriangle(16, 11, 20, 11, 18, 15);
    g.fillStyle(0xf25546).fillRect(9, 32, 7, 4).fillRect(20, 32, 7, 4);
    g.fillStyle(0x27364d).fillRect(13, 5, 10, 4);
    g.fillStyle(0xffffff).fillRect(14, 8, 3, 3).fillRect(20, 8, 3, 3);
  });

  make(scene, "player-stumble", 36, 42, (g) => {
    g.fillStyle(0x101826).fillRect(9, 10, 16, 23);
    g.fillStyle(0xffffff).fillRect(13, 16, 8, 14);
    g.fillStyle(0x101826).fillRect(5, 19, 6, 12).fillRect(23, 16, 8, 13);
    g.fillStyle(0xffd34a).fillTriangle(12, 14, 16, 13, 14, 18);
    g.fillStyle(0xf25546).fillRect(6, 34, 9, 4).fillRect(21, 33, 8, 4);
    g.fillStyle(0xffffff).fillRect(12, 11, 3, 3).fillRect(18, 10, 3, 3);
  });

  make(scene, "hole", 58, 24, (g) => {
    g.fillStyle(0x6bd7f3).fillEllipse(29, 13, 56, 20);
    g.fillStyle(0x0e1a2a).fillEllipse(29, 12, 48, 15);
    g.fillStyle(0x284863).fillEllipse(28, 10, 30, 7);
  });

  make(scene, "crevasse", 84, 24, (g) => {
    g.fillStyle(0x0e1a2a);
    g.fillPoints(
      [
        new Phaser.Geom.Point(3, 11),
        new Phaser.Geom.Point(17, 5),
        new Phaser.Geom.Point(32, 13),
        new Phaser.Geom.Point(48, 4),
        new Phaser.Geom.Point(65, 16),
        new Phaser.Geom.Point(81, 8),
        new Phaser.Geom.Point(82, 18),
        new Phaser.Geom.Point(64, 23),
        new Phaser.Geom.Point(48, 15),
        new Phaser.Geom.Point(31, 23),
        new Phaser.Geom.Point(14, 15),
        new Phaser.Geom.Point(2, 20)
      ],
      true
    );
    g.lineStyle(2, 0x8ce8ff).strokePoints(
      [
        new Phaser.Geom.Point(4, 10),
        new Phaser.Geom.Point(18, 4),
        new Phaser.Geom.Point(34, 12),
        new Phaser.Geom.Point(48, 3),
        new Phaser.Geom.Point(65, 15),
        new Phaser.Geom.Point(82, 7)
      ],
      false
    );
  });

  make(scene, "seal", 52, 30, (g) => {
    g.fillStyle(0x8da1ad).fillEllipse(27, 18, 42, 20);
    g.fillStyle(0xaec0c9).fillEllipse(34, 12, 20, 16);
    g.fillStyle(0x102132).fillCircle(38, 10, 2).fillCircle(29, 10, 2);
    g.fillStyle(0x102132).fillTriangle(34, 13, 37, 13, 35, 16);
    g.fillStyle(0x6f838f).fillEllipse(12, 23, 18, 7).fillEllipse(40, 24, 19, 7);
  });

  make(scene, "flag-0", 24, 38, (g) => {
    g.lineStyle(3, 0x26374a).lineBetween(5, 4, 5, 36);
    g.fillStyle(0x2469d8).fillRect(7, 5, 14, 10);
    g.fillStyle(0xffffff).fillRect(7, 9, 14, 2);
  });

  make(scene, "flag-1", 24, 38, (g) => {
    g.lineStyle(3, 0x26374a).lineBetween(5, 4, 5, 36);
    g.fillStyle(0xffffff).fillRect(7, 5, 14, 10);
    g.fillStyle(0xf25546).fillRect(7, 11, 14, 4);
  });

  make(scene, "flag-2", 24, 38, (g) => {
    g.lineStyle(3, 0x26374a).lineBetween(5, 4, 5, 36);
    g.fillStyle(0x2ec27e).fillRect(7, 5, 14, 10);
    g.fillStyle(0xffd34a).fillRect(7, 8, 14, 4);
  });

  make(scene, "flag-3", 24, 38, (g) => {
    g.lineStyle(3, 0x26374a).lineBetween(5, 4, 5, 36);
    g.fillStyle(0xf25546).fillRect(7, 5, 14, 10);
    g.fillStyle(0xffffff).fillRect(10, 5, 4, 10);
  });

  make(scene, "fish", 30, 18, (g) => {
    g.fillStyle(0xff8b3d).fillEllipse(15, 9, 18, 11);
    g.fillStyle(0xffd34a).fillTriangle(4, 9, 0, 3, 0, 15);
    g.fillStyle(0x102132).fillCircle(20, 7, 1.6);
  });

  make(scene, "station", 92, 66, (g) => {
    g.fillStyle(0xf8fdff).fillRect(14, 25, 64, 28);
    g.fillStyle(0xe3554a).fillRect(20, 17, 52, 10);
    g.fillStyle(0x244c66).fillRect(26, 34, 12, 10).fillRect(52, 34, 12, 10);
    g.fillStyle(0x102132).fillRect(41, 39, 10, 14);
    g.lineStyle(3, 0x244c66).strokeRect(14, 25, 64, 28);
    g.fillStyle(0x2ec27e).fillRect(71, 10, 14, 8);
    g.lineStyle(2, 0x26374a).lineBetween(70, 10, 70, 50);
  });
}
