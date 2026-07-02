// Shape Parameters
// mouseX = frequency, mouseY = amplitude.
// Wave formula shifts automatically.
// Drag to feel what each parameter does.

import waves.*;

final int LINE_COUNT = 8;

Waves.WaveSampler shiftSampler;
WaveOpts o;
float t = 0;

void setup() {
  size(460, 460);
  textFont(createFont("Consolas", 10));

  // Only used to get shifting wave names
  shiftSampler = Waves.createSampler(new WaveOpts()
    .shift(true)
    .shiftInterval(4)
    .shiftDuration(1.5f)
    .seed(42));

  o = new WaveOpts();
}

void draw() {
  background(245);
  t += 0.015f;

  // Mouse drives parameters
  float freq = constrain(map(mouseX, 0, width, 0.15f, 3.5f), 0.15f, 3.5f);
  float amp  = constrain(map(mouseY, 0, height, 120, 8), 8, 120);

  // Ping the sampler to keep shift state updated
  shiftSampler.sample(0, t);
  String waveName = shiftSampler.waveName();

  // Draw layered lines — each offset in phase for depth
  for (int i = 0; i < LINE_COUNT; i++) {
    float progress = i / (float)(LINE_COUNT - 1);
    float phase    = i * 0.7f;
    float lineAmp  = amp * (1 - progress * 0.5f);
    float gray     = lerp(0, 200, progress);
    float weight   = lerp(2.5f, 0.8f, progress);

    stroke(gray);
    strokeWeight(weight);
    noFill();
    o.wave(waveName)
     .t(t)
     .amplitude(lineAmp)
     .frequency(freq * 0.01f)
     .phase(phase);
    beginShape();
    for (int x = 0; x <= width; x += 3) {
      float val = Waves.wave(x, o);
      vertex(x, height / 2f + val);
    }
    endShape();
  }

  // Labels
  noStroke();
  fill(0);
  textSize(10);
  textAlign(LEFT, TOP);
  text(waveName, 8, 8);

  textAlign(LEFT, BOTTOM);
  text("frequency: " + nf(freq, 1, 2), 8, height - 8);

  textAlign(RIGHT, BOTTOM);
  text("amplitude: " + round(amp), width - 8, height - 8);

  // Crosshair
  stroke(0, 20);
  strokeWeight(0.5f);
  line(mouseX, 0, mouseX, height);
  line(0, mouseY, width, mouseY);
}
