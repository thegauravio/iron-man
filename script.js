// Iron Man AR Face Mask Application
class IronManAR {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.maskCanvas = document.getElementById('mask-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.maskCtx = this.maskCanvas.getContext('2d');
        
        this.faceMesh = null;
        this.camera = null;
        this.isRunning = false;
        this.maskEnabled = true;
        this.faceplateOpen = false;
        this.faceplateAnimation = 0;
        this.animationSpeed = 0.1;
        
        this.faceDetected = false;
        this.lastFaceData = null;
        this.smoothingFactor = 0.7;
        
        // FPS tracking
        this.fps = 0;
        this.lastTime = 0;
        this.frameCount = 0;
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeFaceMesh();
    }
    
    initializeElements() {
        this.toggleCameraBtn = document.getElementById('toggle-camera');
        this.toggleMaskBtn = document.getElementById('toggle-mask');
        this.toggleFaceplateBtn = document.getElementById('toggle-faceplate');
        this.statusText = document.getElementById('status-text');
        this.fpsCounter = document.getElementById('fps-counter');
    }
    
    setupEventListeners() {
        this.toggleCameraBtn.addEventListener('click', () => this.toggleCamera());
        this.toggleMaskBtn.addEventListener('click', () => this.toggleMask());
        this.toggleFaceplateBtn.addEventListener('click', () => this.toggleFaceplate());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case ' ':
                    e.preventDefault();
                    this.toggleFaceplate();
                    break;
                case 'm':
                    this.toggleMask();
                    break;
            }
        });
    }
    
    async initializeFaceMesh() {
        this.faceMesh = new FaceMesh({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            }
        });
        
        this.faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        
        this.faceMesh.onResults((results) => this.onFaceResults(results));
    }
    
    async toggleCamera() {
        if (!this.isRunning) {
            await this.startCamera();
        } else {
            this.stopCamera();
        }
    }
    
    async startCamera() {
        try {
            this.statusText.textContent = 'Starting camera...';
            this.toggleCameraBtn.innerHTML = 'Starting... <div class="loading"></div>';
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            });
            
            this.video.srcObject = stream;
            
            this.video.onloadedmetadata = () => {
                this.setupCanvas();
                this.startFaceDetection();
                this.isRunning = true;
                this.toggleCameraBtn.textContent = 'Stop Camera';
                this.toggleMaskBtn.disabled = false;
                this.toggleFaceplateBtn.disabled = false;
                this.statusText.textContent = 'Camera active - Looking for face...';
                this.video.classList.add('glow-red');
            };
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            this.statusText.textContent = 'Camera access denied or not available';
            this.toggleCameraBtn.textContent = 'Start Camera';
        }
    }
    
    stopCamera() {
        if (this.video.srcObject) {
            this.video.srcObject.getTracks().forEach(track => track.stop());
            this.video.srcObject = null;
        }
        
        if (this.camera) {
            this.camera.stop();
        }
        
        this.isRunning = false;
        this.faceDetected = false;
        this.toggleCameraBtn.textContent = 'Start Camera';
        this.toggleMaskBtn.disabled = true;
        this.toggleFaceplateBtn.disabled = true;
        this.statusText.textContent = 'Camera stopped';
        this.video.classList.remove('glow-red', 'glow-gold');
        
        // Clear canvases
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.maskCtx.clearRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
    }
    
    setupCanvas() {
        const rect = this.video.getBoundingClientRect();
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        this.maskCanvas.width = this.video.videoWidth;
        this.maskCanvas.height = this.video.videoHeight;
        
        // Set canvas display size
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.maskCanvas.style.width = '100%';
        this.maskCanvas.style.height = '100%';
    }
    
    startFaceDetection() {
        this.camera = new Camera(this.video, {
            onFrame: async () => {
                await this.faceMesh.send({ image: this.video });
                this.updateFPS();
            },
            width: 1280,
            height: 720
        });
        this.camera.start();
    }
    
    onFaceResults(results) {
        // Clear previous frame
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.maskCtx.clearRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
        
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            if (!this.faceDetected) {
                this.faceDetected = true;
                this.statusText.textContent = 'Face detected - Iron Man mask active!';
                this.video.classList.remove('glow-red');
                this.video.classList.add('glow-gold');
            }
            
            const landmarks = results.multiFaceLandmarks[0];
            this.lastFaceData = this.smoothLandmarks(landmarks, this.lastFaceData);
            
            if (this.maskEnabled) {
                this.drawIronManMask(this.lastFaceData);
            }
        } else {
            if (this.faceDetected) {
                this.faceDetected = false;
                this.statusText.textContent = 'Face lost - Searching...';
                this.video.classList.remove('glow-gold');
                this.video.classList.add('glow-red');
            }
        }
    }
    
    smoothLandmarks(newLandmarks, oldLandmarks) {
        if (!oldLandmarks) return newLandmarks;
        
        return newLandmarks.map((landmark, index) => ({
            x: landmark.x * (1 - this.smoothingFactor) + oldLandmarks[index].x * this.smoothingFactor,
            y: landmark.y * (1 - this.smoothingFactor) + oldLandmarks[index].y * this.smoothingFactor,
            z: landmark.z * (1 - this.smoothingFactor) + oldLandmarks[index].z * this.smoothingFactor
        }));
    }
    
    drawIronManMask(landmarks) {
        const ctx = this.maskCtx;
        const width = this.maskCanvas.width;
        const height = this.maskCanvas.height;
        
        // Get key face points
        const forehead = landmarks[10];
        const leftTemple = landmarks[234];
        const rightTemple = landmarks[454];
        const nose = landmarks[1];
        const leftCheek = landmarks[116];
        const rightCheek = landmarks[345];
        const chin = landmarks[175];
        
        // Convert normalized coordinates to canvas coordinates
        const points = {
            forehead: { x: forehead.x * width, y: forehead.y * height },
            leftTemple: { x: leftTemple.x * width, y: leftTemple.y * height },
            rightTemple: { x: rightTemple.x * width, y: rightTemple.y * height },
            nose: { x: nose.x * width, y: nose.y * height },
            leftCheek: { x: leftCheek.x * width, y: leftCheek.y * height },
            rightCheek: { x: rightCheek.x * width, y: rightCheek.y * height },
            chin: { x: chin.x * width, y: chin.y * height }
        };
        
        // Calculate mask dimensions
        const maskWidth = Math.abs(points.rightTemple.x - points.leftTemple.x) * 1.3;
        const maskHeight = Math.abs(points.chin.y - points.forehead.y) * 1.2;
        const centerX = (points.leftTemple.x + points.rightTemple.x) / 2;
        const centerY = (points.forehead.y + points.chin.y) / 2;
        
        // Update faceplate animation
        if (this.faceplateOpen) {
            this.faceplateAnimation = Math.min(1, this.faceplateAnimation + this.animationSpeed);
        } else {
            this.faceplateAnimation = Math.max(0, this.faceplateAnimation - this.animationSpeed);
        }
        
        // Draw Iron Man helmet
        this.drawHelmet(ctx, centerX, centerY, maskWidth, maskHeight);
        this.drawEyeSlots(ctx, centerX, centerY, maskWidth, maskHeight);
        this.drawFaceplate(ctx, centerX, centerY, maskWidth, maskHeight);
        this.drawDetails(ctx, centerX, centerY, maskWidth, maskHeight);
    }
    
    drawHelmet(ctx, centerX, centerY, width, height) {
        ctx.save();
        
        // Main helmet shape
        const gradient = ctx.createRadialGradient(centerX, centerY - height * 0.2, 0, centerX, centerY, width * 0.8);
        gradient.addColorStop(0, '#ff4444');
        gradient.addColorStop(0.3, '#cc0000');
        gradient.addColorStop(0.7, '#990000');
        gradient.addColorStop(1, '#660000');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - height * 0.1, width * 0.45, height * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Helmet outline
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Side panels
        this.drawSidePanel(ctx, centerX - width * 0.35, centerY, width * 0.15, height * 0.3);
        this.drawSidePanel(ctx, centerX + width * 0.35, centerY, width * 0.15, height * 0.3);
        
        ctx.restore();
    }
    
    drawSidePanel(ctx, x, y, width, height) {
        const gradient = ctx.createLinearGradient(x - width/2, y, x + width/2, y);
        gradient.addColorStop(0, '#ffd700');
        gradient.addColorStop(0.5, '#ffaa00');
        gradient.addColorStop(1, '#cc8800');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x - width/2, y - height/2, width, height, 8);
        ctx.fill();
        
        ctx.strokeStyle = '#996600';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    drawEyeSlots(ctx, centerX, centerY, width, height) {
        const eyeWidth = width * 0.12;
        const eyeHeight = height * 0.08;
        const eyeY = centerY - height * 0.05;
        
        // Left eye
        this.drawEye(ctx, centerX - width * 0.15, eyeY, eyeWidth, eyeHeight);
        // Right eye  
        this.drawEye(ctx, centerX + width * 0.15, eyeY, eyeWidth, eyeHeight);
    }
    
    drawEye(ctx, x, y, width, height) {
        // Eye glow effect
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, width);
        glowGradient.addColorStop(0, '#00ffff');
        glowGradient.addColorStop(0.3, '#0099ff');
        glowGradient.addColorStop(0.7, '#0066cc');
        glowGradient.addColorStop(1, 'rgba(0, 102, 204, 0)');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.ellipse(x, y, width * 1.5, height * 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye shape
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(x, y, width, height, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye center
        ctx.fillStyle = '#00aaff';
        ctx.beginPath();
        ctx.ellipse(x, y, width * 0.7, height * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupil
        ctx.fillStyle = '#003366';
        ctx.beginPath();
        ctx.ellipse(x, y, width * 0.3, height * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawFaceplate(ctx, centerX, centerY, width, height) {
        if (this.faceplateAnimation > 0) {
            ctx.save();
            
            // Animate faceplate opening
            const openAmount = this.faceplateAnimation;
            const faceplateHeight = height * 0.25;
            const faceplateY = centerY + height * 0.1;
            
            // Transform for opening animation
            ctx.translate(centerX, faceplateY - faceplateHeight/2);
            ctx.rotate(-openAmount * Math.PI * 0.3);
            ctx.translate(-centerX, -(faceplateY - faceplateHeight/2));
            
            // Faceplate gradient
            const gradient = ctx.createLinearGradient(centerX - width * 0.4, faceplateY, centerX + width * 0.4, faceplateY);
            gradient.addColorStop(0, '#ff6666');
            gradient.addColorStop(0.3, '#ff3333');
            gradient.addColorStop(0.7, '#cc0000');
            gradient.addColorStop(1, '#990000');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(centerX - width * 0.4, faceplateY - faceplateHeight/2, width * 0.8, faceplateHeight, 10);
            ctx.fill();
            
            // Faceplate outline
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Mouth grille lines
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 1;
            for (let i = 0; i < 5; i++) {
                const lineY = faceplateY - faceplateHeight * 0.3 + (i * faceplateHeight * 0.15);
                ctx.beginPath();
                ctx.moveTo(centerX - width * 0.3, lineY);
                ctx.lineTo(centerX + width * 0.3, lineY);
                ctx.stroke();
            }
            
            ctx.restore();
        }
    }
    
    drawDetails(ctx, centerX, centerY, width, height) {
        // Forehead arc reactor indicator
        ctx.save();
        const arcX = centerX;
        const arcY = centerY - height * 0.25;
        
        const arcGradient = ctx.createRadialGradient(arcX, arcY, 0, arcX, arcY, width * 0.05);
        arcGradient.addColorStop(0, '#00ffff');
        arcGradient.addColorStop(0.5, '#0099ff');
        arcGradient.addColorStop(1, 'rgba(0, 153, 255, 0)');
        
        ctx.fillStyle = arcGradient;
        ctx.beginPath();
        ctx.ellipse(arcX, arcY, width * 0.03, width * 0.03, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Cheek vents
        this.drawVent(ctx, centerX - width * 0.25, centerY + height * 0.05, width * 0.08, height * 0.04);
        this.drawVent(ctx, centerX + width * 0.25, centerY + height * 0.05, width * 0.08, height * 0.04);
    }
    
    drawVent(ctx, x, y, width, height) {
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.roundRect(x - width/2, y - height/2, width, height, 3);
        ctx.fill();
        
        // Vent lines
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const lineY = y - height * 0.3 + (i * height * 0.3);
            ctx.beginPath();
            ctx.moveTo(x - width * 0.4, lineY);
            ctx.lineTo(x + width * 0.4, lineY);
            ctx.stroke();
        }
    }
    
    toggleMask() {
        this.maskEnabled = !this.maskEnabled;
        this.toggleMaskBtn.textContent = this.maskEnabled ? 'Hide Mask' : 'Show Mask';
        this.statusText.textContent = this.maskEnabled ? 'Iron Man mask enabled' : 'Iron Man mask disabled';
    }
    
    toggleFaceplate() {
        this.faceplateOpen = !this.faceplateOpen;
        this.toggleFaceplateBtn.textContent = this.faceplateOpen ? 'Close Faceplate' : 'Open Faceplate';
    }
    
    updateFPS() {
        this.frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - this.lastTime >= 1000) {
            this.fps = Math.round(this.frameCount * 1000 / (currentTime - this.lastTime));
            this.fpsCounter.textContent = `FPS: ${this.fps}`;
            this.frameCount = 0;
            this.lastTime = currentTime;
        }
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new IronManAR();
});