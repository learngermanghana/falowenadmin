import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const config=JSON.parse(readFileSync(new URL("../vercel.json",import.meta.url),"utf8"));
test("Vercel SPA fallback excludes missing JavaScript and CSS assets",()=>{
 const fallback=config.rewrites.at(-1);
 assert.equal(fallback.destination,"/index.html");
 assert.equal(fallback.source,"/:path((?!assets/|.*\\.[A-Za-z0-9]+$).*)");
 const pattern=new RegExp("^/"+fallback.source.slice("/:path(".length,-1)+"$");
 for(const path of ["/teaching-slides/course/A1/a1-14-1","/attendance/session/abc","/class-calendar"]){
   assert.ok(pattern.test(path),"SPA route "+path);
 }
 for(const path of ["/assets/index-nH7NC0WX.js","/assets/style-123.css","/logo.png","/favicon.ico"]){
   assert.equal(pattern.test(path),false,"should not rewrite asset "+path);
 }
});
test("Fresh HTML navigation is revalidated without changing immutable asset caching",()=>{
 const head=(source)=>config.headers.find(rule=>rule.source===source)?.headers.find(h=>h.key==="Cache-Control")?.value;
 assert.match(head("/"),/must-revalidate/);
 assert.match(head("/teaching-slides/:path*"),/must-revalidate/);
 assert.match(head("/assets/:path*"),/immutable/);
});
