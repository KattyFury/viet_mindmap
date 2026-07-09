# Tao shortcut Desktop + Start Menu: click la chay VietMindmap
$ErrorActionPreference = "Stop"
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
# scripts/ is inside project: parent of scripts = project root
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$vbs = Join-Path $root "launch-silent.vbs"
$bat = Join-Path $root "launch.bat"

if (-not (Test-Path $vbs)) { throw "Missing launch-silent.vbs" }

$chrome = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

$desktop = [Environment]::GetFolderPath("Desktop")
$startMenu = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs"
$shortcutPath = Join-Path $desktop "VietMindmap.lnk"

$w = New-Object -ComObject WScript.Shell
$sc = $w.CreateShortcut($shortcutPath)
$sc.TargetPath = "wscript.exe"
$sc.Arguments = "`"$vbs`""
$sc.WorkingDirectory = "$root"
$sc.WindowStyle = 7
$sc.Description = "Mo VietMindmap (local, khong can Google auth)"
if ($chrome) {
  $sc.IconLocation = "$chrome,0"
} else {
  $sc.IconLocation = "$env:SystemRoot\System32\shell32.dll,13"
}
$sc.Save()

$smPath = Join-Path $startMenu "VietMindmap.lnk"
Copy-Item $shortcutPath $smPath -Force

Write-Host "OK: $shortcutPath"
Write-Host "OK: $smPath"
Write-Host "Double-click icon Desktop 'VietMindmap' de chay."
