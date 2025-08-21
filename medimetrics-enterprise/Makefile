.PHONY: help init dev prod test clean

SHELL := /bin/bash
.DEFAULT_GOAL := help

# Colors for output
CYAN := \033[0;36m
GREEN := \033[0;32m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo -e "${CYAN}MediMetrics Enterprise - Make Commands${NC}"
	@echo -e "${CYAN}======================================${NC}"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "${GREEN}%-20s${NC} %s\n", $$1, $$2}'

init: ## Initialize the project (install deps, setup DB, seed data)
	@echo -e "${CYAN}Initializing MediMetrics...${NC}"
	@cp -n .env.example .env 2>/dev/null || true
	@docker compose up -d postgres redis minio
	@sleep 5
	@docker compose exec -T postgres psql -U postgres -c "CREATE DATABASE medimetrics;" 2>/dev/null || true
	@docker compose run --rm api pnpm install
	@docker compose run --rm api pnpm run migration:run
	@docker compose run --rm api pnpm run seed
	@docker compose run --rm web pnpm install
	@docker compose run --rm inference pip install -e .
	@./scripts/init-minio-buckets.sh
	@echo -e "${GREEN}✓ Initialization complete!${NC}"

dev: ## Start development environment
	@echo -e "${CYAN}Starting development environment...${NC}"
	@docker compose up --build

prod: ## Start production environment
	@echo -e "${CYAN}Starting production environment...${NC}"
	@docker compose --profile prod up -d --build

test: ## Run all tests
	@echo -e "${CYAN}Running tests...${NC}"
	@docker compose run --rm api pnpm test
	@docker compose run --rm web pnpm test
	@docker compose run --rm inference pytest
	@docker compose run --rm web pnpm test:e2e

test-unit: ## Run unit tests only
	@docker compose run --rm api pnpm test:unit
	@docker compose run --rm inference pytest tests/unit

test-integration: ## Run integration tests
	@docker compose run --rm api pnpm test:integration
	@docker compose run --rm inference pytest tests/integration

test-e2e: ## Run E2E tests
	@docker compose run --rm web pnpm test:e2e

test-load: ## Run load tests
	@docker compose run --rm k6 run /scripts/load-test.js

lint: ## Run linters
	@docker compose run --rm api pnpm lint
	@docker compose run --rm web pnpm lint
	@docker compose run --rm inference ruff check .

format: ## Format code
	@docker compose run --rm api pnpm format
	@docker compose run --rm web pnpm format
	@docker compose run --rm inference black .

db-migrate: ## Run database migrations
	@docker compose run --rm api pnpm run migration:run

db-rollback: ## Rollback database migration
	@docker compose run --rm api pnpm run migration:revert

db-seed: ## Seed database with demo data
	@docker compose run --rm api pnpm run seed

logs: ## Show logs for all services
	@docker compose logs -f

logs-api: ## Show API logs
	@docker compose logs -f api

logs-inference: ## Show inference service logs
	@docker compose logs -f inference worker

metrics: ## Open Grafana dashboard
	@open http://localhost:3001

api-docs: ## Open API documentation
	@open http://localhost:8000/swagger

clean: ## Clean up containers and volumes
	@echo -e "${RED}Cleaning up...${NC}"
	@docker compose down -v
	@rm -rf node_modules apps/*/node_modules packages/*/node_modules
	@rm -rf apps/inference/.venv
	@echo -e "${GREEN}✓ Cleanup complete${NC}"

backup: ## Backup database and S3 data
	@echo -e "${CYAN}Creating backup...${NC}"
	@mkdir -p backups
	@docker compose exec postgres pg_dump -U postgres medimetrics > backups/db_$(shell date +%Y%m%d_%H%M%S).sql
	@docker compose exec minio mc mirror --overwrite minio/medimetrics-raw backups/s3_raw_$(shell date +%Y%m%d_%H%M%S)
	@echo -e "${GREEN}✓ Backup complete${NC}"

restore: ## Restore from latest backup
	@echo -e "${CYAN}Restoring from backup...${NC}"
	@docker compose exec -T postgres psql -U postgres medimetrics < $(shell ls -t backups/db_*.sql | head -1)
	@echo -e "${GREEN}✓ Restore complete${NC}"

k8s-dev: ## Deploy to Kubernetes (dev)
	@kubectl apply -k k8s/overlays/dev

k8s-prod: ## Deploy to Kubernetes (prod)
	@kubectl apply -k k8s/overlays/prod

helm-install: ## Install Helm chart
	@helm install medimetrics ./charts/medimetrics --namespace medimetrics --create-namespace

helm-upgrade: ## Upgrade Helm release
	@helm upgrade medimetrics ./charts/medimetrics --namespace medimetrics

security-scan: ## Run security scans
	@docker compose run --rm trivy image medimetrics-api:latest
	@docker compose run --rm trivy image medimetrics-web:latest
	@docker compose run --rm trivy image medimetrics-inference:latest