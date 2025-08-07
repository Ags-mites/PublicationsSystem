#!/bin/bash

set -e

echo "🚀 Iniciando Backend Completo..."

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

# Función para detener todos los servicios
cleanup() {
    log "Deteniendo todos los servicios..."
    docker compose down
}

# Trap para limpiar en caso de error
trap cleanup EXIT

# Paso 1: Detener servicios existentes
log "Paso 1: Limpiando servicios existentes..."
docker compose down

# Paso 2: Levantar infraestructura
log "Paso 2: Levantando infraestructura (CockroachDB, RabbitMQ, Consul)..."
docker compose up -d cockroachdb rabbitmq consul

# Esperar que la infraestructura esté lista
log "Esperando que la infraestructura esté lista..."
wait_for_service cockroachdb
wait_for_service rabbitmq
wait_for_service consul

# Paso 3: (omitido) La creación de DBs y migraciones ahora la ejecuta el entrypoint de cada servicio
log "Paso 3: Omitido. Los servicios ejecutarán creation/migrations en su entrypoint."

# Paso 4: Levantar microservicios en orden
log "Paso 4: Levantando microservicios..."

# Auth Service
log "Levantando auth-service..."
docker compose up -d auth-service
wait_for_service auth-service

# Publications Service
log "Levantando publications-service..."
docker compose up -d publications-service
wait_for_service publications-service

# Notifications Service
log "Levantando notifications-service..."
docker compose up -d notifications-service
wait_for_service notifications-service

# Catalog Service
log "Levantando catalog-service..."
docker compose up -d catalog-service
wait_for_service catalog-service

# Gateway Service
log "Levantando gateway-service..."
docker compose up -d gateway-service
wait_for_service gateway-service

# Paso 5: Verificar estado final
log "Paso 5: Verificando estado final..."
docker compose ps

success "🎉 Backend iniciado exitosamente!"
log "Servicios disponibles:"
log "  - Auth Service: http://localhost:3001"
log "  - Publications Service: http://localhost:3002"
log "  - Catalog Service: http://localhost:3003"
log "  - Notifications Service: http://localhost:3004"
log "  - Gateway Service: http://localhost:8081"
log "  - CockroachDB Admin: http://localhost:8080"
log "  - RabbitMQ Admin: http://localhost:15672 (admin/admin123)"
log "  - Consul UI: http://localhost:8500"

# Remover trap ya que todo salió bien
trap - EXIT
