import { FaceTracker } from "./tracker.js";
import { HelmetRenderer } from "./helmet.js";

const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d", { alpha: true });
const toggleBtn = document.getElementById("toggleFaceplate");
const cameraSelect = document.getElementById("cameraSelect");

let isFaceplateOpen = false;
let tracker;
let renderer;
let currentStream;

async function listCameras(){
  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoDevices = devices.filter(d=>d.kind === "videoinput");
  cameraSelect.innerHTML = videoDevices.map((d,idx)=>`<option value="${d.deviceId}">${d.label||`Camera ${idx+1}`}</option>`).join("");
}

async function startCamera(deviceId){
  if(currentStream){ currentStream.getTracks().forEach(t=>t.stop()); }
  const constraints = { video: { deviceId: deviceId ? { exact: deviceId } : undefined, facingMode: "user" }, audio:false };
  currentStream = await navigator.mediaDevices.getUserMedia(constraints);
  video.srcObject = currentStream;
  await video.play();
  resizeCanvas();
}

function resizeCanvas(){
  const { videoWidth, videoHeight } = video;
  if(videoWidth && videoHeight){
    canvas.width = videoWidth;
    canvas.height = videoHeight;
  }
}

function onResize(){
  resizeCanvas();
}

async function init(){
  await startCamera();
  await listCameras();
  tracker = new FaceTracker();
  await tracker.init();
  renderer = new HelmetRenderer();
  window.addEventListener("resize", onResize);
  document.addEventListener("keydown", (e)=>{ if(e.key.toLowerCase()==="f"){ toggleFaceplate(); }});
  toggleBtn.addEventListener("click", toggleFaceplate);
  cameraSelect.addEventListener("change", (e)=> startCamera(e.target.value));
  requestAnimationFrame(loop);
}

function toggleFaceplate(){
  isFaceplateOpen = !isFaceplateOpen;
  toggleBtn.setAttribute("aria-pressed", String(isFaceplateOpen));
  toggleBtn.textContent = isFaceplateOpen ? "Close Faceplate" : "Open Faceplate";
  renderer.setFaceplateOpen(isFaceplateOpen);
}

async function loop(){
  if(video.readyState >= 2){
    const landmarks = await tracker.update(video);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(landmarks){
      renderer.render(ctx, landmarks, canvas.width, canvas.height);
    }
  }
  requestAnimationFrame(loop);
}

init().catch(err=>{
  console.error(err);
  alert("Camera or tracker failed to initialize. See console.");
});
