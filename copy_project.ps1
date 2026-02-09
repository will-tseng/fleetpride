$source = "C:\Users\wiets\Documents\Demos\b2b-home-goods"
$dest = "C:\Users\wiets\Documents\Demos\fleetpride\app"

# Clean destination
if (Test-Path $dest) {
    Remove-Item -Path $dest -Recurse -Force
}
New-Item -Path $dest -ItemType Directory -Force | Out-Null

# Get items excluding specific folders
$items = Get-ChildItem -Path $source | Where-Object {
    $_.Name -notin @('node_modules', 'build', '.git', 'nul')
}

foreach ($item in $items) {
    Copy-Item -Path $item.FullName -Destination $dest -Recurse -Force
}

Write-Host "Copy completed successfully!"
