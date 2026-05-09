// Validator: runs each case through Java waves, compares against expected.tsv (from JS).
// Build + run via tests/run.ps1.

import waves.Waves;
import waves.WaveOpts;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

public class Validator {

  static final float TOLERANCE = 1e-3f;
  // Looser tolerance for wild mode: amplifies small float-vs-double differences.
  static final float TOLERANCE_WILD = 0.5f;

  public static void main(String[] args) throws Exception {
    Path testsDir = Path.of(args.length > 0 ? args[0] : "tests");
    Map<String, String[]> cases = readTsv(testsDir.resolve("cases.tsv"));
    Map<String, String[]> expected = readTsv(testsDir.resolve("expected.tsv"));

    int passed = 0, failed = 0;
    StringBuilder fails = new StringBuilder();

    for (Map.Entry<String, String[]> e : cases.entrySet()) {
      String id = e.getKey();
      String[] c = e.getValue();
      if (id.equals("id")) continue;

      float y = Float.parseFloat(c[2]);
      WaveOpts o = buildOpts(c);
      float javaVal = Waves.wave(y, o);

      String[] exp = expected.get(id);
      if (exp == null) { failed++; fails.append("  [").append(id).append("] no expected value\n"); continue; }
      float jsVal = Float.parseFloat(exp[1]);

      boolean isWild = "wild".equals(c[9]);
      float tol = isWild ? TOLERANCE_WILD : TOLERANCE;
      float delta = Math.abs(javaVal - jsVal);

      if (delta <= tol) {
        passed++;
      } else {
        failed++;
        fails.append(String.format("  [%s] %s%n    java=%.6f  js=%.6f  delta=%.6f%n",
          id, c[1], javaVal, jsVal, delta));
      }
    }

    System.out.println("");
    System.out.println("processing.waves numerical validation");
    System.out.println("=====================================");
    System.out.println("Cases:   " + (passed + failed));
    System.out.println("Passed:  " + passed);
    System.out.println("Failed:  " + failed);
    System.out.println("Tolerance: stable=" + TOLERANCE + ", wild=" + TOLERANCE_WILD);
    if (failed > 0) {
      System.out.println("");
      System.out.println("Failures:");
      System.out.print(fails);
      System.exit(1);
    }
  }

  static WaveOpts buildOpts(String[] c) {
    // header: id desc y t seed wave amp freq phase mode u mix rlo rhi group waveB
    //         0  1   2 3 4    5    6   7    8     9    10 11 12  13  14    15
    WaveOpts o = new WaveOpts()
      .seed(Integer.parseInt(c[4]))
      .t(Float.parseFloat(c[3]))
      .amplitude(Float.parseFloat(c[6]))
      .frequency(Float.parseFloat(c[7]))
      .phase(Float.parseFloat(c[8]));
    if (!"-".equals(c[5])) o.wave(c[5]);
    if (!"-".equals(c[15])) o.wave(c[5], c[15]);     // morph: A,B
    if ("wild".equals(c[9])) {
      o.mode("wild").unpredictability(Float.parseFloat(c[10]));
    }
    if (!"-".equals(c[11])) o.mix(Float.parseFloat(c[11]));
    if (!"-".equals(c[12]) && !"-".equals(c[13])) {
      o.range(Float.parseFloat(c[12]), Float.parseFloat(c[13]));
    }
    if (!"-".equals(c[14]) && !"all".equals(c[14])) o.group(c[14]);
    return o;
  }

  static Map<String, String[]> readTsv(Path p) throws Exception {
    Map<String, String[]> rows = new HashMap<>();
    for (String line : Files.readAllLines(p)) {
      if (line.isBlank()) continue;
      String[] parts = line.split("\t", -1);
      rows.put(parts[0], parts);
    }
    return rows;
  }
}
