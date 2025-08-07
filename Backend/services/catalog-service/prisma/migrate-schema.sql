-- Create cat_schema in CockroachDB
CREATE SCHEMA IF NOT EXISTS cat_schema;

-- Grant permissions to the catalog user
GRANT USAGE ON SCHEMA cat_schema TO catalog;
GRANT CREATE ON SCHEMA cat_schema TO catalog;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cat_schema TO catalog;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA cat_schema TO catalog;

-- Set default schema for the catalog user
ALTER USER catalog SET search_path TO cat_schema, public; 