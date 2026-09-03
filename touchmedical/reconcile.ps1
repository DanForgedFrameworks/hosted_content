<#
  reconcile.ps1 — TM9035 asset register integrity check.
  Run before any deploy and after any rename. Exit 1 = drift; fix before pushing.
#>
[CmdletBinding()]
param(
  [string]$CodexRoot = "$PSScriptRoot\..\..\Codex\html\production\2026\TM9035"
)

$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot
if (-not $here) { $here = Split-Path -Parent $MyInvocation.MyCommand.Path }
# Under `powershell -File` in 5.1 the default above can evaluate while $PSScriptRoot is still empty,
# producing C:\..\..\Codex and a Test-Path exception - section [4] then never ran. Rebuild it here.
if (-not $CodexRoot -or $CodexRoot -like '\..\..*' -or $CodexRoot -like '..\*') { $CodexRoot = Join-Path $here '..\..\Codex\html\production\2026\TM9035' }
$fail = 0
function Bad($m) { Write-Host "  FAIL  $m" -ForegroundColor Red; $script:fail++ }
function Warn($m) { Write-Host "  warn  $m" -ForegroundColor Yellow }
function Ok($m)  { Write-Host "  ok    $m" -ForegroundColor Green }

$rows = Import-Csv "$here\REGISTER.csv"
$dirs = Get-ChildItem $here -Directory | Select-Object -ExpandProperty Name

Write-Host "`n[1] Register vs disk"
$missingRow = $dirs | Where-Object { $rows.slug -notcontains $_ }
$missingDir = $rows.slug | Where-Object { $dirs -notcontains $_ }
if ($missingRow) { $missingRow | ForEach-Object { Bad "on disk, no register row: $_" } }
if ($missingDir) { $missingDir | ForEach-Object { Bad "in register, no folder:  $_" } }
if (-not $missingRow -and -not $missingDir) { Ok "$($rows.Count) rows = $($dirs.Count) folders" }

Write-Host "`n[2] Every folder serves something"
$mark = $fail
foreach ($d in $dirs) {
  if (-not (Test-Path "$here\$d\index.html")) { Bad "no index.html: $d" }
}
if ($fail -eq $mark) { Ok "all folders have an index.html" }

Write-Host "`n[3] Slug matches live_url"
$mark = $fail
foreach ($r in $rows) {
  if ($r.live_url -and $r.live_url -notmatch "/$([regex]::Escape($r.slug))/?$") {
    Bad "live_url does not end in its own slug: $($r.slug)"
  }
}
if ($fail -eq $mark) { Ok "all live_url values match their slug" }

Write-Host "`n[4] Codex snapshots (production class only)"
$mark = $fail
foreach ($r in $rows | Where-Object { $_.class -eq 'production' }) {
  if (-not $r.codex_build -or $r.codex_build -like 'n/a*') { Warn "no snapshot recorded: $($r.slug)"; continue }
  $snap = Join-Path $CodexRoot $r.codex_build
  if (-not (Test-Path "$snap\index.html")) { Bad "snapshot folder missing: $($r.codex_build)"; continue }
  $a = (Get-FileHash "$snap\index.html" -Algorithm MD5).Hash
  $b = (Get-FileHash "$here\$($r.slug)\index.html" -Algorithm MD5).Hash
  if ($a -ne $b) { Warn "snapshot is behind live (re-snapshot at next sign-off): $($r.slug)" }
}
if ($fail -eq $mark) { Ok "snapshot references resolve" }

Write-Host "`n[5] Housekeeping"
$rows | Where-Object { $_.status -in @('delete-when-done','broken') } |
  ForEach-Object { Warn "$($_.status): $($_.slug) - $($_.notes)" }

Write-Host ""
if ($fail -gt 0) { Write-Host "DRIFT: $fail failure(s). Fix before deploying.`n" -ForegroundColor Red; exit 1 }
Write-Host "Register reconciles.`n" -ForegroundColor Green
exit 0
