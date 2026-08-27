const fs = require('fs');
const path = require('path');

// Target directory to refactor
const targetDir = path.join(__dirname, '..', 'src');

const replacements = [
  // Types & Interfaces
  [/\bCustomer\b/g, 'Student'],
  [/\bProduct\b/g, 'Subject'],
  [/\bCartItem\b/g, 'SyllabusItem'],
  [/\bBusinessInstance\b/g, 'Academy'],
  [/\bReceipt\b/g, 'Admission'],
  [/\bUserProfile\b/g, 'StudentProfile'],
  [/\bOnlineOrder\b/g, 'MentorshipBooking'],
  [/\bBusinessStats\b/g, 'AcademyStats'],
  [/\bAuditLog\b/g, 'ActivityLog'],
  [/\bHeldSale\b/g, 'ParkedSession'],

  // Context & Providers
  [/\bPOSContext\b/g, 'AcademyContext'],
  [/\busePOS\b/g, 'useAcademy'],
  [/\bPOSProvider\b/g, 'AcademyProvider'],
  [/\bpos-context\b/g, 'academy-context'],

  // CamelCase Variables & Fields
  [/\bbusinessInstance\b/g, 'academyInstance'],
  [/\bbusiness\b/g, 'academy'],
  [/\bproducts\b/g, 'subjects'],
  [/\bcustomers\b/g, 'students'],
  [/\breceipts\b/g, 'admissions'],
  [/\bonlineOrders\b/g, 'mentorshipBookings'],
  [/\bbusinessStats\b/g, 'academyStats'],
  [/\bauditLogs\b/g, 'activityLogs'],
  [/\bheldSales\b/g, 'parkedSessions'],
  [/\bcart\b/g, 'syllabus'],
  [/\bheldSale\b/g, 'parkedSession'],
  [/\bselectedCustomer\b/g, 'selectedStudent'],
  [/\bselectCustomer\b/g, 'selectStudent'],
  
  // Path references in imports/links
  [/'@\/components\/inventory\//g, "'@/components/syllabus-tracker/"],
  [/"@\/components\/inventory\//g, '"@/components/syllabus-tracker/'],
  [/'@\/components\/pos\//g, "'@/components/cbt-simulator/"],
  [/"@\/components\/pos\//g, '"@/components/cbt-simulator/'],
  [/'@\/components\/receipts\//g, "'@/components/admissions/"],
  [/"@\/components\/receipts\//g, '"@/components/admissions/'],
  [/'@\/components\/reports\//g, "'@/components/performance-analytics/"],
  [/"@\/components\/reports\//g, '"@/components/performance-analytics/'],
  [/'@\/components\/customers\//g, "'@/components/peers-mentors/"],
  [/"@\/components\/customers\//g, '"@/components/peers-mentors/'],
  [/'@\/components\/store\//g, "'@/components/news-hub/"],
  [/"@\/components\/store\//g, '"@/components/news-hub/'],
  [/'@\/components\/users\//g, "'@/components/student-profile/"],
  [/"@\/components\/users\//g, '"@/components/student-profile/'],
  
  [/'@\/context\/pos-context'/g, "'@/context/academy-context'"],
  [/"@\/context\/pos-context"/g, '"@/context/academy-context"'],

  // Lowercase database paths/fields
  [/\bbusinessId\b/g, 'academyId'],
  [/\bproductId\b/g, 'subjectId'],
  [/\bcustomerId\b/g, 'studentId'],
  [/\breceiptId\b/g, 'admissionId'],
  [/\borderId\b/g, 'bookingId'],
  [/\bheldSaleId\b/g, 'parkedSessionId'],
  [/\bbusinessCollection\b/g, 'academyCollection'],

  // Database collection names in strings
  [/'products'/g, "'subjects'"],
  [/"products"/g, '"subjects"'],
  [/'customers'/g, "'students'"],
  [/"customers"/g, '"students"'],
  [/'receipts'/g, "'admissions'"],
  [/"receipts"/g, '"admissions"'],
  [/'onlineOrders'/g, "'mentorshipBookings'"],
  [/"onlineOrders"/g, '"mentorshipBookings"'],
  [/'auditLogs'/g, "'activityLogs'"],
  [/"auditLogs"/g, '"activityLogs"'],
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

console.log('--- STEP 1: Replacing text in all src files ---');
walk(targetDir, (filePath) => {
  // Only process source files
  const ext = path.extname(filePath);
  if (!['.ts', '.tsx', '.json', '.js', '.mjs'].includes(ext)) return;
  if (filePath.includes('refactor.js')) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  for (const [regex, replacement] of replacements) {
    content = content.replace(regex, replacement);
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Refactored text in: ${path.relative(targetDir, filePath)}`);
  }
});

console.log('--- STEP 2: Renaming pos-context.tsx to academy-context.tsx ---');
const oldContextPath = path.join(targetDir, 'context', 'pos-context.tsx');
const newContextPath = path.join(targetDir, 'context', 'academy-context.tsx');
if (fs.existsSync(oldContextPath)) {
  fs.renameSync(oldContextPath, newContextPath);
  console.log('Renamed pos-context.tsx to academy-context.tsx');
}

console.log('--- STEP 3: Renaming directories under src/components ---');
const componentRenames = [
  ['inventory', 'syllabus-tracker'],
  ['pos', 'cbt-simulator'],
  ['receipts', 'admissions'],
  ['reports', 'performance-analytics'],
  ['customers', 'peers-mentors'],
  ['store', 'news-hub'],
  ['users', 'student-profile']
];

componentRenames.forEach(([oldName, newName]) => {
  const oldPath = path.join(targetDir, 'components', oldName);
  const newPath = path.join(targetDir, 'components', newName);
  if (fs.existsSync(oldPath)) {
    // If destination already exists, we might need to merge or move files. Let's do rename directly if doesn't exist.
    if (!fs.existsSync(newPath)) {
      fs.renameSync(oldPath, newPath);
      console.log(`Renamed component dir: components/${oldName} -> components/${newName}`);
    } else {
      // Merge contents if destination exists
      const files = fs.readdirSync(oldPath);
      files.forEach(file => {
        const srcFile = path.join(oldPath, file);
        const destFile = path.join(newPath, file);
        fs.renameSync(srcFile, destFile);
      });
      fs.rmdirSync(oldPath);
      console.log(`Merged and removed old component dir: components/${oldName} -> components/${newName}`);
    }
  }
});

console.log('--- Refactoring complete! ---');
