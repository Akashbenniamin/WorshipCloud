Add-Type -AssemblyName System.IO.Compression.FileSystem
$dest = "public\fonts"
if (!(Test-Path $dest)) {
    New-Item -ItemType Directory -Path $dest -Force | Out-Null
}

$zips = @(
    "X:\Giveaway assets\Unique Fonts\Okine.zip",
    "X:\Giveaway assets\Unique Fonts\Malibu Sunday.zip",
    "X:\Giveaway assets\Unique Fonts\Badrock.zip"
)

foreach ($zipPath in $zips) {
    if (Test-Path $zipPath) {
        $archive = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
        foreach ($item in $archive.Entries) {
            if ($item.Name -match '\.(otf|ttf)$' -and $item.FullName -notmatch '__MACOSX') {
                $targetFile = Join-Path $dest $item.Name
                [System.IO.Compression.ZipFileExtensions]::ExtractToFile($item, $targetFile, $true)
                Write-Host "Extracted: $($item.Name)"
            }
        }
        $archive.Dispose()
    }
}
Get-ChildItem $dest | Select-Object Name, Length
