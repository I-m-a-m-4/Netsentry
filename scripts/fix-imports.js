const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'src');

const replacements = [
  // Fix peers-mentors imports
  [/'@\/components\/students\/edit-customer-dialog'/g, "'@/components/peers-mentors/edit-student-dialog'"],
  [/"@\/components\/students\/edit-customer-dialog"/g, '"@/components/peers-mentors/edit-student-dialog"'],
  [/'@\/components\/students\/add-customer-dialog'/g, "'@/components/peers-mentors/add-student-dialog'"],
  [/"@\/components\/students\/add-customer-dialog"/g, '"@/components/peers-mentors/add-student-dialog"'],
  [/'@\/components\/students\/import-students-dialog'/g, "'@/components/peers-mentors/import-students-dialog'"],
  [/"@\/components\/students\/import-students-dialog"/g, '"@/components/peers-mentors/import-students-dialog"'],
  [/'@\/components\/students\/import-customers-dialog'/g, "'@/components/peers-mentors/import-students-dialog'"],
  [/"@\/components\/students\/import-customers-dialog"/g, '"@/components/peers-mentors/import-students-dialog"'],

  // Fix performance-analytics imports
  [/top-products-chart/g, 'top-subjects-chart'],
  [/top-customers-list/g, 'top-students-list'],
  [/customer-analytics/g, 'student-analytics'],
  [/recent-sales-table/g, 'recent-admissions-table'],
  [/profit-loss-chart/g, 'academic-progress-chart'],
  [/dead-stock-analysis/g, 'completed-syllabus-analysis'],
  [/payment-method-analysis/g, 'payment-type-analysis'],
];

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

walk(targetDir, (filePath) => {
  const ext = path.extname(filePath);
  if (!['.ts', '.tsx', '.json', '.js', '.mjs'].includes(ext)) return;
  if (filePath.includes('fix-imports.js') || filePath.includes('refactor.js') || filePath.includes('rename-files.js')) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  for (const [regex, replacement] of replacements) {
    content = content.replace(regex, replacement);
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed imports/references in: ${path.relative(targetDir, filePath)}`);
  }
});

console.log('Imports and references fixed successfully!');
