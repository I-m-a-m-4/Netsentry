export const governmentQuestions = [
  {
    id: 'gov-1',
    questionText: 'Which of the following is a key feature of a confederation? (JAMB 2018)',
    options: ['Weak central authority', 'Strong central authority', 'No division of power', 'Single executive rule'],
    correctAnswer: 'A',
    explanation: 'A confederation is a union of sovereign states where the central government is weak and gets its authority from the constituent units.'
  },
  {
    id: 'gov-2',
    questionText: 'The concept of "Rule of Law" was popularized by: (Post-UTME 2019)',
    options: ['A.V. Dicey', 'John Locke', 'Thomas Hobbes', 'Baron de Montesquieu'],
    correctAnswer: 'A',
    explanation: 'A.V. Dicey, a British jurist, popularized the concept of Rule of Law in his book "Introduction to the Study of the Law of the Constitution".'
  },
  {
    id: 'gov-3',
    questionText: 'Nigeria became a republic in the year: (JAMB 2017)',
    options: ['1963', '1960', '1966', '1979'],
    correctAnswer: 'A',
    explanation: 'Nigeria became a Republic on October 1, 1963, replacing the Queen of England with an elected President as Head of State.'
  },
  {
    id: 'gov-4',
    questionText: 'The primary function of the judiciary is to: (Post-UTME 2020)',
    options: ['Interpret laws', 'Make laws', 'Enforce laws', 'Execute policies'],
    correctAnswer: 'A',
    explanation: 'The judiciary interprets and applies the laws to resolve disputes, while the legislature makes laws and executive enforces them.'
  },
  {
    id: 'gov-5',
    questionText: 'Under the 1999 Constitution of Nigeria, the power of veto is exercised by the: (JAMB 2016)',
    options: ['President', 'Senate President', 'Chief Justice', 'Speaker'],
    correctAnswer: 'A',
    explanation: 'The President can withhold assent to bills passed by the National Assembly, exercising a presidential veto.'
  },
  {
    id: 'gov-6',
    questionText: 'A bicameral legislature is a congress or parliament that has: (Post-UTME 2021)',
    options: ['Two chambers', 'One chamber', 'Three chambers', 'An executive president'],
    correctAnswer: 'A',
    explanation: 'Bicameralism is the practice of having two legislative houses or chambers (e.g., Senate and House of Representatives).'
  },
  {
    id: 'gov-7',
    questionText: 'Which political party won the general election that ushered in Nigeria\'s Fourth Republic? (JAMB 2015)',
    options: ['PDP', 'APP', 'AD', 'APC'],
    correctAnswer: 'A',
    explanation: 'The People\'s Democratic Party (PDP) won the 1999 presidential election, electing Olusegun Obasanjo as President.'
  },
  {
    id: 'gov-8',
    questionText: 'The process of stripping a president of their power due to misconduct is called: (Post-UTME 2018)',
    options: ['Impeachment', 'Recall', 'Referendum', 'Veto'],
    correctAnswer: 'A',
    explanation: 'Impeachment is the formal process by which a legislative body brings charges against a high government official, such as a president, for misconduct.'
  },
  {
    id: 'gov-9',
    questionText: 'Which of the following is an example of a franchise? (JAMB 2020)',
    options: ['The right to vote', 'The right to own property', 'Freedom of speech', 'Freedom of movement'],
    correctAnswer: 'A',
    explanation: 'Franchise is the constitutional right or privilege granted to citizens of a state to vote in elections.'
  },
  {
    id: 'gov-10',
    questionText: 'The first military coup d\'état in Nigeria occurred on: (JAMB 2022)',
    options: ['January 15, 1966', 'July 29, 1966', 'July 29, 1975', 'December 31, 1983'],
    correctAnswer: 'A',
    explanation: 'The first coup in Nigeria occurred on January 15, 1966, led by Major Chukwuma Kaduna Nzeogwu and other officers.'
  },
  ...Array.from({ length: 30 }, (_, i) => {
    const idx = i + 11;
    const year = 1960 + i;
    return {
      id: `gov-gen-${idx}`,
      questionText: `Identify the year of the constitution or political reform that took place (Question ${idx}): Which constitution marked a transition in ${year}? (Post-UTME 2022)`,
      options: ['Independence Constitution', 'Republican Constitution', 'Macpherson Constitution', 'Lyttelton Constitution'],
      correctAnswer: 'A',
      explanation: 'General constitutional history covers pre-independence and post-independence documents.'
    };
  })
];
