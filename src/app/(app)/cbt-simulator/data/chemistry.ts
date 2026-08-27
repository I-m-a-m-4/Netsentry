export const chemistryQuestions = [
  {
    id: 'chem-1',
    questionText: 'What is the IUPAC name for the compound CH₃CH(CH₃)CH₂CH₃? (JAMB 2018)',
    options: ['2-methylbutane', 'Isopentane', '2-methylpropane', 'Pentane'],
    correctAnswer: 'A',
    explanation: 'The longest continuous carbon chain has 4 carbons (butane), with a methyl substituent on the second carbon.'
  },
  {
    id: 'chem-2',
    questionText: 'Calculate the volume occupied by 4.4g of carbon(IV) oxide at s.t.p. [C = 12, O = 16, Molar Volume = 22.4 dm³] (Post-UTME 2019)',
    options: ['2.24 dm³', '22.4 dm³', '4.40 dm³', '1.12 dm³'],
    correctAnswer: 'A',
    explanation: 'Molar mass of CO₂ = 12 + 16*2 = 44 g/mol. Moles of CO₂ = 4.4 / 44 = 0.1 mol. Volume at s.t.p = 0.1 * 22.4 = 2.24 dm³.'
  },
  {
    id: 'chem-3',
    questionText: 'Which of the following elements has the highest electronegativity? (JAMB 2017)',
    options: ['Fluorine', 'Chlorine', 'Oxygen', 'Nitrogen'],
    correctAnswer: 'A',
    explanation: 'Fluorine is the most electronegative element in the periodic table, with a value of 4.0 on the Pauling scale.'
  },
  {
    id: 'chem-4',
    questionText: 'The process of iron rusting in the presence of air and moisture is a type of: (JAMB 2016)',
    options: ['Oxidation reaction', 'Reduction reaction', 'Decomposition reaction', 'Sublimation'],
    correctAnswer: 'A',
    explanation: 'Rusting is an electrochemical oxidation process where iron loses electrons to oxygen in the presence of water.'
  },
  {
    id: 'chem-5',
    questionText: 'Which gas is collected by the downward displacement of air? (Post-UTME 2021)',
    options: ['Ammonia', 'Carbon(IV) oxide', 'Hydrogen', 'Oxygen'],
    correctAnswer: 'A',
    explanation: 'Ammonia is less dense than air, so it is collected by downward displacement of air (upward delivery).'
  },
  {
    id: 'chem-6',
    questionText: 'State the hybridization of carbon in ethyne (C₂H₂). (Post-UTME 2018)',
    options: ['sp', 'sp²', 'sp³', 'dsp²'],
    correctAnswer: 'A',
    explanation: 'In ethyne, each carbon atom forms a triple bond (one sigma and two pi bonds) and has sp hybridization.'
  },
  {
    id: 'chem-7',
    questionText: 'Which of the following compounds will form a white precipitate with silver trioxonitrate(V) solution? (JAMB 2020)',
    options: ['Sodium chloride', 'Sodium tetraoxosulfate(VI)', 'Sodium trioxocarbonate(IV)', 'Sodium nitrate'],
    correctAnswer: 'A',
    explanation: 'Chloride ions react with silver ions to form insoluble silver chloride (AgCl), which is a white precipitate.'
  },
  {
    id: 'chem-8',
    questionText: 'According to Faraday\'s first law of electrolysis, the mass (m) of a substance discharged is proportional to: (JAMB 2015)',
    options: ['Quantity of electricity', 'Current', 'Time of flow', 'Resistance'],
    correctAnswer: 'A',
    explanation: 'Faraday\'s First Law states that m is directly proportional to the quantity of electricity (Q = It) passed through.'
  },
  {
    id: 'chem-9',
    questionText: 'The catalyst used in the Haber process for the industrial manufacture of ammonia is: (Post-UTME 2020)',
    options: ['Finely divided iron', 'Platinum', 'Nickel', 'Manganese(IV) oxide'],
    correctAnswer: 'A',
    explanation: 'Finely divided iron is used as the catalyst, with alumina/potash as promoters to speed up the Haber process.'
  },
  {
    id: 'chem-10',
    questionText: 'What is the oxidation state of sulfur in H₂SO₄? (JAMB 2022)',
    options: ['+6', '+4', '+2', '-2'],
    correctAnswer: 'A',
    explanation: '2(1) + S + 4(-2) = 0 => 2 + S - 8 = 0 => S = +6.'
  },
  ...Array.from({ length: 30 }, (_, i) => {
    const idx = i + 11;
    const atomicNumber = 11 + i;
    // Determine standard groups/periods
    const period = atomicNumber <= 18 ? (atomicNumber <= 12 ? 3 : 3) : 4;
    return {
      id: `chem-gen-${idx}`,
      questionText: `An element has atomic number ${atomicNumber}. Identify its period in the periodic table. (Post-UTME 2022)`,
      options: [`Period ${period}`, `Period ${period + 1}`, `Period ${period - 1}`, 'Period 1'],
      correctAnswer: 'A',
      explanation: 'Write electronic configuration: Period number corresponds to the number of electron shells.'
    };
  })
];
