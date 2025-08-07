FROM node:18-alpine AS builder

WORKDIR /app

# Copia el lockfile desde el root del monorepo
COPY pnpm-lock.yaml ./
# Copia el package.json del microservicio
COPY services/auth-service/package.json ./

# Instala pnpm y dependencias
RUN npm install -g pnpm && pnpm install

# Copia el código fuente del microservicio
COPY services/auth-service/. .

# Genera Prisma client (forzar engine node)
ENV PRISMA_CLIENT_ENGINE_TYPE=library
ENV PRISMA_GENERATE_DATAPROXY=false
RUN PRISMA_CLIENT_ENGINE_TYPE=library PRISMA_GENERATE_DATAPROXY=false pnpm run prisma:generate
RUN pnpm run build

FROM node:18 AS production

WORKDIR /app

# Instalar herramientas necesarias para la inicialización
RUN apt-get update && apt-get install -y --no-install-recommends \
    netcat-openbsd curl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Instalar cliente de CockroachDB
RUN curl -L https://binaries.cockroachdb.com/cockroach-v23.1.13.linux-amd64.tgz | tar -xz && \
    cp cockroach-v23.1.13.linux-amd64/cockroach /usr/local/bin/ && \
    rm -rf cockroach-v23.1.13.linux-amd64

# Copia solo los archivos necesarios para producción
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

# Copia el entrypoint único de inicialización
COPY scripts/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 3001

# Script de inicio: entrypoint hace creación de DB y migraciones, luego corre la app
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["node", "dist/src/main"]