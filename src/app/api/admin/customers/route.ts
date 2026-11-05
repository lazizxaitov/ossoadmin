import { NextResponse } from "next/server";
import { db, id } from "@/lib/db";

const list=()=>db.prepare(`SELECT c.id,c.name,c.phone,c.email,c.address,c.created_at createdAt,COUNT(o.id) orderCount,COALESCE(SUM(CASE WHEN o.status!='cancelled' THEN o.total ELSE 0 END),0) totalSpent FROM customers c LEFT JOIN orders o ON o.customer_id=c.id GROUP BY c.id ORDER BY c.created_at DESC`).all();
export async function GET(){return NextResponse.json({customers:list()});}
export async function POST(request:Request){try{const b=await request.json();const name=String(b.name||"").trim(),phone=String(b.phone||"").trim();if(!name||!phone)return NextResponse.json({error:"Имя и телефон обязательны."},{status:400});const customerId=id("customer");db.prepare("INSERT INTO customers (id,name,phone,email,address) VALUES (?,?,?,?,?)").run(customerId,name,phone,String(b.email||"").trim()||null,String(b.address||"").trim()||null);return NextResponse.json({customers:list()},{status:201});}catch{return NextResponse.json({error:"Клиент с таким телефоном уже существует."},{status:400});}}
export async function PATCH(request:Request){const b=await request.json();try{db.prepare("UPDATE customers SET name=?,phone=?,email=?,address=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(String(b.name||"").trim(),String(b.phone||"").trim(),String(b.email||"").trim()||null,String(b.address||"").trim()||null,b.id);return NextResponse.json({customers:list()});}catch{return NextResponse.json({error:"Не удалось обновить клиента."},{status:400});}}

