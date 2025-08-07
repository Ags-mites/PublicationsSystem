#!/bin/bash

echo "🗄️  Creando bases de datos independientes para cada microservicio..."

# Esperar a que CockroachDB esté listo
echo "⏳ Esperando a que CockroachDB esté listo..."
for i in {1..30}; do
    db_ready=$(timeout 1 bash -c "cat < /dev/null > /dev/tcp/localhost/26257" 2>/dev/null && echo "ready" || echo "not ready")
    if [[ "$db_ready" == "ready" ]]; then
        echo "✅ CockroachDB está listo!"
        break
    fi
    echo "⏳ Esperando CockroachDB... ($i/30)"
    sleep 2
done

# Crear bases de datos independientes para cada microservicio
echo "🔧 Creando bases de datos independientes..."

docker exec -i cockroachdb ./cockroach sql --insecure --execute="
  -- Crear base de datos para Auth Service
  CREATE DATABASE IF NOT EXISTS auth_db;
  
  -- Crear base de datos para Publications Service
  CREATE DATABASE IF NOT EXISTS publications_db;
  
  -- Crear base de datos para Catalog Service
  CREATE DATABASE IF NOT EXISTS catalog_db;
  
  -- Crear base de datos para Notifications Service
  CREATE DATABASE IF NOT EXISTS notifications_db;
  
  -- Grant permissions to root user
  GRANT ALL ON DATABASE auth_db TO root;
  GRANT ALL ON DATABASE publications_db TO root;
  GRANT ALL ON DATABASE catalog_db TO root;
  GRANT ALL ON DATABASE notifications_db TO root;
  
  -- Show created databases
  SHOW DATABASES;
"

echo ""
echo "✅ Bases de datos creadas exitosamente!"
echo ""
echo "🌐 URLs de Base de Datos:"
echo "🔐 Auth Service: postgresql://root@localhost:26257/auth_db?sslmode=disable"
echo "📚 Publications Service: postgresql://root@localhost:26257/publications_db?sslmode=disable"
echo "📖 Catalog Service: postgresql://root@localhost:26257/catalog_db?sslmode=disable"
echo "🔔 Notifications Service: postgresql://root@localhost:26257/notifications_db?sslmode=disable"
echo ""
echo "🔍 CockroachDB Admin UI: http://localhost:8080" 