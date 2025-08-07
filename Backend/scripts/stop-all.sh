#!/bin/bash

echo "🛑 Deteniendo todos los servicios..."

# Detener servicios de microservicios (buscar procesos de node)
echo "🔧 Deteniendo microservicios..."
pkill -f "start:dev" || true
pkill -f "ts-node" || true
pkill -f "nodemon" || true

# Detener docker-compose
echo "🐳 Deteniendo contenedores Docker..."
docker-compose down

echo ""
echo "✅ Todos los servicios han sido detenidos!"
echo ""
echo "🧹 Para limpiar completamente:"
echo "   - docker system prune -f"
echo "   - rm -rf node_modules (en cada servicio si es necesario)" 