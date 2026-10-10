// TasteProof Decision Lab: falsifiable claims + actual campaign observations.
// Deterministic decision aid. Not an autonomous AI model, not a profit forecast.
export const MARKETS = Object.freeze({
 JP:"日本", KR:"韓國", SG:"新加坡", VN:"越南", TH:"泰國", MY:"馬來西亞",
 US:"美國", GB:"英國", AU:"澳洲", DE:"德國", FR:"法國", IN:"印度"
});
function numeric(v,label,allowZero=false){
 if(v===null||v===undefined||String(v).trim()==="")throw Error(label+"尚未填寫");
 const n=Number(v);
 if(!Number.isFinite(n)||(allowZero?n<0:n<=0))throw Error(label+"必須是有效的"+(allowZero?"非負":"正")+"數字");
 return n;
}
export function wilsonInterval(successes,total,z=1.96){
 if(!Number.isInteger(total)||total<1||!Number.isInteger(successes)||successes<0||successes>total)throw Error("觀測次數必須是整數，訂單數不得大於點擊數");
 const phat=successes/total, z2=z*z, denominator=1+z2/total;
 const center=(phat+z2/(2*total))/denominator;
 const delta=z*Math.sqrt(phat*(1-phat)/total+z2/(4*total*total))/denominator;
 return {lower:Math.max(0,center-delta),upper:Math.min(1,center+delta),rate:phat};
}
export function evaluateHypothesis(input){
 const idea=String(input.idea||"").trim();
 if(idea.length<4||idea.length>160)throw Error("請輸入 4–160 字的真實商業構想");
 if(!MARKETS[input.market])throw Error("請選擇支援的市場");
 const price=numeric(input.price,"售價");
 const cost=numeric(input.cost,"每單直接成本",true);
 const cpc=numeric(input.cpc,"每次點擊成本");
 const budget=numeric(input.budget,"廣告測試預算");
 const conversion=numeric(input.conversion,"假設成交率",true);
 const desired=numeric(input.desired,"期望淨利",true);
 if(conversion>100)throw Error("成交率不可高於 100%");
 if(budget>3000)throw Error("本次挑戰的試驗預算不可超過 NT$3,000");
 const unitMargin=price-cost;
 const impressionsClaim="未測得曝光、觸及、實際購買需求或產品文化接受度";
 const visits=budget/cpc;
 const assumedOrders=visits*conversion/100;
 const expectedNet=assumedOrders*unitMargin-budget;
 const viable=unitMargin>0;
 const breakEvenRate=viable ? 100*cpc/unitMargin:Infinity;
 const neededOrders=viable?Math.ceil((desired+budget)/unitMargin):null;
 const neededCVR=viable?100*neededOrders/visits:null;
 const survival=Math.max(0, Math.min(100, breakEvenRate));
 const scenarios=[.5,1,2].map(multiplier=>({
   case:multiplier===.5?"悲觀（成交率減半）":multiplier===1?"原始假設":"樂觀（成交率加倍）",
   conversion:Math.min(100,conversion*multiplier),
   orders:visits*Math.min(100,conversion*multiplier)/100,
   estimatedNet:visits*Math.min(100,conversion*multiplier)/100*unitMargin-budget
 }));
 const decisive = !viable ? "成本結構已經不合理：每單沒有正毛利"
   : breakEvenRate>100 ? "假設點擊成本高於每單毛利，僅靠這種廣告流量無法回本"
   : conversion < breakEvenRate ? "以目前自行假設的成交率，廣告預算無法回本"
   : "以自行假設的數字可達損益兩平；但沒有真實成交證據";
 const pilotBudget=Math.min(budget,600);
 const pilotVisits=pilotBudget/cpc;
 return {
  idea,market:input.market,marketName:MARKETS[input.market],
  unitMargin,visits,assumedOrders,expectedNet,breakEvenRate,neededOrders,neededCVR,viable,
  scenarios,decisive,pilotBudget,pilotVisits,survival,
  dossier:[
   {grade:"實證：宏觀",title:"公開國家統計",finding:"可查看人口、網路普及率與人均 GDP；它們只能描述市場條件，不能證明此產品有需求",source:"World Bank WDI"},
   {grade:"未證明：產品",title:"目標市場的真實需求",finding:impressionsClaim,source:"需要產品類別銷量、競品、搜尋行為或經認證的 Qloo 偏好資料"},
   {grade:"假設：成本",title:"流量與成交率",finding:"點擊成本與成交率目前由使用者輸入，不能視為已發生的廣告與訂單",source:"使用者假設"}
  ],
  experiments:[
   {name:"先驗證訊息",action:"設計兩套不同賣點，用同一客群與相近曝光條件測試意願；先不要把點擊當作付款",cap:pilotBudget},
   {name:"再驗證真實成交",action:"選擇合規且可實際付款的測試方式，記錄實際點擊、廣告花費與已付款訂單",cap:budget-pilotBudget},
   {name:"用反證規則停損",action:"若真實每次獲客花費長期高於每單毛利，停止廣告並重新檢查定位與價格",cap:0}
  ],
  caution:"只有用真實觀測資料才能初步檢驗這個想法；單靠世界銀行總人口、人均 GDP 或程式計算不能推導文化偏好、客戶意願或未來淨利。"
 };
}
export function assessRealEvidence(raw,unitMargin){
 const clicks=numeric(raw.clicks,"實際點擊次數");
 const orders=numeric(raw.orders,"已付款訂單",true);
 const spend=numeric(raw.spend,"實際廣告費用",true);
 if(!Number.isInteger(clicks)||!Number.isInteger(orders)||orders>clicks)throw Error("實際點擊與已付款訂單必須是整數，訂單不可多於點擊");
 if(spend===0)throw Error("尚無付費廣告費用；不能用此方法推論付費獲客成本");
 const ci=wilsonInterval(orders,clicks);
 const observedCPC=spend/clicks;
 const threshold=unitMargin>0 ? observedCPC/unitMargin : Infinity;
 // Observational uncertainty only; no correction for audience/selection bias.
 const decision=unitMargin<=0?"停止：每單毛利不為正":
   ci.upper<threshold?"重新設計：信賴區間上界仍低於損益兩平成交率":
   ci.lower>threshold?"可擴大驗證：區間下界高於損益兩平成交率，但仍需確認選樣偏差與其他成本":
   "尚不能下結論：觀測區間跨過損益兩平門檻";
 return {clicks,orders,spend,observedCPC,observedRate:ci.rate,ci,threshold,
   contribution:orders*unitMargin-spend,decision,
   note:"Wilson 95% 二項比例區間，假設點擊相互獨立且可比較；無法修正廣告歸因、樣本偏差、退款或平台費。"};
}
