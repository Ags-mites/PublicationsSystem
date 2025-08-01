# Guía de Desarrollo - Publications Service

## 🚀 Configuración Rápida

### 1. Instalar dependencias
```bash
pnpm install
```

### 2. Configurar base de datos
```bash
# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev --name init
```

### 3. Variables de entorno
Crear archivo `.env`:
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

### 4. Ejecutar el servicio
```bash
pnpm run start:dev
```

## 🧪 Testing del Servicio

### Crear una publicación
```bash
curl -X POST http://localhost:3002/api/v1/publications \
  -H "x-user-info: {\"sub\": \"user-123\", \"email\": \"author@example.com\", \"roles\": [\"author\"]}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Nuevo Paradigma en Machine Learning",
    "abstract": "Este artículo presenta un nuevo enfoque para el aprendizaje automático que revoluciona la forma en que procesamos datos.",
    "keywords": ["machine learning", "AI", "paradigm", "data processing"],
    "primaryAuthorId": "user-123",
    "coAuthorIds": ["user-456"],
    "type": "ARTICLE",
    "article": {
      "targetJournal": "Journal of AI Research",
      "section": "Machine Learning",
      "bibliographicReferences": [
        "Smith, J. (2023). Advances in ML. AI Journal, 15(2), 45-67.",
        "Doe, A. (2023). New Paradigms. ML Review, 8(1), 12-34."
      ],
      "figureCount": 5,
      "tableCount": 2
    }
  }'
```

### Listar publicaciones
```bash
curl -X GET "http://localhost:3002/api/v1/publications?page=1&limit=10" \
  -H "x-user-info: {\"sub\": \"user-123\", \"email\": \"author@example.com\", \"roles\": [\"author\"]}"
```

### Obtener publicación específica
```bash
curl -X GET "http://localhost:3002/api/v1/publications/{publication-id}" \
  -H "x-user-info: {\"sub\": \"user-123\", \"email\": \"author@example.com\", \"roles\": [\"author\"]}"
```

### Enviar para revisión
```bash
curl -X POST "http://localhost:3002/api/v1/publications/{publication-id}/submit-for-review" \
  -H "x-user-info: {\"sub\": \"user-123\", \"email\": \"author@example.com\", \"roles\": [\"author\"]}"
```

### Aprobar publicación (como editor)
```bash
curl -X PUT "http://localhost:3002/api/v1/publications/{publication-id}/approve" \
  -H "x-user-info: {\"sub\": \"editor-123\", \"email\": \"editor@example.com\", \"roles\": [\"editor\"]}"
```

### Publicar (como editor)
```bash
curl -X PUT "http://localhost:3002/api/v1/publications/{publication-id}/publish" \
  -H "x-user-info: {\"sub\": \"editor-123\", \"email\": \"editor@example.com\", \"roles\": [\"editor\"]}"
```

### Ver historial de eventos
```bash
curl -X GET "http://localhost:3002/api/v1/publications/{publication-id}/history" \
  -H "x-user-info: {\"sub\": \"user-123\", \"email\": \"author@example.com\", \"roles\": [\"author\"]}"
```

## 🔍 Health Checks

### Verificar salud del servicio
```bash
curl -X GET http://localhost:3002/api/v1/health
```

### Ver métricas
```bash
curl -X GET http://localhost:3002/api/v1/metrics
```

## 📚 Documentación Swagger

Una vez que el servicio esté corriendo, visita:
```
http://localhost:3002/docs
```

## 🐛 Debugging

### Logs del servicio
Los logs se muestran en la consola con el siguiente formato:
```
[PublicationsService] POST /api/v1/publications 201 245ms
[PublicationsService] GET /api/v1/publications 200 12ms
```

### Base de datos
```bash
# Ver datos en la base de datos
npx prisma studio

# Ejecutar consultas SQL
npx prisma db execute --stdin
```

### Eventos Outbox
```bash
# Ver eventos pendientes
npx prisma db execute --stdin <<< "SELECT * FROM outbox_events WHERE status = 'PENDING';"
```

## 🧪 Testing

### Tests unitarios
```bash
pnpm run test
```

### Tests con coverage
```bash
pnpm run test:cov
```

### Tests e2e
```bash
pnpm run test:e2e
```

## 🔧 Troubleshooting

### Error de conexión a base de datos
- Verificar que CockroachDB esté corriendo
- Verificar la URL de conexión en `.env`
- Ejecutar `npx prisma db push` para sincronizar el schema

### Error de autenticación
- Verificar que el header `x-user-info` esté presente
- Verificar que el JSON en el header sea válido
- Ejemplo correcto: `{"sub": "user-123", "email": "user@example.com", "roles": ["author"]}`

### Error de validación
- Verificar que todos los campos requeridos estén presentes
- Verificar tipos de datos (strings, arrays, etc.)
- Revisar los logs para detalles específicos

## 📝 Notas de Desarrollo

### Estructura de User Info
El header `x-user-info` debe contener un JSON con:
```json
{
  "sub": "user-id",
  "email": "user@example.com", 
  "roles": ["author", "editor"]
}
```

### Estados de Publicación
- `DRAFT`: Solo el autor puede editar
- `IN_REVIEW`: Enviado para revisión
- `CHANGES_REQUESTED`: Requiere cambios
- `APPROVED`: Aprobado por editor
- `PUBLISHED`: Publicado
- `WITHDRAWN`: Retirado por autor

### Patrón Outbox
Los eventos se procesan cada 30 segundos automáticamente. Puedes verificar el estado en la tabla `outbox_events`. 