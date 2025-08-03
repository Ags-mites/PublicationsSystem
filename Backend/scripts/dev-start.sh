#!/bin/bash

echo "🚀 Starting all microservices in development mode..."

# Function to setup and start a service
start_service() {
    local service_dir=$1
    local service_name=$2
    
    echo "🚀 Setting up $service_name..."
    cd "$service_dir"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies for $service_name..."
        pnpm install
    fi
    
    # Generate Prisma Client if schema exists
    if [ -f "prisma/schema.prisma" ]; then
        echo "🗄️  Generating Prisma Client for $service_name..."
        pnpm run prisma:generate
        
        echo "📊 Running database migrations for $service_name..."
        pnpm run prisma:deploy
    fi
    
    echo "🚀 Starting $service_name..."
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
sleep 15

# Wait for databases to be ready
echo "🗄️  Waiting for databases to be ready..."
for i in {1..30}; do
    auth_ready=$(timeout 1 bash -c 'cat < /dev/null > /dev/tcp/localhost/26257' 2>/dev/null && echo "ready" || echo "not ready")
    pub_ready=$(timeout 1 bash -c 'cat < /dev/null > /dev/tcp/localhost/26258' 2>/dev/null && echo "ready" || echo "not ready")
    cat_ready=$(timeout 1 bash -c 'cat < /dev/null > /dev/tcp/localhost/26259' 2>/dev/null && echo "ready" || echo "not ready")
    not_ready=$(timeout 1 bash -c 'cat < /dev/null > /dev/tcp/localhost/26260' 2>/dev/null && echo "ready" || echo "not ready")
    
    if [[ "$auth_ready" == "ready" && "$pub_ready" == "ready" && "$cat_ready" == "ready" && "$not_ready" == "ready" ]]; then
        echo "✅ All databases are ready!"
        break
    fi
    echo "⏳ Waiting for databases... ($i/30)"
    sleep 2
done

# Start consul service
echo "🔍 Starting Consul service..."
cd consul-service
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies for Consul service..."
    pnpm install
fi
pnpm run dev &
CONSUL_PID=$!
cd ..

# Wait for consul to be ready
sleep 5

# Start all microservices with proper setup
start_service "services/auth-service" "Auth Service"
sleep 3

start_service "services/publications-service" "Publications Service"
sleep 3

start_service "services/catalog-service" "Catalog Service"
sleep 3

start_service "services/notifications-service" "Notifications Service"
sleep 3

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