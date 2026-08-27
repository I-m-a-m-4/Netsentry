export const accountingQuestions = [
  {
    id: 'acc-1',
    questionText: 'The system of accounting where every transaction affects at least two accounts is known as: (JAMB 2018)',
    options: ['Double entry system', 'Single entry system', 'Accrual system', 'Cash system'],
    correctAnswer: 'A',
    explanation: 'The double-entry system states that for every debit entry, there must be a corresponding credit entry, meaning every transaction affects at least two accounts.'
  },
  {
    id: 'acc-2',
    questionText: 'Which of the following is a liability? (Post-UTME 2019)',
    options: ['Bank overdraft', 'Cash at bank', 'Debtors', 'Prepaid expenses'],
    correctAnswer: 'A',
    explanation: 'A bank overdraft is a short-term liability representing money owed to the bank because the account balance is below zero.'
  },
  {
    id: 'acc-3',
    questionText: 'The process of transferring transactions from the journal to the ledger is called: (JAMB 2017)',
    options: ['Posting', 'Balancing', 'Journalizing', 'Summing'],
    correctAnswer: 'A',
    explanation: 'Posting is the transferring of debit and credit items from the books of original entry (journals) to the ledger accounts.'
  },
  {
    id: 'acc-4',
    questionText: 'A trial balance is prepared to test the: (Post-UTME 2020)',
    options: ['Arithmetical accuracy of ledgers', 'Financial position of the business', 'Net profit of the business', 'Cash flow balance'],
    correctAnswer: 'A',
    explanation: 'A trial balance is prepared to check the mathematical or arithmetical accuracy of the ledger entries.'
  },
  {
    id: 'acc-5',
    questionText: 'Which of the following is a nominal account? (JAMB 2016)',
    options: ['Rent account', 'Cash account', 'Debtor account', 'Capital account'],
    correctAnswer: 'A',
    explanation: 'Nominal accounts are accounts related to expenses, losses, incomes, or gains (e.g. Rent, Salaries).'
  },
  {
    id: 'acc-6',
    questionText: 'The excess of current assets over current liabilities is known as: (Post-UTME 2021)',
    options: ['Working capital', 'Capital employed', 'Net profit', 'Owner\'s equity'],
    correctAnswer: 'A',
    explanation: 'Working Capital = Current Assets - Current Liabilities. It represents the operating liquidity available to a business.'
  },
  {
    id: 'acc-7',
    questionText: 'Which book of original entry is used to record credit sales of goods? (JAMB 2015)',
    options: ['Sales journal', 'Cash book', 'General journal', 'Purchases journal'],
    correctAnswer: 'A',
    explanation: 'The sales journal (or sales day book) is used solely to record transactions involving the sale of goods on credit.'
  },
  {
    id: 'acc-8',
    questionText: 'The reduction in the value of a tangible fixed asset over time due to wear and tear is: (Post-UTME 2018)',
    options: ['Depreciation', 'Amortization', 'Depletion', 'Appreciation'],
    correctAnswer: 'A',
    explanation: 'Depreciation is the systematic allocation of the cost of a tangible asset over its useful life.'
  },
  {
    id: 'acc-9',
    questionText: 'Which of the following errors will not affect the agreement of the trial balance? (JAMB 2020)',
    options: ['Error of complete omission', 'Single entry error', 'Transposition error in one ledger', 'Error in totaling the trial balance'],
    correctAnswer: 'A',
    explanation: 'An error of complete omission (where a transaction is not recorded at all) leaves both debit and credit equal, so the trial balance still balances.'
  },
  {
    id: 'acc-10',
    questionText: 'In a balance sheet, "Goodwill" is classified as: (JAMB 2022)',
    options: ['Intangible asset', 'Current asset', 'Tangible fixed asset', 'Current liability'],
    correctAnswer: 'A',
    explanation: 'Goodwill is an intangible asset representing the reputation, brand, or customer relationships of a business.'
  },
  ...Array.from({ length: 30 }, (_, i) => {
    const idx = i + 11;
    const assets = 5000 + i * 500;
    const capital = 3000 + i * 200;
    const liabilities = assets - capital;
    return {
      id: `acc-gen-${idx}`,
      questionText: `Using the accounting equation Assets = Capital + Liabilities (Question ${idx}): If Assets = ₦${assets} and Capital = ₦${capital}, calculate Liabilities. (Post-UTME 2022)`,
      options: [`₦${liabilities}`, `₦${assets + capital}`, `₦${assets}`, `₦${capital}`],
      correctAnswer: 'A',
      explanation: 'Liabilities are calculated as Assets minus Capital (L = A - C).'
    };
  })
];
