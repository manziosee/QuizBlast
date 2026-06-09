.PHONY: install dev migrate seed stop

install:
	cd backend && npm install
	cd frontend && npm install

dev:
	cd backend && npm run dev &
	cd frontend && npm run dev

migrate:
	cd backend && npx prisma migrate dev

seed:
	cd backend && npm run db:seed

db-studio:
	cd backend && npx prisma studio

stop:
	pkill -f "ts-node-dev" || true
	pkill -f "next dev" || true
