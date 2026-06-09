# QuizBlast 🎮

A real-time multiplayer quiz game built for groups of friends or colleagues — like Kahoot, but yours.

---

## What It Does

- Host creates a game room → gets a unique URL + QR code
- Friends scan the QR or enter the URL → pick a nickname and cartoon avatar
- Everyone picks a knowledge category (Math, Science, History, Geography, General Knowledge)
- 10 questions, 60 seconds each, synced timer for all players
- After each question → correct answer revealed, PASS/FAIL shown
- Game ends → animated podium with the top 3, full rankings below

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 + TypeScript + Tailwind CSS + Framer Motion |
| Real-time | Socket.io (client + server) |
| Backend | Node.js + Express |
| Database | PostgreSQL via Prisma |
| Cache / Sessions | Redis |
| QR Code | `qrcode` npm package |
| Avatars | DiceBear API |
| Deployment | Docker + Fly.io |

---

## Project Structure

```
QuizBlast/
├── apps/
│   ├── web/                  ← Next.js frontend
│   │   └── src/
│   │       ├── app/          ← Pages (landing, host, join, room, game, results)
│   │       ├── components/   ← UI components
│   │       ├── hooks/        ← useSocket, useTimer
│   │       ├── lib/          ← socket client, constants, utils
│   │       └── store/        ← Zustand game state
│   │
│   └── server/               ← Node.js + Express backend
│       └── src/
│           ├── config/       ← DB, Redis, env
│           ├── handlers/     ← Socket.io event handlers
│           ├── middleware/   ← CORS, error handling
│           ├── routes/       ← REST endpoints
│           └── services/     ← Room, Game, Question, QR logic
│
└── packages/
    └── types/                ← Shared TypeScript types (player, room, question, events)
```

---

## Page Routes

| Route | Purpose |
|---|---|
| `/` | Landing page — funny intro + Start Game button |
| `/host?code=XXXX` | Host lobby — shows QR code, player list, Begin button |
| `/join/[roomCode]` | Player join — enter name + pick avatar |
| `/room/[roomId]` | Game lobby — category selection, waiting room |
| `/room/[roomId]/game` | Active game — questions, timer, answers |
| `/room/[roomId]/results` | Final podium + full rankings |

---

## Socket Events

| Event | Direction | Purpose |
|---|---|---|
| `room:create` | C → S | Host creates a new room |
| `room:join` | C → S | Player joins with name + avatar |
| `room:set-category` | C → S | Host picks category |
| `room:start` | C → S | Host starts the game |
| `game:submit-answer` | C → S | Player submits their answer |
| `room:updated` | S → C | Broadcast updated room state |
| `player:joined` | S → C | New player joined |
| `player:left` | S → C | Player disconnected |
| `room:locked` | S → C | Game started, no more joins |
| `game:question` | S → C | New question sent to all players |
| `game:question-result` | S → C | Correct answer + who passed |
| `game:ended` | S → C | Game over, final rankings |

---

## Getting Started

### 1. Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Docker + Docker Compose

### 2. Start the database and Redis

```bash
docker-compose up postgres redis -d
```

### 3. Install dependencies

```bash
pnpm install
```

### 4. Set up environment variables

```bash
# Backend
cp apps/server/.env.example apps/server/.env

# Frontend
cp apps/web/.env.local.example apps/web/.env.local
```

### 5. Run database migrations and seed questions

```bash
pnpm db:migrate
pnpm db:seed
```

### 6. Start both apps

```bash
pnpm dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000

---

## Run with Docker (full stack)

```bash
docker-compose up --build
```

All services (PostgreSQL, Redis, server, web) start together.

---

## Adding More Questions

Open `apps/server/prisma/seed.ts` and add more objects to the `questions` array. Each question needs:

```ts
{
  category: "math",       // math | science | history | geography | common
  difficulty: "medium",   // easy | medium | hard
  text: "Your question here?",
  optionA: "Answer A",
  optionB: "Answer B",
  optionC: "Answer C",
  optionD: "Answer D",
  correctAnswer: "B",     // A | B | C | D
  explanation: "Why B is correct...",
}
```

Then re-run:

```bash
pnpm db:seed
```

---

## Game Rules

- 10 questions per game
- 60 seconds per question
- Timer is server-controlled — same for all players simultaneously
- No new players can join after the host clicks Begin
- Questions go Easy (1–3) → Medium (4–6) → Hard (7–10)
- Each correct answer = 100 points
- Podium shows 1st, 2nd, 3rd — everyone else ranked below

---

Built by Osee — Kigali, Rwanda 🇷🇼
