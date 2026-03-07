$ErrorActionPreference = 'Stop'
$out = 'design\brand-identity.html'
Set-Content -Path $out -Value '' -Encoding UTF8
$files = @('brand-p1', 'brand-p2', 'brand-p3')
foreach ($f in $files) {
    Get-Content -Path "scripts\$f.ps1" -Encoding UTF8 | Add-Content -Path $out -Encoding UTF8
}
$lines = (Get-Content -Path $out).Count
Write-Host "Brand Identity assembled. Lines: $lines"
