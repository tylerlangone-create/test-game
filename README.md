# DEADLINK

A pixel-art cyberpunk dungeon crawler for Android, in the spirit of *Buried Bornes*: pick a runner, go down floor by floor, choose a door on each floor, fight turn-based battles with cooldown skills, and take on a boss every 5th floor. 30 floors down is the Root.

## Get the APK

Every push builds an installable APK with GitHub Actions (**Actions → Build APK**).

1. Open the repo's **Releases** page on your phone and take the newest `DEADLINK build N`.
2. Tap `deadlink-N.apk` and open it. If Android asks, allow your browser to "install unknown apps".
3. Newer builds install over older ones and keep your save.

The APK is signed with a fixed sideload key (`android/app/deadlink-debug.keystore`, standard public debug passwords) so updates install in place. That's fine for sideloading. Publishing to the Play Store needs a private release key.

## Play in a browser

Serve the repo root and open `www/index.html`. It's plain HTML/JS with no build step:

```sh
cd www && python3 -m http.server 8000   # then open http://localhost:8000
```

## Project layout

| Path | What |
| --- | --- |
| `www/index.html`, `www/css/style.css` | UI shell and pixel-panel styling |
| `www/js/sprites.js` | Procedural pixel-art generator: every enemy, boss, portrait and icon |
| `www/js/scene.js` | Ray-cast pixel corridor (6 biomes), particles, hit, spell and death effects |
| `www/js/game.js` | Game flow, battle engine, doors, shop, gear, codex, meta upgrades |
| `www/js/data.js` | Skills, classes, enemies, bosses, loot tables, events |
| `www/js/audio.js` | Synthesized sound effects and intro score (no audio files) |
| `android/` | Capacitor Android project (portrait, immersive full-screen) |
| `legacy/original-zai.html` | The original single-file version this was rebuilt from |

## Build the APK locally

Needs Node 22, JDK 21 and the Android SDK.

```sh
npm ci
npx cap sync android
cd android && ./gradlew assembleDebug
# -> android/app/build/outputs/apk/debug/app-debug.apk
```
