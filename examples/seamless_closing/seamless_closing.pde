// Seamless Closing
// A ring sampled with shift normally tears its seam open the moment it
// lands on a new wave — every formula has its own period. The "closing"
// pool fixes that: all 17 waves in it share one base period, so a sweep
// of ring.period() * LOBES closes through every morph. The loop keeps
// changing shape and never shows a seam.

import waves.*;

final int LOBES = 6;     // base-period repeats around the ring
final int SEGS  = 3000;  // dense enough for the shortest closing wave

Waves.WaveSampler ring;
float t = 0;

void setup() {
  size(600, 600);
  strokeJoin(ROUND);
  textFont(createFont("Consolas", 12));

  ring = Waves.createSampler(new WaveOpts()
    .shift(true)
    .shiftInterval(3)
    .shiftDuration(1.4f)
    .group("closing")
    .amplitude(1));
}

void draw() {
  background(12);
  translate(width / 2f, height / 2f);

  t += 0.02;

  // ring.period() comes straight from the library: 62.8319 for the
  // closing pool — stable through every shift. You never type it.
  float sweep  = ring.period() * LOBES;
  float radius = width * 0.28f;
  float wobble = width * 0.10f;

  // Cyan at rest, warming to pink mid-morph.
  color cold = color(60, 200, 255);
  color warm = color(255, 80, 120);
  stroke(lerpColor(cold, warm, ring.mix()));
  strokeWeight(1.6f);
  noFill();

  beginShape();
  for (int i = 0; i < SEGS; i++) {
    float frac  = i / (float)SEGS;
    float angle = frac * TWO_PI;
    float r     = radius + ring.sample(frac * sweep, t) * wobble;
    vertex(cos(angle) * r, sin(angle) * r);
  }
  endShape(CLOSE);

  // HUD
  noStroke();
  fill(220);
  textSize(12);
  text(ring.waveName() + (ring.shifting() ? "  to  " + ring.targetName() : ""),
       -width / 2f + 18, -height / 2f + 24);
}
