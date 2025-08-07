# Arquitectura del Proyecto - Sistema de Microservicios

## Descripción General

Este proyecto implementa un sistema de microservicios para gestión de publicaciones académicas, construido con Node.js, TypeScript y NestJS. El sistema incluye servicios especializados, bases de datos distribuidas, y un completo stack de observabilidad.

## Estructura del Proyecto

```
Backend/
├── services/                    # Microservicios principales
│   ├── auth-service/           # Servicio de autenticación y autorización
│   ├── publications-service/   # Gestión de publicaciones
│   ├── catalog-service/        # Catálogo de recursos
│   ├── notifications-service/  # Sistema de notificaciones
│   ├── gateway-service/        # API Gateway
│   └── monitoring-service/     # Servicio de monitoreo

├── prometheus/                 # Configuración de monitoreo
├── grafana/                    # Dashboards y datasources
├── alertmanager/               # Gestión de alertas
├── loki/                       # Agregación de logs
├── promtail/                   # Recolección de logs
├── consul/                     # Configuración de Consul
└── scripts/                    # Scripts de automatización
```

## Microservicios

### 1. Auth Service
- **Propósito**: Gestión de autenticación y autorización
- **Tecnologías**: NestJS, Prisma, CockroachDB
- **Puerto**: Configurable
- **Base de Datos**: CockroachDB (auth_db)

### 2. Publications Service
- **Propósito**: Gestión completa de publicaciones académicas
- **Tecnologías**: NestJS, Prisma, CockroachDB
- **Puerto**: Configurable
- **Base de Datos**: CockroachDB (publications_db)

### 3. Catalog Service
- **Propósito**: Gestión del catálogo de recursos
- **Tecnologías**: NestJS, Prisma, CockroachDB
- **Puerto**: Configurable
- **Base de Datos**: CockroachDB (catalog_db)

### 4. Notifications Service
- **Propósito**: Sistema de notificaciones en tiempo real
- **Tecnologías**: NestJS, Prisma, CockroachDB
- **Puerto**: Configurable
- **Base de Datos**: CockroachDB (notifications_db)

### 5. Gateway Service
- **Propósito**: API Gateway para enrutamiento y balanceo de carga
- **Tecnologías**: NestJS
- **Puerto**: Configurable

### 6. Monitoring Service
- **Propósito**: Servicio interno de monitoreo
- **Tecnologías**: NestJS

## Service Discovery

### Consul (Docker Container)
- **Propósito**: Descubrimiento de servicios y configuración distribuida
- **Puerto**: 8500 (HTTP API), 8600 (DNS)
- **UI**: Disponible en http://localhost:8500
- **Nota**: Consul se ejecuta como contenedor Docker, no como servicio local

### Implementación en Microservicios
Cada microservicio incluye:

#### 1. **ConsulService** (`src/common/consul.service.ts`)
```typescript
// Registro automático del servicio
await this.consul.agent.service.register({
  id: this.serviceId,
  name: serviceName,
  address: serviceHost,
  port: servicePort,
  check: {
    name: `${serviceName}-health`,
    http: `http://${serviceHost}:${servicePort}/health`,
    interval: '10s',
    timeout: '5s',
  },
});
```

#### 2. **HealthModule** con @nestjs/terminus
```typescript
@Controller('health')
export class HealthController {
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.http.pingCheck('service-name', 'http://localhost:PORT/health'),
    ]);
  }
}
```

#### 3. **ConsulDiscoveryService** (Ejemplo en auth-service)
```typescript
// Descubrir otros servicios
async getServiceUrl(serviceName: string, path: string): Promise<string | null> {
  return this.consulService.getServiceUrl(serviceName, path);
}

// Llamar a otros servicios
async callService(serviceName: string, path: string): Promise<Response> {
  const serviceUrl = await this.consulService.getServiceUrl(serviceName, path);
  return fetch(serviceUrl, { /* options */ });
}
```

#### 4. **Variables de Entorno**
```env
CONSUL_HOST=consul
CONSUL_PORT=8500
SERVICE_HOST=service-name
SERVICE_NAME=service-name
PORT=3001
```

## Infraestructura de Base de Datos

### CockroachDB (Consolidada)
- **Propósito**: Base de datos única con múltiples esquemas
- **Instancia**: `cockroachdb` - Puerto 26257, UI en 8080
- **Base de datos**: `defaultdb` con esquemas:
  - `auth_schema` - Para Auth Service
  - `pub_schema` - Para Publications Service
  - `cat_schema` - Para Catalog Service
  - `notif_schema` - Para Notifications Service

### RabbitMQ
- **Propósito**: Message broker para comunicación asíncrona
- **Puerto**: 5672 (AMQP), 15672 (Management UI)
- **Credenciales**: admin/admin123



## Stack de Observabilidad

### Prometheus
- **Propósito**: Recolección y almacenamiento de métricas
- **Puerto**: 9090
- **Retención**: 30 días
- **Configuración**: `./prometheus/prometheus.yml`

### Grafana
- **Propósito**: Visualización de métricas y dashboards
- **Puerto**: 3000
- **Credenciales**: admin/admin123
- **Plugins**: grafana-clock-panel, grafana-simple-json-datasource

### Loki
- **Propósito**: Agregación de logs
- **Puerto**: 3100
- **Configuración**: `./loki/loki-config.yml`

### Promtail
- **Propósito**: Recolección de logs de contenedores
- **Configuración**: `./promtail/promtail-config.yml`

### Jaeger
- **Propósito**: Distributed tracing
- **Puerto**: 16686 (UI), 14268 (HTTP collector), 6831/6832 (UDP agent)

### AlertManager
- **Propósito**: Gestión y envío de alertas
- **Puerto**: 9093
- **Configuración**: `./alertmanager/alertmanager.yml`

### Node Exporter
- **Propósito**: Métricas del sistema host
- **Puerto**: 9100

### cAdvisor
- **Propósito**: Métricas de contenedores
- **Puerto**: 8080

## Configuración Docker

### docker-compose.yml
```yaml
version: '3.8'

services:
  # 🐘 Base de datos única (con múltiples esquemas)
  cockroachdb:
    image: cockroachdb/cockroach:latest
    container_name: cockroachdb
    command: start-single-node --insecure --advertise-addr=cockroachdb
    ports:
      - "26257:26257"
      - "8080:8080"
    volumes:
      - cockroachdb_data:/cockroach/cockroach-data
    networks:
      - microservices-network

  # 📩 RabbitMQ
  rabbitmq:
    image: rabbitmq:3-management
    container_name: rabbitmq
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: admin123
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    networks:
      - microservices-network

  # 🔍 Consul
  consul:
    image: hashicorp/consul:latest
    container_name: consul
    ports:
      - "8500:8500"
      - "8600:8600/udp"
    command: agent -server -ui -node=consul-server -bootstrap-expect=1 -client=0.0.0.0
    volumes:
      - consul_data:/consul/data
    networks:
      - microservices-network

  # Microservicios con multi-stage builds
  auth-service:
    build:
      context: ./services/auth-service
      target: production
    container_name: auth-service
    ports:
      - "3001:3001"
    env_file:
      - ./services/auth-service/.env
    depends_on:
      - cockroachdb
      - rabbitmq
      - consul
    networks:
      - microservices-network

  publications-service:
    build:
      context: ./services/publications-service
      target: production
    container_name: publications-service
    ports:
      - "3002:3002"
    env_file:
      - ./services/publications-service/.env
    depends_on:
      - cockroachdb
      - rabbitmq
      - consul
    networks:
      - microservices-network

  catalog-service:
    build:
      context: ./services/catalog-service
      target: production
    container_name: catalog-service
    ports:
      - "3003:3003"
    env_file:
      - ./services/catalog-service/.env
    depends_on:
      - cockroachdb
      - rabbitmq
      - consul
    networks:
      - microservices-network

  notifications-service:
    build:
      context: ./services/notifications-service
      target: production
    container_name: notifications-service
    ports:
      - "3004:3004"
    env_file:
      - ./services/notifications-service/.env
    depends_on:
      - cockroachdb
      - rabbitmq
      - consul
    networks:
      - microservices-network

  gateway-service:
    build:
      context: ./services/gateway-service
      target: production
    container_name: gateway-service
    ports:
      - "8081:8080"
    env_file:
      - ./services/gateway-service/.env
    depends_on:
      - auth-service
      - publications-service
      - catalog-service
      - notifications-service
      - consul
    networks:
      - microservices-network

volumes:
  cockroachdb_data:
  rabbitmq_data:
  consul_data:

networks:
  microservices-network:
    driver: bridge
```

### Variables de Entorno por Servicio

#### auth-service/.env
```env
DATABASE_URL=postgresql://root@cockroachdb:26257/defaultdb?sslmode=disable&search_path=auth_schema
RABBITMQ_URL=amqp://admin:admin123@rabbitmq:5672
CONSUL_HOST=consul
PORT=3001
SERVICE_NAME=auth-service
```

#### publications-service/.env
```env
DATABASE_URL=postgresql://root@cockroachdb:26257/defaultdb?sslmode=disable&search_path=pub_schema
RABBITMQ_URL=amqp://admin:admin123@rabbitmq:5672
CONSUL_HOST=consul
PORT=3002
SERVICE_NAME=publications-service
```

#### catalog-service/.env
```env
DATABASE_URL=postgresql://root@cockroachdb:26257/defaultdb?sslmode=disable&search_path=cat_schema
RABBITMQ_URL=amqp://admin:admin123@rabbitmq:5672
CONSUL_HOST=consul
PORT=3003
SERVICE_NAME=catalog-service
```

#### notifications-service/.env
```env
DATABASE_URL=postgresql://root@cockroachdb:26257/defaultdb?sslmode=disable&search_path=notif_schema
RABBITMQ_URL=amqp://admin:admin123@rabbitmq:5672
CONSUL_HOST=consul
PORT=3004
SERVICE_NAME=notifications-service
```

#### gateway-service/.env
```env
CONSUL_HOST=consul
PORT=8080
SERVICE_NAME=gateway-service
```

### Dockerfiles Optimizados

Todos los microservicios utilizan Dockerfiles multi-stage para optimizar el tamaño de imagen y mejorar la seguridad:

#### Estructura Multi-Stage
```dockerfile
# Etapa 1: Build
FROM node:18-alpine AS builder
# Instalación de dependencias y compilación

# Etapa 2: Producción
FROM node:18-alpine AS production
# Solo archivos necesarios para runtime
```

#### Beneficios de Multi-Stage Builds
- **Imagen más ligera**: Solo incluye archivos necesarios para producción
- **Mayor seguridad**: No incluye código fuente ni herramientas de desarrollo
- **Mejor rendimiento**: Optimizado para runtime
- **Buenas prácticas CI/CD**: Separación clara entre build y runtime

### Scripts de Automatización

Los scripts están organizados por tipo:

#### Scripts de Desarrollo (Node.js/pnpm)
- Scripts para levantar servicios individuales en desarrollo
- Uso de `pnpm --filter` para ejecutar comandos en servicios específicos

#### Scripts de Instalación y Configuración (Bash)
- `scripts/install-all.sh` - Instalación de dependencias para todos los servicios
- `scripts/regenerate-prisma.sh` - Regeneración de cliente Prisma para todos los servicios
- `scripts/init-databases.sh` - Inicialización de esquemas de base de datos

#### Beneficios de esta Organización
- **Scripts de desarrollo**: Fáciles de usar con pnpm workspaces
- **Scripts de instalación**: Bash para tareas de sistema y configuración
- **Separación clara**: Desarrollo vs configuración
- **Mantenibilidad**: Cada tipo de script en su tecnología apropiada

## Comunicación entre Servicios

### Patrones de Comunicación
1. **Síncrona**: HTTP/REST a través del API Gateway
2. **Asíncrona**: RabbitMQ para eventos y mensajes
3. **Service Discovery**: Consul para descubrimiento dinámico

### Flujo de Datos
1. Cliente → API Gateway
2. API Gateway → Microservicio específico
3. Microservicios ↔ RabbitMQ (eventos)
4. Microservicios ↔ CockroachDB (persistencia)

## Monitoreo y Observabilidad

### Métricas
- **Prometheus**: Recolección de métricas de aplicación y sistema
- **Node Exporter**: Métricas del host
- **cAdvisor**: Métricas de contenedores

### Logs
- **Loki**: Agregación centralizada de logs
- **Promtail**: Recolección de logs de contenedores

### Trazabilidad
- **Jaeger**: Distributed tracing para seguimiento de requests

### Alertas
- **AlertManager**: Gestión y envío de alertas
- **Prometheus**: Evaluación de reglas de alerta

## Gestión de Configuración

### Variables de Entorno
- Cada servicio tiene su archivo `env.example`
- Configuración específica por entorno
- Credenciales y URLs de servicios

### Service Discovery
- **Consul**: Registro y descubrimiento automático
- **Health Checks**: Verificación de estado de servicios
- **Key-Value Store**: Configuración distribuida

## Escalabilidad y Alta Disponibilidad

### Estrategias
1. **Horizontal Scaling**: Múltiples instancias por servicio
2. **Load Balancing**: A través del API Gateway
3. **Database Sharding**: CockroachDB distribuida
4. **Message Queue**: RabbitMQ para desacoplamiento

### Persistencia
- **Persistencia**: Configurada por servicio
- **Backup Strategy**: Configurado por servicio
- **Data Replication**: CockroachDB nativo

## Seguridad

### Autenticación
- JWT tokens en Auth Service
- Validación centralizada en Gateway

### Autorización
- Roles y permisos por servicio
- Middleware de autorización

### Network Security
- Red aislada `microservices-network`
- Puertos específicos expuestos
- Health checks para validación

## Scripts de Automatización

### Scripts Principales
- `setup.sh`: Configuración inicial del proyecto
- `dev-start.sh`: Inicio del entorno de desarrollo
- `start-dev-simple.sh`: Inicio simplificado
- `regenerate-prisma.sh`: Regeneración de esquemas Prisma
- `init-databases.sh`: Inicialización de bases de datos

### Comandos NPM
- `npm run setup`: Configuración completa
- `npm run dev`: Desarrollo con todos los servicios
- `npm run dev:simple`: Desarrollo simplificado
### Scripts de Desarrollo
- `pnpm run dev:infra` - Iniciar servicios de infraestructura (RabbitMQ, CockroachDB, Consul)
- `pnpm run dev:auth` - Iniciar auth service en modo desarrollo
- `pnpm run dev:publications` - Iniciar publications service en modo desarrollo
- `pnpm run dev:catalog` - Iniciar catalog service en modo desarrollo
- `pnpm run dev:notifications` - Iniciar notifications service en modo desarrollo
- `pnpm run dev:gateway` - Iniciar gateway service en modo desarrollo

### Scripts de Instalación (Bash)
- `pnpm run install:all` - Instalar dependencias de todos los servicios
- `pnpm run prisma:regenerate` - Regenerar Prisma client para todos los servicios
- `pnpm run docker:init-db` - Inicializar esquemas de base de datos

### Scripts de Docker
- `pnpm run docker:up` - Levantar todos los servicios con Docker
- `pnpm run docker:down` - Detener todos los servicios
- `pnpm run docker:build` - Construir imágenes de Docker
- `pnpm run docker:logs` - Ver logs de todos los servicios
- `pnpm run docker:init-db` - Inicializar esquemas de base de datos
- `npm run install:all`: Instalar dependencias de todos los servicios

## Tecnologías Utilizadas

### Backend
- **Node.js**: Runtime de JavaScript
- **TypeScript**: Tipado estático
- **NestJS**: Framework para microservicios
- **Prisma**: ORM para bases de datos

### Bases de Datos
- **CockroachDB**: Base de datos distribuida
- **RabbitMQ**: Message broker

### Observabilidad
- **Prometheus**: Métricas
- **Grafana**: Visualización
- **Loki**: Logs
- **Jaeger**: Tracing
- **AlertManager**: Alertas

### Infraestructura
- **Docker**: Contenedores
- **Docker Compose**: Orquestación
- **Consul**: Service discovery
- **pnpm**: Gestor de paquetes

## Puertos Utilizados

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| RabbitMQ | 5672 | AMQP |
| RabbitMQ UI | 15672 | Management Interface |
| CockroachDB | 26257 | SQL |
| CockroachDB UI | 8080 | Admin Interface |
| Consul | 8500 | HTTP API |
| Consul DNS | 8600 | DNS |
| Auth Service | 3001 | API |
| Publications Service | 3002 | API |
| Catalog Service | 3003 | API |
| Notifications Service | 3004 | API |
| Gateway Service | 8081 | API Gateway | 