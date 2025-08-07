#!/bin/bash

set -e

echo "🔧 Iniciando Backend en modo desarrollo..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Función para esperar que un servicio esté saludable
wait_for_service() {
    local service_name=$1
    local max_attempts=60
    local attempt=1
    
    log "Esperando que $service_name esté saludable..."
    
    while [ $attempt -le $max_attempts ]; do
        if docker compose ps $service_name | grep -q "healthy"; then
            success "$service_name está saludable"
            return 0
        fi
        
        log "Intento $attempt/$max_attempts: $service_name aún no está listo..."
        sleep 5
        attempt=$((attempt + 1))
    done
    
    error "$service_name no está saludable después de $max_attempts intentos"
    return 1
}

# Paso 1: Detener servicios existentes
log "Paso 1: Limpiando servicios existentes..."
docker compose down

# Paso 2: Levantar solo infraestructura
log "Paso 2: Levantando infraestructura (CockroachDB, RabbitMQ, Consul)..."
docker compose up -d cockroachdb rabbitmq consul

# Esperar que la infraestructura esté lista
log "Esperando que la infraestructura esté lista..."
wait_for_service cockroachdb
wait_for_service rabbitmq
wait_for_service consul

# Paso 3: Configurar bases de datos y migraciones
log "Paso 3: Configurando bases de datos y migraciones..."
echo "Omitido setup dev; los entrypoints de contenedor manejarán DB/migraciones."

# Paso 4: Verificar estado final
log "Paso 4: Verificando estado final..."
docker compose ps

success "🎉 Infraestructura iniciada exitosamente!"
log "Servicios de infraestructura disponibles:"
log "  - CockroachDB Admin: http://localhost:8080"
log "  - RabbitMQ Admin: http://localhost:15672 (admin/admin123)"
log "  - Consul UI: http://localhost:8500"
log ""
log "Los microservicios deben ejecutarse localmente con:"
log "  - Auth Service: pnpm --filter auth-service start:dev"
log "  - Publications Service: pnpm --filter publications-service start:dev"
log "  - Catalog Service: pnpm --filter catalog-service start:dev"
log "  - Notifications Service: pnpm --filter notifications-service start:dev"
log "  - Gateway Service: pnpm --filter gateway-service start:dev"
