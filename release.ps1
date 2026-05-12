# release.ps1 - build dist/waves.zip and dist/waves.txt for Processing's
# Contribution Manager.
#
# Layout produced inside waves.zip (Processing's library guidelines):
#
#   waves/
#     library.properties
#     library/waves.jar
#     examples/<name>/<name>.pde
#     src/waves/*.java
#     README.md
#     LICENSE
#
# dist/waves.txt is a byte-for-byte copy of library.properties, hosted next
# to the zip so the submission bot can fetch metadata without unpacking.

$ErrorActionPreference = 'Stop'
$libName  = 'waves'
$distRoot = 'dist'
$stage    = Join-Path $distRoot $libName

# Always rebuild the jar so the release is self-consistent.
& "$PSScriptRoot\build.ps1"
if ($LASTEXITCODE -ne 0) { throw 'build.ps1 failed' }

# Clean previous release artifacts.
Remove-Item -Recurse -Force $distRoot -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $stage, "$stage\library" | Out-Null

# Assemble payload.
Copy-Item 'library.properties' "$stage\library.properties"
Copy-Item "library\$libName.jar" "$stage\library\$libName.jar"
Copy-Item -Recurse 'examples' "$stage\examples"
Copy-Item -Recurse 'src'      "$stage\src"
Copy-Item 'README.md'         "$stage\README.md"
Copy-Item 'LICENSE'           "$stage\LICENSE"

# Zip the staged folder. Compress-Archive includes the top-level "waves/"
# folder in the archive when given a folder path.
$zipPath = Join-Path $distRoot "$libName.zip"
Compress-Archive -Path $stage -DestinationPath $zipPath -Force

# Metadata sidecar.
Copy-Item 'library.properties' (Join-Path $distRoot "$libName.txt")

$zipSize = (Get-Item $zipPath).Length
Write-Host ''
Write-Host "Release ready:"
Write-Host "  $zipPath  ($zipSize bytes)"
Write-Host "  $distRoot\$libName.txt"
Write-Host ''
Write-Host "Upload both as assets to a GitHub release tagged v$((Select-String -Path 'library.properties' -Pattern '^prettyVersion').Line.Split('=')[-1].Trim())"
