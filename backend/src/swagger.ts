export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "QuizBlast API",
    version: "1.0.0",
    description: "REST API for QuizBlast — real-time multiplayer quiz game",
  },
  servers: [
    { url: "https://quizblast-backend.fly.dev", description: "Production" },
    { url: "http://localhost:4000", description: "Local dev" },
  ],
  paths: {
    "/health": {
      get: {
        summary: "Root health check",
        tags: ["Health"],
        responses: {
          200: {
            description: "Server is up",
            content: {
              "application/json": {
                example: { status: "ok", timestamp: "2024-01-01T00:00:00.000Z" },
              },
            },
          },
        },
      },
    },
    "/api/health": {
      get: {
        summary: "API health check",
        tags: ["Health"],
        responses: {
          200: {
            description: "API is up",
            content: {
              "application/json": {
                example: { status: "ok", timestamp: "2024-01-01T00:00:00.000Z" },
              },
            },
          },
        },
      },
    },
    "/api/rooms/{code}": {
      get: {
        summary: "Get room info by code",
        tags: ["Rooms"],
        parameters: [
          {
            name: "code",
            in: "path",
            required: true,
            schema: { type: "string", example: "XK9Q2" },
          },
        ],
        responses: {
          200: {
            description: "Room found",
            content: {
              "application/json": {
                example: {
                  code: "XK9Q2",
                  status: "waiting",
                  playerCount: 3,
                  joinUrl: "https://quiz-blast-iota.vercel.app/join/XK9Q2",
                  qrCodeBase64: "data:image/png;base64,...",
                },
              },
            },
          },
          404: { description: "Room not found" },
        },
      },
    },
  },
  tags: [
    { name: "Health", description: "Health check endpoints" },
    { name: "Rooms", description: "Room management" },
  ],
};
