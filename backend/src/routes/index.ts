import { Router } from "express";
import { getRoomByCode } from "../services/RoomService";
import { generateQRCode } from "../services/QRService";
import { prisma } from "../config/database";
import { redis } from "../config/redis";
import { env } from "../config/env";

const router = Router();

// ── Health ────────────────────────────────────────────────────────────────────

router.get("/health", async (_req, res) => {
  const [dbOk, redisOk] = await Promise.all([
    prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
    redis.ping().then(() => true).catch(() => false),
  ]);
  res.json({
    status: dbOk && redisOk ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    services: { database: dbOk ? "ok" : "down", redis: redisOk ? "ok" : "down" },
  });
});

// ── Rooms ─────────────────────────────────────────────────────────────────────

router.get("/rooms/:code", async (req, res) => {
  try {
    const room = await getRoomByCode(req.params.code.toUpperCase());
    if (!room) return res.status(404).json({ error: "Room not found" });

    const joinUrl = `${env.CLIENT_URL}/join/${room.code}`;
    const qrCodeBase64 = await generateQRCode(joinUrl);

    res.json({
      code: room.code,
      status: room.status,
      playerCount: room.players.length,
      categoryMode: room.categoryMode,
      category: room.category,
      joinUrl,
      qrCodeBase64,
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/rooms/:code/players", async (req, res) => {
  try {
    const room = await getRoomByCode(req.params.code.toUpperCase());
    if (!room) return res.status(404).json({ error: "Room not found" });

    res.json({
      code: room.code,
      playerCount: room.players.length,
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        score: p.score,
        isConnected: p.isConnected,
      })),
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Categories ────────────────────────────────────────────────────────────────

router.get("/categories", async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { questions: true } } },
    });
    res.json(categories.map((c) => ({
      id: c.id,
      name: c.name,
      label: c.label,
      questionCount: c._count.questions,
    })));
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Questions ─────────────────────────────────────────────────────────────────

router.get("/questions", async (req, res) => {
  try {
    const { category, difficulty, limit = "10" } = req.query as Record<string, string>;

    const where: Record<string, any> = {};
    if (category) {
      const cat = await prisma.category.findUnique({ where: { name: category } });
      if (!cat) return res.status(404).json({ error: `Category '${category}' not found` });
      where.categoryId = cat.id;
    }
    if (difficulty) where.difficulty = difficulty;

    const questions = await prisma.question.findMany({
      where,
      take: Math.min(parseInt(limit, 10), 50),
      include: { category: true },
      orderBy: { createdAt: "asc" },
    });

    res.json(questions.map((q) => ({
      id: q.id,
      category: q.category.name,
      difficulty: q.difficulty,
      text: q.text,
      options: { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD },
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
    })));
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/questions/count", async (_req, res) => {
  try {
    const [total, byCategory, byDifficulty] = await Promise.all([
      prisma.question.count(),
      prisma.question.groupBy({ by: ["categoryId"], _count: true,
        orderBy: { categoryId: "asc" } }),
      prisma.question.groupBy({ by: ["difficulty"], _count: true }),
    ]);

    const categories = await prisma.category.findMany();
    const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

    res.json({
      total,
      byCategory: byCategory.map((r) => ({ category: catMap[r.categoryId], count: r._count })),
      byDifficulty: byDifficulty.map((r) => ({ difficulty: r.difficulty, count: r._count })),
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
