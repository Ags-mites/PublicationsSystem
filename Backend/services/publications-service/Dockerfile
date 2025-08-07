# Etapa 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copia el lockfile desde el root del monorepo
COPY pnpm-lock.yaml ./
# Copia el package.json del microservicio
COPY services/publications-service/package.json ./

# Instalar PNPM y dependencias
RUN npm install -g pnpm && pnpm install

# Copiar el código fuente del microservicio
COPY services/publications-service/. .

# Generar cliente de Prisma
RUN pnpm run prisma:generate

# Compilar la aplicación
RUN pnpm run build

# Etapa 2: Producción
FROM node:18-alpine AS production

WORKDIR /app

# Instalar herramientas necesarias para la inicialización
RUN apk add --no-cache netcat-openbsd curl

# Instalar cliente de CockroachDB
RUN curl -L https://binaries.cockroachdb.com/cockroach-v23.1.13.linux-amd64.tgz | tar -xz && \
    cp cockroach-v23.1.13.linux-amd64/cockroach /usr/local/bin/ && \
    rm -rf cockroach-v23.1.13.linux-amd64

# Copiar solo lo necesario desde la etapa anterior
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

# Copia el script de inicialización
COPY scripts/init-service.sh /usr/local/bin/init-service.sh
RUN chmod +x /usr/local/bin/init-service.sh

# Exponer puerto
EXPOSE 3002

# Script de inicio que inicializa la BD y luego ejecuta la aplicación
CMD ["/bin/sh", "-c", "/usr/local/bin/init-service.sh publications-service publications_db && node dist/src/main"] 