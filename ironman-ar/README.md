# Iron Man AR (Web)

An augmented reality web app that overlays a dynamic Iron Man-inspired helmet onto your live camera feed. Includes real-time face tracking, programmatic helmet rendering, and a faceplate open/close animation.

## Features
- Real-time face tracking using MediaPipe Face Landmarker (via CDN)
- Programmatic canvas rendering of a stylized Iron Man helmet
- Interactive faceplate animation (toggle with button or press `F`)
- Camera selection UI
- Responsive layout with red/gold/dark theme

## Quick Start

1. Serve the folder over HTTPS or localhost to allow camera access.
   - Easiest: use a local dev server.

```bash
# from this folder
python3 -m http.server 5173
# or
npx http-server -p 5173 --cors
```

2. Open the app:

- http://localhost:5173

3. Allow camera permission in the browser.

## Notes
- Face tracking uses the MediaPipe Tasks Vision FaceLandmarker model loaded from Google Cloud storage.
- If the tracker fails to init (CORS/network), check devtools console and try reloading.
- Camera labels appear after the first permission grant.

## Controls
- Button: Toggle open/close
- Keyboard: Press `F` to toggle faceplate

## Licenses & IP
This project programmatically renders a stylized helmet inspired by Iron Man using simple geometry and colors. No copyrighted models or textures are included. Be mindful of character IP usage if you distribute.
