package waves;

/**
 * Fluent options builder for {@link Waves#wave(float, WaveOpts)} and
 * {@link Waves#createSampler(WaveOpts)}.
 *
 * <pre>
 *   WaveOpts o = new WaveOpts()
 *     .wave("mountain peaks")
 *     .seed(42)
 *     .amplitude(80)
 *     .frequency(1)
 *     .t(millis() / 1000.0f);
 *
 *   // Morph between two waves:
 *   WaveOpts o = new WaveOpts().wave("classic sine", "mountain peaks").mix(0.5f);
 *
 *   // Shift cycle:
 *   WaveOpts o = new WaveOpts().shift(true).group("gentle");
 * </pre>
 */
public class WaveOpts {
  public Object  wave             = null;     // String, Integer, or String[]/Object[] for morph
  public int     seed             = 0;
  public float   t                = 0;
  public float   amplitude        = 100f;
  public float   frequency        = 1f;
  public float   phase            = 0f;
  public String  mode             = "stable";
  public float   unpredictability = 0f;
  public float[] range            = null;
  public float   mix              = 0.5f;
  public boolean shift            = false;
  public float   shiftInterval    = 3f;
  public float   shiftDuration    = 1f;
  public Object  group            = null;     // "gentle" / "harsh" / "closing" / "all" / String[]

  public WaveOpts wave(Object v)            { this.wave = v; return this; }
  public WaveOpts wave(String a, String b)  { this.wave = new String[]{a, b}; return this; }
  public WaveOpts seed(int v)               { this.seed = v; return this; }
  public WaveOpts t(float v)                { this.t = v; return this; }
  public WaveOpts amplitude(float v)        { this.amplitude = v; return this; }
  public WaveOpts frequency(float v)        { this.frequency = v; return this; }
  public WaveOpts phase(float v)            { this.phase = v; return this; }
  public WaveOpts mode(String v)            { this.mode = v; return this; }
  public WaveOpts unpredictability(float v) { this.unpredictability = v; return this; }
  public WaveOpts range(float lo, float hi) { this.range = new float[]{lo, hi}; return this; }
  public WaveOpts mix(float v)              { this.mix = v; return this; }
  public WaveOpts shift(boolean v)          { this.shift = v; return this; }
  public WaveOpts shiftInterval(float v)    { this.shiftInterval = v; return this; }
  public WaveOpts shiftDuration(float v)    { this.shiftDuration = v; return this; }
  public WaveOpts group(Object v)           { this.group = v; return this; }
}
