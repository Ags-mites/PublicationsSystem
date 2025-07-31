#!/bin/bash

echo "🚀 Starting all microservices in development mode..."

# Function to start a service in the background
start_service() {
    local service_dir=$1
    local service_name=$2
    
    echo "🚀 Starting $service_name..."
    cd "$service_dir"
    pnpm run start:dev &
    SERVICE_PID=$!
    echo "✅ $service_name started with PID $SERVICE_PID"
    cd - > /dev/null
}

# Start infrastructure first
echo "🏗️  Starting infrastructure services..."
docker-compose up -d

# Wait for infrastructure to be ready
echo "⏳ Waiting for infrastructure services to be ready..."
sleep 10

# Start consul service
echo "🔍 Starting Consul service..."
cd consul-service
pnpm run dev &
CONSUL_PID=$!
cd ..

# Wait for consul to be ready
sleep 5

# Start all microservices
start_service "services/auth-service" "Auth Service"
sleep 2

start_service "services/publications-service" "Publications Service"
sleep 2

start_service "services/catalog-service" "Catalog Service"
sleep 2

start_service "services/notifications-service" "Notifications Service"
sleep 2

start_service "services/gateway-service" "Gateway Service"

echo ""
echo "✅ All services started successfully!"
echo ""
echo "🌐 Service URLs:"
echo "🚀 API Gateway: http://localhost:3000"
echo "🔐 Auth Service: http://localhost:3001"
echo "📚 Publications Service: http://localhost:3002"
echo "📖 Catalog Service: http://localhost:3003"
echo "🔔 Notifications Service: http://localhost:3004"
echo "🔍 Consul Service: http://localhost:8501"
echo ""
echo "📚 Documentation:"
echo "🚀 Gateway Docs: http://localhost:3000/api/docs"
echo "🔍 Consul UI: http://localhost:8500"
echo "🐰 RabbitMQ Management: http://localhost:15672 (admin/admin123)"
echo "🪳 CockroachDB Admin: http://localhost:8080"
echo ""
echo "⚠️  Press Ctrl+C to stop all services"

# Keep script running and handle cleanup
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    
    # Kill all background processes
    jobs -p | xargs -r kill
    
    # Stop docker services
    docker-compose down
    
    echo "✅ All services stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for user interrupt
wait 