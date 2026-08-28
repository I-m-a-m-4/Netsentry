import fs from 'fs';
import path from 'path';

// Only strip API routes that cannot be exported to static HTML in Tauri
const pathsToDelete = [
  'src/app/api',
];

console.log('--- Preparing Tauri Build: Stripping dynamic server routes ---');

pathsToDelete.forEach(p => {
  const fullPath = path.resolve(process.cwd(), p);
  if (fs.existsSync(fullPath)) {
    console.log(`Temporarily stripping: ${p}`);
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
});

// Specific stubs for core app dependencies to satisfy imports in desktop builds
const stubs = [
    { path: 'src/actions/admin-actions.ts', content: 'export const deleteBusinessUsersAuth = async () => ({ success: true }); export default {};' }
];

stubs.forEach(s => {
    const fullPath = path.resolve(process.cwd(), s.path);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, s.content);
    console.log(`Created stub: ${s.path}`);
});

console.log('--- Preparation Complete ---');
