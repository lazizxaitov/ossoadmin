import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { db, id } from "@/lib/db";

type ProductRow = { id: string; sku: string; name: string; brand: string; categoryId: string | null; category: string | null; description: string; price: number; stock: number; status: "active" | "draft"; image: string | null; createdAt: string };

const list = () => db.prepare(`SELECT p.id, p.sku, p.name, p.brand, p.category_id categoryId, c.name category, p.description, p.price, p.stock, p.status, p.image_url image, p.created_at createdAt FROM products p LEFT JOIN categories c ON c.id=p.category_id ORDER BY p.created_at DESC`).all() as ProductRow[];
const clean = (value: FormDataEntryValue | null) => String(value || "").trim();

async function saveImage(file: File | null, current?: string | null) {
  if (!file || !file.size) return current || null;
  if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) throw new Error("Фото должно быть изображением до 5 МБ.");
  const extension = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as Record<string, string>)[file.type];
  if (!extension) throw new Error("Поддерживаются JPG, PNG и WebP.");
  const directory = path.join(process.cwd(), "public", "uploads", "products");
  await mkdir(directory, { recursive: true });
  const filename = `${crypto.randomUUID()}.${extension}`;
  await writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()));
  if (current?.startsWith("/uploads/products/")) await unlink(path.join(process.cwd(), "public", current)).catch(() => undefined);
  return `/uploads/products/${filename}`;
}

export async function GET() { return NextResponse.json({ products: list() }); }

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const sku = clean(form.get("sku")); const name = clean(form.get("name"));
    if (!sku || !name) return NextResponse.json({ error: "Название и SKU обязательны." }, { status: 400 });
    const image = await saveImage(form.get("image") instanceof File ? form.get("image") as File : null);
    const productId = id("product");
    db.prepare(`INSERT INTO products (id,sku,name,brand,category_id,description,price,stock,status,image_url) VALUES (?,?,?,?,?,?,?,?,?,?)`).run(productId, sku, name, clean(form.get("brand")) || "OSSO Home", clean(form.get("categoryId")) || null, clean(form.get("description")), Math.max(0, Number(form.get("price")) || 0), Math.max(0, Number(form.get("stock")) || 0), form.get("status") === "active" ? "active" : "draft", image);
    return NextResponse.json({ product: list().find((item) => item.id === productId) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error && error.message.includes("UNIQUE") ? "Товар с таким SKU уже существует." : error instanceof Error ? error.message : "Не удалось создать товар.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const form = await request.formData(); const productId = clean(form.get("id"));
    const current = db.prepare("SELECT * FROM products WHERE id=?").get(productId) as { image_url: string | null } | undefined;
    if (!current) return NextResponse.json({ error: "Товар не найден." }, { status: 404 });
    const image = await saveImage(form.get("image") instanceof File ? form.get("image") as File : null, current.image_url);
    db.prepare(`UPDATE products SET sku=?,name=?,brand=?,category_id=?,description=?,price=?,stock=?,status=?,image_url=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(clean(form.get("sku")), clean(form.get("name")), clean(form.get("brand")) || "OSSO Home", clean(form.get("categoryId")) || null, clean(form.get("description")), Math.max(0, Number(form.get("price")) || 0), Math.max(0, Number(form.get("stock")) || 0), form.get("status") === "active" ? "active" : "draft", image, productId);
    return NextResponse.json({ product: list().find((item) => item.id === productId) });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Не удалось обновить товар." }, { status: 400 }); }
}

export async function DELETE(request: Request) {
  const productId = new URL(request.url).searchParams.get("id");
  const product = db.prepare("SELECT image_url image FROM products WHERE id=?").get(productId) as { image: string | null } | undefined;
  if (!product) return NextResponse.json({ error: "Товар не найден." }, { status: 404 });
  db.prepare("DELETE FROM products WHERE id=?").run(productId);
  if (product.image?.startsWith("/uploads/products/")) await unlink(path.join(process.cwd(), "public", product.image)).catch(() => undefined);
  return NextResponse.json({ ok: true });
}

