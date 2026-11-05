#!/usr/bin/env bash
# Выкатка/обновление на droplet. Запускать на сервере в /var/www/ossoadmin.
set -euo pipefail
cd /var/www/ossoadmin
[ -f .env ] || { echo "Нет .env — создайте из env.example"; exit 1; }
npm ci
npm run build
pm2 startOrReload ecosystem.config.cjs --env production
pm2 save
