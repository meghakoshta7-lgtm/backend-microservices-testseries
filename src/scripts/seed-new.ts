import 'module-alias/register';
import mongoose from 'mongoose';
import { config } from '@/config';
import { Test } from '@/models/Test';
import { Question } from '@/models/Question';

async function seed() {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('✅ Connected to MongoDB');

    // Create test with sections embedded directly
    const test = await Test.create({
      name: 'JEE Main - Sectioned Mock Test',
      description: 'Test with Physics, Chemistry, Mathematics sections (MCQ + Integer)',
      category: 'JEE',
      subject: 'General',
      testType: 'full',
      difficulty: 'hard',
      duration: 180,
      totalQuestions: 21,
      totalMarks: 420,
      passingMarks: 120,
      negativeMarks: 1,
      isActive: true,
      isPremium: false,
      price: 0,
      questionCount: 21,
      sections: [
        { name: 'Physics', questionCount: 7 },
        { name: 'Chemistry', questionCount: 7 },
        { name: 'Mathematics', questionCount: 7 },
      ],
      tags: ['jee', 'mock', 'sectioned'],
    });
    console.log('✅ Test created:', test._id);

    const physicsInt = [
      {
        testId: test._id, type: 'integer', category: 'JEE', subject: 'Physics',
        section: 'Physics', sectionName: 'Physics', topic: 'Kinematics',
        difficulty: 'medium', marks: 4, negativeMarks: 0,
        text: 'A ball is dropped from height 80 m. Time taken to reach ground? (g=10 m/s²)',
        options: [],
        correctAnswer: '4', isActive: true,
      },
      {
        testId: test._id, type: 'integer', category: 'JEE', subject: 'Physics',
        section: 'Physics', sectionName: 'Physics', topic: 'Thermodynamics',
        difficulty: 'hard', marks: 4, negativeMarks: 0,
        text: 'A Carnot engine operates between 600 K and 300 K. What is its efficiency in percentage?',
        options: [],
        correctAnswer: '50', isActive: true,
      },
    ];

    const physics = [
      {
        testId: test._id, type: 'mcq', category: 'JEE', subject: 'Physics',
        section: 'Physics', sectionName: 'Physics', topic: 'Kinematics',
        difficulty: 'easy', marks: 4, negativeMarks: 1,
        text: 'A ball is thrown vertically upward with velocity 20 m/s. Maximum height? (g=10)',
        options: [{ label: 'A', text: '10 m' }, { label: 'B', text: '20 m' }, { label: 'C', text: '30 m' }, { label: 'D', text: '40 m' }],
        correctAnswer: 'B', isActive: true,
      },
      {
        testId: test._id, type: 'mcq', category: 'JEE', subject: 'Physics',
        section: 'Physics', sectionName: 'Physics', topic: 'Gravitation',
        difficulty: 'medium', marks: 4, negativeMarks: 1,
        text: 'Escape velocity from Earth is 11.2 km/s. What is it from a planet with mass 2M and radius 2R?',
        options: [{ label: 'A', text: '5.6' }, { label: 'B', text: '11.2' }, { label: 'C', text: '15.8' }, { label: 'D', text: '22.4' }],
        correctAnswer: 'B', isActive: true,
      },
      {
        testId: test._id, type: 'mcq', category: 'JEE', subject: 'Physics',
        section: 'Physics', sectionName: 'Physics', topic: 'Waves',
        difficulty: 'medium', marks: 4, negativeMarks: 1,
        text: 'Wave y = 0.02 sin(10πt - πx/2). Wavelength?',
        options: [{ label: 'A', text: '2 m' }, { label: 'B', text: '4 m' }, { label: 'C', text: '6 m' }, { label: 'D', text: '8 m' }],
        correctAnswer: 'B', isActive: true,
      },
      {
        testId: test._id, type: 'mcq', category: 'JEE', subject: 'Physics',
        section: 'Physics', sectionName: 'Physics', topic: 'Electrostatics',
        difficulty: 'hard', marks: 4, negativeMarks: 1,
        text: 'Two charges +q and -q separated by 2a. Field at perpendicular bisector at distance d?',
        options: [{ label: 'A', text: 'kq·2a/(a²+d²)^(3/2)' }, { label: 'B', text: 'kq·2d/(a²+d²)^(3/2)' }, { label: 'C', text: '0' }, { label: 'D', text: 'kq/d²' }],
        correctAnswer: 'A', isActive: true,
      },
      {
        testId: test._id, type: 'mcq', category: 'JEE', subject: 'Physics',
        section: 'Physics', sectionName: 'Physics', topic: 'Circuits',
        difficulty: 'medium', marks: 4, negativeMarks: 1,
        text: 'Charge fraction after 1 time constant τ in RC circuit?',
        options: [{ label: 'A', text: '0.368' }, { label: 'B', text: '0.632' }, { label: 'C', text: '0.736' }, { label: 'D', text: '0.865' }],
        correctAnswer: 'B', isActive: true,
      },
    ];

    const chemistryInt = [
      {
        testId: test._id, type: 'integer', category: 'JEE', subject: 'Chemistry',
        section: 'Chemistry', sectionName: 'Chemistry', topic: 'Mole Concept',
        difficulty: 'medium', marks: 4, negativeMarks: 0,
        text: 'Number of oxygen atoms in 9 g of H₂O? (Avogadro number = 6×10²³)',
        options: [],
        correctAnswer: '3', isActive: true,
      },
      {
        testId: test._id, type: 'integer', category: 'JEE', subject: 'Chemistry',
        section: 'Chemistry', sectionName: 'Chemistry', topic: 'Ionic Equilibrium',
        difficulty: 'hard', marks: 4, negativeMarks: 0,
        text: 'pH of 0.001 M NaOH solution?',
        options: [],
        correctAnswer: '11', isActive: true,
      },
    ];

    const chemistry = [
      {
        testId: test._id, type: 'mcq', category: 'JEE', subject: 'Chemistry',
        section: 'Chemistry', sectionName: 'Chemistry', topic: 'Acid-Base',
        difficulty: 'easy', marks: 4, negativeMarks: 1,
        text: 'pH of 0.01 M HCl?',
        options: [{ label: 'A', text: '1' }, { label: 'B', text: '2' }, { label: 'C', text: '3' }, { label: 'D', text: '4' }],
        correctAnswer: 'B', isActive: true,
      },
      {
        testId: test._id, type: 'mcq', category: 'JEE', subject: 'Chemistry',
        section: 'Chemistry', sectionName: 'Chemistry', topic: 'Redox',
        difficulty: 'medium', marks: 4, negativeMarks: 1,
        text: 'Strongest oxidizing agent?',
        options: [{ label: 'A', text: 'F₂' }, { label: 'B', text: 'Cl₂' }, { label: 'C', text: 'Br₂' }, { label: 'D', text: 'I₂' }],
        correctAnswer: 'A', isActive: true,
      },
      {
        testId: test._id, type: 'mcq', category: 'JEE', subject: 'Chemistry',
        section: 'Chemistry', sectionName: 'Chemistry', topic: 'Organic',
        difficulty: 'easy', marks: 4, negativeMarks: 1,
        text: 'Hybridization of carbon in benzene?',
        options: [{ label: 'A', text: 'sp' }, { label: 'B', text: 'sp²' }, { label: 'C', text: 'sp³' }, { label: 'D', text: 'sp³d' }],
        correctAnswer: 'B', isActive: true,
      },
      {
        testId: test._id, type: 'mcq', category: 'JEE', subject: 'Chemistry',
        section: 'Chemistry', sectionName: 'Chemistry', topic: 'Equilibrium',
        difficulty: 'medium', marks: 4, negativeMarks: 1,
        text: 'Equilibrium constant expression for aA + bB ⇌ cC + dD?',
        options: [{ label: 'A', text: '[C][D]/[A][B]' }, { label: 'B', text: '[C]^c[D]^d/[A]^a[B]^b' }, { label: 'C', text: '[A]^a[B]^b/[C]^c[D]^d' }, { label: 'D', text: '[A]+[B]/[C]+[D]' }],
        correctAnswer: 'B', isActive: true,
      },
      {
        testId: test._id, type: 'mcq', category: 'JEE', subject: 'Chemistry',
        section: 'Chemistry', sectionName: 'Chemistry', topic: 'Stoichiometry',
        difficulty: 'easy', marks: 4, negativeMarks: 1,
        text: 'Molar mass of Ca(OH)₂? (Ca=40, O=16, H=1)',
        options: [{ label: 'A', text: '56' }, { label: 'B', text: '74' }, { label: 'C', text: '92' }, { label: 'D', text: '110' }],
        correctAnswer: 'B', isActive: true,
      },
    ];

    const mathematicsInt = [
      {
        testId: test._id, type: 'integer', category: 'JEE', subject: 'Mathematics',
        section: 'Mathematics', sectionName: 'Mathematics', topic: 'Arithmetic',
        difficulty: 'medium', marks: 4, negativeMarks: 0,
        text: 'How many 3-digit numbers are divisible by 7?',
        options: [],
        correctAnswer: '128', isActive: true,
      },
      {
        testId: test._id, type: 'integer', category: 'JEE', subject: 'Mathematics',
        section: 'Mathematics', sectionName: 'Mathematics', topic: 'Geometry',
        difficulty: 'easy', marks: 4, negativeMarks: 0,
        text: 'Sum of all interior angles of an octagon (in degrees)?',
        options: [],
        correctAnswer: '1080', isActive: true,
      },
    ];

    const mathematics = [
      {
        testId: test._id, type: 'mcq', category: 'JEE', subject: 'Mathematics',
        section: 'Mathematics', sectionName: 'Mathematics', topic: 'Sequences',
        difficulty: 'easy', marks: 4, negativeMarks: 1,
        text: 'Sum of first n natural numbers?',
        options: [{ label: 'A', text: 'n(n+1)/2' }, { label: 'B', text: 'n(n-1)/2' }, { label: 'C', text: 'n²' }, { label: 'D', text: 'n(n+1)(2n+1)/6' }],
        correctAnswer: 'A', isActive: true,
      },
      {
        testId: test._id, type: 'mcq', category: 'JEE', subject: 'Mathematics',
        section: 'Mathematics', sectionName: 'Mathematics', topic: 'Trigonometry',
        difficulty: 'medium', marks: 4, negativeMarks: 1,
        text: 'If sin θ = 3/5 in Q2, cos θ = ?',
        options: [{ label: 'A', text: '4/5' }, { label: 'B', text: '-4/5' }, { label: 'C', text: '3/5' }, { label: 'D', text: '-3/5' }],
        correctAnswer: 'B', isActive: true,
      },
      {
        testId: test._id, type: 'mcq', category: 'JEE', subject: 'Mathematics',
        section: 'Mathematics', sectionName: 'Mathematics', topic: 'Calculus',
        difficulty: 'easy', marks: 4, negativeMarks: 1,
        text: 'Derivative of x³ + 2x² - 5x + 3?',
        options: [{ label: 'A', text: '3x²+4x-5' }, { label: 'B', text: '3x²+2x-5' }, { label: 'C', text: 'x²+4x-5' }, { label: 'D', text: '3x+4-5' }],
        correctAnswer: 'A', isActive: true,
      },
      {
        testId: test._id, type: 'mcq', category: 'JEE', subject: 'Mathematics',
        section: 'Mathematics', sectionName: 'Mathematics', topic: 'Coordinate',
        difficulty: 'medium', marks: 4, negativeMarks: 1,
        text: 'Line through (2,3) and (4,7)?',
        options: [{ label: 'A', text: 'y=2x-1' }, { label: 'B', text: 'y=2x+1' }, { label: 'C', text: 'y=-2x+1' }, { label: 'D', text: 'y=x+1' }],
        correctAnswer: 'A', isActive: true,
      },
      {
        testId: test._id, type: 'mcq', category: 'JEE', subject: 'Mathematics',
        section: 'Mathematics', sectionName: 'Mathematics', topic: 'Vectors',
        difficulty: 'hard', marks: 4, negativeMarks: 1,
        text: '|A|=2, |B|=3, A·B=3. Angle between A and B?',
        options: [{ label: 'A', text: '0°' }, { label: 'B', text: '30°' }, { label: 'C', text: '60°' }, { label: 'D', text: '90°' }],
        correctAnswer: 'C', isActive: true,
      },
    ];

    await Question.insertMany([...physicsInt, ...chemistryInt, ...mathematicsInt, ...physics, ...chemistry, ...mathematics]);
    console.log('✅ Created 21 questions (15 MCQ + 6 Integer) with sections');

    // Verify
    const saved = await Test.findById(test._id).lean();
    console.log('📋 Test sections:', JSON.stringify(saved?.sections, null, 2));
    const qCount = await Question.countDocuments({ testId: test._id, section: 'Physics' });
    console.log(`✅ Physics questions: ${qCount}`);

    await mongoose.connection.close();
    console.log(`\n🎯 USE THIS TEST ID: ${test._id}`);
    console.log('Copy this ID and use it in the user app URL');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
