FROM node:20-alpine AS builder
WORKDIR /app

# Prisma needs openssl on alpine
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci
RUN npx prisma generate

COPY . .
RUN npm run build

# ── runner ────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Prisma engine needs openssl at runtime too
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma    ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma    ./node_modules/@prisma
COPY prisma ./prisma

EXPOSE 4000
CMD ["node", "dist/index.js"]
