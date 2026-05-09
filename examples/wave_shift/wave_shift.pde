// Wave Shift
// Filled ribbons that auto-shift between random wave formulas.
// Color flows from red to blue across the strips.

import waves.*;

final int STRIPS = 20;
Waves.WaveSampler sampler;

void setup() {
  size(460, 460);
  noStroke();
  textFont(createFont("Consolas", 11));

  sampler = Waves.createSampler(new WaveOpts()
    .shift(true)
    .amplitude(1)
    .frequency(0.5f));
}

void draw() {
  background(245);
  float t = millis() / 1000.0f;
  float sw = (float)width / STRIPS;
  float cy = height / 2f;
  float rowH = height * 0.42f;

  for (int i = 0; i < STRIPS; i++) {
    float frac = i / (float)(STRIPS - 1);
    float r = 255 * (1 - frac);
    float b = 255 * frac;
    fill(r, 0, b);
    float v = sampler.sample(i * 0.4f, t + i * 0.1f);
    rect(i * sw, cy - v * rowH, sw - 1, v * rowH * 2);
  }

  fill(0);
  textSize(11);
  textAlign(LEFT);
  text(sampler.waveName(), 8, 16);
}
