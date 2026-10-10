import {INDICATORS, COUNTRIES, internetPopulation, calculateTest, worldBankIndicatorUrl, validateData, parseWorldBank} from "./market-model.mjs?v=20261011-3";

const $ = id => document.getElementById(id);
const format = new Intl.NumberFormat("zh-TW",{maximumFractionDigits:1});
const fmtMoney = n => "NT$"+new Intl.NumberFormat("zh-TW",{maximumFractionDigits:0}).format(n);
const number = n => format.format(n);
let snapshot = null, lastScenario = null;
const codes = Object.keys(COUNTRIES);

function initCountries(){
  for(const selector of [$("countryA"),$("countryB")]){
    selector.replaceChildren();
    for(const code of codes){const option=document.createElement("option");option.value=code;option.textContent=COUNTRIES[code];selector.append(option)}
  }
  $("countryA").value="JP";$("countryB").value="KR";
}
function status(message, bad=false){$("data-status").textContent=message;$("data-status").classList.toggle("error",bad)}
function indicator(country,code){
  const v=snapshot?.countries?.[country]?.[code];
  return v&&Number.isFinite(v.value)&&Number.isInteger(v.year)?v:null;
}
function compact(value,kind){
  if(value===null||value===undefined||!Number.isFinite(value))return "無資料";
  if(kind==="people")return number(value/1_000_000)+" 百萬人";
  if(kind==="usd")return "US$"+number(value);
  return number(value)+"%";
}
function metricRow(code,kind,title,record,country){
  const row=document.createElement("div");row.className="metric";
  const label=document.createElement("div");label.className="labelRow";
  const text=document.createElement("span");text.textContent=title;
  const year=document.createElement("span");year.textContent=record?"資料年份 "+record.year:"資料未提供";
  label.append(text,year);
  const val=document.createElement("strong");val.textContent=record?compact(record.value,kind):"無資料";
  if(!record)val.classList.add("valueNull");
  const details=document.createElement("small");
  const link=document.createElement("a");link.href=worldBankIndicatorUrl(country,code);link.rel="noopener noreferrer";link.target="_blank";link.textContent="世界銀行原始指標 ↗";
  details.append(link);row.append(label,val,details);
  return row;
}
function buildCountry(code) {
  const box=document.createElement("article");box.className="panel metricPanel";
  const heading=document.createElement("h3");heading.textContent=COUNTRIES[code];
  const sub=document.createElement("p");sub.className="countrySub";
  sub.textContent="每個指標採可取得的最新非空統計，不同年份不得視為同期資料";
  box.append(heading,sub);
  const values=snapshot.countries[code]||{};
  box.append(metricRow(INDICATORS.population.code,"people","國家總人口",values[INDICATORS.population.code],code));
  box.append(metricRow(INDICATORS.internet.code,"pct","網路使用率",values[INDICATORS.internet.code],code));
  box.append(metricRow(INDICATORS.gdppc.code,"usd","人均 GDP（現價美元）",values[INDICATORS.gdppc.code],code));
  const reach=internetPopulation(values);
  const projection=document.createElement("div");projection.className="metric";
  const lab=document.createElement("div");lab.className="labelRow";
  const lt=document.createElement("span");lt.textContent="粗估網路使用人口";const ly=document.createElement("span");ly.textContent=reach?"年份 "+reach.years.join(" / "):"不可計算";
  lab.append(lt,ly);
  const figure=document.createElement("strong");figure.textContent=reach?compact(reach.value,"people"):"無法計算";
  const explanation=document.createElement("small");explanation.textContent="總人口 × 網路使用率；不同年份可能混用，不是有效買家數";
  projection.append(lab,figure,explanation);
  box.append(projection);
  return box;
}
function renderSummary(a,b){
  const pa=internetPopulation(snapshot.countries[a]),pb=internetPopulation(snapshot.countries[b]);
  const text=$("marketSummary");
  if(!pa||!pb){text.textContent="至少一個國家缺少人口或網路使用率，無法比較網路使用人口。請直接查看資料年份和來源，不要自行填補缺漏。";return}
  const leading=pa.value>pb.value?a:b;
  const ratio=Math.max(pa.value,pb.value)/Math.max(1,Math.min(pa.value,pb.value));
  text.textContent="這組資料顯示："+COUNTRIES[leading]+"的粗估網路使用人口約為另一市場的 "+number(ratio)+" 倍。這僅代表全國網路可及規模的代理值，不表示你的商品在那裡比較好賣。下一步應調查品類需求、法規、物流和競爭者。";
}
function renderComparison(){
  const a=$("countryA").value,b=$("countryB").value;
  if(a===b){status("請選擇兩個不同國家",true);return}
  if(!snapshot){status("官方資料尚未成功載入。請使用下方成本試算，或稍後重試。",true);return}
  const cards=$("countryMetrics");cards.replaceChildren(buildCountry(a),buildCountry(b));
  renderSummary(a,b);
}
async function retrieveDirect(a,b){
  const countries={};
  countries[a]={};countries[b]={};
  const paths=[INDICATORS.population.code,INDICATORS.internet.code,INDICATORS.gdppc.code];
  for(const code of paths){
    // Official WDI API JSON endpoint, no credentials, and all missing values preserved.
    const url="https://api.worldbank.org/v2/country/"+encodeURIComponent(a+";"+b)+"/indicator/"+code+"?format=json&date=2018:2026&per_page=100";
    const controller=new AbortController();const tid=setTimeout(()=>controller.abort(),12000);
    let payload;
    try{const resp=await fetch(url,{signal:controller.signal});if(!resp.ok)throw Error("World Bank HTTP "+resp.status);payload=await resp.json();}
    finally{clearTimeout(tid)}
    for(const c of [a,b]){const val=parseWorldBank(payload,code,c);if(val)countries[c][code]=val;}
  }
  return {source:"World Bank WDI",fetched_at:new Date().toISOString(),countries,method:"Latest non-null by country and indicator, from the official public API."};
}
async function loadData(){
  $("compareBtn").disabled=true;status("正在讀取世界銀行統計資料…");
  try {
    const response=await fetch("./data/market-data.json",{cache:"no-store"});
    if(!response.ok)throw Error("No cached official snapshot yet");
    const data=await response.json();
    if(!validateData(data))throw Error("Invalid snapshot shape");
    snapshot=data;
    status("官方資料快照已載入 · 擷取日期 "+data.fetched_at?.slice(0,10)+" · 每個指標各自標示統計年份");
  } catch(_) {
    try{
      status("資料快照尚未就緒；改從世界銀行官方 API 直接讀取…");
      snapshot=await retrieveDirect($("countryA").value,$("countryB").value);
      status("已直接取得世界銀行官方資料 · 不含虛構數值");
    }catch(e){
      snapshot=null;
      status("目前無法取得世界銀行資料（可能是跨來源瀏覽器限制或連線問題）。不提供模擬數字。",true);
    }
  }
  $("compareBtn").disabled=false;
  renderComparison();
}
async function changeMarkets(){
  if($("countryA").value===$("countryB").value){status("請選擇兩個不同國家",true);return}
  const a=$("countryA").value,b=$("countryB").value;
  if(snapshot?.countries[a]&&snapshot?.countries[b]&&Object.keys(snapshot.countries[a]).length&&Object.keys(snapshot.countries[b]).length){renderComparison();return}
  $("compareBtn").disabled=true;status("正在下載選擇的市場資料…");
  try{
    const direct=await retrieveDirect(a,b);
    if(!snapshot)snapshot=direct;else Object.assign(snapshot.countries,direct.countries);
    status("已從世界銀行 API 取得所選市場資料");
    renderComparison();
  }catch(e){status("所選市場目前無法取得官方資料。不會以假數字補齊。",true)}
  finally{$("compareBtn").disabled=false}
}
function calc(){
  try{
    const scenario={
      price:$("price").value,cost:$("variableCost").value,
      budget:$("adBudget").value,clickCost:$("cpc").value,conversion:$("conversion").value
    };
    const computed=calculateTest(scenario);
    lastScenario={inputs:scenario,computed};
    $("margin").textContent=fmtMoney(computed.margin);
    if(!computed.viable){
      $("breakeven").textContent="不可能";$("clicks").textContent="—";$("breakevenRate").textContent="—";
      $("estimate").textContent=computed.reason;
      return;
    }
    $("breakeven").textContent=number(computed.breakEvenOrders)+" 單";
    $("clicks").textContent=number(computed.visits)+" 次";
    $("breakevenRate").textContent=number(computed.breakEvenConversion)+"%";
    const prof=computed.expectedContribution;
    $("estimate").textContent="依輸入假設，可能產生約 "+number(computed.expectedOrders)+" 筆『期望訂單』，扣除廣告預算後的模型貢獻為 "+fmtMoney(prof)+"。"+
      (computed.breakEvenConversion>100?"以目前假設的點擊成本和毛利，即使全部點擊都成交也無法回本。":"若實際成交率低於 "+number(computed.breakEvenConversion)+"%，這筆廣告費便無法回收。")+
      " 這不是實際成交紀錄，也未計平台費、稅、退款或固定費。";
  }catch(e){lastScenario=null;$("estimate").textContent=e.message;$("margin").textContent=$("breakeven").textContent=$("clicks").textContent=$("breakevenRate").textContent="—"}
}
function saveReport(){
  if(!lastScenario){calc();if(!lastScenario)return}
  const a=$("countryA").value,b=$("countryB").value;
  const countries={};
  for(const key of [a,b]){countries[key]={name:COUNTRIES[key],indicators:{}};
    for(const {code} of Object.values(INDICATORS))countries[key].indicators[code]={
      record:indicator(key,code),source:worldBankIndicatorUrl(key,code)};
  }
  const report={
    generated_at:new Date().toISOString(),title:"TasteProof MarketCheck",
    source:snapshot?.source||"No official data available",
    snapshot_retrieved_at:snapshot?.fetched_at||null,
    countries,advertising_test:lastScenario,
    warning:"Country-level proxies are not buyers; user-supplied ad-test figures are hypothetical, not observed profits."
  };
  const blob=new Blob([JSON.stringify(report,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);const aLink=document.createElement("a");aLink.href=url;aLink.download="tasteproof-marketcheck.json";aLink.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
initCountries();
$("compareBtn").addEventListener("click",changeMarkets);
$("calcBtn").addEventListener("click",calc);
// Keep the results up to date as each number is changed (no button press required).
for (const inputId of ["price","variableCost","adBudget","cpc","conversion"]) {
  $(inputId).addEventListener("input",calc);
}
$("report-action").addEventListener("click",saveReport);
calc();loadData();
