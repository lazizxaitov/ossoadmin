import "server-only";

import { db } from "@/lib/db";

export type CardPaymentMode = "click" | "link";

export function getPaymentSettings() {
  const rows = db.prepare("SELECT key,value FROM store_settings WHERE key IN ('card_payment_mode','card_payment_url')").all() as Array<{ key: string; value: string }>;
  const values = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return {
    cardPaymentMode: (values.card_payment_mode === "link" ? "link" : "click") as CardPaymentMode,
    cardPaymentUrl: values.card_payment_url || "",
  };
}

export function validatePaymentLink(value: string) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("Укажите ссылку для оплаты картой.");
  const url = new URL(trimmed);
  if (url.protocol !== "https:") throw new Error("Ссылка оплаты должна начинаться с https://");
  return url.toString();
}

export function savePaymentSettings(mode: CardPaymentMode, rawUrl: string) {
  if (!(["click", "link"] as string[]).includes(mode)) throw new Error("Некорректный режим оплаты картой.");
  const url = mode === "link" ? validatePaymentLink(rawUrl) : rawUrl.trim();
  db.transaction(() => {
    db.prepare("UPDATE store_settings SET value=?,updated_at=CURRENT_TIMESTAMP WHERE key='card_payment_mode'").run(mode);
    db.prepare("UPDATE store_settings SET value=?,updated_at=CURRENT_TIMESTAMP WHERE key='card_payment_url'").run(url);
  })();
  return getPaymentSettings();
}
