<#
  snapshot-to-codex.ps1 — freeze a signed-off live asset into a dated Codex release folder,
  verify it byte-for-byte, and write the folder name back into REGISTER.csv.

  Run this AT SIGN-OFF, not during day-to-day fixes. Codex holds releases, not working copies.

    .\snapshot-to-codex.ps1 -Slug tm9035-km-explorer-slide-16
    .\snapshot-to-codex.ps1 -All -WhatIf
#>
[CmdletBinding(SupportsShouldProcess)]
param(
  [string]$Slug,
  [switch]$All,
  [string]$CodexRoot = "$PSScriptRoot\..\..\Codex\html\production\2026\TM9035",
  [string]$Date = (Get-Date -Format 'yyyy-MM-dd')
)

$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot
$rows = Import-Csv "$here\REGISTER.csv"

if (-not $Slug -and -not $All) { throw "Give -Slug <name> or -All." }

$targets = if ($All) { $rows | Where-Object { $_.class -eq 'production' } }
           else       { $rows | Where-Object { $_.slug -eq $Slug } }

if (-not $targets) { throw "No production row matches '$Slug'. Check REGISTER.csv." }

foreach ($r in $targets) {
  $src = Join-Path $here $r.slug
  if (-not (Test-Path "$src\index.html")) { Write-Warning "skip (no index.html): $($r.slug)"; continue }

  # next version number for this slug
  $n = 1
  Get-ChildItem $CodexRoot -Directory -Filter "$($r.slug)-*" -ErrorAction SilentlyContinue |
    ForEach-Object { if ($_.Name -match '-v(\d+)$') { $n = [Math]::Max($n, [int]$Matches[1] + 1) } }
  $dest = Join-Path $CodexRoot "$($r.slug)-$Date-v$n"

  if ($PSCmdlet.ShouldProcess($dest, "snapshot $($r.slug)")) {
    New-Item -ItemType Directory -Path $dest -Force | Out-Null
    Copy-Item "$src\*" $dest -Recurse -Force

    $a = (Get-FileHash "$src\index.html"  -Algorithm MD5).Hash
    $b = (Get-FileHash "$dest\index.html" -Algorithm MD5).Hash
    if ($a -ne $b) { throw "VERIFY FAILED for $($r.slug) - snapshot does not match live." }

    $r.codex_build = Split-Path $dest -Leaf
    Write-Host "snapshotted + verified: $($r.slug) -> $($r.codex_build)" -ForegroundColor Green
  }
}

if ($PSCmdlet.ShouldProcess("REGISTER.csv", "update codex_build column")) {
  $rows | Export-Csv "$here\REGISTER.csv" -NoTypeInformation -Encoding UTF8
  Write-Host "REGISTER.csv updated." -ForegroundColor Green
}

Write-Host "`nNow run .\reconcile.ps1 before committing.`n"
