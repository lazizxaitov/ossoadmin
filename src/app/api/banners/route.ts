import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { imageSize } from "image-size";
import { NextResponse } from "next/server";
import { readBanners, withPublicUrl, writeBanners } from "@/lib/banner-store";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const TARGET_RATIO = 8 / 5;
const RATIO_TOLERANCE = 0.04;

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const banners = (await readBanners()).sort((a, b) => a.sortOrder - b.sortOrder);
  return NextResponse.json({ ok: true, banners: banners.map((banner) => withPublicUrl(banner, origin)) });
}

export async function POST(request: Request) {
  const form = await request.formData();
  const image = form.get("image");
  if (!(image instanceof File) || image.size === 0) return NextResponse.json({ error: "Выберите изображение." }, { status: 400 });
  if (!image.type.startsWith("image/")) return NextResponse.json({ error: "Файл должен быть изображением." }, { status: 400 });
  if (image.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Размер файла не должен превышать 5 МБ." }, { status: 400 });

  const bytes = new Uint8Array(await image.arrayBuffer());
  const dimensions = imageSize(bytes);
  if (!dimensions.width || !dimensions.height) return NextResponse.json({ error: "Не удалось определить размер изображения." }, { status: 400 });
  const ratio = dimensions.width / dimensions.height;
  if (Math.abs(ratio - TARGET_RATIO) > RATIO_TOLERANCE) {
    return NextResponse.json({ error: `Нужны пропорции 8:5. Получено ${dimensions.width}×${dimensions.height}. Рекомендуемый размер: 1600×1000 px.` }, { status: 400 });
  }

  const id = randomUUID();
  const extension = image.type === "image/png" ? "png" : image.type === "image/webp" ? "webp" : "jpg";
  const uploadDirectory = path.join(process.cwd(), "public", "uploads", "banners");
  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(path.join(uploadDirectory, `${id}.${extension}`), bytes);

  const banners = await readBanners();
  const banner = {
    id,
    title: String(form.get("title") || "").trim(),
    subtitle: String(form.get("subtitle") || "").trim(),
    buttonLabel: String(form.get("buttonLabel") || "Смотреть").trim(),
    actionUrl: String(form.get("actionUrl") || "").trim(),
    startsAt: String(form.get("startsAt") || "").trim() || null,
    endsAt: String(form.get("endsAt") || "").trim() || null,
    imagePath: `/uploads/banners/${id}.${extension}`,
    width: dimensions.width,
    height: dimensions.height,
    active: true,
    sortOrder: banners.length,
    createdAt: new Date().toISOString(),
  };
  await writeBanners([...banners, banner]);
  return NextResponse.json({ ok: true, banner: withPublicUrl(banner, new URL(request.url).origin) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json() as { id?: string; active?: boolean; direction?: "up" | "down"; title?: string; subtitle?: string; buttonLabel?: string; actionUrl?: string; startsAt?: string | null; endsAt?: string | null };
  const banners = (await readBanners()).sort((a, b) => a.sortOrder - b.sortOrder);
  const index = banners.findIndex((banner) => banner.id === body.id);
  if (index < 0) return NextResponse.json({ error: "Баннер не найден." }, { status: 404 });
  if (typeof body.active === "boolean") banners[index].active = body.active;
  if (typeof body.title === "string") banners[index].title = body.title.trim();
  if (typeof body.subtitle === "string") banners[index].subtitle = body.subtitle.trim();
  if (typeof body.buttonLabel === "string") banners[index].buttonLabel = body.buttonLabel.trim();
  if (typeof body.actionUrl === "string") banners[index].actionUrl = body.actionUrl.trim();
  if (body.startsAt !== undefined) banners[index].startsAt = body.startsAt || null;
  if (body.endsAt !== undefined) banners[index].endsAt = body.endsAt || null;
  if (body.direction) {
    const target = body.direction === "up" ? index - 1 : index + 1;
    if (target >= 0 && target < banners.length) [banners[index], banners[target]] = [banners[target], banners[index]];
  }
  banners.forEach((banner, position) => { banner.sortOrder = position; });
  await writeBanners(banners);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  const banners = await readBanners();
  const removed = banners.find((banner) => banner.id === id);
  if (!removed) return NextResponse.json({ error: "Баннер не найден." }, { status: 404 });
  const next = banners.filter((banner) => banner.id !== id).map((banner, index) => ({ ...banner, sortOrder: index }));
  await writeBanners(next);
  const uploadsRoot = path.join(process.cwd(), "public", "uploads", "banners");
  const imageFile = path.resolve(process.cwd(), "public", removed.imagePath.replace(/^\/+/, ""));
  if (imageFile.startsWith(`${uploadsRoot}${path.sep}`)) {
    try { await unlink(imageFile); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  }
  return NextResponse.json({ ok: true });
}
