# OSSO Admin

Админ-панель магазина сантехники OSSO на Next.js 16. Собственные товары,
категории, клиенты, заказы, промокоды и пользователи хранятся в SQLite-файле
`data/osso-admin.sqlite`. Загруженные изображения находятся в `public/uploads`.

## Запуск

```bash
npm install
npm run dev
```

Откройте http://localhost:3000. Development-вход: `admin` / `ossoadmin`.
В production обязательно задайте все `ADMIN_*` переменные из `env.example`.

## OSSO CRM

Каталог CRM загружается через защищённый серверный proxy
`/api/catalog/products`. `CRM_API_URL` должен указывать на полный endpoint,
например `http://localhost:3001/api/store/products`. `CRM_API_KEY` должен
совпадать с `STORE_API_KEY` CRM.
`USD_TO_UZS_RATE` задаёт курс конвертации CRM-цен для мобильной витрины.

## API для мобильного приложения

- `GET /api/mobile/products?source=all|crm|admin`
- `GET /api/mobile/categories`
- `GET /api/mobile/banners`
- `GET /api/mobile/promos`
- `POST /api/mobile/orders`
- `POST /api/mobile/auth/register`
- `POST /api/mobile/auth/login`
- `GET /api/mobile/account/orders`

Мобильное приложение подключено к этим endpoint'ам и использует серверные
цены, остатки и расчёт промокода.

## Онлайн-оплата CLICK

В мобильном приложении доступны два способа: наличные и карта. Для оплаты
картой администратор выбирает в разделе «Настройки» один из режимов:

- `CLICK` — платёжная ссылка формируется для каждого заказа, а статус
  подтверждается callback-запросом CLICK;
- `Ссылка` — открывается заданный администратором HTTPS-адрес, после чего
  менеджер вручную отмечает оплату в таблице заказов.

Заполните `CLICK_SERVICE_ID`, `CLICK_MERCHANT_ID`, `CLICK_SECRET_KEY` и при
необходимости `CLICK_MERCHANT_USER_ID` в `.env`. В кабинете CLICK укажите
публичные HTTPS callback-адреса:

- `https://ваш-домен/api/payments/click/prepare`
- `https://ваш-домен/api/payments/click/complete`

Ключи не передаются в мобильное приложение. Сервер проверяет подпись CLICK,
сумму и заказ, повторные callback-запросы обрабатываются безопасно. Оплаченный
заказ нельзя отменить в панели до оформления возврата через CLICK.

## Production

Нужен сервер с постоянным диском: база SQLite и загруженные файлы не должны
исчезать после перезапуска или деплоя. Для резервного копирования сохраняйте
`data` и `public/uploads`.

Заказы с CRM-товарами резервируют остатки через
`POST /api/store/orders/reserve` в OSSO CRM. При отмене заказа резерв снимается.
