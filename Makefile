.PHONY: dev dev-backend dev-frontend docker-up docker-down seed test-backend test-frontend

docker-up:
	docker compose up -d

docker-down:
	docker compose down

dev-backend:
	cd backend && .venv/Scripts/python -m uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

seed:
	cd backend && .venv/Scripts/python -m scripts.seed_exercises

test-backend:
	cd backend && .venv/Scripts/python -m pytest

test-frontend:
	cd frontend && npm test
