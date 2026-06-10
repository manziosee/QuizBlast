export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "QuizBlast API",
    version: "1.0.0",
    description: `REST + WebSocket API for QuizBlast — real-time multiplayer quiz game.

**WebSocket events** are handled via Socket.io at the root URL.

---

**Socket.io events (Client → Server):**
- \`room:create\` — host creates a room (callback returns RoomSummary)
- \`room:join\` — player joins with name + avatar (callback returns join result)
- \`room:set-category\` — host sets category mode (group/individual) and category
- \`room:start\` — host starts the game (triggers countdown → questions)
- \`room:kick\` — host removes a player from the waiting room
- \`player:set-category\` — player picks their category in individual mode
- \`game:submit-answer\` — player submits answer (A/B/C/D) for current question

**Socket.io events (Server → Client):**
- \`room:updated\` — full room state changed (players joined/left, category set, etc.)
- \`room:locked\` — game started, no new joins accepted
- \`player:joined\` — a new player joined the room
- \`player:left\` — a player left or was kicked
- \`game:question\` — new question broadcast (includes timerEndsAt + totalMs)
- \`game:question-result\` — correct answer revealed with per-player results
- \`game:leaderboard\` — live rankings after each question
- \`game:answer-count\` — how many players have answered the current question
- \`game:ended\` — game over, final rankings
- \`error\` — error message string (e.g. room not found, kicked, host disconnected)`,
    contact: { name: "Osee Manzi", url: "https://github.com/manziosee/QuizBlast" },
  },
  servers: [
    { url: "https://quizblast-backend.fly.dev", description: "Production (Fly.io)" },
    { url: "http://localhost:4000", description: "Local development" },
  ],
  tags: [
    { name: "Health",     description: "Service health and dependency status" },
    { name: "Rooms",      description: "Game room management and player info" },
    { name: "Categories", description: "Question categories" },
    { name: "Questions",  description: "Question bank with filtering and pagination" },
  ],
  components: {
    schemas: {
      Player: {
        type: "object",
        properties: {
          id:          { type: "string", description: "Socket ID" },
          name:        { type: "string", example: "Peter" },
          avatar:      { type: "string", example: "naruto" },
          score:       { type: "integer", example: 300 },
          isConnected: { type: "boolean" },
          category:    { type: "string", example: "math", description: "Set in individual category mode" },
        },
      },
      Room: {
        type: "object",
        properties: {
          id:                   { type: "string", format: "uuid" },
          code:                 { type: "string", example: "XK9Q2" },
          status:               { type: "string", enum: ["waiting", "category-select", "active", "ended"] },
          categoryMode:         { type: "string", enum: ["group", "individual"] },
          category:             { type: "string", nullable: true, example: "math" },
          playerCount:          { type: "integer" },
          joinUrl:              { type: "string", format: "uri" },
          qrCodeBase64:         { type: "string", description: "data:image/png;base64,..." },
        },
      },
      Question: {
        type: "object",
        properties: {
          id:            { type: "string", format: "uuid" },
          category:      { type: "string", enum: ["math", "science", "history", "geography", "common"] },
          difficulty:    { type: "string", enum: ["easy", "medium", "hard"] },
          text:          { type: "string", example: "What is 12 × 12?" },
          options:       {
            type: "object",
            properties: {
              A: { type: "string" }, B: { type: "string" },
              C: { type: "string" }, D: { type: "string" },
            },
          },
          correctAnswer: { type: "string", enum: ["A", "B", "C", "D"] },
          explanation:   { type: "string" },
        },
      },
      Error: {
        type: "object",
        properties: { error: { type: "string" } },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        summary: "Root health check",
        description: "Lightweight probe used by Fly.io machine health checks.",
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
        description: "Returns status of all backing services (PostgreSQL + Redis).",
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
    "/api/rooms": {
      post: {
        summary: "Create a room (HTTP)",
        description: "Creates a new game room via HTTP — useful for testing without a Socket.io client. In normal gameplay the host creates rooms via `socket.emit('room:create')`.",
        tags: ["Rooms"],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  hostId: { type: "string", description: "Arbitrary host identifier", example: "http-test-host" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Room created",
            content: {
              "application/json": {
                example: {
                  id: "3f2a1b4c-...", code: "XK9Q2",
                  status: "waiting",
                  joinUrl: "https://quiz-blast-iota.vercel.app/join/XK9Q2",
                  qrCodeBase64: "data:image/png;base64,...",
                },
              },
            },
          },
          500: { description: "Internal server error", content: { "application/json": { schema: { "$ref": "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/rooms/{code}": {
      get: {
        summary: "Get room by code",
        description: "Returns public room state, player count, join URL and QR code.",
        tags: ["Rooms"],
        parameters: [{ name: "code", in: "path", required: true, schema: { type: "string", example: "XK9Q2" }, description: "6-character room code (case-insensitive)" }],
        responses: {
          200: {
            description: "Room found",
            content: {
              "application/json": {
                schema: { "$ref": "#/components/schemas/Room" },
                example: {
                  code: "XK9Q2", status: "waiting", playerCount: 3,
                  categoryMode: "group", category: "math",
                  joinUrl: "https://quiz-blast-iota.vercel.app/join/XK9Q2",
                  qrCodeBase64: "data:image/png;base64,...",
                },
              },
            },
          },
          404: { description: "Room not found", content: { "application/json": { schema: { "$ref": "#/components/schemas/Error" } } } },
        },
      },
      delete: {
        summary: "Delete a room",
        description: "Permanently deletes a room and all its state from Redis. Use for cleanup or admin purposes.",
        tags: ["Rooms"],
        parameters: [{ name: "code", in: "path", required: true, schema: { type: "string", example: "XK9Q2" } }],
        responses: {
          200: {
            description: "Room deleted",
            content: { "application/json": { example: { message: "Room XK9Q2 deleted" } } },
          },
          404: { description: "Room not found", content: { "application/json": { schema: { "$ref": "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/rooms/{code}/players": {
      get: {
        summary: "List players in a room",
        description: "Returns the current player list with scores and connection state.",
        tags: ["Rooms"],
        parameters: [{ name: "code", in: "path", required: true, schema: { type: "string", example: "XK9Q2" } }],
        responses: {
          200: {
            description: "Player list",
            content: {
              "application/json": {
                example: {
                  code: "XK9Q2", playerCount: 2,
                  players: [
                    { id: "socket_id_1", name: "Peter", avatar: "naruto", score: 200, isConnected: true },
                    { id: "socket_id_2", name: "Kaka",  avatar: "luffy",  score: 100, isConnected: true },
                  ],
                },
              },
            },
          },
          404: { description: "Room not found", content: { "application/json": { schema: { "$ref": "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/categories": {
      get: {
        summary: "List all categories",
        description: "Returns all question categories with their total question counts.",
        tags: ["Categories"],
        responses: {
          200: {
            description: "Categories list",
            content: {
              "application/json": {
                example: [
                  { id: 1, name: "math",      label: "Mathematics",       questionCount: 10 },
                  { id: 2, name: "science",   label: "Science",           questionCount: 10 },
                  { id: 3, name: "history",   label: "History",           questionCount: 10 },
                  { id: 4, name: "geography", label: "Geography",         questionCount: 10 },
                  { id: 5, name: "common",    label: "General Knowledge", questionCount: 10 },
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
        description: "Fetch questions with optional filters. Supports cursor-based pagination. Max 50 per request.",
        tags: ["Questions"],
        parameters: [
          {
            name: "category", in: "query",
            schema: { type: "string", enum: ["math", "science", "history", "geography", "common"] },
            description: "Filter by category",
          },
          {
            name: "difficulty", in: "query",
            schema: { type: "string", enum: ["easy", "medium", "hard"] },
            description: "Filter by difficulty",
          },
          {
            name: "limit", in: "query",
            schema: { type: "integer", default: 20, minimum: 1, maximum: 50 },
            description: "Number of questions to return",
          },
          {
            name: "cursor", in: "query",
            schema: { type: "string" },
            description: "Last question ID from previous page for cursor-based pagination",
          },
        ],
        responses: {
          200: {
            description: "Paginated question list",
            content: {
              "application/json": {
                example: {
                  data: [{
                    id: "uuid-here", category: "math", difficulty: "easy",
                    text: "What is 12 × 12?",
                    options: { A: "132", B: "144", C: "124", D: "148" },
                    correctAnswer: "B",
                    explanation: "12 × 12 = 144. A perfect square.",
                  }],
                  pagination: {
                    limit: 20,
                    hasNext: true,
                    nextCursor: "uuid-of-last-item",
                  },
                },
              },
            },
          },
          404: { description: "Category not found", content: { "application/json": { schema: { "$ref": "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/questions/count": {
      get: {
        summary: "Question counts",
        description: "Total questions broken down by category and difficulty.",
        tags: ["Questions"],
        responses: {
          200: {
            description: "Question counts",
            content: {
              "application/json": {
                example: {
                  total: 50,
                  byCategory: [
                    { category: "math",      count: 10 },
                    { category: "science",   count: 10 },
                    { category: "history",   count: 10 },
                    { category: "geography", count: 10 },
                    { category: "common",    count: 10 },
                  ],
                  byDifficulty: [
                    { difficulty: "easy",   count: 15 },
                    { difficulty: "medium", count: 15 },
                    { difficulty: "hard",   count: 20 },
                  ],
                },
              },
            },
          },
        },
      },
    },
  },
};
