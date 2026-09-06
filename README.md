# processing.waves

**[Open site](https://seb-prjcts-be.github.io/processing.waves/)** · **[p5.waves (JS original)](https://seb-prjcts-be.github.io/p5.waves/)** · **[Wave Lab (exports .pde)](https://seb-prjcts-be.github.io/p5.waves_lab/)**

Java port of [p5.waves](https://github.com/seb-prjcts-be/p5.waves) v3.6.0 for Processing 4. **35 wave shapes. One function call. Pass a number in, get a number back.**

## About

Behind that one promise lives a curated set of 35 wave shapes: smooth sines and sharp sawteeth, gentle bumps and noise-flecked chaos. Each one is a tiny formula tuned to drive motion, color, shape, or pattern in a Processing sketch. The library hands you all of them through a single `Waves.wave(x, ...)` call, plus the controls to crossfade between them, auto-cycle on a tempo, or push any of them into wild mode.

processing.waves is the Java sibling of p5.waves, originally built in JavaScript for the browser side of generative coding. The port carries the same vocabulary across to Processing 4: same names, same indices, and closely matching numerical output. If you sketch in p5.js today and in Processing tomorrow, you bring the same building blocks with you. The challenge of the port was less about translating syntax and more about making the two implementations agree within Processing's documented float tolerance, despite signed-versus-unsigned int quirks and floating-point traps. FNV-1a hashing, the mulberry32 PRNG, and a double-precision internal math layer carry that weight.

To prove the port works the repo ships a numerical validator that runs the JS reference via Node and compares its outputs against the Java port across 55 cases covering representative waves, every option path, and the group pools. Current status: 55 / 55 pass. Visually identical to JS, sub-pixel numerical match where deterministic. See the [site](https://seb-prjcts-be.github.io/processing.waves/) for live previews of every wave and every bundled sketch.

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

> **Platform support**: release validation runs on Ubuntu 24.04 with Processing 4.5.6: all 14 packaged examples compile and three examples render under a virtual display. Windows was tested historically; this release does not claim a fresh Windows or macOS runtime test. The library has no native dependencies.
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

Fourteen sketches in [`examples/`](examples/). Open them from `Processing > File > Examples > Contributed Libraries > waves`.

| Example | What it shows |
| --- | --- |
| [`basic_demo`](examples/basic_demo/basic_demo.pde) | 5-mode tour: all waves, shift, morph, wild, walker |
| [`wave_shift`](examples/wave_shift/wave_shift.pde) | Filled ribbons, auto-shifting |
| [`morph_wave`](examples/morph_wave/morph_wave.pde) | Horizontal lines blending two formulas |
| [`seamless_closing`](examples/seamless_closing/seamless_closing.pde) | Shifting ring that never tears its seam: `group("closing")` + `period()` |
| [`ghost_delay`](examples/ghost_delay/ghost_delay.pde) | One wave against a delayed copy of itself: `group("ghost")` draws its phase portrait |
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

The `tests/` folder compares freshly compiled Java source with the checked-in p5.waves reference. It covers the original numerical cases plus every wave, group membership, non-finite input, sampler option snapshots, morph mixing and shift option defaults. It does not rely on a previously built `library/waves.jar`.

```
./tests/run.ps1
```

The original suite contains **55 cases**. Tolerance `1e-3` for stable mode, `0.5` for wild mode (small float vs double differences amplify through wild mode's noise modulation).

The Numerical parity workflow runs both suites. The Release package workflow builds and checks `waves.zip`, `waves.txt` and `waves.pdex`, including generated API reference, then tests the extracted library with Processing 4.5.6. A version change merged to `main` publishes the validated package; existing releases are never overwritten. Use the [latest release](https://github.com/seb-prjcts-be/processing.waves/releases/latest), not the historical committed JAR.

## Port notes (Java vs JS)

- p5.waves carries each formula as display metadata plus a precompiled function. Java uses hand-translated lambdas, one per wave. Neither implementation evaluates formula strings at runtime, so there is no public API difference.
- Samplers capture their options at creation, including array values. To apply changed options, create a new sampler, as in p5.waves.
- Non-finite coordinates and numeric options use the p5 defaults (for example, coordinate/time/phase 0, amplitude 100 and frequency 1); invalid morph mix falls back to the sampler's initial mix.
- The public API intentionally retains float input/output and integer seeds for Processing compatibility. This fix does not promise bit-identical JavaScript results or add fractional seeds.
- Internal math runs in `double` (matching JS Numbers) but the public API returns `float` (Processing convention). Visually identical to JS, with sub-pixel numerical match where deterministic.
- FNV-1a seed and mulberry32 PRNG are ported 1:1. `seedFrom()` returns the unsigned uint32 as a `long` so subsequent float math matches JS's unsigned-Number semantics.
- Shift mode uses `Math.random()` for per-session entropy; outputs are non-deterministic across runs (same as JS).

More detail: <https://seb-prjcts-be.github.io/processing.waves/about.html>.

## License

[MIT](LICENSE). Original p5.waves: [seb-prjcts-be/p5.waves](https://github.com/seb-prjcts-be/p5.waves).

## Release packaging

Run `./release.ps1` with PowerShell 7, JDK 17+ and Node.js. The script runs both numerical suites and writes the three distribution files to `dist/`. `python3 tests/release_check.py` validates their contents. CI additionally installs the package in a clean sketchbook and compiles/runs examples using the real Processing CLI.

Increment both `version` (integer update counter) and `prettyVersion` in `library.properties`, and add matching notes under `docs/releases/`. The publication job uses the exact tested commit and never replaces an existing release.
