# Mock Data Server - Academic Publications Management System

Este directorio contiene datos ficticios y configuración para json-server que simula la API del sistema de gestión de publicaciones académicas.

## Estructura

```
mock-data/
├── db.json              # Datos ficticios principales
├── json-server.json     # Configuración de json-server
├── middleware.js        # Middleware para simular comportamiento de API real
└── README.md           # Este archivo
```

## Instalación

1. Instalar json-server globalmente:
```bash
npm install -g json-server
```

2. O instalar como dependencia de desarrollo en el proyecto:
```bash
cd Frontend
npm install --save-dev json-server
```

## Uso

### Iniciar el servidor mock

```bash
# Desde el directorio Frontend/mock-data
json-server --watch db.json --config json-server.json

# O usando npx
npx json-server --watch db.json --config json-server.json
```

El servidor se ejecutará en `http://localhost:3001`

### Endpoints disponibles

#### Auth Service
- `GET /api/auth/users` - Listar usuarios
- `GET /api/auth/profile` - Obtener perfil de usuario
- `POST /api/auth/login` - Simular login (devuelve token mock)
- `POST /api/auth/register` - Simular registro

#### Publications Service
- `GET /api/publications` - Listar publicaciones
- `GET /api/publications/:id` - Obtener publicación específica
- `POST /api/publications` - Crear nueva publicación
- `PUT /api/publications/:id` - Actualizar publicación
- `GET /api/publications/:id/history` - Historial de cambios

#### Catalog Service
- `GET /api/catalog/publications` - Publicaciones del catálogo
- `GET /api/catalog/publications/:id` - Detalle de publicación en catálogo
- `GET /api/catalog/categories` - Categorías disponibles
- `GET /api/catalog/statistics` - Estadísticas del catálogo

#### Notifications Service
- `GET /api/notifications` - Notificaciones del usuario
- `GET /api/notifications/unread-count` - Contador de no leídas
- `PUT /api/notifications/:id` - Marcar como leída/no leída
- `DELETE /api/notifications/:id` - Eliminar notificación

## Datos de ejemplo

### Usuarios
- **Dr. María González** (ROLE_AUTHOR, ROLE_EDITOR) - Especialista en IA
- **Prof. Carlos Rodríguez** (ROLE_AUTHOR, ROLE_REVIEWER) - Computación distribuida
- **Dra. Ana Martínez** (ROLE_AUTHOR) - Bioinformática
- **Dr. Luis Hernández** (ROLE_AUTHOR, ROLE_ADMIN) - Computación cuántica
- **Prof. Elena Sánchez** (ROLE_AUTHOR, ROLE_REVIEWER) - Estadística

### Publicaciones
1. **Avances en Machine Learning para Análisis de Datos Biomédicos** (PUBLISHED)
2. **Algoritmos Distribuidos para Procesamiento de Big Data** (IN_REVIEW)
3. **Bioinformática Computacional: Métodos y Aplicaciones** (DRAFT)
4. **Computación Cuántica: Fundamentos y Aplicaciones Prácticas** (APPROVED)
5. **Análisis Estadístico Avanzado para Investigación Científica** (PUBLISHED)

### Notificaciones
- Notificaciones de aprobación de publicaciones
- Solicitudes de revisión
- Confirmaciones de envío
- Notificaciones de publicación

## Características del mock server

### Middleware incluido
- **CORS**: Headers habilitados para desarrollo frontend
- **Rate Limiting**: Simulación de límites de velocidad
- **Autenticación**: Simulación básica de tokens JWT
- **Delay de red**: Simulación de latencia real (50-250ms)
- **Errores aleatorios**: 1% de probabilidad de error 500
- **Formato de respuesta**: Respuestas envueltas en formato API estándar

### Headers requeridos
```javascript
{
  'Authorization': 'Bearer mock-token-123',
  'X-Correlation-ID': 'frontend-request-id',
  'Content-Type': 'application/json'
}
```

## Integración con Frontend

### Configuración de API base
```javascript
// En tu configuración de API
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3001' 
  : 'http://localhost:3000';
```

### Ejemplo de uso
```javascript
import { ApiResponse, PublicationListItem } from '../types/api';

const fetchPublications = async (): Promise<ApiResponse<PublicationListItem[]>> => {
  const response = await fetch(`${API_BASE_URL}/api/publications`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Correlation-ID': generateCorrelationId(),
      'Content-Type': 'application/json'
    }
  });
  
  return response.json();
};
```

## Scripts útiles

### package.json scripts
```json
{
  "scripts": {
    "mock:server": "json-server --watch mock-data/db.json --config mock-data/json-server.json",
    "mock:dev": "concurrently \"npm run mock:server\" \"npm run dev\""
  }
}
```

### Variables de entorno
```bash
# .env.development
VITE_API_BASE_URL=http://localhost:3001
VITE_USE_MOCK_SERVER=true

# .env.production
VITE_API_BASE_URL=http://localhost:3000
VITE_USE_MOCK_SERVER=false
```

## Desarrollo

### Agregar nuevos datos
1. Editar `db.json` para agregar nuevos registros
2. Reiniciar json-server para cargar cambios
3. Los datos se mantienen entre reinicios

### Personalizar middleware
1. Editar `middleware.js` para cambiar comportamiento
2. Agregar validaciones específicas
3. Modificar formato de respuestas

### Extender endpoints
1. Agregar rutas en `json-server.json`
2. Crear datos correspondientes en `db.json`
3. Actualizar tipos TypeScript si es necesario

## Troubleshooting

### CORS errors
- Verificar que el middleware esté cargado correctamente
- Revisar headers en las peticiones del frontend

### 404 errors
- Verificar que las rutas en `json-server.json` coincidan con las peticiones
- Revisar que los datos existan en `db.json`

### Rate limiting
- El mock server simula rate limiting
- Reducir frecuencia de peticiones si es necesario

### Errores aleatorios
- Son simulados para testing
- Pueden deshabilitarse en `middleware.js`

## Notas importantes

- Este mock server es solo para desarrollo
- No usar en producción
- Los datos se resetean al reiniciar el servidor
- Simula comportamiento básico de la API real
- Para testing más avanzado, considerar usar MSW (Mock Service Worker) 