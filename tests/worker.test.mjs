import test from 'node:test';
import assert from 'node:assert/strict';
import worker, {validate, chooseBrand, extractTags, analyze} from '../worker/index.mjs';
const inp={brand:'Aurora',sector:'Coffee',base:'Tokyo',targets:['Taipei','Seoul'],reference_brand:'Starbucks'};
const env={QLOO_API_KEY:'secret-test-key',ALLOWED_ORIGIN:'https://guan162.github.io'};
const calls=[];
async function stub(url, opts){
  calls.push({url,opts});
  assert.equal(opts.headers['X-Api-Key'],'secret-test-key');
  const u=new URL(url);
  if(u.pathname==='/search') return new Response(JSON.stringify({results:[{name:'Starbucks',entity_id:'brand-uuid',subtype:'urn:entity:brand'}]}),{status:200});
  assert.equal(u.searchParams.get('filter.type'),'urn:tag');
  assert.equal(u.searchParams.get('signal.interests.entities'),'brand-uuid');
  const city=u.searchParams.get('signal.location.query');
  const list={Tokyo:['Craft','Design'],Taipei:['Craft','Tea'],Seoul:['Fashion','Design']}[city];
  return new Response(JSON.stringify({results:{tags:list.map(x=>({tag_id:'urn:tag:'+x.toLowerCase(),name:x}))}}),{status:200});
}
test('input validation limits destinations',()=>{
  assert.equal(validate(inp).targets.length,2);
  assert.throws(()=>validate({...inp,targets:['Taipei','Taipei']}));
  assert.throws(()=>validate({...inp,targets:['Tokyo']}));
  assert.throws(()=>validate({...inp,targets:['Taipei','Seoul','Paris','London']}));
});
test('adapter forwards secret only upstream and returns grounded tags',async()=>{
  calls.length=0;
  const output=await analyze(inp,env,stub);
  assert.equal(output.source,'qloo-live');
  assert.equal(output.anchor.name,'Starbucks');
  assert.equal(output.audit.qloo_calls,4);
  assert.equal(calls.length,4);
  assert.equal(output.candidates[0].city,'Taipei');
  assert.equal(output.candidates[0].difference_index,0.6667);
  assert.ok(!JSON.stringify(output).includes('secret-test-key'));
});
test('bad Qloo schema fails rather than fabricating results',()=>{
  assert.throws(()=>extractTags({results:{tags:[]}}));
  assert.throws(()=>chooseBrand({results:[]},'Starbucks'));
});
test('no API key means no live requests',async()=>{
  await assert.rejects(()=>analyze(inp,{},stub),/not configured/);
});
test('public endpoint validates origins and malformed JSON',async()=>{
  const bad=await worker.fetch(new Request('https://example.com/api/scan',{method:'POST',headers:{origin:'https://evil.example','content-type':'application/json'},body:JSON.stringify(inp)}),env);
  assert.equal(bad.status,403);
  const health=await worker.fetch(new Request('https://example.com/health'),env);
  assert.equal((await health.json()).qloo_key_configured,true);
  const badJSON=await worker.fetch(new Request('https://example.com/api/scan',{method:'POST',body:'bad json'}),env);
  assert.equal(badJSON.status,400);
});
test('live route requires throttle and enforces limits before API calls',async()=>{
  const req=()=>new Request('https://example.com/api/scan',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(inp)});
  const without=await worker.fetch(req(),env);
  assert.equal(without.status,503);
  const noAllowance=await worker.fetch(req(),{...env,RATE_LIMITER:{limit:async()=>({success:false})}});
  assert.equal(noAllowance.status,429);
});