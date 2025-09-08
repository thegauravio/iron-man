# Iron Man AR Face Mask 🚀

An immersive augmented reality web application that overlays a dynamic Iron Man face mask onto your live camera feed with real-time face tracking and interactive animations.

![Iron Man AR Demo](https://img.shields.io/badge/Status-Ready-brightgreen)
![Web Technologies](https://img.shields.io/badge/Tech-HTML5%20%7C%20CSS3%20%7C%20JavaScript-blue)
![Face Tracking](https://img.shields.io/badge/AI-MediaPipe%20Face%20Mesh-orange)

## ✨ Features

### 🎭 **Real-Time Face Tracking**
- Accurate face detection and landmark tracking using Google's MediaPipe
- Smooth mask positioning with motion smoothing algorithms
- Handles face movement and rotation naturally

### 🤖 **Iron Man Helmet Design**
- Authentic red and gold color scheme with dark accents
- Detailed helmet structure with side panels and vents
- Glowing arc reactor indicator on the forehead
- Bright blue LED-style eye slots with glow effects

### 🎬 **Interactive Faceplate Animation**
- Smooth opening/closing faceplate animation
- Realistic mouth grille details
- Keyboard shortcuts for quick control
- Visual feedback with color-coded status indicators

### 🎨 **Modern UI/UX**
- Sleek, futuristic interface design
- Responsive layout for all screen sizes
- Real-time FPS counter and status updates
- Glowing button effects and animations

## 🚀 Getting Started

### Prerequisites
- Modern web browser with WebRTC support (Chrome, Firefox, Safari, Edge)
- Camera access permissions
- HTTPS connection (required for camera access)

### Installation
1. Clone or download this repository
2. Serve the files using a local web server (due to CORS restrictions)
3. Open `index.html` in your browser

#### Using Python (recommended):
```bash
# Python 3
python -m http.server 8000

# Python 2
python -SimpleHTTPServer 8000
```

#### Using Node.js:
```bash
npx serve .
```

#### Using PHP:
```bash
php -S localhost:8000
```

### Usage
1. Click "Start Camera" to begin video capture
2. Allow camera permissions when prompted
3. Position your face in the camera view
4. The Iron Man mask will automatically overlay when your face is detected
5. Use "Open/Close Faceplate" to animate the mouth piece
6. Press spacebar for quick faceplate toggle, or 'M' to toggle the mask

## 🎮 Controls

| Action | Button | Keyboard |
|--------|--------|----------|
| Start/Stop Camera | Start Camera | - |
| Toggle Mask | Toggle Mask | M |
| Faceplate Animation | Open/Close Faceplate | Spacebar |

## 🛠 Technical Implementation

### Face Tracking Technology
- **MediaPipe Face Mesh**: 468-point facial landmark detection
- **Real-time Processing**: 30+ FPS on modern devices
- **Motion Smoothing**: Reduces jitter and provides stable tracking
- **Adaptive Detection**: Handles various lighting conditions and face angles

### Rendering Pipeline
- **HTML5 Canvas**: High-performance 2D graphics rendering
- **Layered Composition**: Separate canvases for video and mask overlay
- **Gradient Rendering**: Realistic metallic surfaces and lighting effects
- **Animation System**: Smooth transitions and interactive elements

### Performance Optimizations
- **Efficient Rendering**: Only updates when face data changes
- **Memory Management**: Proper cleanup of video streams and contexts
- **Responsive Design**: Adapts to different screen sizes and orientations
- **FPS Monitoring**: Real-time performance tracking

## 📱 Browser Compatibility

| Browser | Desktop | Mobile |
|---------|---------|--------|
| Chrome | ✅ | ✅ |
| Firefox | ✅ | ✅ |
| Safari | ✅ | ✅ |
| Edge | ✅ | ✅ |

## 🔧 Customization

### Mask Colors
Edit the gradient colors in `script.js` to customize the helmet appearance:
```javascript
// Main helmet gradient
gradient.addColorStop(0, '#ff4444'); // Light red
gradient.addColorStop(1, '#660000'); // Dark red

// Gold accents
gradient.addColorStop(0, '#ffd700'); // Gold
```

### Animation Speed
Adjust the faceplate animation speed:
```javascript
this.animationSpeed = 0.1; // Increase for faster animation
```

### Face Tracking Sensitivity
Modify detection thresholds:
```javascript
this.faceMesh.setOptions({
    minDetectionConfidence: 0.5, // Lower = more sensitive
    minTrackingConfidence: 0.5   // Lower = more sensitive
});
```

## 🔒 Privacy & Security

- **Local Processing**: All face detection runs entirely in your browser
- **No Data Collection**: No facial data is stored or transmitted
- **Camera Access**: Only used for real-time processing, not recorded
- **Open Source**: Full transparency of all code and functionality

## 🎯 Future Enhancements

- [ ] Multiple mask options (War Machine, Mark 85, etc.)
- [ ] Voice modulation effects
- [ ] Hand gesture recognition
- [ ] AR background environments
- [ ] Photo/video capture functionality
- [ ] Mobile app versions

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Google MediaPipe team for the face tracking technology
- Marvel Studios for the iconic Iron Man design inspiration
- Web development community for continuous innovation

---

**Ready to suit up?** 🦾 Start the application and become Tony Stark!