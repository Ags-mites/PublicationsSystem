#!/bin/bash

# Script para iniciar todos los servicios con inicialización automática
# Uso: ./scripts/start-with-init.sh

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

print_step "🚀 Iniciando microservicios con inicialización automática..."

# 1. Detener contenedores existentes
print_status "Deteniendo contenedores existentes..."
docker-compose down

# 2. Construir las imágenes
print_status "Construyendo imágenes Docker..."
docker-compose build

# 3. Iniciar solo la infraestructura primero
print_status "Iniciando infraestructura (CockroachDB, RabbitMQ, Consul)..."
docker-compose up -d cockroachdb rabbitmq consul

# 4. Esperar a que la infraestructura esté lista
print_status "Esperando a que la infraestructura esté lista..."
sleep 15

# 5. Verificar que la infraestructura esté funcionando
print_status "Verificando infraestructura..."
if ! docker ps --format "table {{.Names}}" | grep -q "cockroachdb"; then
    print_error "❌ CockroachDB no está corriendo"
    exit 1
fi

if ! docker ps --format "table {{.Names}}" | grep -q "rabbitmq"; then
    print_error "❌ RabbitMQ no está corriendo"
    exit 1
fi

if ! docker ps --format "table {{.Names}}" | grep -q "consul"; then
    print_error "❌ Consul no está corriendo"
    exit 1
fi

print_status "✅ Infraestructura verificada"

# 6. Iniciar los microservicios
print_status "Iniciando microservicios..."
docker-compose up -d auth-service publications-service catalog-service notifications-service

# 7. Esperar un poco para que los microservicios se inicialicen
print_status "Esperando a que los microservicios se inicialicen..."
sleep 30

# 8. Iniciar el gateway service
print_status "Iniciando gateway service..."
docker-compose up -d gateway-service

# 9. Mostrar estado final
print_step "📊 Estado de los servicios:"
docker-compose ps

print_status "✅ Todos los servicios iniciados con inicialización automática"
print_status "💡 Los microservicios han creado automáticamente sus bases de datos y ejecutado migraciones"

print_step "🌐 URLs de acceso:"
echo "   - Auth Service: http://localhost:3001"
echo "   - Publications Service: http://localhost:3002"
echo "   - Catalog Service: http://localhost:3003"
echo "   - Notifications Service: http://localhost:3004"
echo "   - Gateway Service: http://localhost:8081"
echo "   - CockroachDB UI: http://localhost:8080"
echo "   - RabbitMQ UI: http://localhost:15672 (admin/admin123)"
echo "   - Consul UI: http://localhost:8500"

print_step "📋 Comandos útiles:"
echo "   - Ver logs: pnpm run docker:logs"
echo "   - Detener: pnpm run docker:down"
echo "   - Limpiar: pnpm run docker:clean"
