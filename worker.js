const J=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{"content-type":"application/json"}});
async function h(secret,msg){const k=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const b=await crypto.subtle.sign("HMAC",k,new TextEncoder().encode(msg));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}
function eq(a,b){if(!a||!b||a.length!==b.length)return false;let n=0;for(let i=0;i<a.length;i++)n|=a.charCodeAt(i)^b.charCodeAt(i);return n===0}
export default {async fetch(r,e){
 const u=new URL(r.url);
 if(!u.pathname.startsWith("/api/"))return e.ASSETS.fetch(r);

 if(r.method==="POST"&&u.pathname==="/api/payments/create-order"){
  const b=await r.json();const amount=Math.round(Number(b.amount)*100);
  if(!b.name||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(b.email||"")||amount<100||amount>50000000)return J({error:"Invalid details"},400);
  const auth=btoa(`${e.RAZORPAY_KEY_ID}:${e.RAZORPAY_KEY_SECRET}`);
  const rr=await fetch("https://api.razorpay.com/v1/orders",{method:"POST",headers:{Authorization:`Basic ${auth}`,"Content-Type":"application/json"},body:JSON.stringify({amount,currency:"INR",receipt:"rcpt_"+crypto.randomUUID(),payment_capture:1})});
  if(!rr.ok)return J({error:"Payment gateway error"},502);
  const rz=await rr.json();
  await e.DB.prepare("INSERT INTO orders(customer_name,customer_email,amount_paise,razorpay_order_id) VALUES(?,?,?,?)").bind(b.name,b.email,amount,rz.id).run();
  return J({keyId:e.RAZORPAY_KEY_ID,orderId:rz.id,amount,currency:"INR"});
 }
 if(r.method==="POST"&&u.pathname==="/api/payments/verify"){
  const b=await r.json();const o=await e.DB.prepare("SELECT * FROM orders WHERE razorpay_order_id=?").bind(b.razorpay_order_id).first();
  if(!o)return J({error:"Order not found"},400);
  const sig=await h(e.RAZORPAY_KEY_SECRET,`${o.razorpay_order_id}|${b.razorpay_payment_id}`);
  if(!eq(sig,b.razorpay_signature))return J({error:"Invalid payment signature"},400);
  await e.DB.prepare("UPDATE orders SET status='verified',razorpay_payment_id=? WHERE id=?").bind(b.razorpay_payment_id,o.id).run();
  return J({ok:true,message:"Payment verified. Webhook will confirm capture."});
 }
 if(r.method==="POST"&&u.pathname==="/api/payments/webhook"){
  const raw=await r.text(), sig=r.headers.get("X-Razorpay-Signature")||"", expected=await h(e.RAZORPAY_WEBHOOK_SECRET,raw);
  if(!eq(sig,expected))return new Response("Invalid signature",{status:400});
  const ev=JSON.parse(raw), id=ev.id;
  try{await e.DB.prepare("INSERT INTO webhook_events(event_id,event_type) VALUES(?,?)").bind(id,ev.event).run()}catch{return new Response("OK")}
  const p=ev.payload?.payment?.entity;
  if(p&&ev.event==="payment.captured")await e.DB.prepare("UPDATE orders SET status='paid',razorpay_payment_id=? WHERE razorpay_order_id=?").bind(p.id,p.order_id).run();
  if(p&&ev.event==="payment.failed")await e.DB.prepare("UPDATE orders SET status='failed',razorpay_payment_id=? WHERE razorpay_order_id=?").bind(p.id,p.order_id).run();
  return new Response("OK");
 }
 return J({error:"Not found"},404);
}};