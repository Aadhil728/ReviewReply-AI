$ErrorActionPreference = "Stop"
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$stagingRoot = Join-Path $projectRoot ".codecanyon-staging"
$packageRoot = Join-Path $stagingRoot "ReviewReply-AI"
$outputRoot = Join-Path $projectRoot "dist-codecanyon"

if (Test-Path -LiteralPath $stagingRoot) { Remove-Item -LiteralPath $stagingRoot -Recurse -Force }
if (Test-Path -LiteralPath $outputRoot) { Remove-Item -LiteralPath $outputRoot -Recurse -Force }
New-Item -ItemType Directory -Path $packageRoot -Force | Out-Null
New-Item -ItemType Directory -Path $outputRoot -Force | Out-Null

$excluded = @(".git", ".next", "node_modules", ".corepack", ".npm-cache", ".pnpm-home", ".pnpm-store", "coverage", "dist-codecanyon", ".codecanyon-staging", ".env", ".env.local")
Get-ChildItem -LiteralPath $projectRoot -Force | Where-Object { $excluded -notcontains $_.Name -and $_.Extension -ne ".log" } | ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination $packageRoot -Recurse -Force }

$forbidden = Get-ChildItem -LiteralPath $packageRoot -Recurse -Force -File | Where-Object { $_.Name -in @(".env", ".env.local") -or $_.Extension -in @(".db", ".sqlite", ".log") }
if ($forbidden) { throw "Packaging stopped because forbidden files were found: $($forbidden.FullName -join ', ')" }

$archive = Join-Path $outputRoot "reviewreply-ai-codecanyon.zip"
Compress-Archive -LiteralPath $packageRoot -DestinationPath $archive -CompressionLevel Optimal
Remove-Item -LiteralPath $stagingRoot -Recurse -Force
Write-Host "Package created: $archive"
