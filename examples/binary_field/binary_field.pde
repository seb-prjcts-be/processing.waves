// Binary Field
// Two samplers, summed per cell, thresholded into a 2D pattern.
// Both samplers shift independently, so the field's character keeps
// evolving. Sometimes interference, sometimes stripes, sometimes checker.

import waves.*;

final int COLS = 30;
final int ROWS = 20;

Waves.WaveSampler rowS, colS;

void setup() {
  size(460, 460);
  noStroke();
  textFont(createFont("Consolas", 11));

  rowS = Waves.createSampler(new WaveOpts()
    .shift(true)
    .shiftInterval(4)
    .shiftDuration(1)
    .range(-1, 1)
    .seed(1));

  colS = Waves.createSampler(new WaveOpts()
    .shift(true)
    .shiftInterval(4.5f)
    .shiftDuration(1.2f)
    .range(-1, 1)
    .seed(2));
}

void draw() {
  background(245);
  float t = millis() / 1000.0f;
  float labelH = 28;
  float cw = (float)width / COLS;
  float ch = (height - labelH) / ROWS;
  float offset = t * 0.4f;

  for (int row = 0; row < ROWS; row++) {
    float rv = rowS.sample(row * 5 + offset, t);
    for (int col = 0; col < COLS; col++) {
      float cv = colS.sample(col * 2.5f - offset, t);
      boolean on = (rv + cv) > 0;
      fill(on ? 15 : 230);
      rect(col * cw, labelH + row * ch, cw - 0.5f, ch - 0.5f);
    }
  }

  fill(40);
  textSize(11);
  textAlign(LEFT, CENTER);
  text(rowS.waveName() + "  x  " + colS.waveName(), 8, labelH / 2);
}
