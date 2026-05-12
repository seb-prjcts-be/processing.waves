/* ============================================================
   processing.waves site sketches
   ------------------------------------------------------------
   Live previews on this site are rendered by p5.js + the
   original p5.waves JS library (loaded from CDN). The Java
   port (processing.waves) produces numerically identical
   output, verified by a 35-case validator in /tests.

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
  "triangle", "ramp", "saw down", "saw up", "fade out",
  "grow random", "noise", "fuzzy pulse", "up down pulse",
  "bald patch", "fuzzy peak sine", "ramp up sine",
  "triangle sine", "round linked sine", "half sine",
  "smooth solid sine"
];

/* ------------------------------------------------------------
   HERO - single drifting wave landscape
   ------------------------------------------------------------ */
function mountHero(host) {
  return new p5((p) => {
    let sampler;
    p.setup = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      p.createCanvas(w, h);
      sampler = Waves.createSampler({
        shift: true,
        shiftInterval: 4,
        shiftDuration: 1.4,
        group: "gentle",
        amplitude: h * 0.18,
        frequency: 0.012
      });
    };
    p.windowResized = () => {
      p.resizeCanvas(host.clientWidth, host.clientHeight);
    };
    p.draw = () => {
      p.background(245);
      p.noFill();
      p.stroke(0, 30);
      const t = p.millis() / 1000;
      const rows = 14;
      for (let r = 0; r < rows; r++) {
        const yOff = p.height * (0.2 + 0.6 * (r / (rows - 1)));
        p.beginShape();
        for (let x = 0; x <= p.width; x += 4) {
          const y = sampler.sample(x + r * 18, t + r * 0.2);
          p.vertex(x, yOff + y);
        }
        p.endShape();
      }
    };
  }, host);
}

/* ------------------------------------------------------------
   GALLERY - 34 mini waves in a responsive grid
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
   EXAMPLES PAGE - five live previews
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

function mountExamples() {
  const handlers = {
    wave_shift:    mountWaveShift,
    morph_wave:    mountMorphWave,
    flow_fields:   mountFlowFields,
    binary_field:  mountBinaryField,
    random_walker: mountRandomWalker
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
