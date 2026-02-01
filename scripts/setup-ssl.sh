#!/bin/bash

#############################################
# SSL Certificate Setup Script
# Obtains SSL certificates using Certbot
#############################################

set -e

DOMAIN=$1
EMAIL=$2

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "Usage: $0 <domain> <email>"
    echo "Example: $0 api.staging.flow.afronix.com admin@afronix.com"
    exit 1
fi

echo "🔒 Setting up SSL certificate for $DOMAIN"

# Check if certificate already exists
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo "✅ Certificate already exists for $DOMAIN"
    echo "🔄 Renewing certificate..."
    docker compose run --rm certbot renew
else
    echo "📝 Obtaining new certificate for $DOMAIN..."
    docker compose run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        -d $DOMAIN
fi

echo "✅ SSL certificate setup complete!"
echo "🔄 Reloading Nginx..."
docker compose exec nginx nginx -s reload

echo "✅ Done! Your site is now secured with HTTPS"
