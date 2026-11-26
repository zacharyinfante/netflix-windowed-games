# Netflix Windowed Games

A tiny Chrome extension (Manifest V3) that stops Netflix browser games from forcing
fullscreen, so you can keep the game in a resizable window and multitask / FaceTime
alongside it.

It neutralizes the page's Fullscreen API (`requestFullscreen` / `exitFullscreen`) while
telling the game it *is* fullscreen, so the game keeps running windowed instead of
pausing or re-prompting.

## Install (Load unpacked)

Chrome can't install an unpacked extension straight from a URL — download the folder,
then load it:

1. Download/clone this repo to a folder on your computer.
2. Open `chrome://extensions`.
3. Turn on **Developer mode** (top-right).
4. Click **Load unpacked** and select the repo folder.

A "Netflix Windowed Games" tile appears and it's active immediately.

## Use

1. Open a Netflix game in a Chrome tab (reload the tab if it was already open).
2. It launches windowed instead of fullscreen — resize the window as you like.
3. The toolbar icon has an **on/off toggle**. After flipping it, reload the Netflix tab.

## Notes

- Works on `*.netflix.com`.
- Some games check fullscreen state in unusual ways; if one still forces fullscreen,
  open an issue with the game name.

## Files

| File          | Role                                                              |
|---------------|-------------------------------------------------------------------|
| `manifest.json` | MV3 manifest                                                    |
| `inject.js`     | Runs in the page's main world; overrides the Fullscreen API     |
| `loader.js`     | Isolated content script; bridges the on/off setting to the page |
| `popup.html/js` | Toolbar popup with the on/off toggle                            |

## License

MIT
