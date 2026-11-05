import { hashSync } from "bcryptjs";
import { NextResponse } from "next/server";
import { asBoolean, db, id } from "@/lib/db";

const list=()=> (db.prepare("SELECT id,login,name,role,active,created_at createdAt FROM admin_users ORDER BY created_at").all() as Array<Record<string,unknown>&{active:number}>).map(u=>({...u,active:Boolean(u.active)}));
export async function GET(){return NextResponse.json({users:list()});}
export async function POST(request:Request){try{const b=await request.json();const login=String(b.login||"").trim(),password=String(b.password||"");if(!login||password.length<8)return NextResponse.json({error:"Укажите логин и пароль минимум из 8 символов."},{status:400});db.prepare("INSERT INTO admin_users (id,login,name,role,password_hash) VALUES (?,?,?,?,?)").run(id("user"),login,String(b.name||login).trim(),["admin","manager"].includes(b.role)?b.role:"manager",hashSync(password,12));return NextResponse.json({users:list()},{status:201});}catch{return NextResponse.json({error:"Пользователь с таким логином уже существует."},{status:400});}}
export async function PATCH(request:Request){const b=await request.json();if(b.password){if(String(b.password).length<8)return NextResponse.json({error:"Пароль должен содержать минимум 8 символов."},{status:400});db.prepare("UPDATE admin_users SET password_hash=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(hashSync(String(b.password),12),b.id);}else db.prepare("UPDATE admin_users SET active=?,role=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND role!='owner'").run(asBoolean(b.active)?1:0,["admin","manager"].includes(b.role)?b.role:"manager",b.id);return NextResponse.json({users:list()});}
export async function DELETE(request:Request){db.prepare("DELETE FROM admin_users WHERE id=? AND role!='owner'").run(new URL(request.url).searchParams.get("id"));return NextResponse.json({users:list()});}

