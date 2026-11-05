import { compareSync } from "bcryptjs";
import { NextResponse } from "next/server";
import { createCustomerToken } from "@/lib/customer-auth";
import { db } from "@/lib/db";
export async function POST(request:Request){const body=await request.json();const phone=String(body.phone||"").trim();const customer=db.prepare("SELECT id,name,phone,password_hash passwordHash,active FROM customers WHERE phone=?").get(phone) as {id:string;name:string;phone:string;passwordHash:string|null;active:number}|undefined;if(!customer||!customer.active||!customer.passwordHash||!compareSync(String(body.password||""),customer.passwordHash))return NextResponse.json({error:"Неверный телефон или пароль."},{status:401});return NextResponse.json({token:createCustomerToken(customer),customer:{id:customer.id,name:customer.name,phone:customer.phone}});}
