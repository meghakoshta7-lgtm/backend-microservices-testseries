import 'module-alias/register';
import mongoose from 'mongoose';
import { config } from '@/config';
import { Exam } from '@/models/Exam';
import { Test } from '@/models/Test';
import { Question } from '@/models/Question';

type SeedQuestion = {
  text: string;
  options: string[];
  answer: number;
  explanation: string;
  subject: 'Physics' | 'Chemistry' | 'Mathematics';
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  diagram: string[];
};

const testName = 'JEE Main Full Mock Test - 72 Questions';

const svgData = (title: string, lines: string[]) => {
  const rows = lines.map((line, index) => (
    `<text x="30" y="${76 + index * 30}" font-size="20" fill="#111827" font-family="Arial, sans-serif">${escapeXml(line)}</text>`
  )).join('');
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="300" viewBox="0 0 720 300">
  <rect width="720" height="300" rx="18" fill="#f8fafc"/>
  <rect x="16" y="16" width="688" height="268" rx="14" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
  <text x="30" y="46" font-size="24" font-weight="700" fill="#0f172a" font-family="Arial, sans-serif">${escapeXml(title)}</text>
  <line x1="30" y1="58" x2="690" y2="58" stroke="#e2e8f0" stroke-width="2"/>
  ${rows}
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const q = (
  subject: SeedQuestion['subject'],
  topic: string,
  difficulty: SeedQuestion['difficulty'],
  text: string,
  options: string[],
  answer: number,
  explanation: string,
  diagram: string[],
): SeedQuestion => ({ subject, topic, difficulty, text, options, answer, explanation, diagram });

const questions: SeedQuestion[] = [
  q('Physics', 'Kinematics', 'medium', 'A particle starts from rest and moves with acceleration a = 2t m/s^2. Its velocity at t = 3 s is:', ['6 m/s', '9 m/s', '12 m/s', '18 m/s'], 1, 'v = integral 0 to 3 of 2t dt = t^2 from 0 to 3 = 9 m/s.', ['a(t)=2t', 'v = integral a dt', 't: 0 -> 3 s']),
  q('Physics', 'Projectile Motion', 'medium', 'A projectile is fired with speed 20 m/s at 30 degrees. Taking g = 10 m/s^2, its time of flight is:', ['1 s', '2 s', '3 s', '4 s'], 1, 'T = 2u sin theta/g = 2 x 20 x 1/2 / 10 = 2 s.', ['u=20 m/s', 'theta=30 deg', 'T=2u sin(theta)/g']),
  q('Physics', 'Newton Laws', 'medium', 'Two blocks of masses 2 kg and 3 kg are pushed by a 10 N force on a smooth surface. Acceleration of the system is:', ['1 m/s^2', '2 m/s^2', '3 m/s^2', '5 m/s^2'], 1, 'Total mass = 5 kg. a = F/M = 10/5 = 2 m/s^2.', ['10 N -> [2 kg][3 kg]', 'smooth horizontal surface', 'a = F/(m1+m2)']),
  q('Physics', 'Friction', 'medium', 'A 5 kg block is on a rough horizontal plane with coefficient of friction 0.2. Minimum horizontal force to just move it is:', ['5 N', '10 N', '15 N', '20 N'], 1, 'Limiting friction = mu mg = 0.2 x 5 x 10 = 10 N.', ['m=5 kg', 'mu=0.2', 'F_min = mu mg']),
  q('Physics', 'Work Energy', 'easy', 'A body of mass 2 kg moving at 5 m/s is brought to rest. Work done by the retarding force is:', ['-10 J', '-25 J', '-50 J', '-100 J'], 2, 'Work done = change in KE = 0 - (1/2)mv^2 = -25 J? For m=2, v=5: KE=25 J, so work = -25 J.', ['m=2 kg', 'v=5 m/s -> 0', 'W = Delta KE']),
  q('Physics', 'Circular Motion', 'medium', 'A car moves on a circular track of radius 50 m with speed 10 m/s. Its centripetal acceleration is:', ['1 m/s^2', '2 m/s^2', '4 m/s^2', '5 m/s^2'], 1, 'a_c = v^2/r = 100/50 = 2 m/s^2.', ['r=50 m', 'v=10 m/s', 'a_c=v^2/r']),
  q('Physics', 'Gravitation', 'medium', 'At height equal to Earth radius R above the surface, acceleration due to gravity is:', ['g/2', 'g/4', 'g/8', '2g'], 1, 'Distance from center = 2R. g_h = g(R/2R)^2 = g/4.', ['surface: R', 'height: R', 'center distance: 2R']),
  q('Physics', 'SHM', 'hard', 'For a spring block system with k = 200 N/m and m = 2 kg, angular frequency is:', ['5 rad/s', '10 rad/s', '20 rad/s', '100 rad/s'], 1, 'omega = sqrt(k/m) = sqrt(200/2) = sqrt(100) = 10 rad/s.', ['spring k=200 N/m', 'block m=2 kg', 'omega=sqrt(k/m)']),
  q('Physics', 'Wave Motion', 'medium', 'A wave has frequency 50 Hz and wavelength 4 m. Its speed is:', ['12.5 m/s', '100 m/s', '200 m/s', '400 m/s'], 2, 'v = f lambda = 50 x 4 = 200 m/s.', ['f=50 Hz', 'lambda=4 m', 'v=f lambda']),
  q('Physics', 'Thermodynamics', 'medium', 'In an isothermal expansion of an ideal gas, which quantity remains constant?', ['Pressure', 'Volume', 'Temperature', 'Internal energy only for real gas'], 2, 'Isothermal means temperature remains constant. For ideal gas, internal energy also remains constant.', ['PV curve: isotherm', 'T = constant', 'ideal gas']),
  q('Physics', 'KTG', 'medium', 'The rms speed of gas molecules is proportional to:', ['T', 'sqrt(T)', '1/T', '1/sqrt(T)'], 1, 'v_rms = sqrt(3RT/M), hence proportional to sqrt(T).', ['v_rms = sqrt(3RT/M)', 'M constant', 'dependence on T']),
  q('Physics', 'Electrostatics', 'medium', 'Two equal charges q are separated by r. If distance is doubled, force becomes:', ['F/2', 'F/4', '2F', '4F'], 1, 'Coulomb force is inversely proportional to r^2. Doubling r makes force F/4.', ['q --- r --- q', 'F = kq^2/r^2', 'r -> 2r']),
  q('Physics', 'Capacitance', 'hard', 'A parallel plate capacitor has capacitance C. If plate separation is halved, new capacitance is:', ['C/2', 'C', '2C', '4C'], 2, 'C = epsilon A/d. If d becomes d/2, capacitance doubles.', ['plates area A', 'separation d -> d/2', 'C proportional 1/d']),
  q('Physics', 'Current Electricity', 'medium', 'Three resistors 2 ohm, 3 ohm and 6 ohm are connected in parallel. Equivalent resistance is:', ['1 ohm', '2 ohm', '3 ohm', '6 ohm'], 0, '1/R = 1/2 + 1/3 + 1/6 = 1, so R = 1 ohm.', ['2 ohm || 3 ohm || 6 ohm', '1/R = sum 1/R_i']),
  q('Physics', 'Magnetism', 'hard', 'A charge q moving with velocity v perpendicular to magnetic field B experiences force:', ['qvB', 'qv/B', 'qB/v', 'zero'], 0, 'Magnetic force F = qvB sin theta. For theta = 90 degrees, F = qvB.', ['v perpendicular B', 'F = qvB sin(theta)', 'theta=90 deg']),
  q('Physics', 'EMI', 'medium', 'Magnetic flux through a coil changes from 0.2 Wb to 0.8 Wb in 0.1 s. Induced emf magnitude is:', ['2 V', '4 V', '6 V', '8 V'], 2, 'emf = Delta phi / Delta t = (0.8-0.2)/0.1 = 6 V.', ['phi: 0.2 -> 0.8 Wb', 'time=0.1 s', 'emf=d phi/dt']),
  q('Physics', 'AC Circuits', 'medium', 'In a pure inductor AC circuit, current:', ['leads voltage by 90 deg', 'lags voltage by 90 deg', 'is in phase', 'lags by 45 deg'], 1, 'For a pure inductor, voltage leads current by 90 degrees, so current lags voltage by 90 degrees.', ['pure L circuit', 'V leads I', 'phase = 90 deg']),
  q('Physics', 'Ray Optics', 'medium', 'An object is placed at 2f of a convex lens. Image is formed at:', ['f', '2f', 'infinity', 'between f and 2f'], 1, 'For object at 2f, image is real, inverted, same size and formed at 2f.', ['convex lens', 'object at 2f', 'image at 2f']),
  q('Physics', 'Wave Optics', 'hard', 'In Young double slit experiment, fringe width is beta. If wavelength is doubled, fringe width becomes:', ['beta/2', 'beta', '2 beta', '4 beta'], 2, 'beta = lambda D/d. Doubling lambda doubles beta.', ['beta=lambda D/d', 'lambda -> 2 lambda', 'D,d constant']),
  q('Physics', 'Modern Physics', 'medium', 'Photon energy for frequency f is:', ['hf', 'h/f', 'f/h', 'hc f'], 0, 'Planck relation: E = hf.', ['photon', 'frequency=f', 'E=hf']),
  q('Physics', 'Photoelectric Effect', 'hard', 'If frequency of incident light increases above threshold, stopping potential:', ['decreases', 'increases', 'becomes zero', 'does not change'], 1, 'K_max = hf - phi = eV_s. Increasing f increases stopping potential.', ['hf incident', 'metal surface', 'eV_s=hf-phi']),
  q('Physics', 'Semiconductors', 'medium', 'A p-n junction diode conducts significantly when it is:', ['reverse biased', 'forward biased', 'unbiased only', 'at zero temperature'], 1, 'Forward bias reduces barrier potential and allows current.', ['p | n junction', '+ to p, - to n', 'forward bias']),
  q('Physics', 'Units and Dimensions', 'easy', 'Dimensional formula of Planck constant h is:', ['MLT^-1', 'ML^2T^-1', 'ML^2T^-2', 'M^2LT^-1'], 1, 'h has dimension of angular momentum or energy x time = ML^2T^-1.', ['E=hf', '[h]=[E]/[f]', 'ML^2T^-2 / T^-1']),
  q('Physics', 'Error Analysis', 'medium', 'If y = A^2B/C, percentage error in y is:', ['2% in A + % in B + % in C', '% in A + % in B - % in C', '2% in A - % in B + % in C', '% in A + 2% in B + % in C'], 0, 'For products and powers, relative errors add: dy/y = 2dA/A + dB/B + dC/C.', ['y=A^2 B / C', 'relative error adds', 'power of A = 2']),

  q('Chemistry', 'Mole Concept', 'easy', 'Number of moles in 11 g of CO2 is:', ['0.25 mol', '0.5 mol', '1 mol', '2 mol'], 0, 'Molar mass of CO2 = 44 g/mol. Moles = 11/44 = 0.25 mol.', ['CO2 molar mass=44', 'given mass=11 g', 'n=m/M']),
  q('Chemistry', 'Atomic Structure', 'medium', 'Maximum number of electrons in shell n = 3 is:', ['8', '18', '32', '2'], 1, 'Maximum electrons in shell = 2n^2 = 2 x 9 = 18.', ['shell n=3', 'capacity=2n^2']),
  q('Chemistry', 'Periodic Table', 'medium', 'Across a period from left to right, atomic radius generally:', ['increases', 'decreases', 'does not change', 'first increases then decreases'], 1, 'Effective nuclear charge increases across a period, so atomic radius decreases.', ['period ->', 'Z_eff increases', 'radius decreases']),
  q('Chemistry', 'Chemical Bonding', 'medium', 'Hybridisation of carbon in methane CH4 is:', ['sp', 'sp2', 'sp3', 'dsp2'], 2, 'Methane has tetrahedral geometry with sp3 hybridisation.', ['CH4', '4 sigma bonds', 'tetrahedral']),
  q('Chemistry', 'Thermochemistry', 'medium', 'For an exothermic reaction, enthalpy change Delta H is:', ['positive', 'negative', 'zero', 'infinite'], 1, 'Exothermic reaction releases heat, so products have lower enthalpy and Delta H is negative.', ['Reactants -> Products + heat', 'Delta H < 0']),
  q('Chemistry', 'Chemical Equilibrium', 'hard', 'For N2 + 3H2 <=> 2NH3, increasing pressure shifts equilibrium:', ['left', 'right', 'no effect', 'first left then right'], 1, 'Higher pressure favours fewer gas moles. Right side has 2 moles vs 4 on left.', ['left: 4 mol gas', 'right: 2 mol gas', 'pressure up']),
  q('Chemistry', 'Ionic Equilibrium', 'medium', 'pH of 10^-3 M HCl solution is approximately:', ['1', '2', '3', '11'], 2, 'Strong acid HCl fully dissociates. pH = -log(10^-3) = 3.', ['[H+]=10^-3 M', 'pH=-log[H+]']),
  q('Chemistry', 'Redox', 'medium', 'Oxidation state of Mn in KMnO4 is:', ['+2', '+4', '+6', '+7'], 3, 'K is +1, O is -2. 1 + x - 8 = 0, so x = +7.', ['K(+1) Mn(x) O4(-8)', 'net charge=0']),
  q('Chemistry', 'Electrochemistry', 'hard', 'The charge required to deposit 1 mole of Ag from Ag+ is:', ['1 F', '2 F', '0.5 F', '965 C'], 0, 'Ag+ + e- -> Ag. One mole Ag needs one mole electrons = 1 Faraday.', ['Ag+ + e- -> Ag', '1 mol e- = 1 F']),
  q('Chemistry', 'Solutions', 'medium', 'Molarity of solution containing 4 g NaOH in 500 mL solution is:', ['0.1 M', '0.2 M', '0.4 M', '1 M'], 1, 'Moles NaOH = 4/40 = 0.1. Volume = 0.5 L. M = 0.1/0.5 = 0.2 M.', ['NaOH M=40', 'mass=4 g', 'V=0.5 L']),
  q('Chemistry', 'Chemical Kinetics', 'hard', 'For a first order reaction, half-life is:', ['dependent on initial concentration', 'independent of initial concentration', 'zero', 'equal to rate constant'], 1, 'For first order reaction, t1/2 = 0.693/k, independent of initial concentration.', ['first order', 't1/2=0.693/k']),
  q('Chemistry', 'Surface Chemistry', 'medium', 'Tyndall effect is observed in:', ['true solution', 'colloid', 'pure solvent', 'crystal'], 1, 'Colloidal particles scatter light, producing Tyndall effect.', ['light beam', 'colloid particles', 'scattering']),
  q('Chemistry', 'Coordination Compounds', 'hard', 'Coordination number of Co in [Co(NH3)6]Cl3 is:', ['3', '4', '6', '9'], 2, 'Six NH3 ligands are directly bonded to Co, so coordination number is 6.', ['[Co(NH3)6]Cl3', 'six NH3 ligands']),
  q('Chemistry', 's-Block', 'medium', 'Which compound is baking soda?', ['Na2CO3', 'NaHCO3', 'CaCO3', 'NaCl'], 1, 'Baking soda is sodium hydrogen carbonate, NaHCO3.', ['baking soda', 'sodium hydrogen carbonate']),
  q('Chemistry', 'p-Block', 'medium', 'Which allotrope of carbon is a good conductor of electricity?', ['Diamond', 'Graphite', 'Fullerene only', 'Charcoal'], 1, 'Graphite has delocalized electrons and conducts electricity.', ['graphite layers', 'delocalized electrons']),
  q('Chemistry', 'd-Block', 'medium', 'Transition metals often show variable oxidation states because of:', ['only s electrons', 'similar energies of ns and (n-1)d orbitals', 'full d shells only', 'absence of d orbitals'], 1, 'ns and (n-1)d orbitals have comparable energies, allowing different oxidation states.', ['ns orbital', '(n-1)d orbital', 'similar energy']),
  q('Chemistry', 'Organic Chemistry', 'medium', 'IUPAC name of CH3-CH2-OH is:', ['Methanol', 'Ethanol', 'Ethanal', 'Ethanoic acid'], 1, 'Two-carbon alcohol is ethanol.', ['CH3-CH2-OH', '2 carbons', '-ol group']),
  q('Chemistry', 'GOC', 'hard', 'Most stable carbocation among the following is:', ['CH3+', '1 degree', '2 degree', '3 degree'], 3, 'Tertiary carbocation is most stabilized by hyperconjugation and +I effect.', ['carbocation stability', '3 degree > 2 degree > 1 degree']),
  q('Chemistry', 'Isomerism', 'medium', 'But-2-ene shows:', ['chain isomerism only', 'geometrical isomerism', 'optical isomerism', 'no isomerism'], 1, 'But-2-ene has restricted C=C rotation and different groups on each carbon, so cis-trans isomerism exists.', ['CH3-CH=CH-CH3', 'cis/trans possible']),
  q('Chemistry', 'Hydrocarbons', 'medium', 'Product of addition of HBr to propene by Markovnikov rule is:', ['1-bromopropane', '2-bromopropane', 'propane', 'bromomethane'], 1, 'H adds to carbon with more H; Br goes to more substituted carbon giving 2-bromopropane.', ['CH3-CH=CH2 + HBr', 'Markovnikov addition']),
  q('Chemistry', 'Alcohols', 'medium', 'Lucas test is fastest for:', ['primary alcohol', 'secondary alcohol', 'tertiary alcohol', 'phenol'], 2, 'Tertiary alcohol gives immediate turbidity with Lucas reagent.', ['Lucas reagent', '3 degree alcohol', 'fast turbidity']),
  q('Chemistry', 'Carbonyls', 'hard', 'Which reagent reduces aldehyde to primary alcohol?', ['NaBH4', 'Br2 water', 'KMnO4', 'HNO3'], 0, 'NaBH4 is a mild reducing agent converting aldehydes to primary alcohols.', ['R-CHO', 'NaBH4', 'R-CH2OH']),
  q('Chemistry', 'Biomolecules', 'easy', 'The linkage joining amino acids in proteins is:', ['glycosidic', 'peptide', 'ester', 'phosphodiester'], 1, 'Amino acids are joined by peptide bonds in proteins.', ['amino acid 1', 'peptide bond', 'amino acid 2']),
  q('Chemistry', 'Polymers', 'medium', 'Monomer of natural rubber is:', ['isoprene', 'styrene', 'vinyl chloride', 'ethylene'], 0, 'Natural rubber is cis-1,4-polyisoprene; monomer is isoprene.', ['natural rubber', 'polyisoprene', 'monomer=isoprene']),

  q('Mathematics', 'Sets', 'easy', 'If A has 4 elements and B has 3 elements, maximum elements in A union B is:', ['4', '5', '7', '12'], 2, 'Maximum occurs when A and B are disjoint: 4 + 3 = 7.', ['n(A)=4', 'n(B)=3', 'disjoint sets']),
  q('Mathematics', 'Quadratic Equations', 'medium', 'If roots of x^2 - 5x + 6 = 0 are alpha and beta, alpha + beta is:', ['5', '6', '-5', '-6'], 0, 'For ax^2+bx+c, sum of roots = -b/a = 5.', ['x^2 - 5x + 6', 'sum=-b/a']),
  q('Mathematics', 'Complex Numbers', 'medium', 'Modulus of 3 + 4i is:', ['1', '5', '7', '25'], 1, '|3+4i| = sqrt(3^2+4^2) = 5.', ['z=3+4i', '|z|=sqrt(a^2+b^2)']),
  q('Mathematics', 'Sequences', 'medium', 'Sum of first 20 terms of AP 3, 7, 11, ... is:', ['780', '800', '820', '840'], 2, 'a=3, d=4. S20=20/2[2x3+19x4]=10(82)=820.', ['AP: a=3, d=4', 'n=20', 'S_n=n/2[2a+(n-1)d]']),
  q('Mathematics', 'Binomial Theorem', 'medium', 'Coefficient of x^2 in (1 + x)^5 is:', ['5', '10', '15', '20'], 1, 'Coefficient of x^2 is C(5,2)=10.', ['(1+x)^5', 'term x^2', 'C(5,2)']),
  q('Mathematics', 'Permutations', 'medium', 'Number of ways to arrange letters of word LEVEL is:', ['20', '30', '60', '120'], 1, 'LEVEL has 5 letters with L twice and E twice. Arrangements = 5!/(2!2!) = 30.', ['L,E,V,E,L', 'repeats: L=2,E=2']),
  q('Mathematics', 'Matrices', 'medium', 'If A is a 2x2 matrix with determinant 5, determinant of 3A is:', ['15', '30', '45', '5'], 2, 'For 2x2 matrix, det(kA)=k^2 det(A)=9x5=45.', ['A: 2x2', 'det(A)=5', 'det(3A)=3^2 det(A)']),
  q('Mathematics', 'Determinants', 'hard', 'Area of triangle with vertices (0,0), (4,0), (0,3) is:', ['6', '7', '12', '24'], 0, 'Right triangle area = 1/2 x 4 x 3 = 6.', ['(0,3)', '|', '(0,0)----(4,0)']),
  q('Mathematics', 'Straight Lines', 'medium', 'Slope of line 2x - 3y + 6 = 0 is:', ['2/3', '-2/3', '3/2', '-3/2'], 0, 'Rewrite as y = (2/3)x + 2. Slope = 2/3.', ['2x - 3y + 6 = 0', 'y = mx + c']),
  q('Mathematics', 'Circle', 'medium', 'Center of circle x^2 + y^2 - 4x + 6y - 12 = 0 is:', ['(2,-3)', '(-2,3)', '(4,-6)', '(-4,6)'], 0, 'Center = (-g,-f) for x^2+y^2+2gx+2fy+c=0. Here g=-2, f=3, center=(2,-3).', ['x^2+y^2-4x+6y-12=0', 'center=(-g,-f)']),
  q('Mathematics', 'Parabola', 'hard', 'Focus of parabola y^2 = 8x is:', ['(2,0)', '(4,0)', '(0,2)', '(0,4)'], 0, 'y^2=4ax, so 4a=8 and a=2. Focus=(a,0)=(2,0).', ['y^2=8x', '4a=8', 'focus=(a,0)']),
  q('Mathematics', 'Ellipse', 'hard', 'For ellipse x^2/25 + y^2/9 = 1, eccentricity is:', ['3/5', '4/5', '5/4', '2/5'], 1, 'a^2=25, b^2=9. e=sqrt(1-b^2/a^2)=sqrt(16/25)=4/5.', ['a^2=25', 'b^2=9', 'e=sqrt(1-b^2/a^2)']),
  q('Mathematics', 'Limits', 'medium', 'Limit x -> 0 of sin x / x is:', ['0', '1', 'infinity', '-1'], 1, 'Standard limit: lim x->0 sin x / x = 1.', ['y=sin x', 'near x=0', 'sin x ~ x']),
  q('Mathematics', 'Continuity', 'medium', 'For f(x)=kx+1 to be continuous at x=2 with f(2)=7, k is:', ['2', '3', '4', '5'], 1, 'Continuity gives 2k+1=7, so k=3.', ['f(x)=kx+1', 'f(2)=7', '2k+1=7']),
  q('Mathematics', 'Differentiation', 'medium', 'Derivative of x^3 - 4x with respect to x is:', ['3x^2 - 4', 'x^2 - 4', '3x - 4', 'x^3 - 4'], 0, 'd/dx(x^3 - 4x)=3x^2 - 4.', ['y=x^3-4x', 'dy/dx=?']),
  q('Mathematics', 'Application of Derivatives', 'hard', 'If y=x^2, slope of tangent at x=3 is:', ['3', '6', '9', '12'], 1, 'dy/dx=2x. At x=3, slope=6.', ['parabola y=x^2', 'point x=3', 'slope=dy/dx']),
  q('Mathematics', 'Integration', 'medium', 'Integral of 2x dx is:', ['x^2 + C', '2x^2 + C', 'x + C', '2 + C'], 0, 'Integral 2x dx = x^2 + C.', ['integral 2x dx', 'power rule']),
  q('Mathematics', 'Definite Integration', 'hard', 'Integral from 0 to 1 of x^2 dx is:', ['1/2', '1/3', '2/3', '1'], 1, 'Integral x^2 dx = x^3/3. From 0 to 1 gives 1/3.', ['area under y=x^2', 'x=0 to 1']),
  q('Mathematics', 'Differential Equations', 'hard', 'General solution of dy/dx = y is:', ['y=Ce^x', 'y=Cx', 'y=C/x', 'y=e^C'], 0, 'dy/y=dx. Integrating gives ln y = x + C, so y=Ce^x.', ['dy/dx=y', 'dy/y=dx']),
  q('Mathematics', 'Vectors', 'medium', 'Dot product of vectors i + j and i - j is:', ['0', '1', '2', '-1'], 0, '(i+j).(i-j)=1-1=0.', ['a=i+j', 'b=i-j', 'a.b=?']),
  q('Mathematics', '3D Geometry', 'medium', 'Distance between points (1,2,3) and (4,6,3) is:', ['3', '4', '5', '7'], 2, 'Distance=sqrt((3)^2+(4)^2+0^2)=5.', ['P(1,2,3)', 'Q(4,6,3)', 'distance formula']),
  q('Mathematics', 'Probability', 'medium', 'A fair die is thrown once. Probability of getting an even number is:', ['1/6', '1/3', '1/2', '2/3'], 2, 'Even outcomes are 2,4,6: 3 outcomes out of 6, probability=1/2.', ['die outcomes 1-6', 'even: 2,4,6']),
  q('Mathematics', 'Statistics', 'easy', 'Mean of 2, 4, 6, 8 is:', ['4', '5', '6', '8'], 1, 'Mean=(2+4+6+8)/4=20/4=5.', ['data: 2,4,6,8', 'mean=sum/n']),
  q('Mathematics', 'Trigonometry', 'medium', 'Value of sin^2 theta + cos^2 theta is:', ['0', '1', 'tan theta', 'sec theta'], 1, 'Pythagorean identity: sin^2 theta + cos^2 theta = 1.', ['right triangle identity', 'sin^2 theta + cos^2 theta']),
];

async function seed() {
  if (questions.length !== 72) {
    throw new Error(`Expected 72 questions, found ${questions.length}`);
  }

  await mongoose.connect(config.mongodb.uri);
  console.log('Connected to MongoDB');

  let exam = await Exam.findOne({ name: 'JEE Main' });
  if (!exam) {
    exam = await Exam.create({
      name: 'JEE Main',
      slug: 'jee-main',
      icon: 'Atom',
      color: 'from-cyan-500 to-cyan-600',
      totalTests: 1,
      totalSubjects: 3,
      difficulty: 'hard',
      isActive: true,
      successStats: [{ label: 'Questions', value: '72' }],
    });
  }

  const existing = await Test.findOne({ name: testName, category: 'JEE Main' });
  if (existing) {
    await Question.deleteMany({ testId: existing._id });
    await Test.deleteOne({ _id: existing._id });
    console.log(`Removed old "${testName}"`);
  }

  const test = await Test.create({
    name: testName,
    description: 'JEE Main level original full mock with 24 Physics, 24 Chemistry and 24 Mathematics questions. Every question includes a diagram or visual prompt and detailed solution.',
    category: 'JEE Main',
    subject: 'Full Syllabus',
    difficulty: 'hard',
    duration: 180,
    totalQuestions: 72,
    totalMarks: 288,
    passingMarks: 100,
    negativeMarks: 1,
    isPremium: false,
    tags: ['jee-main', 'full-mock', '72-questions', 'diagrams'],
    questionCount: 72,
    thumbnail: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800&h=500&fit=crop',
  });

  await Question.insertMany(questions.map((item) => ({
    testId: test._id,
    text: item.text,
    options: item.options.map((option, index) => ({ label: String(index), text: option })),
    correctAnswer: String(item.answer),
    explanation: item.explanation,
    type: 'mcq',
    category: 'JEE Main',
    subject: item.subject,
    topic: item.topic,
    difficulty: item.difficulty,
    marks: 4,
    negativeMarks: 1,
    image: svgData(`${item.subject}: ${item.topic}`, item.diagram),
    attachmentType: 'image',
    isActive: true,
  })));

  const count = await Test.countDocuments({ category: 'JEE Main', isActive: true });
  await Exam.findByIdAndUpdate(exam._id, { totalTests: Math.max(count, 1), totalSubjects: 3 });

  console.log(`Seeded "${testName}" with 72 JEE Main questions.`);
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
