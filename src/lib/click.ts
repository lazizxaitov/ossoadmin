import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

export type ClickParams = Record<string, string>;

export const CLICK_ERRORS = {
  success: { error: 0, error_note: "Success" },
  sign: { error: -1, error_note: "SIGN CHECK FAILED" },
  amount: { error: -2, error_note: "Incorrect parameter amount" },
  action: { error: -3, error_note: "Action not found" },
  paid: { error: -4, error_note: "Already paid" },
  order: { error: -5, error_note: "Order does not exist" },
  transaction: { error: -6, error_note: "Transaction does not exist" },
  request: { error: -8, error_note: "Error in request from Click" },
  cancelled: { error: -9, error_note: "Transaction cancelled" },
} as const;

export function clickIsConfigured() {
  return Boolean(
    process.env.CLICK_SERVICE_ID?.trim() &&
      process.env.CLICK_MERCHANT_ID?.trim() &&
      process.env.CLICK_SECRET_KEY?.trim(),
  );
}

export function buildClickPaymentUrl(orderId: string, amount: number) {
  if (!clickIsConfigured()) throw new Error("Оплата Click ещё не настроена на сервере.");
  const url = new URL(process.env.CLICK_PAYMENT_URL?.trim() || "https://my.click.uz/services/pay");
  url.searchParams.set("service_id", process.env.CLICK_SERVICE_ID!.trim());
  url.searchParams.set("merchant_id", process.env.CLICK_MERCHANT_ID!.trim());
  if (process.env.CLICK_MERCHANT_USER_ID?.trim()) {
    url.searchParams.set("merchant_user_id", process.env.CLICK_MERCHANT_USER_ID.trim());
  }
  url.searchParams.set("amount", amount.toFixed(2));
  url.searchParams.set("transaction_param", orderId);
  if (process.env.CLICK_RETURN_URL?.trim()) {
    url.searchParams.set("return_url", process.env.CLICK_RETURN_URL.trim());
  }
  return url.toString();
}

export async function readClickParams(request: Request): Promise<ClickParams> {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = (await request.json()) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(body).map(([key, value]) => [key, String(value ?? "")]));
  }
  const form = await request.formData();
  return Object.fromEntries(Array.from(form.entries()).map(([key, value]) => [key, String(value)]));
}

export function hasClickFields(params: ClickParams, complete = false) {
  const fields = [
    "click_trans_id",
    "service_id",
    "click_paydoc_id",
    "merchant_trans_id",
    "amount",
    "action",
    "error",
    "error_note",
    "sign_time",
    "sign_string",
  ];
  if (complete) fields.push("merchant_prepare_id");
  return fields.every((field) => params[field] !== undefined && params[field] !== "");
}

export function verifyClickSignature(params: ClickParams, complete = false) {
  const secret = process.env.CLICK_SECRET_KEY?.trim();
  const serviceId = process.env.CLICK_SERVICE_ID?.trim();
  if (!secret || !serviceId || params.service_id !== serviceId) return false;
  const source = [
    params.click_trans_id,
    params.service_id,
    secret,
    params.merchant_trans_id,
    ...(complete ? [params.merchant_prepare_id] : []),
    params.amount,
    params.action,
    params.sign_time,
  ].join("");
  const expected = createHash("md5").update(source, "utf8").digest("hex");
  const actual = params.sign_string.toLowerCase();
  if (!/^[a-f0-9]{32}$/.test(actual)) return false;
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(actual, "hex"));
}

export function sameClickAmount(value: string, total: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && Math.round(parsed * 100) === total * 100;
}

export function clickResponse(params: ClickParams, result: { error: number; error_note: string }, id?: number, complete = false) {
  return Response.json({
    click_trans_id: params.click_trans_id || "",
    merchant_trans_id: params.merchant_trans_id || "",
    ...(complete ? { merchant_confirm_id: id ?? 0 } : { merchant_prepare_id: id ?? 0 }),
    ...result,
  });
}
