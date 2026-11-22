"use client";

import { Eye, EyeOff, LoaderCircle, LockKeyhole, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: form.get("login"), password: form.get("password") }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Не удалось войти.");
      router.replace("/");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось войти.");
      setPending(false);
    }
  }

  return <form onSubmit={submit} className="mt-8 space-y-4"><label className="block"><span className="mb-2 block text-[11px] font-semibold text-[var(--muted)]">Логин</span><span className="relative block"><UserRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"/><input required name="login" autoComplete="username" placeholder="Введите логин" className="h-12 w-full rounded-2xl border border-[var(--stroke)] bg-white/90 pl-10 pr-4 text-[13px] outline-none transition focus:border-[var(--brand)]"/></span></label><label className="block"><span className="mb-2 block text-[11px] font-semibold text-[var(--muted)]">Пароль</span><span className="relative block"><LockKeyhole size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"/><input required name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Введите пароль" className="h-12 w-full rounded-2xl border border-[var(--stroke)] bg-white/90 pl-10 pr-11 text-[13px] outline-none transition focus:border-[var(--brand)]"/><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--muted)]">{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button></span></label>{error && <p role="alert" className="rounded-xl bg-[#fdecea] px-3.5 py-3 text-[11px] font-medium text-[var(--danger)]">{error}</p>}<button disabled={pending} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--brand-strong)] text-[13px] font-semibold text-white shadow-[var(--shadow-soft)] transition hover:-translate-y-[1px] disabled:cursor-wait disabled:opacity-70">{pending ? <LoaderCircle size={17} className="animate-spin"/> : <LockKeyhole size={16}/>} {pending ? "Входим..." : "Войти в панель"}</button><p className="pt-2 text-center text-[10px] leading-4 text-[var(--muted)]">Сессия защищена и автоматически завершится через 12 часов.</p></form>;
}
