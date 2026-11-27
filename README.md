# Netflix Windowed Games

A small Chrome extension (Manifest V3, TypeScript) that stops Netflix browser games
from forcing fullscreen, so you can keep the game in a resizable window and multitask /
FaceTime alongside it.

It neutralizes the page's Fullscreen API (`requestFullscreen` / `exitFullscreen`) while
telling the game it *is* fullscreen, so the game keeps running windowed instead of
pausing or re-prompting.

## Build

The extension is written in TypeScript and compiled to a loadable `dist/` folder.

```bash
npm install
npm run build      # compiles src/*.ts -> dist/ and copies manifest, popup, icons
```

Scripts:

| Command            | What it does                                          |
|--------------------|-------------------------------------------------------|
| `npm run build`    | Build the loadable extension into `dist/`             |
| `npm run typecheck`| Type-check without emitting                           |
| `npm run icons`    | Regenerate `icons/*.png` (zero-dependency generator)  |
| `npm run clean`    | Remove `dist/`                                        |

## Install (Load unpacked)

Chrome can't install an unpacked extension from a URL — build it, then load the folder:

1. `npm install && npm run build`
2. Open `chrome://extensions`
3. Turn on **Developer mode** (top-right)
4. Click **Load unpacked** and select the **`dist/`** folder

A "Netflix Windowed Games" tile appears and it's active immediately.

## Use

1. Open a Netflix game in a Chrome tab (reload the tab if it was already open).
2. It launches windowed instead of fullscreen — resize the window as you like.
3. The toolbar icon has an **on/off toggle**. After flipping it, reload the Netflix tab.

## Project layout

```
src/
  inject.ts    # main-world script: overrides the Fullscreen API
  loader.ts    # isolated content script: bridges the on/off setting to the page
  popup.ts     # toolbar popup logic (on/off toggle)
static/
  popup.html   # popup markup + styles
icons/         # generated PNG icons (16/48/128)
scripts/
  build.mjs    # tsc + copy static assets into dist/
  gen-icons.mjs# dependency-free PNG icon generator
manifest.json  # MV3 manifest (copied into dist/ at build)
```

## Notes

- Works on `*.netflix.com`.
- Some games check fullscreen state in unusual ways; if one still forces fullscreen,
  open an issue with the game name.

## License

MIT
