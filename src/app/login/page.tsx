import LoginForm from "./login-form";

export const metadata = {
  title: "Вход — OSSO Admin",
};

export default function LoginPage() {
  return (
    <main className="grainy grid min-h-screen place-items-center px-4 py-10">
      <div className="glass w-full max-w-md rounded-[32px] border border-[var(--stroke)] p-7 shadow-[var(--shadow)] sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">OSSO</p>
        <h1 className="mt-2 text-2xl font-extrabold text-[var(--ink)]">Панель управления</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Введите данные администратора, чтобы продолжить.</p>
        <LoginForm />
      </div>
    </main>
  );
}
