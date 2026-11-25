export function paymentProgress(row,transactions=[]){
 const amount=v=>v!==null&&v!==undefined&&v!==""&&Number.isFinite(Number(v))&&Number(v)>=0?Math.round(Number(v)*100):null;
 const fee=amount(row?.tuitionFee),paid=amount(row?.paid),balance=amount(row?.balanceDue);
 const total=transactions.reduce((sum,p)=>sum+(amount(p.amount)||0),0);
 const valid=fee!==null&&paid!==null&&balance!==null&&fee===paid+balance;
 return {percent:valid?(fee===0?100:Math.round(paid/fee*100)):null,tracked:total/100,openingOrAdjustment:paid===null?null:(paid-total)/100,valid};
}
