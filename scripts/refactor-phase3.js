 const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'src');

console.log('--- Step 1: Renaming components on disk ---');

const renames = [
  [
    path.join(targetDir, 'components', 'cbt-simulator', 'held-sales-drawer.tsx'),
    path.join(targetDir, 'components', 'cbt-simulator', 'saved-sessions-drawer.tsx')
  ],
  [
    path.join(targetDir, 'components', 'performance-analytics', 'sales-over-time-chart.tsx'),
    path.join(targetDir, 'components', 'performance-analytics', 'sessions-over-time-chart.tsx')
  ],
  [
    path.join(targetDir, 'components', 'performance-analytics', 'hourly-sales-heatmap.tsx'),
    path.join(targetDir, 'components', 'performance-analytics', 'hourly-sessions-heatmap.tsx')
  ]
];

renames.forEach(([oldPath, newPath]) => {
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log(`Renamed file: ${path.relative(targetDir, oldPath)} -> ${path.relative(targetDir, newPath)}`);
  } else {
    console.log(`File already renamed or doesn't exist: ${path.relative(targetDir, oldPath)}`);
  }
});

const replacements = [
  // Component names
  [/\bHeldSalesDrawer\b/g, 'SavedSessionsDrawer'],
  [/\bHeldSalesDrawerProps\b/g, 'SavedSessionsDrawerProps'],
  [/held-sales-drawer/g, 'saved-sessions-drawer'],
  
  // Types & Interfaces
  [/\bParkedSession\b/g, 'SavedSession'],
  
  // Variables & Functions
  [/\bparkedSessions\b/g, 'savedSessions'],
  [/\bsetHeldSales\b/g, 'setSavedSessions'],
  [/\bnewHeldSale\b/g, 'newSavedSession'],
  [/\bupdatedHeldSales\b/g, 'updatedSavedSessions'],
  [/\bsaleToResume\b/g, 'sessionToResume'],
  [/\bresumeHeldSale\b/g, 'resumeSavedSession'],
  [/\bdeleteHeldSale\b/g, 'deleteSavedSession'],
  [/\bholdCurrentSale\b/g, 'saveCurrentSession'],
  
  // Keys
  [/\bPOS_HELD_SALES_KEY\b/g, 'ACADEMY_SAVED_SESSIONS_KEY'],
  [/\bPOS_CART_KEY\b/g, 'ACADEMY_CART_KEY'],
  [/\bPOS_CUSTOMER_KEY\b/g, 'ACADEMY_STUDENT_KEY'],
  [/\bPOS_TAX_RATE_KEY\b/g, 'ACADEMY_TAX_RATE_KEY'],
  [/\bPOS_DISCOUNT_KEY\b/g, 'ACADEMY_DISCOUNT_KEY'],
  [/\bPOS_PAYMENT_METHOD_KEY\b/g, 'ACADEMY_PAYMENT_METHOD_KEY'],
  [/\bPOS_AUTO_PRINT_KEY\b/g, 'ACADEMY_AUTO_PRINT_KEY'],
  
  // Reset functions
  [/\bresetPOS\b/g, 'resetSimulator'],
  [/\bPOSContextType\b/g, 'AcademyContextType'],

  // Queue and action types
  [/'complete-sale'/g, "'complete-registration'"],
  [/"complete-sale"/g, '"complete-registration"'],
  [/\bqueuedSales\b/g, 'queuedRegistrations'],
  [/\bactiveSalesAccum\b/g, 'activeRegistrationsAccum'],
  [/\bpendingSale\b/g, 'pendingRegistration'],

  // Analytics variables
  [/\bposUnitsSold\b/g, 'simulatorUnitsCompleted'],
  [/\bonlineUnitsSold\b/g, 'mentorshipUnitsCompleted'],
  [/\btotalUnitsSold\b/g, 'totalUnitsCompleted'],
  [/\bitemSalesCount\b/g, 'itemSessionCount'],
  [/\bitemRev\b/g, 'itemCost'],
  [/\bproductUnitsSold\b/g, 'examUnitsCompleted'],
  [/\bserviceUnitsSold\b/g, 'subjectUnitsCompleted'],
  [/\bproductRevenue\b/g, 'examRevenue'],
  [/\bserviceRevenue\b/g, 'subjectRevenue'],
  
  // Storage key values
  [/pinnacle_pos_held_sales/g, 'pinnacle_saved_sessions'],
  [/pinnacle_pos_cart/g, 'pinnacle_simulator_cart'],
  [/pinnacle_pos_customer/g, 'pinnacle_simulator_student'],
  [/pinnacle_pos_tax_rate/g, 'pinnacle_simulator_tax_rate'],
  [/pinnacle_pos_discount/g, 'pinnacle_simulator_discount'],
  [/pinnacle_pos_payment_method/g, 'pinnacle_simulator_payment_method'],
  [/pinnacle_pos_auto_print/g, 'pinnacle_simulator_auto_print'],

  // Chart file names & component imports
  [/\bsales-over-time-chart\b/g, 'sessions-over-time-chart'],
  [/\bSalesOverTimeChart\b/g, 'SessionsOverTimeChart'],
  [/\bSalesOverTimeChartProps\b/g, 'SessionsOverTimeChartProps'],
  [/\bhourly-sales-heatmap\b/g, 'hourly-sessions-heatmap'],
  [/\bHourlySalesHeatmap\b/g, 'HourlySessionsHeatmap'],
  [/\bHourlySalesHeatmapProps\b/g, 'HourlySessionsHeatmapProps'],
  [/\btop-products-chart\b/g, 'top-subjects-chart'],
  [/\btop-customers-list\b/g, 'top-students-list'],
  [/\brecent-sales-table\b/g, 'recent-admissions-table'],

  // Dashboard general metrics
  [/\bsalesOverTime\b/g, 'sessionsOverTime'],
  [/\bsalesCount\b/g, 'sessionsCount'],
  [/\bsalesValue\b/g, 'sessionsValue'],
  [/\btotalSalesValue\b/g, 'totalSessionsValue'],
  [/\btotalSales\b/g, 'totalSessions'],
  [/\baverageOrderValue\b/g, 'averageSessionValue'],
  [/\btotalOnlineSalesValue\b/g, 'totalMentorshipValue'],
  [/\btotalOnlineOrdersCount\b/g, 'totalMentorshipCount'],
  [/\btotalRevenue\b/g, 'totalBookingValue'],
  [/\bonlineOrdersQuery\b/g, 'mentorshipBookingsQuery'],
  [/\bisLoadingOrders\b/g, 'isLoadingBookings']
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

console.log('--- Step 2: Running text search & replace in source code ---');
walk(targetDir, (filePath) => {
  const ext = path.extname(filePath);
  if (!['.ts', '.tsx', '.json', '.js', '.mjs'].includes(ext)) return;
  if (filePath.includes('refactor-phase3.js')) return;

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

console.log('--- Step 3: Phase 3 Refactoring Complete ---');
