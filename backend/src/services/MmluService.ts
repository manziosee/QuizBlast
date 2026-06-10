import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env";
import type { Question, Category, Difficulty } from "../types";

interface SubjectEntry { subject: string; category: Category; difficulty: Difficulty }

const SUBJECT_MAP: SubjectEntry[] = [
  // Math
  { subject: "elementary_mathematics",       category: "math",      difficulty: "easy"   },
  { subject: "high_school_mathematics",      category: "math",      difficulty: "medium" },
  { subject: "high_school_statistics",       category: "math",      difficulty: "medium" },
  { subject: "college_mathematics",          category: "math",      difficulty: "hard"   },
  // Science
  { subject: "conceptual_physics",           category: "science",   difficulty: "easy"   },
  { subject: "high_school_biology",          category: "science",   difficulty: "medium" },
  { subject: "high_school_chemistry",        category: "science",   difficulty: "medium" },
  { subject: "high_school_physics",          category: "science",   difficulty: "medium" },
  { subject: "astronomy",                    category: "science",   difficulty: "medium" },
  { subject: "college_biology",              category: "science",   difficulty: "hard"   },
  { subject: "college_physics",              category: "science",   difficulty: "hard"   },
  // History
  { subject: "world_religions",              category: "history",   difficulty: "easy"   },
  { subject: "prehistory",                   category: "history",   difficulty: "easy"   },
  { subject: "high_school_us_history",       category: "history",   difficulty: "medium" },
  { subject: "high_school_world_history",    category: "history",   difficulty: "medium" },
  { subject: "high_school_european_history", category: "history",   difficulty: "hard"   },
  { subject: "high_school_world_history",    category: "history",   difficulty: "hard"   },
  // Geography
  { subject: "global_facts",                 category: "geography", difficulty: "easy"   },
  { subject: "high_school_geography",        category: "geography", difficulty: "medium" },
  { subject: "high_school_geography",        category: "geography", difficulty: "hard"   },
  // Common / General knowledge
  { subject: "miscellaneous",                category: "common",    difficulty: "easy"   },
  { subject: "nutrition",                    category: "common",    difficulty: "easy"   },
  { subject: "human_aging",                  category: "common",    difficulty: "easy"   },
  { subject: "management",                   category: "common",    difficulty: "medium" },
  { subject: "marketing",                    category: "common",    difficulty: "medium" },
  { subject: "sociology",                    category: "common",    difficulty: "medium" },
  { subject: "logical_fallacies",            category: "common",    difficulty: "hard"   },
  { subject: "philosophy",                   category: "common",    difficulty: "hard"   },
];

const ANSWER_KEYS = ["A", "B", "C", "D"] as const;
const questionCache = new Map<string, Question[]>();

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

async function fetchSubject(entry: SubjectEntry): Promise<Question[]> {
  const url =
    `https://datasets-server.huggingface.co/rows` +
    `?dataset=cais/mmlu&config=${encodeURIComponent(entry.subject)}` +
    `&split=test&offset=0&length=100`;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (env.HUGGINGFACE_API_KEY) headers["Authorization"] = `Bearer ${env.HUGGINGFACE_API_KEY}`;

  const res = await fetch(url, { headers, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`HF ${res.status} for ${entry.subject}`);

  const data = (await res.json()) as {
    rows: { row: { question: string; choices: string[]; answer: number } }[];
  };

  return data.rows
    .filter((r) => Array.isArray(r.row.choices) && r.row.choices.length === 4)
    .map(({ row }) => {
      const correct = ANSWER_KEYS[row.answer] ?? "A";
      const text = row.question.trim();
      return {
        id: uuidv4(),
        category: entry.category,
        difficulty: entry.difficulty,
        text: text.endsWith("?") ? text : text + "?",
        options: {
          A: row.choices[0],
          B: row.choices[1],
          C: row.choices[2],
          D: row.choices[3],
        },
        correctAnswer: correct,
        explanation: `The correct answer is: ${row.choices[row.answer]}.`,
      };
    });
}

export async function loadMmluPool(category: Category, difficulty: Difficulty): Promise<Question[]> {
  const key = `${category}:${difficulty}`;
  if (questionCache.has(key)) return questionCache.get(key)!;

  const entries = SUBJECT_MAP.filter(
    (m) => m.category === category && m.difficulty === difficulty
  );
  // Deduplicate subject names so we don't fetch the same subject twice for the same pool
  const seen = new Set<string>();
  const unique = entries.filter((e) => !seen.has(e.subject) && seen.add(e.subject));

  const all: Question[] = [];
  await Promise.allSettled(
    unique.map(async (entry) => {
      try {
        const qs = await fetchSubject(entry);
        all.push(...qs);
        console.log(`[MMLU] Loaded ${qs.length} questions: ${entry.subject} (${key})`);
      } catch (err) {
        console.warn(`[MMLU] ${entry.subject}: ${(err as Error).message}`);
      }
    })
  );

  const shuffled = shuffle(all);
  if (shuffled.length > 0) questionCache.set(key, shuffled);
  return shuffled;
}

export async function getMmluQuestion(
  category: Category,
  difficulty: Difficulty,
  usedIds: string[]
): Promise<Question | null> {
  let pool = await loadMmluPool(category, difficulty);

  // Fallback to medium if no coverage for the requested difficulty
  if (pool.length === 0 && difficulty !== "medium") {
    pool = await loadMmluPool(category, "medium");
  }
  if (pool.length === 0) return null;

  const usedSet = new Set(usedIds);
  const available = pool.filter((q) => !usedSet.has(q.id));
  const source = available.length > 0 ? available : pool;

  return source[Math.floor(Math.random() * source.length)];
}
