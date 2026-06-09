#!/bin/bash
# 1. Run: fly redis create  (follow prompts, copy the URL)
# 2. Replace the URL below and run: bash scripts/set-redis-secret.sh

REDIS_URL="rediss://default:<password>@<host>.upstash.io:6379"
fly secrets set REDIS_URL="$REDIS_URL" --app quizblast-backend
echo "Done — REDIS_URL set on quizblast-backend"
