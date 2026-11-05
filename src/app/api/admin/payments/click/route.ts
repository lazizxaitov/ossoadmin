import { NextResponse } from "next/server";
import { clickIsConfigured } from "@/lib/click";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  return NextResponse.json({
    configured: clickIsConfigured(),
    prepareUrl: `${origin}/api/payments/click/prepare`,
    completeUrl: `${origin}/api/payments/click/complete`,
  });
}
