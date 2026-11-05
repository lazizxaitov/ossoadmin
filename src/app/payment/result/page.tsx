export default function PaymentResultPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f3f5f1] p-6 text-[#172021]">
      <section className="w-full max-w-md rounded-3xl border border-[#e2e7df] bg-white p-8 text-center shadow-sm">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#355f55] text-2xl text-white">✓</span>
        <h1 className="mt-6 text-2xl font-semibold">Платёж отправлен</h1>
        <p className="mt-3 text-sm leading-6 text-[#687271]">
          Вернитесь в приложение OSSO. Статус заказа обновится после подтверждения от CLICK.
        </p>
        <p className="mt-7 rounded-xl bg-[#eef2ea] px-5 py-3 text-sm font-medium text-[#355f55]">
          Эту страницу можно закрыть
        </p>
      </section>
    </main>
  );
}
