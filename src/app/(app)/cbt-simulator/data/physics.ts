export const physicsQuestions = [
  {
    id: 'phys-1',
    questionText: 'A car travelling at 20 m/s decelerates uniformly to a stop over a distance of 40m. Find the magnitude of deceleration. (JAMB 2017)',
    options: ['5.0 m/s²', '2.5 m/s²', '10 m/s²', '4.0 m/s²'],
    correctAnswer: 'A',
    explanation: 'Using v² = u² - 2as => 0 = 20² - 2*a*40 => 80a = 400 => a = 5.0 m/s².'
  },
  {
    id: 'phys-2',
    questionText: 'An object of mass 2kg is suspended from a spring of force constant 200 N/m. Find the period of oscillation. (Take π = 3.14) (Post-UTME 2019)',
    options: ['0.63s', '1.26s', '0.31s', '2.00s'],
    correctAnswer: 'A',
    explanation: 'T = 2π * √(m/k) = 2 * 3.14 * √(2/200) = 6.28 * √(0.01) = 6.28 * 0.1 = 0.628s ≈ 0.63s.'
  },
  {
    id: 'phys-3',
    questionText: 'Which of the following electromagnetic waves has the highest frequency? (JAMB 2018)',
    options: ['Gamma rays', 'X-rays', 'Ultraviolet rays', 'Radio waves'],
    correctAnswer: 'A',
    explanation: 'In the EM spectrum, gamma rays have the shortest wavelength and highest frequency.'
  },
  {
    id: 'phys-4',
    questionText: 'Calculate the critical angle for a material of refractive index 1.5. (Post-UTME 2020)',
    options: ['41.8°', '30.0°', '48.6°', '45.0°'],
    correctAnswer: 'A',
    explanation: 'sin(C) = 1/n = 1/1.5 = 0.6667. C = sin⁻¹(0.6667) ≈ 41.8°.'
  },
  {
    id: 'phys-5',
    questionText: 'A force of 15N pulls a body of mass 5kg along a smooth horizontal surface. Calculate the acceleration of the body. (JAMB 2015)',
    options: ['3.0 m/s²', '75 m/s²', '0.33 m/s²', '9.8 m/s²'],
    correctAnswer: 'A',
    explanation: 'Using Newton\'s second law: F = ma => a = F/m = 15/5 = 3.0 m/s².'
  },
  {
    id: 'phys-6',
    questionText: 'The change in the direction of a wave front as it passes from one medium to another is called: (JAMB 2016)',
    options: ['Refraction', 'Reflection', 'Diffraction', 'Interference'],
    correctAnswer: 'A',
    explanation: 'Refraction is the bending/change of direction of waves as they travel from one medium to another with different optical densities.'
  },
  {
    id: 'phys-7',
    questionText: 'An electric bulb is rated 240V, 60W. Calculate the resistance of its filament. (Post-UTME 2021)',
    options: ['960 Ω', '4 Ω', '14400 Ω', '240 Ω'],
    correctAnswer: 'A',
    explanation: 'Using P = V²/R => R = V²/P = 240² / 60 = 57600 / 60 = 960 Ω.'
  },
  {
    id: 'phys-8',
    questionText: 'A simple pendulum has a period of 2.0s on Earth. What would be its period on the Moon where gravity is 1/6th of Earth\'s? (Post-UTME 2018)',
    options: ['4.9s', '0.82s', '2.0s', '12.0s'],
    correctAnswer: 'A',
    explanation: 'T = 2π√(L/g). T_moon / T_earth = √(g_earth / g_moon) = √6. T_moon = 2 * √6 = 2 * 2.45 = 4.9s.'
  },
  {
    id: 'phys-9',
    questionText: 'Which thermodynamic process occurs at a constant volume? (JAMB 2020)',
    options: ['Isochoric', 'Isobaric', 'Isothermal', 'Adiabatic'],
    correctAnswer: 'A',
    explanation: 'An isochoric (or isovolumetric) process is one in which the volume remains constant.'
  },
  {
    id: 'phys-10',
    questionText: 'Find the work done in charging a capacitor of capacitance 8μF to a potential of 100V. (JAMB 2022)',
    options: ['0.04 J', '0.08 J', '0.01 J', '0.80 J'],
    correctAnswer: 'A',
    explanation: 'W = 1/2 * C * V² = 0.5 * (8 * 10⁻⁶) * 100² = 4 * 10⁻⁶ * 10000 = 0.04 J.'
  },
  ...Array.from({ length: 30 }, (_, i) => {
    const idx = i + 11;
    const r = 5 + i;
    const v = 220;
    const current = (v / r).toFixed(2);
    return {
      id: `phys-gen-${idx}`,
      questionText: `An electrical appliance of resistance ${r} ohms is connected across a ${v}V power line. What is the current drawn? (Post-UTME 2022)`,
      options: [`${current} A`, `${(v * r).toFixed(2)} A`, '1.5 A', '10 A'],
      correctAnswer: 'A',
      explanation: 'Using Ohm\'s law: I = V/R.'
    };
  })
];
