// Static Field
// A wave-driven take on `random(155) + 100`.
// Three slow base samplers set a per-channel floor in [0, 155].
// Three faster field samplers add 0 to 100 on top, per cell.
// Each channel stays inside a moving 100-wide window that drifts and morphs.

import waves.*;

Waves.WaveSampler baseR, baseG, baseB;
Waves.WaveSampler fieldR, fieldG, fieldB;

void setup() {
  size(460, 460);
  noStroke();
  textFont(createFont("Consolas", 11));

  baseR = Waves.createSampler(new WaveOpts()
    .shift(true).group("gentle")
    .range(0, 155).frequency(0.20f)
    .shiftInterval(7).shiftDuration(2));
  baseG = Waves.createSampler(new WaveOpts()
    .shift(true).group("gentle")
    .range(0, 155).frequency(0.17f)
    .shiftInterval(8).shiftDuration(2));
  baseB = Waves.createSampler(new WaveOpts()
    .shift(true).group("gentle")
    .range(0, 155).frequency(0.13f)
    .shiftInterval(9).shiftDuration(2));

  fieldR = Waves.createSampler(new WaveOpts()
    .shift(true)
    .group(new String[]{ "classic sine", "triangle", "bumpy sine", "mountain peaks", "wobble sine" })
    .range(0, 1).frequency(0.08f)
    .shiftInterval(4).shiftDuration(1.5f));
  fieldG = Waves.createSampler(new WaveOpts()
    .shift(true)
    .group(new String[]{ "sine", "triangle", "squared sine", "valleys", "round linked sine" })
    .range(0, 1).frequency(0.06f)
    .shiftInterval(5).shiftDuration(1.5f));
  fieldB = Waves.createSampler(new WaveOpts()
    .shift(true)
    .group(new String[]{ "classic sine", "sharp peaks", "bumpy sine", "half sine", "smooth solid sine" })
    .range(0, 1).frequency(0.07f)
    .shiftInterval(6).shiftDuration(1.5f));
}

void draw() {
  background(245);
  int   cell = 8;
  int   top  = 30;
  float t    = millis() / 1000.0f;

  int r0 = floor(constrain(baseR.sample(0,   t), 0, 155));
  int g0 = floor(constrain(baseG.sample(100, t), 0, 155));
  int b0 = floor(constrain(baseB.sample(200, t), 0, 155));

  for (int y = top; y < height; y += cell) {
    for (int x = 0; x < width; x += cell) {
      float rp = constrain(fieldR.sample(x + y * 0.35f,        t), 0, 1);
      float gp = constrain(fieldG.sample(x * 0.3f + y,         t), 0, 1);
      float bp = constrain(fieldB.sample(x * 0.7f - y * 0.25f, t), 0, 1);

      rp = lerp(rp, random(1), 0.15f);
      gp = lerp(gp, random(1), 0.15f);
      bp = lerp(bp, random(1), 0.15f);

      fill(r0 + rp * 100, g0 + gp * 100, b0 + bp * 100);
      rect(x, y, cell, cell);
    }
  }

  fill(20);
  textSize(11);
  textAlign(LEFT, CENTER);
  text("R " + r0 + "-" + (r0 + 100) +
       "   G " + g0 + "-" + (g0 + 100) +
       "   B " + b0 + "-" + (b0 + 100), 8, 12);
}
