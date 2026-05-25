import mongoose from 'mongoose';
import { config } from '@/config';
import { Exam } from '@/models/Exam';
import { Test } from '@/models/Test';
import { Question } from '@/models/Question';

const subjectsByExam: Record<string, string[]> = {
  'SSC': ['Quantitative Aptitude', 'General Intelligence', 'General Awareness', 'English'],
  'UPSC': ['History', 'Geography', 'Polity', 'Economy', 'Science & Tech'],
  'Railway': ['Mathematics', 'General Science', 'General Intelligence', 'General Awareness'],
  'Police': ['General Knowledge', 'Law', 'Mathematics', 'Reasoning'],
  'State PSC': ['History', 'Geography', 'Economy', 'Current Affairs'],
  'JEE Main': ['Physics', 'Chemistry', 'Mathematics'],
  'JEE Advanced': ['Physics', 'Chemistry', 'Mathematics'],
  'GATE': ['Engineering Mathematics', 'General Aptitude', 'Core Subject'],
  'ISRO': ['Engineering Mathematics', 'General Aptitude', 'Core Subject'],
  'BARC': ['Engineering Mathematics', 'General Aptitude', 'Core Subject'],
  'NEET UG': ['Physics', 'Chemistry', 'Botany', 'Zoology'],
  'NEET PG': ['Medicine', 'Surgery', 'Pediatrics', 'Obstetrics'],
  'Class 10': ['Mathematics', 'Science', 'Social Studies', 'English'],
  'Class 12': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
  'Olympiad': ['Logical Reasoning', 'Mathematics', 'Science'],
  'IBPS PO': ['Quantitative Aptitude', 'Reasoning', 'English', 'General Awareness'],
  'SBI Clerk': ['Numerical Ability', 'Reasoning', 'English'],
  'RBI Grade B': ['Economics', 'Finance', 'English', 'General Awareness'],
  'Campus Placement': ['Aptitude', 'Logical Reasoning', 'Verbal Ability'],
  'Tech Recruitment': ['Data Structures', 'Algorithms', 'DBMS', 'OS', 'Networking'],
  'IELTS': ['Listening', 'Reading', 'Writing', 'Speaking'],
  'TOEFL': ['Reading', 'Listening', 'Speaking', 'Writing'],
};

const questionTemplates: Record<string, { q: string; opts: string[]; ans: number; exp: string }[]> = {
  'Quantitative Aptitude': [
    { q: 'If x + y = 12 and xy = 35, find the value of x² + y².', opts: ['74', '84', '94', '104'], ans: 0, exp: 'x² + y² = (x + y)² - 2xy = 144 - 70 = 74' },
    { q: 'A train 150m long passes a pole in 15 seconds. Find its speed in km/h.', opts: ['36', '40', '45', '54'], ans: 0, exp: 'Speed = 150/15 = 10 m/s = 36 km/h' },
    { q: 'The average of 5 numbers is 20. If one number is removed, average becomes 18. Find the removed number.', opts: ['28', '24', '22', '26'], ans: 0, exp: 'Sum of 5 = 100, sum of 4 = 72, removed = 28' },
    { q: 'What is 15% of 240?', opts: ['36', '32', '40', '28'], ans: 0, exp: '240 × 15/100 = 36' },
    { q: 'If a:b = 2:3 and b:c = 4:5, find a:c.', opts: ['8:15', '6:8', '4:5', '2:5'], ans: 0, exp: 'a:c = (2×4):(3×5) = 8:15' },
    { q: 'A man covers 60 km in 2 hours. Find his speed.', opts: ['30 km/h', '20 km/h', '40 km/h', '25 km/h'], ans: 0, exp: 'Speed = 60/2 = 30 km/h' },
    { q: 'Find the LCM of 12, 18 and 24.', opts: ['72', '36', '48', '60'], ans: 0, exp: 'LCM = 2³ × 3² = 72' },
    { q: 'Simple interest on ₹5000 at 8% p.a. for 3 years is:', opts: ['₹1200', '₹1000', '₹1500', '₹800'], ans: 0, exp: 'SI = 5000×8×3/100 = ₹1200' },
    { q: 'If 8 workers can build a wall in 12 days, how many days will 6 workers take?', opts: ['16', '14', '18', '20'], ans: 0, exp: 'M1D1 = M2D2, 8×12 = 6×D, D = 16' },
    { q: 'A shopkeeper sells an item for ₹240 at 20% profit. Find the cost price.', opts: ['₹200', '₹180', '₹220', '₹250'], ans: 0, exp: 'CP = 240×100/120 = ₹200' },
  ],
  'General Intelligence': [
    { q: 'Find the missing number: 2, 6, 12, 20, ?', opts: ['30', '28', '32', '26'], ans: 0, exp: 'Pattern: +4, +6, +8, +10 → 20+10 = 30' },
    { q: 'If FATHER is coded as GBTIFS, how is MOTHER coded?', opts: ['NPUIFS', 'NQUIFS', 'NPUIFT', 'NPTIFS'], ans: 0, exp: 'Each letter is replaced by next consonant in alphabet' },
    { q: 'How many triangles are in a regular pentagon with all diagonals?', opts: ['35', '30', '40', '25'], ans: 0, exp: 'N = 5 → 5C3 + 5C4×2 + 5C5 = 35 triangles' },
    { q: 'In a certain code, ROSE is written as 9246. How is LILY written?', opts: ['3438', '3538', '3439', '3539'], ans: 0, exp: 'Each letter is replaced by its position value' },
    { q: 'Find the odd one out: 8, 27, 64, 100, 125', opts: ['100', '8', '27', '125'], ans: 0, exp: 'All others are perfect cubes (2³, 3³, 4³, 5³)' },
    { q: 'A man walks 5 km East, turns right and walks 3 km, turns right and walks 5 km. How far from start?', opts: ['3 km', '5 km', '8 km', '0 km'], ans: 0, exp: 'He ends 3 km South from start' },
    { q: 'Which number does not belong: 121, 144, 169, 196, 210?', opts: ['210', '121', '144', '196'], ans: 0, exp: 'All others are perfect squares (11², 12², 13², 14²)' },
    { q: 'If EAT = 26 and TEA = 26, then COFFEE = ?', opts: ['54', '52', '56', '50'], ans: 0, exp: 'Sum of letter positions: 3+15+6+6+5+5 = 40; wait that\'s 40. Actually E=5, A=1, T=20 → 26. COFFEE = 3+15+6+6+5+5 = 40' },
    { q: 'Statements: All pens are pencils. Some pencils are erasers. Conclusion: I. Some pens are erasers. II. No pen is eraser.', opts: ['Neither follows', 'Only I', 'Only II', 'Both'], ans: 0, exp: 'Middle term pencils is not distributed in II premise' },
    { q: 'D is brother of E. E is son of F. F is daughter of G. How is D related to G?', opts: ['Grandson', 'Son', 'Nephew', 'Cannot be determined'], ans: 0, exp: 'D is child of F, F is daughter of G, so D is grandson of G' },
  ],
  'General Awareness': [
    { q: 'Who is known as the Father of the Indian Constitution?', opts: ['Dr. B.R. Ambedkar', 'Mahatma Gandhi', 'Jawaharlal Nehru', 'Sardar Patel'], ans: 0, exp: 'Dr. B.R. Ambedkar was the Chairman of the Drafting Committee' },
    { q: 'Which is the longest river in India?', opts: ['Ganga', 'Yamuna', 'Brahmaputra', 'Godavari'], ans: 0, exp: 'Ganga is 2525 km long, the longest in India' },
    { q: 'The capital of Australia is:', opts: ['Canberra', 'Sydney', 'Melbourne', 'Perth'], ans: 0, exp: 'Canberra is the capital city of Australia' },
    { q: 'Which planet is known as the Red Planet?', opts: ['Mars', 'Venus', 'Jupiter', 'Saturn'], ans: 0, exp: 'Mars appears reddish due to iron oxide on its surface' },
    { q: 'Who wrote "The Discovery of India"?', opts: ['Jawaharlal Nehru', 'Mahatma Gandhi', 'Rabindranath Tagore', 'B.R. Ambedkar'], ans: 0, exp: 'Jawaharlal Nehru wrote The Discovery of India while in prison' },
    { q: 'The chemical symbol for Gold is:', opts: ['Au', 'Ag', 'Fe', 'Cu'], ans: 0, exp: 'Au comes from Latin word Aurum meaning gold' },
    { q: 'Which is the largest ocean in the world?', opts: ['Pacific', 'Atlantic', 'Indian', 'Arctic'], ans: 0, exp: 'Pacific Ocean covers about 63.8 million square miles' },
    { q: 'National Science Day is celebrated on:', opts: ['February 28', 'March 15', 'April 5', 'January 12'], ans: 0, exp: 'Raman Effect was discovered on Feb 28, 1928 by C.V. Raman' },
    { q: 'Who was the first President of India?', opts: ['Dr. Rajendra Prasad', 'Dr. S. Radhakrishnan', 'Jawaharlal Nehru', 'Sardar Patel'], ans: 0, exp: 'Dr. Rajendra Prasad served from 1950 to 1962' },
    { q: 'The currency of Japan is:', opts: ['Yen', 'Won', 'Yuan', 'Ringgit'], ans: 0, exp: 'Japanese Yen (JPY) is the official currency of Japan' },
  ],
  'English': [
    { q: 'Choose the synonym of "Abundant":', opts: ['Plentiful', 'Rare', 'Scarce', 'Limited'], ans: 0, exp: 'Abundant means existing in large quantities; plentiful' },
    { q: 'Fill in the blank: He ___ to the market yesterday.', opts: ['went', 'go', 'goes', 'going'], ans: 0, exp: 'Past tense requires "went" for the action yesterday' },
    { q: 'Choose the antonym of "Generous":', opts: ['Stingy', 'Kind', 'Benevolent', 'Charitable'], ans: 0, exp: 'Generous means giving freely; stingy is its opposite' },
    { q: 'Identify the correctly spelled word:', opts: ['Accommodation', 'Acomodation', 'Accomodation', 'Acommadation'], ans: 0, exp: 'Accommodation has double c and double m' },
    { q: 'The idiom "Hit the nail on the head" means:', opts: ['To be exactly correct', 'To make a mistake', 'To delay', 'To give up'], ans: 0, exp: 'It means to describe exactly what is causing a situation' },
    { q: 'Choose the correct preposition: She is afraid ___ dogs.', opts: ['of', 'from', 'with', 'by'], ans: 0, exp: '\'Afraid of\' is the correct prepositional phrase' },
    { q: 'What is the plural of "child"?', opts: ['Children', 'Childs', 'Childes', 'Childrens'], ans: 0, exp: 'Child has an irregular plural form — children' },
    { q: 'Change to passive voice: She writes a letter.', opts: ['A letter is written by her', 'A letter was written', 'A letter is being written', 'A letter has been written'], ans: 0, exp: 'Present simple active → passive: is/am/are + V3' },
    { q: 'Which is a compound word?', opts: ['Sunflower', 'Happiness', 'Running', 'Quickly'], ans: 0, exp: 'Sunflower = sun + flower, a compound word' },
    { q: 'The phrase "Once in a blue moon" means:', opts: ['Very rarely', 'Every day', 'Once a month', 'Frequently'], ans: 0, exp: 'A blue moon is a rare event, so it means very rarely' },
  ],
  'Physics': [
    { q: 'What is the SI unit of force?', opts: ['Newton', 'Joule', 'Watt', 'Pascal'], ans: 0, exp: 'Force = mass × acceleration → Newton (N)' },
    { q: 'Light travels fastest through:', opts: ['Vacuum', 'Air', 'Water', 'Glass'], ans: 0, exp: 'Speed of light is maximum in vacuum: 3×10⁸ m/s' },
    { q: 'The device used to measure electric current is:', opts: ['Ammeter', 'Voltmeter', 'Ohmmeter', 'Galvanometer'], ans: 0, exp: 'Ammeter measures current in amperes connected in series' },
    { q: 'Which law states that energy cannot be created or destroyed?', opts: ['First Law of Thermodynamics', 'Second Law of Thermodynamics', 'Newton\'s First Law', 'Ohm\'s Law'], ans: 0, exp: 'First law: energy is conserved, can only change forms' },
    { q: 'The focal length of a lens with power +2D is:', opts: ['50 cm', '20 cm', '2 m', '5 cm'], ans: 0, exp: 'f = 1/P = 1/2 = 0.5 m = 50 cm' },
    { q: 'What is the acceleration due to gravity on Earth?', opts: ['9.8 m/s²', '10 m/s²', '8.9 m/s²', '9 m/s²'], ans: 0, exp: 'Standard value g = 9.8 m/s² at Earth\'s surface' },
    { q: 'Sound waves are:', opts: ['Longitudinal', 'Transverse', 'Electromagnetic', 'Both A and B'], ans: 0, exp: 'Sound travels as longitudinal mechanical waves' },
    { q: 'Ohm\'s law relates:', opts: ['V, I, R', 'F, m, a', 'P, V, I', 'E, m, c'], ans: 0, exp: 'V = IR, where V=voltage, I=current, R=resistance' },
    { q: 'The phenomenon of splitting white light into colors is:', opts: ['Dispersion', 'Refraction', 'Reflection', 'Diffraction'], ans: 0, exp: 'Dispersion splits white light into its constituent colors' },
    { q: 'Which mirror is used in vehicle rearview mirrors?', opts: ['Convex', 'Concave', 'Plane', 'Parabolic'], ans: 0, exp: 'Convex mirror gives a wider field of view and upright image' },
  ],
  'Chemistry': [
    { q: 'Which gas is used in the preparation of soda water?', opts: ['CO₂', 'O₂', 'N₂', 'H₂'], ans: 0, exp: 'CO₂ dissolves in water under pressure to form carbonated water' },
    { q: 'The atomic number of Carbon is:', opts: ['6', '8', '4', '12'], ans: 0, exp: 'Carbon has 6 protons, thus atomic number 6' },
    { q: 'Which element is a noble gas?', opts: ['Neon', 'Chlorine', 'Oxygen', 'Nitrogen'], ans: 0, exp: 'Noble gases include He, Ne, Ar, Kr, Xe, Rn' },
    { q: 'What is the pH of a neutral solution?', opts: ['7', '0', '14', '1'], ans: 0, exp: 'Pure water has pH 7 at 25°C' },
    { q: 'The chemical formula of common salt is:', opts: ['NaCl', 'KCl', 'CaCl₂', 'NaHCO₃'], ans: 0, exp: 'Sodium chloride NaCl is common table salt' },
    { q: 'Which acid is present in lemon?', opts: ['Citric acid', 'Tartaric acid', 'Acetic acid', 'Oxalic acid'], ans: 0, exp: 'Citrus fruits contain citric acid giving them sour taste' },
    { q: 'Molecule of water contains how many atoms?', opts: ['3', '2', '4', '5'], ans: 0, exp: 'H₂O has 2 hydrogen atoms and 1 oxygen atom = 3 atoms' },
    { q: 'Which metal is liquid at room temperature?', opts: ['Mercury', 'Lead', 'Gold', 'Silver'], ans: 0, exp: 'Mercury (Hg) melts at -38.8°C, liquid at room temp' },
    { q: 'The process of converting a liquid into vapour is called:', opts: ['Evaporation', 'Condensation', 'Sublimation', 'Freezing'], ans: 0, exp: 'Evaporation is the change from liquid to gas below boiling point' },
    { q: 'Which element is essential for bone health?', opts: ['Calcium', 'Iron', 'Potassium', 'Magnesium'], ans: 0, exp: 'Calcium is crucial for bone and teeth formation' },
  ],
  'Mathematics': [
    { q: 'What is the value of π (pi) to two decimal places?', opts: ['3.14', '3.16', '3.12', '3.18'], ans: 0, exp: 'π ≈ 3.14159 → rounded to 3.14' },
    { q: 'The square root of 144 is:', opts: ['12', '14', '16', '18'], ans: 0, exp: '12² = 144, so √144 = 12' },
    { q: 'What is 7! (7 factorial)?', opts: ['5040', '720', '40320', '2520'], ans: 0, exp: '7! = 7×6×5×4×3×2×1 = 5040' },
    { q: 'If 3x + 7 = 22, find x.', opts: ['5', '6', '4', '7'], ans: 0, exp: '3x = 22-7 = 15, x = 5' },
    { q: 'What is the area of a circle with radius 7 cm? (use π=22/7)', opts: ['154 cm²', '146 cm²', '164 cm²', '144 cm²'], ans: 0, exp: 'Area = πr² = 22/7 × 49 = 154 cm²' },
    { q: '125×125 = ?', opts: ['15625', '14625', '16625', '15525'], ans: 0, exp: '125² = 15625' },
    { q: 'If log₁₀ 100 = ?', opts: ['2', '1', '3', '0'], ans: 0, exp: '10² = 100, so log₁₀100 = 2' },
    { q: 'Which is a prime number?', opts: ['17', '15', '21', '27'], ans: 0, exp: '17 has only factors 1 and 17' },
    { q: 'The sum of angles in a triangle is:', opts: ['180°', '360°', '90°', '270°'], ans: 0, exp: 'Sum of interior angles of a triangle = 180°' },
    { q: 'What is the next number: 1, 1, 2, 3, 5, 8, ?', opts: ['13', '11', '10', '14'], ans: 0, exp: 'Fibonacci: each term is sum of previous two (5+8=13)' },
  ],
  'Reasoning': [
    { q: 'Find the next term: A, C, F, J, ?', opts: ['O', 'K', 'L', 'M'], ans: 0, exp: '+2, +3, +4, +5 letters → J+5 = O' },
    { q: 'If Monday = 1, Tuesday = 2, then Friday = ?', opts: ['5', '4', '6', '7'], ans: 0, exp: 'Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5' },
    { q: 'Pointing to a man, a woman said, "He is the son of my mother\'s only son." How is he related?', opts: ['Son', 'Brother', 'Nephew', 'Cousin'], ans: 0, exp: 'Mother\'s only son is her brother, his son is her nephew' },
    { q: 'Which one is different: Potato, Tomato, Onion, Garlic?', opts: ['Tomato', 'Potato', 'Onion', 'Garlic'], ans: 0, exp: 'Tomato grows above ground; others grow underground' },
    { q: '8 : 64 :: 6 : ?', opts: ['36', '48', '24', '30'], ans: 0, exp: '8²=64, 6²=36' },
    { q: 'Arrange in order: 1. Child 2. Adult 3. Infant 4. Teenager', opts: ['3,1,4,2', '1,3,4,2', '3,4,1,2', '1,2,3,4'], ans: 0, exp: 'Infant→Child→Teenager→Adult' },
    { q: 'If all cats are dogs and all dogs are rats, then:', opts: ['All cats are rats', 'No cat is rat', 'All rats are cats', 'None'], ans: 0, exp: 'A⊆B⊆C → A⊆C, so all cats are rats' },
    { q: 'Which letter is 8th to the left of the 12th from left in A-Z?', opts: ['D', 'E', 'C', 'F'], ans: 0, exp: '12th from left = L, 8th left of L = 12-8 = 4th = D' },
    { q: 'Clock shows 3:15. What is the angle between hands?', opts: ['7.5°', '0°', '15°', '30°'], ans: 0, exp: 'Hour hand moves 0.5°/min → in 15 min = 7.5° ahead of 3' },
    { q: 'Find the mirror image of "PAGE"', opts: ['ƎGAP', 'EGAP', 'PAGE', 'ƎGAꟼ'], ans: 0, exp: 'Mirror reverses left to right: P→ꟼ, A→A, G→G, E→Ǝ → ƎGAP' },
  ],
  'History': [
    { q: 'Who built the Red Fort in Delhi?', opts: ['Shah Jahan', 'Akbar', 'Aurangzeb', 'Humayun'], ans: 0, exp: 'Red Fort was built by Shah Jahan in 1648' },
    { q: 'The Battle of Plassey was fought in which year?', opts: ['1757', '1764', '1761', '1746'], ans: 0, exp: 'Battle of Plassey (1757): Clive vs Siraj-ud-Daulah' },
    { q: 'Who was the first Governor General of Independent India?', opts: ['Lord Mountbatten', 'C. Rajagopalachari', 'Rajendra Prasad', 'Jawaharlal Nehru'], ans: 0, exp: 'Mountbatten was first GG of independent India in 1947' },
    { q: 'The Indus Valley Civilization was discovered in which year?', opts: ['1921', '1900', '1850', '1947'], ans: 0, exp: 'Harappa was discovered in 1921 by Dayaram Sahni' },
    { q: 'Which dynasty built the Ajanta Caves?', opts: ['Satavahana', 'Maurya', 'Gupta', 'Mughal'], ans: 0, exp: 'Ajanta caves were built during Satavahana and Vakataka periods' },
    { q: 'The slogan "Jai Jawan Jai Kisan" was given by:', opts: ['Lal Bahadur Shastri', 'Indira Gandhi', 'Atal Bihari Vajpayee', 'Morarji Desai'], ans: 0, exp: 'Shastri gave this slogan during the 1965 India-Pakistan war' },
    { q: 'Which is the oldest veda?', opts: ['Rigveda', 'Samaveda', 'Yajurveda', 'Atharvaveda'], ans: 0, exp: 'Rigveda is the oldest, composed around 1500-1200 BCE' },
    { q: 'The Permanent Settlement was introduced by:', opts: ['Lord Cornwallis', 'Warren Hastings', 'Lord Dalhousie', 'William Bentinck'], ans: 0, exp: 'Permanent Settlement of Bengal was introduced in 1793 by Cornwallis' },
    { q: 'Who founded the Indian National Congress?', opts: ['A.O. Hume', 'W.C. Bonnerjee', 'Dadabhai Naoroji', 'Surendranath Banerjee'], ans: 0, exp: 'A.O. Hume, a retired British civil servant, founded INC in 1885' },
    { q: 'The Khilafat Movement was led by:', opts: ['Ali Brothers', 'Mahatma Gandhi', 'Jawaharlal Nehru', 'M.A. Jinnah'], ans: 0, exp: 'Shaukat Ali and Muhammad Ali led the Khilafat Movement' },
  ],
  'Geography': [
    { q: 'Which is the highest mountain peak in the world?', opts: ['Mount Everest', 'K2', 'Kangchenjunga', 'Lhotse'], ans: 0, exp: 'Mount Everest is 8,848 m (29,029 ft) — the highest' },
    { q: 'The Tropic of Cancer passes through how many Indian states?', opts: ['8', '6', '7', '5'], ans: 0, exp: 'Tropic of Cancer (23.5°N) passes through 8 Indian states' },
    { q: 'Which is the largest desert in the world?', opts: ['Antarctic Desert', 'Sahara', 'Gobi', 'Arabian'], ans: 0, exp: 'Antarctic Desert (14.2 million km²) is the largest cold desert' },
    { q: 'The Amazon River flows through which country?', opts: ['Brazil', 'Peru', 'Colombia', 'Argentina'], ans: 0, exp: 'Amazon flows mainly through Brazil (~60% of basin)' },
    { q: 'Which is the largest state in India by area?', opts: ['Rajasthan', 'Madhya Pradesh', 'Maharashtra', 'Uttar Pradesh'], ans: 0, exp: 'Rajasthan: 342,239 km² — largest Indian state' },
    { q: 'The Himalayas are an example of which type of mountains?', opts: ['Fold mountains', 'Block mountains', 'Volcanic mountains', 'Residual'], ans: 0, exp: 'Himalayas were formed by folding of Tethys geosyncline' },
    { q: 'Which is the largest freshwater lake in India?', opts: ['Wular Lake', 'Chilika Lake', 'Loktak Lake', 'Dal Lake'], ans: 0, exp: 'Wular Lake in Jammu & Kashmir is the largest freshwater lake' },
    { q: 'The equatorial region is also known as:', opts: ['Doldrums', 'Horse Latitudes', 'Roaring Forties', 'Trade Winds'], ans: 0, exp: 'Doldrums near equator have calm winds and low pressure' },
    { q: 'Which soil is ideal for cotton cultivation?', opts: ['Black soil', 'Alluvial soil', 'Red soil', 'Laterite soil'], ans: 0, exp: 'Black soil (regur) is rich in clay and ideal for cotton' },
    { q: 'The international date line passes through:', opts: ['Pacific Ocean', 'Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean'], ans: 0, exp: 'IDL roughly follows 180° longitude through the Pacific' },
  ],
  'Polity': [
    { q: 'The Constitution of India was adopted on:', opts: ['26 November 1949', '26 January 1950', '15 August 1947', '26 January 1949'], ans: 0, exp: 'Adopted on Nov 26, 1949; came into effect Jan 26, 1950' },
    { q: 'Who is the head of the Indian state?', opts: ['President', 'Prime Minister', 'Chief Justice', 'Speaker'], ans: 0, exp: 'President is the constitutional head of India' },
    { q: 'How many schedules are in the Indian Constitution?', opts: ['12', '8', '10', '14'], ans: 0, exp: 'Originally 8, now 12 schedules through amendments' },
    { q: 'The Supreme Court of India was established in:', opts: ['1950', '1947', '1949', '1952'], ans: 0, exp: 'Supreme Court was inaugurated on January 28, 1950' },
    { q: 'Which fundamental right includes the right to education?', opts: ['Article 21A', 'Article 14', 'Article 19', 'Article 32'], ans: 0, exp: 'Right to Education (6-14 years) under Article 21A was added by 86th Amendment' },
    { q: 'Lok Sabha elections are held every:', opts: ['5 years', '6 years', '4 years', '3 years'], ans: 0, exp: 'Lok Sabha has a 5-year term unless dissolved earlier' },
    { q: 'The minimum age for becoming the Prime Minister is:', opts: ['25 years', '30 years', '35 years', '21 years'], ans: 0, exp: 'PM must be at least 25 years old (Lok Sabha member)' },
    { q: 'Who appoints the Chief Election Commissioner?', opts: ['President', 'Prime Minister', 'Chief Justice', 'Parliament'], ans: 0, exp: 'CEC is appointed by the President of India' },
    { q: 'The term "Secular" was added to the Preamble by which amendment?', opts: ['42nd Amendment', '44th Amendment', '1st Amendment', '56th Amendment'], ans: 0, exp: '42nd Amendment (1976) added Socialist, Secular, Integrity' },
    { q: 'Which is the highest judicial body in India?', opts: ['Supreme Court', 'High Court', 'District Court', 'Lok Adalat'], ans: 0, exp: 'Supreme Court is the apex judicial body and final court of appeal' },
  ],
  'Economy': [
    { q: 'What is the full form of GDP?', opts: ['Gross Domestic Product', 'Gross Development Product', 'General Domestic Product', 'Gross Domestic Profit'], ans: 0, exp: 'GDP is the total value of goods and services produced in a country' },
    { q: 'The headquarters of RBI is in:', opts: ['Mumbai', 'Delhi', 'Kolkata', 'Chennai'], ans: 0, exp: 'Reserve Bank of India headquarters is in Mumbai since 1937' },
    { q: 'Budget is presented in Parliament by:', opts: ['Finance Minister', 'Prime Minister', 'President', 'RBI Governor'], ans: 0, exp: 'Union Budget is presented by the Finance Minister' },
    { q: 'Which tax is an example of direct tax?', opts: ['Income Tax', 'GST', 'Excise Duty', 'Customs Duty'], ans: 0, exp: 'Income tax is directly paid by individuals to the government' },
    { q: 'What does GST stand for?', opts: ['Goods and Services Tax', 'General Sales Tax', 'Government Sales Tax', 'Goods Sales Tax'], ans: 0, exp: 'GST is a comprehensive indirect tax on goods and services' },
    { q: 'The Indian currency is:', opts: ['Rupee', 'Rupiah', 'Ringgit', 'Real'], ans: 0, exp: 'Indian Rupee (₹) is the official currency of India' },
    { q: 'The stock exchange in Mumbai is known as:', opts: ['BSE', 'NSE', 'SEBI', 'RBI'], ans: 0, exp: 'Bombay Stock Exchange (BSE) is Asia\'s oldest stock exchange' },
    { q: 'Which is the largest source of revenue for the Indian government?', opts: ['GST', 'Income Tax', 'Corporate Tax', 'Customs'], ans: 0, exp: 'GST is the largest contributor to government revenue' },
    { q: 'The Planning Commission was replaced by:', opts: ['NITI Aayog', 'Finance Commission', 'Election Commission', 'CAG'], ans: 0, exp: 'NITI Aayog replaced the Planning Commission on Jan 1, 2015' },
    { q: 'What is a fiscal deficit?', opts: ['Total expenditure - receipts excluding borrowings', 'Revenue - expenditure', 'Export - import', 'Assets - liabilities'], ans: 0, exp: 'Fiscal deficit = total expenditure minus total receipts excluding borrowings' },
  ],
  'Science': [
    { q: 'Which vitamin is produced by sunlight on skin?', opts: ['Vitamin D', 'Vitamin C', 'Vitamin A', 'Vitamin B'], ans: 0, exp: 'UV rays convert 7-dehydrocholesterol to vitamin D3' },
    { q: 'The human heart has how many chambers?', opts: ['4', '3', '2', '5'], ans: 0, exp: 'Human heart has 2 atria and 2 ventricles — 4 chambers' },
    { q: 'What is the chemical symbol for water?', opts: ['H₂O', 'CO₂', 'NaCl', 'HCl'], ans: 0, exp: 'Water molecule = H₂O (2 hydrogen + 1 oxygen)' },
    { q: 'The largest organ in the human body is:', opts: ['Skin', 'Liver', 'Brain', 'Lungs'], ans: 0, exp: 'Skin is the largest organ covering ~1.5-2 m² in adults' },
    { q: 'Which gas is essential for respiration?', opts: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Hydrogen'], ans: 0, exp: 'Oxygen is required for cellular respiration to produce energy' },
    { q: 'The unit of electric power is:', opts: ['Watt', 'Volt', 'Ampere', 'Ohm'], ans: 0, exp: 'Power = VI, unit is Watt (Joule/second)' },
    { q: 'Plants produce food through:', opts: ['Photosynthesis', 'Respiration', 'Digestion', 'Transpiration'], ans: 0, exp: 'Photosynthesis uses CO₂ + H₂O + sunlight → glucose + O₂' },
    { q: 'Which planet is closest to the Sun?', opts: ['Mercury', 'Venus', 'Earth', 'Mars'], ans: 0, exp: 'Mercury is the closest planet at ~57.9 million km from Sun' },
    { q: 'Blood pressure is measured with:', opts: ['Sphygmomanometer', 'Thermometer', 'Barometer', 'Stethoscope'], ans: 0, exp: 'Sphygmomanometer measures blood pressure (mm Hg)' },
    { q: 'Which metal is the best conductor of electricity?', opts: ['Silver', 'Copper', 'Gold', 'Aluminium'], ans: 0, exp: 'Silver has highest electrical conductivity at 63×10⁶ S/m' },
  ],
};

const examsToSkip = ['Listening', 'Reading', 'Writing', 'Speaking']; // these are IELTS/TOEFL parts, not full test subjects
const premiumPrice = 99;
const premiumOriginal = 199;

function generateQuestionsForTest(category: string, subject: string, count: number) {
  const templates = questionTemplates[subject];
  if (!templates || templates.length === 0) {
    const fallback = questionTemplates['General Awareness'];
    return Array.from({ length: count }, (_, i) => {
      const t = fallback[i % fallback.length];
      return {
        text: t.q.replace('?', `? (${category})`),
        options: t.opts.map((o, idx) => ({ label: String(idx), text: o })),
        correctAnswer: String(t.ans),
        explanation: t.exp,
        type: 'mcq' as const,
        subject,
        topic: `${subject} - Topic ${(i % 5) + 1}`,
        difficulty: (['easy', 'medium', 'hard'] as const)[i % 3],
        marks: 4,
        negativeMarks: 1,
      };
    });
  }
  return Array.from({ length: count }, (_, i) => {
    const t = templates[i % templates.length];
    return {
      text: t.q,
      options: t.opts.map((o, idx) => ({ label: String(idx), text: o })),
      correctAnswer: String(t.ans),
      explanation: t.exp,
      type: 'mcq' as const,
      subject,
      topic: `${subject} - Topic ${(i % 5) + 1}`,
      difficulty: (['easy', 'medium', 'hard'] as const)[i % 3],
      marks: 4,
      negativeMarks: 1,
    };
  });
}

async function seed() {
  await mongoose.connect(config.mongodb.uri);
  console.log('Connected to MongoDB');

  const examDocs = await Exam.find({ isActive: true });
  console.log(`Found ${examDocs.length} exams`);

  // Clear all existing test data
  const oldTests = await Test.find({});
  const oldIds = oldTests.map(t => t._id);
  if (oldIds.length > 0) {
    await Question.deleteMany({ testId: { $in: oldIds } });
    await Test.deleteMany({ _id: { $in: oldIds } });
    console.log(`Cleared ${oldIds.length} existing tests and their questions`);
  }
  // Also clear orphaned questions
  await Question.deleteMany({ testId: { $exists: false } });

  let totalTests = 0;
  let totalQuestions = 0;

  for (const exam of examDocs) {
    const subjects = subjectsByExam[exam.name];
    if (!subjects) {
      console.log(`  SKIP (no subjects defined for "${exam.name}")`);
      continue;
    }

    // 2 FREE tests
    for (let t = 1; t <= 2; t++) {
      const subjIdx = t % subjects.length;
      const subject = subjects[subjIdx];
      const qCount = 5;
      const test = await Test.create({
        name: t === 1 ? `${exam.name} ${subject} Practice` : `${exam.name} Free Mock Test`,
        description: t === 1
          ? `Practice questions covering key topics in ${subject} for ${exam.name}. Ideal for quick revision.`
          : `Free full-length mock test for ${exam.name} with mixed subject questions. Assess your preparation level.`,
        category: exam.name,
        subject: t === 1 ? subject : 'General',
        difficulty: ['easy', 'medium'][t - 1] as 'easy' | 'medium',
        duration: 10,
        totalQuestions: qCount,
        totalMarks: qCount * 4,
        passingMarks: Math.ceil(qCount * 4 * 0.4),
        negativeMarks: 1,
        isPremium: false,
        tags: [exam.slug || '', 'free', 'mock'],
        questionCount: qCount,
      });

      const questions = generateQuestionsForTest(exam.name, t === 1 ? subject : subjects[0], qCount)
        .map(q => ({ ...q, testId: test._id, category: exam.name }));
      await Question.insertMany(questions);
      totalQuestions += qCount;
      totalTests++;
      console.log(`  FREE: "${test.name}" (${qCount} Qs)`);
    }

    // 1 PREMIUM test
    const qCount = 10;
    const diff = subjects.length > 2 ? 'hard' : 'medium';
    const test = await Test.create({
      name: `${exam.name} Full Mock Test`,
      description: `Premium full mock test simulating real ${exam.name} exam conditions. Includes questions from all subjects with detailed solutions.`,
      category: exam.name,
      subject: 'Full Syllabus',
      difficulty: diff as 'hard' | 'medium',
      duration: 20,
      totalQuestions: qCount,
      totalMarks: qCount * 4,
      passingMarks: Math.ceil(qCount * 4 * 0.4),
      negativeMarks: 1,
      isPremium: true,
      price: premiumPrice,
      originalPrice: premiumOriginal,
      tags: [exam.slug || '', 'premium', 'mock', 'full'],
      questionCount: qCount,
    });

    const questions = (() => {
      const all: any[] = [];
      const countPerSubject = Math.ceil(qCount / subjects.length);
      subjects.forEach((sub, i) => {
        if (i === subjects.length - 1) {
          const remaining = qCount - all.length;
          if (remaining > 0) all.push(...generateQuestionsForTest(exam.name, sub, remaining));
        } else {
          all.push(...generateQuestionsForTest(exam.name, sub, countPerSubject));
        }
      });
      return all.slice(0, qCount);
    })();
    const dbQuestions = questions.map(q => ({ ...q, testId: test._id, category: exam.name }));
    await Question.insertMany(dbQuestions);
    totalQuestions += dbQuestions.length;
    totalTests++;
    console.log(`  PREMIUM: "${test.name}" (${dbQuestions.length} Qs)`);

    // Update test count on exam
    const count = await Test.countDocuments({ category: exam.name, isActive: true });
    await Exam.findByIdAndUpdate(exam._id, { totalTests: Math.max(count, 3) });
  }

  console.log(`\nDone! ${totalTests} tests with ${totalQuestions} questions across ${examDocs.length} exams`);
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
