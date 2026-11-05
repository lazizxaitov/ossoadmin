import "server-only";
import { db } from "@/lib/db";

type Promo={id:string;code:string;discountType:"percent"|"fixed"|"free_delivery";discountValue:number;minOrder:number;usageLimit:number|null;usedCount:number};
export function calculatePromo(code:string,subtotal:number,deliveryFee=35000){
 const normalized=code.trim().toUpperCase();if(!normalized)return {promo:null,discount:0,deliveryFee,total:subtotal+deliveryFee};
 const promo=db.prepare(`SELECT id,code,discount_type discountType,discount_value discountValue,min_order minOrder,usage_limit usageLimit,used_count usedCount FROM promos WHERE code=? COLLATE NOCASE AND active=1 AND (starts_at IS NULL OR starts_at<=CURRENT_TIMESTAMP) AND (ends_at IS NULL OR ends_at>=CURRENT_TIMESTAMP)`).get(normalized) as Promo|undefined;
 if(!promo)throw new Error("Промокод не найден или срок его действия завершён.");if(promo.usageLimit!==null&&promo.usedCount>=promo.usageLimit)throw new Error("Лимит использования промокода исчерпан.");if(subtotal<promo.minOrder)throw new Error(`Минимальная сумма заказа для промокода: ${promo.minOrder}.`);
 const discount=promo.discountType==="percent"?Math.round(subtotal*Math.min(100,promo.discountValue)/100):promo.discountType==="fixed"?Math.min(subtotal,promo.discountValue):0;if(promo.discountType==="free_delivery")deliveryFee=0;return {promo,discount,deliveryFee,total:Math.max(0,subtotal-discount)+deliveryFee};
}
