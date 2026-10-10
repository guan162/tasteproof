const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');

test('hypothesis lab visibly challenges default plan with stress test and sourced evidence',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
   const page=await browser.newPage({acceptDownloads:true});
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8765/decision-lab.html',{waitUntil:'domcontentloaded'});
   await page.locator('#result:not([hidden])').waitFor();
   assert.equal(await page.locator('#margin').innerText(),'NT$600');
   assert.match(await page.locator('#orders').innerText(),/55/);
   assert.equal(await page.locator('#scenarioRows tr').count(),3);
   assert.match(await page.locator('#dossier').innerText(),/未證明/);
   await page.waitForFunction(()=>document.querySelector('#macroStatus')?.textContent?.includes('日本：'),{timeout:13000});
   assert.match(await page.locator('#macroEvidence').innerText(),/世界銀行|人口/);
   assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});
test('revised assumptions update verdict; observed buyers get real uncertainty rather than forecast',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
   const page=await browser.newPage({acceptDownloads:true});
   await page.goto('http://127.0.0.1:8765/decision-lab.html',{waitUntil:'domcontentloaded'});
   await page.locator('#cost').fill('1200');
   await page.locator('#run').click();
   assert.match(await page.locator('#verdict').innerText(),/成本結構/);
   await page.locator('#cost').fill('400');
   await page.locator('#run').click();
   await page.locator('#clicks').fill('375');
   await page.locator('#paidOrders').fill('4');
   await page.locator('#spend').fill('3000');
   await page.locator('#evaluate').click();
   assert.match(await page.locator('#observedResult').innerText(),/Wilson/);
   assert.match(await page.locator('#observedResult').innerText(),/尚不能下結論/);
   const pending=page.waitForEvent('download');
   await page.locator('#export').click();
   const download=await pending;
   assert.match(download.suggestedFilename(),/tasteproof-evidence-plan\.json/);
 }finally{await browser.close()}
});
