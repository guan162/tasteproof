import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {INDICATORS,COUNTRIES,parseWorldBank,validateData,internetPopulation,calculateTest,parseAmount,worldBankIndicatorUrl} from "../docs/market-model.mjs";

test("country and indicators reflect actual WDI identifiers",()=>{
 assert.equal(COUNTRIES.JP,"日本");
 assert.equal(INDICATORS.population.code,"SP.POP.TOTL");
 assert.equal(INDICATORS.internet.code,"IT.NET.USER.ZS");
 assert.equal(INDICATORS.gdppc.code,"NY.GDP.PCAP.CD");
});
test("extract latest non-null original year without fabricated values",()=>{
 const payload=[{page:1,pages:1},[
  {countryiso3code:"JPN",country:{id:"JP"},indicator:{id:"SP.POP.TOTL"},date:"2024",value:1234000},
  {countryiso3code:"JPN",country:{id:"JP"},indicator:{id:"SP.POP.TOTL"},date:"2025",value:null},
  {countryiso3code:"JPN",country:{id:"JP"},indicator:{id:"SP.POP.TOTL"},date:"2022",value:1210000},
  {countryiso3code:"KOR",country:{id:"KR"},indicator:{id:"SP.POP.TOTL"},date:"2025",value:9900}
 ]];
 assert.deepEqual(parseWorldBank(payload,"SP.POP.TOTL","JP"),{value:1234000,year:2024});
 assert.equal(parseWorldBank(payload,"IT.NET.USER.ZS","JP"),null);
 assert.throws(()=>parseWorldBank({},"SP.POP.TOTL","JP"));
});
test("connected population is clearly a model proxy",()=>{
 const x=internetPopulation({"SP.POP.TOTL":{value:1000000,year:2024},"IT.NET.USER.ZS":{value:65,year:2022}});
 assert.equal(x.value,650000);
 assert.deepEqual(x.years,[2024,2022]);
 assert.equal(internetPopulation({"SP.POP.TOTL":{value:10,year:2024}}),null);
});
test("scenario correctly avoids double-counting test ad budget",()=>{
 const v=calculateTest({price:1000,cost:400,budget:3000,clickCost:8,conversion:1.5});
 assert.equal(v.margin,600);
 assert.equal(v.breakEvenOrders,5);
 assert.equal(v.visits,375);
 assert.equal(v.expectedOrders,5.625);
 assert.equal(v.expectedContribution,375);
 assert.ok(Math.abs(v.breakEvenConversion - 1.3333333333333333) < 1e-10);
});
test("bad margin and misleading assumptions are rejected",()=>{
 assert.equal(calculateTest({price:400,cost:500,budget:3000,clickCost:8,conversion:2}).viable,false);
 assert.throws(()=>calculateTest({price:100,cost:0,budget:3000,clickCost:0,conversion:2}));
 assert.throws(()=>calculateTest({price:100,cost:0,budget:3000,clickCost:8,conversion:200}));
});
test("data validation requires attributed real WDI schema",()=>{
 assert.equal(validateData({source:"World Bank WDI",countries:{JP:{"SP.POP.TOTL":{value:200,year:2024}}}}),true);
 assert.equal(validateData({source:"fiction",countries:{JP:{"SP.POP.TOTL":{value:200,year:2024}}}}),false);
 assert.equal(validateData({source:"World Bank WDI",countries:{JP:{"SP.POP.TOTL":{value:"200",year:2024}}}}),false);
});
test("original indicator sources are encoded from enumerated ids",()=>{
 assert.match(worldBankIndicatorUrl("JP","IT.NET.USER.ZS"),/^https:\/\/data\.worldbank\.org\/indicator\//);
 assert.throws(()=>worldBankIndicatorUrl("TW","SP.POP.TOTL"));
});
test("website distinguishes real evidence from speculative commerce",()=>{
 const html=readFileSync(new URL("../docs/index.html",import.meta.url),"utf8");
 const ui=readFileSync(new URL("../docs/market-app.mjs",import.meta.url),"utf8");
 for(const id of ["countryA","countryB","price","variableCost","budget","cpc","conversion"])assert.ok(html.includes('id="'+id+'"'));
 assert.match(html,/世界銀行/);
 assert.match(html,/不是/);
 assert.match(ui,/retrieveDirect/);
 assert.match(ui,/不會以假數字補齊/);
});

test("browser input strings calculate without a nonfinite error",()=>{
 const scenario={price:"1000",cost:"400",budget:"3000",clickCost:"8",conversion:"1.5"};
 const v=calculateTest(scenario);
 assert.equal(v.margin,600);
 assert.equal(v.breakEvenOrders,5);
 assert.equal(v.expectedContribution,375);
 assert.equal(parseAmount("1,5","成交率"),1.5);
 assert.throws(()=>calculateTest({...scenario,conversion:"not-a-number"}),/成交率格式錯誤/);
 assert.throws(()=>calculateTest({...scenario,cost:""}),/每單直接成本尚未填寫/);
});
