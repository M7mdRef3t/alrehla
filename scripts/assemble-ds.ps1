$ErrorActionPreference = 'Stop'
$out = 'design\design-system.html'
Set-Content -Path $out -Value '' -Encoding UTF8
$files = @('build-ds-1', 'build-ds-2', 'build-ds-3', 'build-ds-4', 'build-ds-5', 'build-ds-6', 'build-ds-7', 'build-ds-8', 'build-ds-9')
foreach ($f in $files) {
    Get-Content -Path "scripts\$f.ps1" | Add-Content -Path $out -Encoding UTF8
}
$lines = (Get-Content -Path $out).Count
Write-Host "Done. Total lines: $lines"
