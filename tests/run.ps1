#!/usr/bin/env pwsh
# Compare freshly compiled source with the checked-in p5.waves reference.
$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot
Push-Location (Split-Path $here -Parent)
try {
  & node (Join-Path $here 'generate_js.cjs')
  if ($LASTEXITCODE -ne 0) { throw 'Reference generation failed' }
  & node (Join-Path $here 'generate_regressions.cjs')
  if ($LASTEXITCODE -ne 0) { throw 'Regression reference generation failed' }

  $bin = Join-Path $here 'bin'
  New-Item -ItemType Directory -Force -Path $bin | Out-Null
  & javac --release 17 -d $bin src/waves/WaveOpts.java src/waves/Waves.java tests/Validator.java tests/RegressionParity.java
  if ($LASTEXITCODE -ne 0) { throw 'Compilation failed' }

  & java -cp $bin Validator $here
  if ($LASTEXITCODE -ne 0) { throw 'Numerical validation failed' }
  & java -cp $bin waves.RegressionParity $here
  if ($LASTEXITCODE -ne 0) { throw 'Regression validation failed' }
} finally {
  Pop-Location
}
