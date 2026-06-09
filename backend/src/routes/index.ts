import { Router } from "express";
import { createRoom, getRoomByCode, deleteRoom } from "../services/RoomService";
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

// Create a room via HTTP (for testing without socket)
router.post("/rooms", async (req, res) => {
  try {
    const hostId = req.body?.hostId ?? "http-host";
    const room = await createRoom(hostId);
    const joinUrl = `${env.CLIENT_URL}/join/${room.code}`;
    const qrCodeBase64 = await generateQRCode(joinUrl);
    res.status(201).json({ code: room.code, id: room.id, joinUrl, qrCodeBase64, status: room.status });
  } catch {
    res.status(500).json({ error: "Failed to create room" });
  }
});

router.get("/rooms/:code", async (req, res) => {
  try {
    const room = await getRoomByCode(req.params.code.toUpperCase());
    if (!room) return res.status(404).json({ error: "Room not found" });

    const joinUrl = `${env.CLIENT_URL}/join/${room.code}`;
    const qrCodeBase64 = await generateQRCode(joinUrl);
    res.json({
      code: room.code, status: room.status,
      playerCount: room.players.length,
      categoryMode: room.categoryMode, category: room.category,
      joinUrl, qrCodeBase64,
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
        id: p.id, name: p.name, avatar: p.avatar,
        score: p.score, isConnected: p.isConnected,
      })),
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/rooms/:code", async (req, res) => {
  try {
    const room = await getRoomByCode(req.params.code.toUpperCase());
    if (!room) return res.status(404).json({ error: "Room not found" });
    await deleteRoom(room);
    res.json({ message: `Room ${req.params.code.toUpperCase()} deleted` });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Categories ────────────────────────────────────────────────────────────────

router.get("/categories", async (_req, res) => {
  try {
    const cats = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { questions: true } } },
    });
    res.json(cats.map((c) => ({ id: c.id, name: c.name, label: c.label, questionCount: c._count.questions })));
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Questions ─────────────────────────────────────────────────────────────────

router.get("/questions/count", async (_req, res) => {
  try {
    const [total, byCategory, byDifficulty] = await Promise.all([
      prisma.question.count(),
      prisma.question.groupBy({ by: ["categoryId"], _count: true, orderBy: { categoryId: "asc" } }),
      prisma.question.groupBy({ by: ["difficulty"], _count: true }),
    ]);
    const cats = await prisma.category.findMany();
    const catMap = Object.fromEntries(cats.map((c) => [c.id, c.name]));
    res.json({
      total,
      byCategory: byCategory.map((r) => ({ category: catMap[r.categoryId], count: r._count })),
      byDifficulty: byDifficulty.map((r) => ({ difficulty: r.difficulty, count: r._count })),
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/questions", async (req, res) => {
  try {
    const {
      category, difficulty,
      limit  = "20",
      cursor,          // last id for cursor-based pagination
    } = req.query as Record<string, string>;

    const take = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);

    const where: Record<string, any> = {};
    if (category) {
      const cat = await prisma.category.findUnique({ where: { name: category } });
      if (!cat) return res.status(404).json({ error: `Category '${category}' not found` });
      where.categoryId = cat.id;
    }
    if (difficulty) where.difficulty = difficulty;

    const questions = await prisma.question.findMany({
      where,
      take: take + 1, // fetch one extra to know if there's a next page
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { category: true },
      orderBy: { createdAt: "asc" },
    });

    const hasNext = questions.length > take;
    const data = questions.slice(0, take);

    res.json({
      data: data.map((q) => ({
        id: q.id, category: q.category.name, difficulty: q.difficulty,
        text: q.text,
        options: { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD },
        correctAnswer: q.correctAnswer, explanation: q.explanation,
      })),
      pagination: {
        limit: take,
        hasNext,
        nextCursor: hasNext ? data[data.length - 1].id : null,
      },
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
