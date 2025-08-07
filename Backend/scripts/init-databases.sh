#!/bin/bash

echo "🗄️  Inicializando CockroachDB con múltiples esquemas..."

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

# Inicializar base de datos y esquemas
echo "🔧 Creando base de datos y esquemas..."
docker exec -i cockroachdb ./cockroach sql --insecure --execute="
  CREATE DATABASE IF NOT EXISTS defaultdb;
  USE defaultdb;
  CREATE SCHEMA IF NOT EXISTS auth_schema;
  CREATE SCHEMA IF NOT EXISTS pub_schema;
  CREATE SCHEMA IF NOT EXISTS cat_schema;
  CREATE SCHEMA IF NOT EXISTS notif_schema;
  
  -- Grant permissions to root user
  GRANT ALL ON DATABASE defaultdb TO root;
  GRANT ALL ON SCHEMA auth_schema TO root;
  GRANT ALL ON SCHEMA pub_schema TO root;
  GRANT ALL ON SCHEMA cat_schema TO root;
  GRANT ALL ON SCHEMA notif_schema TO root;
  
  -- Show created schemas
  SHOW SCHEMAS;
"

echo ""
echo "✅ Inicialización de base de datos completada!"
echo ""
echo "🌐 URLs de Base de Datos:"
echo "🔐 Auth Service: postgresql://root@localhost:26257/defaultdb?sslmode=disable&search_path=auth_schema"
echo "📚 Publications Service: postgresql://root@localhost:26257/defaultdb?sslmode=disable&search_path=pub_schema"
echo "📖 Catalog Service: postgresql://root@localhost:26257/defaultdb?sslmode=disable&search_path=cat_schema"
echo "🔔 Notifications Service: postgresql://root@localhost:26257/defaultdb?sslmode=disable&search_path=notif_schema"
echo ""
echo "🔍 CockroachDB Admin UI: http://localhost:8080" 