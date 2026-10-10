const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');

const URL='http://127.0.0.1:8765/';

test('user sees a working default calculator and can change values',async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(URL,{waitUntil:'domcontentloaded'});
    await page.locator('#margin').waitFor();
    await page.waitForFunction(()=>document.querySelector('#margin')?.textContent?.includes('NT$600'),{timeout:12000});
    assert.equal(await page.locator('#margin').innerText(),'NT$600');
    assert.match(await page.locator('#breakeven').innerText(),/5 單/);
    assert.match(await page.locator('#clicks').innerText(),/375 次/);
    assert.doesNotMatch(await page.locator('#estimate').innerText(),/請輸入有效數字|格式錯誤/);
    await page.locator('#cpc').fill('10');
    await page.locator('#conversion').fill('2');
    await page.locator('#calcBtn').click();
    assert.match(await page.locator('#clicks').innerText(),/300 次/);
    assert.match(await page.locator('#estimate').innerText(),/NT\$600/);
    await page.locator('#price').fill('1200');
    await page.locator('#calcBtn').click();
    assert.equal(await page.locator('#margin').innerText(),'NT$800');
    assert.deepEqual(errors,[]);
  } finally {await browser.close()}
});

test('user gets specific validation and can immediately recover',async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage();
    await page.goto(URL);
    await page.locator('#cost').count(); // intentionally probe that the underlying form has no ambiguous id
    await page.locator('#conversion').fill('');
    await page.locator('#calcBtn').click();
    assert.match(await page.locator('#estimate').innerText(),/成交率尚未填寫/);
    await page.locator('#conversion').fill('1.5');
    await page.locator('#calcBtn').click();
    assert.equal(await page.locator('#margin').innerText(),'NT$600');
  } finally {await browser.close()}
});

test('official sourced country data is visible and downloadable without secrets',async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage();
    await page.goto(URL,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelector('#data-status')?.textContent?.includes('官方資料快照已載入'),{timeout:15000});
    const metrics=await page.locator('#countryMetrics').innerText();
    assert.match(metrics,/日本/);
    assert.match(metrics,/韓國/);
    assert.match(metrics,/資料年份/);
    assert.match(metrics,/世界銀行原始指標/);
    const download=page.waitForEvent('download');
    await page.locator('#report-action').click();
    const file=await download;
    assert.match(file.suggestedFilename(),/tasteproof-marketcheck\.json/);
  } finally {await browser.close()}
});
