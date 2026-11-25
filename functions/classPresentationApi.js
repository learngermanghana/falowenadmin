const crypto = require("node:crypto");
const clean = v => String(v || "").trim();
const lower = v => clean(v).toLowerCase().replace(/\s+/g, " ");
const fail = (status, message) => { throw Object.assign(new Error(message), {status}); };
const safeId = v => /^[a-zA-Z0-9_-]{1,180}$/.test(clean(v));
const hash = (...parts) => crypto.createHash("sha256").update(JSON.stringify(parts)).digest("hex");
const OWNER = "moxflex@gmail.com", STAFF = "staff@falowen.app";
function teacherRole(u) {
  const email = u.email_verified === true ? lower(u.email) : "";
  if (u.admin === true || u.role === "admin" || email === OWNER) return "admin";
  const staff = u.staff === true || ["staff","tutor"].includes(u.role) || email === STAFF;
  if (!staff || (Array.isArray(u.staffLanguages) && !u.staffLanguages.includes("german"))) return "";
  if (Array.isArray(u.staffPages) ? !u.staffPages.includes("teaching-slides") : u.staffRole === "reviewer") return "";
  return "staff";
}
function classAliases(c) {
  return [c.id,c.classId,c.classRecordId,c.name,c.className].map(lower).filter(Boolean);
}
function studentInClass(student, klass) {
  const aliases = new Set(classAliases(klass));
  const placements = [student, student.german, student.germanEnrollment, student.enrollments?.german, student.languageEnrollments?.german].filter(Boolean);
  return placements.some(p => [p.classId,p.classRecordId,p.assignedClassId,p.className,p.classname,p.class,p.group,p.cohort].some(v=>aliases.has(lower(v))));
}
function validateOpen(body) {
  const classId=clean(body.classId), sessionId=clean(body.sessionId), sessionDate=clean(body.sessionDate), assignmentId=clean(body.assignmentId).toUpperCase(), choice=clean(body.choice || "default");
  if (!safeId(classId) || !sessionId || sessionId.length>200 || !/^\d{4}-\d{2}-\d{2}$/.test(sessionDate) || !/^A2-\d{1,2}\.(?:[1-9]|1\d|2[0-8])$/.test(assignmentId) || !safeId(choice)) fail(400,"Invalid class, session or lesson.");
  const prompt=clean(body.prompt);
  const keywords=(Array.isArray(body.keywords)?body.keywords:[]).map(clean).filter(Boolean);
  const questions=(Array.isArray(body.questions)?body.questions:[]).map(clean).filter(Boolean);
  if (!prompt || prompt.length>500 || keywords.length>12 || questions.length>12 || [...keywords,...questions].some(s=>s.length>350)) fail(400,"Invalid presentation prompt.");
  return {classId,sessionId,sessionDate,assignmentId,choice,prompt,keywords,questions};
}
function validateResponse(value) {
  const answer=clean(value);
  if (!answer || answer.length>3000) fail(400,"Write between 1 and 3000 characters.");
  return answer;
}
async function findStudent(db,user) {
  const direct=await db.collection("students").doc(user.uid).get();
  if(direct.exists) return {id:direct.id,...direct.data()};
  const link=await db.collection("studentAuthLinks").doc(user.uid).get();
  if(link.exists && safeId(link.data()?.studentId)){
    const snap=await db.collection("students").doc(link.data().studentId).get();
    if(snap.exists) return {id:snap.id,...snap.data()};
  }
  for(const field of ["uid","authUid","firebaseUid","firebaseUID"]){
    const q=await db.collection("students").where(field,"==",user.uid).limit(2).get();
    if(q.size===1) return {id:q.docs[0].id,...q.docs[0].data()};
    if(q.size>1) fail(403,"Your account needs to be linked to one student record.");
  }
  fail(403,"Your Falowen student account is not linked. Ask your teacher for help.");
}
async function getClass(db,id) {
  const doc=await db.collection("classes").doc(id).get();
  if(!doc.exists) fail(404,"Class not found. Open the lesson from the class schedule.");
  const klass={...doc.data(),id:doc.id};
  if(lower(klass.language)==="swahili" || ![klass.level,klass.levelId,klass.courseLevel,klass.name,klass.className,klass.classId].some(v=>/^a2(?:\b|$)/i.test(clean(v)))) fail(403,"Only German A2 classes are supported.");
  return klass;
}
function sessionView(s){return {id:s.id,className:s.className,assignmentId:s.assignmentId,sessionDate:s.sessionDate,prompt:s.prompt,keywords:s.keywords,questions:s.questions,expiresAt:s.expiresAt};}
function registerClassPresentationRoutes({app,db,admin}) {
  const sessions=db.collection("classPresentationSessions");
  const auth=async req=>{
    const match=clean(req.headers.authorization).match(/^Bearer (.+)$/i);
    if(!match) fail(401,"Sign in with your Falowen account.");
    let u;try{u=await admin.auth().verifyIdToken(match[1]);}catch{fail(401,"Sign in again.");}
    if(!u.uid) fail(401,"Sign in again.");
    return u;
  };
  const wrap=fn=>async(req,res)=>{res.set("Cache-Control","no-store");try{const user=await auth(req);res.json({ok:true,...await fn(req,user)});}catch(e){res.status(e.status||500).json({ok:false,error:e.status?e.message:"Presentation request failed. Please retry."});}};
  const load=async id=>{if(!/^[a-f0-9]{64}$/.test(clean(id)))fail(404,"Presentation not found.");const ref=sessions.doc(id),snap=await ref.get();if(!snap.exists)fail(404,"Presentation not found.");return {ref,s:{id:snap.id,...snap.data()}};};
  const teacher= (u,s)=> {const role=teacherRole(u);if(!role || (s && role!=="admin" && s.teacherUid!==u.uid))fail(403,"Teacher access required.");};
  const student=async (u,s)=>{
    if(Date.now()>s.expiresAt)fail(410,"This presentation link has expired.");
    const [record,klass]=await Promise.all([findStudent(db,u),getClass(db,s.classId)]);
    if(!studentInClass(record,klass))fail(403,"This presentation is for another class.");
    if(["inactive","withdrawn","cancelled","canceled","suspended"].includes(lower(record.status)))fail(403,"Your student account is inactive.");
    return record;
  };
  app.post("/class-presentation/open",wrap(async(req,u)=>{
    teacher(u);
    const payload=validateOpen(req.body||{}),klass=await getClass(db,payload.classId);
    const id=hash(payload.classId,payload.sessionId,payload.sessionDate,payload.assignmentId,payload.choice);
    const ref=sessions.doc(id);
    const session=await db.runTransaction(async tx=>{
      const snap=await tx.get(ref);
      if(snap.exists){const current={id,...snap.data()};teacher(u,current);return current;}
      const value={...payload,className:clean(klass.name||klass.className||klass.classId)||klass.id,teacherUid:u.uid,expiresAt:Date.now()+12*60*60*1000,createdAt:Date.now()};
      tx.create(ref,value);return {id,...value};
    });
    if(Date.now()>session.expiresAt)fail(410,"This class presentation has expired.");
    return {session:sessionView(session)};
  }));
  app.get("/class-presentation/student/:id",wrap(async(req,u)=>{
    const {ref,s}=await load(req.params.id);const record=await student(u,s);
    const snap=await ref.collection("responses").doc(hash(record.id)).get();
    return {session:sessionView(s),answer:snap.exists?clean(snap.data().answer):""};
  }));
  app.post("/class-presentation/student/:id",wrap(async(req,u)=>{
    const {ref,s}=await load(req.params.id);const record=await student(u,s);
    const answer=validateResponse(req.body?.answer);
    await ref.collection("responses").doc(hash(record.id)).set({studentName:clean(record.name||record.fullName||record.displayName)||"Student",answer,updatedAt:Date.now()});
    return {saved:true};
  }));
  app.get("/class-presentation/teacher/:id",wrap(async(req,u)=>{
    const {ref,s}=await load(req.params.id);teacher(u,s);
    const snap=await ref.collection("responses").limit(200).get();
    return {session:sessionView(s),responses:snap.docs.map(d=>({id:d.id,studentName:d.data().studentName,answer:d.data().answer,updatedAt:d.data().updatedAt})).sort((a,b)=>a.studentName.localeCompare(b.studentName))};
  }));
}
module.exports={registerClassPresentationRoutes,teacherRole,studentInClass,validateOpen,validateResponse};
