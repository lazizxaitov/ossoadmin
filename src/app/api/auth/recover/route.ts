import { hashSync } from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request:Request){const b=await request.json();const recovery=process.env.ADMIN_RECOVERY_KEY;if(!recovery)return NextResponse.json({error:"Восстановление не настроено."},{status:503});if(b.recoveryKey!==recovery)return NextResponse.json({error:"Неверный ключ восстановления."},{status:401});if(String(b.password||"").length<8)return NextResponse.json({error:"Пароль должен содержать минимум 8 символов."},{status:400});const result=db.prepare("UPDATE admin_users SET password_hash=?,active=1,updated_at=CURRENT_TIMESTAMP WHERE login=? COLLATE NOCASE").run(hashSync(String(b.password),12),String(b.login||""));if(!result.changes)return NextResponse.json({error:"Пользователь не найден."},{status:404});return NextResponse.json({ok:true});}
