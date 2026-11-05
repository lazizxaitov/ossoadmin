import { NextResponse } from "next/server";
import { readBanners, withPublicUrl } from "@/lib/banner-store";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const now = Date.now();
  const banners = (await readBanners())
    .filter((banner) => banner.active && (!banner.startsAt || new Date(banner.startsAt).getTime() <= now) && (!banner.endsAt || new Date(banner.endsAt).getTime() >= now))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((banner) => withPublicUrl(banner, origin));
  return NextResponse.json({ ok: true, banners, total: banners.length }, { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60", "Access-Control-Allow-Origin": "*" } });
}
