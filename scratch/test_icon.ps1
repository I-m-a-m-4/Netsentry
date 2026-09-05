Add-Type -AssemblyName System.Drawing
param([string]$ExePath)

if ([string]::IsNullOrWhiteSpace($ExePath) -or -not (Test-Path $ExePath)) {
    Write-Output "NOT_FOUND"
    exit
}

try {
    $icon = [System.Drawing.Icon]::ExtractAssociatedIcon($ExePath)
    if ($icon) {
        $ms = New-Object System.IO.MemoryStream
        $bmp = $icon.ToBitmap()
        $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
        $bytes = $ms.ToArray()
        $base64 = [Convert]::ToBase64String($bytes)
        Write-Output ("data:image/png;base64," + $base64)
    } else {
        Write-Output "NO_ICON"
    }
} catch {
    Write-Output ("ERROR: " + $_.Exception.Message)
}
