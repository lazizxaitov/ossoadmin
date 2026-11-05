import { NextResponse } from "next/server";

const DEFAULT_CRM_URL = "http://localhost:3001";

export async function GET() {
  const crmBaseUrl = (process.env.CRM_API_URL || DEFAULT_CRM_URL).replace(/\/$/, "");

  try {
    const crmApiKey = process.env.CRM_API_KEY;
    const response = await fetch(`${crmBaseUrl}/api/store/products`, {
      cache: "no-store",
      headers: crmApiKey ? { Authorization: `Bearer ${crmApiKey}` } : undefined,
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, error: `CRM вернула HTTP ${response.status}` },
        { status: 502 },
      );
    }

    const payload = await response.json();
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "CRM недоступна. Проверьте CRM_API_URL и запущен ли сервер CRM.",
      },
      { status: 503 },
    );
  }
}
