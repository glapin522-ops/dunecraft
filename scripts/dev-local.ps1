# DuneCraft local setup for Windows.
# Does not print or commit secrets. Requires Vercel login to glapin522-9622.

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $root ".git"))) {
  $root = Get-Location
}
Set-Location $root

if (-not (Test-Path ".git")) {
  Write-Error "Run this inside the dunecraft repo (C:\Users\palaych\dunecraft)."
}

Write-Host "Repo: $root"
git checkout grok-build/skin-cape
git pull --ff-only

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Error "Node/npm not found. Install Node.js LTS first."
}

npm i

$needLogin = $false
try {
  npx --yes vercel whoami | Out-Host
} catch {
  $needLogin = $true
}

if ($needLogin) {
  Write-Host "Log into the OLD Vercel account glapin522-9622 (not DUNECRAFT)."
  npx --yes vercel login
}

Write-Host "Link project if asked: dunecraft / team glapin522-9622 / scope existing"
npx --yes vercel link --yes --project dunecraft

npx --yes vercel env pull .env.local --environment development --yes

if (-not (Test-Path ".env.local")) {
  Write-Error ".env.local was not created. Pull env from the Vercel dashboard instead."
}

$envText = Get-Content ".env.local" -Raw
$required = @("SESSION_SECRET", "BLOB_READ_WRITE_TOKEN")
$missing = @()
foreach ($key in $required) {
  if ($envText -notmatch "(?m)^$key=.+") { $missing += $key }
}

if ($missing.Count -gt 0) {
  Write-Host "Missing in .env.local: $($missing -join ', ')"
  Write-Host "Add them from https://vercel.com/glapin522-9622/dunecraft/settings/environment-variables"
  if ($envText -notmatch "(?m)^SESSION_SECRET=.+") {
    Add-Content ".env.local" "`nSESSION_SECRET=local-dev-session-secret"
    Write-Host "Wrote a local SESSION_SECRET placeholder. Replace with the Vercel value if login cookies must match prod."
  }
}

Write-Host "Starting http://localhost:3000"
npm run dev
