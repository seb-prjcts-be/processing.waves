/* Signal Loom - full p5.waves loom (browser sibling of SignalLoom.pde).
 * Drives the full-bleed poster embedded in signal-loom.html. */
const PAPER = '#f7f2e8';
const INK = '#090908';
const SIGNAL = '#ff3d2e';
const DEEP = '#0647ff';
const LIME = '#c7ff2d';
const VIOLET = '#8e51ff';
const AQUA = '#00bdd6';

const CURATED = ['classic sine', 'mountain peaks', 'wobble sine', 'triangle sine', 'meta sine'];
const POOLS = [
  { key: 'gentle', group: 'gentle', color: DEEP },
  { key: 'harsh', group: 'harsh', color: SIGNAL },
  { key: 'all', group: 'all', color: AQUA },
  { key: 'curated', group: CURATED, color: VIOLET }
];
const WORDS = ['warp', 'weft', 'tension', 'shuttle', 'pattern', 'phase', 'morph', 'output'];
const STATIONS = ['SOURCE', 'TENSION', 'SHUTTLE', 'PATTERN', 'OUTPUT'];

let motionSampler;
let pulseSampler;
let colorSampler;
let threadSamplers = [];
let looms = [];
let glyphs = [];

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('canvas-shell');
  pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
  frameRate(60);
  textFont('Arial');
  rebuildSystem();
}

function rebuildSystem() {
  motionSampler = Waves.createSampler({
    group: 'gentle',
    shift: true,
    shiftInterval: 5.4,
    shiftDuration: 1.25,
    range: [-1, 1],
    frequency: 0.72,
    seed: 110
  });

  pulseSampler = Waves.createSampler({
    group: 'harsh',
    shift: true,
    shiftInterval: 3.6,
    shiftDuration: 0.9,
    range: [0, 1],
    frequency: 1.18,
    mode: 'wild',
    unpredictability: 0.28,
    seed: 220
  });

  colorSampler = Waves.createSampler({
    group: 'all',
    shift: true,
    shiftInterval: 6.2,
    shiftDuration: 1.5,
    range: [0, 1],
    frequency: 0.54,
    seed: 330
  });

  threadSamplers = POOLS.map((pool, i) => Waves.createSampler({
    group: pool.group,
    shift: true,
    shiftInterval: 3.8 + i * 0.45,
    shiftDuration: 1.1,
    range: [-1, 1],
    frequency: 0.5 + i * 0.08,
    mode: pool.key === 'harsh' ? 'wild' : 'stable',
    unpredictability: pool.key === 'harsh' ? 0.33 : 0,
    seed: 500 + i * 61
  }));

  looms = POOLS.map((pool, i) => new LoomGrid(18, 13, pool.group, 800 + i * 101, i));
  buildGlyphs();
}

function buildGlyphs() {
  glyphs = [];
  randomSeed(16);
  const count = constrain(floor((width * height) / 21000), 28, 82);
  for (let i = 0; i < count; i++) {
    glyphs.push({
      x: random(width),
      y: random(height),
      seed: i,
      word: random(WORDS),
      size: random(10, 15)
    });
  }
}

function draw() {
  const t = millis() / 1000;
  background(PAPER);
  drawBackplane(t);
  drawLoomFrame(t);
  drawWarpThreads(t);
  drawWeftPasses(t);
  drawPatternCard(t);
  drawGlyphField(t);
  drawTitle(t);
  drawMachineReadout(t);
  drawTicker(t);
  drawGrain();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  buildGlyphs();
}

function activeIndex(t) {
  return floor(t / 5.2) % POOLS.length;
}

function accent(v) {
  const colors = [SIGNAL, DEEP, LIME, VIOLET, AQUA];
  return colors[constrain(floor(v * colors.length), 0, colors.length - 1)];
}

function drawBackplane(t) {
  noStroke();
  blendMode(MULTIPLY);
  const columns = width < 760 ? 6 : 9;
  const cw = width / columns;
  for (let i = 0; i < columns; i++) {
    const v = colorSampler.sample(i * 0.21, t * 0.8);
    fill(color(accent(v) + '33'));
    rect(i * cw, 0, cw * map(v, 0, 1, 0.35, 0.95), height);
  }
  blendMode(BLEND);
  noStroke();
}

function loomBounds() {
  const m = max(18, min(width, height) * 0.05);
  const top = width < 760 ? height * 0.32 : height * 0.3;
  const bottom = height - (width < 760 ? 190 : 148);
  const rightPanelW = width < 900 ? 0 : min(340, width * 0.29);
  const x = m;
  const w = width < 900 ? width - m * 2 : width - m * 3 - rightPanelW;
  return { x, y: top, w, h: max(180, bottom - top) };
}

function panelBounds() {
  const m = max(18, min(width, height) * 0.05);
  const loom = loomBounds();
  const w = width < 900 ? min(width - m * 2, 420) : min(340, width * 0.29);
  const h = width < 900 ? 108 : min(245, height * 0.32);
  const x = width < 900 ? m : loom.x + loom.w + m;
  const y = width < 900 ? height - 166 : loom.y + 10;
  return { x, y, w, h };
}

function drawLoomFrame(t) {
  const b = loomBounds();
  const active = activeIndex(t);
  const pool = POOLS[active];

  stroke(INK);
  strokeWeight(3);
  fill(color(PAPER + 'cc'));
  rect(b.x - 10, b.y - 14, b.w + 20, b.h + 28);

  noStroke();
  fill(pool.color + '22');
  rect(b.x, b.y, b.w, b.h);

  stroke(INK + '88');
  strokeWeight(2);
  line(b.x, b.y, b.x + b.w, b.y);
  line(b.x, b.y + b.h, b.x + b.w, b.y + b.h);

  noStroke();
  textAlign(LEFT, CENTER);
  textSize(10);
  fill(INK);
  text('LIVE LOOM / SIGNALS BECOME PATTERN', b.x, b.y - 28);

  for (let i = 0; i < STATIONS.length; i++) {
    const sx = map(i, 0, STATIONS.length - 1, b.x + 8, b.x + b.w - 70);
    const v = pulseSampler.sample(i * 0.27, t);
    fill(i === active ? pool.color : INK);
    rect(sx, b.y + b.h + 18, 58, 18);
    fill(i === active && v > 0.45 ? INK : PAPER);
    textAlign(CENTER, CENTER);
    textSize(8.5);
    text(STATIONS[i], sx + 29, b.y + b.h + 27);
  }
}

function drawWarpThreads(t) {
  const active = activeIndex(t);
  const b = loomBounds();
  blendMode(MULTIPLY);
  noFill();
  for (let i = 0; i < POOLS.length; i++) {
    const pool = POOLS[i];
    const sampler = threadSamplers[i];
    const baseX = map(i, 0, POOLS.length - 1, b.x + b.w * 0.16, b.x + b.w * 0.84);
    const amp = b.w * (i === active ? 0.125 : 0.07);
    stroke(pool.color + (i === active ? 'd8' : '88'));
    strokeWeight(i === active ? 13 : 7);
    beginShape();
    for (let y = b.y; y <= b.y + b.h; y += 10) {
      const local = y * 0.013 + i * 0.41;
      const weave = Waves.wave(local, {
        group: pool.group,
        shift: true,
        shiftInterval: 3.2 + i * 0.35,
        shiftDuration: 1.1,
        seed: 1200 + i * 77,
        t: t * 0.74,
        amplitude: amp,
        frequency: 0.72,
        mode: pool.key === 'harsh' ? 'wild' : 'stable',
        unpredictability: pool.key === 'harsh' ? 0.3 : 0
      });
      const drift = sampler.sample(y * 0.01, t) * 34;
      vertex(baseX + weave + drift, y);
    }
    endShape();
  }
  blendMode(BLEND);
  noStroke();
}

function drawWeftPasses(t) {
  const active = activeIndex(t);
  const pool = POOLS[active];
  const grid = looms[active].sample(t);
  const b = loomBounds();
  const rows = looms[active].rows;
  const cols = looms[active].cols;
  const rowGap = b.h / rows;

  blendMode(MULTIPLY);
  strokeCap(SQUARE);
  for (let row = 0; row < looms[active].rows; row++) {
    const y = b.y + rowGap * (row + 0.5);
    const rowPower = motionSampler.sample(row * 0.13, t) * 15;
    for (let col = 0; col < looms[active].cols; col++) {
      const on = grid[row * looms[active].cols + col] === 1;
      if (!on && (row + col) % 3 !== 0) continue;
      const x0 = b.x + (col / cols) * b.w;
      const x1 = b.x + ((col + 0.82) / cols) * b.w;
      const pulse = pulseSampler.sample((row + col) * 0.08, t);
      stroke(on ? pool.color + 'c8' : INK + '22');
      strokeWeight(on ? map(pulse, 0, 1, 2, 7) : 1.2);
      line(x0, y + rowPower, x1, y - rowPower * 0.35);
    }
  }
  strokeCap(ROUND);
  blendMode(BLEND);
}

function drawPatternCard(t) {
  const active = activeIndex(t);
  const pool = POOLS[active];
  const grid = looms[active].sample(t);
  const p = panelBounds();
  const cols = looms[active].cols;
  const rows = looms[active].rows;
  const labelH = 34;
  const cw = p.w / cols;
  const ch = (p.h - labelH) / rows;

  stroke(INK);
  strokeWeight(3);
  fill(PAPER);
  rect(p.x, p.y, p.w, p.h);

  noStroke();
  fill(INK);
  rect(p.x, p.y, p.w, labelH);
  fill(pool.color);
  rect(p.x, p.y, p.w * 0.36, labelH);
  fill(INK);
  textAlign(LEFT, CENTER);
  textSize(10);
  text('PATTERN CARD', p.x + 10, p.y + labelH * 0.5);
  fill(PAPER);
  textAlign(RIGHT, CENTER);
  text(pool.key.toUpperCase(), p.x + p.w - 10, p.y + labelH * 0.5);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const on = grid[row * cols + col] === 1;
      const x = p.x + col * cw;
      const y = p.y + labelH + row * ch;
      fill(on ? pool.color : ((row + col) % 2 === 0 ? '#ebe2d5' : PAPER));
      rect(x, y, max(1, cw - 1), max(1, ch - 1));
    }
  }

  fill(INK);
  textAlign(LEFT, TOP);
  textSize(9);
  text('smooth solid rows + ramp columns', p.x, p.y + p.h + 10);
  textStyle(NORMAL);
}

function drawGlyphField(t) {
  noStroke();
  textAlign(CENTER, CENTER);
  textStyle(NORMAL);
  for (const g of glyphs) {
    const p = pulseSampler.sample(g.seed * 0.19, t);
    if (p < 0.38) continue;
    const dx = motionSampler.sample(g.seed * 0.11, t) * 22;
    const dy = motionSampler.sample(g.seed * 0.17, t + 2) * 17;
    fill(color(INK + hexAlpha(map(p, 0.38, 1, 44, 145))));
    textSize(g.size);
    text(g.word, g.x + dx, g.y + dy);
  }
}

function drawTitle(t) {
  noStroke();
  const m = max(18, min(width, height) * 0.05);
  const x = m;
  const panel = panelBounds();
  const maxW = width < 900 ? width - m * 2 : max(360, panel.x - x - 24);
  const size = fitSize('SIGNAL LOOM', maxW, width < 760 ? 54 : 92, 28);
  const y = width < 760 ? height * 0.14 : height * 0.105;

  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(size);
  let labelCursor = x;
  const label = 'SIGNAL LOOM';
  for (let i = 0; i < label.length; i++) {
    const ch = label[i];
    if (ch === ' ') {
      labelCursor += size * 0.28;
      continue;
    }
    const lift = motionSampler.sample(i * 0.23, t) * size * 0.055;
    fill(i === 7 || i === 8 ? accent(colorSampler.sample(i * 0.18, t)) : INK);
    text(ch, labelCursor, y + lift);
    labelCursor += textWidth(ch) * 0.98;
  }

  textStyle(NORMAL);
  textSize(width < 760 ? 13 : 16);
  fill(INK);
  text('a live loom for wave signals: source, tension, shuttle, pattern, output', x, y + size * 1.08);
}

function drawMachineReadout(t) {
  noStroke();
  const active = activeIndex(t);
  const pool = POOLS[active];
  const sampler = threadSamplers[active];
  sampler.sample(0.42, t);
  const p = panelBounds();
  const b = loomBounds();
  const x = width < 900 ? b.x : p.x;
  const y = width < 900 ? b.y + b.h + 48 : p.y + p.h + 42;
  const w = width < 900 ? min(b.w, 520) : p.w;
  const h = 34;
  const morphMix = sampler.shifting ? sampler['mix'] : pulseSampler.sample(0.5, t);

  fill(INK);
  rect(x, y, w, h);
  fill(pool.color);
  rect(x, y, w * constrain(morphMix, 0, 1), h);
  fill(morphMix > 0.55 ? INK : PAPER);
  textAlign(LEFT, CENTER);
  textSize(11);
  text(`tension ${pool.key}`.toUpperCase(), x + 12, y + h * 0.5);
  fill(PAPER);
  textAlign(RIGHT, CENTER);
  text(`${shortName(sampler.waveName)} -> ${shortName(sampler.targetName)}`.toUpperCase(), x + w - 12, y + h * 0.5);
}

function drawTicker(t) {
  noStroke();
  const h = 34;
  const y = height - h;
  const copy = 'SOURCE -> TENSION -> SHUTTLE -> PATTERN -> OUTPUT / P5 LOOM / PROCESSING LOOM / WAVES.WAVE / CREATESAMPLER / MIX / PHASE / SHIFT / ';
  fill(INK);
  rect(0, y, width, h);
  fill(PAPER);
  textAlign(LEFT, CENTER);
  textSize(12);
  const tw = textWidth(copy);
  let x = -((t * 72) % tw);
  while (x < width + tw) {
    text(copy, x, y + h * 0.5);
    x += tw;
  }
}

function drawGrain() {
  randomSeed(8);
  stroke(INK + '15');
  strokeWeight(1);
  for (let i = 0; i < constrain((width * height) / 7000, 80, 260); i++) {
    point(random(width), random(height));
  }
  noStroke();
}

function fitSize(str, maxW, maxSize, minSize) {
  let s = maxSize;
  textSize(s);
  while (s > minSize && textWidth(str) > maxW) {
    s -= 2;
    textSize(s);
  }
  return s;
}

function drawWrappedText(str, x, y, maxW, leading, maxLines = 3) {
  const words = str.split(' ');
  let line = '';
  let cy = y;
  let lines = 0;

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (textWidth(test) > maxW && line) {
      text(line, x, cy);
      lines++;
      if (lines >= maxLines) return;
      line = word;
      cy += leading;
    } else {
      line = test;
    }
  }

  if (line && lines < maxLines) text(line, x, cy);
}

function hexAlpha(alpha) {
  return constrain(round(alpha), 0, 255).toString(16).padStart(2, '0');
}

function shortName(name) {
  if (!name) return 'wave';
  return name.length > 14 ? `${name.slice(0, 12)}..` : name;
}

class LoomGrid {
  constructor(cols, rows, group, seed, offset) {
    this.cols = cols;
    this.rows = rows;
    this.offset = offset;
    this.rowS = Waves.createSampler({
      wave: 'smooth solid sine',
      range: [-1, 1],
      seed
    });
    this.colS = Waves.createSampler({
      wave: 'ramp up sine',
      range: [-1, 1],
      seed: seed + 37
    });
  }

  sample(t) {
    const cells = [];
    for (let row = 0; row < this.rows; row++) {
      const rv = this.rowS.sample(row * 5 + t);
      for (let col = 0; col < this.cols; col++) {
        const cv = this.colS.sample(col * 2.5 - t);
        cells.push(rv + cv > 0 ? 1 : 0);
      }
    }
    return cells;
  }
}
