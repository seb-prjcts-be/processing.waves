# build.ps1 - compile src/ into library/processing.waves.jar
#
# Optional flag:
#   -Install  also copy the library to the Processing sketchbook libraries
#             folder so example sketches can import it from anywhere.

param(
  [switch]$Install
)

$ErrorActionPreference = 'Stop'
$libName = "waves"
$jarPath = "library\$libName.jar"
$srcRoot = "src"
$binRoot = "bin"

# Clean
Remove-Item -Recurse -Force $binRoot, $jarPath -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $binRoot, "library" | Out-Null

# Compile
$javaFiles = Get-ChildItem -Recurse -Filter "*.java" -Path $srcRoot | ForEach-Object { $_.FullName }
Write-Host "Compiling $($javaFiles.Count) source file(s)..."
& javac --release 17 -d $binRoot $javaFiles
if ($LASTEXITCODE -ne 0) { throw "javac failed" }

# Jar
& jar cf $jarPath -C $binRoot .
if ($LASTEXITCODE -ne 0) { throw "jar failed" }

$jarSize = (Get-Item $jarPath).Length
Write-Host "Built $jarPath ($jarSize bytes)"

# Optional install to Processing sketchbook
if ($Install) {
  # Read sketchbook.path.four from Processing preferences (Processing 4.x)
  $prefs = "$env:APPDATA\Processing\preferences.txt"
  $sketchbook = $null
  if (Test-Path $prefs) {
    $line = Select-String -Path $prefs -Pattern "^sketchbook\.path\.four=" | Select-Object -First 1
    if ($line) { $sketchbook = ($line.Line -split '=', 2)[1] }
  }
  if (-not $sketchbook) {
    $sketchbook = "$env:USERPROFILE\Documents\Processing"
  }
  $libRoot = Join-Path $sketchbook "libraries\$libName"
  Write-Host "Installing to $libRoot ..."
  Remove-Item -Recurse -Force $libRoot -ErrorAction SilentlyContinue
  New-Item -ItemType Directory -Force -Path "$libRoot\library" | Out-Null
  Copy-Item $jarPath "$libRoot\library\$libName.jar"
  Copy-Item "library.properties" "$libRoot\library.properties"
  if (Test-Path "src") {
    Copy-Item -Recurse "src" "$libRoot\src"
  }
  if (Test-Path "examples") {
    Copy-Item -Recurse "examples" "$libRoot\examples"
  }
  Write-Host "Installed."
}
