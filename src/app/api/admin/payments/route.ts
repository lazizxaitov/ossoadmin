import { NextResponse } from "next/server";
import { clickIsConfigured } from "@/lib/click";
import { getPaymentSettings, savePaymentSettings, type CardPaymentMode } from "@/lib/payment-settings";

export async function GET() {
  return NextResponse.json({ ...getPaymentSettings(), clickConfigured: clickIsConfigured() });
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const settings = savePaymentSettings(String(body.cardPaymentMode) as CardPaymentMode, String(body.cardPaymentUrl || ""));
    return NextResponse.json({ ...settings, clickConfigured: clickIsConfigured() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Не удалось сохранить настройки оплаты." }, { status: 400 });
  }
}
