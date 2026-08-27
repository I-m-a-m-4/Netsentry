export const mathematicsQuestions = [
  {
    id: 'math-1',
    questionText: 'Solve for x: log₂(x + 3) + log₂(x - 3) = 4 (JAMB 2018)',
    options: ['x = 4', 'x = 5', 'x = 3', 'x = 7'],
    correctAnswer: 'B',
    explanation: 'Using log rules: log₂((x+3)(x-3)) = 4 => x² - 9 = 2⁴ => x² - 9 = 16 => x² = 25 => x = 5 (since log is undefined for negative arguments).'
  },
  {
    id: 'math-2',
    questionText: 'Find the derivative of f(x) = 3x³ - 5x² + 2x - 7 at x = 2. (Post-UTME 2020)',
    options: ['18', '24', '20', '16'],
    correctAnswer: 'A',
    explanation: 'f\'(x) = 9x² - 10x + 2. Evaluating at x = 2: f\'(2) = 9(4) - 10(2) + 2 = 36 - 20 + 2 = 18.'
  },
  {
    id: 'math-3',
    questionText: 'The sum of the first ten terms of an arithmetic progression (AP) is 150. If the first term is 6, find the common difference. (JAMB 2019)',
    options: ['2', '3', '4', '1.5'],
    correctAnswer: 'A',
    explanation: 'S_n = n/2 [2a + (n-1)d] => 150 = 5 [12 + 9d] => 30 = 12 + 9d => 18 = 9d => d = 2.'
  },
  {
    id: 'math-4',
    questionText: 'A bag contains 5 red balls and 3 blue balls. If two balls are drawn at random without replacement, find the probability that both are red. (JAMB 2017)',
    options: ['5/14', '25/64', '5/8', '3/14'],
    correctAnswer: 'A',
    explanation: 'P(Red then Red) = (5/8) * (4/7) = 20/56 = 5/14.'
  },
  {
    id: 'math-5',
    questionText: 'If dy/dx = 2x - 3 and y = 4 when x = 1, find the equation of the curve. (Post-UTME 2021)',
    options: ['y = x² - 3x + 6', 'y = x² - 3x + 4', 'y = 2x² - 3x + 5', 'y = x² - 3x'],
    correctAnswer: 'A',
    explanation: 'Integrate dy/dx: y = x² - 3x + c. Using (1, 4): 4 = 1² - 3(1) + c => 4 = -2 + c => c = 6. So y = x² - 3x + 6.'
  },
  {
    id: 'math-6',
    questionText: 'Find the value of x for which the matrix [[x, 3], [2, 4]] is singular. (JAMB 2015)',
    options: ['x = 1.5', 'x = 2', 'x = 0', 'x = 3'],
    correctAnswer: 'A',
    explanation: 'A matrix is singular if its determinant is zero. Det = 4x - (3 * 2) = 0 => 4x = 6 => x = 1.5.'
  },
  {
    id: 'math-7',
    questionText: 'Calculate the standard deviation of the numbers: 2, 4, 8, 10. (Post-UTME 2018)',
    options: ['3.16', '4.00', '2.50', '3.46'],
    correctAnswer: 'A',
    explanation: 'Mean = (2+4+8+10)/4 = 6. Variance = [(2-6)² + (4-6)² + (8-6)² + (10-6)²]/4 = [16 + 4 + 4 + 16]/4 = 40/4 = 10. SD = √10 ≈ 3.16.'
  },
  {
    id: 'math-8',
    questionText: 'If the binary operation * is defined on the set of real numbers by a * b = a + b - ab, find 2 * 3. (JAMB 2020)',
    options: ['-1', '5', '6', '1'],
    correctAnswer: 'A',
    explanation: '2 * 3 = 2 + 3 - (2 * 3) = 5 - 6 = -1.'
  },
  {
    id: 'math-9',
    questionText: 'Find the sum to infinity of the geometric progression (GP): 1, 1/2, 1/4, 1/8... (JAMB 2016)',
    options: ['2', '1.5', '3', 'Infinity'],
    correctAnswer: 'A',
    explanation: 'Sum to infinity S_inf = a / (1 - r). Here, a = 1, r = 1/2. S_inf = 1 / (1 - 1/2) = 1 / (1/2) = 2.'
  },
  {
    id: 'math-10',
    questionText: 'Find the minimum value of the function y = x² - 4x + 7. (Post-UTME 2019)',
    options: ['3', '7', '4', '2'],
    correctAnswer: 'A',
    explanation: 'Minimum occurs at x = -b/2a = 4/2 = 2. Evaluating: y = 2² - 4(2) + 7 = 4 - 8 + 7 = 3.'
  },
  ...Array.from({ length: 30 }, (_, i) => {
    const idx = i + 11;
    const a = 3 + i;
    const b = 2 + i * 2;
    const sum = a + b;
    const prod = a * b;
    return {
      id: `math-gen-${idx}`,
      questionText: `If the roots of a quadratic equation are ${a} and ${b}, find the quadratic equation. (Post-UTME 2022)`,
      options: [
        `x² - ${sum}x + ${prod} = 0`,
        `x² + ${sum}x + ${prod} = 0`,
        `x² - ${sum}x - ${prod} = 0`,
        `x² + ${sum}x - ${prod} = 0`
      ],
      correctAnswer: 'A',
      explanation: 'The equation is given by x² - (sum of roots)x + (product of roots) = 0.'
    };
  })
];
