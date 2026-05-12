# processing.waves

[![docs](https://img.shields.io/badge/docs-site-000)](https://seb-prjcts-be.github.io/processing.waves/)
[![java](https://img.shields.io/badge/java-17%2B-blue)](https://adoptium.net/)
[![processing](https://img.shields.io/badge/processing-4-006699)](https://processing.org)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Java port of [p5.waves](https://github.com/seb-prjcts-be/p5.waves) v3.3.0 for Processing 4. **34 wave shapes. One function call. Pass a number in, get a number back.**

> **Documentation site**: <https://seb-prjcts-be.github.io/processing.waves/>
> Visual gallery of every wave, full API reference, copy-paste starters, port notes.

## Install

### Manual (any platform)

1. Find your sketchbook: `File > Preferences > Sketchbook location` in Processing 4.
2. Download `waves.zip` from the latest [release](https://github.com/seb-prjcts-be/processing.waves/releases).
3. Unzip into `<sketchbook>/libraries/` so you end up with `<sketchbook>/libraries/waves/library/waves.jar`.
4. Restart Processing. Verify with `Sketch > Import Library > waves`.

### From source (Windows, with JDK 17+ on PATH)

```powershell
git clone https://github.com/seb-prjcts-be/processing.waves
cd processing.waves
./build.ps1 -Install
```

`build.ps1` reads `sketchbook.path.four` from Processing's preferences and copies the library where Processing expects it. Drop `-Install` to just build the jar into `library/`.

> A future release will be available via Processing 4's Contribution Manager.

## Quickstart

```java
import waves.*;

void setup() {
  size(800, 400);
}

void draw() {
  background(20);
  stroke(255);
  noFill();
  WaveOpts o = new WaveOpts()
    .wave("mountain peaks")
    .t(millis() / 1000.0f)
    .amplitude(120);
  beginShape();
  for (int x = 0; x < width; x += 3) {
    float y = Waves.wave(x, o);
    vertex(x, height / 2 + y);
  }
  endShape();
}
```

## API at a glance

```java
// 1. Lazy — default seed, default everything
Waves.wave(x);

// 2. Quick — by name or by seed
Waves.wave(x, "classic sine");
Waves.wave(x, 42);

// 3. Full control — fluent builder
WaveOpts o = new WaveOpts()
  .wave("bumpy sine")
  .amplitude(80).frequency(1).phase(0)
  .t(millis() / 1000.0f)
  .range(0, 255)              // map to a custom range
  .mode("wild").unpredictability(0.5f)
  .group("gentle");           // restrict the pool

Waves.wave(x, o);

// 4. Cached sampler (faster in tight loops)
Waves.WaveSampler s = Waves.createSampler(new WaveOpts()
  .shift(true).group("gentle").amplitude(120));

s.sample(x, t);

// 5. Morph between two waves
Waves.wave(x, new WaveOpts().wave("classic sine", "triangle").mix(0.5f));
```

See the [full guide](https://seb-prjcts-be.github.io/processing.waves/guide.html) for every option.

## Examples

Six sketches in [`examples/`](examples/). Open them from `Processing > File > Examples > Contributed Libraries > waves`.

| Example | What it shows |
| --- | --- |
| [`basic_demo`](examples/basic_demo/basic_demo.pde) | 5-mode tour: all waves, shift, morph, wild, walker |
| [`wave_shift`](examples/wave_shift/wave_shift.pde) | Filled ribbons, auto-shifting |
| [`morph_wave`](examples/morph_wave/morph_wave.pde) | Horizontal lines blending two formulas |
| [`flow_fields`](examples/flow_fields/flow_fields.pde) | ASCII flow field driven by a shifting sampler |
| [`binary_field`](examples/binary_field/binary_field.pde) | Two samplers, summed and thresholded |
| [`random_walker`](examples/random_walker/random_walker.pde) | Wave output IS the velocity, trails on `PGraphics` |

Full descriptions and copyable source: <https://seb-prjcts-be.github.io/processing.waves/examples.html>.

## Build

Requires JDK 17+ and Processing 4.

```
./build.ps1            # builds library/waves.jar
./build.ps1 -Install   # also installs to sketchbook
```

## Numerical validation

The `tests/` folder validates that processing.waves produces the same output as the JS p5.waves reference for a fixed set of inputs.

```
./tests/run.ps1
```

Current status: **35 / 35 pass**. Tolerance `1e-3` for stable mode, `0.5` for wild mode (small float vs double differences amplify through wild mode's noise modulation).

## Port notes (Java vs JS)

- The JS `new Function(algoString)` runtime evaluator is replaced by hand-translated Java lambdas, one per wave. The string-eval feature was never exposed via the public API, so no functional difference.
- Internal math runs in `double` (matching JS Numbers) but the public API returns `float` (Processing convention). Visually identical to JS, with sub-pixel numerical match where deterministic.
- FNV-1a seed and mulberry32 PRNG are ported 1:1. `seedFrom()` returns the unsigned uint32 as a `long` so subsequent float math matches JS's unsigned-Number semantics.
- Shift mode uses `Math.random()` for per-session entropy; outputs are non-deterministic across runs (same as JS).

More detail: <https://seb-prjcts-be.github.io/processing.waves/about.html>.

## License

[MIT](LICENSE). Original p5.waves: [seb-prjcts-be/p5.waves](https://github.com/seb-prjcts-be/p5.waves).
