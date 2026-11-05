#!/usr/bin/env bash
# Первичная настройка нового droplet (Ubuntu 22.04/24.04). Запускать от root.
# Использование: ADMIN_DOMAIN=admin.example.uz bash setup-droplet.sh
set -euo pipefail
: "${ADMIN_DOMAIN:?Укажите ADMIN_DOMAIN}"

apt-get update && apt-get install -y nginx certbot python3-certbot-nginx ufw git curl build-essential python3
curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt-get install -y nodejs
npm install -g pm2

# swap — на 1 ГБ RAM иначе next build падает
if ! swapon --show | grep -q swapfile; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw --force enable

mkdir -p /var/www/ossoadmin
sed "s/ADMIN_DOMAIN/$ADMIN_DOMAIN/g" nginx.conf > /etc/nginx/sites-available/ossoadmin
ln -sf /etc/nginx/sites-available/ossoadmin /etc/nginx/sites-enabled/ossoadmin
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
echo "Дальше: DNS A-запись $ADMIN_DOMAIN -> IP droplet, затем: certbot --nginx -d $ADMIN_DOMAIN"
