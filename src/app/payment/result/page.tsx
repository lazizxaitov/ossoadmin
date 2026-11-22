export default function PaymentResultPage() {
  return (
    <main className="grid min-h-screen place-items-center grainy p-6 text-[var(--ink)]">
      <section className="w-full max-w-md glass rounded-[32px] border border-[var(--stroke)] p-8 text-center shadow-[var(--shadow)]">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--brand-strong)] text-2xl text-white">✓</span>
        <h1 className="mt-6 text-2xl font-semibold">Платёж отправлен</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Вернитесь в приложение OSSO. Статус заказа обновится после подтверждения от CLICK.
        </p>
        <p className="mt-7 rounded-2xl bg-[var(--brand-soft)] px-5 py-3 text-sm font-medium text-[var(--brand-strong)]">
          Эту страницу можно закрыть
        </p>
      </section>
    </main>
  );
}
