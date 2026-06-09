<div align="center">

# 🎮 QuizBlast

**Real-time multiplayer quiz game — like Kahoot, but yours.**

[![Backend Deploy](https://img.shields.io/badge/Backend-Fly.io-6333FF?style=for-the-badge&logo=fly&logoColor=white)](https://quizblast-backend.fly.dev)
[![Frontend Deploy](https://img.shields.io/badge/Frontend-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://quiz-blast-iota.vercel.app)
[![API Docs](https://img.shields.io/badge/API_Docs-Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](https://quizblast-backend.fly.dev/swagger)

</div>

---

## What It Does

One person hosts a room → gets a URL + QR code. Friends scan or type the URL → pick a nickname and cartoon avatar. Everyone picks a knowledge category (or the host picks for all). 10 questions, 60 seconds each, synced timer for all players. After each question → correct answer revealed. Game ends → animated podium with top 3 and full rankings.

---

## Live Links

| | URL |
|---|---|
| 🌐 Frontend | https://quiz-blast-iota.vercel.app |
| 🚀 Backend | https://quizblast-backend.fly.dev |
| 📖 API Docs | https://quizblast-backend.fly.dev/swagger |
| ❤️ Health | https://quizblast-backend.fly.dev/health |

---

## Tech Stack

<div align="center">

| Layer | Technology | |
|---|---|---|
| **Frontend** | Next.js 14 + TypeScript | ![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white) |
| **Styling** | Tailwind CSS | ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white) |
| **Animations** | Framer Motion | ![Framer](https://img.shields.io/badge/Framer_Motion-0055FF?style=flat&logo=framer&logoColor=white) |
| **State** | Zustand | ![Zustand](https://img.shields.io/badge/Zustand-443E38?style=flat&logo=react&logoColor=white) |
| **Real-time** | Socket.io | ![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat&logo=socketdotio&logoColor=white) |
| **Backend** | Node.js + Express | ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white) |
| **Database** | PostgreSQL via Prisma | ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white) |
| **Cache** | Redis (Upstash) | ![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white) |
| **API Docs** | Swagger UI | ![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=flat&logo=swagger&logoColor=black) |
| **Frontend Deploy** | Vercel | ![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white) |
| **Backend Deploy** | Fly.io | ![Fly.io](https://img.shields.io/badge/Fly.io-6333FF?style=flat&logo=fly&logoColor=white) |
| **CI/CD** | GitHub Actions | ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat&logo=githubactions&logoColor=white) |

</div>

---

## Project Structure

```
QuizBlast/
├── backend/                    ← Node.js + Express + Socket.io
│   ├── prisma/
│   │   ├── schema.prisma       ← DB schema (categories + questions)
│   │   ├── seed.ts             ← 50 seeded questions
│   │   └── migrations/
│   ├── src/
│   │   ├── config/             ← DB, Redis, env
│   │   ├── handlers/           ← Socket.io event handlers
│   │   ├── middleware/         ← CORS, error handling
│   │   ├── routes/             ← REST endpoints
│   │   ├── services/           ← Room, Game, Question, QR logic
│   │   ├── app.ts              ← Express app + Swagger
│   │   ├── socket.ts           ← Socket.io server
│   │   └── swagger.ts          ← OpenAPI spec
│   ├── Dockerfile
│   └── fly.toml
│
├── frontend/                   ← Next.js 14 app
│   ├── src/
│   │   ├── app/                ← Pages
│   │   │   ├── page.tsx        ← Landing
│   │   │   ├── host/           ← Host lobby
│   │   │   ├── join/[roomId]/  ← Player join
│   │   │   └── room/[roomId]/  ← Lobby, Game, Results
│   │   ├── components/         ← UI, game, lobby, results, avatar
│   │   ├── hooks/              ← useSocket, useTimer
│   │   ├── lib/                ← socket client, constants, mock engine
│   │   └── store/              ← Zustand game state
│   └── vercel.json
│
└── .github/
    └── workflows/
        └── backend-deploy.yml  ← CI/CD: type-check → migrate → deploy
```

---

## API Reference

Full interactive docs at **https://quizblast-backend.fly.dev/swagger**

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Root health (Fly.io probe) |
| `GET` | `/api/health` | Detailed health (DB + Redis status) |
| `GET` | `/api/rooms/:code` | Room info + QR code + join URL |
| `GET` | `/api/rooms/:code/players` | Players currently in a room |
| `GET` | `/api/categories` | All categories with question counts |
| `GET` | `/api/questions` | Questions (filter by category, difficulty, limit) |
| `GET` | `/api/questions/count` | Question counts by category and difficulty |

---

## Socket Events

| Event | Direction | Purpose |
|---|---|---|
| `room:create` | C → S | Host creates a new room |
| `room:join` | C → S | Player joins with name + avatar |
| `room:set-category` | C → S | Host sets category mode |
| `room:start` | C → S | Host starts the game |
| `game:submit-answer` | C → S | Player submits answer |
| `room:updated` | S → C | Broadcast updated room state |
| `player:joined` | S → C | New player joined |
| `player:left` | S → C | Player disconnected |
| `room:locked` | S → C | Game started, no more joins |
| `game:question` | S → C | New question sent to all players |
| `game:question-result` | S → C | Correct answer + who passed |
| `game:ended` | S → C | Game over, final rankings |

---

## Game Rules

- 10 questions per game
- 60 seconds per question (server-controlled timer)
- Questions: Easy (1–3) → Medium (4–6) → Hard (7–10)
- Each correct answer = 100 points
- No new players can join after host clicks Begin
- Podium shows 1st, 2nd, 3rd — everyone else ranked below

---

## Local Development

### Prerequisites
- Node.js 20+
- npm
- Docker (for Postgres + Redis)

### Setup

```bash
# 1. Clone
git clone https://github.com/manziosee/QuizBlast.git
cd QuizBlast

# 2. Start Postgres + Redis
docker compose up postgres redis -d

# 3. Backend
cd backend
cp .env.example .env        # fill in DATABASE_URL + REDIS_URL
npm install
npx prisma migrate dev
npm run db:seed
npm run dev                 # http://localhost:4000

# 4. Frontend (new terminal)
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                 # http://localhost:3000
```

---

## Deployment

### Backend → Fly.io (auto via CI/CD)

Push to `main` with changes in `backend/` → GitHub Actions:
1. Installs dependencies
2. Generates Prisma client
3. Runs `prisma migrate deploy`
4. Builds TypeScript
5. Deploys to Fly.io

**Required GitHub Secrets:**

| Secret | Description |
|---|---|
| `FLY_API_TOKEN` | `fly tokens create deploy -x 999999h --app quizblast-backend` |
| `DATABASE_URL` | Prisma Postgres pooled URL |
| `DIRECT_DATABASE_URL` | Same as DATABASE_URL |

### Frontend → Vercel

Connect repo in Vercel dashboard. Set root directory to `frontend`. Add env vars:
- `NEXT_PUBLIC_BACKEND_URL=https://quizblast-backend.fly.dev`

---

## Adding More Questions

Edit `backend/prisma/seed.ts` and add to the `questions` array:

```ts
{
  category: "math",       // math | science | history | geography | common
  difficulty: "medium",   // easy | medium | hard
  text: "Your question?",
  optionA: "A", optionB: "B", optionC: "C", optionD: "D",
  correctAnswer: "B",
  explanation: "Because...",
}
```

Then re-run: `npm run db:seed`

---

Built by **Osee Manzi** — Kigali, Rwanda 🇷🇼
