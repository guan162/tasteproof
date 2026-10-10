import {MARKETS,evaluateHypothesis,assessRealEvidence} from "./decision-engine.mjs?v=1";
const $=id=>document.getElementById(id);
const money=n=>Number.isFinite(n)?"NT$"+new Intl.NumberFormat("zh-TW",{maximumFractionDigits:0}).format(n):"無法計算";
const pct=n=>Number.isFinite(n)?new Intl.NumberFormat("zh-TW",{maximumFractionDigits:2}).format(n)+"%":"無法計算";
const count=n=>Number.isFinite(n)?new Intl.NumberFormat("zh-TW",{maximumFractionDigits:1}).format(n):"無法計算";
let latest=null,macro=null;
for(const [id,name] of Object.entries(MARKETS)){const option=new Option(name,id);$("market").add(option)}
$("market").value="JP";
function element(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e}
function card(parent,marker,title,description){
 const article=element("div","card");
 article.append(element("div","label",marker),element("h3",null,title),element("p",null,description));
 parent.append(article);return article;
}
function input(){
 return {idea:$("idea").value,market:$("market").value,price:$("price").value,
 cost:$("cost").value,cpc:$("cpc").value,conversion:$("conversion").value,
 budget:$("budget").value,desired:$("desired").value};
}
function renderReport(){
 try{
   const report=evaluateHypothesis(input());latest=report;
   $("status").textContent="";
   $("empty").hidden=true;$("result").hidden=false;
   $("verdict").textContent=report.decisive;
   $("verdictWhy").textContent=report.caution;
   $("verdictType").textContent=report.expectedNet>=0&&report.viable?"需實證驗收":"優先排除虧損";
   $("margin").textContent=money(report.unitMargin);
   $("breakEven").textContent=pct(report.breakEvenRate);
   $("orders").textContent=report.neededOrders===null?"無法達標":count(report.neededOrders)+" 單";
   $("targetRate").textContent=report.neededCVR===null?"不可能":pct(report.neededCVR);
   const table=$("scenarioRows");table.replaceChildren();
   for(const scenario of report.scenarios){
     const tr=document.createElement("tr");
     for(const value of [scenario.case,pct(scenario.conversion),money(scenario.estimatedNet)])tr.append(element("td",null,value));
     table.append(tr);
   }
   const dossier=$("dossier");dossier.replaceChildren();
   for(const item of report.dossier){
     const c=card(dossier,item.grade,item.title,item.finding);
     c.append(element("div","muted","資料依據："+item.source));
   }
   const exp=$("experiments");exp.replaceChildren();
   for(const item of report.experiments){
     const c=card(exp,"預算上限 "+money(item.cap),item.name,item.action);
     if(item.cap===0)c.querySelector(".label").textContent="停損規則";
   }
   renderMacro();
   $("observedResult").hidden=true;$("observedError").textContent="";
 }catch(err){latest=null;$("status").textContent=err.message;$("empty").hidden=false;$("result").hidden=true}
}
function sourceLink(code,market){
 const a=document.createElement("a");a.href="https://data.worldbank.org/indicator/"+code+"?locations="+market;
 a.textContent="來源↗";a.rel="noopener noreferrer";a.target="_blank";return a;
}
function renderMacro(){
 const p=$("macroEvidence");p.replaceChildren();
 if(!macro||!latest){if(!macro)$("macroStatus").textContent="尚未取得世界銀行公開資料，請不要自行推估。";return}
 const entries=macro.countries?.[latest.market];
 if(!entries){$("macroStatus").textContent="未提供此國家資料。";return}
 $("macroStatus").textContent=latest.marketName+"：有國家層級的公開資料，但沒有此商業構想的直接需求證據。";
 const dims=[
 ["SP.POP.TOTL","人口","人"],["IT.NET.USER.ZS","網路使用率","%"],
 ["NY.GDP.PCAP.CD","人均 GDP","US$"]
 ];
 for(const [indicator,label,unit] of dims){
   const data=entries[indicator];const row=element("p","muted");
   const value=data&&Number.isFinite(data.value)
    ?(data.value.toLocaleString("en-US",{maximumFractionDigits:unit==="人"?0:1})+" "+unit+"（"+data.year+"）")
    :"沒有可用資料";
   row.append(document.createTextNode(label+"："+value+"  "),sourceLink(indicator,latest.market));
   p.append(row);
 }
 const caveat=element("p","muted","限制：這些數值不能推論商品銷量、受眾購買意願、文化適配性或未來利潤。");
 p.append(caveat);
}
async function loadMacro(){
 try{
   const response=await fetch("./data/market-data.json",{cache:"no-store"});
   if(!response.ok)throw Error("資料快照不存在");
   const data=await response.json();
   if(data?.source!=="World Bank WDI"||typeof data.countries!=="object")throw Error("資料來源未通過驗證");
   macro=data;
   renderMacro();
 }catch(err){$("macroStatus").textContent="世界銀行資料未能讀取："+err.message+"。系統不會顯示虛構值。"}
}
function evaluateObserved(){
 $("observedError").textContent="";
 if(!latest){$("observedError").textContent="請先建立商業假設";return}
 try{
  const info=assessRealEvidence({
   clicks:$("clicks").value,orders:$("paidOrders").value,spend:$("spend").value
  },latest.unitMargin);
  const target=$("observedResult");target.replaceChildren();target.hidden=false;
  target.append(element("div","label","實際觀測 · 不預測未來"),element("h3",null,info.decision));
  const values=[
   "實際每次點擊成本："+money(info.observedCPC),
   "實際已付款成交率："+pct(info.observedRate*100),
   "95% Wilson 估計區間："+pct(info.ci.lower*100)+" ～ "+pct(info.ci.upper*100),
   "實際廣告損益貢獻："+money(info.contribution),
   "依觀測 CPC 算出的最低成交率："+pct(info.threshold*100)
  ];
  for(const line of values)target.append(element("p",null,line));
  target.append(element("div","muted",info.note));
 }catch(err){$("observedResult").hidden=true;$("observedError").textContent=err.message}
}
function download(){
 if(!latest){$("status").textContent="請先建立計畫";return}
 const data={
  generatedAt:new Date().toISOString(),
  type:"Evidence-based hypothesis challenge; not an autonomous LLM",
  analysis:latest,
  countrySnapshot:macro?.countries?.[latest.market]||null,
  source:macro?"World Bank WDI":"No official macro data available",
  caution:"Theoretical scenarios do not establish actual sales or future profit."
 };
 const uri=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
 const a=document.createElement("a");a.href=uri;a.download="tasteproof-evidence-plan.json";a.click();setTimeout(()=>URL.revokeObjectURL(uri),1000);
}
$("run").addEventListener("click",renderReport);
$("evaluate").addEventListener("click",evaluateObserved);
$("export").addEventListener("click",download);
$("market").addEventListener("change",()=>{if(latest)renderReport()});
renderReport();loadMacro();
