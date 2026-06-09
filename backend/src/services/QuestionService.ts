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

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export async function selectQuestionsForGame(category: Category): Promise<Question[]> {
  const cat = await prisma.category.findUnique({ where: { name: category } });
  if (!cat) throw new Error(`Unknown category: ${category}`);

  const [easy, medium, hard] = await Promise.all([
    prisma.question.findMany({ where: { categoryId: cat.id, difficulty: "easy" }, include: { category: true } }),
    prisma.question.findMany({ where: { categoryId: cat.id, difficulty: "medium" }, include: { category: true } }),
    prisma.question.findMany({ where: { categoryId: cat.id, difficulty: "hard" }, include: { category: true } }),
  ]);

  return [
    ...shuffle(easy).slice(0, 3),
    ...shuffle(medium).slice(0, 3),
    ...shuffle(hard).slice(0, 4),
  ].map(mapRow);
}
