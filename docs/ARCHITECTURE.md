# Implementation notes

index.html loads classic scripts at the end of body, preserving offline file access and synchronous Wallpaper Engine registration. No module loader or network dependency is required.

audio.js validates exactly 128 stereo spectrum values (64 left + 64 right). Finite samples are clamped to [0,1] before averaging bands 0–7, 8–31 and 32–63. Band gains are bounded again. Exponential attack/release smoothing is time based (10/s and 2.3/s). Callbacks older than 500 ms decay toward zero. Sensitivity defaults to .65.

app.js uploads normalized UVs once per density change. The vertex shader evaluates idle waves and frequency displacement, tilts the surface and performs perspective projection. Bass drives radial motion, mids finer waves, highs bounded shimmer. Clamped alpha replaces the prototype's potentially invalid fractional power. Soft points use additive blending with no depth buffer or fullscreen bloom.

The medium static buffer uses about 280 KB; frames update scalar uniforms and issue one draw call. Resolution is bounded by DPR 1.5 and ~3.6 million pixels. This is a resource budget, not adaptive performance detection. Use low density / lower host FPS on slower hardware.

Rendering stops on visibility and host pause changes, resets timing on resume, and rebuilds resources on context restore. Host FPS limits skip rendering while retaining browser scheduling. The simulation has its own rhythm clock, independent of idle speed. window.chromaticFlow.snapshot() exposes diagnostics for local test tools.

References: [audio](https://docs.wallpaperengine.io/en/web/audio/visualizer.html), [host properties](https://docs.wallpaperengine.io/en/web/api/propertylistener.html).
