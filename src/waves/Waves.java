package waves;

import java.util.HashMap;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Locale;

/**
 * Java/Processing port of p5.waves v3.6.0 (tracks upstream main).
 * 35 wave shapes. Pass a number in, get a number back.
 *
 * Public API returns float (Processing convention) but all internal math runs
 * in double for parity with the JS reference (JS Numbers are 64-bit doubles).
 *
 * <pre>
 *   import waves.*;
 *
 *   float v = Waves.wave(x);                       // a wave, picked once
 *   float v = Waves.wave(x, "classic sine");
 *   float v = Waves.wave(x, new WaveOpts()
 *                            .wave("mountain peaks")
 *                            .seed(42)
 *                            .amplitude(80)
 *                            .t(millis() / 1000.0f));
 *
 *   WaveSampler s = Waves.createSampler(new WaveOpts()
 *                                         .shift(true)
 *                                         .group("gentle"));
 *   float v = s.sample(x, t);
 * </pre>
 */
public class Waves {

  // ----- Wave function interface -----
  public interface WaveFn {
    double eval(double x, double t, EvalCtx ctx);
  }

  public static class WaveDef {
    public final String name, algo, character;
    public final WaveFn fn;
    public final Float period;
    public WaveDef(String name, String algo, WaveFn fn, String character, Float period) {
      this.name = name; this.algo = algo; this.fn = fn;
      this.character = character; this.period = period;
    }
  }

  // ----- Registry: all 35 waves in v3.6.0 order -----
  // Order matters: pickWaveIndex(seed) returns floor(rng * 35), so the same seed
  // must select the same wave between JS and Java.
  //
  // 'harsh' = breaks rhythm: tan/random/noise-driven, or otherwise not-calm
  // (unbounded/Inf, or erratic accelerating rhythm). 'gentle' = calm and
  // bounded, including sharp-but-periodic (square, pulse) and steady
  // non-periodic waves (ramp up sine, triangle sine, meta sine).
  public static final WaveDef[] WAVES = new WaveDef[] {
    new WaveDef("classic sine",      "sin(x*.1)*.4",
      (x, t, c) -> Math.sin(x*0.1) * 0.4,                                  "gentle", 62.8319f),
    new WaveDef("sine",              "sin(x*.2)*.25",
      (x, t, c) -> Math.sin(x*0.2) * 0.25,                                 "gentle", 31.4159f),
    new WaveDef("sharp peaks",       "abs(sin(x*.1))*.5",
      (x, t, c) -> Math.abs(Math.sin(x*0.1)) * 0.5,                        "gentle", 31.4159f),
    new WaveDef("square",            "(x*.025)%1 < .5 ? -.5 : .5",
      (x, t, c) -> ((x*0.025) % 1.0) < 0.5 ? -0.5 : 0.5,                   "gentle", 40.0f),
    new WaveDef("pulse",             "(x*.5)%20 < 1 ? -.5 : .5",
      (x, t, c) -> ((x*0.5) % 20.0) < 1.0 ? -0.5 : 0.5,                    "gentle", 40.0f),
    new WaveDef("stepped sine",      "ceil(sin(x*.1))*.25",
      (x, t, c) -> Math.ceil(Math.sin(x*0.1)) * 0.25,                      "gentle", 62.8319f),
    new WaveDef("mountain peaks",    "abs(cos(x*.1))*.35 + sin(x*.1)*.25",
      (x, t, c) -> Math.abs(Math.cos(x*0.1))*0.35 + Math.sin(x*0.1)*0.25,  "gentle", 62.8319f),
    new WaveDef("valleys",           "abs(cos(x*.1))*-.35 + sin(x*.1)*.25",
      (x, t, c) -> Math.abs(Math.cos(x*0.1))*-0.35 + Math.sin(x*0.1)*0.25, "gentle", 62.8319f),
    new WaveDef("zig-zag sine",      "sin(x*.2)*.4 % .12",
      (x, t, c) -> (Math.sin(x*0.2) * 0.4) % 0.12,                         "gentle", 31.4159f),
    new WaveDef("batman",            "sin(x*.1)*.7 % .4",
      (x, t, c) -> (Math.sin(x*0.1) * 0.7) % 0.4,                          "gentle", 62.8319f),
    new WaveDef("offset sine",       "ceil(cos(x*.1))*.25 - sin(x*.1)*.25",
      (x, t, c) -> Math.ceil(Math.cos(x*0.1))*0.25 - Math.sin(x*0.1)*0.25, "gentle", 62.8319f),
    new WaveDef("steps down",        "ceil(tan(x*.1))*.25",
      (x, t, c) -> Math.ceil(Math.tan(x*0.1)) * 0.25,                      "harsh", 31.4159f),
    new WaveDef("steps",             "round(sin(-x*.1))*.25",
      (x, t, c) -> Math.round(Math.sin(-x*0.1)) * 0.25,                    "gentle", 62.8319f),
    new WaveDef("squared sine",      "sq(sin(x*.1))*.25",
      (x, t, c) -> { double s = Math.sin(x*0.1); return s*s*0.25; },       "gentle", 31.4159f),
    new WaveDef("bumpy sine",        "sin(x*.1)*.25 + sin(x*.5)*.1",
      (x, t, c) -> Math.sin(x*0.1)*0.25 + Math.sin(x*0.5)*0.1,             "gentle", 62.8319f),
    new WaveDef("wobble sine",       "sin(x*.1)*cos(x*.2)*.5",
      (x, t, c) -> Math.sin(x*0.1) * Math.cos(x*0.2) * 0.5,                "gentle", 62.8319f),
    new WaveDef("up down noise",     "x*sin(x*.1) % .5",
      (x, t, c) -> (x * Math.sin(x*0.1)) % 0.5,                            "harsh", null),
    new WaveDef("meta sine",         "sin(x*.45 + radians(x))*cos(x*.4)*.5",
      (x, t, c) -> Math.sin(x*0.45 + Math.toRadians(x)) * Math.cos(x*0.4) * 0.5, "gentle", null),
    new WaveDef("triangle",          "abs((x*.03) % (.5*2) - .5)",
      (x, t, c) -> Math.abs(((x*0.03) % 1.0) - 0.5),                       "gentle", 33.3333f),
    new WaveDef("ramp",              "-1*(x*.02%1)/1 + 0.5",
      (x, t, c) -> -1.0 * ((x*0.02) % 1.0) + 0.5,                          "gentle", 50.0f),
    new WaveDef("saw down",          "x*.03 % .5",
      (x, t, c) -> (x*0.03) % 0.5,                                         "gentle", 16.6667f),
    new WaveDef("saw up",            "-x*.03 % .5",
      (x, t, c) -> (-x*0.03) % 0.5,                                        "gentle", 16.6667f),
    new WaveDef("shake out",         "sin(log(sq(min(abs(x)%62.8319,62.8319-abs(x)%62.8319))+1)*3)*.5",
      (x, t, c) -> {
        double m = Math.abs(x) % 62.8319;
        m = Math.min(m, 62.8319 - m);
        return Math.sin(Math.log(m*m + 1.0) * 3.0) * 0.5;
      }, "gentle", 62.8319f),                    // mirrored log chirp - palindrome over 2pi/0.1
    new WaveDef("grow random",       "random(x*.003)",
      (x, t, c) -> c.randomMax(x*0.003),                                   "harsh", null),
    new WaveDef("noise",             "noise(x*.1) - .5",
      (x, t, c) -> c.noise(x*0.1) - 0.5,                                   "harsh", null),
    new WaveDef("fuzzy pulse",       "tan(x*20)*.05",
      (x, t, c) -> Math.tan(x*20.0) * 0.05,                                "harsh", 17.75f),
    new WaveDef("up down pulse",     "tan(x*.1)*.05",
      (x, t, c) -> Math.tan(x*0.1) * 0.05,                                 "harsh", 31.4159f),
    new WaveDef("bald patch",        "sq(x*.05) % .5",
      (x, t, c) -> ((x*0.05) * (x*0.05)) % 0.5,                            "harsh", null),
    new WaveDef("fuzzy peak sine",   "sin(x*.1) < 0 ? random(-.2, .2) : sin(x*.1)*.5",
      (x, t, c) -> {
        double s = Math.sin(x*0.1);
        return s < 0 ? c.randomRange(-0.2, 0.2) : s * 0.5;
      }, "harsh", null),
    new WaveDef("ramp up sine",      "sin(x)*(x*.01%.5)",
      (x, t, c) -> Math.sin(x) * ((x*0.01) % 0.5),                         "gentle", null),
    new WaveDef("triangle sine",     "sin(x)*(x*.01%1-.5)",
      (x, t, c) -> Math.sin(x) * ((x*0.01) % 1 - 0.5),                     "gentle", null),
    new WaveDef("round linked sine", "sin(x*.1)*cos(x*1)*.5",
      (x, t, c) -> Math.sin(x*0.1) * Math.cos(x) * 0.5,                    "gentle", 62.8319f),
    new WaveDef("half sine",         "sin(x*.05)*(x*.1%.5)",
      (x, t, c) -> Math.sin(x*0.05) * ((x*0.1) % 0.5),                     "harsh", null),
    new WaveDef("smooth solid sine", "sin(x*3.1)*.25",
      (x, t, c) -> Math.sin(x*3.1) * 0.25,                                 "gentle", 2.0268f),
    new WaveDef("spike sine",        "sq(sq(sin(x*.1)))*sin(x*.1)*.5",
      (x, t, c) -> {
        double s = Math.sin(x*0.1), s2 = s*s;
        return s2*s2 * s * 0.5;
      }, "gentle", 62.8319f),                    // odd sin^5 preserves full period
  };

  // ----- Pools -----
  static final List<Integer> GENTLE_INDICES  = new ArrayList<Integer>();
  static final List<Integer> HARSH_INDICES   = new ArrayList<Integer>();
  static final List<Integer> CLOSING_INDICES = new ArrayList<Integer>();
  static final List<Integer> GHOST_INDICES   = new ArrayList<Integer>();
  static final float CLOSING_BASE_PERIOD = 62.8319f;
  static final float CLOSING_RATIO_TOL   = 0.001f;

  // 'ghost' pool = a hand-picked subset of the closing waves that read well
  // under the ghost-delay embedding (see examples/ghost_delay): plot one wave
  // against a delayed copy of itself and it closes into a loop ring. Every
  // member closes over CLOSING_BASE_PERIOD and gives a clean loop, from a plain
  // ellipse (wobble sine) up to dense rosettes (mountain peaks, valleys). The
  // tan-based closing waves blow up under that pairing and the very-short-period
  // ones tangle, so they are left out. Aesthetic selection — discover membership
  // at runtime via the group, do not hardcode this list in consumer code.
  static final String[] GHOST_NAMES = {
    "wobble sine", "bumpy sine", "batman", "round linked sine",
    "mountain peaks", "valleys"
  };

  static {
    for (int i = 0; i < WAVES.length; i++) {
      if ("harsh".equals(WAVES[i].character)) HARSH_INDICES.add(i);
      else GENTLE_INDICES.add(i);
      Float p = WAVES[i].period;
      if (p != null) {
        float ratio = CLOSING_BASE_PERIOD / p;
        if (Math.abs(ratio - Math.round(ratio)) < CLOSING_RATIO_TOL) {
          CLOSING_INDICES.add(i);
        }
      }
    }
    for (int i = 0; i < GHOST_NAMES.length; i++) {
      for (int j = 0; j < WAVES.length; j++) {
        if (WAVES[j].name.equals(GHOST_NAMES[i])) { GHOST_INDICES.add(j); break; }
      }
    }
  }

  // ----- Caches -----
  static final Map<String, Stats> STATS_CACHE = new HashMap<String, Stats>();

  // Stable per session, different each run
  static final int waveShiftEntropy = (int)(Math.random() * 100000);

  // ----- Math helpers (double for parity with JS Number) -----
  static double clamp(double v, double lo, double hi) { return v < lo ? lo : (v > hi ? hi : v); }
  static double lerp(double a, double b, double t)    { return a + (b - a) * t; }
  static double fade(double t)                        { return t * t * t * (t * (t * 6 - 15) + 10); }
  static double toNumber(double v, double fallback) {
    return Double.isFinite(v) ? v : fallback;
  }
  static double toUnit(double v) { return toUnit(v, 0); }
  static double toUnit(double v, double fallback) {
    return clamp(toNumber(v, fallback), 0, 1);
  }
  static String normalizeMode(String mode) {
    return mode != null && "wild".equals(mode.trim().toLowerCase(Locale.ROOT))
      ? "wild" : "stable";
  }
  static double[] readRange(float[] range) {
    return range != null && range.length >= 2
      ? new double[]{toNumber(range[0], -1), toNumber(range[1], 1)} : null;
  }

  // Match createSampler's captured options: later builder changes must not
  // partially change a sampler whose waves, seeds and stats are already cached.
  static WaveOpts snapshotOptions(WaveOpts source) {
    WaveOpts src = source == null ? new WaveOpts() : source;
    WaveOpts copy = new WaveOpts();
    copy.wave = src.wave instanceof Object[] ? ((Object[])src.wave).clone() : src.wave;
    copy.seed = src.seed;
    copy.t = (float)toNumber(src.t, 0);
    copy.amplitude = (float)toNumber(src.amplitude, 100);
    copy.frequency = (float)toNumber(src.frequency, 1);
    copy.phase = (float)toNumber(src.phase, 0);
    copy.mode = normalizeMode(src.mode);
    copy.unpredictability = (float)toUnit(src.unpredictability);
    copy.range = src.range == null ? null : src.range.clone();
    copy.mix = (float)toUnit(src.mix, 0.5);
    copy.shift = src.shift;
    copy.shiftInterval = (float)toNumber(src.shiftInterval, 3);
    copy.shiftDuration = (float)toNumber(src.shiftDuration, 1);
    copy.group = src.group instanceof Object[] ? ((Object[])src.group).clone() : src.group;
    return copy;
  }

  static double evaluate(WaveFn fn, double x, double t, long seed, EvalCtx ctx) {
    ctx.reset(seed, x);
    double value = fn.eval(x, t, ctx);
    return Double.isFinite(value) ? value : 0;
  }

  // ----- Seeding (FNV-1a 32-bit, returns unsigned uint32 as long) -----
  // Storing as long matches JS where the seed is unsigned uint32 stored as
  // Number (double). Operations on the seed in float math then match JS bit
  // for bit, which is critical for noise and random determinism.
  static long seedFrom(Object value) {
    String str = value == null ? "0" : value.toString();
    int h = 0x811c9dc5;
    for (int i = 0; i < str.length(); i++) {
      h ^= str.charAt(i);
      h *= 16777619;
    }
    return h & 0xFFFFFFFFL;
  }

  static class Mulberry32 {
    int state;
    Mulberry32(int seed) { this.state = seed; }
    double next() {
      state += 0x6D2B79F5;
      int t = state;
      t = (t ^ (t >>> 15)) * (t | 1);
      t ^= t + (t ^ (t >>> 7)) * (t | 61);
      int r = t ^ (t >>> 14);
      return (r & 0xFFFFFFFFL) / 4294967296.0;
    }
  }

  // ----- Lookup -----
  static int wrapIndex(int i) {
    int len = WAVES.length;
    return ((i % len) + len) % len;
  }

  static int pickWaveIndex(Object seedValue) {
    Mulberry32 rng = new Mulberry32((int)seedFrom(seedValue));
    return (int)(rng.next() * WAVES.length);
  }

  static int pickWaveIndexIn(Object seedValue, List<Integer> pool) {
    if (pool == null || pool.isEmpty()) return pickWaveIndex(seedValue);
    Mulberry32 rng = new Mulberry32((int)seedFrom(seedValue));
    return pool.get((int)(rng.next() * pool.size()));
  }

  static int nextDifferentInPool(int curIdx, List<Integer> pool) {
    if (pool == null || pool.isEmpty()) return (curIdx + 1) % WAVES.length;
    if (pool.size() == 1) return pool.get(0);
    int i = pool.indexOf(curIdx);
    if (i < 0) return pool.get(0);
    return pool.get((i + 1) % pool.size());
  }

  // ----- Shift selection: per-cycle permutation (upstream main, v3.4.0+) -----
  // A naive per-era random draw clusters (coupon-collector): some waves repeat,
  // others never appear in a session. Instead, shuffle the pool once per full
  // cycle of L eras (Fisher-Yates seeded by base + cycle) and read it position
  // by position. Every wave shows exactly once per L eras, still pseudo-random
  // per session, still a pure function of era. Decks are memoised so the
  // per-pixel stateless wave() path stays O(1) amortised.
  static List<Integer> _allIndices = null;
  static List<Integer> allIndices() {
    if (_allIndices == null) {
      List<Integer> a = new ArrayList<Integer>();
      for (int i = 0; i < WAVES.length; i++) a.add(i);
      _allIndices = a;
    }
    return _allIndices;
  }

  // Deck cache: compare (cycle, pool ref, base string) directly so the hot
  // per-pixel path never builds a composite key or hashes on a hit. Named
  // groups ('gentle'/'harsh'/'closing') resolve to a stable list reference,
  // so the pool == identity check holds across calls.
  static final String[] _deckBase  = new String[4];
  static final int[]    _deckCycle = new int[4];
  static final Object[] _deckPool  = new Object[4];
  static final int[][]  _deckVals  = new int[4][];
  static int _deckPtr = 0, _deckFill = 0;

  static int[] shuffledDeck(String seedBase, int cycle, List<Integer> pool) {
    for (int i = 0; i < _deckFill; i++) {
      if (_deckCycle[i] == cycle && _deckPool[i] == pool && seedBase.equals(_deckBase[i])) {
        return _deckVals[i];
      }
    }
    List<Integer> src = (pool != null && !pool.isEmpty()) ? pool : allIndices();
    int[] deck = new int[src.size()];
    for (int i = 0; i < deck.length; i++) deck[i] = src.get(i);
    Mulberry32 rng = new Mulberry32((int)seedFrom(seedBase + "." + cycle));
    for (int i = deck.length - 1; i > 0; i--) {
      int j = (int)(rng.next() * (i + 1));
      int tmp = deck[i]; deck[i] = deck[j]; deck[j] = tmp;
    }
    _deckBase[_deckPtr]  = seedBase;
    _deckCycle[_deckPtr] = cycle;
    _deckPool[_deckPtr]  = pool;
    _deckVals[_deckPtr]  = deck;
    _deckPtr = (_deckPtr + 1) & 3;
    if (_deckFill < 4) _deckFill++;
    return deck;
  }

  // Drop-in for pickWaveIndexIn(base + "." + era, pool) on the shift path.
  static int pickWaveIndexForEra(String seedBase, int era, List<Integer> pool) {
    List<Integer> src = (pool != null && !pool.isEmpty()) ? pool : allIndices();
    int L = src.size();
    if (L <= 1) return src.get(0);
    int cycle = Math.floorDiv(era, L);
    int pos   = era - cycle * L;
    return shuffledDeck(seedBase, cycle, pool)[pos];
  }

  static int findWaveByName(String name) {
    String key = name == null ? "" : name.trim().toLowerCase();
    String keyC = key.replaceAll("[^a-z0-9]", "");
    for (int i = 0; i < WAVES.length; i++) {
      String n = WAVES[i].name.toLowerCase();
      if (n.equals(key)) return i;
      if (n.replaceAll("[^a-z0-9]", "").equals(keyC)) return i;
    }
    return -1;
  }

  static int resolveWave(Object ref) {
    if (ref == null) return -1;
    if (ref instanceof Number) return wrapIndex(((Number)ref).intValue());
    if (ref instanceof String) return findWaveByName((String)ref);
    return -1;
  }

  static List<Integer> resolveGroup(Object opt) {
    if (opt == null) return null;
    if (opt instanceof String) {
      String k = ((String)opt).trim().toLowerCase();
      if (k.isEmpty() || k.equals("all")) return null;
      if (k.equals("gentle"))  return GENTLE_INDICES;
      if (k.equals("harsh"))   return HARSH_INDICES;
      if (k.equals("closing")) return CLOSING_INDICES;
      if (k.equals("ghost"))   return GHOST_INDICES;
      return null;
    }
    if (opt instanceof Object[]) {
      List<Integer> pool = new ArrayList<Integer>();
      for (Object o : (Object[])opt) {
        int r = resolveWave(o);
        if (r >= 0) pool.add(r);
      }
      return pool.isEmpty() ? null : pool;
    }
    return null;
  }

  // ----- Deterministic random / noise (replaces JS p5 random/noise inside formulas) -----
  // hash01 mimics JS's `(n * 127.1 + 311.7) | 0` via (int)(long)... which
  // truncates toward zero AND wraps mod 2^32, matching JS's ToInt32 spec.
  static double hash01(double n) {
    int h = (int)(long)(n * 127.1 + 311.7);
    h = (h << 13) ^ h;
    h = h * (h * h * 15731 + 789221) + 1376312589;
    return (h & 0x7fffffff) / (double)0x7fffffff;
  }
  static double rand01(long seed, double x, int i) {
    return hash01(seed * 0.001 + x * 0.017 + i * 0.131);
  }
  static double noise1D(double x, long seed) {
    if (Double.isNaN(x) || Double.isInfinite(x)) return 0;
    long xi = (long)Math.floor(x);
    double xf = x - xi;
    double sOff = seed * 0.07;
    double v0 = hash01(xi     + sOff);
    double v1 = hash01(xi + 1 + sOff);
    return lerp(v0, v1, fade(xf));
  }
  static double noiseSigned(double x, long seed) { return noise1D(x, seed) * 2 - 1; }

  /** Deterministic random/noise injection point for wave formulas. */
  public static class EvalCtx {
    long seed;
    double x;
    int calls;
    void reset(long seed, double x) { this.seed = seed; this.x = x; this.calls = 0; }
    public double random()              { return rand01(seed, x, calls++); }
    // JS _evalRandom(arg): treats single arg as max with min=0, then swaps if max<min.
    // Negative arg lands in [arg, 0] but with the slope sign reversed vs r * arg.
    public double randomMax(double arg) {
      double r = rand01(seed, x, calls++);
      double mn = 0, mx = arg;
      if (mx < mn) { double tmp = mx; mx = mn; mn = tmp; }
      return mn + r * (mx - mn);
    }
    public double randomRange(double a, double b) {
      double r = rand01(seed, x, calls++);
      double mn = a, mx = b;
      if (mx < mn) { double tmp = mx; mx = mn; mn = tmp; }
      return mn + r * (mx - mn);
    }
    public double noise(double n) { return noise1D(n, seed); }
  }

  public static class Stats {
    public final double min, max;
    Stats(double mn, double mx) { min = mn; max = mx; }
  }

  static final double[] STATS_DOMAIN  = new double[]{ -200, 200 };
  static final int     STATS_SAMPLES  = 1024;

  static Stats getStats(int waveIndex, long internalSeed) {
    String key = waveIndex + "|" + internalSeed;
    Stats cached = STATS_CACHE.get(key);
    if (cached != null) return cached;

    WaveFn fn = WAVES[waveIndex].fn;
    EvalCtx ctx = new EvalCtx();
    double mn = Double.POSITIVE_INFINITY, mx = Double.NEGATIVE_INFINITY;
    for (int i = 0; i < STATS_SAMPLES; i++) {
      double x = lerp(STATS_DOMAIN[0], STATS_DOMAIN[1], i / (double)(STATS_SAMPLES - 1));
      ctx.reset(internalSeed, x);
      double v = fn.eval(x, 0, ctx);
      if (!Double.isFinite(v)) v = 0;
      if (v < mn) mn = v;
      if (v > mx) mx = v;
    }
    if (!Double.isFinite(mn) || !Double.isFinite(mx) || mn == mx) { mn = -1; mx = 1; }
    Stats s = new Stats(mn, mx);
    STATS_CACHE.put(key, s);
    return s;
  }

  static double mapToRange(double v, Stats s, double[] range) {
    if (s.min == s.max) return (range[0] + range[1]) * 0.5;
    double t = (v - s.min) / (s.max - s.min);
    return range[0] + t * (range[1] - range[0]);
  }
  static double normalizeVal(double raw, Stats s) {
    if (s.min == s.max) return 0;
    double n = (raw - s.min) / (s.max - s.min) * 2 - 1;
    return n < -1 ? -1 : (n > 1 ? 1 : n);
  }

  // ----- Wild mode -----
  // Note: JS uses `seed + 17` etc. on unsigned uint32 stored as Number (double).
  // We use long math to match: int wrap would diverge if seed + offset crosses 2^32.
  static double evaluateWild(WaveFn fn, double x, double t, long seed, double u, EvalCtx ctx) {
    double freqScale = 1 + noiseSigned(x * 0.17, seed + 17) * u * 0.7;
    if (freqScale < 0.05) freqScale = 0.05;
    double phaseNoise = noiseSigned(x * 0.09, seed + 29) * u * 0.75;
    double ampNoise   = 1 + noiseSigned(x * 0.23, seed + 41) * u * 0.45;
    if (ampNoise < 0.05) ampNoise = 0.05;
    double wildMix = u * 0.25;
    double evalX   = x * freqScale + phaseNoise;
    ctx.reset(seed, evalX);
    double val = fn.eval(evalX, t, ctx);
    // JS clamps non-finite inside evaluate(), i.e. before the lerp below.
    // Clamping after it would feed NaN into lerp and diverge from the reference.
    if (!Double.isFinite(val)) val = 0;
    if (wildMix > 0) {
      double carrier = noiseSigned(evalX * 0.97 + seed * 0.0001, seed + 101);
      val = lerp(val, carrier, wildMix);
    }
    return val * ampNoise;
  }

  // ----- Shared eval kernel -----
  static double evalKernel(WaveFn fn, double y, double t, double frequency,
                           double phase, long seed, String mode, double u, EvalCtx ctx) {
    double x = (toNumber(y, 0) + toNumber(t, 0)) * frequency + phase;
    if ("wild".equals(mode) && u > 0) return evaluateWild(fn, x, t, seed, u, ctx);
    return evaluate(fn, x, t, seed, ctx);
  }

  // ============================================================
  // Public API: wave()
  // ============================================================

  public static float wave(float y) {
    int idx = pickWaveIndex(0);
    long iSeed = seedFrom(0);
    EvalCtx ctx = new EvalCtx();
    double raw = evaluate(WAVES[idx].fn, toNumber(y, 0), 0, iSeed, ctx);
    return (float)(normalizeVal(raw, getStats(idx, iSeed)) * 100.0);
  }

  public static float wave(float y, int seed) {
    long iSeed = seedFrom(seed);
    int idx    = pickWaveIndex(seed);
    EvalCtx ctx = new EvalCtx();
    double raw = evaluate(WAVES[idx].fn, toNumber(y, 0), 0, iSeed, ctx);
    return (float)(normalizeVal(raw, getStats(idx, iSeed)) * 100.0);
  }

  public static float wave(float y, String name) {
    int r = resolveWave(name);
    int idx = r >= 0 ? r : pickWaveIndex(0);
    long iSeed = seedFrom(0);
    EvalCtx ctx = new EvalCtx();
    double raw = evaluate(WAVES[idx].fn, toNumber(y, 0), 0, iSeed, ctx);
    return (float)(normalizeVal(raw, getStats(idx, iSeed)) * 100.0);
  }

  public static float wave(float y, WaveOpts o) {
    if (o == null) return wave(y);
    int seed = o.seed;
    double t = toNumber(o.t, 0), amplitude = toNumber(o.amplitude, 100);
    double frequency = toNumber(o.frequency, 1), phase = toNumber(o.phase, 0);
    String mode = normalizeMode(o.mode);
    double u = toUnit(o.unpredictability);
    double[] range = readRange(o.range);
    boolean shift = o.shift;
    double shiftInterval = Math.max(0, toNumber(o.shiftInterval, 3));
    double shiftDuration = Math.max(1e-6, toNumber(o.shiftDuration, 1));
    List<Integer> pool = resolveGroup(o.group);
    long internalSeed = seedFrom(seed);
    EvalCtx ctx = new EvalCtx();

    if (shift) {
      double cycleDur = shiftInterval + shiftDuration;
      int era      = (int)Math.floor(t / cycleDur);
      double progress = t - era * cycleDur;
      String shiftBase = seed + "." + waveShiftEntropy;
      int userIdx = o.wave != null ? resolveWave(o.wave) : -1;
      int idxA = (era == 0 && userIdx >= 0) ? userIdx
        : pickWaveIndexForEra(shiftBase, era, pool);
      WaveFn fnA = WAVES[idxA].fn;
      double valA = evalKernel(fnA, y, t, frequency, phase, internalSeed, mode, u, ctx);

      if (progress >= shiftInterval) {
        // Mirror the sampler's pickForEra: the next wave is always era+1's
        // deck pick; only era 0 honours a user-supplied wave (via idxA above).
        int idxB = pickWaveIndexForEra(shiftBase, era + 1, pool);
        if (idxB == idxA) idxB = nextDifferentInPool(idxA, pool);
        double valB = evalKernel(WAVES[idxB].fn, y, t, frequency, phase, internalSeed, mode, u, ctx);
        double m = clamp((progress - shiftInterval) / shiftDuration, 0, 1);
        m = m * m * (3 - 2 * m);
        if (range != null) {
          double nA = mapToRange(valA, getStats(idxA, internalSeed), range);
          double nB = mapToRange(valB, getStats(idxB, internalSeed), range);
          return (float)(nA + (nB - nA) * m);
        }
        double nA = normalizeVal(valA, getStats(idxA, internalSeed));
        double nB = normalizeVal(valB, getStats(idxB, internalSeed));
        return (float)((nA + (nB - nA) * m) * amplitude);
      }
      if (range != null) return (float)mapToRange(valA, getStats(idxA, internalSeed), range);
      return (float)(normalizeVal(valA, getStats(idxA, internalSeed)) * amplitude);
    }

    if (o.wave instanceof Object[]) {
      Object[] arr = (Object[]) o.wave;
      double mix = toUnit(o.mix, 0.5);
      int rA = arr.length > 0 ? resolveWave(arr[0]) : -1;
      int rB = arr.length > 1 ? resolveWave(arr[1]) : rA;
      int idxA = rA >= 0 ? rA : pickWaveIndexIn(seed, pool);
      int idxB = rB >= 0 ? rB : pickWaveIndexIn(seed, pool);
      double valA = evalKernel(WAVES[idxA].fn, y, t, frequency, phase, internalSeed, mode, u, ctx);
      double valB = evalKernel(WAVES[idxB].fn, y, t, frequency, phase, internalSeed, mode, u, ctx);
      if (range != null) {
        double a = mapToRange(valA, getStats(idxA, internalSeed), range);
        double b = mapToRange(valB, getStats(idxB, internalSeed), range);
        return (float)(a + (b - a) * mix);
      }
      double nA = normalizeVal(valA, getStats(idxA, internalSeed));
      double nB = normalizeVal(valB, getStats(idxB, internalSeed));
      return (float)((nA + (nB - nA) * mix) * amplitude);
    }

    int waveIndex;
    if (o.wave != null) {
      int r = resolveWave(o.wave);
      waveIndex = r >= 0 ? r : pickWaveIndexIn(seed, pool);
    } else {
      waveIndex = pickWaveIndexIn(seed, pool);
    }
    double val = evalKernel(WAVES[waveIndex].fn, y, t, frequency, phase, internalSeed, mode, u, ctx);
    Stats s = getStats(waveIndex, internalSeed);
    if (range != null) return (float)mapToRange(val, s, range);
    return (float)(normalizeVal(val, s) * amplitude);
  }

  // ============================================================
  // Public API: createSampler()
  // ============================================================

  public static WaveSampler createSampler(WaveOpts o) {
    return new WaveSampler(o);
  }

  public static class WaveSampler {
    final WaveOpts o;
    final long internalSeed;
    final List<Integer> pool;
    final boolean isMorph;
    final double mixDefault;
    final EvalCtx ctx = new EvalCtx();
    final boolean isClosingPool;
    final double[] range;

    int waveIndexA;
    int waveIndexB = -1;
    WaveFn fn, fnB;
    Stats statsA, statsB;

    final boolean shift;
    final double shiftInt, shiftDur, cycleDur;
    final boolean hasUserWave;
    final int shiftEntropy;
    final String shiftBase;
    int cachedEra = Integer.MIN_VALUE;
    int curIdx, nxtIdx = -1;
    WaveFn curFn, nxtFn;
    String curName = "", nxtName = "";
    double lastMix = 0;

    WaveSampler(WaveOpts opts) {
      this.o = snapshotOptions(opts);
      int seed = o.seed;
      this.internalSeed = seedFrom(seed);
      this.pool = resolveGroup(o.group);
      this.isClosingPool = pool == CLOSING_INDICES;
      this.isMorph = (o.wave instanceof Object[]) && ((Object[])o.wave).length >= 2;
      this.mixDefault = isMorph ? toUnit(o.mix) : 0;
      this.shift = o.shift;
      this.range = readRange(o.range);

      if (isMorph) {
        Object[] arr = (Object[]) o.wave;
        int rA = resolveWave(arr[0]);
        waveIndexA = rA >= 0 ? rA : pickWaveIndexIn(seed, pool);
        int rB = resolveWave(arr[1]);
        waveIndexB = rB >= 0 ? rB : pickWaveIndexIn(seed, pool);
      } else if (o.wave != null) {
        int r = resolveWave(o.wave);
        waveIndexA = r >= 0 ? r : pickWaveIndexIn(seed, pool);
      } else {
        waveIndexA = pickWaveIndexIn(seed, pool);
      }
      this.fn = WAVES[waveIndexA].fn;
      this.fnB = waveIndexB >= 0 ? WAVES[waveIndexB].fn : null;
      this.statsA = getStats(waveIndexA, internalSeed);
      this.statsB = waveIndexB >= 0 ? getStats(waveIndexB, internalSeed) : null;

      this.shiftInt = Math.max(0, o.shiftInterval);
      this.shiftDur = Math.max(1e-6, o.shiftDuration);
      this.cycleDur = shiftInt + shiftDur;
      this.hasUserWave = (o.wave != null) && !(o.wave instanceof Object[]);
      this.shiftEntropy = (int)(Math.random() * 100000);
      this.shiftBase = o.seed + "." + shiftEntropy;
      this.curIdx = waveIndexA;
      this.curFn  = fn;
    }

    int pickForEra(int era) {
      if (era == 0 && hasUserWave) return waveIndexA;
      return pickWaveIndexForEra(shiftBase, era, pool);
    }

    void ensureEra(int era) {
      if (era == cachedEra) return;
      cachedEra = era;
      curIdx = pickForEra(era);
      nxtIdx = pickForEra(era + 1);
      if (nxtIdx == curIdx) nxtIdx = nextDifferentInPool(curIdx, pool);
      curFn   = WAVES[curIdx].fn;
      nxtFn   = WAVES[nxtIdx].fn;
      curName = WAVES[curIdx].name;
      nxtName = WAVES[nxtIdx].name;
    }

    public float sample(float y) { return sample(y, o.t); }
    public float sample(float y, float t) {
      t = (float)toNumber(t, 0);
      String mode = normalizeMode(o.mode);
      double u = toUnit(o.unpredictability);

      if (shift) {
        int era = (int)Math.floor(t / cycleDur);
        ensureEra(era);
        double progress = t - era * cycleDur;
        double valA = evalKernel(curFn, y, t, o.frequency, o.phase, internalSeed, mode, u, ctx);
        if (progress >= shiftInt) {
          double m = clamp((progress - shiftInt) / shiftDur, 0, 1);
          m = m * m * (3 - 2 * m);
          lastMix = m;
          double valB = evalKernel(nxtFn, y, t, o.frequency, o.phase, internalSeed, mode, u, ctx);
          if (range != null) {
            double nA = mapToRange(valA, getStats(curIdx, internalSeed), range);
            double nB = mapToRange(valB, getStats(nxtIdx, internalSeed), range);
            return (float)(nA + (nB - nA) * m);
          }
          double nA = normalizeVal(valA, getStats(curIdx, internalSeed));
          double nB = normalizeVal(valB, getStats(nxtIdx, internalSeed));
          return (float)((nA + (nB - nA) * m) * o.amplitude);
        }
        lastMix = 0;
        if (range != null) return (float)mapToRange(valA, getStats(curIdx, internalSeed), range);
        return (float)(normalizeVal(valA, getStats(curIdx, internalSeed)) * o.amplitude);
      }

      double val = evalKernel(fn, y, t, o.frequency, o.phase, internalSeed, mode, u, ctx);
      if (fnB != null) {
        double mix = mixDefault;
        double valB = evalKernel(fnB, y, t, o.frequency, o.phase, internalSeed, mode, u, ctx);
        if (range != null) {
          double a = mapToRange(val, statsA, range);
          double b = mapToRange(valB, statsB, range);
          return (float)(a + (b - a) * mix);
        }
        double nA = normalizeVal(val, statsA);
        double nB = normalizeVal(valB, statsB);
        return (float)((nA + (nB - nA) * mix) * o.amplitude);
      }
      if (range != null) return (float)mapToRange(val, statsA, range);
      return (float)(normalizeVal(val, statsA) * o.amplitude);
    }

    public float sampleMorph(float y, float t, float mix) {
      if (fnB == null) return sample(y, t);
      String mode = normalizeMode(o.mode);
      double u = toUnit(o.unpredictability);
      double val  = evalKernel(fn,  y, t, o.frequency, o.phase, internalSeed, mode, u, ctx);
      double valB = evalKernel(fnB, y, t, o.frequency, o.phase, internalSeed, mode, u, ctx);
      double mixD = toUnit(mix, mixDefault);
      if (range != null) {
        double a = mapToRange(val,  statsA, range);
        double b = mapToRange(valB, statsB, range);
        return (float)(a + (b - a) * mixD);
      }
      double nA = normalizeVal(val,  statsA);
      double nB = normalizeVal(valB, statsB);
      return (float)((nA + (nB - nA) * mixD) * o.amplitude);
    }

    public int waveIndex()    { return shift ? curIdx : waveIndexA; }
    public String waveName()  { return shift ? curName : WAVES[waveIndexA].name; }
    public String targetName(){ return nxtName; }
    public float mix()        { return (float)lastMix; }
    public boolean shifting() { return lastMix > 0; }
    public Float period() {
      if (isClosingPool) return CLOSING_BASE_PERIOD;
      return shift ? WAVES[curIdx].period : WAVES[waveIndexA].period;
    }
    /** Period of the next wave during a shift transition (JS: sampler.targetPeriod).
     *  Closing pool returns the stable base period; null before the first
     *  sample() call or on non-shift samplers. */
    public Float targetPeriod() {
      if (!shift) return null;
      if (isClosingPool) return CLOSING_BASE_PERIOD;
      return nxtIdx >= 0 ? WAVES[nxtIdx].period : null;
    }
  }

  // ============================================================
  // Discovery
  // ============================================================
  public static List<WaveDef> list() {
    List<WaveDef> out = new ArrayList<WaveDef>();
    for (WaveDef w : WAVES) out.add(w);
    return out;
  }
  public static int count() { return WAVES.length; }
}
