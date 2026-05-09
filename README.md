# processing_waves

Java/Processing port of [p5.waves](https://github.com/seb-prjcts-be/p5.waves) v3.3.0.

## Status

- All 34 waves ported in original order (so seed-based wave selection is bit-identical to the JS version).
- Full API surface of v3.3.0: `wave()`, `createSampler()`, shift, morph, wild, group, range.
- Single-tab `Waves.pde` library, drop into any sketch.
- Compile-validated against Processing 4.4.10.

## Run the demo

Open `processing_waves_demo/processing_waves_demo.pde` in Processing 4.

Keys:
- `1` all 10 waves stacked
- `2` shift sampler
- `3` morph (mouseX = mix)
- `4` wild mode (mouseX = unpredictability)
- `5` wave-as-velocity walker
- `SPACE` reseed

## API

```java
// Quick calls
Waves.wave(y);
Waves.wave(y, "classic sine");
Waves.wave(y, 42);                       // seed

// Full options
WaveOpts o = new WaveOpts()
  .wave("mountain peaks")
  .t(millis() / 1000.0f)
  .amplitude(80)
  .frequency(1)
  .seed(42);
float v = Waves.wave(y, o);

// Sampler (caches wave selection, faster in tight loops)
Waves.WaveSampler s = Waves.createSampler(new WaveOpts()
  .shift(true).group("gentle").amplitude(120));
float v = s.sample(y, t);
```

## Port notes

- The JS `new Function(algoString)` runtime evaluator is replaced by hand-translated Java lambdas, one per wave. Removes runtime eval and the `algo` string is now display-only.
- Float instead of double internally (Processing convention). Numerical match is visually indistinguishable but not bit-exact with the JS version.
- FNV-1a seed hash and mulberry32 PRNG ported 1:1 using `int *` (matches JS `Math.imul` semantics) and `>>>` unsigned shift.
- `random()` and `noise()` calls inside formulas use the deterministic injected `EvalCtx`, not Processing's PApplet `random`/`noise`.

## Next

- Numerical validation harness: same `(seed, y, t, opts)` should produce matching output between JS and Java (tolerance ~1e-3 due to float vs double internally).
- Decide on distribution: keep as drop-in `.pde` tab vs. build a contributed Processing library `.jar`.
- Optional examples mirroring the p5.waves examples gallery (binary field, flow field, walker, terrain, etc).
