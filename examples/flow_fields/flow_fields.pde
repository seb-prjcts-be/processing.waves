// Flow Fields
// A grid of ASCII characters forms a flow field.
// Each cell's direction comes from waves. Like noise, but with structure.
// The wave formula shifts automatically every few seconds.

import waves.*;

final int COLS = 30;
final int ROWS = 30;
final String[] DIRS = { "-", "/", "|", "\\" };

Waves.WaveSampler sampler;

void setup() {
  size(460, 460);
  textFont(createFont("Consolas", 14));
  textAlign(CENTER, CENTER);
  noStroke();
  fill(0);

  sampler = Waves.createSampler(new WaveOpts()
    .shift(true)
    .shiftInterval(4)
    .shiftDuration(2)
    .frequency(2)
    .range(-1, 1));
}

void draw() {
  background(255);
  float t = millis() / 1000.0f;
  float sz = (float)width / COLS;
  textSize(sz * 0.9f);

  for (int row = 0; row < ROWS; row++) {
    for (int col = 0; col < COLS; col++) {
      float val = sampler.sample(col * 0.5f, t + row * 0.4f);
      int idx = constrain((int)map(val, -1, 1.001f, 0, 4), 0, 3);
      text(DIRS[idx], col * sz + sz / 2, row * sz + sz / 2);
    }
  }
}
