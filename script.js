'use strict';

const state = {
  isFaceplateOpen: false,
  currentStream: null,
  currentDeviceId: null,
  devices: [],
  canvasScale: 1,
};

const elements = {
  video: document.getElementById('camera'),
  canvas: document.getElementById('overlay'),
  toggle: document.getElementById('toggleFaceplate'),
  switchCamera: document.getElementById('switchCamera'),
  message: document.getElementById('message'),
};

const ctx = elements.canvas.getContext('2d');

function setMessage(text, type = 'info') {
  if (!elements.message) return;
  elements.message.textContent = text;
  elements.message.hidden = !text;
}

async function listCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    state.devices = devices.filter(d => d.kind === 'videoinput');
  } catch (err) {
    console.error(err);
  }
}

async function startCamera(deviceId) {
  if (!navigator.mediaDevices?.getUserMedia) {
    setMessage('Camera not supported in this browser.');
    return;
  }
  try {
    if (state.currentStream) {
      state.currentStream.getTracks().forEach(t => t.stop());
    }
    const constraints = {
      audio: false,
      video: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        facingMode: deviceId ? undefined : { ideal: 'user' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      }
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    elements.video.srcObject = stream;
    state.currentStream = stream;
    state.currentDeviceId = deviceId || (stream.getVideoTracks()[0]?.getSettings()?.deviceId ?? null);
    await elements.video.play();
    resizeCanvas();
    setMessage('');
  } catch (err) {
    console.error(err);
    setMessage('Unable to access camera. Please allow camera permission.');
  }
}

function resizeCanvas() {
  const { video, canvas } = elements;
  const rect = video.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  state.canvasScale = canvas.width / rect.width;
}

window.addEventListener('resize', resizeCanvas);

// Helmet drawing
function drawHelmet(landmarks) {
  const scale = state.canvasScale;
  ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);

  if (!landmarks || landmarks.length === 0) return;

  // Compute core anchors
  const leftCheek = landmarks[234];
  const rightCheek = landmarks[454];
  const chin = landmarks[152];
  const forehead = landmarks[10];
  const noseTip = landmarks[1];
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];

  // Project to canvas pixels
  const W = elements.canvas.width;
  const H = elements.canvas.height;
  function px(p) { return [p.x * W, p.y * H]; }

  const [lx, ly] = px(leftCheek);
  const [rx, ry] = px(rightCheek);
  const [cx, cy] = px(chin);
  const [fx, fy] = px(forehead);
  const [nx, ny] = px(noseTip);
  const [lex, ley] = px(leftEye);
  const [rex, rey] = px(rightEye);

  // Helmet bounds
  const faceWidth = Math.hypot(rx - lx, ry - ly);
  const faceHeight = Math.hypot(cy - fy, cx - fx);
  const helmetWidth = faceWidth * 1.5;
  const helmetHeight = faceHeight * 1.8;
  const centerX = (lx + rx) / 2;
  const centerY = (fy + cy) / 2 - faceHeight * 0.05;

  // Rotation from eye line
  const angle = Math.atan2(rey - ley, rex - lex);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);

  // Base helmet shape
  drawHelmetBase(helmetWidth, helmetHeight);

  // Faceplate (animated open/close)
  drawFaceplate(helmetWidth, helmetHeight, state.isFaceplateOpen);

  // Eyes glow
  drawEyesGlow(nx - centerX, ny - centerY, helmetWidth, helmetHeight);

  ctx.restore();
}

function roundedRectPath(x, y, w, h, r) {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function drawHelmetBase(w, h) {
  const x = -w / 2;
  const y = -h * 0.55;

  // Outer shell (red)
  roundedRectPath(x, y, w, h * 0.95, Math.min(w, h) * 0.12);
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, '#7d1206');
  grad.addColorStop(0.5, '#b21807');
  grad.addColorStop(1, '#5e0c04');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = Math.max(2, w * 0.01);
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.stroke();

  // Gold face area base beneath faceplate
  const faceX = x + w * 0.18;
  const faceY = y + h * 0.22;
  const faceW = w * 0.64;
  const faceH = h * 0.62;
  roundedRectPath(faceX, faceY, faceW, faceH, Math.min(w, h) * 0.08);
  const gold = ctx.createLinearGradient(0, faceY, 0, faceY + faceH);
  gold.addColorStop(0, '#f3d26a');
  gold.addColorStop(0.4, '#c9a227');
  gold.addColorStop(1, '#7a651a');
  ctx.fillStyle = gold;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.stroke();

  // Side panels (darker red accents)
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  roundedRectPath(x + w * 0.04, y + h * 0.35, w * 0.12, h * 0.35, w * 0.03);
  ctx.fill();
  roundedRectPath(x + w * 0.84, y + h * 0.35, w * 0.12, h * 0.35, w * 0.03);
  ctx.fill();
}

function drawFaceplate(w, h, open) {
  const x = -w / 2 + w * 0.18;
  const y = -h * 0.55 + h * 0.22;
  const faceW = w * 0.64;
  const faceH = h * 0.62;

  const hingeX = x + faceW * 0.5;
  const hingeY = y + faceH * 0.06;
  const openT = open ? 1 : 0;
  const theta = -Math.PI * 0.9 * openT; // rotate up when open

  ctx.save();
  ctx.translate(hingeX, hingeY);
  ctx.rotate(theta);
  ctx.translate(-hingeX, -hingeY);

  // Faceplate shape
  roundedRectPath(x, y, faceW, faceH, Math.min(w, h) * 0.08);
  const plate = ctx.createLinearGradient(0, y, 0, y + faceH);
  plate.addColorStop(0, '#ffe189');
  plate.addColorStop(0.5, '#d9b33a');
  plate.addColorStop(1, '#8a7330');
  ctx.fillStyle = plate;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = Math.max(2, w * 0.01);
  ctx.stroke();

  // Eye slots
  const eyeW = faceW * 0.26;
  const eyeH = faceH * 0.1;
  const eyeY = y + faceH * 0.38;
  const eyeGap = faceW * 0.06;
  const leftEyeX = x + faceW * 0.5 - eyeGap / 2 - eyeW;
  const rightEyeX = x + faceW * 0.5 + eyeGap / 2;

  ctx.fillStyle = '#0a1016';
  roundedRectPath(leftEyeX, eyeY, eyeW, eyeH, eyeH * 0.45);
  ctx.fill();
  roundedRectPath(rightEyeX, eyeY, eyeW, eyeH, eyeH * 0.45);
  ctx.fill();

  // Eye inner glow
  const glowGrad = ctx.createLinearGradient(0, eyeY, 0, eyeY + eyeH);
  glowGrad.addColorStop(0, 'rgba(22,255,227,0.9)');
  glowGrad.addColorStop(1, 'rgba(22,255,227,0.2)');
  ctx.fillStyle = glowGrad;
  roundedRectPath(leftEyeX + 4, eyeY + 3, eyeW - 8, eyeH - 6, eyeH * 0.35);
  ctx.fill();
  roundedRectPath(rightEyeX + 4, eyeY + 3, eyeW - 8, eyeH - 6, eyeH * 0.35);
  ctx.fill();

  ctx.restore();
}

function drawEyesGlow(nx, ny, w, h) {
  // Subtle screen blend glow aligned near nose bridge
  ctx.globalCompositeOperation = 'lighter';
  const r = Math.max(8, w * 0.04);
  const grad = ctx.createRadialGradient(nx, ny - h * 0.08, 1, nx, ny - h * 0.08, r);
  grad.addColorStop(0, 'rgba(22,255,227,0.35)');
  grad.addColorStop(1, 'rgba(22,255,227,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(nx, ny - h * 0.08, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
}

// Face tracking via MediaPipe FaceMesh
let faceMesh = null;
let cameraMP = null;

async function initFaceMesh() {
  return new Promise(resolve => {
    faceMesh = new FaceMesh({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${f}` });
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    faceMesh.onResults(results => {
      const landmarks = results.multiFaceLandmarks?.[0] || null;
      drawHelmet(landmarks);
    });
    resolve();
  });
}

async function initProcessing() {
  cameraMP = new Camera(elements.video, {
    onFrame: async () => {
      await faceMesh.send({ image: elements.video });
    },
    width: 1280,
    height: 720,
  });
  cameraMP.start();
}

function toggleFaceplate() {
  state.isFaceplateOpen = !state.isFaceplateOpen;
  elements.toggle.textContent = state.isFaceplateOpen ? 'Close Faceplate' : 'Open Faceplate';
}

async function switchCamera() {
  if (state.devices.length < 2) {
    setMessage('Only one camera detected.');
    return;
  }
  const idx = state.devices.findIndex(d => d.deviceId === state.currentDeviceId);
  const next = state.devices[(idx + 1) % state.devices.length];
  await startCamera(next.deviceId);
}

async function bootstrap() {
  setMessage('Initializing…');
  await listCameras();
  await startCamera();
  await initFaceMesh();
  await initProcessing();
  elements.toggle.addEventListener('click', toggleFaceplate);
  elements.switchCamera.addEventListener('click', switchCamera);
}

document.addEventListener('DOMContentLoaded', bootstrap);

