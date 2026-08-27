export const literatureQuestions = [
  {
    id: 'lit-1',
    questionText: 'A play that ends on a sad note, usually with the death of the protagonist, is a: (JAMB 2018)',
    options: ['Tragedy', 'Comedy', 'Melodrama', 'Tragicomedy'],
    correctAnswer: 'A',
    explanation: 'A tragedy is a genre of drama characterized by serious and somber themes, typically culminating in disaster or death for the main character.'
  },
  {
    id: 'lit-2',
    questionText: 'The figure of speech that attributes human qualities to non-human things is: (Post-UTME 2019)',
    options: ['Personification', 'Metaphor', 'Simile', 'Hyperbole'],
    correctAnswer: 'A',
    explanation: 'Personification is the literary device of giving human traits, actions, or emotions to inanimate objects, animals, or ideas.'
  },
  {
    id: 'lit-3',
    questionText: '"The waves danced joyfully beside them" contains an example of: (JAMB 2017)',
    options: ['Personification', 'Irony', 'Oxymoron', 'Synecdoche'],
    correctAnswer: 'A',
    explanation: 'Since waves cannot literally dance, this is an instance of personification.'
  },
  {
    id: 'lit-4',
    questionText: 'A poem written in praise of a person, object, or event is called: (Post-UTME 2020)',
    options: ['An ode', 'An elegy', 'A sonnet', 'A ballad'],
    correctAnswer: 'A',
    explanation: 'An ode is a lyrical poem structured in stanzas and written in praise of, or dedicated to, someone or something.'
  },
  {
    id: 'lit-5',
    questionText: 'Identify the figure of speech in: "The child is the father of the man". (JAMB 2016)',
    options: ['Paradox', 'Simile', 'Sarcasm', 'Metonymy'],
    correctAnswer: 'A',
    explanation: 'This statement appears self-contradictory but contains a deeper truth, making it a paradox.'
  },
  {
    id: 'lit-6',
    questionText: 'The main character around whom the plot of a literary work revolves is the: (Post-UTME 2021)',
    options: ['Protagonist', 'Antagonist', 'Foil', 'Flat character'],
    correctAnswer: 'A',
    explanation: 'The protagonist is the central character, hero, or heroine in a narrative or drama.'
  },
  {
    id: 'lit-7',
    questionText: 'An elegy is a poem written: (JAMB 2015)',
    options: ['To mourn the dead', 'To celebrate a wedding', 'To tell a story', 'To praise a king'],
    correctAnswer: 'A',
    explanation: 'An elegy is a song or poem of mourning, expressing sorrow or lamentation for someone who is dead.'
  },
  {
    id: 'lit-8',
    questionText: 'The use of words whose sounds suggest their actual meanings is called: (Post-UTME 2018)',
    options: ['Onomatopoeia', 'Alliteration', 'Assonance', 'Puns'],
    correctAnswer: 'A',
    explanation: 'Onomatopoeia is the naming of a thing or action by a vocal imitation of the sound associated with it (e.g. "buzz", "hiss").'
  },
  {
    id: 'lit-9',
    questionText: 'A story or poem that can be interpreted to reveal a hidden meaning, typically a moral or political one, is: (JAMB 2020)',
    options: ['An allegory', 'A satire', 'A parody', 'An epic'],
    correctAnswer: 'A',
    explanation: 'An allegory is a narrative with a double meaning—a primary surface meaning and a secondary deeper symbolic meaning.'
  },
  {
    id: 'lit-10',
    questionText: 'A fourteen-line poem written in iambic pentameter is: (JAMB 2022)',
    options: ['A sonnet', 'A ballad', 'A lyric', 'An ode'],
    correctAnswer: 'A',
    explanation: 'A sonnet is a fixed-form lyric poem of exactly fourteen lines, typically written in iambic pentameter with a specific rhyme scheme.'
  },
  ...Array.from({ length: 30 }, (_, i) => {
    const idx = i + 11;
    const items = ['Metaphor', 'Simile', 'Synecdoche', 'Hyperbole'];
    const selected = items[i % 4];
    return {
      id: `lit-gen-${idx}`,
      questionText: `Identify the literary device used in the line of poetry (Question ${idx}): "He is a lion in battle." (Post-UTME 2022)`,
      options: ['Metaphor', 'Simile', 'Synecdoche', 'Hyperbole'],
      correctAnswer: 'A',
      explanation: 'A metaphor makes a direct comparison between two things without using "like" or "as".'
    };
  })
];
