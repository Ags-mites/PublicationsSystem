#!/bin/bash

echo "🔄 Regenerating Prisma Clients for all services..."

# Function to regenerate Prisma Client for a service
regenerate_prisma() {
    local service_dir=$1
    local service_name=$2
    
    echo "🗄️  Regenerating Prisma Client for $service_name..."
    cd "$service_dir"
    
    if [ -f "prisma/schema.prisma" ]; then
        # Clean old Prisma Client
        rm -rf node_modules/.prisma 2>/dev/null || true
        
        # Generate new Prisma Client
        pnpm run prisma:generate
        
        echo "✅ Prisma Client regenerated for $service_name"
    else
        echo "⚠️  No Prisma schema found for $service_name"
    fi
    
    cd - > /dev/null
}

# Regenerate for all services
regenerate_prisma "services/auth-service" "Auth Service"
regenerate_prisma "services/publications-service" "Publications Service"
regenerate_prisma "services/catalog-service" "Catalog Service"
regenerate_prisma "services/notifications-service" "Notifications Service"

echo ""
echo "✅ All Prisma Clients regenerated successfully!"
echo ""
echo "💡 You can now run 'pnpm run dev:simple' to start all services."