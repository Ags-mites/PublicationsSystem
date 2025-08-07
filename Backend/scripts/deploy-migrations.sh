#!/bin/bash

echo "🚀 Desplegando migraciones para todos los microservicios..."

services=("auth-service" "publications-service" "catalog-service" "notifications-service")

for service in "${services[@]}"; do
    echo "🔧 Desplegando migraciones para $service..."
    cd "services/$service"
    
    # Verificar si existe el directorio prisma
    if [ ! -d "prisma" ]; then
        echo "⚠️  No se encontró directorio prisma en $service, saltando..."
        cd ../..
        continue
    fi
    
    # Verificar si existe schema.prisma
    if [ ! -f "prisma/schema.prisma" ]; then
        echo "⚠️  No se encontró schema.prisma en $service, saltando..."
        cd ../..
        continue
    fi
    
    # Desplegar migraciones
    echo "🔄 Desplegando migraciones para $service..."
    pnpm run prisma:deploy
    
    echo "✅ Migraciones desplegadas exitosamente para $service"
    echo ""
    cd ../..
done

echo "✅ Despliegue de migraciones completado para todos los servicios" 