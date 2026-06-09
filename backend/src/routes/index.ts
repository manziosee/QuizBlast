import { Router } from "express";
import { getRoomByCode } from "../services/RoomService";
import { generateQRCode } from "../services/QRService";
import { env } from "../config/env";

const router = Router();

router.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

router.get("/rooms/:code", async (req, res) => {
  try {
    const room = await getRoomByCode(req.params.code.toUpperCase());
    if (!room) return res.status(404).json({ error: "Room not found" });

    const joinUrl = `${env.CLIENT_URL}/join/${room.code}`;
    const qrCodeBase64 = await generateQRCode(joinUrl);

    res.json({ code: room.code, status: room.status, playerCount: room.players.length, joinUrl, qrCodeBase64 });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
