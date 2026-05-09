// Not So Random Walker
// No angles, no steps. Wave output IS the velocity.
// Five trails ride two shift-samplers as raw displacement.
// When formulas shift, movement character transforms entirely.

import waves.*;

final int WALKERS = 5;
Waves.WaveSampler xWave, yWave;
float[] wx = new float[WALKERS], wy = new float[WALKERS];
float[] prevX = new float[WALKERS], prevY = new float[WALKERS];
float t = 0;
PGraphics trail;

// R, G, B, yellow, purple
final int[][] palette = {
  {255, 60, 60},
  {60, 220, 60},
  {60, 100, 255},
  {255, 220, 40},
  {180, 60, 255}
};

void setup() {
  size(460, 460);
  trail = createGraphics(460, 460);
  trail.beginDraw();
  trail.background(15);
  trail.endDraw();

  xWave = Waves.createSampler(new WaveOpts()
    .shift(true)
    .shiftInterval(4)
    .shiftDuration(1.5f)
    .amplitude(2.5f)
    .frequency(0.7f)
    .seed(0));

  yWave = Waves.createSampler(new WaveOpts()
    .shift(true)
    .shiftInterval(5)
    .shiftDuration(1.2f)
    .amplitude(2.5f)
    .frequency(0.55f)
    .seed(77));

  for (int i = 0; i < WALKERS; i++) {
    float a = TWO_PI * i / WALKERS;
    wx[i] = width / 2f + cos(a) * 40;
    wy[i] = height / 2f + sin(a) * 40;
    prevX[i] = wx[i];
    prevY[i] = wy[i];
  }
}

void draw() {
  trail.beginDraw();
  trail.noStroke();
  trail.fill(15, 15, 15, 8);
  trail.rect(0, 0, trail.width, trail.height);

  t += 0.025f;

  for (int i = 0; i < WALKERS; i++) {
    float phase = i * 6.7f;

    float vx = xWave.sample(t * 1.8f + phase, t);
    float vy = yWave.sample(t * 2.1f + phase * 1.3f, t);

    prevX[i] = wx[i];
    prevY[i] = wy[i];

    wx[i] += vx;
    wy[i] += vy;

    if (wx[i] < 0)      wx[i] += width;
    if (wx[i] > width)  wx[i] -= width;
    if (wy[i] < 0)      wy[i] += height;
    if (wy[i] > height) wy[i] -= height;

    if (abs(wx[i] - prevX[i]) > width / 2)  continue;
    if (abs(wy[i] - prevY[i]) > height / 2) continue;

    int[] col = palette[i];
    trail.stroke(col[0], col[1], col[2], 200);
    trail.strokeWeight(2.5f);
    trail.line(prevX[i], prevY[i], wx[i], wy[i]);
  }
  trail.endDraw();

  image(trail, 0, 0);

  noStroke();
  fill(255, 255, 255, 120);
  textSize(10);
  textFont(createFont("Consolas", 10));
  textAlign(LEFT);
  text(xWave.waveName() + " x " + yWave.waveName(), 8, 16);
}
