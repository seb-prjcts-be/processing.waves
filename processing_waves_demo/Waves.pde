// Waves.pde
// Processing port of p5.waves (POC, 10 waves + full API surface)
// Source: https://github.com/seb-prjcts-be/p5.waves  (v3.3.0)
// License: MIT

import java.util.HashMap;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

static class Waves {

  // ----- Wave function interface -----
  interface WaveFn {
    float eval(float x, float t, EvalCtx ctx);
  }

  static class WaveDef {
    String name, algo, character;
    WaveFn fn;
    Float period; // null = non-periodic / non-deterministic
    WaveDef(String name, String algo, WaveFn fn, String character, Float period) {
      this.name = name; this.algo = algo; this.fn = fn;
      this.character = character; this.period = period;
    }
  }

  // ----- Registry: 10 representative waves spanning all character types -----
  static final WaveDef[] WAVES = new WaveDef[] {
    new WaveDef("classic sine",   "sin(x*.1)*.4",
      (x, t, c) -> (float)(Math.sin(x*0.1) * 0.4),
      "gentle", 62.8319f),
    new WaveDef("sine",           "sin(x*.2)*.25",
      (x, t, c) -> (float)(Math.sin(x*0.2) * 0.25),
      "gentle", 31.4159f),
    new WaveDef("sharp peaks",    "abs(sin(x*.1))*.5",
      (x, t, c) -> (float)(Math.abs(Math.sin(x*0.1)) * 0.5),
      "gentle", 31.4159f),
    new WaveDef("square",         "(x*.025)%1 < .5 ? -.5 : .5",
      (x, t, c) -> jsmod(x*0.025f, 1f) < 0.5f ? -0.5f : 0.5f,
      "gentle", 40.0f),
    new WaveDef("mountain peaks", "abs(cos(x*.1))*.35 + sin(x*.1)*.25",
      (x, t, c) -> (float)(Math.abs(Math.cos(x*0.1))*0.35 + Math.sin(x*0.1)*0.25),
      "gentle", 62.8319f),
    new WaveDef("wobble sine",    "sin(x*.1)*cos(x*.2)*.5",
      (x, t, c) -> (float)(Math.sin(x*0.1) * Math.cos(x*0.2) * 0.5),
      "gentle", 62.8319f),
    new WaveDef("triangle",       "abs((x*.03) % (.5*2) - .5)",
      (x, t, c) -> Math.abs(jsmod(x*0.03f, 1f) - 0.5f),
      "gentle", 33.3333f),
    new WaveDef("saw down",       "x*.03 % .5",
      (x, t, c) -> jsmod(x*0.03f, 0.5f),
      "gentle", 16.6667f),
    new WaveDef("noise",          "noise(x*.1) - .5",
      (x, t, c) -> c.noise(x*0.1f) - 0.5f,
      "harsh", null),
    new WaveDef("grow random",    "random(x*.003)",
      (x, t, c) -> c.randomMax(x*0.003f),
      "harsh", null),
  };

  // JS "%" semantics differ from Java's % only for negatives — but our inputs
  // are non-negative for these formulas, so Java's % matches. Wrapped for clarity.
  static float jsmod(float a, float b) { return a % b; }

  // ----- Pools -----
  static final List<Integer> GENTLE_INDICES  = new ArrayList<Integer>();
  static final List<Integer> HARSH_INDICES   = new ArrayList<Integer>();
  static final List<Integer> CLOSING_INDICES = new ArrayList<Integer>();
  static final float CLOSING_BASE_PERIOD = 62.8319f;
  static final float CLOSING_RATIO_TOL   = 0.001f;

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
  }

  // ----- Caches -----
  static final Map<String, Stats> STATS_CACHE = new HashMap<String, Stats>();

  // Stable per session, different each run
  static final int waveShiftEntropy = (int)(Math.random() * 100000);

  // ----- Math helpers -----
  static float clamp(float v, float lo, float hi) { return v < lo ? lo : (v > hi ? hi : v); }
  static float lerpF(float a, float b, float t)   { return a + (b - a) * t; }
  static float fade(float t)                      { return t * t * t * (t * (t * 6 - 15) + 10); }
  static float toUnit(float v) { return clamp(v, 0f, 1f); }

  // ----- Seeding (FNV-1a 32-bit, matches JS) -----
  static int seedFrom(Object value) {
    String str = value == null ? "0" : value.toString();
    int h = 0x811c9dc5;          // 2166136261 unsigned
    for (int i = 0; i < str.length(); i++) {
      h ^= str.charAt(i);
      h *= 16777619;             // Java int wraps mod 2^32, matches Math.imul
    }
    return h;
  }

  static class Mulberry32 {
    int state;
    Mulberry32(int seed) { this.state = seed; }
    // Returns double in [0, 1) to avoid the 1.0 rounding edge that float has
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
    Mulberry32 rng = new Mulberry32(seedFrom(seedValue));
    return (int)(rng.next() * WAVES.length);
  }

  static int pickWaveIndexIn(Object seedValue, List<Integer> pool) {
    if (pool == null || pool.isEmpty()) return pickWaveIndex(seedValue);
    Mulberry32 rng = new Mulberry32(seedFrom(seedValue));
    return pool.get((int)(rng.next() * pool.size()));
  }

  static int nextDifferentInPool(int curIdx, List<Integer> pool) {
    if (pool == null || pool.isEmpty()) return (curIdx + 1) % WAVES.length;
    if (pool.size() == 1) return pool.get(0);
    int i = pool.indexOf(curIdx);
    if (i < 0) return pool.get(0);
    return pool.get((i + 1) % pool.size());
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
  static float hash01(float n) {
    int h = (int)(n * 127.1f + 311.7f);
    h = (h << 13) ^ h;
    h = h * (h * h * 15731 + 789221) + 1376312589;
    return ((h & 0x7fffffff) / (float)0x7fffffff);
  }
  static float rand01(int seed, float x, int i) {
    return hash01(seed * 0.001f + x * 0.017f + i * 0.131f);
  }
  static float noise1D(float x, int seed) {
    if (Float.isNaN(x) || Float.isInfinite(x)) return 0;
    int xi = (int)Math.floor(x);
    float xf = x - xi;
    float v0 = hash01(xi     + seed * 0.07f);
    float v1 = hash01(xi + 1 + seed * 0.07f);
    return lerpF(v0, v1, fade(xf));
  }
  static float noiseSigned(float x, int seed) { return noise1D(x, seed) * 2f - 1f; }

  // EvalCtx is the random/noise injection point for formulas
  static class EvalCtx {
    int seed;
    float x;
    int calls;
    void reset(int seed, float x) { this.seed = seed; this.x = x; this.calls = 0; }
    float random()                 { return rand01(seed, x, calls++); }
    float randomMax(float max)     { return rand01(seed, x, calls++) * max; }
    float randomRange(float a, float b) {
      float min = a, max = b;
      if (max < min) { float tmp = max; max = min; min = tmp; }
      return min + rand01(seed, x, calls++) * (max - min);
    }
    float noise(float n) { return noise1D(n, seed); }
  }

  static class Stats { float min, max; Stats(float mn, float mx){min=mn;max=mx;} }

  static final float[] STATS_DOMAIN  = new float[]{ -200f, 200f };
  static final int    STATS_SAMPLES  = 1024;

  static Stats getStats(int waveIndex, int internalSeed) {
    String key = waveIndex + "|" + internalSeed;
    Stats cached = STATS_CACHE.get(key);
    if (cached != null) return cached;

    WaveFn fn = WAVES[waveIndex].fn;
    EvalCtx ctx = new EvalCtx();
    float mn = Float.POSITIVE_INFINITY, mx = Float.NEGATIVE_INFINITY;
    for (int i = 0; i < STATS_SAMPLES; i++) {
      float x = lerpF(STATS_DOMAIN[0], STATS_DOMAIN[1], i / (float)(STATS_SAMPLES - 1));
      ctx.reset(internalSeed, x);
      float v = fn.eval(x, 0, ctx);
      if (!Float.isFinite(v)) v = 0;
      if (v < mn) mn = v;
      if (v > mx) mx = v;
    }
    if (!Float.isFinite(mn) || !Float.isFinite(mx) || mn == mx) { mn = -1; mx = 1; }
    Stats s = new Stats(mn, mx);
    STATS_CACHE.put(key, s);
    return s;
  }

  static float mapToRange(float v, Stats s, float[] range) {
    if (s.min == s.max) return (range[0] + range[1]) * 0.5f;
    float t = (v - s.min) / (s.max - s.min);
    return range[0] + t * (range[1] - range[0]);
  }
  static float normalizeVal(float raw, Stats s) {
    if (s.min == s.max) return 0;
    float n = (raw - s.min) / (s.max - s.min) * 2f - 1f;
    return n < -1f ? -1f : (n > 1f ? 1f : n);
  }

  // ----- Wild mode -----
  static float evaluateWild(WaveFn fn, float x, float t, int seed, float u, EvalCtx ctx) {
    float freqScale = 1 + noiseSigned(x * 0.17f, seed + 17) * u * 0.7f;
    if (freqScale < 0.05f) freqScale = 0.05f;
    float phaseNoise = noiseSigned(x * 0.09f, seed + 29) * u * 0.75f;
    float ampNoise   = 1 + noiseSigned(x * 0.23f, seed + 41) * u * 0.45f;
    if (ampNoise < 0.05f) ampNoise = 0.05f;
    float wildMix = u * 0.25f;
    float evalX   = x * freqScale + phaseNoise;
    ctx.reset(seed, evalX);
    float val = fn.eval(evalX, t, ctx);
    if (wildMix > 0) {
      float carrier = noiseSigned(evalX * 0.97f + seed * 0.0001f, seed + 101);
      val = lerpF(val, carrier, wildMix);
    }
    return val * ampNoise;
  }

  // ----- Shared eval kernel -----
  static float evalKernel(WaveFn fn, float y, float t, float frequency,
                          float phase, int seed, String mode, float u, EvalCtx ctx) {
    float x = (y + t) * frequency + phase;
    if ("wild".equals(mode) && u > 0) return evaluateWild(fn, x, t, seed, u, ctx);
    ctx.reset(seed, x);
    float v = fn.eval(x, t, ctx);
    return Float.isFinite(v) ? v : 0f;
  }

  // ============================================================
  // Public API: wave()
  // ============================================================

  static float wave(float y) {
    int idx = pickWaveIndex(0);
    int iSeed = seedFrom(0);
    EvalCtx ctx = new EvalCtx();
    ctx.reset(iSeed, y);
    float raw = WAVES[idx].fn.eval(y, 0, ctx);
    return normalizeVal(raw, getStats(idx, iSeed)) * 100f;
  }

  static float wave(float y, int seed) {
    int iSeed = seedFrom(seed);
    int idx   = pickWaveIndex(seed);
    EvalCtx ctx = new EvalCtx();
    ctx.reset(iSeed, y);
    float raw = WAVES[idx].fn.eval(y, 0, ctx);
    return normalizeVal(raw, getStats(idx, iSeed)) * 100f;
  }

  static float wave(float y, String name) {
    int r = resolveWave(name);
    int idx = r >= 0 ? r : pickWaveIndex(0);
    int iSeed = seedFrom(0);
    EvalCtx ctx = new EvalCtx();
    ctx.reset(iSeed, y);
    float raw = WAVES[idx].fn.eval(y, 0, ctx);
    return normalizeVal(raw, getStats(idx, iSeed)) * 100f;
  }

  static float wave(float y, WaveOpts o) {
    int seed = o.seed;
    float t = o.t, amplitude = o.amplitude, frequency = o.frequency, phase = o.phase;
    String mode = "wild".equals(o.mode) ? "wild" : "stable";
    float u = toUnit(o.unpredictability);
    float[] range = o.range;
    boolean shift = o.shift;
    float shiftInterval = Math.max(0f, o.shiftInterval);
    float shiftDuration = Math.max(1e-6f, o.shiftDuration);
    List<Integer> pool = resolveGroup(o.group);
    int internalSeed = seedFrom(seed);
    EvalCtx ctx = new EvalCtx();

    if (shift) {
      float cycleDur = shiftInterval + shiftDuration;
      int era      = (int)Math.floor(t / cycleDur);
      float progress = t - era * cycleDur;
      int userIdx = o.wave != null ? resolveWave(o.wave) : -1;
      int idxA = (era == 0 && userIdx >= 0) ? userIdx
        : pickWaveIndexIn(seed + "." + waveShiftEntropy + "." + era, pool);
      WaveFn fnA = WAVES[idxA].fn;
      float valA = evalKernel(fnA, y, t, frequency, phase, internalSeed, mode, u, ctx);

      if (progress >= shiftInterval) {
        int idxB = (era == 1 && userIdx >= 0)
          ? pickWaveIndexIn(seed + "." + waveShiftEntropy + ".1", pool)
          : pickWaveIndexIn(seed + "." + waveShiftEntropy + "." + (era + 1), pool);
        if (idxB == idxA) idxB = nextDifferentInPool(idxA, pool);
        float valB = evalKernel(WAVES[idxB].fn, y, t, frequency, phase, internalSeed, mode, u, ctx);
        float m = clamp((progress - shiftInterval) / shiftDuration, 0f, 1f);
        m = m * m * (3 - 2 * m);
        if (range != null) {
          float nA = mapToRange(valA, getStats(idxA, internalSeed), range);
          float nB = mapToRange(valB, getStats(idxB, internalSeed), range);
          return nA + (nB - nA) * m;
        }
        float nA = normalizeVal(valA, getStats(idxA, internalSeed));
        float nB = normalizeVal(valB, getStats(idxB, internalSeed));
        return (nA + (nB - nA) * m) * amplitude;
      }
      if (range != null) return mapToRange(valA, getStats(idxA, internalSeed), range);
      return normalizeVal(valA, getStats(idxA, internalSeed)) * amplitude;
    }

    // Morph: wave: ["a", "b"], mix
    if (o.wave instanceof Object[] || o.wave instanceof String[]) {
      Object[] arr = (Object[]) o.wave;
      float mix = toUnit(o.mix);
      int rA = resolveWave(arr[0]);
      int rB = arr.length > 1 ? resolveWave(arr[1]) : rA;
      int idxA = rA >= 0 ? rA : pickWaveIndexIn(seed, pool);
      int idxB = rB >= 0 ? rB : pickWaveIndexIn(seed, pool);
      float valA = evalKernel(WAVES[idxA].fn, y, t, frequency, phase, internalSeed, mode, u, ctx);
      float valB = evalKernel(WAVES[idxB].fn, y, t, frequency, phase, internalSeed, mode, u, ctx);
      if (range != null) {
        float a = mapToRange(valA, getStats(idxA, internalSeed), range);
        float b = mapToRange(valB, getStats(idxB, internalSeed), range);
        return a + (b - a) * mix;
      }
      float nA = normalizeVal(valA, getStats(idxA, internalSeed));
      float nB = normalizeVal(valB, getStats(idxB, internalSeed));
      return (nA + (nB - nA) * mix) * amplitude;
    }

    int waveIndex;
    if (o.wave != null) {
      int r = resolveWave(o.wave);
      waveIndex = r >= 0 ? r : pickWaveIndexIn(seed, pool);
    } else {
      waveIndex = pickWaveIndexIn(seed, pool);
    }
    float val = evalKernel(WAVES[waveIndex].fn, y, t, frequency, phase, internalSeed, mode, u, ctx);
    Stats s = getStats(waveIndex, internalSeed);
    if (range != null) return mapToRange(val, s, range);
    return normalizeVal(val, s) * amplitude;
  }

  // ============================================================
  // Public API: createSampler()
  // ============================================================

  static WaveSampler createSampler(WaveOpts o) {
    return new WaveSampler(o);
  }

  static class WaveSampler {
    final WaveOpts o;
    final int internalSeed;
    final List<Integer> pool;
    final boolean isMorph;
    final float mixDefault;
    final EvalCtx ctx = new EvalCtx();
    final boolean isClosingPool;

    // non-shift state
    int waveIndexA;
    int waveIndexB = -1;
    WaveFn fn, fnB;
    Stats statsA, statsB;

    // shift state
    final boolean shift;
    final float shiftInt, shiftDur, cycleDur;
    final boolean hasUserWave;
    final int shiftEntropy;
    int cachedEra = Integer.MIN_VALUE;
    int curIdx, nxtIdx = -1;
    WaveFn curFn, nxtFn;
    String curName = "", nxtName = "";
    float lastMix = 0;

    WaveSampler(WaveOpts opts) {
      this.o = opts;
      int seed = o.seed;
      this.internalSeed = seedFrom(seed);
      this.pool = resolveGroup(o.group);
      this.isClosingPool = pool == CLOSING_INDICES;
      this.isMorph = (o.wave instanceof Object[]) && ((Object[])o.wave).length >= 2;
      this.mixDefault = isMorph ? toUnit(o.mix) : 0;
      this.shift = o.shift;

      // Pick A
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

      this.shiftInt = Math.max(0f, o.shiftInterval);
      this.shiftDur = Math.max(1e-6f, o.shiftDuration);
      this.cycleDur = shiftInt + shiftDur;
      this.hasUserWave = (o.wave != null) && !(o.wave instanceof Object[]);
      this.shiftEntropy = (int)(Math.random() * 100000);
      this.curIdx = waveIndexA;
      this.curFn  = fn;
    }

    int pickForEra(int era) {
      if (era == 0 && hasUserWave) return waveIndexA;
      return pickWaveIndexIn(o.seed + "." + shiftEntropy + "." + era, pool);
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
      String mode = "wild".equals(o.mode) ? "wild" : "stable";
      float u = toUnit(o.unpredictability);

      if (shift) {
        int era = (int)Math.floor(t / cycleDur);
        ensureEra(era);
        float progress = t - era * cycleDur;
        float valA = evalKernel(curFn, y, t, o.frequency, o.phase, internalSeed, mode, u, ctx);
        if (progress >= shiftInt) {
          float m = clamp((progress - shiftInt) / shiftDur, 0f, 1f);
          m = m * m * (3 - 2 * m);
          lastMix = m;
          float valB = evalKernel(nxtFn, y, t, o.frequency, o.phase, internalSeed, mode, u, ctx);
          if (o.range != null) {
            float nA = mapToRange(valA, getStats(curIdx, internalSeed), o.range);
            float nB = mapToRange(valB, getStats(nxtIdx, internalSeed), o.range);
            return nA + (nB - nA) * m;
          }
          float nA = normalizeVal(valA, getStats(curIdx, internalSeed));
          float nB = normalizeVal(valB, getStats(nxtIdx, internalSeed));
          return (nA + (nB - nA) * m) * o.amplitude;
        }
        lastMix = 0;
        if (o.range != null) return mapToRange(valA, getStats(curIdx, internalSeed), o.range);
        return normalizeVal(valA, getStats(curIdx, internalSeed)) * o.amplitude;
      }

      float val = evalKernel(fn, y, t, o.frequency, o.phase, internalSeed, mode, u, ctx);
      if (fnB != null) {
        float mix = mixDefault;
        float valB = evalKernel(fnB, y, t, o.frequency, o.phase, internalSeed, mode, u, ctx);
        if (o.range != null) {
          float a = mapToRange(val, statsA, o.range);
          float b = mapToRange(valB, statsB, o.range);
          return a + (b - a) * mix;
        }
        float nA = normalizeVal(val, statsA);
        float nB = normalizeVal(valB, statsB);
        return (nA + (nB - nA) * mix) * o.amplitude;
      }
      if (o.range != null) return mapToRange(val, statsA, o.range);
      return normalizeVal(val, statsA) * o.amplitude;
    }

    public float sampleMorph(float y, float t, float mix) {
      if (fnB == null) return sample(y, t);
      String mode = "wild".equals(o.mode) ? "wild" : "stable";
      float u = toUnit(o.unpredictability);
      float val  = evalKernel(fn,  y, t, o.frequency, o.phase, internalSeed, mode, u, ctx);
      float valB = evalKernel(fnB, y, t, o.frequency, o.phase, internalSeed, mode, u, ctx);
      mix = toUnit(mix);
      if (o.range != null) {
        float a = mapToRange(val,  statsA, o.range);
        float b = mapToRange(valB, statsB, o.range);
        return a + (b - a) * mix;
      }
      float nA = normalizeVal(val,  statsA);
      float nB = normalizeVal(valB, statsB);
      return (nA + (nB - nA) * mix) * o.amplitude;
    }

    public int waveIndex()    { return shift ? curIdx : waveIndexA; }
    public String waveName()  { return shift ? curName : WAVES[waveIndexA].name; }
    public String targetName(){ return nxtName; }
    public float mix()        { return lastMix; }
    public boolean shifting() { return lastMix > 0; }
    public Float period() {
      if (isClosingPool) return CLOSING_BASE_PERIOD;
      return shift ? WAVES[curIdx].period : WAVES[waveIndexA].period;
    }
  }

  // ============================================================
  // Discovery
  // ============================================================
  static List<WaveDef> list() {
    List<WaveDef> out = new ArrayList<WaveDef>();
    for (WaveDef w : WAVES) out.add(w);
    return out;
  }
  static int count() { return WAVES.length; }
}

// ----- Options builder (top-level so user code can write `new WaveOpts()...`) -----
static class WaveOpts {
  Object wave = null;     // String, Integer, or String[]/Object[] for morph
  int seed = 0;
  float t = 0;
  float amplitude = 100f;
  float frequency = 1f;
  float phase = 0f;
  String mode = "stable";
  float unpredictability = 0f;
  float[] range = null;
  float mix = 0.5f;
  boolean shift = false;
  float shiftInterval = 3f;
  float shiftDuration = 1f;
  Object group = null;    // "gentle" / "harsh" / "closing" / "all" / String[]

  WaveOpts wave(Object v)            { this.wave = v; return this; }
  WaveOpts wave(String a, String b)  { this.wave = new String[]{a, b}; return this; }
  WaveOpts seed(int v)               { this.seed = v; return this; }
  WaveOpts t(float v)                { this.t = v; return this; }
  WaveOpts amplitude(float v)        { this.amplitude = v; return this; }
  WaveOpts frequency(float v)        { this.frequency = v; return this; }
  WaveOpts phase(float v)            { this.phase = v; return this; }
  WaveOpts mode(String v)            { this.mode = v; return this; }
  WaveOpts unpredictability(float v) { this.unpredictability = v; return this; }
  WaveOpts range(float lo, float hi) { this.range = new float[]{lo, hi}; return this; }
  WaveOpts mix(float v)              { this.mix = v; return this; }
  WaveOpts shift(boolean v)          { this.shift = v; return this; }
  WaveOpts shiftInterval(float v)    { this.shiftInterval = v; return this; }
  WaveOpts shiftDuration(float v)    { this.shiftDuration = v; return this; }
  WaveOpts group(Object v)           { this.group = v; return this; }
}
