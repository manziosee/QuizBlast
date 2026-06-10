import Groq from "groq-sdk";
import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env";
import { generateMathQuestion } from "./MathGenerator";
import { getMmluQuestion } from "./MmluService";
import type { Question, Category, Difficulty } from "../types";

export type SoloDifficulty = Difficulty | "mixed";

const groq = env.GROQ_API_KEY ? new Groq({ apiKey: env.GROQ_API_KEY }) : null;

const CATEGORY_CONTEXT: Record<Exclude<Category, "math">, string> = {
  science:   "biology, chemistry, physics, astronomy, technology, inventions",
  history:   "world history, ancient civilizations, wars, empires, revolutions, historical figures",
  geography: "countries, capitals, continents, mountains, rivers, oceans, landmarks",
  common:    "", // dynamically chosen below — see COMMON_TOPICS
};

// Each sub-array is a topic cluster for the "common" category.
// One cluster is picked at random each call so Groq produces diverse questions.
const COMMON_TOPICS: string[] = [
  // Sports
  "football (soccer) — clubs, players, World Cup, famous goals, records",
  "Formula 1 — drivers, constructors, circuits, champions, race records",
  "MotoGP — riders, manufacturers, circuits, world champions",
  "volleyball — rules, famous players, Olympic history",
  "basketball — NBA teams, legends, records, rules",
  "tennis — Grand Slams, famous players, rules",
  "athletics — Olympic records, sprinters, marathoners",
  // Entertainment & pop culture
  "music — famous bands, singers, albums, music history, genres",
  "movies — blockbusters, directors, actors, Academy Awards, film history",
  "TV shows — popular series, characters, streaming, TV history",
  "actors and actresses — famous roles, awards, careers",
  // Nature & geography features
  "rivers and lakes — world's longest rivers, largest lakes, notable waterways",
  "mountains — world's highest peaks, mountain ranges, famous climbs",
  "animals and wildlife — behaviour, habitats, records (fastest, largest, etc.)",
  "oceans and seas — depths, currents, marine life",
  // Companies & brands
  "global brands — Nike, Adidas, Puma, Apple, Google, Amazon, Microsoft histories",
  "car manufacturers — BMW, Mercedes, Ferrari, Toyota, Ford — history and models",
  "food & beverage brands — Coca-Cola, McDonald's, Nestlé, famous products",
  // Technology & everyday life
  "technology and gadgets — smartphones, internet, social media, inventions",
  "everyday science — how common things work, basic physics in daily life",
  "food and cooking — popular dishes, ingredients, world cuisines",
  "human body — basic anatomy, health facts, senses",
  // General knowledge
  "world records — Guinness records, firsts, extremes",
  "flags and national symbols — country flags, anthems, emblems",
  "languages — most spoken, interesting linguistic facts",
  "space and planets — solar system basics, famous missions, astronauts",
  "common sense — things every child or adult should know about daily life",
];

function pickDifficulty(requested: SoloDifficulty): Difficulty {
  if (requested !== "mixed") return requested;
  const roll = Math.random();
  if (roll < 0.30) return "easy";
  if (roll < 0.75) return "medium";
  return "hard";
}

const DIFFICULTY_FRAMING: Record<Difficulty, string> = {
  easy: `EASY difficulty — must be answerable by any 10-year-old child with zero specialist knowledge.
Good examples: "How many legs does a dog have?" / "Which direction does the sun rise?" / "What do bees make?"
If answering requires a textbook, a science class, or research — it is TOO HARD. Simplify it.`,
  medium: `MEDIUM difficulty — a curious adult with general knowledge should know this.
Think pub quiz / game show level. Not trivial, but not obscure academic knowledge either.`,
  hard: `HARD difficulty — requires specific knowledge, deep familiarity, or research to answer correctly.
Most adults should NOT know this off the top of their head.`,
};

function buildGroqPrompt(category: Exclude<Category, "math">, difficulty: Difficulty): string {
  let topicLine: string;
  if (category === "common") {
    const topic = COMMON_TOPICS[Math.floor(Math.random() * COMMON_TOPICS.length)];
    topicLine = `Focus specifically on: ${topic}`;
  } else {
    topicLine = `Topics: ${CATEGORY_CONTEXT[category]}`;
  }

  return `Generate one multiple-choice quiz question about ${category}.
${topicLine}

${DIFFICULTY_FRAMING[difficulty]}

Return ONLY valid JSON — no markdown fences, no extra text:
{
  "text": "the question ending with ?",
  "options": {"A": "option A", "B": "option B", "C": "option C", "D": "option D"},
  "correctAnswer": "A",
  "explanation": "brief 1-2 sentence explanation"
}

Rules:
- All 4 options must be plausible (not obviously wrong)
- correctAnswer must be exactly "A", "B", "C", or "D"
- Each option under 60 characters
- Factually accurate
- The question must be strictly about ${category} — do NOT generate math or arithmetic questions`;
}

async function generateGroqQuestion(
  category: Exclude<Category, "math">,
  difficulty: Difficulty
): Promise<Question> {
  if (!groq) throw new Error("Groq not configured");

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: buildGroqPrompt(category, difficulty) }],
    temperature: 0.8,
    max_tokens: 512,
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
  const parsed = JSON.parse(cleaned);

  if (
    typeof parsed.text !== "string" ||
    !["A", "B", "C", "D"].includes(parsed.correctAnswer) ||
    typeof parsed.options?.A !== "string"
  ) throw new Error("Invalid Groq response format");

  return {
    id: uuidv4(),
    category,
    difficulty,
    text: parsed.text,
    options: parsed.options,
    correctAnswer: parsed.correctAnswer,
    explanation: parsed.explanation ?? "No explanation provided.",
  };
}

// Generate one question for solo mode.
// usedIds: IDs of questions already served this session (prevents MMLU repeats).
export async function generateSoloQuestion(
  category: Category,
  difficulty: SoloDifficulty,
  usedIds: string[] = []
): Promise<Question> {
  const diff = pickDifficulty(difficulty);

  // Math: always procedural — infinite supply, no API needed.
  if (category === "math") return generateMathQuestion(diff);

  const cat = category as Exclude<Category, "math">;

  // MMLU is skipped for:
  //   "common"  — MMLU common subjects (nutrition, sociology, philosophy, etc.) are
  //               university-level academic content, NOT common sense. Groq handles this.
  //   "easy"    — MMLU "easy" subjects are still designed for academic testing and produce
  //               questions far too hard for the easy tier. Groq respects the difficulty framing.
  const useMmlu = cat !== "common" && diff !== "easy";

  if (useMmlu) {
    try {
      const q = await getMmluQuestion(cat, diff, usedIds);
      if (q) return q;
    } catch (err) {
      console.warn(`[AIQuestionService] MMLU failed: ${(err as Error).message}`);
    }
  }

  // Groq — 2 attempts (handles rate-limit hiccups).
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      return await generateGroqQuestion(cat, diff);
    } catch (err) {
      console.warn(`[AIQuestionService] Groq attempt ${attempt} failed: ${(err as Error).message}`);
    }
  }

  // If Groq failed and we skipped MMLU, try MMLU now as last resort (not for common).
  if (useMmlu === false && cat !== "common") {
    try {
      const q = await getMmluQuestion(cat, diff, usedIds);
      if (q) return q;
    } catch {}
  }

  // Absolute last resort: one more Groq call at easy difficulty for the correct category.
  // NEVER fall back to math for a non-math category — that would show wrong questions.
  return generateGroqQuestion(cat, "easy");
}

// Pre-generate multiple questions, tracking used IDs to avoid repeats
export async function prefetchQuestions(
  category: Category,
  difficulty: SoloDifficulty,
  count: number,
  usedIds: string[] = []
): Promise<Question[]> {
  const results: Question[] = [];
  const trackedIds = [...usedIds];

  for (let i = 0; i < count; i++) {
    const q = await generateSoloQuestion(category, difficulty, trackedIds);
    results.push(q);
    trackedIds.push(q.id);
  }

  return results;
}
