import 'module-alias/register';
import mongoose from 'mongoose';
import { ExamCategory } from '@/models/ExamCategory';
import { Exam } from '@/models/Exam';
import { Subject } from '@/models/Subject';
import { Test } from '@/models/Test';
import { Question } from '@/models/Question';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/p2';

const questions = [
  // ==================== PHYSICS - Gravitation ====================
  {
    questionNo: 1, exam: "JEE Main-2016, JEE Main-2019 (January)", subject: "Physics", chapter: "Gravitation", type: "mcq",
    text: "A satellite is revolving in a circular orbit at a height 'h' from the earth's surface (radius of earth R; h << R). The minimum increase in its orbital velocity required, so that the satellite could escape from the earth's gravitational field, is close to: (Neglect the effect of atmosphere.)",
    options: [{ label: "A", text: "√(2gR)" }, { label: "B", text: "√(gR)" }, { label: "C", text: "√(gR/2)" }, { label: "D", text: "√(gR)(√2 - 1)" }],
    correctAnswer: "D",
    explanation: "Since h << R, the radius of the orbit can be approximated as R. The orbital velocity of a satellite close to the earth's surface is given by v_o = √(GM/R) = √(gR). The escape velocity from the earth's surface is given by v_e = √(2GM/R) = √(2gR). Therefore, the minimum increase in velocity required to escape is Δv = v_e - v_o = √(2gR) - √(gR) = √(gR)(√2 - 1)."
  },
  {
    questionNo: 2, exam: "JEE Main-2017", subject: "Physics", chapter: "Gravitation", type: "mcq",
    text: "The variation of acceleration due to gravity g with distance d from centre of the earth is best represented by (R = Earth's radius):",
    options: [
      { label: "A", text: "Graph showing linear increase inside and quadratic decrease outside" },
      { label: "B", text: "Graph showing linear increase inside and exponential-like hyperbola outside" },
      { label: "C", text: "Graph showing non-linear increase inside" },
      { label: "D", text: "Graph showing linear increase up to R and rectangular hyperbola (1/d²) for d > R" }
    ],
    correctAnswer: "D",
    explanation: "Inside the earth (d ≤ R), the acceleration due to gravity varies linearly with distance: g_in = GMd/R³, which is a straight line passing through the origin (g ∝ d). Outside the earth (d > R), it varies inversely with the square of the distance: g_out = GM/d², which represents a decreasing curve (g ∝ 1/d²)."
  },
  {
    questionNo: 3, exam: "JEE Main-2019 (January)", subject: "Physics", chapter: "Gravitation", type: "mcq",
    text: "A satellite is moving with a constant speed v in circular orbit around the earth. An object of mass 'm' is ejected from the satellite such that it just escapes from the gravitational pull of the earth. At the time of ejection, the kinetic energy of the object is:",
    options: [{ label: "A", text: "2mv²" }, { label: "B", text: "mv²" }, { label: "C", text: "½ mv²" }, { label: "D", text: "³⁄₂ mv²" }],
    correctAnswer: "B",
    explanation: "In a circular orbit of radius r, the orbital speed is v = √(GM/r), which implies GM/r = v². The potential energy of the object of mass m in this orbit is U = -GMm/r = -mv². For the object to just escape, its total mechanical energy must become zero (K_f + U_f = 0). Therefore, the minimum kinetic energy required at ejection is K = -U = mv²."
  },
  {
    questionNo: 4, exam: "JEE Main-2019 (January)", subject: "Physics", chapter: "Gravitation", type: "mcq",
    text: "A heavy ball of mass M is suspended from the ceiling of a car by a light strong string of mass m (m << M). When the car is at rest, the speed of transverse waves in the string is 60 m/s. When the car has acceleration a, the wave-speed increases to 60.5 m/s. The value of a, in terms of gravitational acceleration g is closest to:",
    options: [{ label: "A", text: "g/30" }, { label: "B", text: "g/5" }, { label: "C", text: "g/10" }, { label: "D", text: "g/20" }],
    correctAnswer: "B",
    explanation: "The velocity of a transverse wave on a string is v = √(T/μ). When at rest, T₁ = Mg, so v₁ = √(Mg/μ) = 60 m/s. When accelerating horizontally with 'a', the effective acceleration becomes g_eff = √(g² + a²). The new tension is T₂ = M√(g²+a²), so v₂ = √(M√(g²+a²)/μ) = 60.5 m/s. Taking the ratio: v₂/v₁ = (1 + a²/g²)^(1/4) ⇒ 60.5/60 = 1 + 1/120. Using binomial approximation, 1 + (1/4)(a²/g²) = 1 + 1/120 ⇒ a²/g² = 4/120 = 1/30 ⇒ a = g/√30 ≈ g/5.47, closest to g/5."
  },
  {
    questionNo: 5, exam: "JEE Main-2019 (January)", subject: "Physics", chapter: "Gravitation", type: "mcq",
    text: "If the angular momentum of a planet of mass m, moving around the Sun in a circular orbit is L, about the center of the Sun, its areal velocity is:",
    options: [{ label: "A", text: "L/m" }, { label: "B", text: "4L/m" }, { label: "C", text: "L/2m" }, { label: "D", text: "2L/m" }],
    correctAnswer: "C",
    explanation: "According to Kepler's Second Law, the areal velocity (rate of area swept out by the radius vector per unit time) is given by dA/dt = L/(2m), where L is the angular momentum and m is the mass of the planet."
  },
  {
    questionNo: 6, exam: "JEE Main-2019 (January)", subject: "Physics", chapter: "Gravitation", type: "mcq",
    text: "Two satellites, A and B, have masses m and 2m respectively. A is in a circular orbit of radius R, and B is in a circular orbit of radius 2R around the earth. The ratio of their kinetic energies, T_A / T_B is:",
    options: [{ label: "A", text: "1/2" }, { label: "B", text: "1" }, { label: "C", text: "2" }, { label: "D", text: "1/√2" }],
    correctAnswer: "B",
    explanation: "The kinetic energy of a satellite in a circular orbit of radius r is K = GMm/(2r). For satellite A: T_A = GMm/(2R). For satellite B: T_B = GM(2m)/(2(2R)) = GMm/(2R). Therefore, T_A/T_B = 1."
  },
  {
    questionNo: 7, exam: "JEE Main-2019 (January)", subject: "Physics", chapter: "Gravitation", type: "mcq",
    text: "A satellite of mass M is in a circular orbit of radius R about the centre of the earth. A meteorite of the same mass, falling towards the earth collides with the satellite completely inelastically. The speeds of the satellite and the meteorite are the same, just before the collision. The subsequent motion of the combined body will be:",
    options: [
      { label: "A", text: "such that it escapes to infinity" },
      { label: "B", text: "in an elliptical orbit" },
      { label: "C", text: "in the same circular orbit of radius R" },
      { label: "D", text: "in a circular orbit of a different radius" }
    ],
    correctAnswer: "B",
    explanation: "The initial speed of the satellite is the orbital speed v_o = √(GM/R). Since the collision is perfectly inelastic and the two bodies move perpendicular to each other before impact, conservation of linear momentum gives the final velocity v_f of the combined mass 2M: (2M)v_f = √((Mv_o)² + (Mv_o)²) = √2 Mv_o ⇒ v_f = v_o/√2 = √(GM/(2R)). The escape velocity for the combined mass at distance R is v_e = √(2G(2M)/R) = √(4GM/R). Since v_f < v_o < v_e and it has a radial velocity component, the trajectory cannot be circular; it must follow a closed bound elliptical orbit."
  },
  {
    questionNo: 8, exam: "JEE Main-2019 (January)", subject: "Physics", chapter: "Gravitation", type: "mcq",
    text: "A straight rod of length L extends from x = a to x = L + a. The gravitational force it exerts on a point mass 'm' at x = 0, if the mass per unit length of the rod is A + Bx², is given by:",
    options: [
      { label: "A", text: "Gm [ A ( 1/(a+L) - 1/a ) - BL ]" },
      { label: "B", text: "Gm [ A ( 1/a - 1/(a+L) ) - BL ]" },
      { label: "C", text: "Gm [ A ( 1/(a+L) - 1/a ) + BL ]" },
      { label: "D", text: "Gm [ A ( 1/a - 1/(a+L) ) + BL ]" }
    ],
    correctAnswer: "D",
    explanation: "Consider a small element of the rod of length dx at a distance x from the origin. Its mass is dm = λ dx = (A + Bx²)dx. The small gravitational force on mass m is dF = G m dm / x² = Gm(A + Bx²)dx / x² = Gm (A/x² + B) dx. Integrating from x = a to x = a+L: F = Gm ∫ₐ^(a+L) (Ax⁻² + B) dx = Gm [ -A/x + Bx ]ₐ^(a+L) = Gm [ A(1/a - 1/(a+L)) + BL ]."
  },
  {
    questionNo: 9, exam: "JEE Main-2019 (January)", subject: "Physics", chapter: "Gravitation", type: "mcq",
    text: "Two stars of masses 3×10³¹ kg each, and at distance 2×10¹¹ m rotate in a plane about their common centre of mass O. A meteorite passes through O moving perpendicular to the star's rotation plane. In order to escape from the gravitational field of this double star, the minimum speed that meteorite should have at O is: (Take Gravitational constant G = 6.67×10⁻¹¹ Nm²/kg²)",
    options: [
      { label: "A", text: "2.4×10⁴ m/s" },
      { label: "B", text: "1.4×10⁵ m/s" },
      { label: "C", text: "3.8×10⁴ m/s" },
      { label: "D", text: "2.8×10⁵ m/s" }
    ],
    correctAnswer: "D",
    explanation: "The distance of each star from the center of mass O is r = d/2 = (2×10¹¹)/2 = 10¹¹ m. Total potential energy of the meteorite of mass m' at O due to both stars is U = -GMm'/r - GMm'/r = -2GMm'/r. For the meteorite to escape, its total mechanical energy at O must be at least 0: ½m'v² - 2GMm'/r = 0 ⇒ v = √(4GM/r). Substituting: v = √((4×6.67×10⁻¹¹×3×10³¹)/10¹¹) = √(80.04×10⁹) ≈ 2.83×10⁵ m/s."
  },
  {
    questionNo: 10, exam: "JEE Main-2019 (April)", subject: "Physics", chapter: "Gravitation", type: "mcq",
    text: "A test particle is moving in a circular orbit in the gravitational field produced by a mass density ρ(r) = K/r². Identify the correct relation between the radius R of the particle's orbit and its period T:",
    options: [
      { label: "A", text: "T/R² is a constant" },
      { label: "B", text: "TR is a constant" },
      { label: "C", text: "T²/R³ is a constant" },
      { label: "D", text: "T/R is a constant" }
    ],
    correctAnswer: "D",
    explanation: "The mass enclosed within a radius R is M(R) = ∫₀ᴿ ρ(r)·4πr² dr = ∫₀ᴿ (K/r²)·4πr² dr = 4πKR. The gravitational force provides the centripetal force: G M(R) m / R² = m v² / R ⇒ v² = G(4πKR)/R = 4πGK. Since v is independent of R, the time period is T = 2πR/v ⇒ T/R = 2π/v = constant."
  },
  {
    questionNo: 11, exam: "JEE Main-2019 (April)", subject: "Physics", chapter: "Gravitation", type: "mcq",
    text: "Four identical particles of mass M are located at the corners of a square of side 'a'. What should be their speed if each of them revolves under the influence of other's gravitational field in a circular orbit circumscribing the square?",
    options: [
      { label: "A", text: "1.21 √(GM/a)" },
      { label: "B", text: "1.41 √(GM/a)" },
      { label: "C", text: "1.16 √(GM/a)" },
      { label: "D", text: "1.35 √(GM/a)" }
    ],
    correctAnswer: "C",
    explanation: "The radius of the circumscribing circle is R = a/√2. The net gravitational force on any one particle towards the center is F_net = (GM²/a²)cos45° + (GM²/a²)sin45° + GM²/(√2 a)² = √2GM²/a² + GM²/(2a²) = (GM²/a²)(√2 + 1/2). This provides the centripetal force: Mv²/R = Mv²/(a/√2) = √2Mv²/a. Equating: √2Mv²/a = (GM²/a²)(√2 + 1/2) ⇒ v² = (GM/a)(1 + 1/(2√2)) ≈ (GM/a)(1.3535) ⇒ v ≈ 1.16√(GM/a)."
  },
  {
    questionNo: 12, exam: "JEE Main-2019 (April)", subject: "Physics", chapter: "Gravitation", type: "mcq",
    text: "A spaceship orbits around a planet at a height of 20 km from its surface. Assuming that only gravitational field of the planet acts on the spaceship, what will be the number of complete revolutions made by the spaceship in 24 hours around the planet? [Given: Mass of planet = 8×10²² kg; Radius of planet = 2×10⁶ m, Gravitational constant G = 6.67×10⁻¹¹ Nm²/kg²]",
    options: [{ label: "A", text: "9" }, { label: "B", text: "11" }, { label: "C", text: "13" }, { label: "D", text: "17" }],
    correctAnswer: "B",
    explanation: "The radius of the orbit is r = R + h = 2×10⁶ + 20×10³ = 2.02×10⁶ m. Orbital velocity v = √(GM/r) = √((6.67×10⁻¹¹×8×10²²)/(2.02×10⁶)) ≈ 1625 m/s. Time period T = 2πr/v = (2×3.1416×2.02×10⁶)/1625 ≈ 7810 s. Total time = 24 h = 86400 s. Number of revolutions = 86400/7810 ≈ 11.06, so 11 complete revolutions."
  },
  {
    questionNo: 13, exam: "JEE Main-2019 (April)", subject: "Physics", chapter: "Gravitation", type: "mcq",
    text: "A rocket has to be launched from earth in such a way that it never returns. If E is the minimum energy delivered by the rocket launcher, what should be the minimum energy that the launcher should have if the same rocket is to be launched from the surface of the moon? Assume that the density of the earth and the moon are equal and that the earth's volume is 64 times the volume of the moon:",
    options: [{ label: "A", text: "E/4" }, { label: "B", text: "E/16" }, { label: "C", text: "E/32" }, { label: "D", text: "E/64" }],
    correctAnswer: "B",
    explanation: "Minimum energy to escape is equal to the magnitude of potential energy at the surface: E = GMm/R. Since M = ρ·(4/3)πR³, we have E ∝ R³/R ∝ R². Given V_e = 64V_m ⇒ R_e³ = 64R_m³ ⇒ R_e = 4R_m. Therefore, E_m/E_e = (R_m/R_e)² = (1/4)² = 1/16 ⇒ E_m = E/16."
  },

  // ==================== CHEMISTRY ====================
  {
    questionNo: 1, exam: "JEE Main 2017", subject: "Chemistry", chapter: "Some Basic Concepts of Chemistry", type: "mcq",
    text: "1 gram of a carbonate (M₂CO₃) on treatment with excess HCl produces 0.01186 mole of CO₂. The molar mass of M₂CO₃ in g mol⁻¹ is",
    options: [{ label: "A", text: "1186" }, { label: "B", text: "84.3" }, { label: "C", text: "118.6" }, { label: "D", text: "11.86" }],
    correctAnswer: "B",
    explanation: "M₂CO₃ + 2HCl → 2MCl + H₂O + CO₂. 1 mole of M₂CO₃ produces 1 mole of CO₂. Therefore, moles of M₂CO₃ = moles of CO₂ = 0.01186 mol. Moles = Mass / Molar Mass ⇒ 0.01186 = 1 / M ⇒ M = 1/0.01186 ≈ 84.3 g/mol."
  },
  {
    questionNo: 2, exam: "JEE Main 2017", subject: "Chemistry", chapter: "Some Basic Concepts of Chemistry", type: "mcq",
    text: "The most abundant elements by mass in the body of a healthy human adult are: Oxygen (61.4%), Carbon (22.9%), Hydrogen (10.0%), and Nitrogen (2.6%). The weight which a 75kg person would gain if all ¹H atoms are replaced by ²H atoms is",
    options: [{ label: "A", text: "15 kg" }, { label: "B", text: "37.5 kg" }, { label: "C", text: "7.5 kg" }, { label: "D", text: "10 kg" }],
    correctAnswer: "C",
    explanation: "Total mass = 75 kg. Mass of Hydrogen = 10% of 75 kg = 7.5 kg. When ¹H (mass ≈ 1 amu) is replaced by ²H (mass ≈ 2 amu), the mass of each hydrogen atom doubles. New mass of hydrogen = 2×7.5 = 15 kg. Mass gain = 15 - 7.5 = 7.5 kg."
  },
  {
    questionNo: 3, exam: "JEE Main 2018", subject: "Chemistry", chapter: "Some Basic Concepts of Chemistry", type: "mcq",
    text: "The ratio of mass percent of C and H of an organic compound (CₓHᵧO_z) is 6 : 1. If one molecule of the above compound contains half as much oxygen as required to burn one molecule of compound CₓHᵧ completely to CO₂ and H₂O. The empirical formula of compound CₓHᵧO_z is",
    options: [{ label: "A", text: "C₂H₄O" }, { label: "B", text: "C₃H₄O₂" }, { label: "C", text: "C₂H₄O₃" }, { label: "D", text: "C₃H₆O₃" }],
    correctAnswer: "C",
    explanation: "Mass ratio C:H = 6:1. Molar ratio C:H = (6/12):(1/1) = 0.5:1 = 1:2. So the hydrocarbon is (CH₂)_n, hence y = 2x. Combustion: CₓH₂ₓ + 1.5x O₂ → x CO₂ + x H₂O. Oxygen atoms required = 2×1.5x = 3x. Given z = 0.5×3x = 1.5x. Ratio x:y:z = x:2x:1.5x = 1:2:1.5 = 2:4:3. Empirical formula = C₂H₄O₃."
  },
  {
    questionNo: 4, exam: "JEE Main 2019 (January)", subject: "Chemistry", chapter: "Environmental Chemistry", type: "mcq",
    text: "The concentration of dissolved oxygen (DO) in cold water can go upto:",
    options: [{ label: "A", text: "14 ppm" }, { label: "B", text: "8 ppm" }, { label: "C", text: "10 ppm" }, { label: "D", text: "16 ppm" }],
    correctAnswer: "A",
    explanation: "In cold water, the concentration of dissolved oxygen (DO) can reach up to 10 ppm or higher, and under standard conditions mentioned in NCERT, it goes up to 14 ppm."
  },
  {
    questionNo: 5, exam: "JEE Main 2019 (January)", subject: "Chemistry", chapter: "Some Basic Concepts of Chemistry", type: "mcq",
    text: "A 10 mg effervescent tablet containing sodium bicarbonate and oxalic acid releases 0.25 ml of CO₂ at T = 298.15 K and p = 1 bar. If molar volume of CO₂ is 25.0 L under such condition, what is the percentage of sodium bicarbonate in each tablet? [Molar mass of NaHCO₃ = 84 g mol⁻¹]",
    options: [{ label: "A", text: "0.84" }, { label: "B", text: "33.6" }, { label: "C", text: "16.8" }, { label: "D", text: "8.4" }],
    correctAnswer: "D",
    explanation: "Molar volume of CO₂ = 25.0 L/mol = 25000 mL/mol. Moles of CO₂ = 0.25/25000 = 10⁻⁵ mol. NaHCO₃ + acid → CO₂, so moles of NaHCO₃ = 10⁻⁵ mol. Mass = 10⁻⁵×84 = 8.4×10⁻⁴ g = 0.84 mg. Percentage = (0.84/10)×100 = 8.4%."
  },
  {
    questionNo: 6, exam: "JEE Main 2019 (January)", subject: "Chemistry", chapter: "Environmental Chemistry", type: "mcq",
    text: "Water filled in two glasses A and B have BOD values of 10 and 20 respectively. The correct statement regarding them is",
    options: [
      { label: "A", text: "B is more polluted than A" },
      { label: "B", text: "A is suitable for drinking, whereas B is not" },
      { label: "C", text: "Both are suitable for drinking" },
      { label: "D", text: "A is more polluted than B" }
    ],
    correctAnswer: "A",
    explanation: "Biochemical Oxygen Demand (BOD) is a measure of organic pollution in water. Higher BOD values signify greater organic waste and higher pollution levels. Since glass B has BOD = 20 and A has 10, B is more polluted than A."
  },
  {
    questionNo: 7, exam: "JEE Main 2019 (January)", subject: "Chemistry", chapter: "Some Basic Concepts of Chemistry", type: "mcq",
    text: "For the following reaction the mass of water produced from 445 g of C₅₇H₁₁₀O₆ is: 2C₅₇H₁₁₀O₆(s) + 163O₂(g) → 114CO₂(g) + 110H₂O(l)",
    options: [{ label: "A", text: "490 g" }, { label: "B", text: "445 g" }, { label: "C", text: "495 g" }, { label: "D", text: "4 g" }],
    correctAnswer: "C",
    explanation: "Molar mass of C₅₇H₁₁₀O₆ = (57×12)+(110×1)+(6×16) = 684+110+96 = 890 g/mol. Moles of C₅₇H₁₁₀O₆ = 445/890 = 0.5 mol. From stoichiometry, 2 moles give 110 moles of H₂O, so 0.5 mol gives (110/2)×0.5 = 27.5 mol. Mass of water = 27.5×18 = 495 g."
  },
  {
    questionNo: 8, exam: "JEE Main 2019 (January)", subject: "Chemistry", chapter: "Some Basic Concepts of Chemistry", type: "mcq",
    text: "50 mL of 0.5 M oxalic acid is needed to neutralize 25 ml of sodium hydroxide solution. The amount of NaOH in 50 mL of the given sodium hydroxide solution is",
    options: [{ label: "A", text: "4 g" }, { label: "B", text: "10 g" }, { label: "C", text: "20 g" }, { label: "D", text: "80 g" }],
    correctAnswer: "A",
    explanation: "Oxalic acid (H₂C₂O₄) is dibasic (n=2). NaOH is monoacidic (n=1). Using N₁V₁ = N₂V₂: 0.5×2×50 = M_NaOH×1×25 ⇒ 50 = 25×M_NaOH ⇒ M_NaOH = 2 M. Moles of NaOH in 50 mL = 2×(50/1000) = 0.1 mol. Mass = 0.1×40 = 4 g."
  },
  {
    questionNo: 9, exam: "JEE Main 2019 (January)", subject: "Chemistry", chapter: "Some Basic Concepts of Chemistry", type: "mcq",
    text: "A solution of sodium sulphate contains 92 g of Na⁺ ions per kilogram of water. The Molality of Na⁺ ions in that solution in mol kg⁻¹ is",
    options: [{ label: "A", text: "12" }, { label: "B", text: "4" }, { label: "C", text: "8" }, { label: "D", text: "16" }],
    correctAnswer: "B",
    explanation: "Moles of Na⁺ = 92/23 = 4 mol. Mass of water = 1 kg. Molality = 4/1 = 4 mol/kg."
  },
  {
    questionNo: 10, exam: "JEE Main 2019 (January)", subject: "Chemistry", chapter: "Some Basic Concepts of Chemistry", type: "mcq",
    text: "The hardness of water sample (in terms of equivalents of CaCO₃) containing 10⁻³ M CaSO₄ is (molar mass of CaSO₄ = 136 g mol⁻¹)",
    options: [{ label: "A", text: "10 ppm" }, { label: "B", text: "50 ppm" }, { label: "C", text: "90 ppm" }, { label: "D", text: "100 ppm" }],
    correctAnswer: "D",
    explanation: "1 mole of CaSO₄ is equivalent to 1 mole of CaCO₃ (both have valency factor 2). Concentration of CaCO₃ equivalent = 10⁻³ M. Mass in 1 L = 10⁻³×100 = 0.1 g = 100 mg. Hardness = 100 ppm."
  },
  {
    questionNo: 11, exam: "JEE Main 2019 (January)", subject: "Chemistry", chapter: "Environmental Chemistry", type: "mcq",
    text: "Water sample with BOD values of 4 ppm and 18 ppm respectively are",
    options: [
      { label: "A", text: "Clean and clean" },
      { label: "B", text: "Highly polluted and clean" },
      { label: "C", text: "Clean and highly polluted" },
      { label: "D", text: "Highly polluted and highly polluted" }
    ],
    correctAnswer: "C",
    explanation: "Clean water has a BOD value of less than 5 ppm, whereas highly polluted water has a BOD value of 17 ppm or more. Thus, 4 ppm = clean, 18 ppm = highly polluted."
  },
  {
    questionNo: 12, exam: "JEE Main 2019 (January)", subject: "Chemistry", chapter: "Some Basic Concepts of Chemistry", type: "mcq",
    text: "The amount of sugar (C₁₂H₂₂O₁₁) required to prepare 2 L of its 0.1 M aqueous solution is:",
    options: [{ label: "A", text: "136.8 g" }, { label: "B", text: "17.1 g" }, { label: "C", text: "68.4 g" }, { label: "D", text: "34.2 g" }],
    correctAnswer: "C",
    explanation: "Molar mass of C₁₂H₂₂O₁₁ = (12×12)+(22×1)+(11×16) = 144+22+176 = 342 g/mol. Moles = 0.1×2 = 0.2 mol. Mass = 0.2×342 = 68.4 g."
  },
  {
    questionNo: 13, exam: "JEE Main 2019 (January)", subject: "Chemistry", chapter: "Some Basic Concepts of Chemistry", type: "mcq",
    text: "8 g of NaOH is dissolved in 18 g of H₂O. Mole fraction of NaOH in solution and molality (in mol kg⁻¹) of the solution respectively are:",
    options: [
      { label: "A", text: "0.2, 22.20" },
      { label: "B", text: "0.2, 11.11" },
      { label: "C", text: "0.167, 11.11" },
      { label: "D", text: "0.167, 22.20" }
    ],
    correctAnswer: "C",
    explanation: "Moles of NaOH = 8/40 = 0.2 mol. Moles of H₂O = 18/18 = 1.0 mol. Total moles = 1.2 mol. Mole fraction of NaOH = 0.2/1.2 = 0.167. Molality = 0.2/(18/1000) = 200/18 = 11.11 mol/kg."
  },
  {
    questionNo: 14, exam: "JEE Main 2019 (January)", subject: "Chemistry", chapter: "Some Basic Concepts of Chemistry", type: "mcq",
    text: "The volume strength of 1 M H₂O₂ is : (Molar mass of H₂O₂ = 34 g mol⁻¹)",
    options: [{ label: "A", text: "5.6" }, { label: "B", text: "16.8" }, { label: "C", text: "11.35" }, { label: "D", text: "22.4" }],
    correctAnswer: "C",
    explanation: "Volume strength of H₂O₂ at STP is given by: Volume Strength = Molarity × 11.35. Given Molarity = 1 M. Volume strength = 1 × 11.35 = 11.35."
  },
  {
    questionNo: 15, exam: "JEE Main 2019 (January)", subject: "Chemistry", chapter: "Some Basic Concepts of Chemistry", type: "mcq",
    text: "An open vessel at 27°C is heated until two fifth of the air (assumed as an ideal gas) in it has escaped from the vessel. Assuming that the volume of the vessel remains constant, the temperature at which the vessel has been heated is:",
    options: [{ label: "A", text: "500°C" }, { label: "B", text: "500 K" }, { label: "C", text: "750°C" }, { label: "D", text: "750 K" }],
    correctAnswer: "B",
    explanation: "For an open vessel, P and V are constant. n₁T₁ = n₂T₂. T₁ = 27°C = 300 K. Moles escaped = 2/5 n₁, so n₂ = 3/5 n₁. n₁×300 = (3/5)n₁×T₂ ⇒ T₂ = 300×5/3 = 500 K."
  },
  {
    questionNo: 16, exam: "JEE Main 2019", subject: "Chemistry", chapter: "Some Basic Concepts of Chemistry", type: "mcq",
    text: "100 mL of a water sample contains 0.81 g of calcium bicarbonate and 0.73 g of magnesium bicarbonate. The hardness of this water sample expressed in terms of equivalents of CaCO₃ is : (molar mass of calcium bicarbonate is 162 g mol⁻¹ and magnesium bicarbonate is 146 g mol⁻¹)",
    options: [{ label: "A", text: "1,000 ppm" }, { label: "B", text: "10,000 ppm" }, { label: "C", text: "100 ppm" }, { label: "D", text: "5,000 ppm" }],
    correctAnswer: "B",
    explanation: "Moles of Ca(HCO₃)₂ = 0.81/162 = 0.005 mol. Moles of Mg(HCO₃)₂ = 0.73/146 = 0.005 mol. Total equivalent moles of CaCO₃ = 0.01 mol. Mass of CaCO₃ equivalent = 0.01×100 = 1 g in 100 mL. Mass in 1 L = 10 g = 10,000 mg. Hardness = 10,000 ppm."
  },
  {
    questionNo: 17, exam: "JEE Main 2019", subject: "Chemistry", chapter: "Some Basic Concepts of Chemistry", type: "mcq",
    text: "For a reaction, N₂(g) + 3H₂(g) → 2NH₃(g); identify dihydrogen (H₂) as a limiting reagent in the following reaction mixtures.",
    options: [
      { label: "A", text: "14g of N₂ + 4g of H₂" },
      { label: "B", text: "28g of N₂ + 6g of H₂" },
      { label: "C", text: "56g of N₂ + 10g of H₂" },
      { label: "D", text: "35g of N₂ + 8g of H₂" }
    ],
    correctAnswer: "C",
    explanation: "1 mole N₂ (28 g) requires 3 moles H₂ (6 g). Required mass ratio N₂:H₂ = 28/6 = 4.67. If actual ratio > 4.67, H₂ is limiting. (A) 14/4=3.5 (N₂ limiting), (B) 28/6=4.67 (stoichiometric), (C) 56/10=5.6 > 4.67 (H₂ limiting), (D) 35/8=4.375 (N₂ limiting)."
  },
  {
    questionNo: 18, exam: "JEE Main 2019", subject: "Chemistry", chapter: "Some Basic Concepts of Chemistry", type: "mcq",
    text: "The percentage composition of carbon by mole in methane is :",
    options: [{ label: "A", text: "80%" }, { label: "B", text: "25%" }, { label: "C", text: "75%" }, { label: "D", text: "20%" }],
    correctAnswer: "D",
    explanation: "Methane is CH₄. In 1 mole of CH₄: 1 mole of C + 4 moles of H = 5 total moles. % of C by mole = (1/5)×100 = 20%."
  },
  {
    questionNo: 19, exam: "JEE Main 2019", subject: "Chemistry", chapter: "Environmental Chemistry", type: "mcq",
    text: "The maximum prescribed concentration of copper in drinking water is :",
    options: [{ label: "A", text: "5 ppm" }, { label: "B", text: "0.5 ppm" }, { label: "C", text: "0.05 ppm" }, { label: "D", text: "3 ppm" }],
    correctAnswer: "D",
    explanation: "According to standard NCERT drinking water standards, the maximum prescribed concentration of copper in drinking water is 3 ppm."
  },
  {
    questionNo: 20, exam: "JEE Main 2019", subject: "Chemistry", chapter: "Some Basic Concepts of Chemistry", type: "mcq",
    text: "0.27 g of a long chain fatty acid was dissolved in 100 cm³ of hexane. 10 mL of this solution was added dropwise to the surface of water in a round watch glass. Hexane evaporates and a monolayer is formed. The distance from edge to centre of the watch glass is 10 cm. What is the height of the monolayer? [Density of fatty acid = 0.9 g cm⁻³, π = 3]",
    options: [{ label: "A", text: "10⁻⁸ m" }, { label: "B", text: "10⁻⁶ m" }, { label: "C", text: "10⁻⁴ m" }, { label: "D", text: "10⁻² m" }],
    correctAnswer: "B",
    explanation: "Concentration = 0.27 g/100 mL. Mass in 10 mL = (0.27/100)×10 = 0.027 g. Volume = 0.027/0.9 = 0.03 cm³. Monolayer area = πr² = 3×(10)² = 300 cm². Height = Volume/Area = 0.03/300 = 10⁻⁴ cm = 10⁻⁶ m."
  },
  {
    questionNo: 21, exam: "JEE Main 2020 (January)", subject: "Chemistry", chapter: "Coordination Compounds", type: "integer",
    text: "The volume (in mL) of 0.125 M AgNO₃ required to quantitatively precipitate chloride ions in 0.3 g of [Co(NH₃)₆]Cl₃ is ________. M_[Co(NH₃)₆]Cl₃ = 267.46 g/mol, M_AgNO₃ = 169.87 g/mol",
    correctAnswer: "27",
    explanation: "In [Co(NH₃)₆]Cl₃, 1 mole releases 3 moles of Cl⁻. Moles of complex = 0.3/267.46 ≈ 0.0011216 mol. Moles of Cl⁻ = 3×0.0011216 = 0.003365 mol. Moles of AgNO₃ required = 0.003365 mol. Volume = 0.003365/0.125 = 0.02692 L ≈ 27 mL."
  },
  {
    questionNo: 22, exam: "JEE Main 2020 (January)", subject: "Chemistry", chapter: "Some Basic Concepts of Chemistry", type: "integer",
    text: "NaClO₃ is used, even in spacecrafts, to produce O₂. The daily consumption of pure O₂ by a person is 492L at 1 atm, 300 K. How much amount of NaClO₃, in grams, is required to produce O₂ for the daily consumption of a person at 1 atm, 300 K? NaClO₃(s) + Fe(s) → O₂(g) + NaCl(s) + FeO(s). R = 0.082 L atm mol⁻¹ K⁻¹",
    correctAnswer: "2130",
    explanation: "PV = nRT ⇒ 1×492 = n×0.082×300 ⇒ n = 492/24.6 = 20 moles of O₂. 1 mole NaClO₃ produces 1 mole O₂, so 20 moles NaClO₃ needed. Molar mass NaClO₃ = 23+35.5+48 = 106.5 g/mol. Mass = 20×106.5 = 2130 g."
  },
  {
    questionNo: 23, exam: "JEE Main 2020 (January)", subject: "Chemistry", chapter: "Some Basic Concepts of Chemistry", type: "integer",
    text: "The hardness of a water sample containing 10⁻³ M MgSO₄ expressed as CaCO₃ equivalents (in ppm) is ________. (molar mass of MgSO₄ is 120.37 g/mol)",
    correctAnswer: "100",
    explanation: "1 mole of MgSO₄ is equivalent to 1 mole of CaCO₃. Concentration = 10⁻³ M, hence CaCO₃ equivalent = 10⁻³ M. Mass in 1 L = 10⁻³×100 = 0.1 g = 100 mg. Hardness = 100 ppm."
  },
  {
    questionNo: 24, exam: "JEE Main 2020 (January)", subject: "Chemistry", chapter: "Coordination Compounds", type: "mcq",
    text: "Complex A has a composition of H₁₂O₆Cl₃Cr. If the complex on treatment with conc. H₂SO₄ loses 13.5% of its original mass, the correct molecular formula of A is [Given: Atomic mass of Cr = 52 amu and Cl = 35.5 amu]",
    options: [
      { label: "A", text: "[Cr(H₂O)₆]Cl₃" },
      { label: "B", text: "[Cr(H₂O)₅Cl]Cl₂·H₂O" },
      { label: "C", text: "[Cr(H₂O)₄Cl₂]Cl·2H₂O" },
      { label: "D", text: "[Cr(H₂O)₃Cl₃]·3H₂O" }
    ],
    correctAnswer: "C",
    explanation: "Molar mass of CrCl₃·6H₂O = 52+106.5+108 = 266.5 g/mol. Mass lost with conc. H₂SO₄ = 13.5% of 266.5 = 36 g. Molar mass of H₂O = 18, so water molecules lost = 36/18 = 2. These 2 water molecules are outside the coordination sphere. Formula = [Cr(H₂O)₄Cl₂]Cl·2H₂O."
  },
  {
    questionNo: 25, exam: "JEE Main 2020 (January)", subject: "Chemistry", chapter: "Some Basic Concepts of Chemistry", type: "integer",
    text: "6.023×10²² molecules are present in 10 g of a substance 'x'. The molarity of a solution containing 5 g of substance 'x' in 2 L solution is ________ × 10⁻³.",
    correctAnswer: "25",
    explanation: "6.023×10²³ molecules = 1 mole. Given 6.023×10²² = 0.1 mole with mass 10 g. So 1 mole of 'x' has mass 100 g (Molar mass = 100 g/mol). Moles in 5 g = 5/100 = 0.05 mol. Molarity = 0.05/2 = 0.025 M = 25×10⁻³ M."
  },

  // ==================== MATHEMATICS - Trigonometric Ratio and Identities ====================
  {
    questionNo: 1, exam: "JEE Main 2019 (January)", subject: "Mathematics", chapter: "Trigonometric Ratio and Identities", type: "mcq",
    text: "For any θ ∈ (π/4, π/2), the expression 3(sinθ - cosθ)⁴ + 6(sinθ + cosθ)² + 4sin⁶θ equals :",
    options: [
      { label: "A", text: "13 - 4cos²θ + 6sin²θcos²θ" },
      { label: "B", text: "13 - 4cos⁶θ" },
      { label: "C", text: "13 - 4cos²θ + 6cos⁴θ" },
      { label: "D", text: "13 - 4cos⁴θ + 2sin²θcos²θ" }
    ],
    correctAnswer: "B",
    explanation: "Let E = 3(sinθ-cosθ)⁴ + 6(sinθ+cosθ)² + 4sin⁶θ. (sinθ-cosθ)² = 1-2sinθcosθ, (sinθ+cosθ)² = 1+2sinθcosθ. 3(1-2sinθcosθ)² = 3-12sinθcosθ+12sin²θcos²θ. 6(1+2sinθcosθ) = 6+12sinθcosθ. Sum = 9+12sin²θcos²θ = 9+12sin²θ-12sin⁴θ. Adding 4sin⁶θ: E = 9+12sin²θ-12sin⁴θ+4sin⁶θ = 13-4cos⁶θ."
  },
  {
    questionNo: 2, exam: "JEE Main 2019 (January)", subject: "Mathematics", chapter: "Trigonometric Ratio and Identities", type: "mcq",
    text: "Let α and β be the roots of the quadratic equation x²sinθ - x(sinθcosθ + 1) + cosθ = 0 (0 < θ < 45°), and α < β. Then ∑_{n=0}^{∞} [αⁿ + ((-1)ⁿ/βⁿ)] is equal to :",
    options: [
      { label: "A", text: "1/(1-cosθ) - 1/(1+sinθ)" },
      { label: "B", text: "1/(1+cosθ) + 1/(1-sinθ)" },
      { label: "C", text: "1/(1-cosθ) + 1/(1+sinθ)" },
      { label: "D", text: "1/(1+cosθ) - 1/(1-sinθ)" }
    ],
    correctAnswer: "C",
    explanation: "x²sinθ - x(sinθcosθ+1) + cosθ = 0 ⇒ (x-cosθ)(x·sinθ-1) = 0. Roots: cosθ and 1/sinθ. For 0<θ<45°, cosθ < 1/sinθ. Since α<β, α=cosθ, β=1/sinθ. Sum = 1/(1-α) + 1/(1+1/β) = 1/(1-cosθ) + 1/(1+sinθ)."
  },
  {
    questionNo: 3, exam: "JEE Main 2019 (January)", subject: "Mathematics", chapter: "Trigonometric Ratio and Identities", type: "mcq",
    text: "The maximum value of 3cosθ + 5sin(θ-π/6) for any real value of θ is:",
    options: [{ label: "A", text: "√19" }, { label: "B", text: "√79/2" }, { label: "C", text: "√34" }, { label: "D", text: "√31" }],
    correctAnswer: "A",
    explanation: "y = 3cosθ + 5sin(θ-π/6) = 3cosθ + 5(sinθ·√3/2 - cosθ·1/2) = 3cosθ + (5√3/2)sinθ - (5/2)cosθ = (1/2)cosθ + (5√3/2)sinθ. Max = √((1/2)²+(5√3/2)²) = √(1/4+75/4) = √19."
  },
  {
    questionNo: 4, exam: "JEE Main 2019 (January)", subject: "Mathematics", chapter: "Trigonometric Ratio and Identities", type: "mcq",
    text: "If sin⁴α + 4cos⁴β + 2 = 4√2 sinα cosβ; α, β ∈ [0, π], then cos(α+β) - cos(α-β) is equal to :",
    options: [{ label: "A", text: "0" }, { label: "B", text: "-1" }, { label: "C", text: "√2" }, { label: "D", text: "-√2" }],
    correctAnswer: "D",
    explanation: "By AM-GM: (sin⁴α+4cos⁴β+1+1)/4 ≥ (sin⁴α·4cos⁴β·1·1)^(1/4) = √2|sinα cosβ|. Equality holds when sin⁴α = 4cos⁴β = 1. So sinα = 1 ⇒ α = π/2. cos²β = 1/2 ⇒ cosβ = 1/√2 ⇒ β = π/4. cos(α+β)-cos(α-β) = -2sinα sinβ = -2·1·(1/√2) = -√2."
  },
  {
    questionNo: 5, exam: "JEE Main 2019 (April)", subject: "Mathematics", chapter: "Trigonometric Ratio and Identities", type: "mcq",
    text: "If cos(α+β) = 3/5, sin(α-β) = 5/13 and 0 < α, β < π/4, then tan(2α) is equal to :",
    options: [{ label: "A", text: "21/16" }, { label: "B", text: "63/52" }, { label: "C", text: "33/52" }, { label: "D", text: "63/16" }],
    correctAnswer: "D",
    explanation: "cos(α+β)=3/5 ⇒ tan(α+β)=4/3. sin(α-β)=5/13 ⇒ tan(α-β)=5/12. tan(2α) = tan[(α+β)+(α-β)] = (4/3+5/12)/(1-(4/3)(5/12)) = (21/12)/(16/36) = (21/12)×(36/16) = 63/16."
  },
  {
    questionNo: 6, exam: "JEE Main 2019 (April)", subject: "Mathematics", chapter: "Trigonometric Ratio and Identities", type: "mcq",
    text: "The value of cos²10° - cos10°cos50° + cos²50° is",
    options: [
      { label: "A", text: "3/2 (1 + cos20°)" },
      { label: "B", text: "3/4" },
      { label: "C", text: "3/4 + cos20°" },
      { label: "D", text: "3/2" }
    ],
    correctAnswer: "B",
    explanation: "E = (1/2)[2cos²10°-2cos10°cos50°+2cos²50°] = (1/2)[(1+cos20°)-(cos60°+cos40°)+(1+cos100°)] = (1/2)[2+cos20°-1/2-cos40°+cos100°] = (1/2)[3/2+cos100°+cos20°-cos40°] = (1/2)[3/2+cos40°-cos40°] = (1/2)(3/2) = 3/4."
  },
  {
    questionNo: 7, exam: "JEE Main 2019 (April)", subject: "Mathematics", chapter: "Trigonometric Ratio and Identities", type: "mcq",
    text: "The value of sin10° sin30° sin50° sin70° is:",
    options: [{ label: "A", text: "1/36" }, { label: "B", text: "1/32" }, { label: "C", text: "1/18" }, { label: "D", text: "1/16" }],
    correctAnswer: "D",
    explanation: "sin30° = 1/2. Expression = (1/2)[sin10° sin50° sin70°]. Using sinθ sin(60°-θ) sin(60°+θ) = (1/4)sin3θ with θ=10°: sin10° sin50° sin70° = (1/4)sin30° = (1/4)(1/2) = 1/8. Total = (1/2)(1/8) = 1/16."
  },
  {
    questionNo: 8, exam: "JEE Main 2019 (April)", subject: "Mathematics", chapter: "Trigonometric Ratio and Identities", type: "mcq",
    text: "All the pairs (x, y) that satisfy the inequality 2^{√(sin²x-2sinx+5)} · 1/(4^{sin²y}) ≤ 1 also satisfy the equation:",
    options: [
      { label: "A", text: "sinx = |siny|" },
      { label: "B", text: "sinx = 2siny" },
      { label: "C", text: "2|sinx| = 3siny" },
      { label: "D", text: "2sinx = siny" }
    ],
    correctAnswer: "A",
    explanation: "2^{√((sinx-1)²+4)} ≤ 4^{sin²y} = 2^{2sin²y}. Taking log₂: √((sinx-1)²+4) ≤ 2sin²y. LHS min = 2 (when sinx=1). RHS max = 2 (when sin²y=1). Equality holds when sinx=1 and sin²y=1 ⇒ |siny|=1. Thus sinx = |siny| = 1."
  },
  {
    questionNo: 9, exam: "JEE Main 2019 (April)", subject: "Mathematics", chapter: "Trigonometric Ratio and Identities", type: "mcq",
    text: "The equation y = sinx sin(x+2) - sin²(x+1) represents a straight line lying in :",
    options: [
      { label: "A", text: "second and third quadrants only" },
      { label: "B", text: "third and fourth quadrants only" },
      { label: "C", text: "first, third and fourth quadrants" },
      { label: "D", text: "first, second and fourth quadrants" }
    ],
    correctAnswer: "B",
    explanation: "sinx sin(x+2) = (1/2)[cos(-2)-cos(2x+2)] = (1/2)[cos2-cos(2x+2)]. sin²(x+1) = (1-cos(2x+2))/2. y = (1/2)cos2 - (1/2)cos(2x+2) - 1/2 + (1/2)cos(2x+2) = (cos2-1)/2 = -sin²1. Since y is a negative constant, the horizontal line lies in the third and fourth quadrants."
  },
  {
    questionNo: 10, exam: "JEE Main 2020 (January)", subject: "Mathematics", chapter: "Trigonometric Ratio and Identities", type: "mcq",
    text: "Let α and β be two real roots of (k+1)tan²x - √2·λ tanx = (1-k), where k(≠-1) and λ are real numbers. If tan²(α+β) = 50, then a value of λ is",
    options: [{ label: "A", text: "10√2" }, { label: "B", text: "5√2" }, { label: "C", text: "10" }, { label: "D", text: "5" }],
    correctAnswer: "C",
    explanation: "(k+1)tan²x - √2·λ tanx + (k-1) = 0. tanα+tanβ = √2·λ/(k+1), tanα·tanβ = (k-1)/(k+1). tan(α+β) = (√2·λ/(k+1)) / (1-(k-1)/(k+1)) = (√2·λ/(k+1)) / (2/(k+1)) = λ/√2. Given tan²(α+β) = 50 ⇒ λ²/2 = 50 ⇒ λ = 10."
  },
  {
    questionNo: 11, exam: "JEE Main 2020 (January)", subject: "Mathematics", chapter: "Trigonometric Ratio and Identities", type: "mcq",
    text: "If α and β be the coefficient of x⁴ and x² respectively in the expansion of (x+√(x²-1))⁶ + (x-√(x²-1))⁶, then :",
    options: [{ label: "A", text: "α+β = -30" }, { label: "B", text: "α-β = 60" }, { label: "C", text: "α-β = -132" }, { label: "D", text: "α+β = 60" }],
    correctAnswer: "C",
    explanation: "Expanding: 2[⁶C₀x⁶+⁶C₂x⁴(x²-1)+⁶C₄x²(x²-1)²+⁶C₆(x²-1)³] = 2[x⁶+15x⁴(x²-1)+15x²(x⁴-2x²+1)+(x⁶-3x⁴+3x²-1)] = 2[32x⁶-48x⁴+18x²-1] = 64x⁶-96x⁴+36x²-2. α = -96, β = 36. α-β = -96-36 = -132."
  },
  {
    questionNo: 12, exam: "JEE Main 2020 (January)", subject: "Mathematics", chapter: "Trigonometric Ratio and Identities", type: "mcq",
    text: "If (√2 sinα)/√(1+cos2α) = 1/7 and √((1-cos2β)/2) = 1/√10, α, β ∈ (0, π/2), then tan(α+2β) is equal to",
    options: [{ label: "A", text: "1" }, { label: "B", text: "2" }, { label: "C", text: "1/2" }, { label: "D", text: "1/3" }],
    correctAnswer: "A",
    explanation: "√(1+cos2α) = √(2cos²α) = √2cosα. So (√2 sinα)/(√2 cosα) = tanα = 1/7. √((1-cos2β)/2) = sinβ = 1/√10, cosβ = 3/√10, tanβ = 1/3. tan2β = (2/3)/(1-1/9) = 3/4. tan(α+2β) = (1/7+3/4)/(1-(1/7)(3/4)) = (25/28)/(25/28) = 1."
  },
  {
    questionNo: 13, exam: "JEE Main 2020 (January)", subject: "Mathematics", chapter: "Trigonometric Ratio and Identities", type: "mcq",
    text: "The value of cos³(π/8)cos(3π/8) + sin³(π/8)sin(3π/8) is:",
    options: [{ label: "A", text: "1/(2√2)" }, { label: "B", text: "1/√2" }, { label: "C", text: "1/4" }, { label: "D", text: "1/2" }],
    correctAnswer: "A",
    explanation: "3π/8 = π/2-π/8, so cos(3π/8)=sin(π/8), sin(3π/8)=cos(π/8). E = cos³(π/8)sin(π/8)+sin³(π/8)cos(π/8) = sin(π/8)cos(π/8)[cos²(π/8)+sin²(π/8)] = (1/2)sin(π/4) = (1/2)(1/√2) = 1/(2√2)."
  },
  {
    questionNo: 14, exam: "JEE Main 2020 (January)", subject: "Mathematics", chapter: "Trigonometric Ratio and Identities", type: "mcq",
    text: "The number of distinct solutions of the equation, log_{1/2}|sinx| = 2 - log_{1/2}|cosx| in the interval [0, 2π], is",
    options: [{ label: "A", text: "2" }, { label: "B", text: "4" }, { label: "C", text: "8" }, { label: "D", text: "6" }],
    correctAnswer: "C",
    explanation: "log_{1/2}|sinx|+log_{1/2}|cosx| = 2 ⇒ log_{1/2}(|sinx||cosx|) = 2 ⇒ |sinx||cosx| = (1/2)² = 1/4 ⇒ |2sinxcosx| = 1/2 ⇒ |sin2x| = 1/2. In [0,2π], 2x ∈ [0,4π], |sin2x|=1/2 has 8 solutions."
  },
  {
    questionNo: 15, exam: "JEE Main 2020 (January)", subject: "Mathematics", chapter: "Trigonometric Ratio and Identities", type: "mcq",
    text: "If x = ∑_{n=0}^{∞} (-1)ⁿ tan²ⁿθ and y = ∑_{n=0}^{∞} cos²ⁿθ, for 0 < θ < π/4, then:",
    options: [
      { label: "A", text: "y(1-x) = 1" },
      { label: "B", text: "y(1+x) = 1" },
      { label: "C", text: "x(1+y) = 1" },
      { label: "D", text: "x(1-y) = 1" }
    ],
    correctAnswer: "A",
    explanation: "x = 1/(1+tan²θ) = cos²θ. y = 1/(1-cos²θ) = 1/sin²θ. From x=cos²θ, sin²θ=1-x. So y = 1/(1-x) ⇒ y(1-x) = 1."
  },
  {
    questionNo: 16, exam: "JEE Main 2020 (September)", subject: "Mathematics", chapter: "Trigonometric Ratio and Identities", type: "mcq",
    text: "Let a, b, c ∈ R be such that a² + b² + c² = 1. If a cosθ = b cos(θ+2π/3) = c cos(θ+4π/3), where θ = π/9, then the angle between the vectors aî+bĵ+ck̂ and bî+cĵ+ak̂ is:",
    options: [{ label: "A", text: "0" }, { label: "B", text: "π/9" }, { label: "C", text: "2π/3" }, { label: "D", text: "π/2" }],
    correctAnswer: "D",
    explanation: "Let k = a cosθ = b cos(θ+2π/3) = c cos(θ+4π/3). The sum cosθ+cos(θ+2π/3)+cos(θ+4π/3)=0 for any θ. Using relationships between a,b,c, it can be shown that ab+bc+ca=0. Dot product of vectors u=aî+bĵ+ck̂ and v=bî+cĵ+ak̂ is u·v=ab+bc+ca=0, so angle is π/2."
  },
  {
    questionNo: 17, exam: "JEE Main 2020 (September)", subject: "Mathematics", chapter: "Trigonometric Ratio and Identities", type: "mcq",
    text: "The minimum value of 2^{sinx} + 2^{cosx} is :",
    options: [
      { label: "A", text: "2^{1-1/√2}" },
      { label: "B", text: "2^{1-√2}" },
      { label: "C", text: "2^{1-1/2}" },
      { label: "D", text: "2^{-1+1/√2}" }
    ],
    correctAnswer: "A",
    explanation: "By AM-GM: (2^{sinx}+2^{cosx})/2 ≥ √(2^{sinx}·2^{cosx}) = 2^{(sinx+cosx)/2}. So 2^{sinx}+2^{cosx} ≥ 2·2^{(sinx+cosx)/2} = 2^{1+(sinx+cosx)/2}. Minimum of sinx+cosx is -√2. So min value = 2^{1-√2/2} = 2^{1-1/√2}."
  },
  {
    questionNo: 18, exam: "JEE Main 2020 (September)", subject: "Mathematics", chapter: "Trigonometric Ratio and Identities", type: "mcq",
    text: "If L = sin²(π/16) - sin²(π/8) and M = cos²(π/16) - sin²(π/8), then",
    options: [
      { label: "A", text: "L = -1/(2√2) + ½cos(π/8)" },
      { label: "B", text: "M = 1/(2√2) + ½cos(π/8)" },
      { label: "C", text: "M = 1/(4√2) + ¼cos(π/8)" },
      { label: "D", text: "L = 1/(4√2) - ¼cos(π/8)" }
    ],
    correctAnswer: "A",
    explanation: "Using sin²A-sin²B = sin(A+B)sin(A-B): L = sin(3π/16)sin(-π/16) = -sin(3π/16)sin(π/16) = -½[cos(π/8)-cos(π/4)] = -½cos(π/8)+1/(2√2)."
  },
  {
    questionNo: 19, exam: "JEE Main 2021 (February)", subject: "Mathematics", chapter: "Trigonometric Ratio and Identities", type: "mcq",
    text: "If e^{(cos²x+cos⁴x+cos⁶x+...∞)log_e 2} satisfies the equation t² - 9t + 8 = 0, then the value of 2sinx/(sinx+√3cosx) (0 < x < π/2) is",
    options: [{ label: "A", text: "3/2" }, { label: "B", text: "2√3" }, { label: "C", text: "1/2" }, { label: "D", text: "√3" }],
    correctAnswer: "C",
    explanation: "S = cos²x/(1-cos²x) = cot²x. Expression = 2^{cot²x}. t²-9t+8=0 ⇒ t=1 or 8. If 2^{cot²x}=8=2³ ⇒ cot²x=3 ⇒ cotx=√3 (x in Q1) ⇒ x=π/6. 2sin(π/6)/(sin(π/6)+√3cos(π/6)) = 1/(1/2+3/2) = 1/2."
  },
  {
    questionNo: 20, exam: "JEE Main 2021 (February)", subject: "Mathematics", chapter: "Trigonometric Ratio and Identities", type: "mcq",
    text: "The number of integral values of 'k' for which the equation 3sinx + 4cosx = k+1 has a solution, k ∈ R is",
    options: [{ label: "A", text: "11" }, { label: "B", text: "9" }, { label: "C", text: "10" }, { label: "D", text: "12" }],
    correctAnswer: "A",
    explanation: "Range of 3sinx+4cosx is [-5,5]. For solution: -5 ≤ k+1 ≤ 5 ⇒ -6 ≤ k ≤ 4. Integer values: -6,-5,-4,-3,-2,-1,0,1,2,3,4 = 11 values."
  },
  {
    questionNo: 21, exam: "JEE Main 2022", subject: "Mathematics", chapter: "Trigonometric Ratio and Identities", type: "integer",
    text: "The number of solutions of the equation |cotx| = cotx + 1/sinx in the interval [0, 2π] is ______.",
    correctAnswer: "1",
    explanation: "Case 1: cotx≥0 (1st/3rd quadrant): cotx = cotx+1/sinx ⇒ 1/sinx=0, no solution. Case 2: cotx<0 (2nd/4th quadrant): -cotx = cotx+1/sinx ⇒ -2cosx/sinx = 1/sinx ⇒ cosx = -1/2. In 2nd quadrant: x=2π/3. Thus only 1 solution."
  },
  {
    questionNo: 22, exam: "JEE Main 2022", subject: "Mathematics", chapter: "Trigonometric Ratio and Identities", type: "integer",
    text: "If sum of all solutions of the equation sinx + 2cosx = 1 in [0, 2π] is kπ, then the value of k is ______.",
    correctAnswer: "3",
    explanation: "sinx = 1-2cosx. Squaring: 1-cos²x = 1-4cosx+4cos²x ⇒ 5cos²x-4cosx=0 ⇒ cosx(5cosx-4)=0. cosx=0 ⇒ x=π/2,3π/2. Checking original: x=π/2 (valid), x=3π/2 (invalid). cosx=4/5 ⇒ sinx=-3/5 (4th quadrant, call it α). Sum = π/2+α = 3π ⇒ k=3."
  },
  {
    questionNo: 23, exam: "JEE Main 2023", subject: "Mathematics", chapter: "Trigonometric Ratio and Identities", type: "integer",
    text: "If the value of the expression tan9° - tan27° - tan63° + tan81° is equal to an integer N, then N is ______.",
    correctAnswer: "4",
    explanation: "E = (tan9°+tan81°)-(tan27°+tan63°) = (tan9°+cot9°)-(tan27°+cot27°) = 2/sin18° - 2/sin54°. sin18°=(√5-1)/4, sin54°=(√5+1)/4. E = 8/(√5-1)-8/(√5+1) = 8[(√5+1-√5+1)/4] = 8(2/4) = 4."
  },
  {
    questionNo: 24, exam: "JEE Main 2023", subject: "Mathematics", chapter: "Trigonometric Ratio and Identities", type: "integer",
    text: "Find the value of 16 sin20° sin40° sin60° sin80°.",
    correctAnswer: "3",
    explanation: "sin60°=√3/2. Expression = 16×(√3/2)×[sin20°sin40°sin80°] = 8√3×[sin20°sin40°sin80°]. Using sinθ sin(60°-θ) sin(60°+θ) = (1/4)sin3θ with θ=20°: sin20°sin40°sin80° = (1/4)sin60° = √3/8. Value = 8√3×(√3/8) = 3."
  },
  {
    questionNo: 25, exam: "JEE Main 2024", subject: "Mathematics", chapter: "Trigonometric Ratio and Identities", type: "integer",
    text: "If maximum value of 5 sinx + 12 cosx is M, then value of M - 5 is ______.",
    correctAnswer: "8",
    explanation: "Max of a sinx + b cosx = √(a²+b²). M = √(5²+12²) = √169 = 13. M-5 = 13-5 = 8."
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Ensure ExamCategory & Exam exist
    let examCategory = await ExamCategory.findOne({ slug: 'engineering' });
    if (!examCategory) {
      examCategory = await ExamCategory.create({
        name: 'Engineering', slug: 'engineering',
        description: 'Engineering Entrance Exams',
        icon: 'GraduationCap', color: 'from-blue-500 to-blue-600',
        order: 0, isActive: true,
      });
      console.log('Created ExamCategory: Engineering');
    }

    let exam = await Exam.findOne({ slug: 'jee-main-mock' });
    if (!exam) {
      exam = await Exam.create({
        name: 'JEE Main Mock Test', slug: 'jee-main-mock',
        categoryId: examCategory._id,
        description: 'Full JEE Main Mock Test with Physics, Chemistry, Mathematics',
        icon: 'FileText', color: 'from-blue-500 to-blue-600',
        totalTests: 1, totalSubjects: 3, difficulty: 'medium',
        successStats: [{ label: 'Total Tests', value: '50+' }, { label: 'Students', value: '10,000+' }],
        isActive: true, order: 0,
      });
      console.log('Created Exam: JEE Main Mock Test');
    }

    // 2. Remove old test & questions if re-running
    const existingTest = await Test.findOne({ name: 'JEE Main - Full Mock Test (Gravitation, Chemistry, Trigonometry)' });
    if (existingTest) {
      await Question.deleteMany({ testId: existingTest._id });
      await Test.findByIdAndDelete(existingTest._id);
      console.log('Removed existing test and questions');
    }

    // 3. Count questions per subject
    const physicsQs = questions.filter(q => q.subject === 'Physics').length;
    const chemistryQs = questions.filter(q => q.subject === 'Chemistry').length;
    const mathematicsQs = questions.filter(q => q.subject === 'Mathematics').length;
    const totalQs = questions.length;

    // 4. Create Test
    const test = await Test.create({
      name: 'JEE Main - Full Mock Test (Gravitation, Chemistry, Trigonometry)',
      description: 'A comprehensive JEE Main mock test covering Gravitation (Physics), Basic Concepts of Chemistry & Environmental Chemistry, and Trigonometric Ratio & Identities (Mathematics).',
      category: 'JEE Main',
      subject: 'All',
      testType: 'full',
      difficulty: 'medium',
      duration: 180,
      totalQuestions: totalQs,
      totalMarks: totalQs * 4,
      passingMarks: 0,
      negativeMarks: 1,
      isActive: true,
      isPremium: false,
      price: 0,
      originalPrice: 0,
      tags: ['JEE Main', 'Mock Test', 'Physics', 'Chemistry', 'Mathematics'],
      questionCount: totalQs,
      sections: [
        { name: 'Physics', questionCount: physicsQs, subject: 'Physics' },
        { name: 'Chemistry', questionCount: chemistryQs, subject: 'Chemistry' },
        { name: 'Mathematics', questionCount: mathematicsQs, subject: 'Mathematics' },
      ],
    });
    console.log(`Created Test: ${test.name} (${totalQs} questions)`);

    // 5. Create Questions
    const questionDocs = questions.map((q, i) => ({
      testId: test._id,
      text: q.text,
      options: q.type === 'integer' ? [] : (q.options || []),
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || '',
      type: q.type === 'integer' ? 'integer' : 'mcq',
      category: 'JEE Main',
      subject: q.subject,
      topic: q.chapter || '',
      section: q.subject,
      sectionName: q.subject,
      difficulty: 'medium',
      marks: 4,
      negativeMarks: 1,
      isActive: true,
    }));

    await Question.insertMany(questionDocs);
    console.log(`Created ${questionDocs.length} questions`);

    // 6. Update Test questionCount
    await Test.findByIdAndUpdate(test._id, { questionCount: totalQs });
    for (const section of test.sections || []) {
      const count = questions.filter(q => q.subject === section.subject).length;
      await Test.updateOne(
        { _id: test._id, 'sections.name': section.name },
        { $set: { 'sections.$.questionCount': count } }
      );
    }

    console.log('\n✅ Seeding complete!');
    console.log(`   Physics: ${physicsQs} questions`);
    console.log(`   Chemistry: ${chemistryQs} questions`);
    console.log(`   Mathematics: ${mathematicsQs} questions`);
    console.log(`   Total: ${totalQs} questions`);
    console.log(`   Test ID: ${test._id}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
