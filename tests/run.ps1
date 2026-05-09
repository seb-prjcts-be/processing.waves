#!/usr/bin/env pwsh
# Run the numerical validation harness:
#   1. Node generates tests/expected.tsv from p5.waves.js
#   2. Java validator compares against the local processing.waves library

$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot
Set-Location (Split-Path $here -Parent)

# 1. Generate JS expected
Write-Host "[1/3] Running Node generator..."
& node "$here\generate_js.cjs"
if ($LASTEXITCODE -ne 0) { throw "node generate_js.cjs failed" }

# 2. Compile validator
Write-Host "[2/3] Compiling Validator.java..."
$jar = "library\waves.jar"
$bin = "$here\bin"
Remove-Item -Recurse -Force $bin -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $bin | Out-Null
& javac --release 17 -cp $jar -d $bin "$here\Validator.java"
if ($LASTEXITCODE -ne 0) { throw "javac failed" }

# 3. Run validator
Write-Host "[3/3] Running Validator..."
& java -cp "$jar;$bin" Validator $here
exit $LASTEXITCODE
