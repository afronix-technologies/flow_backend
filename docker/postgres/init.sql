-- Enable UUID extension for ID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schema if using multi-tenancy schemas (Optional)
CREATE SCHEMA IF NOT EXISTS app;

-- Set timezone to UTC
ALTER DATABASE afronix_tracker SET timezone TO 'UTC';
