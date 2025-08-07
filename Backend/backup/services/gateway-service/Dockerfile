# Etapa 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copia lockfile del root y package.json del servicio
COPY pnpm-lock.yaml ./
COPY services/gateway-service/package.json ./

# Instalar PNPM y dependencias
RUN npm install -g pnpm && pnpm install

# Copiar el código fuente del microservicio
COPY services/gateway-service/. .

# Compilar la aplicación
RUN pnpm run build

# Etapa 2: Producción
FROM node:18-alpine AS production

WORKDIR /app

# Utilidades necesarias
RUN apk add --no-cache netcat-openbsd curl

# Artefactos de build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Entrypoint genérico (sin DB)
COPY scripts/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8080

ENV SERVICE_NAME=gateway-service
ENV APP_CMD="node dist/main"

CMD ["/usr/local/bin/entrypoint.sh"] 