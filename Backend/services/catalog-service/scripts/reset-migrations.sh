#!/bin/bash

echo "🚀 Reseteando migraciones para todos los microservicios..."

services=("auth-service" "publications-service" "catalog-service" "notifications-service")

for service in "${services[@]}"; do
    echo "🔧 Reseteando migraciones para $service..."
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
    
    # Resetear migraciones
    echo "🔄 Reseteando migraciones para $service..."
    pnpm run prisma:migrate:reset
    
    echo "✅ Migraciones reseteadas exitosamente para $service"
    echo ""
    cd ../..
done

echo "✅ Reset de migraciones completado para todos los servicios"
