// 3D Wave Volume (P3D)
// 16x16 grid with 3 shift-samplers - one per axis.
// Every axis breathes independently, creating a living 3D volume.
// Drag to rotate by hand; the volume also turns on its own.

import waves.*;

final int   N       = 16;
final float SPACING = 22;
final float HALF    = (N - 1) * SPACING / 2;

Waves.WaveSampler samplerY, samplerX, samplerZ;
float rotAngle = 0;
float tilt     = -0.5f;

void setup() {
  size(460, 460, P3D);
  frameRate(30);
  noFill();
  strokeWeight(4);

  // Three desynchronised shift-samplers - each axis has its own wave life
  samplerY = Waves.createSampler(new WaveOpts()
    .shift(true).shiftInterval(3).shiftDuration(1.5f)
    .range(-6, 6).frequency(0.4f).seed(0));

  samplerX = Waves.createSampler(new WaveOpts()
    .shift(true).shiftInterval(4).shiftDuration(1.2f)
    .range(-3, 3).frequency(0.3f).seed(42));

  samplerZ = Waves.createSampler(new WaveOpts()
    .shift(true).shiftInterval(5).shiftDuration(1)
    .range(-3, 3).frequency(0.35f).seed(77));
}

void draw() {
  background(12);
  translate(width / 2f, height / 2f);
  rotateX(tilt);
  rotAngle += 0.005f;
  rotateY(rotAngle);

  float t = millis() / 1000.0f;

  beginShape(POINTS);
  for (int xi = 0; xi < N; xi++) {
    for (int zi = 0; zi < N; zi++) {
      // Y: main surface displacement - full range across the cube
      float dy = samplerY.sample(xi * 0.9f + zi * 0.6f, t);

      // X: horizontal breathing - points drift sideways
      float dx = samplerX.sample(zi * 0.8f + xi * 0.3f, t * 0.85f);

      // Z: depth warping - grid pulses in and out
      float dz = samplerZ.sample(xi * 0.7f + zi * 0.5f, t * 0.7f);

      // Map dy to a grid row and spread points around the surface
      float surfaceRow = N / 2f + dy;
      float thick = 2.5f;

      for (int yi = 0; yi < N; yi++) {
        float gap = abs(yi - surfaceRow);
        if (gap < thick) {
          float glow   = 1 - gap / thick;
          int   bright = round(80 + (yi / (float)(N - 1)) * 175);
          stroke(bright, bright, 255, 255 * glow);
          vertex(
            -HALF + xi * SPACING + dx * SPACING * 0.4f,
            -HALF + yi * SPACING,
            -HALF + zi * SPACING + dz * SPACING * 0.4f
          );
        }
      }
    }
  }
  endShape();
}

// Drag to rotate the volume by hand
void mouseDragged() {
  rotAngle += (mouseX - pmouseX) * 0.01f;
  tilt     += (mouseY - pmouseY) * 0.01f;
}
