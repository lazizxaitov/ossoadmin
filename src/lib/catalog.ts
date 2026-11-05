import "server-only";

export type CrmProduct = {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: { name: string } | null;
  size: string;
  color: string | null;
  imageUrl: string | null;
  priceUSD: number;
  stock: number;
};

export async function getCrmProducts(): Promise<CrmProduct[]> {
  const base = process.env.CRM_API_URL || "http://localhost:3001/api/store/products";
  const response = await fetch(base, {
    cache: "no-store",
    headers: process.env.CRM_API_KEY ? { Authorization: `Bearer ${process.env.CRM_API_KEY}` } : undefined,
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`CRM вернула HTTP ${response.status}`);
  const payload = await response.json() as { products?: CrmProduct[] } | CrmProduct[];
  return Array.isArray(payload) ? payload : payload.products || [];
}

