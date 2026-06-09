# Deployment Guide

## Backend → Fly.io

### Prerequisites
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Log in
fly auth login
```

### 1. Create the app
```bash
cd backend
fly apps create quizblast-backend
```

### 2. Provision a Postgres database
```bash
fly postgres create --name quizblast-db --region jnb
fly postgres attach quizblast-db --app quizblast-backend
# Fly automatically sets DATABASE_URL as a secret
```

### 3. Provision Redis (Upstash via Fly extensions)
```bash
fly ext upstash redis create --name quizblast-redis --region jnb --app quizblast-backend
# Fly automatically sets REDIS_URL as a secret
```

### 4. Set remaining secrets
```bash
fly secrets set \
  NODE_ENV="production" \
  CLIENT_URL="https://your-app.vercel.app" \
  --app quizblast-backend
```

### 5. Deploy
```bash
fly deploy
# This builds the Docker image, runs `prisma migrate deploy` via release_command,
# then starts the server.
```

### 6. Seed the database (first deploy only)
```bash
fly ssh console --app quizblast-backend
# Inside the container:
node -e "require('./dist/prisma-migrate.js')"   # already ran migrations
# To seed, you need to run it locally pointing at the Fly DB:
# fly proxy 5432 -a quizblast-db  (in another terminal)
# DATABASE_URL="postgresql://..." npm run db:seed
```

### Useful commands
```bash
fly logs --app quizblast-backend          # tail logs
fly status --app quizblast-backend        # instance health
fly secrets list --app quizblast-backend  # list secrets (values hidden)
fly deploy --app quizblast-backend        # redeploy after code changes
```

---

## Frontend → Vercel

### Prerequisites
```bash
npm i -g vercel
vercel login
```

### 1. Set environment variables on Vercel
In the Vercel dashboard → your project → Settings → Environment Variables, add:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_BACKEND_URL` | `https://quizblast-backend.fly.dev` |
| `NEXT_PUBLIC_SOCKET_URL`  | `https://quizblast-backend.fly.dev` |
| `NEXT_PUBLIC_SERVER_URL`  | `https://quizblast-backend.fly.dev` |

### 2. Deploy via CLI
```bash
cd frontend
vercel --prod
```

Or connect your GitHub repo in the Vercel dashboard and it auto-deploys on every push to `main`.

### Vercel project settings
- Framework: **Next.js** (auto-detected)
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `.next`

---

## After both are deployed

Update the backend `CLIENT_URL` secret to your Vercel URL so CORS works:
```bash
fly secrets set CLIENT_URL="https://your-app.vercel.app" --app quizblast-backend
```

Update the frontend `NEXT_PUBLIC_BACKEND_URL` on Vercel to your Fly app URL:
```
https://quizblast-backend.fly.dev
```

---

## Full redeploy flow (after code changes)

```bash
# Backend
cd backend && fly deploy

# Frontend  
cd frontend && vercel --prod
```
