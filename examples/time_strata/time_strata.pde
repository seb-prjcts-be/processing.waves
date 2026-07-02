// Time Strata
// Time is a plain number — full manual control.
// Mouse X scrubs a time window; each layer is frozen at its own t.
// Layers are filled ribbons with HSB color, creating geological strata.

import waves.*;

final int   LAYERS      = 16;
final float WAVE_WINDOW = 6;

WaveOpts top, bottom;

void setup() {
  size(460, 460);
  colorMode(HSB, 360, 100, 100, 255);
  textFont(createFont("Consolas", 10));
  top    = new WaveOpts().wave("classic sine").amplitude(25);
  bottom = new WaveOpts().wave("classic sine").amplitude(15);
}

void draw() {
  background(0, 0, 96);
  float timeBase = map(mouseX, 0, width, 0, 24);

  noStroke();
  for (int i = LAYERS - 1; i >= 0; i--) {
    float layerT   = timeBase + (i / (float)LAYERS) * WAVE_WINDOW;
    float y0       = map(i, 0, LAYERS - 1, 50, height - 50);
    float wHue     = (i * 22) % 360;
    float alphaVal = map(i, 0, LAYERS - 1, 200, 60);
    float freq     = 0.6f + i * 0.08f;

    fill(wHue, 70, 85, alphaVal);
    top.t(layerT).frequency(freq);
    bottom.t(layerT + 0.3f).frequency(freq);

    beginShape();
    for (int x = 0; x <= width; x += 3) {
      float dy = Waves.wave(x * 0.15f, top);
      vertex(x, y0 + dy);
    }
    for (int x2 = width; x2 >= 0; x2 -= 3) {
      float dy2 = Waves.wave(x2 * 0.15f, bottom);
      vertex(x2, y0 + dy2 + 22);
    }
    endShape(CLOSE);
  }

  // time cursor label
  fill(0);
  noStroke();
  textSize(10);
  textAlign(LEFT);
  text("t = " + nf(timeBase, 1, 2), 12, 20);
  text("move mouse", 12, 34);
}
