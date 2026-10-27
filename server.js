require("dotenv").config();
const express=require("express");
const path=require("path");

const app=express();
app.use(express.json({limit:"1mb"}));
app.use(express.static(path.join(__dirname,"public")));

const PORT=process.env.PORT||3000;
const API_KEY=process.env.AI_API_KEY;
const BASE_URL=(process.env.AI_BASE_URL||"https://api.openai.com/v1").replace(/\/$/,"");
const MODEL=process.env.AI_MODEL||"gpt-4o-mini";

app.get("/api/health",(req,res)=>res.json({ok:true}));

app.post("/api/chat",async(req,res)=>{
  try{
    if(!API_KEY) return res.status(500).json({error:"AI_API_KEY is not configured on the server."});
    const incoming=Array.isArray(req.body.messages)?req.body.messages:[];
    const messages=[
      {role:"system",content:"You are FROHEN AI, a helpful, friendly assistant. Answer naturally and directly. Do not claim to be human. Keep answers appropriate and safe for young users. When the user asks for code, provide working code. When the user asks for translation, translate naturally. Use the user's language when possible."},
      ...incoming.filter(m=>m && (m.role==="user"||m.role==="assistant") && typeof m.content==="string").slice(-30)
    ];
    const response=await fetch(`${BASE_URL}/chat/completions`,{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${API_KEY}`},
      body:JSON.stringify({model:MODEL,messages,temperature:0.7})
    });
    const data=await response.json();
    if(!response.ok) return res.status(response.status).json({error:data?.error?.message||"AI provider request failed."});
    const reply=data?.choices?.[0]?.message?.content;
    if(!reply) return res.status(502).json({error:"The AI provider returned no message."});
    res.json({reply});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Server error while contacting the AI provider."});
  }
});

app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,()=>console.log(`FROHEN AI running on port ${PORT}`));