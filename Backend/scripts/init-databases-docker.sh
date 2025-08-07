#!/bin/bash

# Script para inicializar las bases de datos en Docker
# Uso: ./scripts/init-databases-docker.sh

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con colores
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Verificar que estamos en el directorio raíz del proyecto
if [ ! -f "pnpm-lock.yaml" ]; then
    print_error "Este script debe ejecutarse desde la raíz del proyecto (donde está pnpm-lock.yaml)"
    exit 1
fi

print_step "🗄️  Inicializando bases de datos en Docker..."

# Esperar a que CockroachDB esté listo
print_status "Esperando a que CockroachDB esté listo..."
until docker exec cockroachdb cockroach sql --insecure --host=localhost:26257 -e "SELECT 1;" > /dev/null 2>&1; do
    print_status "CockroachDB aún no está listo, esperando..."
    sleep 2
done

print_status "✅ CockroachDB está listo"

# Crear bases de datos
print_step "📊 Creando bases de datos..."

# Auth Service Database
print_status "Creando base de datos para auth-service..."
docker exec cockroachdb cockroach sql --insecure --host=localhost:26257 -e "CREATE DATABASE IF NOT EXISTS auth_db;"

# Publications Service Database
print_status "Creando base de datos para publications-service..."
docker exec cockroachdb cockroach sql --insecure --host=localhost:26257 -e "CREATE DATABASE IF NOT EXISTS publications_db;"

# Catalog Service Database
print_status "Creando base de datos para catalog-service..."
docker exec cockroachdb cockroach sql --insecure --host=localhost:26257 -e "CREATE DATABASE IF NOT EXISTS catalog_db;"

# Notifications Service Database
print_status "Creando base de datos para notifications-service..."
docker exec cockroachdb cockroach sql --insecure --host=localhost:26257 -e "CREATE DATABASE IF NOT EXISTS notifications_db;"

print_status "✅ Bases de datos creadas exitosamente"

# Verificar que las bases de datos existen
print_step "🔍 Verificando bases de datos..."
docker exec cockroachdb cockroach sql --insecure --host=localhost:26257 -e "SHOW DATABASES;"

print_status "✅ Inicialización de bases de datos completada"
print_status "💡 Ahora puedes ejecutar las migraciones de Prisma en cada servicio"
