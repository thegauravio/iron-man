/*
  AR Iron Man Mask
  - Captures camera stream
  - Runs MediaPipe FaceMesh for real-time face landmarks
  - Computes face pose (position, scale, rotation) from landmarks
  - Draws an Iron Man-inspired helmet with an animated faceplate
*/

const state = {
  isReady: false,
  faceplateProgress: 0, // 0 closed, 1 fully open
  smoothing: {
    centerX: 0,
    centerY: 0,
    scale: 0,
    rotation: 0,
  },
};

const els = {
  video: document.getElementById('video'),
  canvas: document.getElementById('overlay'),
  status: document.getElementById('status'),
  toggleBtn: document.getElementById('toggleFaceplateBtn'),
  range: document.getElementById('faceplateRange'),
  stageWrapper: document.getElementById('stageWrapper'),
};

let ctx = null;
let camera = null;
let lastToggleTarget = 0;

function setStatus(text) {
  if (els.status) els.status.textContent = text;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function resizeCanvasToElement(canvas, element) {
  const rect = element.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.floor(rect.width * dpr);
  const height = Math.floor(rect.height * dpr);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  return { width, height, dpr };
}

function getFacePose(landmarks, width, height) {
  // Use key landmarks: eyes outer corners, chin, forehead approximation
  const lm = (i) => landmarks[i];
  const leftEyeOuter = lm(33); // right eye on mirrored view, but indices fixed
  const rightEyeOuter = lm(263);
  const noseTip = lm(1);
  const chin = lm(152);

  // Convert normalized to pixel space
  const nx = (p) => p.x * width;
  const ny = (p) => p.y * height;

  const pL = { x: nx(leftEyeOuter), y: ny(leftEyeOuter) };
  const pR = { x: nx(rightEyeOuter), y: ny(rightEyeOuter) };
  const pN = { x: nx(noseTip), y: ny(noseTip) };
  const pC = { x: nx(chin), y: ny(chin) };

  const centerX = (pL.x + pR.x + pN.x) / 3;
  const centerY = (pL.y + pR.y + pN.y) / 3;

  const dx = pR.x - pL.x;
  const dy = pR.y - pL.y;
  const eyeDistance = Math.hypot(dx, dy) + 1e-5;

  const rotation = Math.atan2(dy, dx); // in radians
  const faceHeight = Math.hypot(pC.x - pN.x, pC.y - pN.y);
  const scale = clamp((eyeDistance + faceHeight * 0.6) * 1.15, 40, Math.max(width, height));

  return { centerX, centerY, scale, rotation };
}

function drawRoundedPolygonPath(ctx, points, radius) {
  if (points.length < 2) return;
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    const prev = points[(i - 1 + points.length) % points.length];
    const curr = points[i];
    const next = points[(i + 1) % points.length];
    const v1x = curr.x - prev.x, v1y = curr.y - prev.y;
    const v2x = next.x - curr.x, v2y = next.y - curr.y;
    const len1 = Math.hypot(v1x, v1y);
    const len2 = Math.hypot(v2x, v2y);
    const r = Math.min(radius, len1 / 2, len2 / 2);
    const p1x = curr.x - (v1x / len1) * r;
    const p1y = curr.y - (v1y / len1) * r;
    const p2x = curr.x + (v2x / len2) * r;
    const p2y = curr.y + (v2y / len2) * r;
    if (i === 0) ctx.moveTo(p1x, p1y); else ctx.lineTo(p1x, p1y);
    ctx.quadraticCurveTo(curr.x, curr.y, p2x, p2y);
  }
  ctx.closePath();
}

function drawIronManHelmet(ctx, pose, openProgress) {
  const { centerX, centerY, scale, rotation } = pose;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(rotation);
  const s = scale;
  const w = s * 2.0;
  const h = s * 2.6;
  const rx = w * 0.5;
  const ry = h * 0.5;

  // Helmet outer shell (red)
  ctx.save();
  ctx.translate(0, s * 0.15);
  const shell = [
    { x: -rx * 0.85, y: -ry * 0.9 },
    { x: rx * 0.85, y: -ry * 0.9 },
    { x: rx * 1.0, y: -ry * 0.25 },
    { x: rx * 0.9, y: ry * 0.85 },
    { x: 0, y: ry * 1.0 },
    { x: -rx * 0.9, y: ry * 0.85 },
    { x: -rx * 1.0, y: -ry * 0.25 },
  ];
  drawRoundedPolygonPath(ctx, shell, s * 0.18);
  const gradShell = ctx.createLinearGradient(0, -ry, 0, ry);
  gradShell.addColorStop(0, '#9f0d24');
  gradShell.addColorStop(0.45, '#c8102e');
  gradShell.addColorStop(1, '#5b0a18');
  ctx.fillStyle = gradShell;
  ctx.fill();
  ctx.lineWidth = Math.max(2, s * 0.035);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.stroke();
  ctx.restore();

  // Gold faceplate base
  ctx.save();
  ctx.translate(0, s * 0.10);
  const faceW = w * 0.85;
  const faceH = h * 0.9;
  const faceRadius = s * 0.14;
  const faceTopCut = s * 0.55;

  // Faceplate opening: slide up and rotate slightly
  const openT = clamp(openProgress, 0, 1);
  const liftY = -openT * s * 0.9;
  const tilt = -openT * 0.15; // radians
  ctx.translate(0, liftY);
  ctx.rotate(tilt);

  // Base gold plate
  ctx.beginPath();
  ctx.moveTo(-faceW * 0.46, -faceH * 0.35);
  ctx.lineTo(-faceW * 0.2, -faceTopCut);
  ctx.lineTo(faceW * 0.2, -faceTopCut);
  ctx.lineTo(faceW * 0.46, -faceH * 0.35);
  ctx.lineTo(faceW * 0.52, faceH * 0.35);
  ctx.quadraticCurveTo(0, faceH * 0.60, -faceW * 0.52, faceH * 0.35);
  ctx.closePath();

  const gradGold = ctx.createLinearGradient(0, -faceH, 0, faceH);
  gradGold.addColorStop(0, '#f6e3a1');
  gradGold.addColorStop(0.15, '#e8c65b');
  gradGold.addColorStop(0.55, '#d4af37');
  gradGold.addColorStop(1, '#9c7f1e');
  ctx.fillStyle = gradGold;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = Math.max(1.5, s * 0.02);
  ctx.stroke();

  // Cheek lines/dark accents
  ctx.lineWidth = Math.max(1, s * 0.012);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.moveTo(-faceW * 0.40, -faceH * 0.10);
  ctx.lineTo(-faceW * 0.10, faceH * 0.22);
  ctx.moveTo(faceW * 0.40, -faceH * 0.10);
  ctx.lineTo(faceW * 0.10, faceH * 0.22);
  ctx.stroke();

  // Brow ridge
  ctx.lineWidth = Math.max(2, s * 0.018);
  ctx.beginPath();
  ctx.moveTo(-faceW * 0.35, -faceH * 0.08);
  ctx.quadraticCurveTo(0, -faceH * 0.22, faceW * 0.35, -faceH * 0.08);
  ctx.stroke();

  // Eye slits with blue glow
  const eyeW = faceW * 0.16;
  const eyeH = s * 0.07;
  const eyeY = -faceH * 0.02;
  const eyeX = faceW * 0.23;

  function drawEye(xSign) {
    ctx.save();
    ctx.translate(eyeX * xSign, eyeY);
    ctx.beginPath();
    ctx.moveTo(-eyeW * 0.5, 0);
    ctx.quadraticCurveTo(0, -eyeH * 0.95, eyeW * 0.5, 0);
    ctx.quadraticCurveTo(0, eyeH * 0.65, -eyeW * 0.5, 0);
    ctx.closePath();
    // Outer glow
    ctx.shadowColor = 'rgba(102,217,255,0.8)';
    ctx.shadowBlur = s * 0.12;
    ctx.fillStyle = '#b8f0ff';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = Math.max(1, s * 0.01);
    ctx.stroke();
    ctx.restore();
  }
  drawEye(-1);
  drawEye(1);

  // Mouth slit
  ctx.lineWidth = Math.max(1.5, s * 0.014);
  ctx.beginPath();
  ctx.moveTo(-faceW * 0.18, faceH * 0.28);
  ctx.lineTo(faceW * 0.18, faceH * 0.28);
  ctx.stroke();

  ctx.restore();

  // Forehead shell plate that overlaps when closed
  ctx.save();
  ctx.translate(0, s * 0.02);
  const forehead = [
    { x: -w * 0.36, y: -h * 0.62 },
    { x: w * 0.36, y: -h * 0.62 },
    { x: w * 0.46, y: -h * 0.38 },
    { x: -w * 0.46, y: -h * 0.38 },
  ];
  drawRoundedPolygonPath(ctx, forehead, s * 0.08);
  const gradFore = ctx.createLinearGradient(0, -h * 0.7, 0, -h * 0.3);
  gradFore.addColorStop(0, '#a30f26');
  gradFore.addColorStop(1, '#70101e');
  ctx.fillStyle = gradFore;
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

function smoothPose(pose) {
  const k = 0.25; // smoothing factor
  if (state.smoothing.scale === 0) {
    state.smoothing.centerX = pose.centerX;
    state.smoothing.centerY = pose.centerY;
    state.smoothing.scale = pose.scale;
    state.smoothing.rotation = pose.rotation;
    return state.smoothing;
  }
  state.smoothing.centerX = lerp(state.smoothing.centerX, pose.centerX, k);
  state.smoothing.centerY = lerp(state.smoothing.centerY, pose.centerY, k);
  state.smoothing.scale = lerp(state.smoothing.scale, pose.scale, k);
  // Handle rotation wrap-around by mapping to shortest arc
  const delta = Math.atan2(Math.sin(pose.rotation - state.smoothing.rotation), Math.cos(pose.rotation - state.smoothing.rotation));
  state.smoothing.rotation = state.smoothing.rotation + delta * k;
  return state.smoothing;
}

function renderHelmet(pose) {
  const { width, height } = els.canvas;
  ctx.clearRect(0, 0, width, height);
  drawIronManHelmet(ctx, pose, state.faceplateProgress);
}

async function initCameraAndFaceMesh() {
  setStatus('Requesting camera…');
  const constraints = {
    audio: false,
    video: {
      facingMode: 'user',
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    els.video.srcObject = stream;
  } catch (err) {
    setStatus('Camera access denied. Please allow camera.');
    console.error(err);
    return;
  }

  // Resize canvas to match video wrapper
  resizeCanvasToElement(els.canvas, els.stageWrapper);
  ctx = els.canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Setup FaceMesh
  setStatus('Loading FaceMesh…');
  const faceMesh = new FaceMesh({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}` });
  faceMesh.setOptions({
    selfieMode: true,
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  faceMesh.onResults(onResults);

  camera = new Camera(els.video, {
    onFrame: async () => {
      await faceMesh.send({ image: els.video });
    },
    width: 1280,
    height: 720,
  });
  camera.start();

  setStatus('Align your face in frame.');
  state.isReady = true;
}

function onResults(results) {
  if (!ctx) return;
  const { width, height } = els.canvas;

  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    const landmarks = results.multiFaceLandmarks[0];
    const pose = getFacePose(landmarks, width, height);
    const smoothed = smoothPose(pose);
    renderHelmet(smoothed);
    setStatus('');
  } else {
    ctx.clearRect(0, 0, width, height);
    setStatus('No face detected.');
  }
}

function animateFaceplateTo(target, durationMs = 350) {
  target = clamp(target, 0, 1);
  const start = performance.now();
  const from = state.faceplateProgress;
  const delta = target - from;
  if (Math.abs(delta) < 0.001) return;
  lastToggleTarget = target;

  function tick(now) {
    const t = clamp((now - start) / durationMs, 0, 1);
    // Ease in-out cubic
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    state.faceplateProgress = from + delta * e;
    if (t < 1 && Math.abs(lastToggleTarget - target) < 1e-6) {
      requestAnimationFrame(tick);
    } else if (t >= 1) {
      state.faceplateProgress = target;
    }
  }
  requestAnimationFrame(tick);
}

function setupUI() {
  els.toggleBtn.addEventListener('click', () => {
    const next = state.faceplateProgress < 0.5 ? 1 : 0;
    animateFaceplateTo(next);
    els.range.value = String(Math.round(next * 100));
  });

  els.range.addEventListener('input', (e) => {
    const val = Number(e.target.value) / 100;
    animateFaceplateTo(val, 120);
  });

  window.addEventListener('resize', () => {
    resizeCanvasToElement(els.canvas, els.stageWrapper);
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  setupUI();
  await initCameraAndFaceMesh();
});

