Param(
  [string]$SupabaseUrl = $env:VITE_SUPABASE_URL,
  [string]$SupabaseAnonKey = $env:VITE_SUPABASE_ANON_KEY,
  [string]$SupabaseServiceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY,
  [string]$AdminApiSecret = $env:ADMIN_API_SECRET,
  [string]$SupabaseAccessToken = $env:SUPABASE_ACCESS_TOKEN,
  [string]$SupabaseProjectRef = $env:SUPABASE_PROJECT_REF,
  [string]$VercelToken = $env:VERCEL_TOKEN,
  [bool]$PersistUserEnv = $true
)

$ErrorActionPreference = "Stop"

function Upsert-EnvLine {
  Param(
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [Parameter(Mandatory = $true)]
    [string]$Key,
    [Parameter(Mandatory = $true)]
    [string]$Value
  )

  $line = "$Key=$Value"
  $content = @()
  if (Test-Path $Path) {
    $content = Get-Content $Path
  }

  $found = $false
  for ($i = 0; $i -lt $content.Count; $i++) {
    if ($content[$i] -match "^\s*$Key\s*=") {
      $content[$i] = $line
      $found = $true
      break
    }
  }

  if (-not $found) {
    if ($content.Count -gt 0 -and $content[$content.Count - 1] -ne "") {
      $content += ""
    }
    $content += $line
  }

  Set-Content -Path $Path -Value $content -Encoding UTF8
}

function Persist-UserEnv {
  Param(
    [Parameter(Mandatory = $true)]
    [string]$Name,
    [Parameter(Mandatory = $true)]
    [string]$Value
  )
  if ([string]::IsNullOrWhiteSpace($Value)) { return }
  [Environment]::SetEnvironmentVariable($Name, $Value, "User")
}

function Require-Value {
  Param(
    [Parameter(Mandatory = $true)]
    [string]$Name,
    [Parameter(Mandatory = $true)]
    [string]$Value
  )

  if ([string]::IsNullOrWhiteSpace($Value)) {
    throw "Missing required value: $Name"
  }
}

function New-StrongSecret {
  Param([int]$Length = 48)
  $bytes = New-Object byte[] $Length
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  return [Convert]::ToBase64String($bytes).TrimEnd("=").Replace("+", "").Replace("/", "")
}

Write-Host ""
Write-Host "== Bootstrap Platform Access =="
Write-Host ""

Require-Value -Name "VITE_SUPABASE_URL" -Value $SupabaseUrl
Require-Value -Name "VITE_SUPABASE_ANON_KEY" -Value $SupabaseAnonKey
Require-Value -Name "SUPABASE_SERVICE_ROLE_KEY" -Value $SupabaseServiceRoleKey
Require-Value -Name "SUPABASE_PROJECT_REF" -Value $SupabaseProjectRef

if ([string]::IsNullOrWhiteSpace($AdminApiSecret)) {
  $AdminApiSecret = New-StrongSecret
  Write-Host "[INFO] ADMIN_API_SECRET was missing. Generated a strong secret."
}

$envLocalPath = Join-Path (Get-Location) ".env.local"
if (-not (Test-Path $envLocalPath)) {
  New-Item -ItemType File -Path $envLocalPath -Force | Out-Null
}

Upsert-EnvLine -Path $envLocalPath -Key "VITE_SUPABASE_URL" -Value $SupabaseUrl
Upsert-EnvLine -Path $envLocalPath -Key "VITE_SUPABASE_ANON_KEY" -Value $SupabaseAnonKey
Upsert-EnvLine -Path $envLocalPath -Key "SUPABASE_SERVICE_ROLE_KEY" -Value $SupabaseServiceRoleKey
Upsert-EnvLine -Path $envLocalPath -Key "ADMIN_API_SECRET" -Value $AdminApiSecret
Upsert-EnvLine -Path $envLocalPath -Key "SUPABASE_PROJECT_REF" -Value $SupabaseProjectRef
if (-not [string]::IsNullOrWhiteSpace($SupabaseAccessToken)) {
  Upsert-EnvLine -Path $envLocalPath -Key "SUPABASE_ACCESS_TOKEN" -Value $SupabaseAccessToken
}
if (-not [string]::IsNullOrWhiteSpace($VercelToken)) {
  Upsert-EnvLine -Path $envLocalPath -Key "VERCEL_TOKEN" -Value $VercelToken
}

Write-Host "[OK] .env.local updated"

if ($PersistUserEnv) {
  Persist-UserEnv -Name "VITE_SUPABASE_URL" -Value $SupabaseUrl
  Persist-UserEnv -Name "VITE_SUPABASE_ANON_KEY" -Value $SupabaseAnonKey
  Persist-UserEnv -Name "SUPABASE_SERVICE_ROLE_KEY" -Value $SupabaseServiceRoleKey
  Persist-UserEnv -Name "ADMIN_API_SECRET" -Value $AdminApiSecret
  Persist-UserEnv -Name "SUPABASE_PROJECT_REF" -Value $SupabaseProjectRef
  if (-not [string]::IsNullOrWhiteSpace($SupabaseAccessToken)) {
    Persist-UserEnv -Name "SUPABASE_ACCESS_TOKEN" -Value $SupabaseAccessToken
  }
  if (-not [string]::IsNullOrWhiteSpace($VercelToken)) {
    Persist-UserEnv -Name "VERCEL_TOKEN" -Value $VercelToken
  }
  Write-Host "[OK] user environment variables persisted"
}

if (-not [string]::IsNullOrWhiteSpace($SupabaseAccessToken)) {
  Write-Host "[RUN] supabase login"
  & npx --yes supabase@2.76.3 login --token $SupabaseAccessToken | Out-Host
} else {
  Write-Host "[WARN] SUPABASE_ACCESS_TOKEN missing. Skipped CLI login."
}

if (-not [string]::IsNullOrWhiteSpace($VercelToken)) {
  Write-Host "[RUN] vercel token check"
  & npx --yes vercel@50.13.2 whoami --token $VercelToken | Out-Host
} else {
  Write-Host "[WARN] VERCEL_TOKEN missing. Skipped Vercel auth check."
}

Write-Host ""
Write-Host "Bootstrap completed."
Write-Host "Run: npm run access:doctor"
