const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'src');

const replacements = [
  [/\/admin-imamshaffy/g, '/admin-sheun'],
  [/\badmin-imamshaffy\b/g, 'admin-sheun']
];

// Helper to walk a directory recursively
function walk(dir, fileCallback) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      walk(filePath, fileCallback);
    } else {
      fileCallback(filePath);
    }
  });
}

console.log('--- Running Admin Route search & replace ---');
walk(targetDir, (filePath) => {
  const ext = path.extname(filePath);
  if (!['.ts', '.tsx', '.json', '.js', '.mjs'].includes(ext)) return;
  if (filePath.includes('refactor-admin-route.js')) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  for (const [regex, replacement] of replacements) {
    content = content.replace(regex, replacement);
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Refactored route path in: ${path.relative(targetDir, filePath)}`);
  }
});

// Also check and refactor files in scripts/
const scriptsDir = path.join(__dirname, '..', 'scripts');
if (fs.existsSync(scriptsDir)) {
  const files = fs.readdirSync(scriptsDir);
  files.forEach(file => {
    const filePath = path.join(scriptsDir, file);
    if (file === 'refactor-admin-route.js') return;
    const stat = fs.statSync(filePath);
    if (!stat.isDirectory() && ['.ts', '.tsx', '.json', '.js', '.mjs'].includes(path.extname(file))) {
      let content = fs.readFileSync(filePath, 'utf8');
      let originalContent = content;

      for (const [regex, replacement] of replacements) {
        content = content.replace(regex, replacement);
      }

      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Refactored script file: ${file}`);
      }
    }
  });
}

console.log('--- Admin Route Refactoring Complete ---');
