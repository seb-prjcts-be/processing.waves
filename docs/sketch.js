/* ============================================================
   processing.waves site sketches
   ------------------------------------------------------------
   Live previews on this site are rendered by p5.js + the
   original p5.waves JS library (loaded from CDN). The Java
   port (processing.waves) produces numerically identical
   output, verified by a 49-case validator in /tests.

   Every preview is lazy-mounted via IntersectionObserver:
   the p5 instance is created only when its container scrolls
   into view, and paused (noLoop) when it scrolls back out.
   ============================================================ */

/* ------------------------------------------------------------
   lazyMount - defer p5 creation until visible, pause off-screen.
   mountFn(host) must return the p5 instance.
   ------------------------------------------------------------ */
function lazyMount(host, mountFn) {
  if (!host) return;
  let instance = null;
  const obs = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        if (!instance) instance = mountFn(host);
        else instance.loop();
      } else if (instance) {
        instance.noLoop();
      }
    }
  }, { rootMargin: "200px" });
  obs.observe(host);
}

const WAVE_NAMES = [
  "classic sine", "sine", "sharp peaks", "square", "pulse",
  "stepped sine", "mountain peaks", "valleys", "zig-zag sine",
  "batman", "offset sine", "steps down", "steps", "squared sine",
  "bumpy sine", "wobble sine", "up down noise", "meta sine",
  "triangle", "ramp", "saw down", "saw up", "shake out",
  "grow random", "noise", "fuzzy pulse", "up down pulse",
  "bald patch", "fuzzy peak sine", "ramp up sine",
  "triangle sine", "round linked sine", "half sine",
  "smooth solid sine", "spike sine"
];

/* ------------------------------------------------------------
   HERO - layered drifting wave landscape
   ------------------------------------------------------------
   Echoes the p5.waves hero (soft gray back-silhouettes under
   bold filled colour ribbons), but carries the Signal Loom
   "curation" palette instead of p5.waves' clean colours -
   muddier reds/blues plus a VIOLET band that p5.waves doesn't
   have, so this reads as the processing.waves sibling rather
   than a copy. Background stays light gray to match the rest
   of the (otherwise monochrome) site.

   Sampler ranges are [-1,1] and scaled by canvas height at
   draw time, so the composition stays proportional on resize
   without rebuilding the samplers.
   ------------------------------------------------------------ */

// Signal Loom palette (from SignalLoom.pde) — the "slightly dirty" cousins
// of the p5.waves hero colours.
const LOOM = {
  DEEP:   [6, 71, 255],
  SIGNAL: [255, 61, 46],
  LIME:   [199, 255, 45],
  VIOLET: [142, 81, 255],
  AQUA:   [0, 189, 214]
};

function mountHero(host) {
  return new p5((p) => {
    // Back layers: gray silhouettes filled down to the bottom edge.
    const BG = [
      { yPct: 0.60, amp: 0.10,  freq: 0.006, phase: 0,   seed: 10, gray: 225, alpha: 18 },
      { yPct: 0.70, amp: 0.09,  freq: 0.009, phase: 1.4, seed: 11, gray: 205, alpha: 22 },
      { yPct: 0.80, amp: 0.08,  freq: 0.012, phase: 2.8, seed: 12, gray: 180, alpha: 28 },
      { yPct: 0.90, amp: 0.055, freq: 0.016, phase: 0.6, seed: 13, gray: 150, alpha: 40 }
    ];
    // Front layers: filled colour ribbons in the Loom palette.
    const FG = [
      { yPct: 0.55, amp: 0.20,  freq: 0.007, phase: 0.3, seed: 20, col: LOOM.DEEP,   alpha: 140, thick: 0.17 },
      { yPct: 0.63, amp: 0.18,  freq: 0.010, phase: 1.8, seed: 21, col: LOOM.SIGNAL, alpha: 150, thick: 0.17 },
      { yPct: 0.72, amp: 0.155, freq: 0.013, phase: 3.2, seed: 22, col: LOOM.LIME,   alpha: 160, thick: 0.17 },
      { yPct: 0.80, amp: 0.145, freq: 0.015, phase: 0.9, seed: 23, col: LOOM.VIOLET, alpha: 170, thick: 0.17 },
      { yPct: 0.88, amp: 0.12,  freq: 0.018, phase: 2.1, seed: 24, col: LOOM.AQUA,   alpha: 180, thick: 0.17 }
    ];

    let bgS = [], fgS = [];
    let heroT = 0;

    const makeSampler = (layer, i) =>
      Waves.createSampler({
        shift: true,
        shiftInterval: 3 + i,
        shiftDuration: 1.3,
        seed: layer.seed,
        range: [-1, 1],
        frequency: layer.freq,
        phase: layer.phase
      });

    p.setup = () => {
      p.createCanvas(host.clientWidth, host.clientHeight);
      bgS = BG.map(makeSampler);
      fgS = FG.map(makeSampler);
    };
    p.windowResized = () => {
      p.resizeCanvas(host.clientWidth, host.clientHeight);
    };
    p.draw = () => {
      p.background(245);
      p.noStroke();
      heroT += 0.018;
      const h = p.height;

      BG.forEach((b, i) => {
        const baseY = h * b.yPct;
        p.fill(b.gray, b.alpha);
        p.beginShape();
        p.vertex(0, h);
        for (let x = 0; x <= p.width; x += 6) {
          p.vertex(x, baseY + bgS[i].sample(x * 0.4, heroT) * b.amp * h);
        }
        p.vertex(p.width, h);
        p.endShape(p.CLOSE);
      });

      FG.forEach((f, i) => {
        const baseY = h * f.yPct;
        const c = p.color(f.col[0], f.col[1], f.col[2], f.alpha);
        p.fill(c);
        p.beginShape();
        for (let x = 0; x <= p.width; x += 3) {
          p.vertex(x, baseY + fgS[i].sample(x * 0.4, heroT) * f.amp * h);
        }
        for (let x = p.width; x >= 0; x -= 3) {
          p.vertex(x, baseY + f.thick * h);
        }
        p.endShape(p.CLOSE);
      });
    };
  }, host);
}

/* ------------------------------------------------------------
   GALLERY - 35 mini waves in a responsive grid
   ------------------------------------------------------------ */
function mountGalleryCell(canvasHost, name) {
  return new p5((p) => {
    p.setup = () => {
      p.createCanvas(canvasHost.clientWidth, canvasHost.clientHeight);
    };
    p.windowResized = () => {
      p.resizeCanvas(canvasHost.clientWidth, canvasHost.clientHeight);
    };
    p.draw = () => {
      p.background(255);
      p.stroke(0); p.strokeWeight(1.2); p.noFill();
      const amp = p.height * 0.32;
      // Scroll the wave horizontally: most wave formulas are pure
      // functions of x, so we shift the input to get visible motion.
      const offsetX = p.millis() / 1000 * 40;
      p.beginShape();
      for (let x = 0; x <= p.width; x += 1) {
        const y = Waves.wave(x + offsetX, { wave: name, amplitude: amp, frequency: 0.06 });
        p.vertex(x, p.height / 2 + y);
      }
      p.endShape();
    };
  }, canvasHost);
}

function buildGallery() {
  const host = document.getElementById("gallery-canvas");
  if (!host) return;

  host.style.display = "grid";
  host.style.gridTemplateColumns = "repeat(auto-fill, minmax(180px, 1fr))";
  host.style.gap = "0";
  host.style.background = "#fff";

  WAVE_NAMES.forEach((name, i) => {
    const cell = document.createElement("div");
    cell.style.cssText =
      "position:relative;aspect-ratio:16/9;border-right:1px solid rgba(0,0,0,.08);" +
      "border-bottom:1px solid rgba(0,0,0,.08);overflow:hidden;background:#fff;";
    const canvasHost = document.createElement("div");
    canvasHost.style.cssText = "position:absolute;inset:0;";
    cell.appendChild(canvasHost);
    const label = document.createElement("div");
    label.textContent = name;
    label.style.cssText =
      "position:absolute;bottom:6px;left:8px;right:8px;" +
      "font-family:'Consolas',monospace;font-size:10px;color:#333;" +
      "pointer-events:none;text-shadow:0 1px 0 #fff;";
    cell.appendChild(label);
    const idx = document.createElement("div");
    idx.textContent = String(i).padStart(2, "0");
    idx.style.cssText =
      "position:absolute;top:6px;left:8px;" +
      "font-family:'Oswald',sans-serif;font-size:10px;color:#999;" +
      "letter-spacing:.08em;";
    cell.appendChild(idx);
    host.appendChild(cell);

    lazyMount(canvasHost, (h) => mountGalleryCell(h, name));
  });
}

/* ------------------------------------------------------------
   WAVES PAGE - full-width single canvas per wave
   ------------------------------------------------------------ */
function mountWavePreview(host, name) {
  return new p5((p) => {
    p.setup = () => {
      p.createCanvas(host.clientWidth, host.clientHeight || 120);
    };
    p.windowResized = () => p.resizeCanvas(host.clientWidth, host.clientHeight || 120);
    p.draw = () => {
      p.background(255);
      p.stroke(0); p.strokeWeight(1.3); p.noFill();
      const amp = p.height * 0.34;
      // Scroll the wave horizontally for visible motion.
      const offsetX = p.millis() / 1000 * 40;
      p.beginShape();
      for (let x = 0; x <= p.width; x += 1) {
        const y = Waves.wave(x + offsetX, { wave: name, amplitude: amp, frequency: 0.055 });
        p.vertex(x, p.height / 2 + y);
      }
      p.endShape();
    };
  }, host);
}

function mountWavesPage() {
  document.querySelectorAll("[data-wave]").forEach((host) => {
    const name = host.dataset.wave;
    lazyMount(host, (h) => mountWavePreview(h, name));
  });
}

/* ------------------------------------------------------------
   EXAMPLES PAGE - eleven live previews
   Each mirrors a bundled .pde so visitors see exactly what the
   Java sketch produces when they paste the code into Processing.
   ------------------------------------------------------------ */

function mountWaveShift(host) {
  return new p5((p) => {
    let sampler;
    const STRIPS = 20;
    p.setup = () => {
      p.createCanvas(host.clientWidth, host.clientHeight || 460);
      p.textFont("Consolas");
      sampler = Waves.createSampler({ shift: true, amplitude: 1, frequency: 0.5 });
    };
    p.windowResized = () => p.resizeCanvas(host.clientWidth, host.clientHeight || 460);
    p.draw = () => {
      p.background(245);
      const t = p.millis() / 1000;
      const sw = p.width / STRIPS;
      const cy = p.height / 2;
      const rowH = p.height * 0.42;
      p.noStroke();
      for (let i = 0; i < STRIPS; i++) {
        const frac = i / (STRIPS - 1);
        p.fill(255 * (1 - frac), 0, 255 * frac);
        const v = sampler.sample(i * 0.4, t + i * 0.1);
        p.rect(i * sw, cy - v * rowH, sw - 1, v * rowH * 2);
      }
      p.fill(0); p.textSize(11);
      p.text(sampler.waveName, 8, 16);
    };
  }, host);
}

function mountMorphWave(host) {
  return new p5((p) => {
    const WAVE_A = "wobble sine";
    const WAVE_B = "meta sine";
    const ROW_COUNT = 50;
    let t = 0;
    p.setup = () => {
      p.createCanvas(host.clientWidth, host.clientHeight || 460);
      p.textFont("Consolas");
    };
    p.windowResized = () => p.resizeCanvas(host.clientWidth, host.clientHeight || 460);
    p.draw = () => {
      p.background(250);
      t += 0.0375;
      const centre = (Math.sin(t * 0.3) + 1) * 0.5;
      const rowH = p.height / ROW_COUNT;
      for (let row = 0; row < ROW_COUNT; row++) {
        const rowFrac = row / (ROW_COUNT - 1);
        const gap = Math.abs(rowFrac - centre);
        const morphMix = p.constrain(1 - gap * 3, 0, 1);
        const yBase = row * rowH + rowH * 0.5;
        p.noFill();
        p.stroke(p.lerp(0, 255, morphMix), 0, p.lerp(255, 0, morphMix));
        p.strokeWeight(1.2 + morphMix * 1.8);
        p.beginShape();
        for (let x = 0; x < p.width; x += 3) {
          const wy = Waves.wave(x, {
            wave: [WAVE_A, WAVE_B], mix: morphMix,
            t: t + row * 0.06, frequency: 0.08,
            amplitude: rowH * 2.5
          });
          p.vertex(x, yBase + p.constrain(wy, -rowH * 0.7, rowH * 0.7));
        }
        p.endShape();
      }
      p.noStroke();
      p.fill(0, 0, 255); p.textSize(10);
      p.textAlign(p.LEFT); p.text(WAVE_A, 8, 16);
      p.fill(255, 0, 0);
      p.textAlign(p.RIGHT); p.text(WAVE_B, p.width - 8, p.height - 8);
    };
  }, host);
}

/* ------------------------------------------------------------
   Example: seamless_closing
   ------------------------------------------------------------ */
function mountSeamlessClosing(host) {
  return new p5((p) => {
    const LOBES = 6;     // base-period repeats around the ring
    const SEGS = 3000;   // dense enough for the shortest closing wave
    let ring;
    let t = 0;
    p.setup = () => {
      p.createCanvas(host.clientWidth, host.clientHeight || 460);
      p.strokeJoin(p.ROUND);
      p.textFont("Consolas");
      ring = Waves.createSampler({
        shift: true, shiftInterval: 3, shiftDuration: 1.4,
        group: "closing", amplitude: 1
      });
    };
    p.windowResized = () => p.resizeCanvas(host.clientWidth, host.clientHeight || 460);
    p.draw = () => {
      p.background(12);
      t += 0.02;
      // ring.period comes straight from the library: 62.8319 for the
      // closing pool — stable through every shift.
      const sweep  = ring.period * LOBES;
      const radius = Math.min(p.width, p.height) * 0.28;
      const wobble = Math.min(p.width, p.height) * 0.10;
      const col = p.lerpColor(p.color(60, 200, 255), p.color(255, 80, 120), ring.mix);
      p.push();
      p.translate(p.width / 2, p.height / 2);
      p.noFill();
      p.stroke(col);
      p.strokeWeight(1.6);
      p.beginShape();
      for (let i = 0; i < SEGS; i++) {
        const frac = i / SEGS;
        const angle = frac * p.TWO_PI;
        const r = radius + ring.sample(frac * sweep, t) * wobble;
        p.vertex(p.cos(angle) * r, p.sin(angle) * r);
      }
      p.endShape(p.CLOSE);
      p.pop();
      p.noStroke();
      p.fill(220);
      p.textSize(11);
      p.text(ring.waveName, 8, 16);
    };
  }, host);
}

function mountFlowFields(host) {
  return new p5((p) => {
    const COLS = 30, ROWS = 30;
    const DIRS = ["-", "/", "|", "\\"];
    let sampler;
    p.setup = () => {
      p.createCanvas(host.clientWidth, host.clientHeight || 460);
      p.textFont("Consolas");
      p.textAlign(p.CENTER, p.CENTER);
      sampler = Waves.createSampler({ shift: true, shiftInterval: 4, shiftDuration: 2, frequency: 2, range: [-1, 1] });
    };
    p.windowResized = () => p.resizeCanvas(host.clientWidth, host.clientHeight || 460);
    p.draw = () => {
      p.background(255);
      const t = p.millis() / 1000;
      const sz = p.width / COLS;
      p.textSize(sz * 0.9);
      p.fill(0); p.noStroke();
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const val = sampler.sample(col * 0.5, t + row * 0.4);
          const idx = p.constrain(Math.floor(p.map(val, -1, 1.001, 0, 4)), 0, 3);
          p.text(DIRS[idx], col * sz + sz / 2, row * sz + sz / 2);
        }
      }
    };
  }, host);
}

function mountBinaryField(host) {
  return new p5((p) => {
    const COLS = 30, ROWS = 20;
    let rowS, colS;
    p.setup = () => {
      p.createCanvas(host.clientWidth, host.clientHeight || 460);
      p.textFont("Consolas");
      p.noStroke();
      rowS = Waves.createSampler({ shift: true, shiftInterval: 4,   shiftDuration: 1,   range: [-1, 1], seed: 1 });
      colS = Waves.createSampler({ shift: true, shiftInterval: 4.5, shiftDuration: 1.2, range: [-1, 1], seed: 2 });
    };
    p.windowResized = () => p.resizeCanvas(host.clientWidth, host.clientHeight || 460);
    p.draw = () => {
      p.background(245);
      const t = p.millis() / 1000;
      const labelH = 28;
      const cw = p.width / COLS;
      const ch = (p.height - labelH) / ROWS;
      const offset = t * 0.4;
      for (let row = 0; row < ROWS; row++) {
        const rv = rowS.sample(row * 5 + offset, t);
        for (let col = 0; col < COLS; col++) {
          const cv = colS.sample(col * 2.5 - offset, t);
          p.fill((rv + cv) > 0 ? 15 : 230);
          p.rect(col * cw, labelH + row * ch, cw - 0.5, ch - 0.5);
        }
      }
      p.fill(40); p.textSize(11);
      p.textAlign(p.LEFT, p.CENTER);
      p.text(rowS.waveName + "  x  " + colS.waveName, 8, labelH / 2);
    };
  }, host);
}

function mountRandomWalker(host) {
  return new p5((p) => {
    const WALKERS = 5;
    const palette = [
      [255, 60, 60], [60, 220, 60], [60, 100, 255],
      [255, 220, 40], [180, 60, 255]
    ];
    let xWave, yWave;
    let wx = [], wy = [], prevX = [], prevY = [];
    let t = 0;
    let trail;

    function step() {
      trail.noStroke();
      trail.fill(15, 15, 15, 8);
      trail.rect(0, 0, trail.width, trail.height);
      t += 0.025;
      for (let i = 0; i < WALKERS; i++) {
        const phase = i * 6.7;
        const vx = xWave.sample(t * 1.8 + phase, t);
        const vy = yWave.sample(t * 2.1 + phase * 1.3, t);
        prevX[i] = wx[i]; prevY[i] = wy[i];
        wx[i] += vx; wy[i] += vy;
        if (wx[i] < 0)        wx[i] += p.width;
        if (wx[i] > p.width)  wx[i] -= p.width;
        if (wy[i] < 0)        wy[i] += p.height;
        if (wy[i] > p.height) wy[i] -= p.height;
        if (Math.abs(wx[i] - prevX[i]) > p.width / 2)  continue;
        if (Math.abs(wy[i] - prevY[i]) > p.height / 2) continue;
        const col = palette[i];
        trail.stroke(col[0], col[1], col[2], 200);
        trail.strokeWeight(2.5);
        trail.line(prevX[i], prevY[i], wx[i], wy[i]);
      }
    }

    p.setup = () => {
      const w = host.clientWidth, h = host.clientHeight || 460;
      p.createCanvas(w, h);
      p.textFont("Consolas");
      trail = p.createGraphics(w, h);
      trail.background(15);
      xWave = Waves.createSampler({ shift: true, shiftInterval: 4, shiftDuration: 1.5, amplitude: 2.5, frequency: 0.7,  seed: 0 });
      yWave = Waves.createSampler({ shift: true, shiftInterval: 5, shiftDuration: 1.2, amplitude: 2.5, frequency: 0.55, seed: 77 });
      for (let i = 0; i < WALKERS; i++) {
        const a = p.TWO_PI * i / WALKERS;
        wx[i] = w / 2 + Math.cos(a) * 40;
        wy[i] = h / 2 + Math.sin(a) * 40;
        prevX[i] = wx[i]; prevY[i] = wy[i];
      }
      // Pre-bake ~10 seconds of motion so the trail is already rich
      // when the visitor first sees the canvas.
      for (let f = 0; f < 600; f++) step();
    };
    p.draw = () => {
      step();
      p.image(trail, 0, 0);
      p.noStroke(); p.fill(255, 255, 255, 120);
      p.textSize(10); p.textAlign(p.LEFT);
      p.text(xWave.waveName + " x " + yWave.waveName, 8, 16);
    };
  }, host);
}

function mountWaveParams(host) {
  return new p5((p) => {
    const LINE_COUNT = 8;
    let shiftSampler;
    let t = 0;
    p.setup = () => {
      p.createCanvas(host.clientWidth, host.clientHeight || 460);
      p.textFont("Consolas");
      // Only used to get shifting wave names
      shiftSampler = Waves.createSampler({ shift: true, shiftInterval: 4, shiftDuration: 1.5, seed: 42 });
    };
    p.windowResized = () => p.resizeCanvas(host.clientWidth, host.clientHeight || 460);
    p.draw = () => {
      p.background(245);
      t += 0.015;
      const freq = p.constrain(p.map(p.mouseX, 0, p.width, 0.15, 3.5), 0.15, 3.5);
      const amp  = p.constrain(p.map(p.mouseY, 0, p.height, 120, 8), 8, 120);
      shiftSampler.sample(0, t);
      const waveName = shiftSampler.waveName;
      for (let i = 0; i < LINE_COUNT; i++) {
        const progress = i / (LINE_COUNT - 1);
        const phase = i * 0.7;
        const lineAmp = amp * (1 - progress * 0.5);
        p.stroke(p.lerp(0, 200, progress));
        p.strokeWeight(p.lerp(2.5, 0.8, progress));
        p.noFill();
        p.beginShape();
        for (let x = 0; x <= p.width; x += 3) {
          const val = Waves.wave(x, {
            wave: waveName, t: t, amplitude: lineAmp,
            frequency: freq * 0.01, phase: phase
          });
          p.vertex(x, p.height / 2 + val);
        }
        p.endShape();
      }
      p.noStroke(); p.fill(0); p.textSize(10);
      p.textAlign(p.LEFT, p.TOP);
      p.text(waveName, 8, 8);
      p.textAlign(p.LEFT, p.BOTTOM);
      p.text("frequency: " + freq.toFixed(2), 8, p.height - 8);
      p.textAlign(p.RIGHT, p.BOTTOM);
      p.text("amplitude: " + amp.toFixed(0), p.width - 8, p.height - 8);
      p.stroke(0, 20); p.strokeWeight(0.5);
      p.line(p.mouseX, 0, p.mouseX, p.height);
      p.line(0, p.mouseY, p.width, p.mouseY);
    };
  }, host);
}

function mountWildMode(host) {
  return new p5((p) => {
    const COLS = 20, ROWS = 14;
    let t = 0;
    let wildWave;
    p.setup = () => {
      p.createCanvas(host.clientWidth, host.clientHeight || 460);
      p.noStroke();
      p.textFont("Consolas");
      p.textAlign(p.CENTER);
      wildWave = Math.floor(Math.random() * Waves.count);
    };
    p.windowResized = () => p.resizeCanvas(host.clientWidth, host.clientHeight || 460);
    p.draw = () => {
      p.background(238);
      t += 0.012;
      const cw = p.width / COLS;
      const ch = (p.height - 24) / ROWS;
      const maxR = Math.min(cw, ch) * 0.44;
      const half = COLS / 2;
      const unpred = p.constrain(p.map(p.mouseX, 0, p.width, 0, 1), 0, 1);
      p.noStroke(); p.fill(0);
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const cx = (col + 0.5) * cw;
          const cy = (row + 0.5) * ch;
          const coord = col * 0.15 + row * 0.3;
          const sz = (col < half)
            ? Waves.wave(coord, { wave: wildWave, t: t, range: [3, maxR] })
            : Waves.wave(coord, {
                wave: wildWave, t: t, range: [3, maxR],
                mode: "wild", unpredictability: unpred
              });
          p.circle(cx, cy, sz * 2);
        }
      }
      p.stroke(0, 30); p.strokeWeight(1);
      p.line(p.width / 2, 0, p.width / 2, p.height - 24);
      p.noStroke(); p.fill(0); p.textSize(10);
      p.text("stable", p.width / 4, p.height - 6);
      p.text("wild  " + unpred.toFixed(2), 3 * p.width / 4, p.height - 6);
    };
  }, host);
}

function mountTimeStrata(host) {
  return new p5((p) => {
    const LAYERS = 16, WAVE_WINDOW = 6;
    p.setup = () => {
      p.createCanvas(host.clientWidth, host.clientHeight || 460);
      p.colorMode(p.HSB, 360, 100, 100, 255);
      p.textFont("Consolas");
    };
    p.windowResized = () => p.resizeCanvas(host.clientWidth, host.clientHeight || 460);
    p.draw = () => {
      p.background(0, 0, 96);
      const timeBase = p.map(p.mouseX, 0, p.width, 0, 24);
      p.noStroke();
      for (let i = LAYERS - 1; i >= 0; i--) {
        const layerT = timeBase + (i / LAYERS) * WAVE_WINDOW;
        const y0 = p.map(i, 0, LAYERS - 1, 50, p.height - 50);
        const wHue = (i * 22) % 360;
        const alphaVal = p.map(i, 0, LAYERS - 1, 200, 60);
        const freq = 0.6 + i * 0.08;
        p.fill(wHue, 70, 85, alphaVal);
        p.beginShape();
        for (let x = 0; x <= p.width; x += 3) {
          const dy = Waves.wave(x * 0.15, {
            wave: "classic sine", t: layerT, amplitude: 25, frequency: freq
          });
          p.vertex(x, y0 + dy);
        }
        for (let x2 = p.width; x2 >= 0; x2 -= 3) {
          const dy2 = Waves.wave(x2 * 0.15, {
            wave: "classic sine", t: layerT + 0.3, amplitude: 15, frequency: freq
          });
          p.vertex(x2, y0 + dy2 + 22);
        }
        p.endShape(p.CLOSE);
      }
      p.fill(0); p.noStroke(); p.textSize(10);
      p.textAlign(p.LEFT);
      p.text("t = " + timeBase.toFixed(2), 12, 20);
      p.text("move mouse", 12, 34);
    };
  }, host);
}

function mountColorField(host) {
  return new p5((p) => {
    let baseR, baseG, baseB, fieldR, fieldG, fieldB;
    p.setup = () => {
      p.createCanvas(host.clientWidth, host.clientHeight || 460);
      p.noStroke();
      p.textFont("Consolas");
      baseR = Waves.createSampler({ shift: true, group: "gentle", range: [0, 155], frequency: 0.20, shiftInterval: 7, shiftDuration: 2 });
      baseG = Waves.createSampler({ shift: true, group: "gentle", range: [0, 155], frequency: 0.17, shiftInterval: 8, shiftDuration: 2 });
      baseB = Waves.createSampler({ shift: true, group: "gentle", range: [0, 155], frequency: 0.13, shiftInterval: 9, shiftDuration: 2 });
      fieldR = Waves.createSampler({
        shift: true,
        group: ["classic sine", "triangle", "bumpy sine", "mountain peaks", "wobble sine"],
        range: [0, 1], frequency: 0.08, shiftInterval: 4, shiftDuration: 1.5
      });
      fieldG = Waves.createSampler({
        shift: true,
        group: ["sine", "triangle", "squared sine", "valleys", "round linked sine"],
        range: [0, 1], frequency: 0.06, shiftInterval: 5, shiftDuration: 1.5
      });
      fieldB = Waves.createSampler({
        shift: true,
        group: ["classic sine", "sharp peaks", "bumpy sine", "half sine", "smooth solid sine"],
        range: [0, 1], frequency: 0.07, shiftInterval: 6, shiftDuration: 1.5
      });
    };
    p.windowResized = () => p.resizeCanvas(host.clientWidth, host.clientHeight || 460);
    p.draw = () => {
      p.background(245);
      const cell = 8, top = 30;
      const t = p.millis() / 1000;
      const r0 = Math.floor(p.constrain(baseR.sample(0,   t), 0, 155));
      const g0 = Math.floor(p.constrain(baseG.sample(100, t), 0, 155));
      const b0 = Math.floor(p.constrain(baseB.sample(200, t), 0, 155));
      for (let y = top; y < p.height; y += cell) {
        for (let x = 0; x < p.width; x += cell) {
          let rp = p.constrain(fieldR.sample(x + y * 0.35,        t), 0, 1);
          let gp = p.constrain(fieldG.sample(x * 0.3 + y,         t), 0, 1);
          let bp = p.constrain(fieldB.sample(x * 0.7 - y * 0.25,  t), 0, 1);
          rp = p.lerp(rp, Math.random(), 0.15);
          gp = p.lerp(gp, Math.random(), 0.15);
          bp = p.lerp(bp, Math.random(), 0.15);
          p.fill(r0 + rp * 100, g0 + gp * 100, b0 + bp * 100);
          p.rect(x, y, cell, cell);
        }
      }
      p.fill(20); p.textSize(11);
      p.textAlign(p.LEFT, p.CENTER);
      p.text("R " + r0 + "-" + (r0 + 100) +
             "   G " + g0 + "-" + (g0 + 100) +
             "   B " + b0 + "-" + (b0 + 100), 8, 12);
    };
  }, host);
}

function mountSpikyLissajous(host) {
  return new p5((p) => {
    const SPIKY = [
      { name: "sharp peaks",   period: Math.PI * 10, color: [70, 220, 130] },
      { name: "batman",        period: Math.PI * 20, color: [255, 70, 70] },
      { name: "zig-zag sine",  period: Math.PI * 10, color: [60, 160, 255] },
      { name: "up down pulse", period: Math.PI * 10, color: [250, 220, 40] }
    ];
    const RATIO_A = 3, RATIO_B = 5;
    const SEGMENTS = 1400, CYCLE_MS = 4500;
    let waveIdx = 0;
    const xs = new Array(SEGMENTS + 1);
    const ys = new Array(SEGMENTS + 1);
    p.setup = () => {
      p.createCanvas(host.clientWidth, host.clientHeight || 460);
      p.strokeJoin(p.ROUND);
      p.noFill();
      p.textFont("Consolas");
    };
    p.windowResized = () => p.resizeCanvas(host.clientWidth, host.clientHeight || 460);
    p.draw = () => {
      p.background(12);
      p.translate(p.width / 2, p.height / 2);
      const choice = SPIKY[waveIdx];
      const period = choice.period;
      const radius = Math.min(p.width, p.height) * 0.34;
      // Freeze phase for one cycle so the pen draws a genuine closed loop.
      const cycleId = Math.floor(p.millis() / CYCLE_MS);
      const frozenMs = cycleId * CYCLE_MS;
      const phaseX = frozenMs * 0.00015;
      const phaseY = frozenMs * 0.00021;
      const prog = (p.millis() % CYCLE_MS) / CYCLE_MS;
      const drawnTo = Math.floor(prog * SEGMENTS);
      for (let i = 0; i <= SEGMENTS; i++) {
        const theta = (i / SEGMENTS) * period;
        xs[i] = radius * Waves.wave(RATIO_A * theta + phaseX * period, { wave: choice.name, amplitude: 1 });
        ys[i] = radius * Waves.wave(RATIO_B * theta + phaseY * period + period * 0.25, { wave: choice.name, amplitude: 1 });
      }
      // Dim ghost of the full closed loop.
      p.noFill();
      p.stroke(choice.color[0] * 0.22, choice.color[1] * 0.22, choice.color[2] * 0.22);
      p.strokeWeight(1);
      p.beginShape();
      for (let i = 0; i <= SEGMENTS; i++) p.vertex(xs[i], ys[i]);
      p.endShape(p.CLOSE);
      // Bright pen trail up to the current progress.
      p.stroke(choice.color[0], choice.color[1], choice.color[2]);
      p.strokeWeight(1.4);
      p.beginShape();
      for (let i = 0; i <= drawnTo; i++) p.vertex(xs[i], ys[i]);
      p.endShape();
      // Start marker — the "home" the pen must return to.
      const homeR = 12 + Math.sin(prog * p.TWO_PI) * 1.5;
      p.noStroke();
      p.fill(255); p.circle(xs[0], ys[0], homeR);
      p.fill(18);  p.circle(xs[0], ys[0], homeR - 6);
      // Pen cursor.
      p.fill(255);
      p.circle(xs[drawnTo], ys[drawnTo], 8);
      // HUD
      p.noStroke(); p.fill(220); p.textSize(12);
      p.text(choice.name + "  /  ratio " + RATIO_A + ":" + RATIO_B,
             -p.width / 2 + 18, -p.height / 2 + 24);
      p.fill(120); p.textSize(10);
      p.text("click to cycle wave  /  the pen returns to the white dot",
             -p.width / 2 + 18, -p.height / 2 + 42);
    };
    p.mousePressed = () => {
      if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
        waveIdx = (waveIdx + 1) % SPIKY.length;
      }
    };
  }, host);
}

function mountWaveVolume3D(host) {
  return new p5((p) => {
    const N = 16, SPACING = 22;
    const HALF = (N - 1) * SPACING / 2;
    let samplerY, samplerX, samplerZ;
    let rotAngle = 0;
    let tilt = -0.5;
    p.setup = () => {
      p.createCanvas(host.clientWidth, host.clientHeight || 460, p.WEBGL);
      p.frameRate(30);
      p.noFill();
      p.strokeWeight(4);
      samplerY = Waves.createSampler({ shift: true, shiftInterval: 3, shiftDuration: 1.5, range: [-6, 6], frequency: 0.4,  seed: 0 });
      samplerX = Waves.createSampler({ shift: true, shiftInterval: 4, shiftDuration: 1.2, range: [-3, 3], frequency: 0.3,  seed: 42 });
      samplerZ = Waves.createSampler({ shift: true, shiftInterval: 5, shiftDuration: 1,   range: [-3, 3], frequency: 0.35, seed: 77 });
    };
    p.windowResized = () => p.resizeCanvas(host.clientWidth, host.clientHeight || 460);
    p.draw = () => {
      p.background(12);
      p.rotateX(tilt);
      rotAngle += 0.005;
      p.rotateY(rotAngle);
      const t = p.millis() / 1000;
      p.beginShape(p.POINTS);
      for (let xi = 0; xi < N; xi++) {
        for (let zi = 0; zi < N; zi++) {
          const dy = samplerY.sample(xi * 0.9 + zi * 0.6, t);
          const dx = samplerX.sample(zi * 0.8 + xi * 0.3, t * 0.85);
          const dz = samplerZ.sample(xi * 0.7 + zi * 0.5, t * 0.7);
          const surfaceRow = N / 2 + dy;
          const thick = 2.5;
          for (let yi = 0; yi < N; yi++) {
            const gap = Math.abs(yi - surfaceRow);
            if (gap < thick) {
              const glow = 1 - gap / thick;
              const bright = Math.round(80 + (yi / (N - 1)) * 175);
              p.stroke(bright, bright, 255, 255 * glow);
              p.vertex(
                -HALF + xi * SPACING + dx * SPACING * 0.4,
                -HALF + yi * SPACING,
                -HALF + zi * SPACING + dz * SPACING * 0.4
              );
            }
          }
        }
      }
      p.endShape();
    };
    p.mouseDragged = () => {
      if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
        rotAngle += (p.mouseX - p.pmouseX) * 0.01;
        tilt     += (p.mouseY - p.pmouseY) * 0.01;
      }
    };
  }, host);
}

/* ------------------------------------------------------------
   Example: ghost_delay
   ------------------------------------------------------------ */
function mountGhostDelay(host) {
  return new p5((p) => {
    const N = 800;
    let sampler;
    p.setup = () => {
      p.createCanvas(host.clientWidth, host.clientHeight || 460);
      p.colorMode(p.HSB, 360, 100, 100, 100);
      p.strokeJoin(p.ROUND);
      p.textFont("Consolas");
      // 'ghost' is a built-in pool of closing waves that stay clean under
      // this delay. range [-1, 1] gives unit output.
      sampler = Waves.createSampler({ group: "ghost", shift: true, range: [-1, 1] });
    };
    p.windowResized = () => p.resizeCanvas(host.clientWidth, host.clientHeight || 460);
    p.draw = () => {
      p.background(230, 25, 8);
      p.noFill();
      const t = p.millis() / 1000;
      const hu = (t * 12) % 360;
      const period = sampler.period;                      // ghost waves share one period
      const tau = period * (0.5 + 0.35 * p.sin(t * 0.35)); // the ghost delay, breathing

      // The ring: the wave against its own delayed self.
      const rad = Math.min(p.width, p.height) * 0.36;
      p.stroke(hu, 55, 100, 90);
      p.strokeWeight(1.4);
      p.push();
      p.translate(p.width / 2, p.height / 2 - 20);
      p.beginShape();
      for (let i = 0; i <= N; i++) {
        const u = (i / N) * period;                       // one period -> the ring closes
        p.vertex(sampler.sample(u, t) * rad, sampler.sample(u + tau, t) * rad);
      }
      p.endShape(p.CLOSE);
      p.pop();

      // The raw 1D wave as a height line, with the two read points marked.
      const baseY = p.height - 40;
      const w = p.width - 120;
      const left = 60;
      const amp = 20;
      p.noFill();
      p.stroke(hu, 45, 100, 70);
      p.strokeWeight(1.2);
      p.beginShape();
      for (let i = 0; i <= N; i++) {
        const u = (i / N) * period;
        p.vertex(left + (i / N) * w, baseY - sampler.sample(u, t) * amp);
      }
      p.endShape();
      p.noStroke();
      p.fill(0, 0, 100);
      p.circle(left, baseY - sampler.sample(0, t) * amp, 7);
      p.fill(hu, 70, 100);
      p.circle(left + ((tau % period) / period) * w, baseY - sampler.sample(tau, t) * amp, 7);

      p.fill(0, 0, 70);
      p.textSize(11);
      p.text(sampler.waveName, 8, 16);
    };
  }, host);
}

function mountExamples() {
  const handlers = {
    wave_shift:      mountWaveShift,
    morph_wave:      mountMorphWave,
    seamless_closing: mountSeamlessClosing,
    ghost_delay:     mountGhostDelay,
    flow_fields:     mountFlowFields,
    binary_field:    mountBinaryField,
    random_walker:   mountRandomWalker,
    wave_params:     mountWaveParams,
    wild_mode:       mountWildMode,
    time_strata:     mountTimeStrata,
    color_field:     mountColorField,
    spiky_lissajous: mountSpikyLissajous,
    wave_volume_3d:  mountWaveVolume3D
  };
  document.querySelectorAll("[data-example]").forEach((host) => {
    const fn = handlers[host.dataset.example];
    if (fn) lazyMount(host, fn);
  });
}

/* ------------------------------------------------------------
   Entry point
   ------------------------------------------------------------ */
function bootstrap() {
  if (typeof Waves === "undefined") {
    setTimeout(bootstrap, 80);
    return;
  }
  const hero = document.getElementById("hero-canvas");
  if (hero) lazyMount(hero, mountHero);
  buildGallery();
  mountWavesPage();
  mountExamples();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
