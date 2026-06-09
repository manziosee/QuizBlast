export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "QuizBlast API",
    version: "1.0.0",
    description: "REST + WebSocket API for QuizBlast — real-time multiplayer quiz game.\n\n**WebSocket events** are handled via Socket.io at the root URL.\n\n**Socket.io events (Client → Server):**\n- `room:create` — host creates a room\n- `room:join` — player joins with name + avatar\n- `room:set-category` — host sets category mode\n- `room:start` — host starts the game\n- `game:submit-answer` — player submits answer\n\n**Socket.io events (Server → Client):**\n- `room:updated` — room state changed\n- `room:locked` — game started, no new joins\n- `player:joined` / `player:left`\n- `game:question` — new question for all players\n- `game:question-result` — correct answer revealed\n- `game:ended` — final rankings",
    contact: { name: "Osee Manzi", url: "https://github.com/manziosee/QuizBlast" },
  },
  servers: [
    { url: "https://quizblast-backend.fly.dev", description: "Production (Fly.io)" },
    { url: "http://localhost:4000", description: "Local development" },
  ],
  tags: [
    { name: "Health", description: "Service health and dependency status" },
    { name: "Rooms", description: "Game room lookup and player info" },
    { name: "Categories", description: "Question categories" },
    { name: "Questions", description: "Question bank" },
  ],
  paths: {
    "/health": {
      get: {
        summary: "Root health check",
        description: "Used by Fly.io machine health checks",
        tags: ["Health"],
        responses: {
          200: {
            description: "Server is running",
            content: { "application/json": { example: { status: "ok", timestamp: "2024-01-01T00:00:00.000Z" } } },
          },
        },
      },
    },
    "/api/health": {
      get: {
        summary: "Detailed health check",
        description: "Returns status of all backing services (database + Redis)",
        tags: ["Health"],
        responses: {
          200: {
            description: "Health status",
            content: {
              "application/json": {
                example: {
                  status: "ok",
                  timestamp: "2024-01-01T00:00:00.000Z",
                  services: { database: "ok", redis: "ok" },
                },
              },
            },
          },
        },
      },
    },
    "/api/rooms/{code}": {
      get: {
        summary: "Get room by code",
        description: "Returns room state, player count, join URL and QR code",
        tags: ["Rooms"],
        parameters: [{ name: "code", in: "path", required: true, schema: { type: "string", example: "XK9Q2" } }],
        responses: {
          200: {
            description: "Room found",
            content: {
              "application/json": {
                example: {
                  code: "XK9Q2", status: "waiting", playerCount: 3,
                  categoryMode: "group", category: "math",
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
    "/api/rooms/{code}/players": {
      get: {
        summary: "List players in a room",
        tags: ["Rooms"],
        parameters: [{ name: "code", in: "path", required: true, schema: { type: "string", example: "XK9Q2" } }],
        responses: {
          200: {
            description: "Player list",
            content: {
              "application/json": {
                example: {
                  code: "XK9Q2", playerCount: 2,
                  players: [{ id: "socket_id", name: "Peter", avatar: "naruto", score: 200, isConnected: true }],
                },
              },
            },
          },
          404: { description: "Room not found" },
        },
      },
    },
    "/api/categories": {
      get: {
        summary: "List all categories",
        description: "Returns all question categories with their question counts",
        tags: ["Categories"],
        responses: {
          200: {
            description: "Categories list",
            content: {
              "application/json": {
                example: [
                  { id: 1, name: "math", label: "Mathematics", questionCount: 10 },
                  { id: 2, name: "science", label: "Science", questionCount: 10 },
                  { id: 3, name: "history", label: "History", questionCount: 10 },
                  { id: 4, name: "geography", label: "Geography", questionCount: 10 },
                  { id: 5, name: "common", label: "General Knowledge", questionCount: 10 },
                ],
              },
            },
          },
        },
      },
    },
    "/api/questions": {
      get: {
        summary: "List questions",
        description: "Fetch questions with optional filters. Max 50 per request.",
        tags: ["Questions"],
        parameters: [
          { name: "category", in: "query", schema: { type: "string", enum: ["math", "science", "history", "geography", "common"] } },
          { name: "difficulty", in: "query", schema: { type: "string", enum: ["easy", "medium", "hard"] } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10, maximum: 50 } },
        ],
        responses: {
          200: {
            description: "Questions list",
            content: {
              "application/json": {
                example: [{
                  id: "uuid", category: "math", difficulty: "easy",
                  text: "What is 12 × 12?",
                  options: { A: "132", B: "144", C: "124", D: "148" },
                  correctAnswer: "B", explanation: "12 × 12 = 144.",
                }],
              },
            },
          },
        },
      },
    },
    "/api/questions/count": {
      get: {
        summary: "Question counts",
        description: "Total questions broken down by category and difficulty",
        tags: ["Questions"],
        responses: {
          200: {
            description: "Question counts",
            content: {
              "application/json": {
                example: {
                  total: 50,
                  byCategory: [{ category: "math", count: 10 }],
                  byDifficulty: [{ difficulty: "easy", count: 15 }, { difficulty: "medium", count: 15 }, { difficulty: "hard", count: 20 }],
                },
              },
            },
          },
        },
      },
    },
  },
};
