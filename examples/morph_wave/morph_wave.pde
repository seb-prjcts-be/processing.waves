// Morph Wave
// A field of horizontal lines where each row blends two wave formulas.
// Top rows = pure waveA. Bottom rows = pure waveB. Middle = the morph.
// The blend sweeps up and down over time, you see the shape transform.

import waves.*;

final String WAVE_A = "wobble sine";
final String WAVE_B = "meta sine";
final int ROW_COUNT = 50;
float t = 0;

void setup() {
  size(460, 460);
}

void draw() {
  background(250);
  t += 0.0375f;

  float centre = (sin(t * 0.3f) + 1) * 0.5f;
  float rowH = (float)height / ROW_COUNT;

  for (int row = 0; row < ROW_COUNT; row++) {
    float rowFrac = row / (float)(ROW_COUNT - 1);
    float gap = abs(rowFrac - centre);
    float morphMix = constrain(1 - gap * 3, 0, 1);
    float yBase = row * rowH + rowH * 0.5f;

    float r = lerp(0, 255, morphMix);
    float b = lerp(255, 0, morphMix);

    noFill();
    stroke(r, 0, b);
    strokeWeight(1.2f + morphMix * 1.8f);
    beginShape();
    WaveOpts o = new WaveOpts()
      .wave(WAVE_A, WAVE_B)
      .mix(morphMix)
      .t(t + row * 0.06f)
      .frequency(0.08f)
      .amplitude(rowH * 2.5f);
    for (int x = 0; x < width; x += 3) {
      float waveY = Waves.wave(x, o);
      vertex(x, yBase + constrain(waveY, -rowH * 0.7f, rowH * 0.7f));
    }
    endShape();
  }

  noStroke();
  fill(0, 0, 255);
  textSize(10);
  textFont(createFont("Consolas", 10));
  textAlign(LEFT);
  text(WAVE_A, 8, 16);
  fill(255, 0, 0);
  textAlign(RIGHT);
  text(WAVE_B, width - 8, height - 8);
}
