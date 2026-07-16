// Ghost Delay
// One 1D wave, read against a delayed copy of itself.
// x = sample(u), y = sample(u + tau): one scalar wave closes into a loop
// ring — its phase portrait. shift morphs the wave, so the loop family
// keeps changing. The strip along the bottom is that one wave; the dots
// are the two read points.

import waves.*;

final int N = 800;

Waves.WaveSampler sampler;

void setup() {
  size(720, 720);
  colorMode(HSB, 360, 100, 100, 100);
  strokeJoin(ROUND);
  textFont(createFont("Consolas", 12));

  // "ghost" is a built-in pool of closing waves that stay clean under this
  // delay. range(-1, 1) gives unit output (the default would be amplitude 100).
  sampler = Waves.createSampler(new WaveOpts()
    .group("ghost")
    .shift(true)
    .range(-1, 1));
}

void draw() {
  background(230, 25, 8);
  noFill();

  float t   = millis() / 1000.0f;
  float hue = (t * 12) % 360;

  float period = sampler.period();                      // ghost waves share one period
  float tau    = period * (0.5f + 0.35f * sin(t * 0.35f));  // the ghost delay, breathing

  // The ring: the wave against its own delayed self.
  float rad = min(width, height) * 0.36f;
  stroke(hue, 55, 100, 90);
  strokeWeight(1.4f);
  pushMatrix();
  translate(width / 2f, height / 2f - 30);
  beginShape();
  for (int i = 0; i <= N; i++) {
    float u = (i / (float)N) * period;                  // one period -> the ring closes
    vertex(sampler.sample(u, t) * rad, sampler.sample(u + tau, t) * rad);
  }
  endShape(CLOSE);
  popMatrix();

  drawWaveStrip(t, tau, hue, period);

  // shift is cycling the ghost pool; name the current wave.
  noStroke();
  fill(0, 0, 70);
  textSize(12);
  text(sampler.waveName(), 18, 26);
}

// The raw 1D wave as a height line, with the two read points (u and u + tau)
// marked. The whole trick is reading this one wave twice.
void drawWaveStrip(float t, float tau, float hue, float period) {
  float baseY = height - 60;
  float w     = width - 120;
  float left  = 60;
  float amp   = 24;

  noFill();
  stroke(hue, 45, 100, 70);
  strokeWeight(1.2f);
  beginShape();
  for (int i = 0; i <= N; i++) {
    float u = (i / (float)N) * period;
    vertex(left + (i / (float)N) * w, baseY - sampler.sample(u, t) * amp);
  }
  endShape();

  noStroke();
  fill(0, 0, 100);
  circle(left, baseY - sampler.sample(0, t) * amp, 7);
  fill(hue, 70, 100);
  circle(left + (tau % period) / period * w, baseY - sampler.sample(tau, t) * amp, 7);
}
