import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ICONS = path.join(ROOT, 'src-tauri', 'icons');
const DOWNLOADS = 'C:\\Users\\Bello Imam\\Downloads';
const EXTRACT_DIR = path.join(DOWNLOADS, 'NetSentryExtract');
const PACK_DIR = path.join(DOWNLOADS, 'NetSentryPack');
const OUTPUT_MSIX = path.join(DOWNLOADS, 'NetSentry_0.0.1_x64.msix');

const IDENTITY = {
    name: 'Zeneva.NetSentry',
    publisher: 'CN=FB9C471D-AB12-4486-AC75-1AA3579E4073',
    publisherDisplayName: 'Bimex',
    displayName: 'NetSentry',
    description: 'NetSentry - Internet Data Saver and Network Traffic Monitor for Windows.',
    version: '0.0.1.0',
};

console.log('=== NetSentry MSI to MSIX Converter ===');

// 1. Check extracted binary
const exePath = path.join(EXTRACT_DIR, 'PFiles', 'NetSentry', 'netsentry.exe');
if (!fs.existsSync(exePath)) {
    console.error(`Binary not found at ${exePath}. Please extract the MSI first.`);
    process.exit(1);
}
console.log(`[1/5] Found binary: ${exePath}`);

// 2. Prepare Pack Directory
if (fs.existsSync(PACK_DIR)) {
    fs.rmSync(PACK_DIR, { recursive: true, force: true });
}
fs.mkdirSync(path.join(PACK_DIR, 'Assets'), { recursive: true });

// Copy executable
fs.copyFileSync(exePath, path.join(PACK_DIR, 'netsentry.exe'));
console.log('[2/5] Copied netsentry.exe to package directory');

// 3. Copy Assets
const assets = [
    'StoreLogo.png',
    'Square30x30Logo.png',
    'Square44x44Logo.png',
    'Square71x71Logo.png',
    'Square89x89Logo.png',
    'Square107x107Logo.png',
    'Square142x142Logo.png',
    'Square150x150Logo.png',
    'Square284x284Logo.png',
    'Square310x310Logo.png',
];

for (const asset of assets) {
    const src = path.join(ICONS, asset);
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(PACK_DIR, 'Assets', asset));
    } else {
        console.warn(`Asset missing: ${asset}`);
    }
}
console.log('[3/5] Copied Store logo assets');

// 4. Create AppxManifest.xml
const manifestXml = `<?xml version="1.0" encoding="utf-8"?>
<Package xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10"
         xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10"
         xmlns:rescap="http://schemas.microsoft.com/appx/manifest/foundation/windows10/restrictedcapabilities">
  <Identity Name="${IDENTITY.name}"
            Version="${IDENTITY.version}"
            Publisher="${IDENTITY.publisher}"
            ProcessorArchitecture="x64" />
  <Properties>
    <DisplayName>${IDENTITY.displayName}</DisplayName>
    <PublisherDisplayName>${IDENTITY.publisherDisplayName}</PublisherDisplayName>
    <Logo>Assets\\StoreLogo.png</Logo>
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
    <Application Id="App" Executable="netsentry.exe" EntryPoint="Windows.FullTrustApplication">
      <uap:VisualElements DisplayName="${IDENTITY.displayName}"
                          Description="${IDENTITY.description}"
                          Square150x150Logo="Assets\\Square150x150Logo.png"
                          Square44x44Logo="Assets\\Square44x44Logo.png"
                          BackgroundColor="transparent">
        <uap:SplashScreen Image="Assets\\StoreLogo.png" />
      </uap:VisualElements>
    </Application>
  </Applications>
</Package>`;

fs.writeFileSync(path.join(PACK_DIR, 'AppxManifest.xml'), manifestXml, 'utf8');
console.log('[4/5] Generated AppxManifest.xml with Store identity');

// 5. Pack MSIX using makeappx.exe or MSIXHeroCLI.exe
const makeAppxPath = 'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.26100.0\\x64\\makeappx.exe';
const msixHeroPath = 'C:\\Users\\Bello Imam\\AppData\\Local\\Microsoft\\WindowsApps\\MSIXHeroCLI.exe';

if (fs.existsSync(OUTPUT_MSIX)) {
    fs.rmSync(OUTPUT_MSIX, { force: true });
}

if (fs.existsSync(makeAppxPath)) {
    console.log(`[5/5] Packing with makeappx.exe: ${makeAppxPath}`);
    const out = execFileSync(makeAppxPath, ['pack', '/d', PACK_DIR, '/p', OUTPUT_MSIX, '/o'], { encoding: 'utf8' });
    console.log(out.trim());
} else if (fs.existsSync(msixHeroPath)) {
    console.log(`[5/5] Packing with MSIXHeroCLI.exe: ${msixHeroPath}`);
    const out = execFileSync(msixHeroPath, ['pack', '-d', PACK_DIR, '-p', OUTPUT_MSIX], { encoding: 'utf8' });
    console.log(out.trim());
} else {
    console.error('Neither makeappx.exe nor MSIXHeroCLI.exe found!');
    process.exit(1);
}

const stats = fs.statSync(OUTPUT_MSIX);
console.log(`\n SUCCESS! Created MSIX package:`);
console.log(` Path: ${OUTPUT_MSIX}`);
console.log(` Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
console.log(`\nUpload "${OUTPUT_MSIX}" directly to Microsoft Partner Center under Packages!`);
