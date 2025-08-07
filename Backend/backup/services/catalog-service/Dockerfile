# Etapa 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copia lockfile del root y package.json del servicio
COPY pnpm-lock.yaml ./
COPY services/catalog-service/package.json ./

# Instalar dependencias
RUN npm install -g pnpm && pnpm install

# Copiar código del servicio
COPY services/catalog-service/. .

# Prisma y build
RUN pnpm run prisma:generate
RUN pnpm run build

# Etapa 2: Producción
FROM node:18-alpine AS production

WORKDIR /app

# Utilidades necesarias
RUN apk add --no-cache netcat-openbsd curl

# Instalar cockroach cli
RUN curl -L https://binaries.cockroachdb.com/cockroach-v23.1.13.linux-amd64.tgz | tar -xz && \
    cp cockroach-v23.1.13.linux-amd64/cockroach /usr/local/bin/ && \
    rm -rf cockroach-v23.1.13.linux-amd64*

# Artefactos de build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

# Entrypoint genérico
COPY scripts/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 3003

ENV SERVICE_NAME=catalog-service
ENV DATABASE_NAME=catalog_db
ENV APP_CMD="node dist/main"

CMD ["/usr/local/bin/entrypoint.sh"] 