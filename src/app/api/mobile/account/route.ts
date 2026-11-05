import { NextResponse } from "next/server";
import { verifyCustomerToken } from "@/lib/customer-auth";
import { db } from "@/lib/db";
export async function GET(request:Request){const session=verifyCustomerToken(request);if(!session)return NextResponse.json({error:"Требуется вход."},{status:401});const customer=db.prepare("SELECT id,name,phone,email,address FROM customers WHERE id=? AND active=1").get(session.sub);return customer?NextResponse.json({customer}):NextResponse.json({error:"Аккаунт не найден."},{status:404});}
export async function DELETE(request:Request){const session=verifyCustomerToken(request);if(!session)return NextResponse.json({error:"Требуется вход."},{status:401});db.prepare("UPDATE customers SET active=0,password_hash=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(session.sub);return NextResponse.json({ok:true});}
