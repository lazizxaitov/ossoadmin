// Публичная точка создания заказа для мобильного клиента.
// Чтение и смена статусов остаются доступны только в защищённой админке.
export { POST } from "@/app/api/admin/orders/route";

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
