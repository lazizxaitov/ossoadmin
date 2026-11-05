# Деплой OSSO Admin на отдельный droplet

1. Droplet Ubuntu 24.04, минимум 2 ГБ RAM (или 1 ГБ + swap — скрипт добавит). Включите DO Backups.
2. DNS: A-запись поддомена (например `admin.<домен>`) на IP droplet.
3. `scp -r deploy root@IP:/root/ && ssh root@IP`, затем
   `cd /root/deploy && ADMIN_DOMAIN=admin.<домен> bash setup-droplet.sh`
4. HTTPS: `certbot --nginx -d admin.<домен>`
5. Код в `/var/www/ossoadmin` (git clone или rsync, без `node_modules`, `.next`, `data`).
6. `.env` из `env.example`. Обязательно: `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`,
   `ADMIN_RECOVERY_KEY`, `CUSTOMER_SESSION_SECRET` (длинные случайные: `openssl rand -hex 32`),
   `CLICK_*`, `CLICK_RETURN_URL=https://admin.<домен>/payment/result`.
   `CRM_API_URL` — публичный HTTPS-адрес CRM, `CRM_API_KEY` = `STORE_API_KEY` на сервере CRM
   (на CRM должен быть задан `STORE_API_KEY`, иначе каталог открыт всем).
7. `bash deploy/deploy.sh`
8. Проверка: `https://admin.<домен>/privacy`, `/terms`, `/api/mobile/products`.
9. Бэкап: `data/` и `public/uploads/` (DO Backups + при желании cron с копией на Spaces).
