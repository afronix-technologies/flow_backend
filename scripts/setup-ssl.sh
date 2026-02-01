#!/bin/bash

#############################################
# SSL Certificate Initialization Script
# Bootstraps SSL with dummy certs -> Certbot
#############################################

set -e

DOMAIN=$1
EMAIL=$2
ENV_FILE=$3

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ] || [ -z "$ENV_FILE" ]; then
    echo "Usage: $0 <domain> <email> <env_file>"
    echo "Example: $0 api.staging.flow.afronix.com admin@afronix.com .env.staging"
    exit 1
fi

data_path="./nginx/ssl"

if [ -d "$data_path/live/$DOMAIN" ]; then
    echo "✅ SSL certificates already exist for $DOMAIN"
    exit 0
fi

echo "🔒 Initializing SSL for $DOMAIN..."

if [ ! -e "$data_path/options-ssl-nginx.conf" ] || [ ! -e "$data_path/ssl-dhparams.pem" ]; then
    echo "📥 Downloading recommended TLS parameters..."
    mkdir -p "$data_path"
    curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/options-ssl-nginx.conf"
    curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/ssl-dhparams.pem"
fi

echo "🔑 Creating dummy certificate for $DOMAIN path $data_path/live/$DOMAIN"
mkdir -p "$data_path/live/$DOMAIN"
openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "$data_path/live/$DOMAIN/privkey.pem" \
    -out "$data_path/live/$DOMAIN/fullchain.pem" \
    -subj "/CN=localhost"

echo "🚀 Starting Nginx..."
docker compose --env-file $ENV_FILE -f docker-compose.prod.yml up --force-recreate -d nginx

echo "🗑️ Deleting dummy certificate..."
docker compose --env-file $ENV_FILE -f docker-compose.prod.yml exec nginx rm -Rf /etc/nginx/ssl/live/$DOMAIN

echo "📝 Requesting Let's Encrypt certificate for $DOMAIN..."
docker compose --env-file $ENV_FILE -f docker-compose.prod.yml run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d $DOMAIN" certbot

echo "🔄 Reloading Nginx..."
docker compose --env-file $ENV_FILE -f docker-compose.prod.yml exec nginx nginx -s reload

echo "✅ SSL setup completed successfully!"
