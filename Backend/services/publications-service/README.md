<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

# Publications Service

Microservicio de gestión de publicaciones académicas construido con NestJS, Prisma ORM y CockroachDB.

## 🚀 Características

- **Gestión completa de publicaciones**: Artículos y libros académicos
- **Máquina de estados**: Transiciones controladas entre estados (DRAFT → IN_REVIEW → APPROVED → PUBLISHED)
- **Patrón Outbox**: Garantía de entrega de eventos con persistencia
- **Autenticación JWT**: Protección de endpoints
- **Documentación Swagger**: API documentada automáticamente
- **Registro en Consul**: Integración con service discovery
- **Health checks**: Monitoreo de salud del servicio
- **Validación robusta**: DTOs con class-validator
- **Logging estructurado**: Interceptores para logging y correlación

## 📋 Prerrequisitos

- Node.js 18+
- Docker y Docker Compose
- CockroachDB (o PostgreSQL)
- RabbitMQ (opcional, para eventos)

## 🛠️ Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd publications-service
```

2. **Instalar dependencias**
```bash
pnpm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:
```env
# Application
PORT=3002
API_PREFIX=api/v1
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:26257/publications?sslmode=disable

# User Info (for development)
USER_INFO_HEADER=x-user-info

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_EXCHANGE=publications

# Consul
CONSUL_HOST=localhost
CONSUL_PORT=8500
CONSUL_SERVICE_NAME=publications-service
CONSUL_SERVICE_ID=publications-service-1
```

4. **Configurar la base de datos**
```bash
# Generar el cliente de Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev

# (Opcional) Sembrar datos de prueba
npx prisma db seed
```

5. **Ejecutar el servicio**
```bash
# Desarrollo
pnpm run start:dev

# Producción
pnpm run build
pnpm start
```

## 📚 API Endpoints

### Publicaciones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/v1/publications` | Crear nueva publicación (borrador) |
| `GET` | `/api/v1/publications` | Listar publicaciones con filtros |
| `GET` | `/api/v1/publications/:id` | Obtener publicación por ID |
| `PUT` | `/api/v1/publications/:id` | Actualizar publicación (solo DRAFT) |
| `POST` | `/api/v1/publications/:id/submit-for-review` | Enviar para revisión |
| `PUT` | `/api/v1/publications/:id/approve` | Aprobar publicación |
| `PUT` | `/api/v1/publications/:id/publish` | Publicar |
| `PUT` | `/api/v1/publications/:id/withdraw` | Retirar publicación |
| `GET` | `/api/v1/publications/:id/history` | Historial de eventos |

### Health & Metrics

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/health` | Health check |
| `GET` | `/api/v1/metrics` | Métricas del servicio |

### Documentación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/docs` | Documentación Swagger |

## 🔐 Autenticación

Este microservicio está diseñado para funcionar detrás de un API Gateway. La autenticación se maneja de la siguiente manera:

### Para desarrollo local:
El servicio espera información del usuario en el header `x-user-info` (JSON string):
```
x-user-info: {"sub": "user-id", "email": "user@example.com", "roles": ["author"]}
```

### Para producción con API Gateway:
El gateway valida el JWT y pasa la información del usuario en headers:
```
x-user-info: {"sub": "user-id", "email": "user@example.com", "roles": ["author"]}
```

## 📊 Estados de Publicación

```
DRAFT → IN_REVIEW → CHANGES_REQUESTED → IN_REVIEW → APPROVED → PUBLISHED
                                    ↓
                                WITHDRAWN
```

## 🎯 Ejemplos de Uso

### Crear una publicación

```bash
curl -X POST http://localhost:3002/api/v1/publications \
  -H "x-user-info: {\"sub\": \"user-uuid\", \"email\": \"user@example.com\", \"roles\": [\"author\"]}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Nuevo Paradigma en Machine Learning",
    "abstract": "Este artículo presenta un nuevo enfoque...",
    "keywords": ["machine learning", "AI", "paradigm"],
    "primaryAuthorId": "user-uuid",
    "coAuthorIds": ["co-author-uuid"],
    "type": "ARTICLE",
    "article": {
      "targetJournal": "Journal of AI Research",
      "section": "Machine Learning",
      "bibliographicReferences": ["Ref1", "Ref2"],
      "figureCount": 5,
      "tableCount": 2
    }
  }'
```

### Enviar para revisión

```bash
curl -X POST http://localhost:3002/api/v1/publications/{id}/submit-for-review \
  -H "x-user-info: {\"sub\": \"user-uuid\", \"email\": \"user@example.com\", \"roles\": [\"author\"]}"
```

### Aprobar publicación

```bash
curl -X PUT http://localhost:3002/api/v1/publications/{id}/approve \
  -H "x-user-info: {\"sub\": \"user-uuid\", \"email\": \"user@example.com\", \"roles\": [\"editor\"]}"
```

## 🏗️ Arquitectura

```
src/
├── config/           # Configuraciones
├── common/           # Utilidades comunes
│   ├── filters/     # Filtros de excepción
│   ├── interceptors/ # Interceptores
│   └── middleware/  # Middleware
├── database/         # Configuración de base de datos
├── events/           # Servicio de eventos (Outbox)
├── publications/     # Módulo principal
│   ├── controllers/ # Controladores
│   ├── services/    # Lógica de negocio
│   └── dto/         # Data Transfer Objects
├── health/          # Health checks
├── metrics/         # Métricas
└── consul/          # Service discovery
```

## 🔄 Patrón Outbox

El servicio implementa el patrón Outbox para garantizar la entrega de eventos:

1. **Persistencia**: Los eventos se guardan en la base de datos
2. **Procesamiento**: Un cron job procesa eventos pendientes cada 30 segundos
3. **Reintentos**: Hasta 3 intentos antes de marcar como fallido
4. **Idempotencia**: Los eventos son procesados de forma segura

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests e2e
npm run test:e2e

# Coverage
npm run test:cov
```

## 🚀 Despliegue

El servicio puede ser desplegado en cualquier plataforma que soporte Node.js:

- **Heroku**: Deploy directo desde Git
- **AWS**: ECS, Lambda, o EC2
- **Google Cloud**: Cloud Run o Compute Engine
- **Azure**: App Service o Container Instances
- **DigitalOcean**: App Platform o Droplets

## 📈 Monitoreo

- **Health checks**: `/api/v1/health`
- **Métricas**: `/api/v1/metrics`
- **Logs**: Estructurados con correlación de IDs
- **Consul**: Service discovery y health checks

## 🤝 Contribución

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.
