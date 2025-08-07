# 🚀 Guía de Desarrollo - Microservicios

## 📋 Comandos Disponibles

### 🐳 Infraestructura Docker

```bash
# Levantar solo infraestructura (para desarrollo)
pnpm run dev:only

# Levantar toda la infraestructura + microservicios
pnpm run docker:up

# Detener toda la infraestructura
pnpm run docker:down

# Ver logs de infraestructura
pnpm run docker:logs

# Limpiar contenedores y volúmenes
pnpm run docker:clean
```

### 🔧 Desarrollo Local

```bash
# Ejecutar un microservicio específico
pnpm run dev:services auth-service
pnpm run dev:services publications-service
pnpm run dev:services catalog-service
pnpm run dev:services notifications-service
pnpm run dev:services gateway-service

# Ejecutar todos los microservicios
pnpm run dev:services all

# Ver ayuda de servicios
pnpm run dev:services help
```

### 🏗️ Construcción Docker

```bash
# Construir un servicio específico
pnpm run docker:build auth-service

# Construir todos los servicios
pnpm run docker:build:all

# Construir manualmente
docker build -f services/auth-service/Dockerfile -t auth-service .
```

### 🗄️ Base de Datos

```bash
# Inicializar bases de datos
pnpm run db:init

# Crear bases de datos
pnpm run db:create

# Ejecutar migraciones
pnpm run migrate
```

## 🎯 Flujo de Desarrollo Recomendado

### 1. **Iniciar Infraestructura**
```bash
# Solo infraestructura (recomendado para desarrollo)
pnpm run dev:only
```

### 2. **Ejecutar Microservicios**
```bash
# Opción A: Un servicio específico
pnpm run dev:services auth-service

# Opción B: Todos los servicios
pnpm run dev:services all
```

### 3. **Desarrollo**
- Los microservicios se conectarán automáticamente a la infraestructura Docker
- Los cambios se recargan automáticamente (hot reload)
- Los logs aparecen en la consola

### 4. **Detener**
```bash
# Detener microservicios: Ctrl+C
# Detener infraestructura
pnpm run docker:down
```

## 🌐 URLs de Acceso

### Infraestructura
- **CockroachDB**: http://localhost:8080
- **RabbitMQ**: http://localhost:15672 (admin/admin123)
- **Consul**: http://localhost:8500

### Microservicios
- **Auth Service**: http://localhost:3001
- **Publications Service**: http://localhost:3002
- **Catalog Service**: http://localhost:3003
- **Notifications Service**: http://localhost:3004
- **Gateway Service**: http://localhost:8081

## 🔧 Configuración de Entorno

### Variables de Entorno
Cada microservicio necesita un archivo `.env` en su directorio:

```bash
# Ejemplo para auth-service/.env
DATABASE_URL="postgresql://root@localhost:26257/auth_db?sslmode=disable"
RABBITMQ_URL="amqp://admin:admin123@localhost:5672"
CONSUL_HOST="localhost"
CONSUL_PORT="8500"
```

### Verificar Configuración
```bash
# Verificar que la infraestructura esté corriendo
docker ps

# Verificar logs de un servicio específico
docker logs auth-service
```

## 🚨 Solución de Problemas

### Error: "Cannot find module"
```bash
# Regenerar lockfile
rm pnpm-lock.yaml
pnpm install
```

### Error: "Connection refused"
```bash
# Verificar que la infraestructura esté corriendo
pnpm run dev:only
```

### Error: "Port already in use"
```bash
# Verificar puertos en uso
lsof -i :3001
lsof -i :3002
# etc.

# Detener contenedores
pnpm run docker:down
```

### Limpiar Todo
```bash
# Detener y limpiar contenedores
pnpm run docker:clean

# Reinstalar dependencias
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## 📝 Notas Importantes

### ✅ Mejores Prácticas
- **Siempre** ejecuta `pnpm run dev:only` antes de desarrollar
- **Siempre** ejecuta `pnpm install` después de modificar dependencias
- **Nunca** tengas `node_modules` duplicados en servicios
- **Nunca** tengas `pnpm-lock.yaml` duplicados

### 🔄 Flujo de Trabajo
1. Modificar código en el servicio
2. Los cambios se recargan automáticamente
3. Verificar logs en la consola
4. Probar endpoints en el navegador/Postman

### 🐛 Debugging
- Los logs aparecen en la consola donde ejecutaste el servicio
- Usa `console.log()` para debugging
- Los errores se muestran en tiempo real

---

**🎉 ¡Tu entorno de desarrollo está listo para usar!**
