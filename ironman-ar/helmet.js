const COLORS = {
  red: "#b71c1c",
  redDark: "#7f0f0f",
  gold: "#d4af37",
  goldDark: "#8a6f1a",
  dark: "#121212",
  shadow: "rgba(0,0,0,0.5)",
  outline: "#1b1b1b"
};

export class HelmetRenderer{
  constructor(){
    this.faceplateOpen = false;
    this.animProgress = 0; // 0 closed, 1 open
    this.lastToggleTime = 0;
    this.animDurationMs = 350;
  }
  setFaceplateOpen(isOpen){
    const now = performance.now();
    const from = this.faceplateOpen ? 1 : 0;
    const to = isOpen ? 1 : 0;
    this.faceplateOpen = isOpen;
    // set start state to current eased progress to avoid jump
    const elapsed = Math.min(1, (now - this.lastToggleTime) / this.animDurationMs);
    const eased = this._easeInOutCubic(elapsed);
    const current = from + (to - from) * eased;
    this.animStartProgress = current;
    this.lastToggleTime = now;
  }
  _easeInOutCubic(t){
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  _getAnimProgress(){
    const now = performance.now();
    const t = Math.min(1, (now - this.lastToggleTime) / this.animDurationMs);
    const eased = this._easeInOutCubic(t);
    const target = this.faceplateOpen ? 1 : 0;
    const start = this.animStartProgress ?? (this.faceplateOpen ? 1 : 0);
    return start + (target - start) * eased;
  }
  render(ctx, landmarks, width, height){
    const p = this._getAnimProgress();
    // Key landmark indices for MP FaceMesh 468 model
    const IDX = {
      leftEye: 33, rightEye: 263, nose: 1, chin: 152, forehead: 10, leftCheek: 234, rightCheek: 454
    };
    const lm = (i)=>({ x: landmarks[i].x * width, y: landmarks[i].y * height });

    const leftEye = lm(IDX.leftEye);
    const rightEye = lm(IDX.rightEye);
    const nose = lm(IDX.nose);
    const chin = lm(IDX.chin);
    const forehead = lm(IDX.forehead);
    const leftCheek = lm(IDX.leftCheek);
    const rightCheek = lm(IDX.rightCheek);

    const faceWidth = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y) * 2.2;
    const faceHeight = (chin.y - forehead.y) * 1.35;
    const centerX = nose.x;
    const centerY = forehead.y + faceHeight * 0.45;

    ctx.save();
    // Draw base helmet shell
    this._drawHelmetShell(ctx, centerX, centerY, faceWidth, faceHeight, leftCheek, rightCheek);
    // Draw visor slit
    this._drawEyes(ctx, leftEye, rightEye, faceWidth, faceHeight);
    // Draw jaw
    this._drawJaw(ctx, centerX, chin, faceWidth, faceHeight);
    // Draw faceplate animated
    this._drawFaceplate(ctx, centerX, centerY, faceWidth, faceHeight, p);
    ctx.restore();
  }

  _drawHelmetShell(ctx, cx, cy, w, h, leftCheek, rightCheek){
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = COLORS.red;
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = Math.max(2, w * 0.02);

    const rx = w * 0.62, ry = h * 0.62;
    ctx.beginPath();
    for(let a=0; a<=Math.PI*2; a+=Math.PI/32){
      const x = Math.cos(a) * rx;
      const y = Math.sin(a) * ry * 0.95;
      if(a===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.fill();

    // Side dark accents
    ctx.fillStyle = COLORS.redDark;
    const cheekWidth = w * 0.22;
    const cheekHeight = h * 0.45;
    ctx.fillRect(-cx + leftCheek.x - cheekWidth*0.5, -cy + cy - cheekHeight*0.5, cheekWidth, cheekHeight);
    ctx.fillRect(-cx + rightCheek.x - cheekWidth*0.5, -cy + cy - cheekHeight*0.5, cheekWidth, cheekHeight);
    ctx.restore();
  }

  _drawEyes(ctx, leftEye, rightEye, w, h){
    ctx.save();
    ctx.fillStyle = "#e0f7fa";
    ctx.shadowColor = "#80deea";
    ctx.shadowBlur = Math.max(8, w*0.06);
    const eyeWidth = w * 0.18;
    const eyeHeight = h * 0.06;

    const drawEye = (eye)=>{
      ctx.beginPath();
      ctx.moveTo(eye.x - eyeWidth*0.5, eye.y);
      ctx.lineTo(eye.x - eyeWidth*0.2, eye.y - eyeHeight);
      ctx.lineTo(eye.x + eyeWidth*0.2, eye.y - eyeHeight);
      ctx.lineTo(eye.x + eyeWidth*0.5, eye.y);
      ctx.lineTo(eye.x + eyeWidth*0.2, eye.y + eyeHeight*0.2);
      ctx.lineTo(eye.x - eyeWidth*0.2, eye.y + eyeHeight*0.2);
      ctx.closePath();
      ctx.fill();
    };

    drawEye(leftEye);
    drawEye(rightEye);
    ctx.restore();
  }

  _drawJaw(ctx, cx, chin, w, h){
    ctx.save();
    ctx.fillStyle = COLORS.redDark;
    const jawWidth = w * 0.85;
    const jawHeight = h * 0.28;
    const x = cx - jawWidth/2;
    const y = chin.y - jawHeight * 0.9;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + jawWidth, y);
    ctx.lineTo(x + jawWidth*0.8, y + jawHeight);
    ctx.lineTo(x + jawWidth*0.2, y + jawHeight);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  _drawFaceplate(ctx, cx, cy, w, h, p){
    ctx.save();
    const plateWidth = w * 0.78;
    const plateHeight = h * 0.62;
    const plateX = cx - plateWidth/2;
    const plateYClosed = cy - plateHeight*0.52;

    // Animate: rotate up around top hinge and translate slightly
    const hingeX = cx;
    const hingeY = plateYClosed + plateHeight*0.05;
    ctx.translate(hingeX, hingeY);
    const rot = -Math.PI * 0.85 * p;
    ctx.rotate(rot);
    ctx.translate(-hingeX, -hingeY + p * (-h*0.04));

    // Plate base
    ctx.fillStyle = COLORS.gold;
    ctx.strokeStyle = COLORS.goldDark;
    ctx.lineWidth = Math.max(1.5, w * 0.012);
    ctx.beginPath();
    const r = Math.min(plateWidth, plateHeight) * 0.12;
    const x = plateX, y = plateYClosed;
    const right = x + plateWidth, bottom = y + plateHeight;
    ctx.moveTo(x + r, y);
    ctx.lineTo(right - r, y);
    ctx.quadraticCurveTo(right, y, right, y + r);
    ctx.lineTo(right, bottom - r);
    ctx.quadraticCurveTo(right, bottom, right - r, bottom);
    ctx.lineTo(x + r, bottom);
    ctx.quadraticCurveTo(x, bottom, x, bottom - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Nose bridge accent
    ctx.fillStyle = COLORS.goldDark;
    ctx.fillRect(cx - plateWidth*0.05, y + plateHeight*0.35, plateWidth*0.1, plateHeight*0.09);

    // Shadow when open
    ctx.globalAlpha = 0.25 * p;
    ctx.fillStyle = COLORS.shadow;
    ctx.fillRect(x, y, plateWidth, plateHeight);
    ctx.globalAlpha = 1;

    ctx.restore();
  }
}
