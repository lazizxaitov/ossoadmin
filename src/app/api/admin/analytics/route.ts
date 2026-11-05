import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request:Request){
  void request.url;
  const summary=db.prepare(`SELECT COALESCE(SUM(CASE WHEN status!='cancelled' AND (payment_method!='card' OR payment_status='paid') AND date(created_at)=date('now','localtime') THEN total ELSE 0 END),0) revenueToday,COUNT(CASE WHEN date(created_at)=date('now','localtime') THEN 1 END) ordersToday,COALESCE(AVG(CASE WHEN status!='cancelled' AND (payment_method!='card' OR payment_status='paid') THEN total END),0) averageOrder FROM orders`).get();
  const customers=(db.prepare("SELECT COUNT(*) count FROM customers").get() as {count:number}).count;
  const statuses=db.prepare("SELECT status,COUNT(*) count FROM orders GROUP BY status").all();
  const sales=db.prepare(`WITH RECURSIVE days(d) AS (SELECT date('now','localtime','-6 days') UNION ALL SELECT date(d,'+1 day') FROM days WHERE d<date('now','localtime')) SELECT d date,COALESCE(SUM(o.total),0) total FROM days LEFT JOIN orders o ON date(o.created_at)=d AND o.status!='cancelled' AND (o.payment_method!='card' OR o.payment_status='paid') GROUP BY d ORDER BY d`).all();
  const recent=db.prepare("SELECT id,number,customer_name customerName,total,status,created_at createdAt FROM orders ORDER BY created_at DESC LIMIT 5").all();
  return NextResponse.json({summary:{...(summary as object),customers},statuses,sales,recent});
}
