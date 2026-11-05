import { NextResponse } from "next/server";
import { compareSync, hashSync } from "bcryptjs";
import { ADMIN_SESSION_COOKIE, SESSION_MAX_AGE, authCredentials, createSessionToken } from "@/lib/auth-session";
import { db, id } from "@/lib/db";

export async function POST(request: Request) {
  let body: { login?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос." }, { status: 400 });
  }

  const credentials = authCredentials();
  if (!credentials.configured) {
    return NextResponse.json({ error: "Авторизация не настроена на сервере." }, { status: 503 });
  }
  const login = String(body.login || "").trim();
  const password = String(body.password || "");
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const attemptKey = `${forwarded}:${login.toLowerCase()}`;
  const now = Date.now();
  const attempt = db.prepare("SELECT attempts,blocked_until blockedUntil FROM login_attempts WHERE key=?").get(attemptKey) as { attempts:number; blockedUntil:number }|undefined;
  if (attempt && attempt.blockedUntil > now) return NextResponse.json({ error: "Слишком много попыток. Повторите через 15 минут." }, { status: 429 });

  let user = db.prepare("SELECT id,login,password_hash passwordHash,active FROM admin_users WHERE login=? COLLATE NOCASE").get(login) as {id:string;login:string;passwordHash:string;active:number}|undefined;
  if (!user && login === credentials.login && password === credentials.password) {
    const userId=id("user");
    db.prepare("INSERT INTO admin_users (id,login,name,role,password_hash) VALUES (?,?,?,?,?)").run(userId,login,"Лазиз Заитов","owner",hashSync(password,12));
    user={id:userId,login,passwordHash:hashSync(password,12),active:1};
  }
  if (!user || !user.active || !compareSync(password, user.passwordHash)) {
    const attempts=(attempt?.attempts||0)+1; const blockedUntil=attempts>=5?now+15*60*1000:0;
    db.prepare("INSERT INTO login_attempts (key,attempts,blocked_until,updated_at) VALUES (?,?,?,?) ON CONFLICT(key) DO UPDATE SET attempts=excluded.attempts,blocked_until=excluded.blocked_until,updated_at=excluded.updated_at").run(attemptKey,attempts>=5?0:attempts,blockedUntil,now);
    return NextResponse.json({ error: "Неверный логин или пароль." }, { status: 401 });
  }
  db.prepare("DELETE FROM login_attempts WHERE key=?").run(attemptKey);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, await createSessionToken(user.login), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    priority: "high",
  });
  return response;
}
