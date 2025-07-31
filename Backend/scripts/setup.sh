#!/bin/bash

echo "🚀 Setting up NestJS Microservices Monorepo..."

# Install root dependencies
echo "📦 Installing root dependencies..."
pnpm install

# Install NestJS CLI globally if not present
if ! command -v nest &> /dev/null; then
    echo "🔧 Installing NestJS CLI globally..."
    pnpm install -g @nestjs/cli
fi

# Install dependencies for each service
echo "📦 Installing service dependencies..."

services=("auth-service" "publications-service" "catalog-service" "notifications-service" "gateway-service")

for service in "${services[@]}"; do
    echo "📦 Installing dependencies for $service..."
    cd "services/$service"
    pnpm install
    cd ../..
done

# Install consul service dependencies
echo "📦 Installing consul service dependencies..."
cd consul-service
pnpm install
cd ..

echo "✅ Setup complete!"
echo ""
echo "🚀 Next steps:"
echo "1. Run 'pnpm run docker:up' to start infrastructure services"
echo "2. Run 'pnpm run dev' to start all microservices"
echo "3. Visit http://localhost:3000/api/docs for API documentation" 