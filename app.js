// ─── Dreamer v2 ───────────────────────────────────────────────
// Generative dreamscape: particles, flow fields, ambient sound,
// floating words, mouse-reactive trails, breathing orb.

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

let W, H, t = 0;
let mx = -999, my = -999;
let pmx = -999, pmy = -999;
let mvx = 0, mvy = 0;          // mouse velocity
let mouseIn = false;

const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
window.addEventListener('resize', resize);
resize();

// ─── Cursor ───
const cursor = document.createElement('div');
cursor.id = 'cursor';
document.body.appendChild(cursor);

// ─── Info ───
const info = document.createElement('div');
info.id = 'info';
info.textContent = 'move through the dream';
document.body.appendChild(info);

// ─── Title ───
const title = document.createElement('div');
title.id = 'title';
title.textContent = 'DREAMER';
document.body.appendChild(title);

setTimeout(() => { info.classList.add('fade'); title.classList.add('fade'); }, 5000);

// ─── Mouse ───
let lmx = -999, lmy = -999;
window.addEventListener('mousemove', (e) => {
  mx = e.clientX; my = e.clientY;
  mvx = mx - lmx; mvy = my - lmy;
  lmx = mx; lmy = my;
  mouseIn = true;
  cursor.style.left = mx + 'px';
  cursor.style.top = my + 'px';
  cursor.classList.add('on');
  setTimeout(() => cursor.classList.remove('on'), 400);
});
window.addEventListener('mouseleave', () => { mouseIn = false; });
window.addEventListener('click', () => { if (!transitioning) transitioning = true; });

// ─── Palettes ───
const palettes = [
  // purple dream
  ['#0a0a0f','#1a1025','#2d1b3d','#6b3fa0','#c084fc','#f0abfc','#fdf4ff'],
  // ocean
  ['#0a0a0f','#0c1929','#164e63','#0891b2','#22d3ee','#67e8f9','#cffafe'],
  // ember
  ['#0a0a0f','#1c0a0a','#451a0a','#dc2626','#f87171','#fca5a5','#fee2e2'],
  // forest
  ['#0a0a0f','#0a1a0f','#14532d','#16a34a','#4ade80','#86efac','#dcfce7'],
  // gold
  ['#0a0a0f','#1a1a0f','#3d3d15','#ca8a04','#facc15','#fde047','#fef9c3'],
  // rose
  ['#0a0a0f','#1a0a10','#4a1d30','#e11d48','#fb7185','#fda4af','#ffe4e6'],
  // void (deep blue-black)
  ['#050508','#0a0a14','#0f1629','#1e3a5f','#3b82f6','#93c5ff','#dbeafe'],
];
let currentPalette = 0, paletteLerp = 0, transitioning = false;

function lerpColor(a, b, t) {
  const ah = parseInt(a.replace('#',''), 16), bh = parseInt(b.replace('#',''), 16);
  const ar=(ah>>16)&0xff, ag=(ah>>8)&0xff, ab=ah&0xff;
  const br=(bh>>16)&0xff, bg=(bh>>8)&0xff, bb=bh&0xff;
  return `rgb(${Math.round(ar+(br-ar)*t)},${Math.round(ag+(bg-ag)*t)},${Math.round(ab+(bb-ab)*t)})`;
}
function pci(i) { // palette color interpolated
  return lerpColor(palettes[currentPalette][i], palettes[(currentPalette+1)%palettes.length][i], paletteLerp);
}

// ─── Flow field ───
const FC = 50, FR = 35;
let flowField = [], flowAngle = 0;
function updateFlow() {
  flowAngle = t * 0.12;
  flowField = [];
  for (let y = 0; y < FR; y++) {
    flowField[y] = [];
    for (let x = 0; x < FC; x++) {
      const base = Math.sin(x*0.12+flowAngle)*Math.cos(y*0.12+flowAngle*0.7)*Math.PI*2
                 + Math.sin((x+y)*0.08+flowAngle*0.5)*0.5;
      // mouse velocity distortion
      const cx = (x/FC)*W, cy = (y/FR)*H;
      const d = Math.sqrt((cx-mx)**2+(cy-my)**2);
      const distort = mouseIn ? Math.max(0, 1-d/400)*0.8 : 0;
      const mangle = Math.atan2(mvy, mvx);
      flowField[y][x] = base + distort * Math.sin(mangle - base);
    }
  }
}

// ─── Particles ───
const N_DUST = 120, N_ORBS = 18, N_STREAKS = 8;
const dust = [], orbs = [], streaks = [];

for (let i = 0; i < N_DUST; i++) dust.push({
  x: Math.random()*W, y: Math.random()*H,
  z: Math.random()*800+200,
  vx: (Math.random()-0.5)*0.3, vy: (Math.random()-0.5)*0.3,
  size: Math.random()*2+0.5,
  life: Math.random()*Math.PI*2,
  speed: Math.random()*0.015+0.003,
});

for (let i = 0; i < N_ORBS; i++) orbs.push({
  x: Math.random()*W, y: Math.random()*H,
  z: Math.random()*600+400,
  vx: (Math.random()-0.5)*0.15, vy: (Math.random()-0.5)*0.15,
  r: 3+Math.random()*6,
  phase: Math.random()*Math.PI*2,
  speed: Math.random()*0.008+0.002,
  hueOffset: Math.random(),
});

for (let i = 0; i < N_STREAKS; i++) streaks.push({
  x: Math.random()*W, y: Math.random()*H,
  z: Math.random()*400+100,
  vx: (Math.random()-0.5)*1.5, vy: (Math.random()-0.5)*1.5,
  life: Math.random()*Math.PI*2,
  trail: [],
});

// ─── Dream blobs ───
const dreams = [];
for (let i = 0; i < 6; i++) dreams.push({
  x: Math.random(), y: Math.random(),
  r: 60+Math.random()*180,
  phase: Math.random()*Math.PI*2,
  speed: 0.15+Math.random()*0.35,
  sides: Math.floor(Math.random()*3)+5,
});

// ─── Dream words ───
const WORDS = [
  'drift','dissolve','remember','forget','breathe','float',
  'somewhere','between','waking','and','sleeping','the',
  'stars','whisper','secrets','to','those','who','listen',
  'time','bends','here','nothing','is','lost','only',
  'transformed','light','finds','a','way','through',
  'every','shadow','holds','a','memory','of','warmth',
  'we','are','made','of','the','same','dust','as',
  'distant','galaxies','calling','us','home','silence',
  'speaks','louder','than','words','ever','could',
];

const floatingWords = [];
const MAX_WORDS = 12;

function spawnWord() {
  if (floatingWords.length >= MAX_WORDS) return;
  floatingWords.push({
    text: WORDS[Math.floor(Math.random()*WORDS.length)],
    x: Math.random()*W,
    y: H + 20,
    vx: (Math.random()-0.5)*0.3,
    vy: -(0.2+Math.random()*0.5),
    life: 0,
    maxLife: 300+Math.random()*200,
    size: 10+Math.random()*16,
    phase: Math.random()*Math.PI*2,
  });
}

// ─── Ambient sound (Web Audio) ───
let audioCtx, drones = [], audioStarted = false;

function initAudio() {
  if (audioStarted) return;
  audioStarted = true;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();

  // Master gain
  const master = audioCtx.createGain();
  master.gain.value = 0.12;
  master.connect(audioCtx.destination);

  // Reverb via convolver (impulse)
  const reverb = audioCtx.createConvolver();
  const rate = audioCtx.sampleRate;
  const length = rate * 3;
  const impulse = audioCtx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) data[i] = (Math.random()*2-1)*Math.pow(1-i/length, 2.5);
  }
  reverb.buffer = impulse;

  const reverbGain = audioCtx.createGain();
  reverbGain.gain.value = 0.4;
  reverb.connect(reverbGain);
  reverbGain.connect(audioCtx.destination);

  // Drone oscillators — one per palette color feel
  const baseFreqs = [55, 82.5, 110, 165]; // A1, E2, A2, E3
  baseFreqs.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = i < 2 ? 'sine' : 'triangle';
    osc.frequency.value = freq;

    // Slight detune for warmth
    osc.detune.value = (i%2===0?1:-1) * (3 + Math.random()*4);

    filter.type = 'lowpass';
    filter.frequency.value = 400 + i*150;
    filter.Q.value = 0.7;

    gain.gain.value = 0;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    gain.connect(reverb);

    osc.start();
    drones.push({ osc, gain, filter, freq, vol: 0.15 + Math.random()*0.1 });
  });

  // LFO for filter sweep
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.frequency.value = 0.05;
  lfoGain.gain.value = 200;
  lfo.connect(lfoGain);
  drones.forEach(d => lfoGain.connect(d.filter.frequency));
  lfo.start();

  // Fade in
  drones.forEach((d, i) => {
    setTimeout(() => {
      d.gain.gain.linearRampToValueAtTime(d.vol, audioCtx.currentTime + 2);
    }, i * 300);
  });
}

function updateAudio() {
  if (!audioCtx) return;
  // Shift drone volumes based on palette
  const paletteVols = [
    [0.18, 0.12, 0.08, 0.05],  // purple — deep
    [0.08, 0.15, 0.12, 0.08],  // ocean — mid
    [0.12, 0.08, 0.15, 0.10],  // ember — warm
    [0.10, 0.10, 0.10, 0.12],  // forest — balanced
    [0.08, 0.12, 0.08, 0.15],  // gold — bright
    [0.15, 0.10, 0.10, 0.08],  // rose — deep
    [0.10, 0.08, 0.12, 0.10],  // void — dark
  ];
  const vols = paletteVols[currentPalette];
  drones.forEach((d, i) => {
    const target = vols[i] || 0.1;
    d.gain.gain.linearRampToValueAtTime(target, audioCtx.currentTime + 0.5);
  });
}

// Start audio on first interaction
window.addEventListener('click', () => { initAudio(); }, { once: false });
window.addEventListener('mousemove', () => { if(!audioStarted) initAudio(); }, { once: true });

// ─── Helpers ───
function dist(x1,y1,x2,y2) { return Math.sqrt((x2-x1)**2+(y2-y1)**2); }

// ─── Render ───
let wordTimer = 0;

function render() {
  t += 0.016;

  // Palette transition
  if (transitioning) {
    paletteLerp += 0.006;
    if (paletteLerp >= 1) {
      paletteLerp = 0;
      currentPalette = (currentPalette+1) % palettes.length;
      transitioning = false;
      updateAudio();
    }
  }

  // Smooth mouse
  if (!mouseIn) { mx = W/2 + Math.sin(t*0.3)*200; my = H/2 + Math.cos(t*0.2)*150; }
  pmx += (mx - pmx) * 0.06;
  pmy += (my - pmy) * 0.06;

  // ── Background ──
  ctx.fillStyle = pci(0);
  ctx.fillRect(0, 0, W, H);

  // Subtle radial bg glow
  const bgGlow = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H)*0.6);
  bgGlow.addColorStop(0, pci(1));
  bgGlow.addColorStop(1, 'transparent');
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = bgGlow;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;

  // ── Flow field ──
  updateFlow();
  const cellW = W/FC, cellH = H/FR;
  for (let y = 0; y < FR; y++) {
    for (let x = 0; x < FC; x++) {
      const angle = flowField[y][x];
      const cx = x*cellW+cellW/2, cy = y*cellH+cellH/2;
      const len = cellW*0.45;
      const influence = 0.02 + Math.max(0, 1-dist(mx,my,cx,cy)/350)*0.06;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx+Math.cos(angle)*len, cy+Math.sin(angle)*len);
      ctx.strokeStyle = pci(3);
      ctx.globalAlpha = influence;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  // ── Dream blobs ──
  for (const d of dreams) {
    d.x += Math.sin(t*d.speed+d.phase)*0.0002;
    d.y += Math.cos(t*d.speed*0.7+d.phase)*0.0002;
    const dx = d.x*W, dy = d.y*H;
    const dm = dist(mx,my,dx,dy);
    const pulse = d.r + Math.sin(t*1.5+d.phase)*15 + (dm<300?(300-dm)*0.25:0);
    ctx.beginPath();
    for (let i = 0; i <= d.sides*2; i++) {
      const a = (i/(d.sides*2))*Math.PI*2;
      const wobble = Math.sin(a*3+t+d.phase)*pulse*0.12;
      const r = pulse + wobble;
      const px = dx+Math.cos(a+t*0.08)*r;
      const py = dy+Math.sin(a+t*0.08)*r;
      i===0 ? ctx.moveTo(px,py) : ctx.lineTo(px,py);
    }
    ctx.closePath();
    const alpha = 0.015 + (dm<400?(400-dm)/400*0.05:0);
    ctx.fillStyle = pci(4);
    ctx.globalAlpha = alpha;
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // ── Breathing central orb ──
  const orbR = 40 + Math.sin(t*0.8)*10 + (mouseIn ? Math.max(0, 1-dist(mx,my,W/2,H/2)/300)*30 : 0);
  const orbAlpha = 0.03 + Math.sin(t*0.5)*0.01;
  const orbGrad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, orbR*3);
  orbGrad.addColorStop(0, pci(5));
  orbGrad.addColorStop(0.4, pci(4));
  orbGrad.addColorStop(1, 'transparent');
  ctx.globalAlpha = orbAlpha;
  ctx.fillStyle = orbGrad;
  ctx.beginPath();
  ctx.arc(W/2, H/2, orbR*3, 0, Math.PI*2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // ── Dust particles ──
  for (const p of dust) {
    const parallax = (800/p.z)*20;
    p.x += (pmx-W/2)*0.000015*parallax + p.vx;
    p.y += (pmy-H/2)*0.000015*parallax + p.vy;
    const cxi = Math.floor((p.x/W+0.5)*FC), cyi = Math.floor((p.y/H+0.5)*FR);
    if (cxi>=0&&cxi<FC&&cyi>=0&&cyi<FR) {
      const a = flowField[cyi][cxi];
      p.vx += Math.cos(a)*0.005; p.vy += Math.sin(a)*0.005;
    }
    p.vx *= 0.99; p.vy *= 0.99;
    p.x += p.vx; p.y += p.vy;
    // Safe wrap
    p.x = ((p.x + 100) % (W + 200) + (W + 200)) % (W + 200) - 100;
    p.y = ((p.y + 100) % (H + 200) + (H + 200)) % (H + 200) - 100;
    // Guard against NaN from accumulated math
    if (!isFinite(p.x)) p.x = Math.random() * W;
    if (!isFinite(p.y)) p.y = Math.random() * H;
    if (!isFinite(p.vx)) p.vx = 0;
    if (!isFinite(p.vy)) p.vy = 0;
    p.life += p.speed;

    const sx = ((p.x % (W + 200)) + (W + 200)) % (W + 200) - 100;
    const sy = ((p.y % (H + 200)) + (H + 200)) % (H + 200) - 100;
    const depthA = Math.max(0.02, (800-p.z)/800*0.2);
    const sz = Math.max(0.5, p.size*(800/p.z)*0.7);
    const d2m = dist(sx,sy,mx,my);
    const glow = d2m<180 ? (180-d2m)/180 : 0;

    const glowR = Math.max(1, sz*3);
    const g = ctx.createRadialGradient(sx,sy,0,sx,sy,glowR);
    g.addColorStop(0, pci(5)); g.addColorStop(1, 'transparent');
    ctx.globalAlpha = depthA + glow*0.25;
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(sx,sy,sz*3,0,Math.PI*2); ctx.fill();

    ctx.globalAlpha = depthA*1.5 + glow*0.4;
    ctx.fillStyle = pci(6);
    ctx.beginPath(); ctx.arc(sx,sy,sz,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // ── Orbs (larger, glowing) ──
  for (const p of orbs) {
    const parallax = (600/p.z)*15;
    p.x += (pmx-W/2)*0.00001*parallax + p.vx;
    p.y += (pmy-H/2)*0.00001*parallax + p.vy;
    p.vx *= 0.995; p.vy *= 0.995;
    // Safe wrap
    p.x = ((p.x + 100) % (W + 200) + (W + 200)) % (W + 200) - 100;
    p.y = ((p.y + 100) % (H + 200) + (H + 200)) % (H + 200) - 100;
    if (!isFinite(p.x)) p.x = Math.random() * W;
    if (!isFinite(p.y)) p.y = Math.random() * H;
    if (!isFinite(p.vx)) p.vx = 0;
    if (!isFinite(p.vy)) p.vy = 0;
    p.life += p.speed;

    const sx = ((p.x % (W + 200)) + (W + 200)) % (W + 200) - 100;
    const sy = ((p.y % (H + 200)) + (H + 200)) % (H + 200) - 100;
    const sz = Math.max(1, p.r*(600/p.z)*0.6 + Math.sin(p.life+p.phase)*1.5);
    const d2m = dist(sx,sy,mx,my);
    const react = d2m<250 ? (250-d2m)/250 : 0;

    // Outer glow
    const outerR = Math.max(1, sz*5);
    const g = ctx.createRadialGradient(sx,sy,0,sx,sy,outerR);
    g.addColorStop(0, pci(4)); g.addColorStop(0.5, pci(3)); g.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.04 + react*0.08;
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(sx,sy,outerR,0,Math.PI*2); ctx.fill();

    // Core
    const coreR = Math.max(1, sz*1.5);
    const g2 = ctx.createRadialGradient(sx,sy,0,sx,sy,coreR);
    g2.addColorStop(0, pci(6)); g2.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.08 + react*0.15;
    ctx.fillStyle = g2;
    ctx.beginPath(); ctx.arc(sx,sy,sz*1.5,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // ── Streaks (fast-moving trails) ──
  for (const s of streaks) {
    s.trail.push({ x: s.x, y: s.y });
    if (s.trail.length > 20) s.trail.shift();
    s.x += s.vx; s.y += s.vy;
    const cxi = Math.floor(((s.x+100)%(W+200))/W*FC);
    const cyi = Math.floor(((s.y+100)%(H+200))/H*FR);
    if (cxi>=0&&cxi<FC&&cyi>=0&&cyi<FR) {
      const a = flowField[cyi][cxi];
      s.vx += Math.cos(a)*0.02; s.vy += Math.sin(a)*0.02;
    }
    s.vx *= 0.98; s.vy *= 0.98;
    s.x = ((s.x + 100) % (W + 200) + (W + 200)) % (W + 200) - 100;
    s.y = ((s.y + 100) % (H + 200) + (H + 200)) % (H + 200) - 100;
    if (!isFinite(s.x)) s.x = Math.random() * W;
    if (!isFinite(s.y)) s.y = Math.random() * H;
    if (!isFinite(s.vx)) s.vx = 0;
    if (!isFinite(s.vy)) s.vy = 0;
    s.life += 0.03;

    if (s.trail.length > 2) {
      ctx.beginPath();
      ctx.moveTo(s.trail[0].x, s.trail[0].y);
      for (let i = 1; i < s.trail.length; i++) ctx.lineTo(s.trail[i].x, s.trail[i].y);
      ctx.strokeStyle = pci(5);
      ctx.globalAlpha = 0.06;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  // ── Dust connections ──
  for (let i = 0; i < dust.length; i++) {
    const p = dust[i];
    const sx = ((p.x%(W+200))+(W+200))%(W+200)-100;
    const sy = ((p.y%(H+200))+(H+200))%(H+200)-100;
    for (let j = i+1; j < dust.length; j++) {
      const q = dust[j];
      const qx = ((q.x%(W+200))+(W+200))%(W+200)-100;
      const qy = ((q.y%(H+200))+(H+200))%(H+200)-100;
      const pd = dist(sx,sy,qx,qy);
      if (pd < 100) {
        ctx.globalAlpha = (1-pd/100)*0.04;
        ctx.strokeStyle = pci(4);
        ctx.lineWidth = 0.4;
        ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(qx,qy); ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1;

  // ── Floating words ──
  wordTimer++;
  if (wordTimer % 40 === 0) spawnWord();
  for (let i = floatingWords.length-1; i >= 0; i--) {
    const w = floatingWords[i];
    w.x += w.vx + Math.sin(t*0.5+w.phase)*0.15;
    w.y += w.vy;
    w.life++;
    const lifeRatio = w.life / w.maxLife;
    let alpha;
    if (lifeRatio < 0.15) alpha = lifeRatio/0.15;
    else if (lifeRatio > 0.7) alpha = (1-lifeRatio)/0.3;
    else alpha = 1;
    alpha *= 0.18;

    ctx.font = `${w.size}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.globalAlpha = alpha;
    ctx.fillStyle = pci(6);
    ctx.fillText(w.text, w.x, w.y);

    if (w.life >= w.maxLife) floatingWords.splice(i, 1);
  }
  ctx.globalAlpha = 1;

  // ── Cursor glow ──
  const cg = ctx.createRadialGradient(mx,my,0,mx,my,220);
  cg.addColorStop(0, pci(4));
  cg.addColorStop(0.3, pci(3));
  cg.addColorStop(1, 'transparent');
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = cg;
  ctx.beginPath(); ctx.arc(mx,my,220,0,Math.PI*2); ctx.fill();

  // ── Vignette ──
  const vig = ctx.createRadialGradient(W/2,H/2,H*0.25, W/2,H/2,H*0.95);
  vig.addColorStop(0, 'transparent');
  vig.addColorStop(1, 'rgba(0,0,0,0.65)');
  ctx.globalAlpha = 1;
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
