/* Signal Loom - Deep Guide
 * The instruction is Processing (the .pde blocks in the page).
 * These are the working parts simulated online with p5 + p5.waves.
 * Wave logic mirrors signal-loom-sketch.js so the previews behave
 * like the full loom. */
(function () {
  'use strict';

  var PAPER = '#f7f2e8';
  var INK = '#090908';
  var SIGNAL = '#ff3d2e';
  var DEEP = '#0647ff';
  var LIME = '#c7ff2d';
  var VIOLET = '#8e51ff';
  var AQUA = '#00bdd6';

  var CURATED = ['classic sine', 'mountain peaks', 'wobble sine', 'triangle sine', 'meta sine'];
  var POOLS = [
    { key: 'gentle', group: 'gentle', color: DEEP },
    { key: 'harsh', group: 'harsh', color: SIGNAL },
    { key: 'all', group: 'all', color: AQUA },
    { key: 'curated', group: CURATED, color: VIOLET }
  ];
  var WORDS = ['warp', 'weft', 'tension', 'shuttle', 'pattern', 'phase', 'morph', 'output'];

  function accent(v) {
    var colors = [SIGNAL, DEEP, LIME, VIOLET, AQUA];
    return colors[Math.max(0, Math.min(colors.length - 1, Math.floor(v * colors.length)))];
  }

  function alphaHex(a) {
    var n = Math.max(0, Math.min(255, Math.round(a)));
    return (n < 16 ? '0' : '') + n.toString(16);
  }

  function canvasSize(id, ratio, minH, maxH) {
    var el = document.getElementById(id);
    var w = Math.max(320, Math.floor((el && el.offsetWidth) || 320));
    var h = Math.round(Math.min(maxH, Math.max(minH, w * ratio)));
    return { width: w, height: h };
  }

  function activeIndex(t) {
    return Math.floor(t / 5.2) % POOLS.length;
  }

  // Single source of truth for the three shared samplers — these match
  // motionSampler / pulseSampler / colorSampler in signal-loom-sketch.js
  // and the PDE's rebuildSystem(), so every preview stays in sync with
  // the loom.
  function makeMotion() {
    return Waves.createSampler({ group: 'gentle', shift: true, shiftInterval: 5.4, shiftDuration: 1.25, range: [-1, 1], frequency: 0.72, seed: 110 });
  }
  function makePulse() {
    return Waves.createSampler({ group: 'harsh', shift: true, shiftInterval: 3.6, shiftDuration: 0.9, range: [0, 1], frequency: 1.18, mode: 'wild', unpredictability: 0.28, seed: 220 });
  }
  function makeColor() {
    return Waves.createSampler({ group: 'all', shift: true, shiftInterval: 6.2, shiftDuration: 1.5, range: [0, 1], frequency: 0.54, seed: 330 });
  }

  function makeThreadSamplers(seedBase) {
    return POOLS.map(function (pool, i) {
      return Waves.createSampler({
        group: pool.group,
        shift: true,
        shiftInterval: 3.8 + i * 0.45,
        shiftDuration: 1.1,
        range: [-1, 1],
        frequency: 0.5 + i * 0.08,
        mode: pool.key === 'harsh' ? 'wild' : 'stable',
        unpredictability: pool.key === 'harsh' ? 0.33 : 0,
        seed: seedBase + i * 61
      });
    });
  }

  // Fixed punch-card pair: smooth solid sine rows, ramp up sine cols,
  // summed and thresholded with rv + cv > 0 (mirrors LoomGrid in the PDE).
  function makeLoom(cols, rows, seed) {
    return {
      cols: cols,
      rows: rows,
      rowS: Waves.createSampler({ wave: 'smooth solid sine', range: [-1, 1], seed: seed }),
      colS: Waves.createSampler({ wave: 'ramp up sine', range: [-1, 1], seed: seed + 37 }),
      sample: function (t) {
        var cells = [];
        for (var row = 0; row < rows; row++) {
          var rv = this.rowS.sample(row * 5 + t);
          for (var col = 0; col < cols; col++) {
            var cv = this.colS.sample(col * 2.5 - t);
            cells.push(rv + cv > 0 ? 1 : 0);
          }
        }
        return cells;
      }
    };
  }

  var registry = new Map();
  function register(id, builder) {
    if (!document.getElementById(id)) return;
    registry.set(id, new p5(builder, id));
  }

  /* ─── overview: condensed full loom ─────────────────────────── */
  register('guide-system', function (p) {
    var motion, pulse, colorS, threads, loom;

    function build() {
      motion = makeMotion();
      pulse = makePulse();
      colorS = makeColor();
      threads = makeThreadSamplers(500);
      loom = makeLoom(18, 11, 800);
    }

    p.setup = function () {
      var s = canvasSize('guide-system', 0.56, 280, 440);
      p.createCanvas(s.width, s.height).parent('guide-system');
      p.pixelDensity(1);
      p.frameRate(30);
      build();
    };

    p.draw = function () {
      var t = p.millis() / 1000;
      var active = activeIndex(t);
      var pool = POOLS[active];
      p.background(PAPER);

      // backplane
      p.noStroke();
      p.blendMode(p.MULTIPLY);
      var cols = 9, cw = p.width / cols;
      for (var i = 0; i < cols; i++) {
        var v = colorS.sample(i * 0.21, t * 0.8);
        p.fill(p.color(accent(v) + '2e'));
        p.rect(i * cw, 0, cw * p.map(v, 0, 1, 0.35, 0.95), p.height);
      }
      p.blendMode(p.BLEND);

      var m = 16;
      var bx = m, bw = p.width - m * 2;
      var by = p.height * 0.34, bh = p.height * 0.42;

      // loom frame
      p.stroke(INK);
      p.strokeWeight(3);
      p.fill(p.color(PAPER + 'cc'));
      p.rect(bx - 8, by - 12, bw + 16, bh + 24);
      p.noStroke();
      p.fill(p.color(pool.color + '22'));
      p.rect(bx, by, bw, bh);

      // warp threads
      p.blendMode(p.MULTIPLY);
      p.noFill();
      for (var k = 0; k < POOLS.length; k++) {
        var baseX = p.map(k, 0, POOLS.length - 1, bx + bw * 0.16, bx + bw * 0.84);
        var amp = bw * (k === active ? 0.12 : 0.06);
        p.stroke(p.color(POOLS[k].color + (k === active ? 'd8' : '74')));
        p.strokeWeight(k === active ? 11 : 5);
        p.beginShape();
        for (var y = by; y <= by + bh; y += 11) {
          var weave = Waves.wave(y * 0.013 + k * 0.41, {
            group: POOLS[k].group, shift: true, seed: 1200 + k * 77,
            t: t * 0.74, amplitude: amp, frequency: 0.72,
            mode: POOLS[k].key === 'harsh' ? 'wild' : 'stable'
          });
          var drift = threads[k].sample(y * 0.01, t) * 28;
          p.vertex(baseX + weave + drift, y);
        }
        p.endShape();
      }
      // weft passes
      var grid = loom.sample(t);
      var rowGap = bh / loom.rows;
      p.strokeCap(p.SQUARE);
      for (var row = 0; row < loom.rows; row++) {
        var ry = by + rowGap * (row + 0.5);
        var rp = motion.sample(row * 0.13, t) * 12;
        for (var col = 0; col < loom.cols; col++) {
          var on = grid[row * loom.cols + col] === 1;
          if (!on && (row + col) % 3 !== 0) continue;
          var x0 = bx + (col / loom.cols) * bw;
          var x1 = bx + ((col + 0.82) / loom.cols) * bw;
          var pv = pulse.sample((row + col) * 0.08, t);
          p.stroke(on ? p.color(pool.color + 'c8') : p.color(INK + '20'));
          p.strokeWeight(on ? p.map(pv, 0, 1, 2, 6) : 1.1);
          p.line(x0, ry + rp, x1, ry - rp * 0.35);
        }
      }
      p.strokeCap(p.ROUND);
      p.blendMode(p.BLEND);

      // title
      p.noStroke();
      p.textFont('Oswald');
      p.textStyle(p.BOLD);
      var ts = Math.min(54, p.width * 0.085);
      p.textSize(ts);
      p.textAlign(p.LEFT, p.TOP);
      var cur = m, label = 'SIGNAL LOOM';
      for (var c = 0; c < label.length; c++) {
        var ch = label[c];
        if (ch === ' ') { cur += ts * 0.28; continue; }
        var lift = motion.sample(c * 0.23, t) * ts * 0.05;
        p.fill(c === 7 || c === 8 ? accent(colorS.sample(c * 0.18, t)) : INK);
        p.text(ch, cur, p.height * 0.07 + lift);
        cur += p.textWidth(ch) * 0.98;
      }
      p.textStyle(p.NORMAL);

      // readout bar
      var threadS = threads[active];
      threadS.sample(0.42, t);
      var rw = Math.min(bw, 420), rh = 26;
      var rx = bx, ryy = by + bh + 18;
      var mix = threadS.shifting ? threadS.mix : pulse.sample(0.5, t);
      p.fill(INK);
      p.rect(rx, ryy, rw, rh);
      p.fill(pool.color);
      p.rect(rx, ryy, rw * p.constrain(mix, 0, 1), rh);
      p.fill(mix > 0.55 ? INK : PAPER);
      p.textFont('Consolas');
      p.textSize(10);
      p.textAlign(p.LEFT, p.CENTER);
      p.text(('tension ' + pool.key).toUpperCase(), rx + 10, ryy + rh * 0.5);
      p.fill(PAPER);
      p.textAlign(p.RIGHT, p.CENTER);
      p.text(((threadS.waveName || 'wave') + ' -> ' + (threadS.targetName || threadS.waveName || 'wave')).toUpperCase(), rx + rw - 10, ryy + rh * 0.5);
    };

    p.windowResized = function () {
      var s = canvasSize('guide-system', 0.56, 280, 440);
      p.resizeCanvas(s.width, s.height);
    };
  });

  /* ─── 01 pools: four tension voices ─────────────────────────── */
  register('guide-pools', function (p) {
    var threads;

    p.setup = function () {
      var s = canvasSize('guide-pools', 0.62, 240, 360);
      p.createCanvas(s.width, s.height).parent('guide-pools');
      p.pixelDensity(1);
      p.frameRate(30);
      p.textFont('Oswald');
      threads = makeThreadSamplers(1200);
    };

    p.draw = function () {
      var t = p.millis() / 1000;
      var active = activeIndex(t);
      var m = 16;
      var labelW = Math.max(96, p.width * 0.2);
      var rowH = (p.height - m * 2 - 12 * 3) / 4;
      p.background(PAPER);

      for (var i = 0; i < POOLS.length; i++) {
        var pool = POOLS[i];
        var y = m + i * (rowH + 12);
        var amp = 10 + Math.abs(threads[i].sample(i * 0.22, t)) * (pool.key === 'harsh' ? 26 : 18);

        p.stroke(INK);
        p.strokeWeight(i === active ? 3 : 1);
        p.fill(i === active ? '#fffdf8' : '#f1e9da');
        p.rect(m, y, p.width - m * 2, rowH);
        p.noStroke();

        p.fill(pool.color);
        p.rect(m, y, labelW, rowH);
        p.fill(i === active ? PAPER : INK);
        p.textStyle(p.BOLD);
        p.textSize(15);
        p.textAlign(p.LEFT, p.TOP);
        p.text(pool.key.toUpperCase(), m + 12, y + 10);
        p.textStyle(p.NORMAL);
        p.textFont('Consolas');
        p.textSize(8);
        p.fill(i === active ? p.color(PAPER + 'cc') : p.color(INK + '99'));
        p.text('tension voice', m + 12, y + 30);
        p.textFont('Oswald');

        p.fill(p.color(pool.color + (i === active ? 'c8' : '6e')));
        p.beginShape();
        for (var x = m + labelW + 12; x <= p.width - m - 12; x += 12) {
          var w = Waves.wave(x * 0.018 + i * 0.3, {
            group: pool.group, shift: true, shiftInterval: 3.8 + i * 0.45,
            shiftDuration: 1.1, seed: 1600 + i * 40, t: t + i * 0.3,
            amplitude: amp, frequency: 0.5 + i * 0.08,
            mode: pool.key === 'harsh' ? 'wild' : 'stable',
            unpredictability: pool.key === 'harsh' ? 0.33 : 0
          });
          p.vertex(x, y + rowH * 0.48 + w);
        }
        for (var xb = p.width - m - 12; xb >= m + labelW + 12; xb -= 12) {
          p.vertex(xb, y + rowH - 10);
        }
        p.endShape(p.CLOSE);
      }
    };

    p.windowResized = function () {
      var s = canvasSize('guide-pools', 0.62, 240, 360);
      p.resizeCanvas(s.width, s.height);
    };
  });

  /* ─── 02 warp threads ───────────────────────────────────────── */
  register('guide-warp', function (p) {
    var threads;

    p.setup = function () {
      var s = canvasSize('guide-warp', 0.62, 240, 380);
      p.createCanvas(s.width, s.height).parent('guide-warp');
      p.pixelDensity(1);
      p.frameRate(30);
      threads = makeThreadSamplers(500);
    };

    p.draw = function () {
      var t = p.millis() / 1000;
      var active = activeIndex(t);
      var m = 18;
      var by = m, bh = p.height - m * 2;
      var bx = m, bw = p.width - m * 2;
      p.background(PAPER);

      p.noStroke();
      p.fill(p.color(POOLS[active].color + '14'));
      p.rect(bx, by, bw, bh);
      p.stroke(p.color(INK + '88'));
      p.strokeWeight(2);
      p.line(bx, by, bx + bw, by);
      p.line(bx, by + bh, bx + bw, by + bh);

      p.blendMode(p.MULTIPLY);
      p.noFill();
      for (var i = 0; i < POOLS.length; i++) {
        var pool = POOLS[i];
        var baseX = p.map(i, 0, POOLS.length - 1, bx + bw * 0.16, bx + bw * 0.84);
        var amp = bw * (i === active ? 0.125 : 0.07);
        p.stroke(p.color(pool.color + (i === active ? 'd8' : '88')));
        p.strokeWeight(i === active ? 13 : 7);
        p.beginShape();
        for (var y = by; y <= by + bh; y += 10) {
          var weave = Waves.wave(y * 0.013 + i * 0.41, {
            group: pool.group, shift: true, shiftInterval: 3.2 + i * 0.35,
            shiftDuration: 1.1, seed: 1200 + i * 77, t: t * 0.74,
            amplitude: amp, frequency: 0.72,
            mode: pool.key === 'harsh' ? 'wild' : 'stable',
            unpredictability: pool.key === 'harsh' ? 0.3 : 0
          });
          var drift = threads[i].sample(y * 0.01, t) * 34;
          p.vertex(baseX + weave + drift, y);
        }
        p.endShape();
      }
      p.blendMode(p.BLEND);

      p.noStroke();
      p.fill(INK);
      p.textFont('Consolas');
      p.textSize(10);
      p.textAlign(p.LEFT, p.TOP);
      p.text('WARP / ' + POOLS[active].key.toUpperCase() + ' UNDER TENSION', bx + 4, by + 6);
    };

    p.windowResized = function () {
      var s = canvasSize('guide-warp', 0.62, 240, 380);
      p.resizeCanvas(s.width, s.height);
    };
  });

  /* ─── 03 weft passes ────────────────────────────────────────── */
  register('guide-weft', function (p) {
    var motion, pulse, loom;

    p.setup = function () {
      var s = canvasSize('guide-weft', 0.6, 240, 360);
      p.createCanvas(s.width, s.height).parent('guide-weft');
      p.pixelDensity(1);
      p.frameRate(30);
      motion = makeMotion();
      pulse = makePulse();
      loom = makeLoom(18, 13, 800);
    };

    p.draw = function () {
      var t = p.millis() / 1000;
      var active = activeIndex(t);
      var pool = POOLS[active];
      var grid = loom.sample(t);
      var m = 18;
      var bx = m, bw = p.width - m * 2;
      var by = m, bh = p.height - m * 2;
      var rowGap = bh / loom.rows;
      p.background(PAPER);

      p.blendMode(p.MULTIPLY);
      p.strokeCap(p.SQUARE);
      for (var row = 0; row < loom.rows; row++) {
        var y = by + rowGap * (row + 0.5);
        var rowPower = motion.sample(row * 0.13, t) * 14;
        for (var col = 0; col < loom.cols; col++) {
          var on = grid[row * loom.cols + col] === 1;
          if (!on && (row + col) % 3 !== 0) continue;
          var x0 = bx + (col / loom.cols) * bw;
          var x1 = bx + ((col + 0.82) / loom.cols) * bw;
          var pv = pulse.sample((row + col) * 0.08, t);
          p.stroke(on ? p.color(pool.color + 'c8') : p.color(INK + '22'));
          p.strokeWeight(on ? p.map(pv, 0, 1, 2, 7) : 1.2);
          p.line(x0, y + rowPower, x1, y - rowPower * 0.35);
        }
      }
      p.strokeCap(p.ROUND);
      p.blendMode(p.BLEND);

      p.noStroke();
      p.fill(INK);
      p.textFont('Consolas');
      p.textSize(10);
      p.textAlign(p.LEFT, p.TOP);
      p.text('WEFT / SHUTTLE PASS / ' + pool.key.toUpperCase(), bx, 2);
    };

    p.windowResized = function () {
      var s = canvasSize('guide-weft', 0.6, 240, 360);
      p.resizeCanvas(s.width, s.height);
    };
  });

  /* ─── 04 pattern card ───────────────────────────────────────── */
  register('guide-card', function (p) {
    var looms;

    p.setup = function () {
      var s = canvasSize('guide-card', 0.58, 230, 360);
      p.createCanvas(s.width, s.height).parent('guide-card');
      p.pixelDensity(1);
      p.frameRate(30);
      p.textFont('Consolas');
      looms = POOLS.map(function (_, i) { return makeLoom(18, 13, 800 + i * 101); });
    };

    p.draw = function () {
      var t = p.millis() / 1000;
      var active = activeIndex(t);
      var pool = POOLS[active];
      var loom = looms[active];
      var grid = loom.sample(t);
      var m = 22, labelH = 30;
      var x = m, y = m;
      var w = p.width - m * 2, h = p.height - m * 2;
      var cw = w / loom.cols;
      var ch = (h - labelH) / loom.rows;
      p.background(PAPER);

      p.stroke(INK);
      p.strokeWeight(3);
      p.fill(PAPER);
      p.rect(x, y, w, h);
      p.noStroke();
      p.fill(INK);
      p.rect(x, y, w, labelH);
      p.fill(pool.color);
      p.rect(x, y, w * 0.36, labelH);
      p.fill(INK);
      p.textSize(10);
      p.textAlign(p.LEFT, p.CENTER);
      p.text('PATTERN CARD', x + 10, y + labelH * 0.5);
      p.fill(PAPER);
      p.textAlign(p.RIGHT, p.CENTER);
      p.text(pool.key.toUpperCase(), x + w - 10, y + labelH * 0.5);

      for (var row = 0; row < loom.rows; row++) {
        for (var col = 0; col < loom.cols; col++) {
          var on = grid[row * loom.cols + col] === 1;
          var cx = x + col * cw;
          var cy = y + labelH + row * ch;
          p.fill(on ? pool.color : ((row + col) % 2 === 0 ? '#ebe2d5' : PAPER));
          p.rect(cx, cy, Math.max(1, cw - 1), Math.max(1, ch - 1));
        }
      }
    };

    p.windowResized = function () {
      var s = canvasSize('guide-card', 0.58, 230, 360);
      p.resizeCanvas(s.width, s.height);
    };
  });

  /* ─── 05 kinetic title ──────────────────────────────────────── */
  register('guide-title', function (p) {
    var motion, colorS;

    p.setup = function () {
      var s = canvasSize('guide-title', 0.42, 180, 260);
      p.createCanvas(s.width, s.height).parent('guide-title');
      p.pixelDensity(1);
      p.frameRate(30);
      p.textFont('Oswald');
      motion = makeMotion();
      colorS = makeColor();
    };

    p.draw = function () {
      var t = p.millis() / 1000;
      p.background(PAPER);
      p.textStyle(p.BOLD);
      p.textAlign(p.LEFT, p.TOP);
      var label = 'SIGNAL LOOM';
      var size = Math.min(74, p.width * 0.135);
      p.textSize(size);
      var cur = 20;
      for (var i = 0; i < label.length; i++) {
        var ch = label[i];
        if (ch === ' ') { cur += size * 0.28; continue; }
        var lift = motion.sample(i * 0.23, t) * size * 0.06;
        p.fill(i === 7 || i === 8 ? accent(colorS.sample(i * 0.18, t)) : INK);
        p.text(ch, cur, p.height * 0.3 + lift);
        cur += p.textWidth(ch) * 0.98;
      }
      p.textStyle(p.NORMAL);
      p.fill(INK);
      p.textFont('Consolas');
      p.textSize(10);
      p.text('letters lifted by motionSampler; 2 glyphs take a colorSampler accent', 20, p.height - 26);
      p.textFont('Oswald');
    };

    p.windowResized = function () {
      var s = canvasSize('guide-title', 0.42, 180, 260);
      p.resizeCanvas(s.width, s.height);
    };
  });

  /* ─── 06 machine readout ────────────────────────────────────── */
  register('guide-readout', function (p) {
    var threads, pulse;

    p.setup = function () {
      var s = canvasSize('guide-readout', 0.4, 170, 240);
      p.createCanvas(s.width, s.height).parent('guide-readout');
      p.pixelDensity(1);
      p.frameRate(30);
      p.textFont('Consolas');
      threads = makeThreadSamplers(500);
      pulse = makePulse();
    };

    p.draw = function () {
      var t = p.millis() / 1000;
      var active = activeIndex(t);
      var pool = POOLS[active];
      var s = threads[active];
      s.sample(0.42, t);
      var x = 22, y = p.height * 0.4;
      var w = p.width - 44, h = 30;
      var mix = s.shifting ? s.mix : pulse.sample(0.5, t);
      p.background(PAPER);

      p.noStroke();
      p.fill(INK);
      p.rect(x, y, w, h);
      p.fill(pool.color);
      p.rect(x, y, w * p.constrain(mix, 0, 1), h);
      p.fill(mix > 0.55 ? INK : PAPER);
      p.textSize(10);
      p.textAlign(p.LEFT, p.CENTER);
      p.text(('tension ' + pool.key).toUpperCase(), x + 10, y + h * 0.5);
      p.fill(PAPER);
      p.textAlign(p.RIGHT, p.CENTER);
      p.text(((s.waveName || 'wave') + ' -> ' + (s.targetName || s.waveName || 'wave')).toUpperCase(), x + w - 10, y + h * 0.5);

      // shift indicator lamps
      for (var i = 0; i < 6; i++) {
        var lamp = pulse.sample(i * 0.14, t) > 0.45;
        p.fill(lamp ? pool.color : '#d9d0c1');
        p.rect(x + i * 16, y + h + 14, 10, 14);
      }
      p.fill(INK);
      p.textAlign(p.LEFT, p.TOP);
      p.text(s.shifting ? 'STATE / SHIFTING' : 'STATE / HELD', x, 18);
    };

    p.windowResized = function () {
      var s = canvasSize('guide-readout', 0.4, 170, 240);
      p.resizeCanvas(s.width, s.height);
    };
  });

  /* ─── 07 glyph field ────────────────────────────────────────── */
  register('guide-glyphs', function (p) {
    var motion, pulse, glyphs;

    function build() {
      glyphs = [];
      p.randomSeed(16);
      var count = Math.max(20, Math.floor((p.width * p.height) / 13000));
      for (var i = 0; i < count; i++) {
        glyphs.push({
          x: p.random(20, p.width - 20),
          y: p.random(30, p.height - 20),
          seed: i,
          word: p.random(WORDS),
          size: p.random(10, 15)
        });
      }
    }

    p.setup = function () {
      var s = canvasSize('guide-glyphs', 0.56, 220, 340);
      p.createCanvas(s.width, s.height).parent('guide-glyphs');
      p.pixelDensity(1);
      p.frameRate(30);
      p.textFont('Consolas');
      motion = makeMotion();
      pulse = makePulse();
      build();
    };

    p.draw = function () {
      var t = p.millis() / 1000;
      p.background(PAPER);
      p.textAlign(p.CENTER, p.CENTER);
      for (var i = 0; i < glyphs.length; i++) {
        var g = glyphs[i];
        var a = pulse.sample(g.seed * 0.19, t);
        if (a < 0.38) continue;
        var dx = motion.sample(g.seed * 0.11, t) * 22;
        var dy = motion.sample(g.seed * 0.17, t + 2) * 17;
        p.fill(p.color(INK + alphaHex(p.map(a, 0.38, 1, 44, 145))));
        p.textSize(g.size);
        p.text(g.word, g.x + dx, g.y + dy);
      }
      p.textAlign(p.LEFT, p.TOP);
      p.fill(INK);
      p.textSize(10);
      p.text('pulse < 0.38 = hidden this frame', 16, 14);
    };

    p.windowResized = function () {
      var s = canvasSize('guide-glyphs', 0.56, 220, 340);
      p.resizeCanvas(s.width, s.height);
      build();
    };
  });

  /* ─── copy buttons ──────────────────────────────────────────── */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve) {
      var area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', 'readonly');
      area.style.position = 'absolute';
      area.style.left = '-9999px';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
      resolve();
    });
  }

  document.querySelectorAll('.copy-btn').forEach(function (button) {
    button.addEventListener('click', function () {
      var key = button.getAttribute('data-copy');
      var source = document.getElementById('code-' + key);
      var text = source ? source.textContent : '';
      var original = button.textContent;
      copyText(text).then(function () {
        button.textContent = 'Copied';
        button.classList.add('copied');
      }).catch(function () {
        button.textContent = 'Copy failed';
        button.classList.add('copied');
      }).then(function () {
        window.setTimeout(function () {
          button.textContent = original;
          button.classList.remove('copied');
        }, 1400);
      });
    });
  });

  /* ─── chip scrollspy ────────────────────────────────────────── */
  (function () {
    var chips = Array.prototype.slice.call(document.querySelectorAll('.guide-chip'));
    if (!chips.length) return;
    var pairs = chips.map(function (chip) {
      var href = chip.getAttribute('href');
      var el = href && href.charAt(0) === '#' ? document.getElementById(href.slice(1)) : null;
      return el ? { el: el, chip: chip } : null;
    }).filter(Boolean);
    if (!pairs.length) return;

    var ticking = false;
    function update() {
      var trigger = window.innerHeight * 0.3;
      var current = pairs[0];
      for (var i = 0; i < pairs.length; i++) {
        if (pairs[i].el.getBoundingClientRect().top <= trigger) current = pairs[i];
        else break;
      }
      chips.forEach(function (chip) {
        chip.classList.toggle('active', chip === current.chip);
      });
      ticking = false;
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  })();

  /* ─── pause offscreen / reduced motion ──────────────────────── */
  (function () {
    var reduced = typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      registry.forEach(function (inst) {
        if (inst && typeof inst.noLoop === 'function') inst.noLoop();
      });
      return;
    }
    if (typeof IntersectionObserver === 'undefined') return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var inst = registry.get(entry.target.id);
        if (!inst) return;
        if (entry.isIntersecting) inst.loop();
        else inst.noLoop();
      });
    }, { rootMargin: '160px 0px' });
    registry.forEach(function (_, id) {
      var el = document.getElementById(id);
      if (el) observer.observe(el);
    });
  })();
})();
