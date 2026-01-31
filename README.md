# Flow Backend - Afronix Technologies

![CI/CD Status](https://github.com/afronix-technologies/flow_backend/actions/workflows/continuous-integration.yml/badge.svg)
![Production](https://github.com/afronix-technologies/flow_backend/actions/workflows/deploy-production.yml/badge.svg)

> A scalable, modular business tracking system API built with NestJS

## 🏗 Architecture

- **Framework**: NestJS 10 (Microservices Architecture)
- **Database**: PostgreSQL + TypeORM
- **Caching**: Redis
- **Load Balancer**: Nginx
- **Docs**: Swagger (Auto-generated)
- **Containerization**: Docker + Docker Compose

## 🌳 Branching Strategy

```
main (production) ← PR with approval ← develop (staging) ← feature/* branches
```

- **`main`** - Production environment (https://api.flow.afronix.com)
- **`develop`** - Staging environment (https://api.staging.flow.afronix.com)
- **`feature/*`** - Feature development branches

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (External or Local)

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/afronix-technologies/flow_backend.git
cd flow_backend

# 2. Install dependencies
npm install

# 3. Set up environment
chmod +x scripts/setup-env.sh
./scripts/setup-env.sh

# 4. Run with Docker
npm run docker:dev

# Or run services individually
npm run start:auth:dev
npm run start:notification:dev
npm run start:job:dev
```

### Development Workflow

```bash
# 1. Create feature branch
git checkout develop
git pull origin develop
git checkout -b feature/your-feature

# 2. Make changes and test
npm run test
npm run lint
npm run format

# 3. Push and create PR to develop
git push origin feature/your-feature
```

## 🚢 Deployment

**Staging:** Automatically deploys when code is merged to `develop`  
**Production:** Requires manual approval after merging to `main`

See [📖 Deployment Guide](./docs/DEPLOYMENT.md) for detailed instructions.

## 📚 API Documentation

Access the centralized API portal by opening [`api-portal.html`](./api-portal.html) in your browser, or visit services directly:

- **Auth Service**: http://localhost:3001/api/docs
- **Notification Service**: http://localhost:3002/api/docs
- **Job Service**: http://localhost:3003/api/docs

## 📁 Project Structure

```
apps/
├── auth-service/         # Authentication & user management
├── notification-service/ # Email & notification handling
└── job-service/          # Background job processing

scripts/
├── health-check.sh       # Service health verification
├── backup-database.sh    # Database backup automation
├── rollback.sh          # Deployment rollback
└── setup-vps.sh         # VPS infrastructure setup

.github/workflows/
├── continuous-integration.yml  # CI checks
├── deploy-staging.yml         # Staging deployment
└── deploy-production.yml      # Production deployment
```

## 🔧 Available Scripts

```bash
npm run build              # Build all services
npm run start:dev          # Start in development mode
npm run test               # Run tests
npm run lint               # Run ESLint
npm run format             # Format code with Prettier
npm run docker:dev         # Run with Docker (development)
npm run docker:prod        # Run with Docker (production)
```

## 🛡️ Security

- JWT-based authentication
- Rate limiting with Throttler
- Helmet.js security headers
- SSL/TLS encryption in production
- Database connection encryption

## 📦 Deployment Environments

| Environment | URL | Status |
|------------|-----|--------|
| **Production** | https://api.flow.afronix.com | ![Production](https://img.shields.io/badge/status-live-success) |
| **Staging** | https://api.staging.flow.afronix.com | ![Staging](https://img.shields.io/badge/status-live-success) |

## 🤝 Contributing

1. Create a feature branch from `develop`
2. Make your changes
3. Ensure tests pass: `npm run test`
4. Create a Pull Request to `develop`
5. Wait for CI checks and code review

## 📄 License

UNLICENSED - © 2024 Afronix Technologies

## 🆘 Support

- **Documentation**: [Deployment Guide](./docs/DEPLOYMENT.md)
- **Issues**: [GitHub Issues](https://github.com/afronix-technologies/flow_backend/issues)

---

**Built with ❤️ by Afronix Technologies**
