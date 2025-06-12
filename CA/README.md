# Secure Certificate Authority Web Application

A self-hosted Certificate Authority (CA) web application that issues and manages X.509 certificates. Built with TypeScript, React, Django, and PostgreSQL, all containerized with Docker.

## Features

- Upload and sign public keys/CSRs
- View and manage issued certificates
- Secure certificate revocation
- JWT-based authentication
- Encrypted storage of certificates and metadata
- Docker-based deployment

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.9+ (for local development)

## Project Structure

```
.
├── frontend/           # React + TypeScript frontend
├── backend/           # Django backend
├── docker/           # Docker configuration files
├── scripts/          # Utility scripts
└── docker-compose.yml
```

## Quick Start

1. Clone the repository
2. Copy `.env.example` to `.env` and configure your environment variables
3. Run the development environment:
   ```bash
   docker-compose up --build
   ```
4. Access the application at `https://localhost:3000`

## Security Features

- CA private key stored securely in Docker volumes
- All API routes authenticated
- HTTPS enforced
- Certificate data encrypted at rest
- Comprehensive audit logging

## Development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
python manage.py runserver
```

## License

MIT 