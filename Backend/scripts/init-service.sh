#!/bin/sh

# Script para inicializar un microservicio (base de datos y migraciones)
# Uso: ./scripts/init-service.sh [service-name] [database-name]

set -e

SERVICE_NAME=$1
DATABASE_NAME=$2

if [ -z "$SERVICE_NAME" ] || [ -z "$DATABASE_NAME" ]; then
    echo "Uso: $0 <service-name> <database-name>"
    echo "Ejemplo: $0 auth-service auth_db"
    exit 1
fi

echo "🔧 Inicializando $SERVICE_NAME con base de datos $DATABASE_NAME..."

# Esperar a que CockroachDB esté listo
echo "⏳ Esperando a que CockroachDB esté disponible..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if nc -z cockroachdb 26257 2>/dev/null; then
        echo "✅ CockroachDB está disponible"
        break
    fi
    
    echo "Intento $attempt/$max_attempts: CockroachDB aún no está listo, esperando..."
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ Error: CockroachDB no está disponible después de $max_attempts intentos"
    exit 1
fi

# Crear la base de datos si no existe
echo "📊 Creando base de datos $DATABASE_NAME..."
/usr/local/bin/cockroach sql --insecure --host=cockroachdb:26257 -e "CREATE DATABASE IF NOT EXISTS $DATABASE_NAME;" || {
    echo "❌ Error: No se pudo crear la base de datos $DATABASE_NAME"
    exit 1
}

# Ejecutar migraciones de Prisma
echo "🔄 Ejecutando migraciones de Prisma..."
cd /app

# Verificar si hay migraciones pendientes
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations)" ]; then
    echo "📋 Ejecutando migraciones existentes..."
    pnpm run prisma:migrate || {
        echo "❌ Error: No se pudieron ejecutar las migraciones"
        exit 1
    }
else
    echo "📋 No hay migraciones pendientes, generando Prisma client..."
    pnpm run prisma:generate || {
        echo "❌ Error: No se pudo generar el cliente de Prisma"
        exit 1
    }
fi

echo "✅ $SERVICE_NAME inicializado correctamente"
