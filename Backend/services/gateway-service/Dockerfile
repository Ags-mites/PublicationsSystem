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
FROM node:18-alpine AS production

WORKDIR /app

# Instalar herramientas necesarias para la inicialización
RUN apk add --no-cache netcat-openbsd

# Copiar solo lo necesario desde la etapa anterior
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Copia el script de inicialización
COPY scripts/init-service.sh /usr/local/bin/init-service.sh
RUN chmod +x /usr/local/bin/init-service.sh

# Exponer puerto
EXPOSE 8080

# Script de inicio que espera a que los servicios estén listos y luego ejecuta la aplicación
CMD ["/bin/sh", "-c", "echo 'Esperando a que los servicios estén listos...' && sleep 10 && node dist/src/main"] 