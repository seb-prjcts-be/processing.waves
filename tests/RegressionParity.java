package waves;

import java.nio.file.*;
import java.util.*;

// Public API regression checks against p5.waves, not Java-derived expectations.
public class RegressionParity {
  static final Map<String,String> expected = new LinkedHashMap<>();
  static int checks = 0, failures = 0;
  static void check(String id, Object actual) {
    checks++;
    String want = expected.remove(id);
    boolean ok;
    if (actual instanceof Number && want != null) {
      double a = ((Number)actual).doubleValue(), b = Double.parseDouble(want);
      ok = Double.isFinite(a) && Double.isFinite(b) && Math.abs(a-b) <= 0.001;
    } else ok = want != null && want.equals(String.valueOf(actual));
    if (!ok) {
      failures++;
      if (failures <= 12) System.err.println(id + ": got " + actual + ", expected " + want);
    }
  }
  static String indices(List<Integer> pool) {
    StringJoiner s = new StringJoiner(",");
    for (int i : pool) s.add(Integer.toString(i));
    return s.toString();
  }
  public static void main(String[] args) throws Exception {
    for (String line : Files.readAllLines(Path.of(args[0], "regression-expected.tsv"))) {
      String[] fields = line.split("\\t", 2);
      expected.put(fields[0], fields[1]);
    }
    float[] xs = {Float.NaN, Float.POSITIVE_INFINITY, Float.NEGATIVE_INFINITY, 0, 10, -10};
    for (int n=0; n<Waves.count(); n++) {
      Waves.WaveDef def = Waves.WAVES[n];
      check("meta-" + n, def.name + "|" + def.character);
      for (int i=0; i<xs.length; i++) {
        check("name-" + n + "-" + i, Waves.wave(xs[i], def.name));
        check("opts-" + n + "-" + i, Waves.wave(xs[i], new WaveOpts().wave(def.name)));
        check("sampler-" + n + "-" + i, Waves.createSampler(new WaveOpts().wave(def.name)).sample(xs[i]));
      }
    }
    check("group-gentle", indices(Waves.GENTLE_INDICES));
    check("group-harsh", indices(Waves.HARSH_INDICES));
    check("group-closing", indices(Waves.CLOSING_INDICES));
    check("group-ghost", indices(Waves.GHOST_INDICES));
    for (int i=0; i<xs.length; i++) {
      check("default-" + i, Waves.wave(xs[i]));
      check("seed-" + i, Waves.wave(xs[i],42));
    }
    for (int i=0; i<11; i++) {
      WaveOpts o = new WaveOpts().wave("classic sine");
      switch (i) {
        case 0: o.t(Float.NaN); break;
        case 1: o.t(Float.POSITIVE_INFINITY); break;
        case 2: o.amplitude(Float.NaN); break;
        case 3: o.frequency(Float.POSITIVE_INFINITY); break;
        case 4: o.phase(Float.NEGATIVE_INFINITY); break;
        case 5: o.mode(" WILD ").unpredictability(0.5f); break;
        case 6: o.mode("wild").unpredictability(Float.NaN); break;
        case 7: o.range(Float.NaN,Float.POSITIVE_INFINITY); break;
        case 8: o.range = new float[0]; break;
        case 9: o.wave("classic sine","mountain peaks").mix(Float.NaN); break;
        case 10: o.wave(new Object[0]); break;
      }
      check("invalid-wave-" + i, Waves.wave(10,o));
      check("invalid-sampler-" + i, Waves.createSampler(o).sample(10));
    }
    for (boolean shift : new boolean[]{false,true}) {
      WaveOpts o = new WaveOpts().wave("classic sine").group(new String[]{"classic sine"})
        .shift(shift).t(2).amplitude(80).frequency(0.5f).phase(0.25f);
      Waves.WaveSampler s = Waves.createSampler(o);
      o.t(30).amplitude(900).frequency(7).phase(4).mode("wild").unpredictability(1);
      check("snapshot-" + shift,s.sample(10));
      check("time-nan-" + shift,s.sample(10,Float.NaN));
      check("time-inf-" + shift,s.sample(10,Float.POSITIVE_INFINITY));
    }
    WaveOpts mo = new WaveOpts().wave("classic sine","mountain peaks").mix(0.25f).range(-7,13);
    Waves.WaveSampler morph = Waves.createSampler(mo);
    ((Object[])mo.wave)[0]="noise"; mo.range[0]=200; mo.mix=1;
    check("snapshot-morph", morph.sample(10,2));
    check("mix-nan", morph.sampleMorph(10,2,Float.NaN));
    check("mix-inf", morph.sampleMorph(10,2,Float.POSITIVE_INFINITY));
    for (int i=0;i<3;i++) {
      WaveOpts o = new WaveOpts().wave("classic sine").group(new String[]{"classic sine"}).shift(true).t(5);
      if (i==0) o.shiftInterval(Float.NaN).shiftDuration(Float.NaN);
      if (i==1) o.shiftInterval(Float.POSITIVE_INFINITY).shiftDuration(Float.POSITIVE_INFINITY);
      if (i==2) o.shiftInterval(-1).shiftDuration(0);
      check("shift-wave-" + i,Waves.wave(10,o));
      check("shift-sampler-" + i,Waves.createSampler(o).sample(10));
    }
    check("null-options",Waves.wave(10,(WaveOpts)null));
    check("null-sampler",Waves.createSampler(null).sample(10));
    if (!expected.isEmpty()) throw new AssertionError("Unchecked fixtures: " + expected.keySet());
    System.out.println("p5 regression parity: " + checks + " checks, " + failures + " failures");
    if (failures > 0) throw new AssertionError("Regression parity failed");
  }
}
