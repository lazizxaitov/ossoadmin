import { NextResponse } from "next/server";
import { verifyCustomerToken } from "@/lib/customer-auth";
import { db } from "@/lib/db";
export async function GET(request:Request){const session=verifyCustomerToken(request);if(!session)return NextResponse.json({error:"Требуется вход."},{status:401});const orders=db.prepare(`SELECT id,number,total,status,payment_method paymentMethod,payment_provider paymentProvider,payment_status paymentStatus,discount,delivery_fee deliveryFee,created_at createdAt,(SELECT COUNT(*) FROM order_items WHERE order_id=o.id) itemCount FROM orders o WHERE customer_id=? ORDER BY created_at DESC`).all(session.sub);return NextResponse.json({orders});}
