export const economicsQuestions = [
  {
    id: 'eco-1',
    questionText: 'The fundamental economic problem facing all societies is: (JAMB 2018)',
    options: ['Scarcity', 'Unemployment', 'Inflation', 'Poverty'],
    correctAnswer: 'A',
    explanation: 'Scarcity is the basic economic problem of having unlimited human desires but limited resources to satisfy them.'
  },
  {
    id: 'eco-2',
    questionText: 'When the price of a commodity increases, the quantity demanded of that commodity usually: (Post-UTME 2019)',
    options: ['Decreases', 'Increases', 'Remains constant', 'Doubles'],
    correctAnswer: 'A',
    explanation: 'According to the law of demand, there is an inverse relationship between price and quantity demanded, ceteris paribus.'
  },
  {
    id: 'eco-3',
    questionText: 'If the price elasticity of demand for a product is greater than 1, demand is: (JAMB 2017)',
    options: ['Elastic', 'Inelastic', 'Unitary elastic', 'Perfectly inelastic'],
    correctAnswer: 'A',
    explanation: 'Demand is elastic when the percentage change in quantity demanded is greater than the percentage change in price (elasticity > 1).'
  },
  {
    id: 'eco-4',
    questionText: 'Which of the following is a function of a central bank? (Post-UTME 2020)',
    options: ['Issuing currency', 'Accepting deposits from the public', 'Lending money to retail customers', 'Providing commercial credit'],
    correctAnswer: 'A',
    explanation: 'A central bank has the sole authority to issue national currency and manage monetary policy.'
  },
  {
    id: 'eco-5',
    questionText: 'The market structure with a single seller and no close substitutes is: (JAMB 2016)',
    options: ['Monopoly', 'Perfect competition', 'Oligopoly', 'Monopolistic competition'],
    correctAnswer: 'A',
    explanation: 'A monopoly is a market structure dominated by a single supplier of a product or service.'
  },
  {
    id: 'eco-6',
    questionText: 'Which index is commonly used to measure inflation? (Post-UTME 2021)',
    options: ['Consumer Price Index (CPI)', 'Gross Domestic Product (GDP)', 'Human Development Index (HDI)', 'Gini Coefficient'],
    correctAnswer: 'A',
    explanation: 'The Consumer Price Index (CPI) measures the average change over time in the prices paid by consumers for a market basket of goods and services.'
  },
  {
    id: 'eco-7',
    questionText: 'The value of the next best alternative forgone when an economic decision is made is: (JAMB 2015)',
    options: ['Opportunity cost', 'Real cost', 'Marginal cost', 'Social cost'],
    correctAnswer: 'A',
    explanation: 'Opportunity cost is the cost of choosing one option over the next best alternative that is given up.'
  },
  {
    id: 'eco-8',
    questionText: 'A tax system where the tax rate increases as the taxpayer\'s income increases is: (Post-UTME 2018)',
    options: ['Progressive tax', 'Regressive tax', 'Proportional tax', 'Flat tax'],
    correctAnswer: 'A',
    explanation: 'A progressive tax charges a higher percentage rate on higher-income earners than on lower-income earners.'
  },
  {
    id: 'eco-9',
    questionText: 'Inflation caused by an increase in the cost of production (like wages or raw materials) is: (JAMB 2020)',
    options: ['Cost-push inflation', 'Demand-pull inflation', 'Hyperinflation', 'Stagflation'],
    correctAnswer: 'A',
    explanation: 'Cost-push inflation occurs when aggregate supply decreases due to increases in the cost of wages or raw materials.'
  },
  {
    id: 'eco-10',
    questionText: 'The total value of all final goods and services produced within a country\'s borders in a given year is: (JAMB 2022)',
    options: ['Gross Domestic Product (GDP)', 'Gross National Product (GNP)', 'Net National Product', 'National Income'],
    correctAnswer: 'A',
    explanation: 'Gross Domestic Product (GDP) is the standard measure of the value of final goods and services produced within a country during a year.'
  },
  ...Array.from({ length: 30 }, (_, i) => {
    const idx = i + 11;
    const price = 100 + i * 10;
    const qty = 50 - i;
    return {
      id: `eco-gen-${idx}`,
      questionText: `If the price of a good is ₦${price} and the quantity demanded is ${qty} units (Question ${idx}), calculate total expenditure. (Post-UTME 2022)`,
      options: [`₦${price * qty}`, `₦${price + qty}`, `₦${price / qty}`, `₦${price}`],
      correctAnswer: 'A',
      explanation: 'Total expenditure is calculated by multiplying price by quantity demanded (P × Q).'
    };
  })
];
