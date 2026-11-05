import { CLICK_ERRORS, clickResponse, hasClickFields, readClickParams, sameClickAmount, verifyClickSignature } from "@/lib/click";
import { db } from "@/lib/db";

type Order = { id: string; total: number; status: string; paymentMethod: string; paymentProvider: string; paymentStatus: string };
type Transaction = { id: number; orderId: string; state: string };

export async function POST(request: Request) {
  let params: Awaited<ReturnType<typeof readClickParams>> = {};
  try {
    params = await readClickParams(request);
    if (!hasClickFields(params)) return clickResponse(params, CLICK_ERRORS.request);
    if (!verifyClickSignature(params)) return clickResponse(params, CLICK_ERRORS.sign);
    if (params.action !== "0") return clickResponse(params, CLICK_ERRORS.action);
    if (Number(params.error) !== 0) return clickResponse(params, CLICK_ERRORS.request);

    const order = db.prepare(`SELECT id,total,status,payment_method paymentMethod,payment_provider paymentProvider,payment_status paymentStatus FROM orders WHERE id=?`).get(params.merchant_trans_id) as Order | undefined;
    if (!order || order.paymentMethod !== "card" || order.paymentProvider !== "click") return clickResponse(params, CLICK_ERRORS.order);
    if (order.status === "cancelled" || order.paymentStatus === "cancelled") return clickResponse(params, CLICK_ERRORS.cancelled);
    if (order.paymentStatus === "paid") return clickResponse(params, CLICK_ERRORS.paid);
    if (!sameClickAmount(params.amount, order.total)) return clickResponse(params, CLICK_ERRORS.amount);

    const existing = db.prepare(`SELECT id,order_id orderId,state FROM click_transactions WHERE click_trans_id=?`).get(params.click_trans_id) as Transaction | undefined;
    if (existing) {
      if (existing.orderId !== order.id || existing.state !== "prepared") return clickResponse(params, CLICK_ERRORS.request);
      return clickResponse(params, CLICK_ERRORS.success, existing.id);
    }

    const result = db.prepare(`INSERT INTO click_transactions (click_trans_id,click_paydoc_id,order_id,amount) VALUES (?,?,?,?)`).run(params.click_trans_id, params.click_paydoc_id, order.id, params.amount);
    return clickResponse(params, CLICK_ERRORS.success, Number(result.lastInsertRowid));
  } catch {
    return clickResponse(params, CLICK_ERRORS.request);
  }
}
