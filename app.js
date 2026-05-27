const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

let W, H;
let mx = 0, my = 0;
let pmx = 0, pmy = 0;
let t = 0;

const resize = () => {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
};
window.addEventListener('resize', resize);
resize();

// Cursor
const cursor = document.createElement('div');
cursor.id = 'cursor';
document.body.appendChild(cursor);

// Info text
const info = document.createElement('div');
info.id = 'info';
info.textContent = 'move through the dream';
document.body.appendChild(info);

// Title
const title = document.createElement('div');
title.id = 'title';
title.textContent = 'DREAMER';
document.body.appendChild(title);

// Hide info after 6s
setTimeout(() => info.classList.add('fade'), 6000);

// Dream palette
const palettes = [
  ['#0a0a0f', '#1a1025', '#2d1b3d', '#6b3fa0', '#c084fc', '#f0abfc', '#fdf4ff'],
  ['#0a0a0f', '#0f172a', '#1e3a5f', '#38bdf8', '#67e8f9', '#bae6fd', '#e0f2fe'],
  ['#0a0a0f', '#1a0f0f', '#3d1515', '#dc2626', '#f87171', '#fca5a5', '#fee2e2'],
  ['#0a0a0f', '#0a1a0f', '#153d22', '#16a34a', '#4ade80', '#86efac', '#dcfce7'],
  ['#0a0a0f', '#1a1a0f', '#3d3d15', '#ca8a04', '#facc15', '#fde047', '#fef9c3'],
];
let currentPalette = 0;
let paletteLerp = 0;
let transitioning = false;

function lerpColor(a, b, t) {
  const ah = parseInt(a.replace('#', ''), 16);
  const bh = parseInt(b.replace('#', ''), 16);
  const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
  const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);
  return `rgb(${rr},${rg},${rb})`;
}

function getPaletteColor(index) {
  const cur = palettes[currentPalette][index];
  const next = palettes[(currentPalette + 1) % palettes.length][index];
  return lerpColor(cur, next, paletteLerp);
}

// Particles
const particles = [];
const NUM_PARTICLES = 80;

for (let i = 0; i < NUM_PARTICLES; i++) {
  particles.push({
    x: Math.random() * 2000 - 100,
    y: Math.random() * 2000 - 100,
    z: Math.random() * 1000 + 1,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    size: Math.random() * 3 + 1,
    life: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.02 + 0.005,
  });
}

// Flow field
const flowCols = 40;
const flowRows = 30;
let flowField = [];
let flowAngle = 0;

function updateFlowField() {
  flowField = [];
  flowAngle = t * 0.15;
  for (let y = 0; y < flowRows; y++) {
    flowField[y] = [];
    for (let x = 0; x < flowCols; x++) {
      const angle = Math.sin(x * 0.15 + flowAngle) * Math.cos(y * 0.15 + flowAngle * 0.7) * Math.PI * 2
        + Math.sin((x + y) * 0.1 + flowAngle * 0.5) * 0.5;
      flowField[y][x] = angle;
    }
  }
}

// Dreams (floating organic shapes)
const dreams = [];
for (let i = 0; i < 5; i++) {
  dreams.push({
    x: Math.random(),
    y: Math.random(),
    r: 80 + Math.random() * 150,
    phase: Math.random() * Math.PI * 2,
    speed: 0.2 + Math.random() * 0.4,
    sides: Math.floor(Math.random() * 3) + 5,
  });
}

// Mouse
window.addEventListener('mousemove', (e) => {
  mx = e.clientX;
  my = e.clientY;
  cursor.style.left = mx + 'px';
  cursor.style.top = my + 'px';
  cursor.classList.add('on');
  setTimeout(() => cursor.classList.remove('on'), 400);
});

// Click to shift palette
window.addEventListener('click', () => {
  if (!transitioning) {
    transitioning = true;
  }
});

function render() {
  t += 0.016;

  // Palette transition
  if (transitioning) {
    paletteLerp += 0.008;
    if (paletteLerp >= 1) {
      paletteLerp = 0;
      currentPalette = (currentPalette + 1) % palettes.length;
      transitioning = false;
    }
  }

  // Background
  ctx.fillStyle = getPaletteColor(0);
  ctx.fillRect(0, 0, W, H);

  // Flow field visualization (very subtle)
  updateFlowField();
  const cellW = W / flowCols;
  const cellH = H / flowRows;

  for (let y = 0; y < flowRows; y++) {
    for (let x = 0; x < flowCols; x++) {
      const angle = flowField[y][x];
      const cx = x * cellW + cellW / 2;
      const cy = y * cellH + cellH / 2;
      const len = cellW * 0.4;
      const ex = cx + Math.cos(angle) * len;
      const ey = cy + Math.sin(angle) * len;

      const influence = 0.03 + Math.max(0, 1 - dist(mx, my, cx, cy) / 300) * 0.07;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = getPaletteColor(3);
      ctx.globalAlpha = influence;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  // Dream blobs (organic shapes)
  for (const dream of dreams) {
    dream.x += Math.sin(t * dream.speed + dream.phase) * 0.0003;
    dream.y += Math.cos(t * dream.speed * 0.7 + dream.phase) * 0.0003;

    const dx = dream.x * W;
    const dy = dream.y * H;
    const distMouse = dist(mx, my, dx, dy);
    const pulse = dream.r + Math.sin(t * 2 + dream.phase) * 20 + (distMouse < 300 ? (300 - distMouse) * 0.3 : 0);

    ctx.beginPath();
    for (let i = 0; i <= dream.sides * 2; i++) {
      const angle = (i / (dream.sides * 2)) * Math.PI * 2;
      const wobble = Math.sin(angle * 3 + t + dream.phase) * pulse * 0.15;
      const r = pulse + wobble;
      const px = dx + Math.cos(angle + t * 0.1) * r;
      const py = dy + Math.sin(angle + t * 0.1) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();

    const alpha = 0.02 + (distMouse < 400 ? (400 - distMouse) / 400 * 0.06 : 0);
    ctx.fillStyle = getPaletteColor(4);
    ctx.globalAlpha = alpha;
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Particles with depth
  pmx += (mx - pmx) * 0.05;
  pmy += (my - pmy) * 0.05;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];

    // Parallax from mouse
    const parallax = (1000 / p.z) * 30;
    p.x += (pmx - W / 2) * 0.00002 * parallax + p.vx;
    p.y += (pmy - H / 2) * 0.00002 * parallax + p.vy;

    // Flow field influence
    const cx = Math.floor((p.x / W + 0.5) * flowCols);
    const cy = Math.floor((p.y / H + 0.5) * flowRows);
    if (cx >= 0 && cx < flowCols && cy >= 0 && cy < flowRows) {
      const angle = flowField[cy][cx];
      p.vx += Math.cos(angle) * 0.01;
      p.vy += Math.sin(angle) * 0.01;
    }

    // Damping
    p.vx *= 0.99;
    p.vy *= 0.99;

    // Wrap
    const w = W + 200;
    const h = H + 200;
    if (p.x < -100) p.x += w;
    if (p.x > W + 100) p.x -= w;
    if (p.y < -100) p.y += h;
    if (p.y > H + 100) p.y -= h;

    p.life += p.speed;

    // Draw
    const screenX = ((p.x % w) + w) % w - 100;
    const screenY = ((p.y % h) + h) % h - 100;
    const depthAlpha = Math.max(0.02, (1000 - p.z) / 1000 * 0.25);
    const size = p.size * (1000 / p.z) * 0.8;

    const d = dist(screenX, screenY, mx, my);
    const glow = d < 200 ? (200 - d) / 200 : 0;

    // Particle glow
    const grad = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, size * 4);
    grad.addColorStop(0, getPaletteColor(5));
    grad.addColorStop(1, 'transparent');
    ctx.globalAlpha = depthAlpha + glow * 0.3;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(screenX, screenY, size * 4, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.globalAlpha = depthAlpha * 1.5 + glow * 0.5;
    ctx.fillStyle = getPaletteColor(6);
    ctx.beginPath();
    ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
    ctx.fill();

    // Connections
    for (let j = i + 1; j < particles.length; j++) {
      const q = particles[j];
      const qx = ((q.x % w) + w) % w - 100;
      const qy = ((q.y % h) + h) % h - 100;
      const pd = dist(screenX, screenY, qx, qy);
      if (pd < 120) {
        ctx.globalAlpha = (1 - pd / 120) * 0.06 * depthAlpha;
        ctx.strokeStyle = getPaletteColor(4);
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(screenX, screenY);
        ctx.lineTo(qx, qy);
        ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1;

  // Cursor glow (big, soft)
  const cursorGlow = ctx.createRadialGradient(mx, my, 0, mx, my, 200);
  cursorGlow.addColorStop(0, getPaletteColor(4));
  cursorGlow.addColorStop(0.3, getPaletteColor(3));
  cursorGlow.addColorStop(1, 'transparent');
  ctx.globalAlpha = 0.04;
  ctx.fillStyle = cursorGlow;
  ctx.beginPath();
  ctx.arc(mx, my, 200, 0, Math.PI * 2);
  ctx.fill();

  // Vignette
  const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.9);
  vig.addColorStop(0, 'transparent');
  vig.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.globalAlpha = 1;
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  requestAnimationFrame(render);
}

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

requestAnimationFrame(render);
