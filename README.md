# AR Iron Man Mask (Web)

A browser-based augmented reality demo that overlays an Iron Man-inspired helmet onto your live camera feed. It uses MediaPipe FaceMesh for real-time facial landmark tracking and draws the mask programmatically on a `<canvas>`, including an interactive faceplate open/close animation.

## Features

- Real-time face tracking via MediaPipe FaceMesh
- Programmatically rendered helmet with iconic red/gold palette and dark accents
- Faceplate open/close animation controlled by a button and a slider
- High-DPI canvas with smoothing and light landmark-based pose smoothing

## Quick Start

1. Serve this folder over HTTP (required for camera on most browsers):
   - Python
     ```bash
     cd /workspace
     python3 -m http.server 5173 --bind 0.0.0.0
     ```
   - Or Node (if you prefer):
     ```bash
     npx serve -l 5173
     ```
2. Open `http://localhost:5173/` in Chrome or Edge.
3. Allow camera permissions when prompted.
4. Use the “Toggle Faceplate” button or drag the “Faceplate” slider.

## Notes and Tips

- Lighting: Works best with even, front-facing light.
- Framing: Keep your whole face in view for best results.
- Mirroring: The video and overlay are mirrored for a selfie-like experience.
- HTTPS: If you host this anywhere other than `localhost`, use HTTPS so `getUserMedia` is allowed.
- Performance: Close other heavy tabs/apps. A modern laptop or phone is recommended.

## How it Works

- `index.html` wires the UI and includes MediaPipe via CDN.
- `main.js` captures the camera, runs FaceMesh, computes a simple pose (center/scale/rotation) from eye/chin landmarks, and draws the helmet with a faceplate animation.
- `styles.css` applies a red/gold/dark theme and lays out the mirrored video + overlay stage.

## Customization

- Colors: Update CSS variables in `styles.css`.
- Helmet shape: Edit the points and curves inside `drawIronManHelmet` in `main.js`.
- Animation: Tweak the duration/easing in `animateFaceplateTo`.

## Credits

- Face tracking: MediaPipe FaceMesh

