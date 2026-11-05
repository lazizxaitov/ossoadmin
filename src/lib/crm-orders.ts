import "server-only";

const endpoint=()=>new URL("/api/store/orders/reserve",process.env.CRM_API_URL||"http://localhost:3001").toString();
const headers=()=>({"Content-Type":"application/json",...(process.env.CRM_API_KEY?{Authorization:`Bearer ${process.env.CRM_API_KEY}`}:{})});
export async function reserveCrmOrder(externalOrderId:string,items:Array<{productId:string;quantity:number}>){if(!items.length)return;const response=await fetch(endpoint(),{method:"POST",headers:headers(),body:JSON.stringify({externalOrderId,items}),signal:AbortSignal.timeout(10000)});const data=await response.json() as {error?:string};if(!response.ok)throw new Error(data.error||"CRM не смогла зарезервировать товар.");}
export async function releaseCrmOrder(externalOrderId:string){const url=new URL(endpoint());url.searchParams.set("externalOrderId",externalOrderId);const response=await fetch(url,{method:"DELETE",headers:headers(),signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error("CRM не смогла снять резерв.");}
