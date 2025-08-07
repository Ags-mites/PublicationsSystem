#!/bin/bash

# Script para levantar solo la infraestructura necesaria para desarrollo
# Uso: ./scripts/dev-only.sh

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

print_step "🚀 Iniciando entorno de desarrollo..."

# 1. Levantar solo la infraestructura (sin microservicios)
print_status "Levantando infraestructura (CockroachDB, RabbitMQ, Consul)..."
docker-compose up -d cockroachdb rabbitmq consul

# Esperar un momento para que los servicios se inicialicen
print_status "Esperando que los servicios de infraestructura se inicialicen..."
sleep 10

# 2. Verificar que los servicios están corriendo
print_status "Verificando estado de los servicios..."
if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "cockroachdb.*Up"; then
    print_status "✅ CockroachDB está corriendo"
else
    print_error "❌ CockroachDB no está corriendo"
    exit 1
fi

if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "rabbitmq.*Up"; then
    print_status "✅ RabbitMQ está corriendo"
else
    print_error "❌ RabbitMQ no está corriendo"
    exit 1
fi

if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "consul.*Up"; then
    print_status "✅ Consul está corriendo"
else
    print_error "❌ Consul no está corriendo"
    exit 1
fi

# 3. Mostrar información de conexión
print_step "📊 Información de conexión:"
echo ""
echo "🔗 CockroachDB:"
echo "   - Puerto: 26257 (SQL)"
echo "   - Web UI: http://localhost:8080"
echo ""
echo "🐰 RabbitMQ:"
echo "   - Puerto: 5672 (AMQP)"
echo "   - Web UI: http://localhost:15672"
echo "   - Usuario: admin"
echo "   - Contraseña: admin123"
echo ""
echo "🏛️  Consul:"
echo "   - Web UI: http://localhost:8500"
echo "   - Puerto: 8600 (DNS)"
echo ""

# 4. Mostrar comandos útiles
print_step "🛠️  Comandos útiles:"
echo ""
echo "📋 Ver logs de infraestructura:"
echo "   docker-compose logs -f cockroachdb rabbitmq consul"
echo ""
echo "🛑 Detener infraestructura:"
echo "   docker-compose down"
echo ""
echo "🔍 Ver estado de contenedores:"
echo "   docker ps"
echo ""
echo "🧹 Limpiar todo:"
echo "   docker-compose down -v && docker system prune -f"
echo ""

print_status "✅ Entorno de desarrollo listo!"
print_status "💡 Ahora puedes ejecutar tus microservicios localmente con:"
echo "   pnpm run dev"
echo ""
print_status "🎯 Los microservicios se conectarán automáticamente a la infraestructura Docker"
