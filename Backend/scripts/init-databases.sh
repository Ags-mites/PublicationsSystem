#!/bin/bash

echo "🗄️  Initializing databases for all microservices..."

# Function to initialize database for a service
init_database() {
    local service_dir=$1
    local service_name=$2
    local db_port=$3
    local db_name=$4
    
    echo "🔧 Initializing database for $service_name..."
    
    # Wait for database to be ready
    echo "⏳ Waiting for $service_name database on port $db_port..."
    for i in {1..30}; do
        db_ready=$(timeout 1 bash -c "cat < /dev/null > /dev/tcp/localhost/$db_port" 2>/dev/null && echo "ready" || echo "not ready")
        if [[ "$db_ready" == "ready" ]]; then
            echo "✅ Database for $service_name is ready!"
            break
        fi
        echo "⏳ Waiting for database... ($i/30)"
        sleep 2
    done
    
    cd "$service_dir"
    
    # Create database if it doesn't exist (we'll let Prisma handle this)
    echo "📊 Database will be created by Prisma migrations..."
    
    # Generate Prisma Client
    echo "🗄️  Generating Prisma Client for $service_name..."
    pnpm run prisma:generate
    
    # Deploy migrations
    echo "📊 Deploying migrations for $service_name..."
    pnpm run prisma:deploy
    
    echo "✅ Database initialization completed for $service_name"
    cd - > /dev/null
}

# Make sure Docker services are running
echo "🏗️  Starting infrastructure services..."
docker-compose up -d

# Wait for infrastructure to be ready
echo "⏳ Waiting for infrastructure services to be ready..."
sleep 15

# Initialize databases for each service
init_database "services/auth-service" "Auth Service" "26257" "auth_db"
init_database "services/publications-service" "Publications Service" "26258" "publications_db"
init_database "services/catalog-service" "Catalog Service" "26259" "catalog_db"
init_database "services/notifications-service" "Notifications Service" "26260" "notifications_db"

echo ""
echo "✅ All databases initialized successfully!"
echo ""
echo "🌐 Database URLs:"
echo "🔐 Auth DB: postgresql://root@localhost:26257/auth_db"
echo "📚 Publications DB: postgresql://root@localhost:26258/publications_db"
echo "📖 Catalog DB: postgresql://root@localhost:26259/catalog_db"
echo "🔔 Notifications DB: postgresql://root@localhost:26260/notifications_db"