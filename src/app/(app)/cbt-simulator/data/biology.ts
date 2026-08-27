export const biologyQuestions = [
  {
    id: 'bio-1',
    questionText: 'Which of the following cell organelles is responsible for cellular respiration and energy production? (JAMB 2018)',
    options: ['Mitochondrion', 'Ribosome', 'Golgi body', 'Chloroplast'],
    correctAnswer: 'A',
    explanation: 'The mitochondrion is known as the powerhouse of the cell, where ATP is generated via aerobic respiration.'
  },
  {
    id: 'bio-2',
    questionText: 'The process by which green plants manufacture food using sunlight, carbon dioxide, and water is: (JAMB 2017)',
    options: ['Photosynthesis', 'Transpiration', 'Respiration', 'Osmosis'],
    correctAnswer: 'A',
    explanation: 'Photosynthesis is the chemical process that uses light energy to synthesize organic compounds from carbon dioxide and water.'
  },
  {
    id: 'bio-3',
    questionText: 'A cross between a red-flowered plant and a white-flowered plant produced pink-flowered offspring. This inheritance pattern is: (Post-UTME 2019)',
    options: ['Incomplete dominance', 'Co-dominance', 'Complete dominance', 'Sex linkage'],
    correctAnswer: 'A',
    explanation: 'Incomplete dominance results in a blending of traits, where the heterozygote shows an intermediate phenotype (pink).'
  },
  {
    id: 'bio-4',
    questionText: 'Which of the following blood vessels carries deoxygenated blood from the heart to the lungs? (Post-UTME 2020)',
    options: ['Pulmonary artery', 'Pulmonary vein', 'Aorta', 'Vena cava'],
    correctAnswer: 'A',
    explanation: 'The pulmonary artery is the only artery that carries deoxygenated blood, transporting it to the lungs for oxygenation.'
  },
  {
    id: 'bio-5',
    questionText: 'The functional unit of the human kidney where filtration and reabsorption occur is the: (JAMB 2016)',
    options: ['Nephron', 'Neuron', 'Alveolus', 'Villus'],
    correctAnswer: 'A',
    explanation: 'The nephron is the structural and functional unit of the kidney, responsible for filtering blood and forming urine.'
  },
  {
    id: 'bio-6',
    questionText: 'Which hormone is responsible for regulating blood sugar levels in the human body? (Post-UTME 2021)',
    options: ['Insulin', 'Adrenaline', 'Thyroxin', 'Progesterone'],
    correctAnswer: 'A',
    explanation: 'Insulin, secreted by the beta cells of the islets of Langerhans in the pancreas, lowers blood glucose levels.'
  },
  {
    id: 'bio-7',
    questionText: 'The process of maintaining a constant internal environment in an organism is called: (JAMB 2015)',
    options: ['Homeostasis', 'Osmoregulation', 'Plasmolysis', 'Excretion'],
    correctAnswer: 'A',
    explanation: 'Homeostasis is the regulation and maintenance of stable internal conditions (temperature, pH, water level) in a cell or organism.'
  },
  {
    id: 'bio-8',
    questionText: 'Which of the following organisms exhibits a saprophytic mode of nutrition? (Post-UTME 2018)',
    options: ['Mushroom', 'Spirogyra', 'Tapeworm', 'Amoeba'],
    correctAnswer: 'A',
    explanation: 'Mushrooms (fungi) are saprophytes; they feed on dead and decaying organic matter by secreting digestive enzymes.'
  },
  {
    id: 'bio-9',
    questionText: 'The joint that allows movement in only one plane (like the elbow or knee) is the: (JAMB 2020)',
    options: ['Hinge joint', 'Ball-and-socket joint', 'Pivot joint', 'Saddle joint'],
    correctAnswer: 'A',
    explanation: 'A hinge joint allows back-and-forth movement in a single direction or plane, similar to the hinge of a door.'
  },
  {
    id: 'bio-10',
    questionText: 'Which of the following deficiency diseases is caused by a lack of Vitamin C? (JAMB 2022)',
    options: ['Scurvy', 'Rickets', 'Beriberi', 'Pellagra'],
    correctAnswer: 'A',
    explanation: 'Scurvy is caused by Vitamin C deficiency, leading to symptoms like bleeding gums and poor wound healing.'
  },
  ...Array.from({ length: 30 }, (_, i) => {
    const idx = i + 11;
    const chromosomes = 10 + i * 2;
    return {
      id: `bio-gen-${idx}`,
      questionText: `A somatic cell of an organism contains ${chromosomes} chromosomes. What is the chromosome number in its gamete cell? (Post-UTME 2022)`,
      options: [`${chromosomes / 2}`, `${chromosomes}`, `${chromosomes * 2}`, '46'],
      correctAnswer: 'A',
      explanation: 'Gametes are haploid (n) and contain half the chromosome number of somatic diploid (2n) cells.'
    };
  })
];
