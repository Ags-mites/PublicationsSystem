# Etapa 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copia el lockfile desde el root del monorepo
COPY pnpm-lock.yaml ./
# Copia el package.json del microservicio
COPY services/gateway-service/package.json ./

# Instalar PNPM y dependencias
RUN npm install -g pnpm && pnpm install

# Copiar el código fuente del microservicio
COPY services/gateway-service/. .

# Compilar la aplicación
RUN pnpm run build

# Etapa 2: Producción
FROM node:18 AS production

WORKDIR /app

# Instalar herramientas necesarias para la inicialización
RUN apt-get update && apt-get install -y --no-install-recommends \
    netcat-openbsd ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copiar solo lo necesario desde la etapa anterior
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Copia el entrypoint único (aunque gateway no usa DB)
COPY scripts/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Exponer puerto
EXPOSE 8080

# Script de inicio (usa el entrypoint por consistencia; solo ejecuta la app)
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["node", "dist/src/main"]