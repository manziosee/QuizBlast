import { prisma } from "../config/database";
import type { Question, Category } from "../types";

function mapRow(q: {
  id: string; text: string; optionA: string; optionB: string;
  optionC: string; optionD: string; correctAnswer: string;
  explanation: string; difficulty: string; category: { name: string };
}): Question {
  return {
    id: q.id,
    category: q.category.name as Category,
    difficulty: q.difficulty as Question["difficulty"],
    text: q.text,
    options: { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD },
    correctAnswer: q.correctAnswer as Question["correctAnswer"],
    explanation: q.explanation,
  };
}

const QUESTION_PLAN = [
  { difficulty: "easy", count: 3 },
  { difficulty: "medium", count: 3 },
  { difficulty: "hard", count: 4 },
] as const;

async function selectRandomByDifficulty(
  categoryId: number,
  difficulty: string,
  count: number,
  excludedIds: Set<string>
): Promise<Question[]> {
  const picked: Question[] = [];

  while (picked.length < count) {
    const where = {
      categoryId,
      difficulty,
      id: excludedIds.size ? { notIn: [...excludedIds] } : undefined,
    };
    const remaining = await prisma.question.count({ where });
    if (remaining === 0) break;

    const [row] = await prisma.question.findMany({
      where,
      include: { category: true },
      orderBy: { id: "asc" },
      skip: Math.floor(Math.random() * remaining),
      take: 1,
    });
    if (!row) break;

    excludedIds.add(row.id);
    picked.push(mapRow(row));
  }

  return picked;
}

// Returns up to 10 questions per category: 3 easy, 3 medium, 4 hard.
// Uses random indexed reads instead of loading the whole question table.
export async function selectQuestionsForGame(category: Category, excludedIds = new Set<string>()): Promise<Question[]> {
  const cat = await prisma.category.findUnique({ where: { name: category } });
  if (!cat) throw new Error(`Unknown category: ${category}`);

  const selected: Question[] = [];
  for (const { difficulty, count } of QUESTION_PLAN) {
    selected.push(...await selectRandomByDifficulty(cat.id, difficulty, count, excludedIds));
  }

  return selected;
}

// Select questions for multiple players with different categories (individual mode)
// Returns a map of playerId → Question[]
export async function selectQuestionsPerPlayer(
  players: { id: string; category?: string }[]
): Promise<Map<string, Question[]>> {
  const result = new Map<string, Question[]>();
  const usedByCategory = new Map<string, Set<string>>();

  for (const player of players) {
    const cat = (player.category ?? "common") as Category;
    const excludedIds = usedByCategory.get(cat) ?? new Set<string>();
    const questions = await selectQuestionsForGame(cat, excludedIds);
    usedByCategory.set(cat, excludedIds);
    result.set(player.id, questions);
  }

  return result;
}
