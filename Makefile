.PHONY: build build-backend build-frontend up down logs restart ps

build:
	@echo "📦 Building Docker images..."
	@docker-compose build

build-backend:
	@echo "📦 Building backend Docker image..."
	@docker-compose build backend

build-frontend:
	@echo "📦 Building frontend Docker image..."
	@docker-compose build frontend

up:
	@echo "🚀 Starting services..."
	@docker-compose up

down:
	@echo "🛑 Stopping services..."
	@docker-compose down

logs:
	@echo "📄 Attaching logs..."
	@docker-compose logs -f

restart:
	@echo "🔁 Restarting services..."
	@docker-compose down
	@docker-compose up

ps:
	@docker-compose ps
