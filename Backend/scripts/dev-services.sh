#!/bin/bash

# Script para ejecutar microservicios en modo desarrollo
# Uso: ./scripts/dev-services.sh [service-name]

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

# Servicios disponibles
SERVICES=("auth-service" "publications-service" "catalog-service" "notifications-service" "gateway-service")

# Función para ejecutar un servicio específico
run_service() {
    local service=$1
    local service_path="services/$service"
    
    if [ ! -d "$service_path" ]; then
        print_error "Servicio '$service' no encontrado en $service_path"
        return 1
    fi
    
    print_status "🚀 Iniciando $service en modo desarrollo..."
    cd "$service_path"
    
    # Verificar si tiene .env
    if [ ! -f ".env" ]; then
        print_warning "No se encontró archivo .env para $service"
        print_warning "Asegúrate de configurar las variables de entorno"
    fi
    
    # Ejecutar en modo desarrollo
    pnpm run start:dev
}

# Función para ejecutar todos los servicios
run_all_services() {
    print_step "🚀 Iniciando todos los microservicios en modo desarrollo..."
    
    # Crear un array de comandos para ejecutar en paralelo
    local commands=()
    for service in "${SERVICES[@]}"; do
        commands+=("cd services/$service && pnpm run start:dev")
    done
    
    # Ejecutar todos los servicios en paralelo
    print_status "Ejecutando servicios en paralelo..."
    print_status "Presiona Ctrl+C para detener todos los servicios"
    
    # Usar concurrently si está disponible, sino usar background processes
    if command -v concurrently &> /dev/null; then
        concurrently "${commands[@]}"
    else
        # Fallback: ejecutar en background
        for service in "${SERVICES[@]}"; do
            print_status "Iniciando $service..."
            cd "services/$service" && pnpm run start:dev &
        done
        
        # Esperar a que todos los procesos terminen
        wait
    fi
}

# Función para mostrar ayuda
show_help() {
    echo "Uso: $0 [OPCIÓN]"
    echo ""
    echo "Opciones:"
    echo "  [service-name]  Ejecutar un servicio específico"
    echo "  all             Ejecutar todos los servicios"
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
    echo ""
    echo "💡 Asegúrate de que la infraestructura esté corriendo:"
    echo "   pnpm run dev:only"
}

# Verificar que la infraestructura esté corriendo
check_infrastructure() {
    print_status "Verificando que la infraestructura esté corriendo..."
    
    if ! docker ps --format "table {{.Names}}" | grep -q "cockroachdb"; then
        print_error "❌ CockroachDB no está corriendo"
        print_error "Ejecuta primero: pnpm run dev:only"
        exit 1
    fi
    
    if ! docker ps --format "table {{.Names}}" | grep -q "rabbitmq"; then
        print_error "❌ RabbitMQ no está corriendo"
        print_error "Ejecuta primero: pnpm run dev:only"
        exit 1
    fi
    
    if ! docker ps --format "table {{.Names}}" | grep -q "consul"; then
        print_error "❌ Consul no está corriendo"
        print_error "Ejecuta primero: pnpm run dev:only"
        exit 1
    fi
    
    print_status "✅ Infraestructura verificada"
}

# Procesar argumentos
if [ $# -eq 0 ]; then
    print_warning "No se especificó ningún servicio. Mostrando ayuda..."
    echo ""
    show_help
    exit 0
elif [ "$1" = "help" ] || [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
elif [ "$1" = "all" ]; then
    check_infrastructure
    run_all_services
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
        check_infrastructure
        run_service "$1"
    else
        print_error "Servicio '$1' no encontrado"
        echo ""
        show_help
        exit 1
    fi
fi
