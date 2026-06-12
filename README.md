# processing.waves

**[Open site](https://seb-prjcts-be.github.io/processing.waves/)** · **[p5.waves (JS original)](https://seb-prjcts-be.github.io/p5.waves/)** · **[Wave Lab (exports .pde)](https://seb-prjcts-be.github.io/p5.waves_lab/)**

Java port of [p5.waves](https://github.com/seb-prjcts-be/p5.waves) v3.3.0 for Processing 4. **34 wave shapes. One function call. Pass a number in, get a number back.**

## About

Behind that one promise lives a curated set of 34 wave shapes: smooth sines and sharp sawteeth, gentle bumps and noise-flecked chaos. Each one is a tiny formula tuned to drive motion, color, shape, or pattern in a Processing sketch. The library hands you all of them through a single `Waves.wave(x, ...)` call, plus the controls to crossfade between them, auto-cycle on a tempo, or push any of them into wild mode.

processing.waves is the Java sibling of p5.waves, originally built in JavaScript for the browser side of generative coding. The port carries the same vocabulary across to Processing 4: same names, same indices, same numerical output. If you sketch in p5.js today and in Processing tomorrow, you bring the same building blocks with you. The challenge of the port was less about translating syntax and more about making the *output* of two implementations match bit-for-bit, despite signed-versus-unsigned int quirks and floating-point traps. FNV-1a hashing, the mulberry32 PRNG, and a double-precision internal math layer carry that weight.

To prove the port works the repo ships a numerical validator that runs the JS reference via Node and compares its outputs against the Java port across 34 waves and 35 cases. Current status: 35 / 35 pass. Visually identical to JS, sub-pixel numerical match where deterministic. See the [site](https://seb-prjcts-be.github.io/processing.waves/) for live previews of every wave and every bundled sketch.

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

> **Platform support**: tested on Windows. The compiled jar is pure Java with no native dependencies, so it should run on macOS and Linux without changes - but neither has been tested yet. If you hit a platform-specific issue, please [open an issue](https://github.com/seb-prjcts-be/processing.waves/issues).
>
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
// 1. Lazy - default seed, default everything
Waves.wave(x);

// 2. Quick - by name or by seed
Waves.wave(x, "classic sine");
Waves.wave(x, 42);

// 3. Full control - fluent builder
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

Twelve sketches in [`examples/`](examples/). Open them from `Processing > File > Examples > Contributed Libraries > waves`.

| Example | What it shows |
| --- | --- |
| [`basic_demo`](examples/basic_demo/basic_demo.pde) | 5-mode tour: all waves, shift, morph, wild, walker |
| [`wave_shift`](examples/wave_shift/wave_shift.pde) | Filled ribbons, auto-shifting |
| [`morph_wave`](examples/morph_wave/morph_wave.pde) | Horizontal lines blending two formulas |
| [`flow_fields`](examples/flow_fields/flow_fields.pde) | ASCII flow field driven by a shifting sampler |
| [`binary_field`](examples/binary_field/binary_field.pde) | Two samplers, summed and thresholded |
| [`random_walker`](examples/random_walker/random_walker.pde) | Wave output IS the velocity, trails on `PGraphics` |
| [`wave_params`](examples/wave_params/wave_params.pde) | Mouse drives frequency + amplitude, formula shifts on its own |
| [`wild_mode`](examples/wild_mode/wild_mode.pde) | Stable vs wild side by side, mouse X = unpredictability |
| [`time_strata`](examples/time_strata/time_strata.pde) | Time as a plain number: mouse X scrubs frozen HSB ribbons |
| [`color_field`](examples/color_field/color_field.pde) | Six samplers driving a drifting RGB colour field |
| [`spiky_lissajous`](examples/spiky_lissajous/spiky_lissajous.pde) | Period-exact Lissajous: spiky waves still close the path |
| [`wave_volume_3d`](examples/wave_volume_3d/wave_volume_3d.pde) | P3D point volume breathing on three shift-samplers |

Full descriptions and copyable source: <https://seb-prjcts-be.github.io/processing.waves/examples.html>.

Prefer to start visually? The [p5.waves Lab](https://seb-prjcts-be.github.io/p5.waves_lab/) (v2.0.0+) lets you tune seven scenes live in the browser and export each one as a ready-to-run `.pde` — the preview is numerically identical to what Processing renders.

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
