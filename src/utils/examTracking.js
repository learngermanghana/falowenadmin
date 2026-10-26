// Scores are practice metadata, never evidence of online presence.
export function trackingRows(practices=[], speaking=[], mocks=[]) {
  return [
    ...practices.map(row=>({...row, skill:row.section, score:row.percent, status:'Scored practice', date:row.date})),
    ...speaking.map((row,i)=>({id:`speaking-${row.uid}-${row.startedAt}-${i}`,uid:row.uid,
      name:row.studentName,email:row.studentEmail,level:row.level,skill:'sprechen',
      title:row.assignmentKey || 'Live examiner',score:row.score,
      status:row.score == null ? 'Not scored yet' : 'Scored practice',date:row.startedAt})),
    ...mocks.map(row=>({id:row.id,uid:row.uid,name:row.studentName,email:row.studentEmail,
      level:row.level,skill:'mock',title:row.mockId,score:row.overallScore,
      status:row.status==='completed'?'Completed mock':'In progress',date:row.updatedAt||row.startedAt})),
  ].sort((a,b)=>(Date.parse(b.date)||0)-(Date.parse(a.date)||0));
}
export function filterTracking(rows,{search='',level='all',skill='all',followUp=false}={}) {
  const term=search.trim().toLowerCase();
  return rows.filter(row=>(level==='all'||row.level===level)&&(skill==='all'||row.skill===skill)
    &&(!followUp||row.score==null||row.score<60)
    &&[row.name,row.email,row.studentCode,row.uid,row.title].some(v=>String(v||'').toLowerCase().includes(term)));
}
