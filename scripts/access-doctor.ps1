Param()

$ErrorActionPreference = "Stop"

function Get-EffectiveEnvValue {
  Param(
    [Parameter(Mandatory = $true)]
    [string]$Name
  )

  $processValue = [Environment]::GetEnvironmentVariable($Name, "Process")
  if (-not [string]::IsNullOrWhiteSpace($processValue)) { return $processValue }

  $userValue = [Environment]::GetEnvironmentVariable($Name, "User")
  if (-not [string]::IsNullOrWhiteSpace($userValue)) { return $userValue }

  $machineValue = [Environment]::GetEnvironmentVariable($Name, "Machine")
  if (-not [string]::IsNullOrWhiteSpace($machineValue)) { return $machineValue }

  return $null
}

function Read-EnvLocalKeys {
  $path = Join-Path (Get-Location) ".env.local"
  $map = @{}
  if (-not (Test-Path $path)) { return $map }

  Get-Content $path | ForEach-Object {
    if ($_ -match "^\s*([A-Za-z0-9_]+)\s*=") {
      $map[$Matches[1]] = $true
    }
  }
  return $map
}

$coreRequired = @(
  @{ Name = "VITE_SUPABASE_URL"; Scope = "Frontend" },
  @{ Name = "VITE_SUPABASE_ANON_KEY"; Scope = "Frontend" },
  @{ Name = "SUPABASE_SERVICE_ROLE_KEY"; Scope = "Server/API" },
  @{ Name = "SUPABASE_PROJECT_REF"; Scope = "Ops/CLI" }
)

$recommended = @(
  @{ Name = "ADMIN_API_SECRET"; Scope = "Server/API" },
  @{ Name = "SUPABASE_ACCESS_TOKEN"; Scope = "Ops/CLI" },
  @{ Name = "VERCEL_TOKEN"; Scope = "Ops/CLI" }
)

$envLocalKeys = Read-EnvLocalKeys
$missingCore = @()
$missingRecommended = @()

Write-Host ""
Write-Host "== Platform Access Doctor =="
Write-Host ""

Write-Host "== Core Keys =="
foreach ($item in $coreRequired) {
  $value = Get-EffectiveEnvValue -Name $item.Name
  $isSet = -not [string]::IsNullOrWhiteSpace($value)
  $inEnvLocal = $envLocalKeys.ContainsKey($item.Name)

  if ($isSet) {
    Write-Host ("[OK]   {0} ({1})" -f $item.Name, $item.Scope)
  } else {
    Write-Host ("[MISS] {0} ({1})" -f $item.Name, $item.Scope)
    $missingCore += $item.Name
  }

  if ($inEnvLocal) {
    Write-Host ("       -> present in .env.local")
  }
}

Write-Host ""
Write-Host "== Recommended Keys =="
foreach ($item in $recommended) {
  $value = Get-EffectiveEnvValue -Name $item.Name
  $isSet = -not [string]::IsNullOrWhiteSpace($value)
  $inEnvLocal = $envLocalKeys.ContainsKey($item.Name)

  if ($isSet) {
    Write-Host ("[OK]   {0} ({1})" -f $item.Name, $item.Scope)
  } else {
    Write-Host ("[WARN] {0} ({1})" -f $item.Name, $item.Scope)
    $missingRecommended += $item.Name
  }

  if ($inEnvLocal) {
    Write-Host ("       -> present in .env.local")
  }
}

Write-Host ""
Write-Host "== Tooling =="

try {
  $sb = & npx --yes supabase@2.76.3 --version 2>$null
  if ($LASTEXITCODE -eq 0) {
    Write-Host ("[OK]   supabase cli via npx ({0})" -f ($sb | Select-Object -First 1))
  } else {
    throw "supabase version check failed"
  }
} catch {
  Write-Host "[MISS] supabase cli via npx"
  $missingCore += "SUPABASE_CLI"
}

try {
  $prevErrorAction = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  $vc = & npx --yes vercel@50.13.2 --version 2>$null
  $ErrorActionPreference = $prevErrorAction
  if ($LASTEXITCODE -eq 0) {
    Write-Host ("[OK]   vercel cli via npx ({0})" -f ($vc | Select-Object -First 1))
  } else {
    throw "vercel version check failed"
  }
} catch {
  $ErrorActionPreference = "Stop"
  Write-Host "[MISS] vercel cli via npx"
  $missingRecommended += "VERCEL_CLI"
}

Write-Host ""
if ($missingCore.Count -eq 0) {
  if ($missingRecommended.Count -eq 0) {
    Write-Host "Status: READY (full access path configured)."
  } else {
    Write-Host ("Status: READY for Supabase core. Warnings: {0} optional missing." -f $missingRecommended.Count)
  }
  exit 0
}

Write-Host ("Status: NOT READY ({0} core missing)." -f $missingCore.Count)
Write-Host "Run: npm run access:bootstrap"
exit 1
