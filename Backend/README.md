## Backend – Guía rápida (Dev y Prod)

### Requisitos
- Node.js 18+
- pnpm 8+
- Docker y Docker Compose

Ubícate en `Backend`:
```bash
cd /home/agustin_mites/projects/Projects/proyectos/html/Universidad/23447-arquitectura_software/ProyectoFinal/Backend
```

### Desarrollo (servicios en local, infraestructura en Docker)
1) Instalar dependencias del monorepo:
```bash
pnpm -r install
```
2) Levantar solo infraestructura (DB, broker y Consul):
```bash
pnpm start:dev
```
3) En otras terminales, levantar cada microservicio en modo watch:
```bash
pnpm --filter auth-service start:dev
pnpm --filter publications-service start:dev
pnpm --filter catalog-service start:dev
pnpm --filter notifications-service start:dev
pnpm --filter gateway-service start:dev
```

URLs útiles:
- Gateway: http://localhost:8081
- Auth: http://localhost:3001
- Publications: http://localhost:3002
- Catalog: http://localhost:3003
- Notifications: http://localhost:3004
- CockroachDB UI: http://localhost:8080
- RabbitMQ UI: http://localhost:15672 (admin/admin123)
- Consul UI: http://localhost:8500

Para detener solo infraestructura:
```bash
docker compose down
```

### Producción local (todo en Docker)
Opción rápida (secuencia y espera healthchecks):
```bash
pnpm start
```

Opción Docker Compose directa:
```bash
docker compose up -d --build
```

Ver estado y logs:
```bash
docker compose ps
docker compose logs -f
```

Detener y limpiar:
```bash
docker compose down
pnpm run docker:clean   # down -v + prune
```

### Notas
- Los contenedores ya usan los archivos `services/*/env.docker`. Ajusta valores ahí si es necesario.
- La inicialización de DB/esquemas la manejan los entrypoints de los servicios; no hace falta correr migraciones manuales.
