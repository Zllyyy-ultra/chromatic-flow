# Chromatic Flow

Real-time WebGL2 particle-wave wallpaper for [Wallpaper Engine](https://www.wallpaperengine.io/) and browsers.

## Current status — V0.1 prototype

- Fullscreen 3D-inspired particle wave, rendered entirely on the GPU using WebGL2 shaders.
- Indigo/violet/magenta/amber/teal artistic gradients.
- Continuous gentle motion without music.
- A simulated music button for testing the response in a browser.
- Wallpaper Engine audio listener support (64 frequency bins per stereo channel).
- Audio smoothing and low/mid/high-frequency mappings.
- Controls for music sensitivity (default 65%), idle velocity (35%), brightness (60%), and particle density.
- No CDN and no external dependencies; the HTML file works offline.

**Note:** This is an initial prototype, not a final visual match for the reference video. Audio behavior and performance need to be verified inside Wallpaper Engine.

## Browser preview

Open `index.html` in a WebGL2-capable browser. Click **开启模拟音乐节奏** to test dynamic audio-like behavior. Press **H** to toggle the controls.

After GitHub Pages is enabled, the preview URL will be:
https://zllyyy-ultra.github.io/chromatic-flow/

GitHub repository **Settings → Pages → Build and deployment → Source: GitHub Actions**. GitHub Actions will deploy `index.html` whenever `main` changes.

## Wallpaper Engine import (prototype)

1. Open Wallpaper Engine → Wallpaper Editor → Create Wallpaper.
2. Choose the web-based wallpaper option and select the locally downloaded `index.html`.
3. Test whether audio input works and inspect quality/performance. Browser mock audio is only for testing and is not live system audio.
4. For a future release, add Wallpaper Engine project metadata and configurable properties, then package the complete folder rather than assuming this single HTML file is a finished Workshop release.

## Roadmap

- V0.2: refine wave composition, stronger spatial depth and graceful edges; quality benchmarks.
- V0.3: validate real Wallpaper Engine audio capture, user properties and transitions.
- V1.0: distribution bundle, documentation, profiling and compatibility checks.

## Design baseline

Fullscreen wave surface; medium density; 65% audio response; calm idle motion; artistic gradient palette. No flashing or hard cuts. Maintain legibility of desktop icons.

## Privacy

No audio recording, no music uploads and no telemetry. Audio spectrum readings are processed locally in memory only.
