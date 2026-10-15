param(
    [string]$DownloadsDir = "C:\Users\Bello Imam\Downloads",
    [string]$DisplayName = "NetSentry"
)

$ErrorActionPreference = "Stop"

Write-Host "============================================="
Write-Host "NetHelm MSI to MSIX Packaging Script"
Write-Host "============================================="

# 1. Find latest NetHelm MSI in Downloads
$latestMsi = Get-ChildItem -Path $DownloadsDir -Filter "NetHelm_*_x64_en-US.msi" -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if (-not $latestMsi) {
    # Fallback to any NetHelm*.msi
    $latestMsi = Get-ChildItem -Path $DownloadsDir -Filter "*NetHelm*.msi" -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
}

if (-not $latestMsi) {
    Write-Error "No NetHelm MSI found in $DownloadsDir"
    exit 1
}

$msiPath = $latestMsi.FullName
Write-Host "Input MSI: $msiPath (Size: $($latestMsi.Length) bytes)"

# Extract Version (e.g. 0.0.4)
$versionMatch = [regex]::Match($latestMsi.Name, "NetHelm_(\d+\.\d+\.\d+)")
if ($versionMatch.Success) {
    $displayVersion = $versionMatch.Groups[1].Value
} else {
    $displayVersion = "0.0.4"
}
$packageVersion = "$displayVersion.0"
Write-Host "Target Version: $packageVersion (Display: $displayVersion)"

$repoRoot = (Resolve-Path "$PSScriptRoot\..").Path
$workDir = Join-Path $DownloadsDir "NetHelm_msix_build"
$pkgDir = Join-Path $workDir "package"
$assetsDir = Join-Path $pkgDir "Assets"
$expandDir = Join-Path $workDir "expanded"

if (Test-Path $workDir) {
    Remove-Item -Path $workDir -Recurse -Force
}
New-Item -ItemType Directory -Path $assetsDir -Force | Out-Null
New-Item -ItemType Directory -Path $expandDir -Force | Out-Null

Write-Host "Step 1: Inspecting cabinet streams inside MSI via WindowsInstaller COM..."
$wi = New-Object -ComObject WindowsInstaller.Installer
$db = $wi.GetType().InvokeMember("OpenDatabase", "InvokeMethod", $null, $wi, @($msiPath, 0))

# Find the cabinet stream name
$view = $db.GetType().InvokeMember("OpenView", "InvokeMethod", $null, $db, @("SELECT Name FROM _Streams"))
$view.GetType().InvokeMember("Execute", "InvokeMethod", $null, $view, $null)

$cabStreamName = $null
while ($rec = $view.GetType().InvokeMember("Fetch", "InvokeMethod", $null, $view, $null)) {
    $sName = $rec.GetType().InvokeMember("StringData", "GetProperty", $null, $rec, @(1))
    Write-Host "Found stream: $sName"
    if ($sName -like "*.cab") {
        $cabStreamName = $sName
        break
    }
}

if (-not $cabStreamName) {
    # If no .cab stream name found, try default 'app.cab' or 'Product.cab'
    $cabStreamName = "app.cab"
}

Write-Host "Extracting stream '$cabStreamName' to cabinet file..."
$cabPath = Join-Path $workDir "embedded.cab"

$viewCab = $db.GetType().InvokeMember("OpenView", "InvokeMethod", $null, $db, @("SELECT Name, Data FROM _Streams WHERE Name='$cabStreamName'"))
$viewCab.GetType().InvokeMember("Execute", "InvokeMethod", $null, $viewCab, $null)
$recCab = $viewCab.GetType().InvokeMember("Fetch", "InvokeMethod", $null, $viewCab, $null)

if (-not $recCab) {
    Write-Error "Could not read cabinet stream '$cabStreamName'"
    exit 1
}

$fs = [System.IO.File]::Create($cabPath)
try {
    do {
        $chunk = $recCab.GetType().InvokeMember("ReadStream", "InvokeMethod", $null, $recCab, @(2, 65536, 2))
        if ($chunk -and $chunk.Length -gt 0) {
            if ($chunk -is [byte[]]) {
                $fs.Write($chunk, 0, $chunk.Length)
            } else {
                $bytes = [System.Text.Encoding]::Default.GetBytes($chunk)
                $fs.Write($bytes, 0, $bytes.Length)
            }
        } else {
            break
        }
    } while ($true)
} finally {
    $fs.Close()
}

Write-Host "Extracted cabinet size: $((Get-Item $cabPath).Length) bytes"

Write-Host "Step 2: Unpacking binaries from cabinet using expand.exe..."
& expand.exe "$cabPath" -F:* "$expandDir" | Out-Null

$extractedFiles = Get-ChildItem -Path $expandDir -File
Write-Host "Unpacked $($extractedFiles.Count) files:"

$finalExe = Join-Path $pkgDir "nethelm.exe"
$exeIdentified = $false

foreach ($f in $extractedFiles) {
    Write-Host " - $($f.Name) ($($f.Length) bytes)"
    
    # Read first two bytes to check if it's a PE binary (MZ)
    $stream = [System.IO.File]::OpenRead($f.FullName)
    $buffer = New-Object byte[] 2
    $bytesRead = $stream.Read($buffer, 0, 2)
    $stream.Close()
    
    $isExe = ($bytesRead -eq 2 -and $buffer[0] -eq 0x4D -and $buffer[1] -eq 0x5A) # 'MZ'
    
    if ($isExe -or $f.Extension -eq ".exe") {
        Copy-Item -Path $f.FullName -Destination $finalExe -Force
        $exeIdentified = $true
        Write-Host "Staged $($f.Name) as nethelm.exe"
    } else {
        Copy-Item -Path $f.FullName -Destination (Join-Path $pkgDir $f.Name) -Force
    }
}

if (-not $exeIdentified) {
    Write-Error "No executable found in extracted cabinet!"
    exit 1
}
Write-Host "Target executable prepared: $finalExe ($((Get-Item $finalExe).Length) bytes)"

Write-Host "Step 3: Staging AppxManifest.xml..."
$manifestXml = @"
<?xml version="1.0" encoding="utf-8"?>
<Package xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10"
         xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10"
         xmlns:rescap="http://schemas.microsoft.com/appx/manifest/foundation/windows10/restrictedcapabilities"
         xmlns:uap17="http://schemas.microsoft.com/appx/manifest/uap/windows10/17"
         IgnorableNamespaces="uap uap17 rescap">
  <Identity Name="Zeneva.NetSentry"
            Version="$packageVersion"
            Publisher="CN=FB9C471D-AB12-4486-AC75-1AA3579E4073"
            ProcessorArchitecture="x64" />
  <Properties>
    <DisplayName>$DisplayName</DisplayName>
    <PublisherDisplayName>Bimex</PublisherDisplayName>
    <Logo>Assets\StoreLogo.png</Logo>
  </Properties>
  <Resources>
    <Resource Language="en-US" />
  </Resources>
  <Dependencies>
    <TargetDeviceFamily Name="Windows.Universal" MinVersion="10.0.17763.0" MaxVersionTested="10.0.22621.0" />
  </Dependencies>
  <Capabilities>
    <rescap:Capability Name="runFullTrust" />
  </Capabilities>
  <Applications>
    <Application Id="App" Executable="nethelm.exe" EntryPoint="Windows.FullTrustApplication"
                 uap17:AllowElevation="true">
      <uap:VisualElements DisplayName="NetHelm"
                          Description="NetHelm - Real-time Network Traffic Monitor &amp; Bandwidth Guardian for Windows."
                          Square150x150Logo="Assets\Square150x150Logo.png"
                          Square44x44Logo="Assets\Square44x44Logo.png"
                          BackgroundColor="transparent">
        <uap:SplashScreen Image="Assets\StoreLogo.png" />
      </uap:VisualElements>
    </Application>
  </Applications>
</Package>
"@

$manifestPath = Join-Path $pkgDir "AppxManifest.xml"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($manifestPath, $manifestXml, $utf8NoBom)
Write-Host "AppxManifest.xml created successfully."

Write-Host "Step 4: Copying icon assets..."
$iconsSource = Join-Path $repoRoot "src-tauri\icons"
$assetList = @(
    "StoreLogo.png",
    "Square30x30Logo.png",
    "Square44x44Logo.png",
    "Square71x71Logo.png",
    "Square89x89Logo.png",
    "Square107x107Logo.png",
    "Square142x142Logo.png",
    "Square150x150Logo.png",
    "Square284x284Logo.png",
    "Square310x310Logo.png"
)

foreach ($a in $assetList) {
    $src = Join-Path $iconsSource $a
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination (Join-Path $assetsDir $a) -Force
    }
}
Write-Host "Assets copied."

Write-Host "Step 5: Locating makeappx.exe..."
$makeappx = Get-ChildItem "C:\Program Files (x86)\Windows Kits\10\bin" -Recurse -Filter "makeappx.exe" -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -like "*x64*" } |
    Sort-Object FullName -Descending |
    Select-Object -First 1

if (-not $makeappx) {
    Write-Error "makeappx.exe not found in Windows Kits!"
    exit 1
}
Write-Host "Found makeappx: $($makeappx.FullName)"

$outFileName = "NetHelm_${displayVersion}_x64.msix"
$outMsixInDownloads = Join-Path $DownloadsDir $outFileName

Write-Host "Step 6: Packaging MSIX..."
if (Test-Path $outMsixInDownloads) {
    Remove-Item -Path $outMsixInDownloads -Force
}

& $makeappx.FullName pack /d "$pkgDir" /p "$outMsixInDownloads" /nv /o
if ($LASTEXITCODE -ne 0) {
    Write-Error "makeappx pack failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

# Clean up work dir
Remove-Item -Path $workDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "============================================="
Write-Host "SUCCESS! Converted NetHelm MSI to MSIX"
Write-Host "Output: $outMsixInDownloads"
Write-Host "Size:   $((Get-Item $outMsixInDownloads).Length) bytes"
Write-Host "============================================="
