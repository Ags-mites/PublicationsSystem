#!/bin/bash

echo "🚀 Sembrando datos para todos los microservicios..."

services=("auth-service" "publications-service" "catalog-service" "notifications-service")

for service in "${services[@]}"; do
    echo "🔧 Sembrando datos para $service..."
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
    
    # Verificar si existe el script de seed
    if [ ! -f "prisma/seed.ts" ]; then
        echo "⚠️  No se encontró script de seed en $service, saltando..."
        cd ../..
        continue
    fi
    
    # Sembrar datos
    echo "🔄 Sembrando datos para $service..."
    pnpm run prisma:seed
    
    echo "✅ Datos sembrados exitosamente para $service"
    echo ""
    cd ../..
done

echo "✅ Sembrado de datos completado para todos los servicios"
