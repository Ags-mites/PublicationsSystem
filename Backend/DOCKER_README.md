# 🐳 Dockerización del Backend - Microservicios

Este documento explica cómo dockerizar correctamente el backend siguiendo las mejores prácticas para monorepos.

## 🏗️ Arquitectura Docker

### Estructura del Proyecto
```
Backend/
├── pnpm-lock.yaml          # 🔑 ÚNICO lockfile en la raíz
├── docker-compose.yml       # 🐙 Orquestación de servicios
├── .dockerignore           # 🚫 Archivos excluidos del build
├── services/
│   ├── auth-service/
│   │   ├── Dockerfile      # 🐳 Build del microservicio
│   │   └── package.json
│   ├── publications-service/
│   ├── catalog-service/
│   ├── notifications-service/
│   └── gateway-service/
└── scripts/
    └── docker-build.sh     # 🔧 Script de construcción
```

## 🚀 Configuración Correcta

### 1. Contexto de Build (docker-compose.yml)
```yaml
auth-service:
  build:
    context: .                    # ✅ Contexto raíz del monorepo
    dockerfile: services/auth-service/Dockerfile
    target: production
```

### 2. Dockerfile Optimizado
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copia el lockfile desde el root del monorepo
COPY pnpm-lock.yaml ./
# Copia el package.json del microservicio
COPY services/auth-service/package.json ./

# Instala pnpm y dependencias
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copia el código fuente del microservicio
COPY services/auth-service/. .

# Genera Prisma client y construye la aplicación
RUN pnpm run prisma:generate
RUN pnpm run build

FROM node:18-alpine AS production
# ... resto del Dockerfile
```

## 🎯 Ventajas de esta Configuración

### ✅ Consistencia
- **UN solo lockfile** en la raíz del monorepo
- **Builds reproducibles** en cualquier entorno
- **Sin duplicación** de dependencias

### ✅ Portabilidad
- Funciona igual en Docker, Railway, Render, etc.
- **Contexto de build** optimizado
- **Cache eficiente** de capas Docker

### ✅ Mantenibilidad
- **Fácil actualización** de dependencias
- **Scripts automatizados** para construcción
- **Documentación clara** del proceso

## 🛠️ Comandos Útiles

### Construcción de Imágenes
```bash
# Construir todos los servicios
pnpm run docker:build:all

# Construir un servicio específico
pnpm run docker:build auth-service

# Construir manualmente
./scripts/docker-build.sh [service-name]
```

### Gestión de Contenedores
```bash
# Levantar toda la infraestructura
pnpm run docker:up

# Detener todos los servicios
pnpm run docker:down

# Ver logs en tiempo real
pnpm run docker:logs

# Limpiar contenedores y volúmenes
pnpm run docker:clean
```

### Desarrollo
```bash
# Solo infraestructura (DB, RabbitMQ, Consul)
pnpm run infra

# Desarrollo local completo
pnpm run dev
```

## 🔧 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `docker:build` | Construir un servicio específico |
| `docker:build:all` | Construir todos los servicios |
| `docker:up` | Levantar todos los servicios |
| `docker:down` | Detener todos los servicios |
| `docker:logs` | Ver logs en tiempo real |
| `docker:clean` | Limpiar contenedores y volúmenes |

## 📋 Checklist de Verificación

### ✅ Configuración Correcta
- [ ] `context: .` en docker-compose.yml
- [ ] `COPY pnpm-lock.yaml ./` en Dockerfiles
- [ ] `COPY services/[service]/package.json ./` en Dockerfiles
- [ ] `.dockerignore` en la raíz del proyecto
- [ ] Scripts de construcción disponibles

### ✅ Pruebas
- [ ] Build exitoso de todos los servicios
- [ ] Contenedores se levantan correctamente
- [ ] Comunicación entre servicios funciona
- [ ] Base de datos se inicializa correctamente

## 🚨 Errores Comunes y Soluciones

### ❌ Error: "Cannot find module"
**Causa**: Contexto de build incorrecto
**Solución**: Usar `context: .` en docker-compose.yml

### ❌ Error: "pnpm-lock.yaml not found"
**Causa**: Dockerfile busca lockfile en directorio incorrecto
**Solución**: Copiar desde raíz: `COPY pnpm-lock.yaml ./`

### ❌ Error: "Build context too large"
**Causa**: .dockerignore mal configurado
**Solución**: Excluir node_modules, dist, etc.

## 🔍 Debugging

### Verificar Contexto de Build
```bash
# Ver qué archivos se copian al contexto
docker build --progress=plain -f services/auth-service/Dockerfile .
```

### Verificar Imágenes
```bash
# Listar imágenes construidas
docker images | grep -E "(auth|publications|catalog|notifications|gateway)"

# Inspeccionar imagen
docker inspect auth-service:latest
```

### Verificar Contenedores
```bash
# Ver contenedores corriendo
docker ps

# Ver logs de un servicio
docker logs auth-service
```

## 📚 Referencias

- [Docker Multi-stage Builds](https://docs.docker.com/develop/dev-best-practices/multistage-build/)
- [Docker Build Context](https://docs.docker.com/engine/reference/commandline/build/)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Docker Compose](https://docs.docker.com/compose/)

---

**🎉 ¡Tu backend está ahora correctamente dockerizado siguiendo las mejores prácticas!**
