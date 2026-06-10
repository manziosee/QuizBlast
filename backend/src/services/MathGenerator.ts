import { v4 as uuidv4 } from "uuid";
import type { Question } from "../types";

type Difficulty = "easy" | "medium" | "hard";

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

// Build 4 answer choices: 1 correct + 3 plausible wrong answers
function buildOptions(correct: number, delta: number[] = []): { options: Question["options"]; correctAnswer: Question["correctAnswer"] } {
  const defaultDeltas = [
    rand(1, 5), rand(6, 12), rand(13, 20),
    -rand(1, 5), -rand(6, 12),
    rand(2, 8) * 10, -rand(1, 3) * 10,
  ];
  const allDeltas = [...delta, ...defaultDeltas];
  const wrongs = new Set<number>();
  for (const d of allDeltas) {
    const w = correct + d;
    if (w !== correct && w > 0) wrongs.add(w);
    if (wrongs.size >= 3) break;
  }
  while (wrongs.size < 3) {
    const w = correct + rand(1, 30) * (Math.random() > 0.5 ? 1 : -1);
    if (w !== correct && w > 0) wrongs.add(w);
  }
  const pool = shuffle([correct, ...[...wrongs].slice(0, 3)]);
  const letters = ["A", "B", "C", "D"] as const;
  const idx = pool.indexOf(correct);
  return {
    options: { A: String(pool[0]), B: String(pool[1]), C: String(pool[2]), D: String(pool[3]) },
    correctAnswer: letters[idx],
  };
}

function buildStringOptions(correct: string, wrongs: string[]): { options: Question["options"]; correctAnswer: Question["correctAnswer"] } {
  const pool = shuffle([correct, ...wrongs.slice(0, 3)]);
  const letters = ["A", "B", "C", "D"] as const;
  const idx = pool.indexOf(correct);
  return {
    options: { A: pool[0], B: pool[1], C: pool[2], D: pool[3] },
    correctAnswer: letters[idx],
  };
}

// ── Easy generators ───────────────────────────────────────────────────────────

function easyAddition(): Partial<Question> {
  const a = rand(50, 999), b = rand(50, 999);
  const correct = a + b;
  const { options, correctAnswer } = buildOptions(correct, [rand(10, 50), -rand(10, 50), rand(1, 9), -rand(1, 9)]);
  return { text: `What is ${a} + ${b}?`, options, correctAnswer, explanation: `${a} + ${b} = ${correct}.` };
}

function easySubtraction(): Partial<Question> {
  const b = rand(20, 400), a = b + rand(20, 400);
  const correct = a - b;
  const { options, correctAnswer } = buildOptions(correct);
  return { text: `What is ${a} − ${b}?`, options, correctAnswer, explanation: `${a} − ${b} = ${correct}.` };
}

function easyMultiplication(): Partial<Question> {
  const a = rand(3, 15), b = rand(3, 15);
  const correct = a * b;
  const { options, correctAnswer } = buildOptions(correct, [a, b, -a, a * 2, b * 2]);
  return { text: `What is ${a} × ${b}?`, options, correctAnswer, explanation: `${a} × ${b} = ${correct}.` };
}

function easyFraction(): Partial<Question> {
  const denoms: [number, number, string][] = [[2, 1, "half"], [4, 1, "a quarter"], [3, 1, "a third"], [5, 1, "a fifth"]];
  const [denom, , label] = denoms[rand(0, denoms.length - 1)];
  const n = rand(2, 20) * denom;
  const correct = n / denom;
  const { options, correctAnswer } = buildOptions(correct, [correct + denom, correct - 1, n]);
  return { text: `What is ${label} of ${n}?`, options, correctAnswer, explanation: `${n} ÷ ${denom} = ${correct}.` };
}

function easyPercentage(): Partial<Question> {
  const percents = [10, 20, 25, 50];
  const p = percents[rand(0, percents.length - 1)];
  const n = rand(2, 20) * (100 / p);
  const correct = (p / 100) * n;
  const { options, correctAnswer } = buildOptions(correct, [correct * 2, correct / 2, n - correct]);
  return { text: `What is ${p}% of ${n}?`, options, correctAnswer, explanation: `${p}% of ${n} = ${n} × ${p}/100 = ${correct}.` };
}

// ── Medium generators ─────────────────────────────────────────────────────────

function mediumSquare(): Partial<Question> {
  const a = rand(11, 25);
  const correct = a * a;
  const { options, correctAnswer } = buildOptions(correct, [(a - 1) ** 2 - correct, (a + 1) ** 2 - correct, a - correct]);
  return { text: `What is ${a}²?`, options, correctAnswer, explanation: `${a} × ${a} = ${correct}.` };
}

function mediumSqrt(): Partial<Question> {
  const roots = [4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225, 256, 289, 324, 361, 400, 441, 484, 529, 576];
  const n = roots[rand(0, roots.length - 1)];
  const correct = Math.sqrt(n);
  const { options, correctAnswer } = buildOptions(correct, [1, -1, 2, -2]);
  return { text: `What is √${n}?`, options, correctAnswer, explanation: `√${n} = ${correct} because ${correct} × ${correct} = ${n}.` };
}

function mediumAlgebra(): Partial<Question> {
  const x = rand(2, 20);
  const a = rand(2, 8);
  const b = rand(1, 20);
  const c = a * x + b;
  const { options, correctAnswer } = buildOptions(x, [1, -1, 2, -2, a]);
  return {
    text: `If ${a}x + ${b} = ${c}, what is x?`,
    options, correctAnswer,
    explanation: `${a}x = ${c} − ${b} = ${c - b}, so x = ${c - b} ÷ ${a} = ${x}.`,
  };
}

function mediumAverage(): Partial<Question> {
  const nums = Array.from({ length: rand(3, 5) }, () => rand(20, 99));
  const sum = nums.reduce((s, n) => s + n, 0);
  const correct = Math.round(sum / nums.length);
  const { options, correctAnswer } = buildOptions(correct);
  return {
    text: `What is the average of ${nums.join(", ")}?`,
    options, correctAnswer,
    explanation: `(${nums.join(" + ")}) ÷ ${nums.length} = ${sum} ÷ ${nums.length} = ${correct}.`,
  };
}

function mediumPercentage(): Partial<Question> {
  const p = rand(3, 9) * 5;
  const n = rand(4, 20) * 10;
  const correct = Math.round((p / 100) * n);
  const { options, correctAnswer } = buildOptions(correct, [correct + 5, correct - 5, Math.round(n / p)]);
  return {
    text: `What is ${p}% of ${n}?`,
    options, correctAnswer,
    explanation: `${p}% of ${n} = ${n} × ${p}/100 = ${correct}.`,
  };
}

// ── Hard generators ───────────────────────────────────────────────────────────

function hardAlgebra(): Partial<Question> {
  const x = rand(2, 15);
  const a = rand(3, 8), b = rand(1, 15), c = rand(2, 6), d = rand(1, 15);
  const rhs = c * x + d;
  const lhs = a * x - b;
  // ax - b = cx + d  →  (a-c)x = d + b  →  x = (d+b)/(a-c)
  // ensure integer result: pick a-c first, then scale
  const diff = rand(2, 5);
  const newA = c + diff;
  const sum = b + d;
  const newX = sum / diff;
  if (!Number.isInteger(newX) || newX <= 0) return hardAlgebra(); // retry
  const lhsVal = newA * newX - b;
  const { options, correctAnswer } = buildOptions(newX, [newX + diff, newX - 1, newX + 1]);
  return {
    text: `If ${newA}x − ${b} = ${c}x + ${d}, what is x?`,
    options, correctAnswer,
    explanation: `${newA}x − ${c}x = ${d} + ${b}, so ${diff}x = ${sum}, x = ${newX}.`,
  };
}

function hardCubeRoot(): Partial<Question> {
  const n = rand(2, 12);
  const cube = n ** 3;
  const { options, correctAnswer } = buildOptions(n, [1, -1, 2, -2]);
  return { text: `What is ∛${cube}?`, options, correctAnswer, explanation: `${n}³ = ${cube}, so ∛${cube} = ${n}.` };
}

function hardTriangleArea(): Partial<Question> {
  const base = rand(3, 20) * 2, height = rand(3, 20) * 2;
  const correct = (base * height) / 2;
  const { options, correctAnswer } = buildOptions(correct, [base * height - correct, correct + 10, correct - 10]);
  return {
    text: `What is the area of a triangle with base ${base} and height ${height}?`,
    options, correctAnswer,
    explanation: `Area = (base × height) / 2 = (${base} × ${height}) / 2 = ${correct}.`,
  };
}

function hardVolumeCube(): Partial<Question> {
  const s = rand(3, 12);
  const correct = s ** 3;
  const { options, correctAnswer } = buildOptions(correct, [s ** 2 * 6 - correct, s ** 2 - correct, (s + 1) ** 3 - correct]);
  return {
    text: `What is the volume of a cube with side length ${s}?`,
    options, correctAnswer,
    explanation: `Volume = s³ = ${s}³ = ${correct}.`,
  };
}

function hardSequence(): Partial<Question> {
  const types = [
    () => { const a = rand(2, 10), d = rand(2, 8); const seq = [a, a+d, a+2*d, a+3*d]; return { seq, next: a+4*d, rule: `arithmetic (+ ${d} each time)` }; },
    () => { const a = rand(2, 5), r = rand(2, 3); const seq = [a, a*r, a*r**2, a*r**3]; return { seq, next: a*r**4, rule: `geometric (× ${r} each time)` }; },
    () => { const a = rand(1, 5); const fib = [a, a+1, a*2+1, a*3+2]; return { seq: fib, next: fib[2]+fib[3], rule: "each term is the sum of the two before it" }; },
  ];
  const { seq, next, rule } = types[rand(0, types.length - 1)]();
  const { options, correctAnswer } = buildOptions(next, [next + seq[1] - seq[0], next - (seq[1] - seq[0]), next * 2]);
  return {
    text: `What is the next number in the sequence: ${seq.join(", ")}, ___?`,
    options, correctAnswer,
    explanation: `The rule is ${rule}. The next term is ${next}.`,
  };
}

function hardExponent(): Partial<Question> {
  const pairs: [number, number][] = [[2, 8], [2, 9], [2, 10], [3, 5], [3, 6], [4, 4], [4, 5], [5, 4], [5, 5], [6, 4], [7, 3], [8, 3], [9, 3], [10, 4]];
  const [base, exp] = pairs[rand(0, pairs.length - 1)];
  const correct = base ** exp;
  const { options, correctAnswer } = buildOptions(correct, [base ** (exp - 1) - correct, base ** (exp + 1) - correct, base * exp - correct]);
  return {
    text: `What is ${base}^${exp}?`,
    options, correctAnswer,
    explanation: `${base}^${exp} = ${Array(exp).fill(base).join(" × ")} = ${correct}.`,
  };
}

// ── Main export ───────────────────────────────────────────────────────────────

const GENERATORS: Record<Difficulty, Array<() => Partial<Question>>> = {
  easy:   [easyAddition, easySubtraction, easyMultiplication, easyFraction, easyPercentage],
  medium: [mediumSquare, mediumSqrt, mediumAlgebra, mediumAverage, mediumPercentage, easyMultiplication],
  hard:   [hardAlgebra, hardCubeRoot, hardTriangleArea, hardVolumeCube, hardSequence, hardExponent],
};

export function generateMathQuestion(difficulty: Difficulty): Question {
  const pool = GENERATORS[difficulty];
  const gen  = pool[rand(0, pool.length - 1)];
  const partial = gen();
  return {
    id: uuidv4(),
    category: "math",
    difficulty,
    text:          partial.text!,
    options:       partial.options!,
    correctAnswer: partial.correctAnswer!,
    explanation:   partial.explanation!,
  };
}
