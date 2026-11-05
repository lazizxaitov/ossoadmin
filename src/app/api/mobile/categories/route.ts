import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export async function GET(request:Request){void request.url;const categories=db.prepare(`SELECT c.id,c.name,c.image_url imageUrl,c.sort_order sortOrder,COUNT(p.id) productCount FROM categories c LEFT JOIN products p ON p.category_id=c.id AND p.status='active' AND p.stock>0 WHERE c.active=1 GROUP BY c.id ORDER BY c.sort_order`).all();return NextResponse.json({categories},{headers:{"Access-Control-Allow-Origin":"*","Cache-Control":"no-store"}});}
