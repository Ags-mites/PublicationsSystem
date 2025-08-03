#!/bin/bash

echo "🚀 Starting microservices development environment..."

# Function to generate Prisma and start service
start_service_with_prisma() {
    local service_dir=$1
    local service_name=$2
    
    echo "🔧 Setting up $service_name..."
    cd "$service_dir"
    
    # Generate Prisma Client if schema exists
    if [ -f "prisma/schema.prisma" ]; then
        echo "🗄️  Regenerating Prisma Client for $service_name..."
        rm -rf node_modules/.prisma 2>/dev/null || true
        pnpm run prisma:generate > /dev/null 2>&1
        
        echo "📊 Deploying migrations for $service_name..."
        pnpm run prisma:deploy > /dev/null 2>&1
    fi
    
    echo "🚀 Starting $service_name..."
    pnpm run start:dev &
    SERVICE_PID=$!
    echo "✅ $service_name started with PID $SERVICE_PID"
    cd - > /dev/null
}

# Start infrastructure
echo "🏗️  Starting infrastructure..."
docker-compose up -d

# Wait for infrastructure
echo "⏳ Waiting for infrastructure to be ready..."
sleep 20

echo "🗄️  Setting up databases..."

# Setup Auth Service
cd services/auth-service
rm -rf node_modules/.prisma 2>/dev/null || true
pnpm run prisma:generate > /dev/null 2>&1
pnpm run prisma:deploy > /dev/null 2>&1
cd ../..

# Setup Publications Service  
cd services/publications-service
rm -rf node_modules/.prisma 2>/dev/null || true
pnpm run prisma:generate > /dev/null 2>&1
pnpm run prisma:deploy > /dev/null 2>&1
cd ../..

# Setup Catalog Service
cd services/catalog-service  
rm -rf node_modules/.prisma 2>/dev/null || true
pnpm run prisma:generate > /dev/null 2>&1
pnpm run prisma:deploy > /dev/null 2>&1
cd ../..

# Setup Notifications Service
cd services/notifications-service
rm -rf node_modules/.prisma 2>/dev/null || true
pnpm run prisma:generate > /dev/null 2>&1  
pnpm run prisma:deploy > /dev/null 2>&1
cd ../..

echo "✅ All databases initialized!"

# Start Consul Service
echo "🔍 Starting Consul service..."
cd consul-service
pnpm run dev &
CONSUL_PID=$!
cd ..
sleep 3

# Start microservices
start_service_with_prisma "services/auth-service" "Auth Service"
sleep 3

start_service_with_prisma "services/publications-service" "Publications Service"  
sleep 3

start_service_with_prisma "services/catalog-service" "Catalog Service"
sleep 3

start_service_with_prisma "services/notifications-service" "Notifications Service"
sleep 3

start_service_with_prisma "services/gateway-service" "Gateway Service"

echo ""
echo "✅ All services started successfully!"
echo ""
echo "🌐 Service URLs:"
echo "🚀 API Gateway: http://localhost:3000"
echo "🔐 Auth Service: http://localhost:3001"
echo "📚 Publications Service: http://localhost:3002"
echo "📖 Catalog Service: http://localhost:3003"
echo "🔔 Notifications Service: http://localhost:3004"
echo ""
echo "📚 Management URLs:"
echo "🔍 Consul UI: http://localhost:8500"
echo "🐰 RabbitMQ Management: http://localhost:15672 (admin/admin123)"
echo "🗄️  Auth DB: http://localhost:8080"
echo "🗄️  Publications DB: http://localhost:8081"
echo "🗄️  Catalog DB: http://localhost:8082"
echo "🗄️  Notifications DB: http://localhost:8083"
echo ""
echo "⚠️  Press Ctrl+C to stop all services"

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    jobs -p | xargs -r kill
    docker-compose down
    echo "✅ All services stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for user interrupt
wait