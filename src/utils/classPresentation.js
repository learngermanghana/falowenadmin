export function presentationPrompt(task,choice=0){
 const selected=task.choices?.[choice]||task.choices?.[0];
 const source=task.presentationPractice||task;
 return {choice:selected?.id||"default",prompt:selected?.prompt||source.prompt,keywords:selected?String(selected.keywords||"").split(",").map(x=>x.trim()).filter(Boolean):source.keywords||[],questions:selected?[]:(source.branches||[]).map(x=>x.question).filter(Boolean)};
}
export function presentationContext(search,assignmentId){
 const p=new URLSearchParams(search);
 const classId=p.get("classRecordId")||p.get("classId")||"";
 const sessionId=p.get("sessionId")||"";
 const sessionDate=p.get("sessionDate")||"";
 return /^[a-zA-Z0-9_-]{1,180}$/.test(classId)&&sessionId&&/^\d{4}-\d{2}-\d{2}$/.test(sessionDate)&&/^A2-\d+\.\d+$/.test(assignmentId||"")?{classId,sessionId,sessionDate,assignmentId}:null;
}
