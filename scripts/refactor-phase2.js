const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'src');

const replacements = [
  // Types & Interfaces
  [/\bBusinessAnalysisOutput\b/g, 'AcademyAnalysisOutput'],
  [/\bBusinessAnalysisInput\b/g, 'AcademyAnalysisInput'],
  [/\bCustomerInsightsInput\b/g, 'StudentInsightsInput'],
  [/\bCustomerInsightsOutput\b/g, 'StudentInsightsOutput'],
  [/\bProductTroubleshootInput\b/g, 'SubjectTroubleshootInput'],
  [/\bProductTroubleshootOutput\b/g, 'SubjectTroubleshootOutput'],

  // Flow imports & file/variable names
  [/\bbusiness-analysis-flow\b/g, 'academy-analysis-flow'],
  [/\bbusiness-analysis-types\b/g, 'academy-analysis-types'],
  [/\bcustomer-insights-flow\b/g, 'student-insights-flow'],
  [/\bcustomer-insights-types\b/g, 'student-insights-types'],
  [/\bproduct-troubleshoot-flow\b/g, 'subject-troubleshoot-flow'],
  [/\bbusiness-health-indicator\b/g, 'academy-health-indicator'],

  // Function & class references
  [/\bbusinessAnalysis\b/g, 'academyAnalysis'],
  [/\bBusinessAnalysisInputSchema\b/g, 'AcademyAnalysisInputSchema'],
  [/\bBusinessAnalysisOutputSchema\b/g, 'AcademyAnalysisOutputSchema'],
  [/\bbusinessAnalysisFlow\b/g, 'academyAnalysisFlow'],
  [/\bbusinessAnalysisPrompt\b/g, 'academyAnalysisPrompt'],
  [/\bgetCustomerInsights\b/g, 'getStudentInsights'],
  [/\bCustomerInsightsInputSchema\b/g, 'StudentInsightsInputSchema'],
  [/\bCustomerInsightsOutputSchema\b/g, 'StudentInsightsOutputSchema'],
  [/\bcustomerInsightsFlow\b/g, 'studentInsightsFlow'],
  [/\bcustomerInsightsPrompt\b/g, 'studentInsightsPrompt'],
  [/\bproductTroubleshoot\b/g, 'subjectTroubleshoot'],
  [/\bProductTroubleshootInputSchema\b/g, 'SubjectTroubleshootInputSchema'],
  [/\bProductTroubleshootOutputSchema\b/g, 'SubjectTroubleshootOutputSchema'],
  [/\bproductTroubleshootFlow\b/g, 'subjectTroubleshootFlow'],
  [/\bproductTroubleshootPrompt\b/g, 'subjectTroubleshootPrompt'],
  [/\bBusinessHealthIndicator\b/g, 'AcademyHealthIndicator'],

  // Context syncing & query variables
  [/\bisFullSyncingCustomers\b/g, 'isFullSyncingStudents'],
  [/\bisFullSyncingProducts\b/g, 'isFullSyncingSubjects'],
  [/\bisFullSyncingReceipts\b/g, 'isFullSyncingAdmissions'],
  [/\bsyncedProducts\b/g, 'syncedSubjects'],
  [/\bsyncedCustomers\b/g, 'syncedStudents'],
  [/\bsyncedReceipts\b/g, 'syncedAdmissions'],
  [/\bsyncedUsers\b/g, 'syncedStudentProfiles'],
  [/\bsyncedAuditLogs\b/g, 'syncedActivityLogs'],
  [/\bcustomersQuery\b/g, 'studentsQuery'],
  [/\binitialCustomers\b/g, 'initialStudents'],
  [/\bisLoadingCustomers\b/g, 'isLoadingStudents'],
  [/\bmutateCustomers\b/g, 'mutateStudents'],
  [/\bcustomersCount\b/g, 'studentsCount'],
  [/\brealTotalCustomers\b/g, 'realTotalStudents'],
  [/\bfetchFullCustomers\b/g, 'fetchFullStudents'],
  [/\bcustomerActions\b/g, 'studentActions'],
  [/\binitialProducts\b/g, 'initialSubjects'],
  [/\bisLoadingProducts\b/g, 'isLoadingSubjects'],
  [/\bmutateProducts\b/g, 'mutateSubjects'],
  [/\bproductsQuery\b/g, 'subjectsQuery'],
  [/\bfetchFullProducts\b/g, 'fetchFullSubjects'],
  [/\binitialReceipts\b/g, 'initialAdmissions'],
  [/\bisLoadingReceipts\b/g, 'isLoadingAdmissions'],
  [/\bmutateReceipts\b/g, 'mutateAdmissions'],
  [/\breceiptsQuery\b/g, 'admissionsQuery'],
  [/\bfetchInitialReceipts\b/g, 'fetchInitialAdmissions'],
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

console.log('--- Phase 2 Refactoring ---');
walk(targetDir, (filePath) => {
  const ext = path.extname(filePath);
  if (!['.ts', '.tsx', '.json', '.js', '.mjs'].includes(ext)) return;
  if (filePath.includes('refactor-phase2.js')) return;

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

console.log('--- Refactoring Complete ---');
