#!/bin/sh

set -e

SERVICE_NAME=${SERVICE_NAME:-"unknown-service"}
DATABASE_NAME=${DATABASE_NAME:-""}
DB_SCHEMA=${DB_SCHEMA:-""}
APP_CMD=${APP_CMD:-"node dist/src/main"}

# Forzar Prisma Node engine por defecto (no Data Proxy)
export PRISMA_CLIENT_ENGINE_TYPE=${PRISMA_CLIENT_ENGINE_TYPE:-library}
export PRISMA_GENERATE_DATAPROXY=${PRISMA_GENERATE_DATAPROXY:-false}

log() { echo "[$SERVICE_NAME] $1"; }

wait_for_host() {
  host=$1
  port=$2
  retries=${3:-60}
  sleep_s=${4:-2}
  i=0
  while [ $i -lt $retries ]; do
    if nc -z "$host" "$port" 2>/dev/null; then
      return 0
    fi
    i=$((i+1))
    sleep "$sleep_s"
  done
  return 1
}

if [ -n "$DATABASE_NAME" ]; then
  log "Esperando CockroachDB en cockroachdb:26257..."
  if ! wait_for_host cockroachdb 26257 90 2; then
    log "ERROR: CockroachDB no disponible"
    exit 1
  fi
  
  if command -v cockroach >/dev/null 2>&1; then
    log "Creando base de datos $DATABASE_NAME (si no existe)..."
    cockroach sql --insecure --host=cockroachdb:26257 -e "CREATE DATABASE IF NOT EXISTS $DATABASE_NAME;" || log "WARN: creación de DB omitida"
    if [ -n "$DB_SCHEMA" ]; then
      log "Creando schema $DB_SCHEMA en $DATABASE_NAME (si no existe)..."
      cockroach sql --insecure --host=cockroachdb:26257 -e "SET DATABASE = $DATABASE_NAME; CREATE SCHEMA IF NOT EXISTS $DB_SCHEMA;" || log "WARN: creación de schema omitida"
    fi
  else
    log "WARN: cockroach CLI no disponible, omitiendo creación de DB"
  fi
fi

if [ -d "/app/prisma" ] && [ -f "/app/package.json" ]; then
  if grep -q "\"prisma:deploy\"" /app/package.json; then
    log "Ejecutando prisma migrate deploy..."
    npm run -s prisma:deploy || npx prisma migrate deploy || true
  elif grep -q "\"prisma:migrate\"" /app/package.json; then
    log "Ejecutando prisma migrate..."
    npm run -s prisma:migrate || npx prisma migrate deploy || true
  fi
  log "Generando Prisma Client (asegurando engine correcto)..."
  PRISMA_CLIENT_ENGINE_TYPE=${PRISMA_CLIENT_ENGINE_TYPE:-library} npm run -s prisma:generate || PRISMA_CLIENT_ENGINE_TYPE=${PRISMA_CLIENT_ENGINE_TYPE:-library} npx prisma generate || true
fi

log "Iniciando aplicación: $APP_CMD"
exec sh -c "$APP_CMD"
