#!/bin/bash

echo "🚀 Iniciando todos los servicios en modo desarrollo..."

# Verificar que docker-compose esté corriendo
echo "📋 Verificando infraestructura..."
if ! docker-compose ps | grep -q "cockroachdb.*Up"; then
    echo "⚠️  CockroachDB no está corriendo. Iniciando infraestructura..."
    docker-compose up -d rabbitmq cockroachdb consul
    echo "⏳ Esperando a que la infraestructura esté lista..."
    sleep 10
fi

# Iniciar todos los servicios en desarrollo
echo "🔧 Iniciando servicios de microservicios..."

# Función para iniciar un servicio
start_service() {
    local service=$1
    local service_name=$2
    echo "🚀 Iniciando $service_name..."
    cd "services/$service"
    pnpm run start:dev &
    cd ../..
    echo "✅ $service_name iniciado en background"
}

# Iniciar servicios en paralelo
start_service "auth-service" "Auth Service"
start_service "publications-service" "Publications Service" 
start_service "catalog-service" "Catalog Service"
start_service "notifications-service" "Notifications Service"
start_service "gateway-service" "Gateway Service"

echo ""
echo "✅ Todos los servicios han sido iniciados!"
echo ""
echo "🌐 URLs de los servicios:"
echo "🔐 Auth Service: http://localhost:3001"
echo "📚 Publications Service: http://localhost:3002"
echo "📖 Catalog Service: http://localhost:3003"
echo "🔔 Notifications Service: http://localhost:3004"
echo "🚪 Gateway Service: http://localhost:8080"
echo ""
echo "🔍 Consul UI: http://localhost:8500/ui"
echo "🗄️  CockroachDB Admin: http://localhost:8080"
echo ""
echo "💡 Para detener todos los servicios, presiona Ctrl+C"
echo "💡 Para ver logs: pnpm run docker:logs"

# Mantener el script corriendo
wait 