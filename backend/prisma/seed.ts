import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { name: "math",      label: "Mathematics" },
  { name: "science",   label: "Science" },
  { name: "history",   label: "History" },
  { name: "geography", label: "Geography" },
  { name: "common",    label: "General Knowledge" },
];

const questions = [
  // ── MATH ──────────────────────────────────────────────────────────────
  { category: "math", difficulty: "easy",
    text: "What is 12 × 12?",
    optionA: "132", optionB: "144", optionC: "124", optionD: "148",
    correctAnswer: "B", explanation: "12 × 12 = 144. This is a perfect square." },

  { category: "math", difficulty: "easy",
    text: "What is the value of π rounded to two decimal places?",
    optionA: "3.12", optionB: "3.41", optionC: "3.14", optionD: "3.16",
    correctAnswer: "C", explanation: "π ≈ 3.14159…, which rounds to 3.14." },

  { category: "math", difficulty: "easy",
    text: "What is 15% of 200?",
    optionA: "25", optionB: "30", optionC: "35", optionD: "40",
    correctAnswer: "B", explanation: "15% of 200 = 0.15 × 200 = 30." },

  { category: "math", difficulty: "medium",
    text: "Solve: 2x + 5 = 17. What is x?",
    optionA: "5", optionB: "7", optionC: "6", optionD: "8",
    correctAnswer: "C", explanation: "2x = 12, so x = 6." },

  { category: "math", difficulty: "medium",
    text: "What is the square root of 225?",
    optionA: "13", optionB: "14", optionC: "15", optionD: "16",
    correctAnswer: "C", explanation: "15 × 15 = 225." },

  { category: "math", difficulty: "medium",
    text: "What is the area of a circle with radius 7? (π ≈ 3.14)",
    optionA: "153.86", optionB: "43.96", optionC: "144", optionD: "196",
    correctAnswer: "A", explanation: "Area = π × r² = 3.14 × 49 ≈ 153.86." },

  { category: "math", difficulty: "hard",
    text: "A triangle has sides 3, 4, and 5. What type of triangle is it?",
    optionA: "Equilateral", optionB: "Isosceles", optionC: "Right-angled", optionD: "Obtuse",
    correctAnswer: "C", explanation: "3² + 4² = 5² → satisfies Pythagoras theorem." },

  { category: "math", difficulty: "hard",
    text: "What is the derivative of f(x) = x³ + 2x?",
    optionA: "3x + 2", optionB: "3x² + 2", optionC: "x² + 2", optionD: "3x² + 2x",
    correctAnswer: "B", explanation: "d/dx(x³) = 3x², d/dx(2x) = 2. So f'(x) = 3x² + 2." },

  { category: "math", difficulty: "hard",
    text: "How many prime numbers are between 1 and 20?",
    optionA: "6", optionB: "7", optionC: "8", optionD: "9",
    correctAnswer: "C", explanation: "Primes: 2, 3, 5, 7, 11, 13, 17, 19 — that's 8." },

  { category: "math", difficulty: "hard",
    text: "What is log₁₀(1000)?",
    optionA: "2", optionB: "4", optionC: "3", optionD: "100",
    correctAnswer: "C", explanation: "10³ = 1000, so log₁₀(1000) = 3." },

  // ── SCIENCE ───────────────────────────────────────────────────────────
  { category: "science", difficulty: "easy",
    text: "What is the chemical symbol for water?",
    optionA: "WA", optionB: "H₂O", optionC: "HO₂", optionD: "W",
    correctAnswer: "B", explanation: "Water is 2 hydrogen atoms + 1 oxygen atom: H₂O." },

  { category: "science", difficulty: "easy",
    text: "Which planet is known as the Red Planet?",
    optionA: "Venus", optionB: "Jupiter", optionC: "Mars", optionD: "Saturn",
    correctAnswer: "C", explanation: "Mars looks red due to iron oxide (rust) on its surface." },

  { category: "science", difficulty: "easy",
    text: "What is the powerhouse of the cell?",
    optionA: "Nucleus", optionB: "Mitochondria", optionC: "Ribosome", optionD: "Golgi body",
    correctAnswer: "B", explanation: "Mitochondria produce ATP — the cell's energy currency." },

  { category: "science", difficulty: "medium",
    text: "What is the speed of light in a vacuum?",
    optionA: "300,000 km/s", optionB: "150,000 km/s", optionC: "450,000 km/s", optionD: "200,000 km/s",
    correctAnswer: "A", explanation: "Light travels at ≈ 299,792 km/s ≈ 300,000 km/s in a vacuum." },

  { category: "science", difficulty: "medium",
    text: "What gas do plants absorb during photosynthesis?",
    optionA: "Oxygen", optionB: "Nitrogen", optionC: "Carbon dioxide", optionD: "Hydrogen",
    correctAnswer: "C", explanation: "Plants absorb CO₂ and water, producing glucose and oxygen." },

  { category: "science", difficulty: "medium",
    text: "What is the atomic number of carbon?",
    optionA: "4", optionB: "6", optionC: "8", optionD: "12",
    correctAnswer: "B", explanation: "Carbon has 6 protons → atomic number 6." },

  { category: "science", difficulty: "hard",
    text: "What is Newton's Second Law of Motion?",
    optionA: "Every action has an equal and opposite reaction",
    optionB: "An object at rest stays at rest",
    optionC: "Force equals mass times acceleration",
    optionD: "Energy cannot be created or destroyed",
    correctAnswer: "C", explanation: "F = ma. Force = mass × acceleration." },

  { category: "science", difficulty: "hard",
    text: "What is the approximate half-life of Carbon-14?",
    optionA: "1,000 years", optionB: "5,730 years", optionC: "10,000 years", optionD: "500 years",
    correctAnswer: "B", explanation: "Carbon-14 half-life ≈ 5,730 years, used in radiocarbon dating." },

  { category: "science", difficulty: "hard",
    text: "What is the chemical formula for table salt?",
    optionA: "KCl", optionB: "CaCl₂", optionC: "NaCl", optionD: "MgCl₂",
    correctAnswer: "C", explanation: "Table salt is sodium chloride: NaCl." },

  { category: "science", difficulty: "hard",
    text: "What is the most abundant gas in Earth's atmosphere?",
    optionA: "Oxygen", optionB: "Carbon dioxide", optionC: "Argon", optionD: "Nitrogen",
    correctAnswer: "D", explanation: "Nitrogen makes up about 78% of Earth's atmosphere." },

  // ── HISTORY ───────────────────────────────────────────────────────────
  { category: "history", difficulty: "easy",
    text: "In which year did World War II end?",
    optionA: "1943", optionB: "1944", optionC: "1945", optionD: "1946",
    correctAnswer: "C", explanation: "WWII ended in 1945 — Germany in May, Japan in September." },

  { category: "history", difficulty: "easy",
    text: "Who was the first man to walk on the Moon?",
    optionA: "Buzz Aldrin", optionB: "Neil Armstrong", optionC: "Yuri Gagarin", optionD: "John Glenn",
    correctAnswer: "B", explanation: "Neil Armstrong landed on the Moon on July 20, 1969." },

  { category: "history", difficulty: "easy",
    text: "Which ancient wonder was located in Alexandria, Egypt?",
    optionA: "The Colosseum", optionB: "The Lighthouse of Alexandria", optionC: "The Parthenon", optionD: "The Sphinx",
    correctAnswer: "B", explanation: "The Lighthouse of Alexandria was one of the Seven Wonders of the Ancient World." },

  { category: "history", difficulty: "medium",
    text: "Who was the first President of the United States?",
    optionA: "Abraham Lincoln", optionB: "Thomas Jefferson", optionC: "George Washington", optionD: "John Adams",
    correctAnswer: "C", explanation: "George Washington was inaugurated as the 1st U.S. President on April 30, 1789." },

  { category: "history", difficulty: "medium",
    text: "In which year did Rwanda gain independence?",
    optionA: "1959", optionB: "1960", optionC: "1962", optionD: "1964",
    correctAnswer: "C", explanation: "Rwanda gained independence from Belgium on July 1, 1962." },

  { category: "history", difficulty: "medium",
    text: "Which city was divided by a wall from 1961 to 1989?",
    optionA: "Paris", optionB: "Warsaw", optionC: "Berlin", optionD: "Vienna",
    correctAnswer: "C", explanation: "The Berlin Wall divided East and West Berlin from 1961 until its fall on November 9, 1989." },

  { category: "history", difficulty: "hard",
    text: "What was the name of the ship that sank on April 15, 1912?",
    optionA: "Lusitania", optionB: "Titanic", optionC: "Britannic", optionD: "Olympic",
    correctAnswer: "B", explanation: "RMS Titanic sank after hitting an iceberg in the North Atlantic." },

  { category: "history", difficulty: "hard",
    text: "Which empire was the largest in history by land area?",
    optionA: "Roman Empire", optionB: "Ottoman Empire", optionC: "British Empire", optionD: "Mongol Empire",
    correctAnswer: "C", explanation: "At its peak, the British Empire covered ~24% of Earth's land area." },

  { category: "history", difficulty: "hard",
    text: "The French Revolution began in which year?",
    optionA: "1776", optionB: "1789", optionC: "1799", optionD: "1804",
    correctAnswer: "B", explanation: "The French Revolution began in 1789 with the storming of the Bastille on July 14." },

  { category: "history", difficulty: "hard",
    text: "Who wrote the 'Communist Manifesto'?",
    optionA: "Vladimir Lenin", optionB: "Friedrich Engels only", optionC: "Karl Marx and Friedrich Engels", optionD: "Joseph Stalin",
    correctAnswer: "C", explanation: "Karl Marx and Friedrich Engels co-authored the Communist Manifesto in 1848." },

  // ── GEOGRAPHY ─────────────────────────────────────────────────────────
  { category: "geography", difficulty: "easy",
    text: "What is the capital city of Rwanda?",
    optionA: "Butare", optionB: "Gisenyi", optionC: "Kigali", optionD: "Musanze",
    correctAnswer: "C", explanation: "Kigali is the capital and largest city of Rwanda." },

  { category: "geography", difficulty: "easy",
    text: "Which is the longest river in the world?",
    optionA: "Amazon", optionB: "Nile", optionC: "Yangtze", optionD: "Mississippi",
    correctAnswer: "B", explanation: "The Nile River is approximately 6,650 km long." },

  { category: "geography", difficulty: "easy",
    text: "On which continent is the Sahara Desert?",
    optionA: "Asia", optionB: "South America", optionC: "Australia", optionD: "Africa",
    correctAnswer: "D", explanation: "The Sahara is in North Africa — the world's largest hot desert." },

  { category: "geography", difficulty: "medium",
    text: "What is the capital of Australia?",
    optionA: "Sydney", optionB: "Melbourne", optionC: "Canberra", optionD: "Brisbane",
    correctAnswer: "C", explanation: "Canberra is the capital — not Sydney, which is the largest city." },

  { category: "geography", difficulty: "medium",
    text: "Which country has the most natural lakes?",
    optionA: "Russia", optionB: "United States", optionC: "Brazil", optionD: "Canada",
    correctAnswer: "D", explanation: "Canada has ≈ 31,752 lakes larger than 3 km², more than any other country." },

  { category: "geography", difficulty: "medium",
    text: "Mount Everest is located on the border of which two countries?",
    optionA: "India and China", optionB: "Nepal and China", optionC: "Nepal and India", optionD: "Bhutan and China",
    correctAnswer: "B", explanation: "Mount Everest sits on the border between Nepal and Tibet (China)." },

  { category: "geography", difficulty: "hard",
    text: "What is the smallest country in the world by area?",
    optionA: "Monaco", optionB: "San Marino", optionC: "Vatican City", optionD: "Liechtenstein",
    correctAnswer: "C", explanation: "Vatican City covers only about 0.44 km²." },

  { category: "geography", difficulty: "hard",
    text: "Which ocean is the largest?",
    optionA: "Atlantic", optionB: "Indian", optionC: "Arctic", optionD: "Pacific",
    correctAnswer: "D", explanation: "The Pacific Ocean covers about 165 million km² — more than all land combined." },

  { category: "geography", difficulty: "hard",
    text: "The Strait of Malacca connects which two bodies of water?",
    optionA: "Red Sea and Persian Gulf", optionB: "Indian Ocean and South China Sea", optionC: "Pacific and Indian Oceans", optionD: "Bay of Bengal and Arabian Sea",
    correctAnswer: "B", explanation: "The Strait of Malacca connects the Indian Ocean to the South China Sea." },

  { category: "geography", difficulty: "hard",
    text: "Which African country has the most pyramids?",
    optionA: "Egypt", optionB: "Libya", optionC: "Sudan", optionD: "Ethiopia",
    correctAnswer: "C", explanation: "Sudan has about 200–255 pyramids — more than Egypt's ~138." },

  // ── GENERAL KNOWLEDGE ─────────────────────────────────────────────────
  { category: "common", difficulty: "easy",
    text: "How many sides does a hexagon have?",
    optionA: "5", optionB: "7", optionC: "8", optionD: "6",
    correctAnswer: "D", explanation: "Hexagon = 6 sides. 'Hex' means six in Greek." },

  { category: "common", difficulty: "easy",
    text: "What is the primary language spoken in Brazil?",
    optionA: "Spanish", optionB: "Portuguese", optionC: "French", optionD: "English",
    correctAnswer: "B", explanation: "Brazil was colonized by Portugal — Portuguese is the official language." },

  { category: "common", difficulty: "easy",
    text: "How many colors are in a rainbow?",
    optionA: "5", optionB: "6", optionC: "7", optionD: "8",
    correctAnswer: "C", explanation: "ROYGBIV: Red, Orange, Yellow, Green, Blue, Indigo, Violet = 7 colors." },

  { category: "common", difficulty: "medium",
    text: "Which company created the iPhone?",
    optionA: "Google", optionB: "Samsung", optionC: "Apple", optionD: "Microsoft",
    correctAnswer: "C", explanation: "Apple launched the first iPhone in 2007, introduced by Steve Jobs." },

  { category: "common", difficulty: "medium",
    text: "What does 'WWW' stand for in a website address?",
    optionA: "World Wide Web", optionB: "Wide World Web", optionC: "Web World Wide", optionD: "World Web Wide",
    correctAnswer: "A", explanation: "WWW = World Wide Web, the information system built on the internet." },

  { category: "common", difficulty: "medium",
    text: "How many bones are in the adult human body?",
    optionA: "186", optionB: "196", optionC: "206", optionD: "216",
    correctAnswer: "C", explanation: "The adult human body has 206 bones." },

  { category: "common", difficulty: "hard",
    text: "In which year was the first email sent?",
    optionA: "1969", optionB: "1971", optionC: "1975", optionD: "1983",
    correctAnswer: "B", explanation: "Ray Tomlinson sent the first email in 1971 and introduced the @ symbol." },

  { category: "common", difficulty: "hard",
    text: "What is the most spoken language by native speakers?",
    optionA: "English", optionB: "Spanish", optionC: "Hindi", optionD: "Mandarin Chinese",
    correctAnswer: "D", explanation: "Mandarin Chinese has ~920 million native speakers." },

  { category: "common", difficulty: "hard",
    text: "Which element has the chemical symbol 'Au'?",
    optionA: "Silver", optionB: "Copper", optionC: "Gold", optionD: "Aluminum",
    correctAnswer: "C", explanation: "'Au' comes from the Latin word 'aurum', meaning gold." },

  { category: "common", difficulty: "hard",
    text: "What is the largest organ in the human body?",
    optionA: "Liver", optionB: "Brain", optionC: "Lungs", optionD: "Skin",
    correctAnswer: "D", explanation: "Skin is the largest organ, covering about 1.7–2 m² in adults." },
];

async function main() {
  console.log("Seeding database...");

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  const allCats = await prisma.category.findMany();
  const catMap = Object.fromEntries(allCats.map((c) => [c.name, c.id]));

  await prisma.question.deleteMany();

  for (const q of questions) {
    await prisma.question.create({
      data: {
        categoryId: catMap[q.category],
        difficulty: q.difficulty,
        text: q.text,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      },
    });
  }

  console.log(`Done — ${questions.length} questions seeded across ${categories.length} categories.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
