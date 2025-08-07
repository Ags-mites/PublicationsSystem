set -e
SERVICE_NAME=${SERVICE_NAME:-unknown-service}
DATABASE_NAME=${DATABASE_NAME:-}
APP_CMD=${APP_CMD:-"node dist/src/main"}
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
  else
    log "WARN: cockroach CLI no disponible, omitiendo creación de DB"
  fi
fi
if [ -d "/app/prisma" ]; then
  if [ -f "/app/package.json" ]; then
    if grep -q "\"prisma:deploy\"" /app/package.json; then
      log "Ejecutando prisma migrate deploy..."
      npm run -s prisma:deploy || npx prisma migrate deploy || true
    elif grep -q "\"prisma:migrate\"" /app/package.json; then
      log "Ejecutando prisma migrate..."
      npm run -s prisma:migrate || npx prisma migrate deploy || true
    else
      log "Generando Prisma Client..."
      npm run -s prisma:generate || npx prisma generate || true
    fi
  fi
fi
log "Iniciando aplicación: $APP_CMD"
exec sh -c "$APP_CMD"
