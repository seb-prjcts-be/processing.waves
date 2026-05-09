# processing.waves

Java/Processing port of [p5.waves](https://github.com/seb-prjcts-be/p5.waves) v3.3.0.
34 wave shapes. Pass a number in, get a number back.

## Install

Drop the library folder into your Processing sketchbook libraries directory.

1. Find your sketchbook in Processing 4: `File > Preferences > Sketchbook location`.
2. Copy the contents of this repo into `<sketchbook>/libraries/waves/`. Result:
   ```
   <sketchbook>/libraries/waves/
     library.properties
     library/waves.jar
     src/waves/*.java
     examples/*/<sketch>.pde
   ```
3. Restart Processing. The library appears under `Sketch > Import Library > waves`.

Or, on Windows with the JDK on PATH and Processing 4 installed at the default location, run `./build.ps1 -Install` from the repo root. It rebuilds the jar and copies the library into your sketchbook automatically (reads `sketchbook.path.four` from Processing's preferences).

## Use

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

For caching wave selection across many calls (faster in tight loops):

```java
Waves.WaveSampler s = Waves.createSampler(new WaveOpts()
  .shift(true)
  .group("gentle")
  .amplitude(120));

float v = s.sample(x, t);
```

## Examples

Six included in `examples/`:
- `basic_demo` — 5-mode tour (all waves, shift, morph, wild, walker)
- `binary_field` — two samplers summed and thresholded into a 2D pattern
- `flow_fields` — ASCII flow field, direction comes from waves
- `random_walker` — five trails where wave output IS the velocity
- `wave_shift` — auto-shifting filled ribbons
- `morph_wave` — horizontal lines blending two formulas with a sweeping morph

Open any `examples/<name>/<name>.pde` in Processing.

## Build

Requires JDK 17+ and Processing 4.

```
./build.ps1            # builds library/waves.jar
./build.ps1 -Install   # also installs to sketchbook
```

## Numerical validation

The `tests/` folder validates that processing.waves produces the same output
as the JS p5.waves reference for a fixed set of inputs.

```
./tests/run.ps1
```

Result: 35/35 pass. Tolerance 1e-3 for stable mode, 0.5 for wild mode (small
float vs double differences amplify through wild mode's noise modulation).

## Port notes

- The JS `new Function(algoString)` runtime evaluator is replaced by hand-translated Java lambdas, one per wave. Loses runtime string evaluation; the API never exposed it anyway.
- Internal math runs in `double` (matching JS Numbers) but the public API returns `float` (Processing convention). Result: visually identical to JS, with sub-pixel numerical match where deterministic.
- FNV-1a seed and mulberry32 PRNG are ported 1:1. `seedFrom` returns the unsigned uint32 as a `long` so subsequent float math matches JS's unsigned-Number semantics.
- Shift mode uses `Math.random()` for per-session entropy; outputs are non-deterministic across runs (same as JS).

## License

MIT.
