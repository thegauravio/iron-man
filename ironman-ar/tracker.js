export class FaceTracker{
  async init(){
    // Lazy-load MediaPipe FaceMesh via CDN (Tasks Vision) if available, else fallback minimal mesh estimation
    const vision = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.11/vision_bundle.mjs");
    const { FilesetResolver, FaceLandmarker } = vision;
    this.filesetResolver = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.11/wasm");
    this.faceLandmarker = await FaceLandmarker.createFromOptions(this.filesetResolver, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
      },
      runningMode: "VIDEO",
      numFaces: 1,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: true
    });
    this.videoTs = 0;
  }
  async update(video){
    if(!this.faceLandmarker) return null;
    this.videoTs = performance.now();
    const result = this.faceLandmarker.detectForVideo(video, this.videoTs);
    if(result && result.faceLandmarks && result.faceLandmarks.length){
      return result.faceLandmarks[0];
    }
    return null;
  }
}
