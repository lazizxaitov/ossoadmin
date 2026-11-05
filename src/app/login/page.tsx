import LoginForm from "./login-form";

export const metadata = {
  title: "Вход — OSSO Admin",
};

export default function LoginPage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#eef2ed] px-4 py-10">
      <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#dce8df] blur-3xl" />
      <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-[#e4edc0]/70 blur-3xl" />
      <div className="relative z-10 grid w-full max-w-[920px] overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_30px_80px_rgba(34,61,53,.13)] md:grid-cols-[1.05fr_.95fr]">
        <section className="relative hidden min-h-[590px] overflow-hidden bg-[#31584f] p-10 text-white md:flex md:flex-col">
          <div className="absolute -right-20 top-20 h-64 w-64 rounded-full border border-white/10" />
          <div className="absolute -right-10 top-28 h-44 w-44 rounded-full border border-white/10" />
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[13px] font-bold text-[#31584f]">OS</span><span className="text-[21px] font-bold tracking-[-.7px]">OSSO</span></div>
          <div className="relative my-auto"><span className="mb-5 inline-flex rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.12em] text-[#dcef86]">Панель управления</span><h1 className="max-w-[350px] text-[38px] font-semibold leading-[1.12] tracking-[-1.5px]">Всё для управления магазином в одном месте.</h1><p className="mt-5 max-w-[330px] text-[13px] leading-6 text-white/60">Товары, остатки CRM, заказы, клиенты и маркетинг OSSO.</p></div>
          <p className="text-[10px] text-white/35">© 2026 OSSO. Доступ только для сотрудников.</p>
        </section>
        <section className="flex min-h-[540px] items-center p-7 sm:p-12"><div className="w-full"><div className="mb-9 md:hidden"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#31584f] text-[13px] font-bold text-white">OS</span></div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#7f918b]">Безопасный вход</p><h2 className="mt-2 text-[30px] font-semibold tracking-[-1px] text-[#17201f]">Добро пожаловать</h2><p className="mt-2 text-[12px] text-[#88918e]">Введите данные администратора, чтобы продолжить.</p><LoginForm /></div></section>
      </div>
    </main>
  );
}
