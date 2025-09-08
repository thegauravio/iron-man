// Iron Man AR Mask script

let videoEl = document.getElementById('inputVideo');
let canvasEl = document.getElementById('overlay');
let ctx = canvasEl.getContext('2d');
let maskOpen = true;

// Setup camera
const camera = new Camera(videoEl, {
  onFrame: async () => {
    await faceMesh.send({ image: videoEl });
  },
  width: 640,
  height: 480,
});
camera.start();

// Setup FaceMesh
const faceMesh = new FaceMesh({ locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}` });
faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});
faceMesh.onResults(onResults);

function onResults(results) {
  if (!results.multiFaceLandmarks[0]) return;
  const landmarks = results.multiFaceLandmarks[0];

  // Resize canvas to match video
  canvasEl.width = videoEl.videoWidth;
  canvasEl.height = videoEl.videoHeight;

  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

  drawIronManMask(landmarks);
}

function drawIronManMask(landmarks) {
  // TODO: calculate positions and draw helmet parts
  // Placeholder debug: draw landmarks dots
  ctx.fillStyle = '#00FF00';
  landmarks.forEach(pt => {
    ctx.beginPath();
    ctx.arc(pt.x * canvasEl.width, pt.y * canvasEl.height, 1.5, 0, Math.PI * 2);
    ctx.fill();
  });
}

document.getElementById('toggleMask').addEventListener('click', () => {
  maskOpen = !maskOpen;
  // TODO: trigger faceplate animation
});