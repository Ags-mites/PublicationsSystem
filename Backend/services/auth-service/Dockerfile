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

# Genera Prisma client y construye la aplicación
RUN pnpm run prisma:generate
RUN pnpm run build

FROM node:18-alpine AS production

WORKDIR /app

# Instalar herramientas necesarias para la inicialización
RUN apk add --no-cache netcat-openbsd curl

# Instalar cliente de CockroachDB
RUN curl -L https://binaries.cockroachdb.com/cockroach-v23.1.13.linux-amd64.tgz | tar -xz && \
    cp cockroach-v23.1.13.linux-amd64/cockroach /usr/local/bin/ && \
    rm -rf cockroach-v23.1.13.linux-amd64

# Copia solo los archivos necesarios para producción
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

# Copia el script de inicialización
COPY scripts/init-service.sh /usr/local/bin/init-service.sh
RUN chmod +x /usr/local/bin/init-service.sh

EXPOSE 3001

# Script de inicio que inicializa la BD y luego ejecuta la aplicación
CMD ["/bin/sh", "-c", "/usr/local/bin/init-service.sh auth-service auth_db && node dist/src/main"] 