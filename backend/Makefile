# Career Pilot — backend dev commands
# Run `make help` to list targets.

# Uses whatever python3 is on PATH (system, conda, or an activated venv).
# Override with: make start PYTHON=/path/to/python
PYTHON  ?= python3
UVICORN := $(PYTHON) -m uvicorn
ALEMBIC := $(PYTHON) -m alembic

.DEFAULT_GOAL := help

.PHONY: help start start-prod migrate migration install

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

start: ## Run the FastAPI backend with hot reload (foreground)
	$(UVICORN) app.main:app --host 0.0.0.0 --port 8000 --reload

start-prod: ## Run the FastAPI backend for production: make start-prod [PORT=8000] [WORKERS=2]
	$(UVICORN) app.main:app --host 0.0.0.0 --port $(or $(PORT),8000) --workers $(or $(WORKERS),2)

migrate: ## Apply database migrations
	$(ALEMBIC) upgrade head

migration: ## Create a new migration: make migration m="add foo table"
	$(ALEMBIC) revision --autogenerate -m "$(m)"

install: ## Install/refresh backend dependencies
	$(PYTHON) -m pip install -r requirements.txt
