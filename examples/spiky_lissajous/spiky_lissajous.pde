// Spiky Lissajous
// A classic a:b Lissajous curve, but sin() is replaced by a spiky
// wave formula. The pen traces the curve over one frozen-phase cycle,
// then lands exactly back on the start marker — proof that even with
// spikes or sawtooth edges, wave(0) == wave(A * period) for integer A,
// so the path closes.

import waves.*;

final String[] SPIKY_NAMES   = { "sharp peaks", "batman", "zig-zag sine", "up down pulse" };
final float[]  SPIKY_PERIODS = { PI * 10, PI * 20, PI * 10, PI * 10 };
final int[][]  SPIKY_COLORS  = {
  { 70, 220, 130 },
  { 255, 70, 70 },
  { 60, 160, 255 },
  { 250, 220, 40 }
};

final int RATIO_A  = 3;
final int RATIO_B  = 5;
final int SEGMENTS = 1400;
final int CYCLE_MS = 4500;

int waveIdx = 0;
float[] xs = new float[SEGMENTS + 1];
float[] ys = new float[SEGMENTS + 1];
WaveOpts o = new WaveOpts().amplitude(1);

void setup() {
  size(720, 720);
  strokeJoin(ROUND);
  noFill();
  textFont(createFont("Consolas", 12));
}

void draw() {
  background(12);
  translate(width / 2f, height / 2f);

  String name   = SPIKY_NAMES[waveIdx];
  float  period = SPIKY_PERIODS[waveIdx];
  int[]  col    = SPIKY_COLORS[waveIdx];
  float  radius = min(width, height) * 0.34f;

  // Freeze phase for one cycle so the pen draws a genuine closed loop
  // and literally returns to (xs[0], ys[0]) at prog = 1.
  int   cycleId  = millis() / CYCLE_MS;
  float frozenMs = cycleId * (float)CYCLE_MS;
  float phaseX   = frozenMs * 0.00015f;
  float phaseY   = frozenMs * 0.00021f;
  float prog     = (millis() % CYCLE_MS) / (float)CYCLE_MS;
  int   drawnTo  = floor(prog * SEGMENTS);

  o.wave(name);
  for (int i = 0; i <= SEGMENTS; i++) {
    float theta = (i / (float)SEGMENTS) * period;
    xs[i] = radius * Waves.wave(RATIO_A * theta + phaseX * period, o);
    ys[i] = radius * Waves.wave(RATIO_B * theta + phaseY * period + period * 0.25f, o);
  }

  // Dim ghost of the full closed loop — proves the target doesn't move.
  noFill();
  stroke(col[0] * 0.22f, col[1] * 0.22f, col[2] * 0.22f);
  strokeWeight(1);
  beginShape();
  for (int i = 0; i <= SEGMENTS; i++) vertex(xs[i], ys[i]);
  endShape(CLOSE);

  // Bright pen trail up to the current progress.
  stroke(col[0], col[1], col[2]);
  strokeWeight(1.4f);
  beginShape();
  for (int i = 0; i <= drawnTo; i++) vertex(xs[i], ys[i]);
  endShape();

  // Start marker — the "home" the pen must return to.
  float homeR = 12 + sin(prog * TWO_PI) * 1.5f;
  noStroke();
  fill(255); circle(xs[0], ys[0], homeR);
  fill(18);  circle(xs[0], ys[0], homeR - 6);

  // Pen cursor — the moving tip.
  fill(255);
  circle(xs[drawnTo], ys[drawnTo], 8);

  // HUD
  noStroke();
  fill(220);
  textSize(12);
  text(name + "  /  ratio " + RATIO_A + ":" + RATIO_B,
       -width / 2f + 18, -height / 2f + 24);
  fill(120);
  textSize(10);
  text("click to cycle wave  /  the pen returns to the white dot",
       -width / 2f + 18, -height / 2f + 42);
}

void mousePressed() {
  waveIdx = (waveIdx + 1) % SPIKY_NAMES.length;
}
