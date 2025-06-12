# Makefile for CA Docker Service

# Default help command
help:
	@echo "Usage: make <target> [USER=username]"
	@echo ""
	@echo "Available targets:"
	@echo "  build               Build the Docker image"
	@echo "  up                  Run the CA service interactively"
	@echo "  restart             Restart the CA service and clean Docker network"
	@echo "  clean               Remove dangling Docker builder cache"
	@echo "  init                Initialize the PKI directory structure"
	@echo "  generate-ca         Generate the CA private key and certificate"
	@echo "  generate-user       Generate a CSR for a user (requires USER=)"
	@echo "  sign-csr            Sign a user's CSR (requires USER=)"
	@echo "  revoke              Revoke a user's certificate (requires USER=)"
	@echo "  validate            Validate a user's certificate (requires USER=)"
	@echo "  sh                  Open an interactive shell in the container"
	@echo "  help                Show this help message"

up:
	docker-compose up --build
down:
	docker-compose down
restart:
	docker-compose down
	docker network rm ca_net || true
	make up

clean:
	docker builder prune -f

build:
	docker-compose build

init:
	docker-compose run --rm ca init

generate-ca:
	docker-compose run --rm ca generate-ca

generate-user:
	@if [ -z "$(USER)" ]; then \
		echo "Usage: make generate-user USER=username"; \
		exit 1; \
	fi
	docker-compose run --rm ca generate-user $(USER)

sign-csr:
	@if [ -z "$(USER)" ]; then \
		echo "Usage: make sign-csr USER=username"; \
		exit 1; \
	fi
	docker-compose run --rm ca sign-csr $(USER)

revoke:
	@if [ -z "$(USER)" ]; then \
		echo "Usage: make revoke USER=username"; \
		exit 1; \
	fi
	docker-compose run --rm ca revoke $(USER)

validate:
	@if [ -z "$(USER)" ]; then \
		echo "Usage: make validate USER=username"; \
		exit 1; \
	fi
	docker-compose run --rm ca validate $(USER)

sh:
	docker-compose run --rm ca bash

.PHONY: help down up restart clean build init generate-ca generate-user sign-csr revoke validate sh
