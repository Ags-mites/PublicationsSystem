#!/bin/bash

# Script para construir todos los microservicios Docker
# Uso: ./scripts/docker-build.sh [service-name]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Verificar que estamos en el directorio raíz del proyecto
if [ ! -f "pnpm-lock.yaml" ]; then
    print_error "Este script debe ejecutarse desde la raíz del proyecto (donde está pnpm-lock.yaml)"
    exit 1
fi

# Servicios disponibles
SERVICES=("auth-service" "publications-service" "catalog-service" "notifications-service" "gateway-service")

# Función para construir un servicio específico
build_service() {
    local service=$1
    local dockerfile_path="services/$service/Dockerfile"
    
    if [ ! -f "$dockerfile_path" ]; then
        print_error "Dockerfile no encontrado para $service en $dockerfile_path"
        return 1
    fi
    
    print_status "Construyendo $service..."
    docker build \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        -f "$dockerfile_path" \
        -t "$service:latest" \
        .
    
    if [ $? -eq 0 ]; then
        print_status "$service construido exitosamente"
    else
        print_error "Error construyendo $service"
        return 1
    fi
}

# Función para construir todos los servicios
build_all_services() {
    print_status "Construyendo todos los microservicios..."
    
    for service in "${SERVICES[@]}"; do
        if ! build_service "$service"; then
            print_error "Error construyendo $service. Abortando..."
            exit 1
        fi
    done
    
    print_status "Todos los servicios construidos exitosamente"
}

# Función para mostrar ayuda
show_help() {
    echo "Uso: $0 [OPCIÓN]"
    echo ""
    echo "Opciones:"
    echo "  [service-name]  Construir un servicio específico"
    echo "  all             Construir todos los servicios"
    echo "  help            Mostrar esta ayuda"
    echo ""
    echo "Servicios disponibles:"
    for service in "${SERVICES[@]}"; do
        echo "  - $service"
    done
    echo ""
    echo "Ejemplos:"
    echo "  $0 auth-service"
    echo "  $0 all"
}

# Procesar argumentos
if [ $# -eq 0 ]; then
    print_warning "No se especificó ningún servicio. Construyendo todos los servicios..."
    build_all_services
elif [ "$1" = "help" ] || [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
elif [ "$1" = "all" ]; then
    build_all_services
else
    # Verificar si el servicio existe
    service_found=false
    for service in "${SERVICES[@]}"; do
        if [ "$1" = "$service" ]; then
            service_found=true
            break
        fi
    done
    
    if [ "$service_found" = true ]; then
        build_service "$1"
    else
        print_error "Servicio '$1' no encontrado"
        echo ""
        show_help
        exit 1
    fi
fi

print_status "Proceso completado"
