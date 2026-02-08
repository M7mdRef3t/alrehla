Param(
  [string]$SupabaseAccessToken = $env:SUPABASE_ACCESS_TOKEN,
  [string]$SupabaseProjectRef = $env:SUPABASE_PROJECT_REF,
  [string]$GoogleClientId = $env:SUPABASE_GOOGLE_CLIENT_ID,
  [string]$GoogleClientSecret = $env:SUPABASE_GOOGLE_CLIENT_SECRET,
  [string]$SiteUrl = $env:VITE_PUBLIC_APP_URL,
  [string[]]$RedirectAllowList = @(),
  [switch]$Enable = $true
)

$ErrorActionPreference = "Stop"

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

function Normalize-Url {
  Param([string]$Url)
  if ([string]::IsNullOrWhiteSpace($Url)) { return $null }
  $u = $Url.Trim()
  # Supabase expects full URL; be forgiving about trailing slash.
  if ($u.EndsWith("/")) { return $u }
  return "$u/"
}

Require-Value -Name "SUPABASE_ACCESS_TOKEN" -Value $SupabaseAccessToken
Require-Value -Name "SUPABASE_PROJECT_REF" -Value $SupabaseProjectRef
Require-Value -Name "SUPABASE_GOOGLE_CLIENT_ID" -Value $GoogleClientId
Require-Value -Name "SUPABASE_GOOGLE_CLIENT_SECRET" -Value $GoogleClientSecret

$normalizedSiteUrl = Normalize-Url $SiteUrl
$normalizedAllow = @()
foreach ($u in $RedirectAllowList) {
  $nu = Normalize-Url $u
  if ($nu) { $normalizedAllow += $nu }
}
$normalizedAllow = $normalizedAllow | Select-Object -Unique

$body = @{
  external_google_enabled    = [bool]$Enable
  external_google_client_id  = $GoogleClientId
  external_google_secret     = $GoogleClientSecret
}
if ($normalizedSiteUrl) {
  $body.site_url = $normalizedSiteUrl
}
if ($normalizedAllow.Count -gt 0) {
  # Supabase Auth config uses a comma-separated allow list string.
  $body.uri_allow_list = ($normalizedAllow -join ",")
}

$uri = "https://api.supabase.com/v1/projects/$SupabaseProjectRef/config/auth"
$headers = @{
  Authorization = "Bearer $SupabaseAccessToken"
  "Content-Type" = "application/json"
}

Write-Host "[RUN] PATCH $uri"
Write-Host "[INFO] Updating Supabase Auth config for Google provider."
if ($normalizedSiteUrl) { Write-Host "[INFO] site_url: $normalizedSiteUrl" }
if ($normalizedAllow.Count -gt 0) { Write-Host "[INFO] uri_allow_list count: $($normalizedAllow.Count)" }

$json = ($body | ConvertTo-Json -Depth 6)
try {
  $res = Invoke-RestMethod -Method Patch -Uri $uri -Headers $headers -Body $json
  if ($res -and $res.external_google_enabled -ne $null) {
    Write-Host "[OK] external_google_enabled: $($res.external_google_enabled)"
  } else {
    Write-Host "[OK] Auth config updated."
  }
} catch {
  # Surface useful response body without dumping secrets.
  $msg = $_.Exception.Message
  Write-Host "[ERR] $msg"
  if ($_.Exception.Response) {
    try {
      $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
      $respBody = $reader.ReadToEnd()
      if ($respBody) { Write-Host "[ERR] Response: $respBody" }
    } catch {}
  }
  throw
}

