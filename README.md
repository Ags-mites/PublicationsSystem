# Academic Publications Management System

Sistema de gestión de publicaciones académicas construido con arquitectura de microservicios y frontend React.

## Estructura del Proyecto

```
├── Backend/                    # Microservicios backend
│   ├── services/              # Servicios individuales
│   │   ├── auth-service/      # Autenticación y usuarios
│   │   ├── publications-service/ # Gestión de publicaciones
│   │   ├── catalog-service/   # Catálogo público
│   │   ├── notifications-service/ # Notificaciones
│   │   └── gateway-service/   # API Gateway
│   └── API_DOCUMENTATION.md   # Documentación completa de la API
├── Frontend/                  # Aplicación React
│   ├── src/
│   │   ├── types/api.ts       # Tipos TypeScript para la API
│   │   └── config/api.ts      # Configuración de API
│   └── mock-data/             # Datos ficticios para desarrollo
│       ├── db.json            # Datos de ejemplo
│       ├── json-server.json   # Configuración json-server
│       └── middleware.js      # Middleware para simular API real
└── API_DOCUMENTATION.md       # Documentación de API en la raíz
```

## Documentación

### API Documentation
- **`API_DOCUMENTATION.md`** - Documentación completa de todos los endpoints de la API
- **`Backend/API_DOCUMENTATION.md`** - Documentación detallada del backend

### Tipos TypeScript
- **`Frontend/src/types/api.ts`** - Todas las interfaces y tipos para el frontend

## Desarrollo Frontend

### Configuración Inicial

1. **Instalar dependencias:**
```bash
cd Frontend
npm install
```

2. **Configurar variables de entorno:**
```bash
cp env.example .env
```

3. **Editar `.env` para usar mock server:**
```bash
VITE_USE_MOCK_SERVER=true
```

### Mock Server (json-server)

Para desarrollo sin el backend real, se incluye un servidor mock con datos ficticios.

#### Iniciar mock server:
```bash
# Solo mock server
npm run mock:server

# Mock server + frontend en desarrollo
npm run mock:dev
```

#### Datos de ejemplo incluidos:
- **5 usuarios** con diferentes roles (autor, editor, revisor, admin)
- **5 publicaciones** en diferentes estados (draft, in_review, approved, published)
- **5 notificaciones** de diferentes tipos
- **Historial de cambios** de publicaciones

### Configuración de API

El frontend incluye una configuración completa de API con:

- **Retry logic** automático
- **Error handling** centralizado
- **Type safety** completo
- **Mock server** integrado
- **WebSocket** support

```typescript
import { api, API_ENDPOINTS } from './config/api';
import { PublicationListItem } from './types/api';

// Ejemplo de uso
const publications = await api.get<PublicationListItem[]>(API_ENDPOINTS.PUBLICATIONS.LIST);
```

## Microservicios Backend

### Servicios Disponibles

1. **Auth Service** (`:3001`)
   - Autenticación JWT
   - Gestión de usuarios
   - Roles y permisos

2. **Publications Service** (`:3002`)
   - CRUD de publicaciones
   - Workflow de revisión
   - Gestión de versiones

3. **Catalog Service** (`:3003`)
   - Catálogo público
   - Búsqueda avanzada
   - Estadísticas

4. **Notifications Service** (`:3004`)
   - Notificaciones en tiempo real
   - WebSocket support
   - Múltiples canales

5. **Gateway Service** (`:3000`)
   - API Gateway
   - Rate limiting
   - Load balancing

### Iniciar Backend

```bash
cd Backend
docker-compose up -d
```

## Características del Sistema

### Frontend
- ✅ **React 19** con TypeScript
- ✅ **Tailwind CSS** para estilos
- ✅ **Redux Toolkit** para estado
- ✅ **Zod** para validación
- ✅ **Mock server** para desarrollo
- ✅ **Type safety** completo

### Backend
- ✅ **Microservicios** independientes
- ✅ **Docker** containerization
- ✅ **API Gateway** con rate limiting
- ✅ **WebSocket** para tiempo real
- ✅ **JWT** authentication
- ✅ **Observability** (Prometheus, Grafana)

### Mock Server
- ✅ **json-server** con configuración personalizada
- ✅ **Middleware** que simula comportamiento real
- ✅ **Datos ficticios** realistas
- ✅ **CORS** habilitado
- ✅ **Rate limiting** simulado
- ✅ **Error handling** simulado

## Scripts Útiles

### Frontend
```bash
# Desarrollo con mock server
npm run mock:dev

# Solo mock server
npm run mock:server

# Desarrollo normal
npm run dev

# Build
npm run build
```

### Backend
```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar servicios
docker-compose down
```

## Estructura de Datos

### Usuarios
- Roles: `ROLE_AUTHOR`, `ROLE_REVIEWER`, `ROLE_EDITOR`, `ROLE_ADMIN`
- Campos: perfil completo, ORCID, afiliación, biografía

### Publicaciones
- Tipos: `ARTICLE`, `BOOK`
- Estados: `DRAFT`, `IN_REVIEW`, `APPROVED`, `PUBLISHED`, `WITHDRAWN`
- Metadata específica por tipo

### Notificaciones
- Tipos: varios eventos del sistema
- Canales: `EMAIL`, `WEBSOCKET`, `PUSH`
- Estados: `PENDING`, `SENT`, `READ`, `FAILED`

## Desarrollo

### Agregar Nuevos Endpoints

1. **Actualizar documentación** en `API_DOCUMENTATION.md`
2. **Agregar tipos** en `Frontend/src/types/api.ts`
3. **Configurar endpoint** en `Frontend/src/config/api.ts`
4. **Agregar datos mock** en `Frontend/mock-data/db.json`

### Testing

El mock server incluye:
- **Errores aleatorios** (1% probabilidad)
- **Rate limiting** simulado
- **Delay de red** realista
- **Validación de headers**

### Debugging

```bash
# Ver configuración de API
console.log(ENV_INFO);

# Ver datos mock
curl http://localhost:3001/api/publications

# Verificar tipos
npm run build
```

## Contribución

1. **Fork** el repositorio
2. **Crear** rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. **Commit** cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. **Push** a la rama (`git push origin feature/nueva-funcionalidad`)
5. **Crear** Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles. 