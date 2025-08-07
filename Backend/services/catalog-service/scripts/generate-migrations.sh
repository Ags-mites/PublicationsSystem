#!/bin/bash

echo "🚀 Generando migraciones para todos los microservicios..."

services=("auth-service" "publications-service" "catalog-service" "notifications-service")

for service in "${services[@]}"; do
    echo "🔧 Generando migración para $service..."
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
    
    # Generar migración
    echo "🔄 Generando migración para $service..."
    pnpm run prisma:migrate
    
    echo "✅ Migración generada exitosamente para $service"
    echo ""
    cd ../..
done

echo "✅ Generación de migraciones completada para todos los servicios"
