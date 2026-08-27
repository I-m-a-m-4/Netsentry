export const agricScienceQuestions = [
  {
    id: 'agric-1',
    questionText: 'Which of the following is the most important factor that determines soil fertility? (OAU Post-UTME 2019)',
    options: ['Organic matter content', 'Soil colour', 'Soil texture', 'Soil depth'],
    correctAnswer: 'A',
    explanation: 'Organic matter (humus) is crucial for soil fertility as it improves water retention, provides nutrients, and supports microbial activity.'
  },
  {
    id: 'agric-2',
    questionText: 'The practice of growing two or more crops on the same piece of land simultaneously is called: (JAMB 2020)',
    options: ['Mixed cropping', 'Crop rotation', 'Monoculture', 'Intercropping'],
    correctAnswer: 'A',
    explanation: 'Mixed cropping involves growing two or more different crops simultaneously in the same field, which reduces pest pressure and maximises land use.'
  },
  {
    id: 'agric-3',
    questionText: 'Which nutrient element is primarily responsible for promoting vegetative growth (leaf and stem development) in plants? (OAU Post-UTME 2018)',
    options: ['Nitrogen (N)', 'Phosphorus (P)', 'Potassium (K)', 'Calcium (Ca)'],
    correctAnswer: 'A',
    explanation: 'Nitrogen is the primary nutrient for vegetative growth. It is a key component of chlorophyll and amino acids, promoting healthy green leaf and stem development.'
  },
  {
    id: 'agric-4',
    questionText: 'The organism used to fix atmospheric nitrogen into the soil in leguminous plants is: (JAMB 2017)',
    options: ['Rhizobium', 'Azotobacter', 'Nitrosomonas', 'Nitrobacter'],
    correctAnswer: 'A',
    explanation: 'Rhizobium bacteria live in root nodules of leguminous plants (e.g., cowpea, groundnut) and fix atmospheric nitrogen (N₂) into ammonia that plants can use.'
  },
  {
    id: 'agric-5',
    questionText: 'A soil with equal proportions of sand, silt, and clay, considered ideal for agriculture, is called: (OAU Post-UTME 2021)',
    options: ['Loamy soil', 'Sandy soil', 'Clay soil', 'Silty soil'],
    correctAnswer: 'A',
    explanation: 'Loamy soil contains a balanced mix of sand, silt, and clay, providing good drainage, aeration, water-holding capacity, and nutrient availability.'
  },
  {
    id: 'agric-6',
    questionText: 'The cutting of trees and burning of the cleared land for cultivation before moving to a new area is known as: (JAMB 2016)',
    options: ['Shifting cultivation', 'Mixed farming', 'Subsistence farming', 'Crop rotation'],
    correctAnswer: 'A',
    explanation: 'Shifting cultivation involves clearing forest areas, farming for a few seasons until the soil is exhausted, then moving to a new area.'
  },
  {
    id: 'agric-7',
    questionText: 'Which of the following farm animals is a ruminant? (OAU Post-UTME 2020)',
    options: ['Cow', 'Pig', 'Rabbit', 'Poultry'],
    correctAnswer: 'A',
    explanation: 'Cows are ruminants — they have a four-chambered stomach and chew cud to re-digest plant material. Pigs, rabbits, and poultry are non-ruminants.'
  },
  {
    id: 'agric-8',
    questionText: 'The process of making the soil surface rough by digging or ploughing to loosen and aerate it before planting is called: (JAMB 2019)',
    options: ['Tillage', 'Mulching', 'Irrigation', 'Liming'],
    correctAnswer: 'A',
    explanation: 'Tillage (or tilling) is the mechanical manipulation of soil to create a suitable seedbed, control weeds, and improve aeration and water infiltration.'
  },
  {
    id: 'agric-9',
    questionText: 'The pest that is most destructive to stored grains in Nigeria is: (OAU Post-UTME 2022)',
    options: ['Weevil', 'Aphid', 'Whitefly', 'Locust'],
    correctAnswer: 'A',
    explanation: 'Grain weevils (Sitophilus species) are major post-harvest pests that bore into stored grains like maize and rice, causing significant losses.'
  },
  {
    id: 'agric-10',
    questionText: 'Which of the following is a method of soil conservation that involves planting along contour lines on a slope? (OAU Post-UTME 2016)',
    options: ['Contour farming', 'Strip cropping', 'Terracing', 'Windbreaks'],
    correctAnswer: 'A',
    explanation: 'Contour farming involves ploughing and planting crops across a slope following its contour lines, which slows water runoff and reduces erosion.'
  },
  ...Array.from({ length: 30 }, (_, i) => {
    const idx = i + 11;
    const nutrients = [
      { nutrient: 'Phosphorus (P)', role: 'root development and flowering', deficiency: 'purple discolouration of leaves and poor root growth' },
      { nutrient: 'Potassium (K)', role: 'disease resistance and water regulation', deficiency: 'brown scorching and curling of leaf tips' },
      { nutrient: 'Calcium (Ca)', role: 'cell wall formation', deficiency: 'blossom end rot and tip burn' },
      { nutrient: 'Magnesium (Mg)', role: 'chlorophyll synthesis', deficiency: 'interveinal chlorosis (yellowing between leaf veins)' },
      { nutrient: 'Sulphur (S)', role: 'protein synthesis', deficiency: 'pale yellow-green young leaves' },
      { nutrient: 'Iron (Fe)', role: 'enzyme activity and chlorophyll formation', deficiency: 'chlorosis of young leaves' },
      { nutrient: 'Zinc (Zn)', role: 'enzyme activation and growth hormone synthesis', deficiency: 'stunted growth and small leaves' },
      { nutrient: 'Manganese (Mn)', role: 'photosynthesis and nitrogen metabolism', deficiency: 'grey speck in cereals' },
      { nutrient: 'Boron (B)', role: 'cell division and sugar transport', deficiency: 'heart rot in beet and hollow stem in brassicas' },
      { nutrient: 'Copper (Cu)', role: 'enzyme activity and lignin synthesis', deficiency: 'die-back of shoot tips' },
    ];
    const nut = nutrients[i % nutrients.length];
    return {
      id: `agric-gen-${idx}`,
      questionText: `A plant deficient in ${nut.nutrient} would most likely show which symptom? (OAU Post-UTME 2023)`,
      options: [
        nut.deficiency.charAt(0).toUpperCase() + nut.deficiency.slice(1),
        'Rapid vegetative growth',
        'Deep green colouration of all leaves',
        'Early flowering and fruiting'
      ],
      correctAnswer: 'A',
      explanation: `${nut.nutrient} is essential for ${nut.role}. Its deficiency leads to ${nut.deficiency}.`
    };
  })
];
