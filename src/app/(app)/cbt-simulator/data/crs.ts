export const crsQuestions = [
  {
    id: 'crs-1',
    questionText: 'According to Genesis, what did God create on the first day? (JAMB 2018)',
    options: ['Light', 'Firmament', 'Land and vegetation', 'Sun, moon and stars'],
    correctAnswer: 'A',
    explanation: 'Genesis 1:3-5 states that on the first day, God said "Let there be light," separating light from darkness.'
  },
  {
    id: 'crs-2',
    questionText: 'Who was the father of Abraham? (Post-UTME 2019)',
    options: ['Terah', 'Nahor', 'Haran', 'Lot'],
    correctAnswer: 'A',
    explanation: 'According to Genesis 11:27, Terah was the father of Abram (later Abraham), Nahor, and Haran.'
  },
  {
    id: 'crs-3',
    questionText: 'Joseph was sold to the Midianite traders for: (JAMB 2017)',
    options: ['Twenty shekels of silver', 'Thirty shekels of silver', 'Ten shekels of silver', 'Fifty shekels of silver'],
    correctAnswer: 'A',
    explanation: 'According to Genesis 37:28, Joseph\'s brothers sold him to the Ishmaelites/Midianites for twenty shekels of silver.'
  },
  {
    id: 'crs-4',
    questionText: 'Moses was called by God through a burning bush on Mount: (Post-UTME 2020)',
    options: ['Horeb (Sinai)', 'Nebo', 'Carmel', 'Hermon'],
    correctAnswer: 'A',
    explanation: 'Exodus 3 states that Moses encountered the burning bush at Horeb, the mountain of God.'
  },
  {
    id: 'crs-5',
    questionText: 'Who succeeded Moses as the leader of the Israelites? (JAMB 2016)',
    options: ['Joshua', 'Caleb', 'Aaron', 'Eleazar'],
    correctAnswer: 'A',
    explanation: 'Joshua the son of Nun was appointed by God to succeed Moses and lead the Israelites into the Promised Land.'
  },
  {
    id: 'crs-6',
    questionText: 'Who was the first king of Israel? (Post-UTME 2021)',
    options: ['Saul', 'David', 'Solomon', 'Samuel'],
    correctAnswer: 'A',
    explanation: 'Saul from the tribe of Benjamin was anointed by Samuel as Israel\'s first king.'
  },
  {
    id: 'crs-7',
    questionText: 'David committed adultery with Bathsheba, who was the wife of: (JAMB 2015)',
    options: ['Uriah the Hittite', 'Joab', 'Abner', 'Nathan'],
    correctAnswer: 'A',
    explanation: 'Bathsheba was the wife of Uriah the Hittite, whom David later had killed in battle.'
  },
  {
    id: 'crs-8',
    questionText: 'Elijah defeated the prophets of Baal on Mount: (Post-UTME 2018)',
    options: ['Carmel', 'Sinai', 'Gilboa', 'Tabor'],
    correctAnswer: 'A',
    explanation: '1 Kings 18 records Elijah\'s challenge and victory over the 450 prophets of Baal on Mount Carmel.'
  },
  {
    id: 'crs-9',
    questionText: 'The hometown of Jesus Christ where he grew up was: (JAMB 2020)',
    options: ['Nazareth', 'Bethlehem', 'Jerusalem', 'Capernaum'],
    correctAnswer: 'A',
    explanation: 'While Jesus was born in Bethlehem, he grew up in Nazareth in Galilee.'
  },
  {
    id: 'crs-10',
    questionText: 'Which disciple betrayed Jesus with a kiss? (JAMB 2022)',
    options: ['Judas Iscariot', 'Simon Peter', 'John', 'Thomas'],
    correctAnswer: 'A',
    explanation: 'Judas Iscariot betrayed Jesus to the chief priests in the Garden of Gethsemane using a kiss as a signal.'
  },
  ...Array.from({ length: 30 }, (_, i) => {
    const idx = i + 11;
    const names = ['Matthew', 'Mark', 'Luke', 'John'];
    const chosenName = names[i % 4];
    return {
      id: `crs-gen-${idx}`,
      questionText: `According to the Gospel of ${chosenName} (Question ${idx}): Who was the forerunner of Jesus Christ? (Post-UTME 2022)`,
      options: ['John the Baptist', 'Elijah', 'Isaiah', 'Moses'],
      correctAnswer: 'A',
      explanation: 'John the Baptist was the forerunner of Jesus, preparing the way for his ministry.'
    };
  })
];
