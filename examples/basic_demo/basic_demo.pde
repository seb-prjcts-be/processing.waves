// basic_demo
// 5-mode tour of processing.waves.
// Press 1..5 to switch demo. Press SPACE to reseed.

import waves.*;

int demoMode = 1;
int seed = 42;

Waves.WaveSampler shiftSamp;
Waves.WaveSampler morphSamp;
Waves.WaveSampler walkerX, walkerY;
float walkerPx, walkerPy;

void setup() {
  size(900, 500);
  rebuild();
}

void rebuild() {
  shiftSamp = Waves.createSampler(new WaveOpts()
    .shift(true)
    .seed(seed)
    .amplitude(150)
    .frequency(1)
    .shiftInterval(2.5f)
    .shiftDuration(1.0f));

  morphSamp = Waves.createSampler(new WaveOpts()
    .wave("classic sine", "mountain peaks")
    .seed(seed)
    .amplitude(150));

  walkerX = Waves.createSampler(new WaveOpts()
    .shift(true).group("gentle")
    .amplitude(5).frequency(0.4f).seed(seed));
  walkerY = Waves.createSampler(new WaveOpts()
    .shift(true).group("gentle")
    .amplitude(5).frequency(0.3f).seed(seed + 77));
  walkerPx = width / 2f;
  walkerPy = height / 2f;
}

void draw() {
  if (demoMode != 5) background(20);

  float t = millis() / 1000.0f;

  switch (demoMode) {
    case 1: drawAllWaves(t);     break;
    case 2: drawShift(t);        break;
    case 3: drawMorph(t);        break;
    case 4: drawWild(t);         break;
    case 5: drawWalker(t);       break;
  }
  drawHud();
}

// 1) Each of the 34 waves drawn as its own row
void drawAllWaves(float t) {
  int n = Waves.count();
  float rowH = (float)height / n;
  stroke(255); noFill();
  for (int i = 0; i < n; i++) {
    float yMid = rowH * (i + 0.5f);
    WaveOpts o = new WaveOpts()
      .wave(Waves.WAVES[i].name)
      .t(t)
      .amplitude(rowH * 0.4f);
    beginShape();
    for (int x = 0; x < width; x += 2) {
      float yv = Waves.wave(x, o);
      vertex(x, yMid + yv);
    }
    endShape();
    fill(180); noStroke();
    textSize(9);
    text(Waves.WAVES[i].name, 6, yMid + 3);
    noFill(); stroke(255);
  }
}

// 2) One sampler with shift on
void drawShift(float t) {
  stroke(255, 80, 200); noFill(); strokeWeight(1.5f);
  beginShape();
  for (int x = 0; x < width; x += 2) {
    float yv = shiftSamp.sample(x, t);
    vertex(x, height/2f + yv);
  }
  endShape();
  strokeWeight(1);
  fill(220); noStroke();
  textSize(12);
  text("now: " + shiftSamp.waveName() +
       (shiftSamp.shifting() ? "  ->  " + shiftSamp.targetName()
                              + "   mix=" + nf(shiftSamp.mix(), 0, 2) : ""),
       12, height - 12);
}

// 3) Morph between two waves, mix swept by mouseX
void drawMorph(float t) {
  float mix = constrain(mouseX / (float)width, 0, 1);
  stroke(255, 220, 80); noFill();
  beginShape();
  for (int x = 0; x < width; x += 2) {
    float yv = morphSamp.sampleMorph(x, t, mix);
    vertex(x, height/2f + yv);
  }
  endShape();
  fill(220); noStroke();
  textSize(12);
  text("morph mix = " + nf(mix, 0, 2) + "   (move mouse)", 12, height - 12);
}

// 4) Wild mode, unpredictability swept by mouseX
void drawWild(float t) {
  float u = constrain(mouseX / (float)width, 0, 1);
  WaveOpts o = new WaveOpts()
    .wave("classic sine")
    .seed(seed)
    .amplitude(150)
    .t(t)
    .mode("wild")
    .unpredictability(u);
  stroke(120, 220, 255); noFill();
  beginShape();
  for (int x = 0; x < width; x += 2) {
    float yv = Waves.wave(x, o);
    vertex(x, height/2f + yv);
  }
  endShape();
  fill(220); noStroke();
  textSize(12);
  text("unpredictability = " + nf(u, 0, 2) + "   (move mouse)", 12, height - 12);
}

// 5) Wave-as-velocity walker: trail emerges from sampler output
void drawWalker(float t) {
  noFill();
  stroke(0, 30); rect(-1, -1, width+2, height+2);
  walkerPx += walkerX.sample(t * 1.8f, t);
  walkerPy += walkerY.sample(t * 2.1f, t);
  if (walkerPx < 0) walkerPx = width;
  if (walkerPx > width) walkerPx = 0;
  if (walkerPy < 0) walkerPy = height;
  if (walkerPy > height) walkerPy = 0;
  stroke(255, 200, 100);
  point(walkerPx, walkerPy);
}

void drawHud() {
  fill(255); noStroke();
  textSize(11);
  text("[1] all waves   [2] shift   [3] morph   [4] wild   [5] walker   [SPACE] reseed   seed=" + seed,
       12, 16);
}

void keyPressed() {
  if (key >= '1' && key <= '5') demoMode = key - '0';
  if (key == ' ') { seed = (int)random(100000); rebuild(); }
}
