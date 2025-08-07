# Etapa 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de definición de paquetes
COPY package.json pnpm-lock.yaml ./

# Instalar PNPM y dependencias
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copiar todo el código fuente
COPY . .

# Generar cliente de Prisma
RUN pnpm run prisma:generate

# Compilar la aplicación
RUN pnpm run build

# Etapa 2: Producción
FROM node:18-alpine AS production

WORKDIR /app

# Copiar solo lo necesario desde la etapa anterior
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Exponer puerto
EXPOSE 3004

# Comando de inicio
CMD ["node", "dist/main"] 