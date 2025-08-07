# Notifications Service

Microservicio de notificaciones para el sistema de publicaciones académicas. Proporciona capacidades de notificación multi-canal (email, WebSocket, push) con procesamiento asíncrono de eventos.

## Características

- **Notificaciones Multi-canal**: Email, WebSocket, y notificaciones push
- **Procesamiento Asíncrono**: Colas de trabajo con Bull
- **Eventos en Tiempo Real**: WebSocket para notificaciones instantáneas
- **Templates Dinámicos**: Sistema de templates con Handlebars
- **Preferencias de Usuario**: Configuración personalizada por usuario
- **Métricas y Logging**: Monitoreo completo del servicio
- **Eventos RabbitMQ**: Publicación y consumo de eventos del sistema

## Tecnologías

- **Framework**: NestJS
- **Base de Datos**: CockroachDB con Prisma ORM
- **Mensajería**: RabbitMQ para eventos
- **Colas**: Bull para procesamiento asíncrono
- **WebSockets**: Socket.IO para tiempo real
- **Email**: Nodemailer con templates Handlebars

## Requisitos

- Node.js 18+
- Docker y Docker Compose
- CockroachDB CLI (opcional, para inicialización manual)

## Configuración

### 1. Variables de Entorno

Copia el archivo de ejemplo y configura las variables:

```bash
cp env.example .env
```

Edita `.env` con tus configuraciones:

```env
# Application
PORT=3004
API_PREFIX=api/v1
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://root@localhost:26257/notifications_db?sslmode=disable

# RabbitMQ
RABBITMQ_URL=amqp://admin:admin123@localhost:5672
RABBITMQ_QUEUE=notifications_queue
RABBITMQ_EXCHANGE=system_events

# Email (configure as needed)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 2. Instalar Dependencias

```bash
pnpm install
```

### 3. Verificar Servicios de Infraestructura

Asegúrate de que los siguientes servicios estén ejecutándose:
- **CockroachDB**: Base de datos en puerto 26260
- **RabbitMQ**: Mensajería en puerto 5672 (Management UI en 15672)

### 4. Inicializar Base de Datos

```bash
pnpm run init:db
pnpm run prisma:generate
pnpm run prisma:migrate
```

### 5. Ejecutar el Servicio

```bash
# Desarrollo
pnpm run start:dev

# Producción
pnpm run build
pnpm start
```

## Estructura del Proyecto

```
src/
├── config/           # Configuraciones
├── controllers/      # Controladores HTTP
├── dto/             # Data Transfer Objects
├── events/          # Consumidores de eventos
├── filters/         # Filtros de excepción
├── gateways/        # WebSocket gateways
├── interceptors/    # Interceptores
├── interfaces/      # Interfaces TypeScript
├── prisma/          # Configuración de Prisma
├── queues/          # Procesadores de colas
├── services/        # Lógica de negocio
└── templates/       # Templates de email
```

## API Endpoints

> **Nota de Arquitectura**: Este microservicio no maneja autenticación directamente. El API Gateway se encarga de validar tokens y pasar el `userId` validado en los headers o query params.

### Notificaciones
- `GET /api/v1/notifications?userId={userId}` - Listar notificaciones del usuario
- `GET /api/v1/notifications/unread-count?userId={userId}` - Contar notificaciones no leídas
- `PUT /api/v1/notifications/:id/read?userId={userId}` - Marcar como leída
- `PUT /api/v1/notifications/mark-all-read?userId={userId}` - Marcar todas como leídas
- `DELETE /api/v1/notifications/:id?userId={userId}` - Eliminar notificación
- `DELETE /api/v1/notifications/clear-all?userId={userId}` - Limpiar todas las leídas

### Preferencias
- `GET /api/v1/preferences?userId={userId}` - Obtener preferencias del usuario
- `PUT /api/v1/preferences?userId={userId}` - Actualizar preferencias del usuario

### Subscripciones
- `GET /api/v1/subscriptions?userId={userId}` - Listar subscripciones del usuario
- `POST /api/v1/subscriptions?userId={userId}` - Crear subscripción
- `DELETE /api/v1/subscriptions/:id?userId={userId}` - Eliminar subscripción

### Health Check
- `GET /api/v1/health` - Estado del servicio

### Admin Endpoints (Requieren Autenticación)
- `GET /api/v1/admin/notifications/stats` - Estadísticas de notificaciones (requiere `admin:notifications:read`)
- `DELETE /api/v1/admin/notifications/bulk` - Eliminar notificaciones en lote (requiere `admin:notifications:delete`)
- `POST /api/v1/admin/notifications/send-test` - Enviar notificación de prueba (requiere `admin:notifications:send`)

## Eventos RabbitMQ

El servicio publica y consume los siguientes eventos:

### Eventos Publicados
- `user.registered` - Usuario registrado
- `user.login` - Usuario conectado
- `publication.submitted` - Publicación enviada
- `publication.approved` - Publicación aprobada
- `publication.published` - Publicación publicada
- `publication.review.requested` - Revisión solicitada
- `publication.review.completed` - Revisión completada

### Uso del EventPublisherService

```typescript
import { EventPublisherService } from './services/event-publisher.service';

@Injectable()
export class YourService {
  constructor(private eventPublisher: EventPublisherService) {}

  async someMethod() {
    await this.eventPublisher.publishUserRegistered({
      userId: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      registeredAt: new Date().toISOString(),
    });
  }
}
```

## WebSocket

El servicio expone WebSocket en `/notifications` para notificaciones en tiempo real.

### Conexión
```javascript
const socket = io('http://localhost:3004/notifications');

socket.on('notification', (data) => {
  console.log('Nueva notificación:', data);
});
```

## Arquitectura de Autenticación

Este microservicio está diseñado para funcionar en una arquitectura de microservicios donde la autenticación se maneja de forma centralizada. El flujo es:

1. **API Gateway** recibe la petición con el token JWT
2. **API Gateway** redirige la petición al microservicio correspondiente
3. **Microservicio de Autenticación** valida el token y retorna el `userId` si es válido
4. **Microservicio de Notificaciones** recibe la petición con el `userId` ya validado
5. **Microservicio** procesa la petición sin necesidad de validar tokens

### Validación Opcional de Autenticación

El microservicio de notificaciones incluye un `AuthClientService` que permite:

- **Validación de tokens**: Cuando se necesita verificar autenticación
- **Verificación de permisos**: Para acciones que requieren permisos específicos
- **Consulta de información de usuario**: Para obtener datos del usuario autenticado

### Ventajas de esta Arquitectura:
- **Separación de responsabilidades**: Cada microservicio se enfoca en su dominio
- **Centralización de autenticación**: Solo el microservicio de auth valida tokens
- **Flexibilidad**: El microservicio puede validar cuando sea necesario
- **Simplicidad**: Los microservicios de negocio no manejan autenticación por defecto
- **Escalabilidad**: Fácil de escalar independientemente

### Headers Esperados:
El microservicio de autenticación debería pasar el `userId` en uno de estos formatos:
- Query parameter: `?userId=123`
- Header: `X-User-ID: 123`
- Context (si usas NestJS microservices)

### Validación de Tokens:
Cuando se necesita validar un token, el microservicio puede usar:
- Header: `Authorization: Bearer <token>`
- Header: `X-Auth-Token: <token>`
- Query: `?token=<token>`

## Monitoreo

### Health Check
```bash
curl http://localhost:3004/api/v1/health
```

### RabbitMQ Management
- URL: http://localhost:15672
- Usuario: admin
- Contraseña: admin123

### CockroachDB Admin
- URL: http://localhost:8081

## Desarrollo

### Scripts Disponibles

```bash
pnpm run start:dev      # Desarrollo con hot reload
pnpm run build          # Compilar para producción
pnpm run init:db        # Inicializar base de datos
pnpm run prisma:generate # Generar cliente Prisma
pnpm run prisma:migrate # Ejecutar migraciones
pnpm run prisma:seed    # Poblar datos de prueba
```

### Estructura de Base de Datos

El servicio utiliza las siguientes tablas principales:

- `notifications` - Notificaciones del sistema
- `notification_preferences` - Preferencias de usuario
- `notification_subscriptions` - Subscripciones a eventos
- `notification_templates` - Templates de notificación
- `notification_queue` - Cola de procesamiento
- `delivery_logs` - Logs de entrega

## Troubleshooting

### Problemas Comunes

1. **Error de conexión a CockroachDB**
   - Verificar que la base de datos esté ejecutándose en puerto 26260
   - Verificar la configuración de conexión en `.env`

2. **Error de conexión a RabbitMQ**
   - Verificar que RabbitMQ esté ejecutándose en puerto 5672
   - Verificar la configuración de conexión en `.env`

3. **Error de migración de Prisma**
   - Ejecutar: `npm run prisma:generate`
   - Verificar conexión a la base de datos

4. **WebSocket no funciona**
   - Verificar configuración de CORS en `.env`
   - Verificar que el puerto esté disponible

## Arquitectura del Sistema

### Flujo de Autenticación Correcto:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   API Gateway   │───▶│ Auth Service     │───▶│ Notifications      │
│                 │    │                  │    │ Service             │
│ - Entry point   │    │ - Validates JWT  │    │ - No auth needed   │
│ - Routes to MS  │    │ - Returns userId │    │ - Receives userId   │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
         │                       │                       │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │     RabbitMQ Events      │
                    │  - user.registered       │
                    │  - user.login           │
                    │  - publication.*         │
                    └───────────────────────────┘
```

### Responsabilidades por Servicio:

- **API Gateway**: Punto de entrada, routing, rate limiting
- **Auth Service**: Validación de JWT, gestión de usuarios
- **Notifications Service**: Gestión de notificaciones, eventos
- **RabbitMQ**: Mensajería entre servicios

## Contribución

1. Fork el proyecto
2. Crear una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Crear un Pull Request
