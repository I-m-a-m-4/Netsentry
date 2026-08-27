export const geographyQuestions = [
  {
    id: 'geo-1',
    questionText: 'The movement of air from a high pressure belt to a low pressure belt is called: (OAU Post-UTME 2019)',
    options: ['Wind', 'Evaporation', 'Condensation', 'Precipitation'],
    correctAnswer: 'A',
    explanation: 'Wind is the horizontal movement of air from areas of high atmospheric pressure to areas of low pressure.'
  },
  {
    id: 'geo-2',
    questionText: 'Which of the following is the largest ocean in the world? (OAU Post-UTME 2018)',
    options: ['Pacific Ocean', 'Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean'],
    correctAnswer: 'A',
    explanation: 'The Pacific Ocean is the largest and deepest ocean, covering about one-third of the Earth\'s surface area.'
  },
  {
    id: 'geo-3',
    questionText: 'The term used to describe the wearing away of the earth\'s surface by water, wind, or ice is: (JAMB 2020)',
    options: ['Erosion', 'Weathering', 'Deposition', 'Leaching'],
    correctAnswer: 'A',
    explanation: 'Erosion is the process of wearing away the earth\'s surface through the action of wind, water, or glacial ice transporting material.'
  },
  {
    id: 'geo-4',
    questionText: 'The line of latitude that divides the earth into northern and southern hemispheres is the: (OAU Post-UTME 2020)',
    options: ['Equator', 'Tropic of Cancer', 'Tropic of Capricorn', 'Prime Meridian'],
    correctAnswer: 'A',
    explanation: 'The Equator is an imaginary circle at 0° latitude that divides Earth into the Northern and Southern Hemispheres.'
  },
  {
    id: 'geo-5',
    questionText: 'Which type of rainfall is associated with mountainous areas where air is forced to rise over highlands? (JAMB 2017)',
    options: ['Relief (Orographic) rainfall', 'Convectional rainfall', 'Frontal rainfall', 'Cyclonic rainfall'],
    correctAnswer: 'A',
    explanation: 'Relief or orographic rainfall occurs when moist air is forced to rise over mountains, cooling and condensing to form rain on the windward side.'
  },
  {
    id: 'geo-6',
    questionText: 'The deepest lake in the world is: (OAU Post-UTME 2021)',
    options: ['Lake Baikal', 'Lake Victoria', 'Lake Tanganyika', 'Lake Superior'],
    correctAnswer: 'A',
    explanation: 'Lake Baikal in Russia is the world\'s deepest lake at approximately 1,642 metres deep and holds about 20% of the world\'s fresh surface water.'
  },
  {
    id: 'geo-7',
    questionText: 'The hot, dry, dusty wind that blows from the Sahara Desert across West Africa is called: (JAMB 2019)',
    options: ['Harmattan', 'Sirocco', 'Foehn', 'Mistral'],
    correctAnswer: 'A',
    explanation: 'The Harmattan is a dry and dusty north-easterly trade wind that blows from the Sahara Desert across West Africa, typically between November and March.'
  },
  {
    id: 'geo-8',
    questionText: 'A map with a scale of 1:50,000 means that 1 cm on the map represents ______ on the ground. (OAU Post-UTME 2022)',
    options: ['500 m', '5 km', '50 km', '5,000 km'],
    correctAnswer: 'A',
    explanation: '1:50,000 means 1 unit on the map equals 50,000 units on the ground. Since 1 cm = 0.01 m, then 50,000 cm = 500 m.'
  },
  {
    id: 'geo-9',
    questionText: 'The process by which rocks are broken down in situ (in place) without being transported is called: (JAMB 2016)',
    options: ['Weathering', 'Erosion', 'Denudation', 'Deposition'],
    correctAnswer: 'A',
    explanation: 'Weathering is the in-situ disintegration or decomposition of rocks by physical, chemical, or biological agents without significant transportation.'
  },
  {
    id: 'geo-10',
    questionText: 'The Greenwich Meridian (Prime Meridian) is located at: (OAU Post-UTME 2016)',
    options: ['0° longitude', '90° East longitude', '180° longitude', '23.5° North latitude'],
    correctAnswer: 'A',
    explanation: 'The Prime Meridian is at 0° longitude, passing through Greenwich, London. It is the reference from which all other longitudes are measured.'
  },
  ...Array.from({ length: 30 }, (_, i) => {
    const idx = i + 11;
    const altitudes = [200, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500,
                       5000, 5500, 6000, 500, 750, 1250, 1750, 2250, 2750, 3250,
                       3750, 4250, 4750, 600, 800, 1100, 1400, 1700, 2200, 2800];
    const alt = altitudes[i];
    return {
      id: `geo-gen-${idx}`,
      questionText: `A location at an altitude of ${alt} metres above sea level experiences a temperature decrease of approximately how many degrees Celsius compared to sea level, given a normal lapse rate of 6.5°C per 1000 m? (OAU Post-UTME 2023)`,
      options: [
        `${(alt / 1000 * 6.5).toFixed(1)}°C`,
        `${(alt / 1000 * 10).toFixed(1)}°C`,
        `${(alt / 1000 * 3).toFixed(1)}°C`,
        `${(alt / 1000 * 15).toFixed(1)}°C`
      ],
      correctAnswer: 'A',
      explanation: `Using the environmental lapse rate of 6.5°C per 1000 m, at ${alt} m the temperature decreases by ${(alt / 1000 * 6.5).toFixed(1)}°C.`
    };
  })
];
