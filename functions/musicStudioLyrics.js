"use strict";
const { isStudioOwner } = require("./hoerenStudioApi");

// One document per lesson. No searches, listeners, background jobs or model calls.
const COLLECTION = "musicStudioLyrics";
const KEY_PATTERN = /^(A1|A2|B1|B2|C1|C2)-(?:TUTORIAL|[0-9]+(?:\.[0-9]+)?(?:-PRACTICE)?)$/i;
const fail = (error,status=400) => Object.assign(new Error(error),{status});
function validKey(value) {
  const key=String(value || "").trim().toUpperCase();
  if (!KEY_PATTERN.test(key) || key.length > 64) throw fail("Choose a valid course lesson.");
  return key;
}
function validLyrics(value) {
  if (typeof value !== "string") throw fail("Enter lyrics before overwriting.");
  const lyrics=value.replace(/\r\n/g,"\n").trim();
  if (!lyrics || lyrics.length > 5500) throw fail("Lyrics must contain 1–5,500 characters.");
  if (lyrics.split("\n").length > 220) throw fail("Use 220 lines or fewer.");
  return lyrics;
}
function publicResponse(data,assignmentKey) {
  return {ok:true,assignmentKey,found:Boolean(typeof data?.lyrics==="string"&&data.lyrics.trim()),
    lyrics:typeof data?.lyrics==="string"?data.lyrics:"",
    updatedAt:typeof data?.updatedAt==="string"?data.updatedAt:null};
}
function createLyricsHandlers({db,verifyToken,runtimeConfig={}}) {
  const owner = async (req,res) => {
    res.set("Cache-Control","no-store");
    let actor;
    try {
      actor=await verifyToken(String(req.headers.authorization||"").replace(/^Bearer /,""));
    }catch{
      return res.status(401).json({ok:false,error:"Sign in to Falowen Admin."});
    }
    if (!isStudioOwner(actor.uid,runtimeConfig)) return res.status(403).json({ok:false,error:"Only the Music Studio owner can overwrite lyrics."});
    try {
      if(req.method !== "GET" && req.method !== "POST")return res.status(405).json({ok:false,error:"Method not allowed."});
      const assignmentKey=validKey(req.method==="GET"?req.query?.assignmentKey:req.body?.assignmentKey);
      const ref=db.collection(COLLECTION).doc(assignmentKey);
      if(req.method==="GET"){
        const row=await ref.get();
        return res.json(publicResponse(row.exists?row.data():null,assignmentKey));
      }
      const lyrics=validLyrics(req.body?.lyrics);
      const updatedAt=new Date().toISOString();
      await ref.set({lyrics,updatedAt,publicReference:true},{merge:false});
      return res.json({...publicResponse({lyrics,updatedAt},assignmentKey),saved:true});
    }catch(error){
      return res.status(error.status||503).json({ok:false,error:error.status?error.message:"Could not save lyrics. Please retry manually."});
    }
  };
  const publicRead=async(req,res)=>{
    res.set("Cache-Control","public, max-age=30, s-maxage=60");
    res.set("X-Content-Type-Options","nosniff");
    if(req.method!=="GET")return res.status(405).json({ok:false,error:"Method not allowed."});
    try {
      const assignmentKey=validKey(req.query?.assignmentKey);
      const row=await db.collection(COLLECTION).doc(assignmentKey).get();
      const data=row.exists?row.data():null;
      if(data?.publicReference!==true)return res.json(publicResponse(null,assignmentKey));
      // No owner email, IDs, permissions or unpublished metadata in public response.
      return res.json(publicResponse(data,assignmentKey));
    }catch(error){
      return res.status(error.status||503).json({ok:false,error:error.status?error.message:"Lyrics temporarily unavailable."});
    }
  };
  return {owner,publicRead};
}
module.exports={validKey,validLyrics,publicResponse,createLyricsHandlers};
