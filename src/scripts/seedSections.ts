import 'module-alias/register';
import mongoose from 'mongoose';
import { config } from '@/config';
import { Test } from '@/models/Test';
import { Question } from '@/models/Question';

async function seedData() {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('✅ Connected to MongoDB');

    // Clean existing data
    await Test.deleteMany({});
    await Question.deleteMany({});
    console.log('🧹 Cleaned existing data');

    // Create Test
    const test = await Test.create({
      name: 'JEE Main 2024 - Full Mock Test',
      description: 'Complete mock test with Physics, Chemistry, and Mathematics sections',
      category: 'JEE',
      subject: 'General',
      testType: 'full',
      difficulty: 'hard',
      duration: 180,
      totalQuestions: 75,
      totalMarks: 300,
      passingMarks: 120,
      negativeMarks: 1,
      isActive: true,
      isPremium: false,
      price: 0,
      tags: ['jee', 'mock', 'full-test'],
    });
    console.log('✅ Test created:', test.name);

    // Physics Questions
    const physicsQuestions = [
      {
        testId: test._id,

        text: 'A ball is thrown vertically upward with velocity 20 m/s. What is the maximum height reached? (g = 10 m/s²)',
        type: 'mcq',
        category: 'JEE',
        subject: 'Physics',
        section: 'Physics',
        sectionName: 'Physics',
        topic: 'Kinematics',
        difficulty: 'easy',
        marks: 4,
        negativeMarks: 1,
        options: [
          { label: 'A', text: '10 m' },
          { label: 'B', text: '20 m' },
          { label: 'C', text: '30 m' },
          { label: 'D', text: '40 m' },
        ],
        correctAnswer: 'B',
        explanation: 'Using v² = u² - 2gh, at maximum height v = 0. So 0 = 400 - 2(10)h, h = 20 m',
        isActive: true,
      },
      {
        testId: test._id,

        text: 'The escape velocity from Earth is 11.2 km/s. What is the escape velocity from a planet of mass 2M and radius 2R (where M and R are Earth\'s mass and radius)?',
        type: 'mcq',
        category: 'JEE',
        subject: 'Physics',
        section: 'Physics',
        sectionName: 'Physics',
        topic: 'Gravitation',
        difficulty: 'medium',
        marks: 4,
        negativeMarks: 1,
        options: [
          { label: 'A', text: '5.6 km/s' },
          { label: 'B', text: '11.2 km/s' },
          { label: 'C', text: '15.8 km/s' },
          { label: 'D', text: '22.4 km/s' },
        ],
        correctAnswer: 'B',
        explanation: 'Escape velocity = √(2GM/R). For planet: √(2G(2M)/(2R)) = √(2GM/R) = 11.2 km/s',
        isActive: true,
      },
      {
        testId: test._id,

        text: 'A wave is described by y = 0.02 sin(10πt - πx/2). The wavelength is:',
        type: 'mcq',
        category: 'JEE',
        subject: 'Physics',
        section: 'Physics',
        sectionName: 'Physics',
        topic: 'Waves',
        difficulty: 'medium',
        marks: 4,
        negativeMarks: 1,
        options: [
          { label: 'A', text: '2 m' },
          { label: 'B', text: '4 m' },
          { label: 'C', text: '6 m' },
          { label: 'D', text: '8 m' },
        ],
        correctAnswer: 'B',
        explanation: 'Wave number k = π/2, so λ = 2π/k = 2π/(π/2) = 4 m',
        isActive: true,
      },
      {
        testId: test._id,

        text: 'Two charges +q and -q are separated by distance 2a. Find the electric field at point P on the perpendicular bisector at distance d from the center.',
        type: 'mcq',
        category: 'JEE',
        subject: 'Physics',
        section: 'Physics',
        sectionName: 'Physics',
        topic: 'Electrostatics',
        difficulty: 'hard',
        marks: 4,
        negativeMarks: 1,
        options: [
          { label: 'A', text: 'E = kq·2a/(a² + d²)^(3/2)' },
          { label: 'B', text: 'E = kq·2d/(a² + d²)^(3/2)' },
          { label: 'C', text: 'E = 0' },
          { label: 'D', text: 'E = kq/d²' },
        ],
        correctAnswer: 'A',
        explanation: 'This is an electric dipole. The perpendicular components cancel, and the parallel components add up to give E = kq·2a/(a² + d²)^(3/2)',
        isActive: true,
      },
      {
        testId: test._id,

        text: 'A capacitor is connected to a battery through a resistance. If the battery voltage is V, what fraction of the maximum charge is stored after 1 time constant τ?',
        type: 'mcq',
        category: 'JEE',
        subject: 'Physics',
        section: 'Physics',
        sectionName: 'Physics',
        topic: 'Circuits',
        difficulty: 'medium',
        marks: 4,
        negativeMarks: 1,
        options: [
          { label: 'A', text: '0.368' },
          { label: 'B', text: '0.632' },
          { label: 'C', text: '0.736' },
          { label: 'D', text: '0.865' },
        ],
        correctAnswer: 'B',
        explanation: 'Q(t) = Q_max(1 - e^(-t/τ)). At t = τ, Q = Q_max(1 - e^(-1)) = Q_max(1 - 0.368) = 0.632·Q_max',
        isActive: true,
      },
    ];

    // Chemistry Questions
    const chemistryQuestions = [
      {
        testId: test._id,

        text: 'What is the pH of a 0.01 M HCl solution?',
        type: 'mcq',
        category: 'JEE',
        subject: 'Chemistry',
        section: 'Chemistry',
        sectionName: 'Chemistry',
        topic: 'Acid-Base Equilibrium',
        difficulty: 'easy',
        marks: 4,
        negativeMarks: 1,
        options: [
          { label: 'A', text: '1' },
          { label: 'B', text: '2' },
          { label: 'C', text: '3' },
          { label: 'D', text: '4' },
        ],
        correctAnswer: 'B',
        explanation: 'HCl is a strong acid and completely ionizes. [H+] = 0.01 M = 10^(-2). pH = -log[H+] = 2',
        isActive: true,
      },
      {
        testId: test._id,

        text: 'Which of the following is the strongest oxidizing agent?',
        type: 'mcq',
        category: 'JEE',
        subject: 'Chemistry',
        section: 'Chemistry',
        sectionName: 'Chemistry',
        topic: 'Redox Reactions',
        difficulty: 'medium',
        marks: 4,
        negativeMarks: 1,
        options: [
          { label: 'A', text: 'F₂' },
          { label: 'B', text: 'Cl₂' },
          { label: 'C', text: 'Br₂' },
          { label: 'D', text: 'I₂' },
        ],
        correctAnswer: 'A',
        explanation: 'Fluorine has the highest electronegativity and the most negative reduction potential, making it the strongest oxidizing agent.',
        isActive: true,
      },
      {
        testId: test._id,

        text: 'The hybridization of carbon in benzene is:',
        type: 'mcq',
        category: 'JEE',
        subject: 'Chemistry',
        section: 'Chemistry',
        sectionName: 'Chemistry',
        topic: 'Organic Chemistry',
        difficulty: 'easy',
        marks: 4,
        negativeMarks: 1,
        options: [
          { label: 'A', text: 'sp' },
          { label: 'B', text: 'sp²' },
          { label: 'C', text: 'sp³' },
          { label: 'D', text: 'sp³d' },
        ],
        correctAnswer: 'B',
        explanation: 'In benzene, each carbon is bonded to 3 atoms (2 carbons and 1 hydrogen) with no lone pairs, resulting in sp² hybridization.',
        isActive: true,
      },
      {
        testId: test._id,

        text: 'For a reaction at equilibrium: aA + bB ⇌ cC + dD, the equilibrium constant expression is:',
        type: 'mcq',
        category: 'JEE',
        subject: 'Chemistry',
        section: 'Chemistry',
        sectionName: 'Chemistry',
        topic: 'Equilibrium',
        difficulty: 'medium',
        marks: 4,
        negativeMarks: 1,
        options: [
          { label: 'A', text: 'K = [C][D]/[A][B]' },
          { label: 'B', text: 'K = [C]ᶜ[D]ᵈ/[A]ᵃ[B]ᵇ' },
          { label: 'C', text: 'K = [A]ᵃ[B]ᵇ/[C]ᶜ[D]ᵈ' },
          { label: 'D', text: 'K = [A]+[B]/[C]+[D]' },
        ],
        correctAnswer: 'B',
        explanation: 'The equilibrium constant is the ratio of products raised to their stoichiometric coefficients to reactants raised to their coefficients.',
        isActive: true,
      },
      {
        testId: test._id,

        text: 'What is the molar mass of Ca(OH)₂? (Ca=40, O=16, H=1)',
        type: 'mcq',
        category: 'JEE',
        subject: 'Chemistry',
        section: 'Chemistry',
        sectionName: 'Chemistry',
        topic: 'Stoichiometry',
        difficulty: 'easy',
        marks: 4,
        negativeMarks: 1,
        options: [
          { label: 'A', text: '56 g/mol' },
          { label: 'B', text: '74 g/mol' },
          { label: 'C', text: '92 g/mol' },
          { label: 'D', text: '110 g/mol' },
        ],
        correctAnswer: 'B',
        explanation: 'Molar mass = 40 + 2(16) + 2(1) = 40 + 32 + 2 = 74 g/mol',
        isActive: true,
      },
    ];

    // Mathematics Questions
    const mathQuestions = [
      {
        testId: test._id,

        text: 'Find the sum of the first n natural numbers: 1 + 2 + 3 + ... + n',
        type: 'mcq',
        category: 'JEE',
        subject: 'Mathematics',
        section: 'Mathematics',
        sectionName: 'Mathematics',
        topic: 'Sequences and Series',
        difficulty: 'easy',
        marks: 4,
        negativeMarks: 1,
        options: [
          { label: 'A', text: 'n(n+1)/2' },
          { label: 'B', text: 'n(n-1)/2' },
          { label: 'C', text: 'n²' },
          { label: 'D', text: 'n(n+1)(2n+1)/6' },
        ],
        correctAnswer: 'A',
        explanation: 'The sum of first n natural numbers is n(n+1)/2. This can be proved by arithmetic series formula.',
        isActive: true,
      },
      {
        testId: test._id,

        text: 'If sin θ = 3/5, and θ is in the second quadrant, what is cos θ?',
        type: 'mcq',
        category: 'JEE',
        subject: 'Mathematics',
        section: 'Mathematics',
        sectionName: 'Mathematics',
        topic: 'Trigonometry',
        difficulty: 'medium',
        marks: 4,
        negativeMarks: 1,
        options: [
          { label: 'A', text: '4/5' },
          { label: 'B', text: '-4/5' },
          { label: 'C', text: '3/5' },
          { label: 'D', text: '-3/5' },
        ],
        correctAnswer: 'B',
        explanation: 'sin²θ + cos²θ = 1. So cos²θ = 1 - 9/25 = 16/25. cos θ = ±4/5. In second quadrant, cos is negative, so cos θ = -4/5',
        isActive: true,
      },
      {
        testId: test._id,

        text: 'The derivative of x³ + 2x² - 5x + 3 is:',
        type: 'mcq',
        category: 'JEE',
        subject: 'Mathematics',
        section: 'Mathematics',
        sectionName: 'Mathematics',
        topic: 'Calculus',
        difficulty: 'easy',
        marks: 4,
        negativeMarks: 1,
        options: [
          { label: 'A', text: '3x² + 4x - 5' },
          { label: 'B', text: '3x² + 2x - 5' },
          { label: 'C', text: 'x² + 4x - 5' },
          { label: 'D', text: '3x + 4 - 5' },
        ],
        correctAnswer: 'A',
        explanation: 'd/dx(x³ + 2x² - 5x + 3) = 3x² + 4x - 5',
        isActive: true,
      },
      {
        testId: test._id,

        text: 'Find the equation of the line passing through (2, 3) and (4, 7):',
        type: 'mcq',
        category: 'JEE',
        subject: 'Mathematics',
        section: 'Mathematics',
        sectionName: 'Mathematics',
        topic: 'Coordinate Geometry',
        difficulty: 'medium',
        marks: 4,
        negativeMarks: 1,
        options: [
          { label: 'A', text: 'y = 2x - 1' },
          { label: 'B', text: 'y = 2x + 1' },
          { label: 'C', text: 'y = -2x + 1' },
          { label: 'D', text: 'y = x + 1' },
        ],
        correctAnswer: 'A',
        explanation: 'Slope m = (7-3)/(4-2) = 4/2 = 2. Using point-slope form: y - 3 = 2(x - 2), so y = 2x - 1',
        isActive: true,
      },
      {
        testId: test._id,

        text: 'If |A| = 2, |B| = 3, and A·B = 3, what is the angle between vectors A and B?',
        type: 'mcq',
        category: 'JEE',
        subject: 'Mathematics',
        section: 'Mathematics',
        sectionName: 'Mathematics',
        topic: 'Vectors',
        difficulty: 'hard',
        marks: 4,
        negativeMarks: 1,
        options: [
          { label: 'A', text: '0°' },
          { label: 'B', text: '30°' },
          { label: 'C', text: '60°' },
          { label: 'D', text: '90°' },
        ],
        correctAnswer: 'C',
        explanation: 'A·B = |A||B|cos θ. So 3 = 2·3·cos θ. cos θ = 1/2, therefore θ = 60°',
        isActive: true,
      },
    ];

    // Insert all questions
    await Question.insertMany([...physicsQuestions, ...chemistryQuestions, ...mathQuestions]);
    console.log('✅ Created 15 sample questions');

    // Update Test with section info
    await Test.findByIdAndUpdate(test._id, {
      sections: [
        { name: 'Physics', questionCount: 5 },
        { name: 'Chemistry', questionCount: 5 },
        { name: 'Mathematics', questionCount: 5 },
      ],
    });

    console.log('\n✅ Seed completed successfully!');
    console.log(`Test ID: ${test._id}`);
    console.log(`Sections: Physics, Chemistry, Mathematics`);
    console.log(`Total Questions: 15 (5 per section)`);
    console.log(`\nYou can now use this test ID to create an exam.\n`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seedData();
