# Publications Microservices

A comprehensive microservices architecture project built with NestJS for academic purposes.

## 🏗️ Project Structure

```
Backend/
├── services/
│   ├── auth-service/          # Authentication & Authorization (Port 3001)
│   ├── publications-service/  # Publications management (Port 3002)
│   ├── catalog-service/       # Catalog management (Port 3003)
│   ├── notifications-service/ # Notifications (Port 3004)
│   └── gateway-service/       # API Gateway (Port 3000)
├── consul-service/            # Service discovery (Port 8501)
├── docker-compose.yml         # Infrastructure orchestration
├── package.json              # Root workspace configuration
├── tsconfig.json            # Base TypeScript configuration
└── scripts/
    ├── setup.sh             # Project setup script
    └── dev-start.sh         # Development startup script
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker and Docker Compose

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Backend
   ```

2. **Run the setup script**
   ```bash
   pnpm run setup
   ```

3. **Start infrastructure services**
   ```bash
   pnpm run docker:up
   ```

4. **Start all microservices**
   ```bash
   pnpm run dev
   ```

## 🌐 Service Endpoints

### API Gateway (Main Entry Point)
- **URL**: http://localhost:3000
- **Documentation**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api/health

### Individual Services

#### Auth Service
- **URL**: http://localhost:3001
- **Documentation**: http://localhost:3001/api/docs
- **Endpoints**:
  - `GET /auth/hello` - Service status
  - `POST /auth/validate-token` - Token validation
  - `GET /auth/health` - Health check

#### Publications Service
- **URL**: http://localhost:3002
- **Documentation**: http://localhost:3002/api/docs
- **Endpoints**:
  - `GET /publications/hello` - Service status
  - `GET /publications/list` - List publications
  - `GET /publications/health` - Health check

#### Catalog Service
- **URL**: http://localhost:3003
- **Documentation**: http://localhost:3003/api/docs
- **Endpoints**:
  - `GET /catalog/hello` - Service status
  - `GET /catalog/search?query=<term>` - Search catalog
  - `GET /catalog/health` - Health check

#### Notifications Service
- **URL**: http://localhost:3004
- **Documentation**: http://localhost:3004/api/docs
- **Endpoints**:
  - `GET /notifications/hello` - Service status
  - `GET /notifications/recent` - Recent notifications
  - `GET /notifications/health` - Health check

## 🏗️ Infrastructure Services

### Consul (Service Discovery)
- **URL**: http://localhost:8500
- **API**: http://localhost:8500/v1/
- **Features**: Service registration, health checks, configuration

### RabbitMQ (Message Broker)
- **URL**: http://localhost:15672
- **Credentials**: admin/admin123
- **Features**: Message queuing, pub/sub patterns

### CockroachDB (Database)
- **URL**: http://localhost:8080
- **SQL Port**: 26257
- **Features**: Distributed SQL database

## 🔧 Development

### Available Scripts

```bash
# Setup project
pnpm run setup

# Start development environment
pnpm run dev

# Start infrastructure only
pnpm run docker:up

# Stop infrastructure
pnpm run docker:down

# Install all dependencies
pnpm run install:all
```

### Individual Service Development

Each service can be developed independently:

```bash
# Navigate to specific service
cd services/auth-service

# Start in development mode
pnpm run start:dev

# Start with debugging
pnpm run start:debug

# Build for production
pnpm run build
```

## 🧪 Testing the Setup

### 1. Check Gateway Status
```bash
curl http://localhost:3000/api
```

### 2. Test Service Discovery
```bash
curl http://localhost:3000/api/services
```

### 3. Test Individual Services
```bash
# Through Gateway
curl http://localhost:3000/api/auth/hello
curl http://localhost:3000/api/publications/list
curl http://localhost:3000/api/catalog/search?query=microservices

# Direct access
curl http://localhost:3001/auth/hello
curl http://localhost:3002/publications/hello
```

### 4. Check Consul Registration
```bash
curl http://localhost:8500/v1/catalog/services
```

## 📚 Architecture Patterns

### 1. **Microservices Architecture**
- **Scalability**: Each service can be scaled independently
- **Technology Diversity**: Different services can use different technologies
- **Fault Isolation**: Failure in one service doesn't bring down the entire system
- **Team Autonomy**: Different teams can own different services

### 2. **Service Discovery with Consul**
- **Dynamic Registration**: Services register themselves automatically
- **Health Checks**: Consul monitors service health
- **Load Balancing**: Multiple instances can be discovered and used
- **Configuration Management**: Centralized configuration storage

### 3. **API Gateway Pattern**
- **Single Entry Point**: All client requests go through the gateway
- **Cross-Cutting Concerns**: Authentication, rate limiting, logging
- **Service Aggregation**: Combine multiple service calls
- **Protocol Translation**: REST to different protocols

## 🚨 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Find process using port
   lsof -i :3001
   # Kill process
   kill -9 <PID>
   ```

2. **Consul Connection Failed**
   ```bash
   # Check if Consul is running
   curl http://localhost:8500/v1/status/leader
   # Restart Consul container
   docker-compose restart consul
   ```

3. **Service Not Registering**
   - Check Consul logs: `docker logs consul`
   - Verify network connectivity
   - Check service health endpoints

### Monitoring Commands

```bash
# Check all running services
docker-compose ps

# View service logs
docker-compose logs -f rabbitmq
docker-compose logs -f cockroachdb
docker-compose logs -f consul

# Check Consul services
curl http://localhost:8500/v1/catalog/services

# Check service health
curl http://localhost:3001/health
curl http://localhost:3002/health
```

## 📖 Learning Points

### 1. **Service Communication**
- **Synchronous**: HTTP/REST calls between services
- **Asynchronous**: Message queues for non-critical operations
- **Service Discovery**: Dynamic service location

### 2. **Data Management**
- **Database per Service**: Each service owns its data
- **Event Sourcing**: Track all changes as events
- **CQRS**: Separate read and write models

### 3. **Resilience Patterns**
- **Circuit Breaker**: Prevent cascade failures
- **Retry Logic**: Handle temporary failures
- **Fallback Mechanisms**: Graceful degradation

### 4. **Monitoring & Observability**
- **Health Checks**: Service availability monitoring
- **Distributed Tracing**: Track requests across services
- **Centralized Logging**: Aggregate logs from all services

## 🔮 Next Steps

1. **Add Database Integration**: Connect services to CockroachDB
2. **Implement Authentication**: Add JWT validation to services
3. **Message Queues**: Integrate RabbitMQ for async communication
4. **Error Handling**: Implement circuit breakers and retry logic
5. **Testing**: Add unit and integration tests
6. **Deployment**: Containerize services with Docker
7. **Monitoring**: Add Prometheus metrics and Grafana dashboards

## 📄 License

This project is created for academic purposes to demonstrate microservices architecture patterns. 