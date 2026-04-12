# Journey Language Lint (Windows PowerShell)
# Uses ripgrep (rg) for reliable UTF-8 Arabic pattern matching
# Run: npm run lint:journey

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

Write-Host ""
Write-Host "=== Journey Language Lint ===" -ForegroundColor Cyan
Write-Host ""

# Scan these paths
$globs = @(
    "src/copy/**/*.{ts,tsx}",
    "src/modules/**/*.{ts,tsx}",
    "src/data/**/*.{ts,tsx}",
    "src/templates/**/*.{ts,tsx}",
    "app/not-found.tsx",
    "app/error.tsx",
    "app/onboarding/**/*.{ts,tsx}",
    "public/manifest.json"
)

# Build glob args
$globArgs = @()
foreach ($g in $globs) {
    $globArgs += "--glob"
    $globArgs += $g
}

# Terms to search (forbidden in user-facing copy)
$terms = @(
    @{ Pattern = 'استخدم المنصة'; Fix = 'ابدأ رحلتك' },
    @{ Pattern = 'استخدام المنصة'; Fix = 'الرحلة' },
    @{ Pattern = 'إعدادات المنصة'; Fix = 'just remove or simplify' },
    @{ Pattern = 'أدواتنا'; Fix = 'بوصلتنا' },
    @{ Pattern = 'خدماتنا'; Fix = 'محطاتنا' },
    @{ Pattern = 'منتجنا'; Fix = 'رحلتنا' },
    @{ Pattern = 'مستخدمي المنصة'; Fix = 'مسافري الرحلة' },
    @{ Pattern = 'واجهة التطبيق'; Fix = 'واجهة الرحلة' },
    @{ Pattern = 'رجوع للتطبيق'; Fix = 'رجوع لرحلتك' },
    @{ Pattern = 'افتح التطبيق'; Fix = 'ابدأ رحلتك' }
)

$totalViolations = 0

foreach ($entry in $terms) {
    $pattern = $entry.Pattern
    $fix = $entry.Fix

    # Use rg with explicit encoding
    $results = & rg --no-heading --line-number --encoding utf-8 $globArgs -- $pattern 2>$null

    if ($results) {
        $count = ($results | Measure-Object).Count
        $totalViolations += $count
        Write-Host "[!] `"$pattern`" => `"$fix`" ($count hits)" -ForegroundColor Yellow
        $results | Select-Object -First 5 | ForEach-Object {
            Write-Host "    $_" -ForegroundColor DarkGray
        }
        Write-Host ""
    }
}

Write-Host "================================" -ForegroundColor Cyan
if ($totalViolations -eq 0) {
    Write-Host "All clear! No forbidden terms found." -ForegroundColor Green
} else {
    Write-Host "$totalViolations violation(s) found. See GLOSSARY.md" -ForegroundColor Red
}
Write-Host ""

exit $(if ($totalViolations -gt 0) { 1 } else { 0 })
