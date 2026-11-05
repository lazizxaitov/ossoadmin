import { NextResponse } from "next/server";
import { getCrmProducts } from "@/lib/catalog";
import { db } from "@/lib/db";

export async function GET(request:Request){
  const requestUrl=new URL(request.url);const source=requestUrl.searchParams.get("source")||"all";
  const usdToUzs=Math.max(1,Number(process.env.USD_TO_UZS_RATE)||12500);
  const admin=source==="crm"?[]:(db.prepare(`SELECT p.id,p.sku,p.name,p.brand,c.name category,p.description,p.price,p.stock,p.image_url imageUrl,'UZS' currency,'admin' source FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.status='active' AND p.stock>0 AND (c.active=1 OR c.id IS NULL) ORDER BY p.created_at DESC`).all() as Array<Record<string,unknown>&{imageUrl:string|null}>).map(p=>({...p,imageUrl:p.imageUrl?new URL(p.imageUrl,requestUrl.origin).toString():null}));
  let crm:unknown[]=[];let crmError:string|undefined;
  if(source!=="admin")try{const crmOrigin=new URL(process.env.CRM_API_URL||"http://localhost:3001").origin;crm=(await getCrmProducts()).map(p=>({id:p.id,sku:p.sku,name:p.name,brand:[p.size,p.color].filter(Boolean).join(" · ")||"OSSO",category:p.category?.name||"Без категории",description:p.description||"",price:Math.round(p.priceUSD*usdToUzs),stock:p.stock,imageUrl:p.imageUrl?new URL(p.imageUrl,crmOrigin).toString():null,currency:"UZS",source:"crm"}));}catch(error){crmError=error instanceof Error?error.message:"CRM недоступна";}
  return NextResponse.json({products:[...crm,...admin],crmError},{headers:{"Access-Control-Allow-Origin":"*","Cache-Control":"no-store"}});
}
