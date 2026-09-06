"""Validate the exact distribution and test it with the real Processing CLI."""
import hashlib
import io
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import zipfile

root = Path(__file__).resolve().parents[1]
dist = root / "dist"
data = (dist / "waves.zip").read_bytes()
assert data == (dist / "waves.pdex").read_bytes(), "pdex must equal zip"
with zipfile.ZipFile(io.BytesIO(data)) as archive:
    names = archive.namelist()
    assert all(n.startswith("waves/") and ".." not in Path(n).parts for n in names)
    for required in ["library/waves.jar", "library.properties", "reference/index.html",
                     "src/waves/Waves.java", "README.md", "LICENSE"]:
        assert "waves/" + required in names, required
    assert archive.read("waves/library.properties") == (dist / "waves.txt").read_bytes()
    assert archive.read("waves/src/waves/Waves.java") == (root / "src/waves/Waves.java").read_bytes()
    with zipfile.ZipFile(io.BytesIO(archive.read("waves/library/waves.jar"))) as jar:
        assert "waves/Waves.class" in jar.namelist()
        assert "waves/WaveOpts.class" in jar.namelist()
        assert not any("Regression" in n or "Validator" in n for n in jar.namelist())
    properties = dict(line.split("=",1) for line in (dist/"waves.txt").read_text().splitlines() if "=" in line)
    properties = {k.strip():v.strip() for k,v in properties.items()}
    for key in ["name","authors","url","sentence","version","prettyVersion","categories","minRevision","maxRevision"]:
        assert properties.get(key), key
    assert properties["name"] == "waves"
    assert int(properties["version"]) >= 4
    assert re.fullmatch(r"\d+\.\d+\.\d+", properties["prettyVersion"])
    sketchbook = root / "build/sketchbook"
    sketchbook.mkdir(parents=True, exist_ok=True)
    archive.extractall(sketchbook / "libraries")
installed = sketchbook / "libraries/waves"
assert len(list((installed / "examples").glob("*/*.pde"))) == 14
print("Package verified: metadata, source, JAR, reference, 14 examples and identical pdex.", flush=True)
for filename in ["waves.zip","waves.txt","waves.pdex"]:
    print(filename, hashlib.sha256((dist/filename).read_bytes()).hexdigest(), flush=True)

if len(sys.argv) < 2:
    sys.exit(0)
cli = str(Path(sys.argv[1]).resolve())
config = Path(os.environ["XDG_CONFIG_HOME"]) / "processing"
config.mkdir(parents=True, exist_ok=True)
(config/"preferences.txt").write_text("sketchbook.path.four=" + str(sketchbook) + "\n")
def command(sketch, output, action):
    return ["xvfb-run","-a",cli,"cli","--sketch="+str(sketch),
            "--output="+str(output),"--force",action]
def run(cmd, timeout=180):
    result = subprocess.run(cmd, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=timeout)
    print(result.stdout, flush=True)
    assert result.returncode == 0, "Processing command failed: " + repr(cmd)
    return result.stdout
for sketch in sorted((installed/"examples").iterdir()):
    if sketch.is_dir():
        run(command(sketch, root/"build/sketches"/sketch.name, "--build"))
        print("COMPILED " + sketch.name, flush=True)
# Run actual packaged examples. Only temporary CI copies get an automatic exit
# after several rendered frames; the distributed examples remain untouched.
for name in ["basic_demo", "ghost_delay", "color_field"]:
    target = root/"build/runtime"/name
    shutil.copytree(installed/"examples"/name, target)
    pde = target/(name+".pde")
    source = pde.read_text(encoding="utf-8-sig")
    replacement = 'void draw() {\n  if (frameCount == 6) { println("WAVES_RUNTIME_OK"); exit(); return; }'
    assert "void draw() {" in source
    pde.write_text(source.replace("void draw() {",replacement,1), encoding="utf-8")
    output = run(command(target,root/"build/runtime-bin"/name,"--run"))
    assert "WAVES_RUNTIME_OK" in output
    assert not re.search(r"Exception|NoClassDefFoundError|NoSuchMethodError",output), output
    print("RAN " + name + ": 5 frames", flush=True)
print("PROCESSING_INSTALLATION_OK: 14 compiled, 3 rendered and exited successfully.", flush=True)
