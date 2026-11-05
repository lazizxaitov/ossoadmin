import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

type Payload={sub:string;phone:string;exp:number};
const secret=()=>process.env.CUSTOMER_SESSION_SECRET||process.env.ADMIN_SESSION_SECRET||"osso-customer-local-secret";
const encode=(value:string)=>Buffer.from(value).toString("base64url");
export function createCustomerToken(customer:{id:string;phone:string}){const payload=encode(JSON.stringify({sub:customer.id,phone:customer.phone,exp:Math.floor(Date.now()/1000)+60*60*24*30} satisfies Payload));const signature=createHmac("sha256",secret()).update(payload).digest("base64url");return `${payload}.${signature}`;}
export function verifyCustomerToken(request:Request){const token=request.headers.get("authorization")?.replace(/^Bearer\s+/i,"");if(!token)return null;const [payload,signature]=token.split(".");if(!payload||!signature)return null;const expected=createHmac("sha256",secret()).update(payload).digest("base64url");const a=Buffer.from(signature),b=Buffer.from(expected);if(a.length!==b.length||!timingSafeEqual(a,b))return null;try{const data=JSON.parse(Buffer.from(payload,"base64url").toString()) as Payload;return data.exp>Math.floor(Date.now()/1000)?data:null;}catch{return null;}}
