Param(
  [Parameter(Mandatory = $true)]
  [string]$Email,
  [string]$Role = "owner",
  [string]$SupabaseUrl = $env:VITE_SUPABASE_URL,
  [string]$ServiceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY
)

$ErrorActionPreference = "Stop"

function Read-EnvLocal {
  $path = Join-Path (Get-Location) ".env.local"
  $map = @{}
  if (-not (Test-Path $path)) { return $map }

  Get-Content -Path $path -Encoding UTF8 | ForEach-Object {
    if ($_ -match "^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$") {
      $key = $Matches[1]
      $val = $Matches[2]
      if ($val -match '^"(.*)"$') { $val = $Matches[1] }
      $map[$key] = $val
    }
  }
  return $map
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

Require-Value -Name "Email" -Value $Email
$envLocal = Read-EnvLocal
if ([string]::IsNullOrWhiteSpace($SupabaseUrl) -and $envLocal.ContainsKey("VITE_SUPABASE_URL")) {
  $SupabaseUrl = [string]$envLocal["VITE_SUPABASE_URL"]
}
if ([string]::IsNullOrWhiteSpace($ServiceRoleKey) -and $envLocal.ContainsKey("SUPABASE_SERVICE_ROLE_KEY")) {
  $ServiceRoleKey = [string]$envLocal["SUPABASE_SERVICE_ROLE_KEY"]
}

Require-Value -Name "VITE_SUPABASE_URL" -Value $SupabaseUrl
Require-Value -Name "SUPABASE_SERVICE_ROLE_KEY" -Value $ServiceRoleKey

$emailNormalized = $Email.Trim()
$roleNormalized = $Role.Trim().ToLower()
$baseUrl = $SupabaseUrl.Trim().TrimEnd("/")

if ([string]::IsNullOrWhiteSpace($roleNormalized)) {
  throw "Role cannot be empty"
}

$headersRead = @{
  Authorization = "Bearer $ServiceRoleKey"
  apikey        = $ServiceRoleKey
}

$headersWrite = @{
  Authorization  = "Bearer $ServiceRoleKey"
  apikey         = $ServiceRoleKey
  "Content-Type" = "application/json"
  Prefer         = "return=representation"
}

$encodedEmail = [Uri]::EscapeDataString($emailNormalized)
$selectUrl = "$baseUrl/rest/v1/profiles?select=id,email,role,full_name&email=eq.$encodedEmail"

$profiles = Invoke-RestMethod -Method Get -Uri $selectUrl -Headers $headersRead
if (-not $profiles) {
  throw "No profile found for email: $emailNormalized"
}
if ($profiles.Count -gt 1) {
  throw "Multiple profiles found for email: $emailNormalized"
}

$profile = $profiles[0]
$profileId = [string]$profile.id
if ([string]::IsNullOrWhiteSpace($profileId)) {
  throw "Profile id missing for email: $emailNormalized"
}

$encodedId = [Uri]::EscapeDataString($profileId)
$updateUrl = "$baseUrl/rest/v1/profiles?id=eq.$encodedId"
$body = @{ role = $roleNormalized } | ConvertTo-Json

$updated = Invoke-RestMethod -Method Patch -Uri $updateUrl -Headers $headersWrite -Body $body

Write-Host ("[OK] {0} -> role={1}" -f $emailNormalized, $roleNormalized)
