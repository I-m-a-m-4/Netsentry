import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { execSync } from 'child_process';

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <rect width="1024" height="1024" fill="#FF5700"/>
  <g transform="translate(0, -20)">
    <!-- Central Ring: Center (512, 470), Outer Radius: 260, Inner Radius: 155 -->
    <path fill-rule="evenodd" clip-rule="evenodd" d="M512 210C368.406 210 252 326.406 252 470C252 613.594 368.406 730 512 730C655.594 730 772 613.594 772 470C772 326.406 655.594 210 512 210ZM512 315C426.396 315 357 384.396 357 470C357 555.604 426.396 625 512 625C597.604 625 667 555.604 667 470C667 384.396 597.604 315 512 315Z" fill="#FFFFFF"/>
    <!-- Bottom Cradle Arc -->
    <path d="M255 685C330 770 418 815 512 815C606 815 694 770 769 685L795 725C712 825 615 875 512 875C409 875 312 825 229 725L255 685Z" fill="#FFFFFF"/>
  </g>
</svg>`;

async function main() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);
  fs.writeFileSync(path.join(publicDir, 'logo.svg'), svgContent);
  console.log('Written SVG icons to public/icon.svg and public/logo.svg');

  const png1024Buffer = await sharp(Buffer.from(svgContent))
    .resize(1024, 1024)
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(publicDir, 'icon.png'), png1024Buffer);
  fs.writeFileSync(path.join(publicDir, 'pinlogo.png'), png1024Buffer);
  console.log('Generated public/icon.png and public/pinlogo.png (1024x1024)');

  const ico32Buffer = await sharp(Buffer.from(svgContent))
    .resize(32, 32)
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), ico32Buffer);
  console.log('Generated public/favicon.ico');

  console.log('Executing tauri icon generation for desktop & mobile...');
  try {
    execSync('npx tauri icon public/icon.png', { stdio: 'inherit' });
    console.log('Successfully regenerated all src-tauri/icons/ !');
  } catch (err) {
    console.error('Tauri icon error:', err);
  }
}

main().catch(console.error);
