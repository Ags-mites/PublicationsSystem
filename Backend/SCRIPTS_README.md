# Scripts del Proyecto

Este documento describe los scripts esenciales disponibles en el proyecto.

## 📋 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm run infra` | **Levanta la infraestructura** (RabbitMQ, CockroachDB, Consul) |
| `pnpm run dev` | **Inicia todos los microservicios** en modo desarrollo |
| `pnpm run stop` | **Detiene todos los servicios** y contenedores |
| `pnpm run migrate` | **Despliega migraciones** en todos los servicios |
| `pnpm run db:create` | **Crea bases de datos independientes** para cada microservicio |
| `pnpm run db:init` | **Inicializa la base de datos** CockroachDB con esquemas |

## 🚀 Flujo de Trabajo

### Setup inicial:
```bash
# 1. Levantar infraestructura
pnpm run infra

# 2. Crear bases de datos independientes
pnpm run db:create

# 3. Desplegar migraciones
pnpm run migrate
```

### Desarrollo diario:
```bash
# Iniciar todos los microservicios
pnpm run dev

# Para detener todo
pnpm run stop
```

## 📊 URLs de los Servicios

Una vez que todos los servicios estén corriendo:

- **🔐 Auth Service:** http://localhost:3001
- **📚 Publications Service:** http://localhost:3002
- **📖 Catalog Service:** http://localhost:3003
- **🔔 Notifications Service:** http://localhost:3004
- **🚪 Gateway Service:** http://localhost:8080
- **🗄️ CockroachDB Admin:** http://localhost:8080

## 🗄️ Bases de Datos Independientes:

Cada microservicio tiene su propia base de datos:

- **🔐 Auth Service:** `auth_db`
- **📚 Publications Service:** `publications_db`
- **📖 Catalog Service:** `catalog_db`
- **🔔 Notifications Service:** `notifications_db`

## 🛠️ Scripts Individuales

Los scripts están ubicados en `/scripts/`:

- `dev-all.sh` - Inicia todos los microservicios
- `stop-all.sh` - Detiene todos los servicios
- `deploy-migrations.sh` - Despliega migraciones
- `create-databases.sh` - Crea bases de datos independientes
- `init-databases.sh` - Inicializa base de datos

## ⚠️ Notas Importantes

1. **Primera vez:** Ejecuta `infra` → `db:create` → `migrate`
2. **Desarrollo:** Usa `dev` para iniciar microservicios
3. **Limpieza:** Usa `stop` para detener todo
4. **Base de datos:** Los scripts asumen que CockroachDB está corriendo

## 🔧 Troubleshooting

### Si los servicios no inician:
```bash
# Verificar que la infraestructura esté corriendo
pnpm run infra

# Verificar logs
docker-compose logs -f
```

### Si hay problemas con la base de datos:
```bash
# Reinicializar
pnpm run db:create
pnpm run migrate
``` 