import { CLICK_ERRORS, clickResponse, hasClickFields, readClickParams, sameClickAmount, verifyClickSignature } from "@/lib/click";
import { db } from "@/lib/db";

type Order = { id: string; total: number; status: string; paymentMethod: string; paymentProvider: string; paymentStatus: string };
type Transaction = { id: number; clickTransId: string; orderId: string; state: string };

export async function POST(request: Request) {
  let params: Awaited<ReturnType<typeof readClickParams>> = {};
  try {
    params = await readClickParams(request);
    if (!hasClickFields(params, true)) return clickResponse(params, CLICK_ERRORS.request, undefined, true);
    if (!verifyClickSignature(params, true)) return clickResponse(params, CLICK_ERRORS.sign, undefined, true);
    if (params.action !== "1") return clickResponse(params, CLICK_ERRORS.action, undefined, true);

    const prepareId = Number(params.merchant_prepare_id);
    const transaction = db.prepare(`SELECT id,click_trans_id clickTransId,order_id orderId,state FROM click_transactions WHERE id=?`).get(prepareId) as Transaction | undefined;
    if (!transaction || transaction.clickTransId !== params.click_trans_id || transaction.orderId !== params.merchant_trans_id) {
      return clickResponse(params, CLICK_ERRORS.transaction, undefined, true);
    }
    const order = db.prepare(`SELECT id,total,status,payment_method paymentMethod,payment_provider paymentProvider,payment_status paymentStatus FROM orders WHERE id=?`).get(transaction.orderId) as Order | undefined;
    if (!order || order.paymentMethod !== "card" || order.paymentProvider !== "click") return clickResponse(params, CLICK_ERRORS.order, undefined, true);
    if (!sameClickAmount(params.amount, order.total)) return clickResponse(params, CLICK_ERRORS.amount, undefined, true);

    if (Number(params.error) < 0) {
      db.prepare(`UPDATE click_transactions SET state='cancelled',click_error=?,click_error_note=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND state!='completed'`).run(Number(params.error), params.error_note.slice(0, 500), transaction.id);
      return clickResponse(params, CLICK_ERRORS.cancelled, transaction.id, true);
    }
    if (order.status === "cancelled" || order.paymentStatus === "cancelled" || transaction.state === "cancelled") {
      return clickResponse(params, CLICK_ERRORS.cancelled, transaction.id, true);
    }
    if (order.paymentStatus === "paid" || transaction.state === "completed") {
      return clickResponse(params, CLICK_ERRORS.paid, transaction.id, true);
    }

    db.transaction(() => {
      db.prepare(`UPDATE click_transactions SET state='completed',click_error=0,click_error_note='',updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(transaction.id);
      db.prepare(`UPDATE orders SET payment_status='paid',updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(order.id);
    })();
    return clickResponse(params, CLICK_ERRORS.success, transaction.id, true);
  } catch {
    return clickResponse(params, CLICK_ERRORS.request, undefined, true);
  }
}
