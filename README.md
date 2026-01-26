# Flow with Afronix Backend

A scalable, modular business tracking system API built with NestJS.

## 🏗 Architecture
- **Framework**: NestJS 10 (Modular Monolith)
- **Database**: PostgreSQL + TypeORM
- **Caching**: Redis
- **Load Balancer**: Nginx
- **Docs**: Swagger (Auto-generated)
- **Containerization**: Docker + Docker Compose

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (External or Local)

### Installation
1. Clone the repository
2. Run setup script:
   ```bash
   chmod +x scripts/setup-env.sh
   ./scripts/setup-env.sh
   ```

### Running the App
- **Development (Docker)**: `npm run docker:dev`
- **Production (Docker)**: `npm run docker:prod`
- **Manual**: Run `npm run start:auth`, `npm run start:notification`, etc.

### Push to Remote I named it flow_backend
- **git remote add flow_backend https://github.com/afronix-technologies/flow_backend.git**

## 📚 Documentation
Access the centralized API portal by opening `api-portal.html` in your browser, or visit services directly:
- **Auth Service**: `http://localhost:3001/api/docs`
- **Notification Service**: `http://localhost:3002/api/docs`
- **Job Service**: `http://localhost:3003/api/docs`
