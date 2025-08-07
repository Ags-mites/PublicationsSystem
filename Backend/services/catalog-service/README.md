# Catalog Service

Microservicio de catálogo para publicaciones académicas con búsqueda avanzada y suscripción a eventos.

## Características

- ✅ Suscripción a eventos RabbitMQ (`publication.published`, `publication.withdrawn`, etc.)
- ✅ Endpoints públicos sin autenticación
- ✅ Paginación en consultas
- ✅ Filtros avanzados: título, autor, palabras clave, ISBN, DOI, categorías
- ✅ Esquema `cat_schema` en CockroachDB
- ✅ Indexación para búsqueda rápida
- ✅ Seguridad y CORS manejados por API Gateway y Auth Service

## Configuración de Base de Datos

### CockroachDB

El servicio utiliza **CockroachDB** como base de datos distribuida. CockroachDB es compatible con el protocolo PostgreSQL, por lo que usa el driver `cockroachdb://` en la URL de conexión.

### Esquema cat_schema

El servicio utiliza el esquema `cat_schema` en CockroachDB. Para configurarlo:

1. **Crear el esquema**:
```sql
-- Ejecutar el script de migración
psql -h localhost -p 26257 -U catalog -d catalog_db -f prisma/migrate-schema.sql
```

2. **Configurar variables de entorno**:
```env
DATABASE_URL=postgresql://catalog:catalog@localhost:26257/catalog_db?sslmode=disable&search_path=cat_schema
```

3. **Ejecutar migraciones**:
```bash
npm run prisma:migrate
npm run prisma:generate
```

## Endpoints Públicos

### Búsqueda de Publicaciones
- `GET /api/v1/catalog/publications` - Búsqueda con filtros
- `GET /api/v1/catalog/publications/:id` - Obtener por ID
- `GET /api/v1/catalog/search` - Búsqueda avanzada (alias)

### Filtros Disponibles
- `q` - Búsqueda en título, abstract y palabras clave
- `type` - Tipo de publicación (ARTICLE, BOOK)
- `author` - Nombre del autor
- `category` - Categoría
- `isbn` - ISBN (coincidencia exacta)
- `doi` - DOI (coincidencia exacta)
- `yearFrom/yearTo` - Rango de años
- `page/limit` - Paginación

### Estadísticas
- `GET /api/v1/catalog/categories` - Categorías disponibles
- `GET /api/v1/catalog/statistics` - Estadísticas del catálogo

## Eventos RabbitMQ

El servicio consume los siguientes eventos:
- `publication.published` - Nueva publicación
- `publication.withdrawn` - Publicación retirada
- `publication.updated` - Publicación actualizada
- `author.created` - Nuevo autor
- `author.updated` - Autor actualizado

## Instalación y Ejecución

```bash
# 1. Configurar entorno
cp env.example .env
pnpm install

# 2. Configurar base de datos
pnpm run prisma:generate
pnpm run prisma:migrate

# 3. Ejecutar microservicio
pnpm run start:dev
```

### Comandos útiles
```bash
# Regenerar Prisma client
pnpm run prisma:generate

# Ejecutar migraciones
pnpm run prisma:migrate
```

## Accesos

- **Microservicio**: http://localhost:3003/api/v1
- **Documentación Swagger**: http://localhost:3003/docs
- **CockroachDB Web UI**: http://localhost:8080
- **RabbitMQ Management**: http://localhost:15672 (admin/admin) - Servicio global del backend

## Variables de Entorno

El microservicio requiere las siguientes variables mínimas:

```env
# Configuración del microservicio
NODE_ENV=development
PORT=3003
API_PREFIX=api/v1
SERVICE_NAME=catalog-service

# Base de datos CockroachDB
DATABASE_URL=postgresql://catalog:catalog@localhost:26257/catalog_db?sslmode=disable&search_path=cat_schema

# RabbitMQ global del backend
RABBITMQ_URL=amqp://admin:admin@localhost:5672
```

Ver archivo `env.example` para el formato completo.
