import { compareSync, hashSync } from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/auth-session";
import { db } from "@/lib/db";

export async function PATCH(request:Request){
  const session=await verifySessionToken((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
  if(!session)return NextResponse.json({error:"Сессия истекла."},{status:401});
  const body=await request.json();const password=String(body.password||"");
  if(password.length<8)return NextResponse.json({error:"Новый пароль должен содержать минимум 8 символов."},{status:400});
  const user=db.prepare("SELECT password_hash passwordHash FROM admin_users WHERE login=? COLLATE NOCASE AND active=1").get(session.sub) as {passwordHash:string}|undefined;
  if(!user||!compareSync(String(body.currentPassword||""),user.passwordHash))return NextResponse.json({error:"Текущий пароль указан неверно."},{status:401});
  db.prepare("UPDATE admin_users SET password_hash=?,updated_at=CURRENT_TIMESTAMP WHERE login=? COLLATE NOCASE").run(hashSync(password,12),session.sub);
  return NextResponse.json({ok:true});
}
