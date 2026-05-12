/* ============================================================
   processing.waves site sketches
   ------------------------------------------------------------
   Live previews on this site are rendered by p5.js + the
   original p5.waves JS library (loaded from CDN). The Java
   port (processing.waves) produces numerically identical
   output, verified by a 35-case validator in /tests.
   ============================================================ */

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
   HERO — single drifting wave landscape
   ------------------------------------------------------------ */
function mountHero() {
  const host = document.getElementById("hero-canvas");
  if (!host || typeof Waves === "undefined") return;

  new p5((p) => {
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
   GALLERY — 34 mini waves in a responsive grid
   ------------------------------------------------------------ */
function mountGallery() {
  const host = document.getElementById("gallery-canvas");
  if (!host || typeof Waves === "undefined") return;

  // Build the grid markup.
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

    new p5((p) => {
      p.setup = () => {
        const w = canvasHost.clientWidth;
        const h = canvasHost.clientHeight;
        p.createCanvas(w, h);
        p.noLoop();
      };
      p.windowResized = () => {
        p.resizeCanvas(canvasHost.clientWidth, canvasHost.clientHeight);
        p.redraw();
      };
      p.draw = () => {
        p.background(255);
        p.stroke(0);
        p.strokeWeight(1.2);
        p.noFill();
        const amp = p.height * 0.32;
        const freq = 0.06;
        p.beginShape();
        for (let x = 0; x <= p.width; x += 1) {
          const y = Waves.wave(x, {
            wave: name,
            amplitude: amp,
            frequency: freq
          });
          p.vertex(x, p.height / 2 + y);
        }
        p.endShape();
      };
    }, canvasHost);
  });
}

/* ------------------------------------------------------------
   WAVES PAGE — full-width single canvas per wave
   ------------------------------------------------------------ */
function mountWavesPage() {
  const containers = document.querySelectorAll("[data-wave]");
  if (!containers.length || typeof Waves === "undefined") return;

  containers.forEach((host) => {
    const name = host.dataset.wave;
    new p5((p) => {
      p.setup = () => {
        const w = host.clientWidth;
        const h = host.clientHeight || 120;
        p.createCanvas(w, h);
      };
      p.windowResized = () => {
        p.resizeCanvas(host.clientWidth, host.clientHeight || 120);
      };
      p.draw = () => {
        p.background(255);
        p.stroke(0);
        p.strokeWeight(1.3);
        p.noFill();
        const amp = p.height * 0.34;
        const t = p.millis() / 1000;
        p.beginShape();
        for (let x = 0; x <= p.width; x += 1) {
          const y = Waves.wave(x, {
            wave: name,
            amplitude: amp,
            frequency: 0.055,
            t: t * 12
          });
          p.vertex(x, p.height / 2 + y);
        }
        p.endShape();
      };
    }, host);
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
  mountHero();
  mountGallery();
  mountWavesPage();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
