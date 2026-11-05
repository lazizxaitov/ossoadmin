import "server-only";

import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";

const dataDirectory = path.join(process.cwd(), "data");
mkdirSync(dataDirectory, { recursive: true });

const globalForDb = globalThis as unknown as { ossoDb?: Database.Database };

export const db = globalForDb.ossoDb ?? new Database(path.join(dataDirectory, "osso-admin.sqlite"));

if (process.env.NODE_ENV !== "production") globalForDb.ossoDb = db;

db.pragma("busy_timeout = 10000");
try { db.pragma("journal_mode = WAL"); } catch { /* Другой build-worker уже включает WAL. */ }
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    image_url TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    sku TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name TEXT NOT NULL,
    brand TEXT NOT NULL DEFAULT 'OSSO Home',
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    description TEXT NOT NULL DEFAULT '',
    price INTEGER NOT NULL DEFAULT 0 CHECK(price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
    status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('active','draft')),
    image_url TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT,
    address TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    number TEXT NOT NULL UNIQUE,
    customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    address TEXT NOT NULL DEFAULT '',
    total INTEGER NOT NULL DEFAULT 0 CHECK(total >= 0),
    status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','assembling','delivery','completed','cancelled')),
    note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT,
    source TEXT NOT NULL CHECK(source IN ('admin','crm')),
    name TEXT NOT NULL,
    sku TEXT NOT NULL,
    price INTEGER NOT NULL CHECK(price >= 0),
    quantity INTEGER NOT NULL CHECK(quantity > 0)
  );

  CREATE TABLE IF NOT EXISTS promos (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE COLLATE NOCASE,
    description TEXT NOT NULL DEFAULT '',
    discount_type TEXT NOT NULL CHECK(discount_type IN ('percent','fixed','free_delivery')),
    discount_value INTEGER NOT NULL DEFAULT 0 CHECK(discount_value >= 0),
    min_order INTEGER NOT NULL DEFAULT 0 CHECK(min_order >= 0),
    usage_limit INTEGER,
    used_count INTEGER NOT NULL DEFAULT 0,
    starts_at TEXT,
    ends_at TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    login TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK(role IN ('owner','admin','manager')),
    password_hash TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS login_attempts (
    key TEXT PRIMARY KEY,
    attempts INTEGER NOT NULL DEFAULT 0,
    blocked_until INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS click_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    click_trans_id TEXT NOT NULL UNIQUE,
    click_paydoc_id TEXT,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'prepared' CHECK(state IN ('prepared','completed','cancelled')),
    click_error INTEGER NOT NULL DEFAULT 0,
    click_error_note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS click_transactions_order_id_idx
    ON click_transactions(order_id);

  CREATE TABLE IF NOT EXISTS store_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

function ensureColumn(table:string,column:string,definition:string){const columns=db.prepare(`PRAGMA table_info(${table})`).all() as Array<{name:string}>;if(!columns.some(item=>item.name===column)){try{db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);}catch(error){if(!(error instanceof Error)||!error.message.includes("duplicate column"))throw error;}}}
ensureColumn("customers","password_hash","TEXT");
ensureColumn("customers","active","INTEGER NOT NULL DEFAULT 1");
ensureColumn("orders","promo_code","TEXT");
ensureColumn("orders","discount","INTEGER NOT NULL DEFAULT 0");
ensureColumn("orders","delivery_fee","INTEGER NOT NULL DEFAULT 35000");
ensureColumn("orders","payment_method","TEXT NOT NULL DEFAULT 'cash'");
ensureColumn("orders","payment_status","TEXT NOT NULL DEFAULT 'unpaid'");
ensureColumn("orders","payment_provider","TEXT NOT NULL DEFAULT 'cash'");
db.prepare("UPDATE orders SET payment_method='card',payment_provider='click' WHERE payment_method='click'").run();
db.prepare("INSERT OR IGNORE INTO store_settings (key,value) VALUES ('card_payment_mode','click')").run();
db.prepare("INSERT OR IGNORE INTO store_settings (key,value) VALUES ('card_payment_url','')").run();

export function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function asBoolean(value: unknown) {
  return value === true || value === 1;
}
