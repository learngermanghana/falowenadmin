export function enrollmentClassNames(classes,program,level){
 const clean=value=>String(value??"").trim();
 const language=value=>clean(value).toLowerCase().replace(/^kiswahili$/,"swahili").replace(/^deutsch$/,"german");
 const names=new Set();
 for(const klass of Array.isArray(classes)?classes:[]){
  if(!klass)continue;
  const name=clean(klass.name||klass.className||klass.classId);
  const status=clean(klass.status).toLowerCase();
  const classLevel=clean(klass.levelId||klass.level||klass.courseLevel||klass.languageLevel||name.match(/^(A1|A2|B1|B2|C1|C2)(?=\s|$)/i)?.[0]).toUpperCase();
  if(!name||klass.archived===true||klass.isArchived===true||klass.active===false)continue;
  if(!(status?["active","ongoing","upcoming","open"].includes(status):klass.active===true))continue;
  if(language(klass.language||klass.program||"german")!==language(program)||classLevel!==clean(level).toUpperCase())continue;
  names.add(name);
 }
 return [...names].sort((a,b)=>a.localeCompare(b));
}
