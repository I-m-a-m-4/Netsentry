const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'src');

const fileRenames = [
  // peers-mentors component files
  ['components/peers-mentors/add-customer-dialog.tsx', 'components/peers-mentors/add-student-dialog.tsx'],
  ['components/peers-mentors/edit-customer-dialog.tsx', 'components/peers-mentors/edit-student-dialog.tsx'],
  ['components/peers-mentors/import-customers-dialog.tsx', 'components/peers-mentors/import-students-dialog.tsx'],

  // performance-analytics component files
  ['components/performance-analytics/top-products-chart.tsx', 'components/performance-analytics/top-subjects-chart.tsx'],
  ['components/performance-analytics/top-customers-list.tsx', 'components/performance-analytics/top-students-list.tsx'],
  ['components/performance-analytics/customer-analytics.tsx', 'components/performance-analytics/student-analytics.tsx'],
  ['components/performance-analytics/recent-sales-table.tsx', 'components/performance-analytics/recent-admissions-table.tsx'],
  ['components/performance-analytics/profit-loss-chart.tsx', 'components/performance-analytics/academic-progress-chart.tsx'],
  ['components/performance-analytics/dead-stock-analysis.tsx', 'components/performance-analytics/completed-syllabus-analysis.tsx'],
  ['components/performance-analytics/payment-method-analysis.tsx', 'components/performance-analytics/payment-type-analysis.tsx'],
];

fileRenames.forEach(([oldRelPath, newRelPath]) => {
  const oldPath = path.join(targetDir, oldRelPath);
  const newPath = path.join(targetDir, newRelPath);
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log(`Renamed: ${oldRelPath} -> ${newRelPath}`);
  } else {
    console.log(`File not found, skipped: ${oldRelPath}`);
  }
});

console.log('File renaming complete!');
