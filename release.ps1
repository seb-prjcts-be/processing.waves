# Build a complete Processing Contribution Manager package from current source.
# Run from any directory with PowerShell 7, JDK 17+ and Node.js.
$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
  & "$PSScriptRoot/tests/run.ps1"
  if ($LASTEXITCODE -ne 0) { throw 'Tests failed' }
  $distRoot = Join-Path $PSScriptRoot 'dist'
  $stageRoot = Join-Path $distRoot ("stage-" + [guid]::NewGuid().ToString('N'))
  $stage = Join-Path $stageRoot 'waves'
  $classes = Join-Path $stageRoot 'classes'
  New-Item -ItemType Directory -Force -Path $classes, "$stage/library", "$stage/reference" | Out-Null
  & javac --release 17 -d $classes src/waves/WaveOpts.java src/waves/Waves.java
  if ($LASTEXITCODE -ne 0) { throw 'Library compilation failed' }
  & jar cf "$stage/library/waves.jar" -C $classes .
  if ($LASTEXITCODE -ne 0) { throw 'JAR build failed' }
  & javadoc -quiet -Xdoclint:none -encoding UTF-8 -d "$stage/reference" -sourcepath src waves
  if ($LASTEXITCODE -ne 0) { throw 'Reference generation failed' }
  Copy-Item library.properties, README.md, LICENSE -Destination $stage
  Copy-Item -Recurse examples, src -Destination $stage
  Compress-Archive -Path $stage -DestinationPath "$distRoot/waves.zip" -Force
  Copy-Item "$distRoot/waves.zip" "$distRoot/waves.pdex" -Force
  Copy-Item "$stage/library.properties" "$distRoot/waves.txt" -Force
  Write-Host "Release package: $distRoot/waves.zip, waves.txt and waves.pdex"
} finally {
  Pop-Location
}
