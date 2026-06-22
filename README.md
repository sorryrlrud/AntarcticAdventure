# Polar Dash

Playable web/mobile Antarctic runner homage built with Phaser, TypeScript, and Vite.

This project intentionally uses original pixel-style graphics and generated WebAudio synths instead of copying ROM data, screenshots, sprites, or recordings. The rules target the classic MSX Antarctic runner structure: behind-the-runner perspective, timed courses, speed control, lateral dodging, jumps, holes, crevasses, seal hazards, flags, fish bonuses, and ten Antarctic stations.

## Controls

- Keyboard: `Left`/`Right` or `A`/`D` steer, `Up`/`W` speeds up, `Down`/`S` slows down, `Space`/`Z`/`X` jumps.
- `Enter`: start or advance.
- `P`: pause.
- `M`: mute.
- Mobile: on-screen left/right, slow/fast, and jump buttons.

## Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run test
npm run build
npm run test:e2e
```

## Deployment

The repository includes `.github/workflows/pages.yml`. Pushes to `main` build the Vite app and publish `dist` to GitHub Pages. The Vite production base path is `/AntarcticAdventure/`.
