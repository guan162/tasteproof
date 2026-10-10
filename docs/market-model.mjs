// TasteProof MarketCheck — calculations and official indicator definitions.
// No predictive market scoring; all results are descriptive or user-supplied scenarios.
export const INDICATORS = Object.freeze({
  population: {code:"SP.POP.TOTL",name:"總人口",unit:"人"},
  internet: {code:"IT.NET.USER.ZS",name:"網路使用率",unit:"%"},
  gdppc: {code:"NY.GDP.PCAP.CD",name:"人均 GDP",unit:"現價美元"},
});
export const COUNTRIES = Object.freeze({
  JP:"日本",KR:"韓國",SG:"新加坡",MY:"馬來西亞",TH:"泰國",
  VN:"越南",ID:"印尼",PH:"菲律賓",US:"美國",GB:"英國",
  AU:"澳洲",DE:"德國",FR:"法國",IN:"印度",CN:"中國",BR:"巴西"
});
export function parseWorldBank(rows, code, country) {
  if (!Array.isArray(rows) || !Array.isArray(rows[1])) throw new Error("世界銀行 API 回傳格式不符");
  const list=rows[1].filter(x=>x && x.countryiso3code && x.country?.id===country
    && x.indicator?.id===code && typeof x.value==="number" && Number.isFinite(x.value));
  list.sort((a,b)=>Number(b.date)-Number(a.date));
  if(!list.length) return null;
  const x=list[0];
  return {value:x.value,year:Number(x.date)};
}
export function validateData(dataset) {
  if(!dataset||dataset.source!=="World Bank WDI"||typeof dataset.countries!=="object") return false;
  const entries=Object.entries(dataset.countries);
  if(!entries.length) return false;
  return entries.some(([c,values])=>COUNTRIES[c]&&values&&Object.values(INDICATORS).some(({code})=>{
    const v=values[code];return v&&Number.isFinite(v.value)&&Number.isInteger(v.year);
  }));
}
export function internetPopulation(country) {
  const p=country?.[INDICATORS.population.code], net=country?.[INDICATORS.internet.code];
  if(!p||!net||!Number.isFinite(p.value)||!Number.isFinite(net.value) ||
    net.value<0||net.value>100||p.value<0) return null;
  return {value:p.value*net.value/100,years:[p.year,net.year],
    note:"總人口 × 網路使用率；可能混用不同年份，並非買家數量"};
}
export function calculateTest({price,cost,budget,clickCost,conversion}) {
  const v=[price,cost,budget,clickCost,conversion].map(Number);
  if(v.some(x=>!Number.isFinite(x))) throw Error("請輸入有效數字");
  const [p,c,b,cp,cv]=v;
  if(p<=0||c<0||b<=0||cp<=0||cv<0||cv>100) throw Error("金額需符合正數限制，轉換率介於 0% 與 100%");
  const margin=p-c;
  if(margin<=0) return {margin,viable:false,reason:"售價沒有高於每單直接成本；增加廣告費只會擴大損失"};
  const visits=b/cp;
  const expectedOrders=visits*cv/100;
  const expectedContribution=expectedOrders*margin-b;
  return {margin,viable:true,visits,expectedOrders,expectedContribution,
    breakEvenOrders:Math.ceil(b/margin),
    breakEvenConversion:100*cp/margin,
    breakEvenCPC:margin*(cv/100),
    disclaimer:"僅依使用者假設計算的廣告測試情境，不是流量、成交或獲利預測。未計平台費、稅、退款與固定費。"};
}
export function worldBankIndicatorUrl(country,code) {
  if(!COUNTRIES[country]||!Object.values(INDICATORS).some(x=>x.code===code)) throw Error("Unsupported country or indicator");
  return "https://data.worldbank.org/indicator/"+code+"?locations="+country;
}
