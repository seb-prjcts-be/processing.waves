import waves.*;

final int PAPER = color(247, 242, 232);
final int INK = color(9, 9, 8);
final int SIGNAL = color(255, 61, 46);
final int DEEP = color(6, 71, 255);
final int LIME = color(199, 255, 45);
final int VIOLET = color(142, 81, 255);
final int AQUA = color(0, 189, 214);
final float TIME_SCALE = 0.9;

String[] curated = {
  "classic sine",
  "mountain peaks",
  "wobble sine",
  "triangle sine",
  "meta sine"
};

Pool[] pools;
Waves.WaveSampler motionSampler;
Waves.WaveSampler pulseSampler;
Waves.WaveSampler colorSampler;
Waves.WaveSampler[] threadSamplers;
LoomGrid[] looms;
Glyph[] glyphs;
String[] stations = { "SOURCE", "TENSION", "SHUTTLE", "PATTERN", "OUTPUT" };
PFont displayFont;
PFont monoFont;

void setup() {
  size(1200, 760);
  smooth(4);
  displayFont = createFont("SansSerif.bold", 64);
  monoFont = createFont("Monospaced", 12);
  textFont(displayFont);
  rebuildSystem();
}

void rebuildSystem() {
  pools = new Pool[] {
    new Pool("gentle", "gentle", DEEP),
    new Pool("harsh", "harsh", SIGNAL),
    new Pool("all", "all", AQUA),
    new Pool("curated", curated, VIOLET)
  };

  motionSampler = Waves.createSampler(new WaveOpts()
    .group("gentle")
    .shift(true)
    .shiftInterval(5.4f)
    .shiftDuration(1.25f)
    .range(-1, 1)
    .frequency(0.72f)
    .seed(110));

  pulseSampler = Waves.createSampler(new WaveOpts()
    .group("harsh")
    .shift(true)
    .shiftInterval(3.6f)
    .shiftDuration(0.9f)
    .range(0, 1)
    .frequency(1.18f)
    .mode("wild")
    .unpredictability(0.28f)
    .seed(220));

  colorSampler = Waves.createSampler(new WaveOpts()
    .group("all")
    .shift(true)
    .shiftInterval(6.2f)
    .shiftDuration(1.5f)
    .range(0, 1)
    .frequency(0.54f)
    .seed(330));

  threadSamplers = new Waves.WaveSampler[pools.length];
  looms = new LoomGrid[pools.length];
  for (int i = 0; i < pools.length; i++) {
    threadSamplers[i] = Waves.createSampler(new WaveOpts()
      .group(pools[i].group)
      .shift(true)
      .shiftInterval(3.8f + i * 0.45f)
      .shiftDuration(1.1f)
      .range(-1, 1)
      .frequency(0.5f + i * 0.08f)
      .mode(i == 1 ? "wild" : "stable")
      .unpredictability(i == 1 ? 0.33f : 0f)
      .seed(500 + i * 61));
    looms[i] = new LoomGrid(18, 13, pools[i].group, 800 + i * 101, i);
  }

  buildGlyphs();
}

void buildGlyphs() {
  randomSeed(16);
  String[] words = { "warp", "weft", "tension", "shuttle", "pattern", "phase", "morph", "output" };
  int count = constrain(floor((width * height) / 21000.0), 28, 82);
  glyphs = new Glyph[count];
  for (int i = 0; i < count; i++) {
    glyphs[i] = new Glyph(random(width), random(height), i, words[(int)random(words.length)], random(10, 15));
  }
}

void draw() {
  float t = millis() / 1000.0 * TIME_SCALE;
  background(PAPER);
  drawBackplane(t);
  drawLoomFrame(t);
  drawWarpThreads(t);
  drawWeftPasses(t);
  drawPatternCard(t);
  drawGlyphField(t);
  drawTitle(t);
  drawMachineReadout(t);
  drawTicker(t);
  drawGrain();
}

int activeIndex(float t) {
  return floor(t / 5.2) % pools.length;
}

int accent(float v) {
  int[] colors = { SIGNAL, DEEP, LIME, VIOLET, AQUA };
  return colors[constrain(floor(v * colors.length), 0, colors.length - 1)];
}

void drawBackplane(float t) {
  noStroke();
  blendMode(MULTIPLY);
  int columns = width < 760 ? 6 : 9;
  float cw = width / (float)columns;
  for (int i = 0; i < columns; i++) {
    float v = colorSampler.sample(i * 0.21, t * 0.8);
    fill(accent(v), 48);
    rect(i * cw, 0, cw * map(v, 0, 1, 0.35, 0.95), height);
  }
  blendMode(BLEND);
}

float[] loomBounds() {
  float m = max(18, min(width, height) * 0.05);
  float top = width < 760 ? height * 0.32 : height * 0.3;
  float bottom = height - (width < 760 ? 190 : 148);
  float rightPanelW = width < 900 ? 0 : min(340, width * 0.29);
  float x = m;
  float w = width < 900 ? width - m * 2 : width - m * 3 - rightPanelW;
  return new float[] { x, top, w, max(180, bottom - top) };
}

float[] panelBounds() {
  float m = max(18, min(width, height) * 0.05);
  float[] loom = loomBounds();
  float w = width < 900 ? min(width - m * 2, 420) : min(340, width * 0.29);
  float h = width < 900 ? 108 : min(245, height * 0.32);
  float x = width < 900 ? m : loom[0] + loom[2] + m;
  float y = width < 900 ? height - 166 : loom[1] + 10;
  return new float[] { x, y, w, h };
}

void drawLoomFrame(float t) {
  float[] b = loomBounds();
  int active = activeIndex(t);
  Pool pool = pools[active];

  stroke(INK);
  strokeWeight(3);
  fill(PAPER, 210);
  rect(b[0] - 10, b[1] - 14, b[2] + 20, b[3] + 28);

  noStroke();
  fill(pool.col, 34);
  rect(b[0], b[1], b[2], b[3]);

  stroke(INK, 136);
  strokeWeight(2);
  line(b[0], b[1], b[0] + b[2], b[1]);
  line(b[0], b[1] + b[3], b[0] + b[2], b[1] + b[3]);

  noStroke();
  textFont(monoFont);
  textAlign(LEFT, CENTER);
  textSize(10);
  fill(INK);
  text("LIVE LOOM / SIGNALS BECOME PATTERN", b[0], b[1] - 28);

  for (int i = 0; i < stations.length; i++) {
    float sx = map(i, 0, stations.length - 1, b[0] + 8, b[0] + b[2] - 70);
    float v = pulseSampler.sample(i * 0.27, t);
    fill(i == active ? pool.col : INK);
    rect(sx, b[1] + b[3] + 18, 58, 18);
    fill(i == active && v > 0.45 ? INK : PAPER);
    textAlign(CENTER, CENTER);
    textSize(8.5);
    text(stations[i], sx + 29, b[1] + b[3] + 27);
  }
}

void drawWarpThreads(float t) {
  int active = activeIndex(t);
  float[] b = loomBounds();
  blendMode(MULTIPLY);
  noFill();
  for (int i = 0; i < pools.length; i++) {
    Pool pool = pools[i];
    Waves.WaveSampler sampler = threadSamplers[i];
    float baseX = map(i, 0, pools.length - 1, b[0] + b[2] * 0.16, b[0] + b[2] * 0.84);
    float amp = b[2] * (i == active ? 0.125 : 0.07);
    stroke(pool.col, i == active ? 218 : 138);
    strokeWeight(i == active ? 13 : 7);
    beginShape();
    for (float y = b[1]; y <= b[1] + b[3]; y += 10) {
      float local = y * 0.013 + i * 0.41;
      float weave = Waves.wave(local, new WaveOpts()
        .group(pool.group)
        .shift(true)
        .shiftInterval(3.2f + i * 0.35f)
        .shiftDuration(1.1f)
        .seed(1200 + i * 77)
        .t(t * 0.74f)
        .amplitude(amp)
        .frequency(0.72f)
        .mode(i == 1 ? "wild" : "stable")
        .unpredictability(i == 1 ? 0.3f : 0f));
      float drift = sampler.sample(y * 0.01, t) * 34;
      vertex(baseX + weave + drift, y);
    }
    endShape();
  }
  blendMode(BLEND);
}

void drawWeftPasses(float t) {
  int active = activeIndex(t);
  Pool pool = pools[active];
  int[] grid = looms[active].sample(t);
  float[] b = loomBounds();
  int rows = looms[active].rows;
  int cols = looms[active].cols;
  float rowGap = b[3] / rows;

  blendMode(MULTIPLY);
  strokeCap(SQUARE);
  for (int row = 0; row < rows; row++) {
    float y = b[1] + rowGap * (row + 0.5);
    float rowPower = motionSampler.sample(row * 0.13, t) * 15;
    for (int col = 0; col < cols; col++) {
      boolean on = grid[row * cols + col] == 1;
      if (!on && (row + col) % 3 != 0) continue;
      float x0 = b[0] + (col / (float)cols) * b[2];
      float x1 = b[0] + ((col + 0.82) / (float)cols) * b[2];
      float pulse = pulseSampler.sample((row + col) * 0.08, t);
      stroke(on ? pool.col : INK, on ? 200 : 34);
      strokeWeight(on ? map(pulse, 0, 1, 2, 7) : 1.2);
      line(x0, y + rowPower, x1, y - rowPower * 0.35);
    }
  }
  strokeCap(ROUND);
  blendMode(BLEND);
}

void drawPatternCard(float t) {
  int active = activeIndex(t);
  Pool pool = pools[active];
  int[] grid = looms[active].sample(t);
  float[] p = panelBounds();
  int cols = looms[active].cols;
  int rows = looms[active].rows;
  float labelH = 34;
  float cw = p[2] / cols;
  float ch = (p[3] - labelH) / rows;

  stroke(INK);
  strokeWeight(3);
  fill(PAPER);
  rect(p[0], p[1], p[2], p[3]);

  noStroke();
  fill(INK);
  rect(p[0], p[1], p[2], labelH);
  fill(pool.col);
  rect(p[0], p[1], p[2] * 0.36, labelH);

  textFont(monoFont);
  fill(INK);
  textAlign(LEFT, TOP);
  textSize(10);
  text("PATTERN CARD", p[0] + 10, p[1] + 12);
  fill(PAPER);
  textAlign(RIGHT, TOP);
  text(pool.key.toUpperCase(), p[0] + p[2] - 10, p[1] + 12);

  for (int row = 0; row < rows; row++) {
    for (int col = 0; col < cols; col++) {
      boolean on = grid[row * cols + col] == 1;
      float x = p[0] + col * cw;
      float y = p[1] + labelH + row * ch;
      fill(on ? pool.col : ((row + col) % 2 == 0 ? color(235, 226, 213) : PAPER));
      rect(x, y, max(1, cw - 1), max(1, ch - 1));
    }
  }

  fill(INK);
  textAlign(LEFT, TOP);
  textSize(9);
  text("smooth solid rows + ramp columns", p[0], p[1] + p[3] + 10);
}

void drawGlyphField(float t) {
  textFont(monoFont);
  textAlign(CENTER, CENTER);
  for (Glyph g : glyphs) {
    float p = pulseSampler.sample(g.seed * 0.19, t);
    if (p < 0.38) continue;
    float dx = motionSampler.sample(g.seed * 0.11, t) * 22;
    float dy = motionSampler.sample(g.seed * 0.17, t + 2) * 17;
    fill(INK, map(p, 0.38, 1, 44, 145));
    textSize(g.size);
    text(g.word, g.x + dx, g.y + dy);
  }
}

void drawTitle(float t) {
  float m = max(18, min(width, height) * 0.05);
  float x = m;
  float[] panel = panelBounds();
  float maxW = width < 900 ? width - m * 2 : max(360, panel[0] - x - 24);
  float size = fitSize("SIGNAL LOOM", maxW, width < 760 ? 54 : 92, 28);
  float y = width < 760 ? height * 0.14 : height * 0.105;

  textFont(displayFont);
  textAlign(LEFT, TOP);
  textSize(size);
  float cursor = x;
  String label = "SIGNAL LOOM";
  for (int i = 0; i < label.length(); i++) {
    char ch = label.charAt(i);
    if (ch == ' ') {
      cursor += size * 0.28;
      continue;
    }
    float lift = motionSampler.sample(i * 0.23, t) * size * 0.055;
    fill(i == 7 || i == 8 ? accent(colorSampler.sample(i * 0.18, t)) : INK);
    text(ch, cursor, y + lift);
    cursor += textWidth(ch) * 0.98;
  }

  textFont(monoFont);
  textSize(width < 760 ? 13 : 16);
  fill(INK);
  text("a live loom for wave signals: source, tension, shuttle, pattern, output", x, y + size * 1.08);
}

float fitSize(String str, float maxW, float maxSize, float minSize) {
  float s = maxSize;
  textSize(s);
  while (s > minSize && textWidth(str) > maxW) {
    s -= 2;
    textSize(s);
  }
  return s;
}

void drawMachineReadout(float t) {
  int active = activeIndex(t);
  Pool pool = pools[active];
  Waves.WaveSampler sampler = threadSamplers[active];
  sampler.sample(0.42, t);
  float[] p = panelBounds();
  float[] b = loomBounds();
  float x = width < 900 ? b[0] : p[0];
  float y = width < 900 ? b[1] + b[3] + 48 : p[1] + p[3] + 42;
  float w = width < 900 ? min(b[2], 520) : p[2];
  float h = 34;
  float mix = sampler.shifting() ? sampler.mix() : pulseSampler.sample(0.5, t);

  noStroke();
  fill(INK);
  rect(x, y, w, h);
  fill(pool.col);
  rect(x, y, w * constrain(mix, 0, 1), h);
  fill(mix > 0.55 ? INK : PAPER);
  textFont(monoFont);
  textAlign(LEFT, CENTER);
  textSize(11);
  text(("tension " + pool.key).toUpperCase(), x + 12, y + h * 0.5);
  fill(PAPER);
  textAlign(RIGHT, CENTER);
  text((shortName(sampler.waveName()) + " -> " + shortName(sampler.targetName())).toUpperCase(), x + w - 12, y + h * 0.5);
}

void drawTicker(float t) {
  float h = 34;
  float y = height - h;
  String copy = "SOURCE -> TENSION -> SHUTTLE -> PATTERN -> OUTPUT / P5 LOOM / PROCESSING LOOM / WAVES.WAVE / CREATESAMPLER / MIX / PHASE / SHIFT / ";
  fill(INK);
  rect(0, y, width, h);
  fill(PAPER);
  textFont(monoFont);
  textAlign(LEFT, CENTER);
  textSize(12);
  float tw = textWidth(copy);
  float x = -((t * 72) % tw);
  while (x < width + tw) {
    text(copy, x, y + h * 0.5);
    x += tw;
  }
}

String shortName(String name) {
  if (name == null || name.length() == 0) return "wave";
  return name.length() > 14 ? name.substring(0, 12) + ".." : name;
}

void drawGrain() {
  randomSeed(8);
  stroke(INK, 21);
  strokeWeight(1);
  int amount = constrain(floor((width * height) / 7000.0), 80, 260);
  for (int i = 0; i < amount; i++) {
    point(random(width), random(height));
  }
  noStroke();
}

void drawWrappedText(String str, float x, float y, float maxW, float leading, int maxLines) {
  String[] words = split(str, ' ');
  String line = "";
  float cy = y;
  int lines = 0;

  for (int i = 0; i < words.length; i++) {
    String test = line.length() > 0 ? line + " " + words[i] : words[i];
    if (textWidth(test) > maxW && line.length() > 0) {
      text(line, x, cy);
      lines++;
      if (lines >= maxLines) return;
      line = words[i];
      cy += leading;
    } else {
      line = test;
    }
  }

  if (line.length() > 0 && lines < maxLines) text(line, x, cy);
}

void keyPressed() {
  if (key == 'r' || key == 'R' || key == ' ') {
    rebuildSystem();
  }
  if (key == 's' || key == 'S') {
    saveFrame("signal-loom-####.png");
  }
}

class Pool {
  String key;
  Object group;
  int col;

  Pool(String key, Object group, int col) {
    this.key = key;
    this.group = group;
    this.col = col;
  }
}

class Glyph {
  float x;
  float y;
  int seed;
  String word;
  float size;

  Glyph(float x, float y, int seed, String word, float size) {
    this.x = x;
    this.y = y;
    this.seed = seed;
    this.word = word;
    this.size = size;
  }
}

class LoomGrid {
  int cols;
  int rows;
  int offset;
  Waves.WaveSampler rowS;
  Waves.WaveSampler colS;

  LoomGrid(int cols, int rows, Object group, int seed, int offset) {
    this.cols = cols;
    this.rows = rows;
    this.offset = offset;
    rowS = Waves.createSampler(new WaveOpts()
      .wave("smooth solid sine")
      .range(-1, 1)
      .seed(seed));
    colS = Waves.createSampler(new WaveOpts()
      .wave("ramp up sine")
      .range(-1, 1)
      .seed(seed + 37));
  }

  int[] sample(float t) {
    int[] cells = new int[cols * rows];
    for (int row = 0; row < rows; row++) {
      float rv = rowS.sample(row * 5 + t);
      for (int col = 0; col < cols; col++) {
        float cv = colS.sample(col * 2.5 - t);
        cells[row * cols + col] = rv + cv > 0 ? 1 : 0;
      }
    }
    return cells;
  }
}
