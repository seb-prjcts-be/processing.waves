// Wild Mode
// Grid of circles: left half stable, right half wild.
// mouseX controls unpredictability — drag to feel the chaos build.

import waves.*;

final int COLS = 20;
final int ROWS = 14;

float t = 0;
int wildWave;
WaveOpts stableOpts, wildOpts;

void setup() {
  size(460, 460);
  noStroke();
  textFont(createFont("Consolas", 10));
  textAlign(CENTER);
  wildWave = (int)random(Waves.count());

  float cw = (float)width / COLS;
  float ch = (height - 24) / (float)ROWS;
  float maxR = min(cw, ch) * 0.44f;

  stableOpts = new WaveOpts().wave(wildWave).range(3, maxR);
  wildOpts   = new WaveOpts().wave(wildWave).range(3, maxR).mode("wild");
}

void draw() {
  background(238);
  t += 0.012f;
  float cw = (float)width / COLS;
  float ch = (height - 24) / (float)ROWS;
  int half = COLS / 2;
  float unpred = constrain(map(mouseX, 0, width, 0, 1), 0, 1);

  stableOpts.t(t);
  wildOpts.t(t).unpredictability(unpred);

  fill(0);
  for (int row = 0; row < ROWS; row++) {
    for (int col = 0; col < COLS; col++) {
      float cx = (col + 0.5f) * cw;
      float cy = (row + 0.5f) * ch;
      float coord = col * 0.15f + row * 0.3f;
      WaveOpts o = (col < half) ? stableOpts : wildOpts;
      float sz = Waves.wave(coord, o);
      circle(cx, cy, sz * 2);
    }
  }

  stroke(0, 30);
  strokeWeight(1);
  line(width / 2f, 0, width / 2f, height - 24);
  noStroke();
  fill(0);
  textSize(10);
  text("stable", width / 4f, height - 6);
  text("wild  " + nf(unpred, 1, 2), 3 * width / 4f, height - 6);
}
