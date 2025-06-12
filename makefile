.PHONY: up down logs build prisma-generate prisma-migrate server-install server-start prisma-studio format

up:
	cd docker && docker-compose up --build -d

down:
	cd docker && docker-compose down
restart: 
	make down || true
	cd docker && docker network rm docker_default || true
	make up
server-install:
	cd server && npm install

clean:
	docker builder prune -f
	
prisma-generate:
	cd server && npx prisma generate

prisma-migrate:
	cd server && npx prisma migrate dev --name init

prisma-studio:
	cd server && npx prisma studio

server-start:
	cd server && node server.js

format:
	cd server && npx prettier --write .
