# Guía de Configuración del Backend - Microservicios

## 🏗️ Arquitectura del Sistema

Este proyecto utiliza una arquitectura de microservicios con los siguientes componentes:

### Microservicios Core (4):
- **Auth Service** (Puerto 3001) - Autenticación y autorización
- **Publications Service** (Puerto 3002) - Gestión de publicaciones y reviews
- **Catalog Service** (Puerto 3003) - Catálogo público de publicaciones
- **Notifications Service** (Puerto 3004) - Sistema de notificaciones

### API Gateway (Puerto 3000):
- **Gateway Service** - Punto de entrada único público, enrutamiento y seguridad

### Infraestructura:
- **CockroachDB** - 4 instancias separadas (una por microservicio)
- **RabbitMQ** - Comunicación asíncrona entre servicios
- **Consul** - Descubrimiento y registro de servicios
- **Redis** - Gestión de colas para notificaciones

## 🚀 Configuración Inicial

### Prerequisitos
- Node.js 18+
- pnpm
- Docker y Docker Compose

### 1. Instalación de Dependencias
```bash
# Instalar todas las dependencias
pnpm run install:all
```

### 2. Inicialización de Bases de Datos
```bash
# Inicializar todas las bases de datos y Prisma
pnpm run init:db
```

### 3. Levantar el Proyecto Completo

#### Opción 1: Script Simplificado (Recomendado)
```bash
# Iniciar todos los servicios con configuración automática de Prisma
pnpm run dev:simple
```

#### Opción 2: Script Completo
```bash
# Iniciar todos los servicios en modo desarrollo con verificaciones
pnpm run dev
```

## 🗄️ Configuración de Bases de Datos

Cada microservicio tiene su propia instancia de CockroachDB:

- **Auth DB**: `localhost:26257` - Base `auth_db`
- **Publications DB**: `localhost:26258` - Base `publications_db`
- **Catalog DB**: `localhost:26259` - Base `catalog_db`
- **Notifications DB**: `localhost:26260` - Base `notifications_db`

## 🔧 Scripts Disponibles

- `pnpm run dev` - Inicia todos los servicios en desarrollo
- `pnpm run init:db` - Inicializa bases de datos y ejecuta migraciones
- `pnpm run docker:up` - Solo levanta infraestructura (Docker)
- `pnpm run docker:down` - Detiene infraestructura
- `pnpm run install:all` - Instala dependencias en todos los servicios

## 🌐 URLs de Servicios

### Aplicación:
- **API Gateway**: http://localhost:3000
- **Gateway Docs**: http://localhost:3000/api/docs

### Infraestructura:
- **Consul UI**: http://localhost:8500
- **RabbitMQ Management**: http://localhost:15672 (admin/admin123)
- **CockroachDB Auth**: http://localhost:8080
- **CockroachDB Publications**: http://localhost:8081
- **CockroachDB Catalog**: http://localhost:8082
- **CockroachDB Notifications**: http://localhost:8083

## 🛠️ Solución de Problemas

### Problema: Prisma Client no encontrado
**Solución**: El script `dev-start.sh` ahora genera automáticamente el Prisma Client para cada servicio.

### Problema: Bases de datos no disponibles
**Solución**: Usa `pnpm run init:db` para inicializar correctamente todas las bases de datos.

### Problema: Conflictos de puerto
**Solución**: Verifica que los puertos 3000-3004, 5672, 6379, 8500, 26257-26260, 8080-8083 estén disponibles.

## 🔐 Comunicación entre Servicios

- **Externa (Pública)**: Solo a través del API Gateway (Puerto 3000)
- **Interna**: RabbitMQ para eventos asíncronos entre microservicios
- **Descubrimiento**: Consul para registro y localización de servicios

## 📊 Monitoreo y Logs

Los logs de cada servicio se encuentran en sus respectivos directorios:
- `services/*/logs/`
- Logs de acceso y errores en archivos separados

## 🔄 Flujo de Startup

1. ✅ Docker Compose levanta infraestructura
2. ✅ Espera a que bases de datos estén listas
3. ✅ Instala dependencias si es necesario
4. ✅ Genera Prisma Client para cada servicio
5. ✅ Ejecuta migraciones de base de datos
6. ✅ Registra servicios en Consul
7. ✅ Inicia todos los microservicios
8. ✅ API Gateway enruta peticiones

## 🎯 Consideraciones de Producción

- Cada microservicio tiene su propia base de datos aislada
- API Gateway como único punto de entrada
- Autenticación JWT centralizada
- Rate limiting configurado por servicio
- Health checks automáticos vía Consul