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
  common:    "general knowledge, sports, music, food, animals, nature, famous people",
};

function pickDifficulty(requested: SoloDifficulty): Difficulty {
  if (requested !== "mixed") return requested;
  const roll = Math.random();
  if (roll < 0.30) return "easy";
  if (roll < 0.75) return "medium";
  return "hard";
}

function buildGroqPrompt(category: Exclude<Category, "math">, difficulty: Difficulty): string {
  return `Generate one ${difficulty} multiple-choice quiz question about ${category} (topics: ${CATEGORY_CONTEXT[category]}).

Return ONLY valid JSON, no markdown fences:
{
  "text": "the question ending with ?",
  "options": {"A": "option A", "B": "option B", "C": "option C", "D": "option D"},
  "correctAnswer": "A",
  "explanation": "brief 1-2 sentence explanation"
}

Rules:
- Options must be plausible (not obviously wrong)
- correctAnswer must be "A", "B", "C", or "D"
- Each option under 60 characters
- Factually accurate`;
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

// Generate one question for solo mode
// usedIds: IDs of questions already served this session (prevents MMLU repeats)
export async function generateSoloQuestion(
  category: Category,
  difficulty: SoloDifficulty,
  usedIds: string[] = []
): Promise<Question> {
  const diff = pickDifficulty(difficulty);

  // Math: always use procedural generator (infinite, no API)
  if (category === "math") return generateMathQuestion(diff);

  // Non-math: primary source is MMLU (free, high quality)
  try {
    const q = await getMmluQuestion(category, diff, usedIds);
    if (q) return q;
  } catch (err) {
    console.warn(`[AIQuestionService] MMLU failed: ${(err as Error).message}`);
  }

  // Fallback: Groq (free tier, AI-generated)
  try {
    return await generateGroqQuestion(category as Exclude<Category, "math">, diff);
  } catch (err) {
    console.warn(`[AIQuestionService] Groq failed: ${(err as Error).message}`);
  }

  // Last resort: math question (always works)
  return generateMathQuestion(diff);
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
