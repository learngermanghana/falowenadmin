export const MOCK_LEVELS = Object.freeze(["A1","A2","B1","B2","C1","C2"]);
export const MOCK_SECTIONS = Object.freeze(["lesen","hoeren","schreiben","sprechen"]);
const slug = number => String(number).padStart(2,"0");

export function newMockDraft(level, number) {
  if (!MOCK_LEVELS.includes(level)) throw new Error("Choose a supported Goethe level.");
  const n=Number(number);
  if (!Number.isInteger(n)||n<1||n>999) throw new Error("Mock number must be from 1 to 999.");
  const id=`${level.toLowerCase()}-mock-${slug(n)}`;
  return {
    id,level,mockNumber:n,title:`${level} Mock ${n}`,
    status:"draft", schemaVersion:1,
    sections:Object.fromEntries(MOCK_SECTIONS.map(name=>[name,{
      ready:false,questionCount:0,answerKeyCount:0,
      answerKeyVerified:false,audioVerified:false,rubricVerified:false,
      tasksJson:"",answerKeyJson:"",audioManifestJson:"",rubricNotes:"",notes:"",
    }])),
    qa:{studentResultSaved:false,adminResultSaved:false,safeRetry:false,
      backendVerified:false,frontendVerified:false},
  };
}

export function validateMockDraft(draft) {
  const errors=[];
  if(!MOCK_LEVELS.includes(draft?.level))errors.push("Select A1, A2, B1, B2, C1 or C2.");
  if(!/^[a-z][a-z0-9-]+$/.test(String(draft?.id||"")))errors.push("Invalid mock ID.");
  if(!String(draft?.title||"").trim())errors.push("Add an exam title.");
  if(!["draft","review"].includes(draft?.status))errors.push("Only draft/review status is allowed in Admin.");
  for(const section of MOCK_SECTIONS){
    const part=draft?.sections?.[section]||{};
    if(!part.ready)errors.push(`${section}: content still in progress`);
    if(!Number.isInteger(Number(part.questionCount))||Number(part.questionCount)<1)
      errors.push(`${section}: add the task/question count`);
    if(section==="lesen"||section==="hoeren"){
      if(Number(part.answerKeyCount)<1 || !Number.isInteger(Number(part.answerKeyCount)))
        errors.push(`${section}: add the answer count`);
      else if(Number(part.questionCount)!==Number(part.answerKeyCount))
        errors.push(`${section}: answer count does not match questions`);
      if(!part.answerKeyVerified)errors.push(`${section}: compare answer key with source questions`);
      if(part.answerKeyJson?.trim()){
        try{
          const answer=JSON.parse(part.answerKeyJson);
          if(!answer||typeof answer!=="object"||Array.isArray(answer)||
            Object.keys(answer).length!==Number(part.answerKeyCount))
            errors.push(`${section}: answer key JSON has the wrong number of entries`);
        }catch{errors.push(`${section}: answer key must be valid JSON`);}
      } else errors.push(`${section}: attach the server answer-key draft`);
    }
    if(section==="hoeren"){
      if(!part.audioVerified)errors.push("hoeren: verify R2 audio and authorized playback");
      if(part.audioManifestJson?.trim()){
        try{
          const manifest=JSON.parse(part.audioManifestJson);
          if(!Array.isArray(manifest)||!manifest.length||manifest.some(item=>!item?.objectKey))
            errors.push("hoeren: audio manifest needs objectKey for each file");
        }catch{errors.push("hoeren: audio manifest must be a JSON array");}
      }else errors.push("hoeren: add the protected R2 audio manifest");
    }
    if((section==="schreiben"||section==="sprechen")&&!part.rubricVerified)
      errors.push(`${section}: task-specific OpenAI scoring rubric not verified`);
    if(!String(part.tasksJson||"").trim()){
      errors.push(`${section}: add the source tasks/questions`);
    }else{
      try{
        const tasks=JSON.parse(part.tasksJson);
        if(!Array.isArray(tasks)||!tasks.length||tasks.length!==Number(part.questionCount))
          errors.push(`${section}: tasks JSON must contain exactly the declared count`);
      }catch{errors.push(`${section}: tasks must be a JSON array`);}
    }
  }
  for(const [name,label] of Object.entries({
    studentResultSaved:"student result",adminResultSaved:"Admin result",
    safeRetry:"idempotent result recovery",backendVerified:"live backend deployment",
    frontendVerified:"live frontend deployment"
  }))if(!draft?.qa?.[name])errors.push(`Full exam test: ${label} not verified`);
  return errors;
}

export function exportMockDraft(draft){
  // This export is NOT a deployable public exam; server-owned keys and final
  // grading must be registered and verified in Falowen before publication.
  return JSON.stringify({ ...draft,exportedAt:new Date().toISOString(),status:"draft" },null,2);
}
