import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateHypothesis,assessRealEvidence,wilsonInterval} from '../docs/decision-engine.mjs';
const sample={idea:'在日本賣精品咖啡',market:'JP',price:'1000',cost:'400',cpc:'8',conversion:'1.5',budget:'3000',desired:'30000'};

test('scenario ranks actual user-entered unit economics, does not confuse revenue with profits',()=>{
 const a=evaluateHypothesis(sample);
 assert.equal(a.unitMargin,600);
 assert.equal(a.visits,375);
 assert.equal(a.expectedNet,375);
 assert.equal(a.neededOrders,55); // (30000 + 3000) / 600
 assert.match(a.decisive,/回本不等於達標/);
 assert.ok(a.neededCVR>10 && a.neededCVR<20);
 assert.ok(a.breakEvenRate>1 && a.breakEvenRate<2);
 assert.equal(a.scenarios.length,3);
 assert.equal(a.experiments[0].cap,600);
 assert.equal(a.experiments[1].cap,2400);
});

test('uncertainty stress shows negative and positive outcomes rather than inventing certainty',()=>{
 const a=evaluateHypothesis(sample);
 assert.ok(a.scenarios[0].estimatedNet<0);
 assert.ok(a.scenarios[1].estimatedNet>0);
 assert.ok(a.scenarios[2].estimatedNet>a.scenarios[1].estimatedNet);
 assert.match(a.caution,/不能推導/);
 assert.match(a.dossier[1].grade,/未證明/);
});

test('no positive margin stops impossible business structure',()=>{
 const a=evaluateHypothesis({...sample,price:400,cost:600});
 assert.equal(a.viable,false);
 assert.equal(a.neededOrders,null);
 assert.match(a.decisive,/成本結構/);
});

test('rejects invalid market, oversized cash, empty idea and impossible conversion',()=>{
 assert.throws(()=>evaluateHypothesis({...sample,market:'TW'}));
 assert.throws(()=>evaluateHypothesis({...sample,conversion:120}));
 assert.throws(()=>evaluateHypothesis({...sample,budget:5000}),/3,000/);
 assert.throws(()=>evaluateHypothesis({...sample,idea:'bad'}),/4–160/);
});

test('observational inference: zero orders and positive spending are not automatically proof',()=>{
 const out=assessRealEvidence({clicks:100,orders:0,spend:2000},600);
 assert.equal(out.contribution,-2000);
 assert.equal(out.observedRate,0);
 assert.equal(out.ci.lower,0);
 assert.ok(out.ci.upper>0);
 assert.match(out.note,/Wilson/);
});

test('observed purchases decide on confidence band, not a fixed invented score',()=>{
 const yes=assessRealEvidence({clicks:1000,orders:100,spend:8000},600);
 assert.ok(yes.ci.lower>yes.threshold);
 assert.match(yes.decision,/擴大驗證/);
 const no=assessRealEvidence({clicks:1000,orders:0,spend:8000},600);
 assert.ok(no.ci.upper<no.threshold);
 assert.match(no.decision,/重新設計/);
 const unsure=assessRealEvidence({clicks:375,orders:4,spend:3000},600);
 assert.match(unsure.decision,/尚不能下結論/);
});

test('refuses invalid observed counts and cannot turn hypothetical returns into facts',()=>{
 assert.throws(()=>assessRealEvidence({clicks:1,orders:2,spend:2},600));
 assert.throws(()=>assessRealEvidence({clicks:100,orders:1,spend:0},600));
 assert.throws(()=>wilsonInterval(3,2));
});

test('case outputs never claim cultural facts without Qloo',()=>{
 const a=evaluateHypothesis(sample);
 assert.ok(a.dossier.some(x=>x.source.includes('Qloo')));
 assert.ok(a.dossier.some(x=>x.grade.includes('假設')));
 assert.doesNotMatch(a.decisive,/Qloo 實測/);
});
