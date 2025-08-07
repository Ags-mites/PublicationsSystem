FROM node:18-alpine AS builder

WORKDIR /app

# Usar el package.json del microservicio
COPY services/auth-service/package*.json ./
RUN npm install

# Copiar sólo el código del microservicio
COPY services/auth-service/. .

# Generar Prisma client y compilar
RUN npm run prisma:generate || true
RUN npm run build

# Descargar binario cockroach
RUN apk add --no-cache curl && \
    curl -L https://binaries.cockroachdb.com/cockroach-v23.1.13.linux-amd64.tgz | tar -xz && \
    cp cockroach-v23.1.13.linux-amd64/cockroach /usr/local/bin/ && \
    rm -rf cockroach-v23.1.13.linux-amd64*

FROM node:18-alpine AS production

WORKDIR /app

RUN apk add --no-cache netcat-openbsd curl

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /usr/local/bin/cockroach /usr/local/bin/cockroach

COPY scripts/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 3001

CMD ["/usr/local/bin/entrypoint.sh"]
