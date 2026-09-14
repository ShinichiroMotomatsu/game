// Run with Playwright available via NODE_PATH, or installed locally.
const {chromium}=require('playwright');
const {createServer}=require('./serve-family.js');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
  const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
  let browser;
  try{
    browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH}:{})});
    const base=(process.env.FAMILY_BASE_URL||`http://127.0.0.1:${server.address().port}`).replace(/\/$/,'');
    const out=path.resolve('artifacts/family');fs.mkdirSync(out,{recursive:true});
    for(const mode of ['normal','child']){
      const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
      const page=await context.newPage(),errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.goto(`${base}/family.html`);
      const act=async(a,v)=>{const q=`[data-action="${a}"]${v===undefined?'':`[data-value="${v}"]`}`;await page.locator(q).first().tap();};
      const fit=async()=>assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${mode}: horizontal overflow`);
      await act('mode',mode);await fit();
      if(mode==='normal')await page.screenshot({path:path.join(out,'title-mobile.png'),fullPage:true});
      await act('start');await act('sea');await act('cloud');await act('arrive');await act('market');await act('bath');await act('leaveTown');
      await act('tide');await act('waitTide');await act('walk');await act('pool');
      await fit();await act('view','low');await act('hint');await act('compare');await act('answer','sky');
      assert.match(await page.locator('#compare-feedback').innerText(),mode==='child'?/うごく/:/変わる/);
      await act('answer','stone');await page.locator('#close-dialog').tap();
      await act('view','high');await act('shade');await act('light','0');
      // Reload midway through the puzzle and retain observations and one light.
      await page.reload();await act('continue');
      assert.equal(await page.locator('.light[aria-pressed="true"]').count(),1);
      await page.screenshot({path:path.join(out,`pool-${mode}.png`),fullPage:true});
      await act('light','1');await act('light','2');
      assert.equal(await page.locator('.story h1').innerText(),'うみのおそら。');
      await act('return');await act('lookBack');await act('inn');await act('finish');
      await fit();await act('journal');assert.equal(await page.locator('.journal-entry').count(),8);
      await page.screenshot({path:path.join(out,`journal-${mode}.png`),fullPage:true});
      await page.locator('#close-dialog').tap();await page.locator('#settings-button').tap();
      await act('mode',mode==='child'?'normal':'child');
      await page.locator('#music-toggle').check();await page.locator('#music-toggle').uncheck();
      const downloadPromise=page.waitForEvent('download');await act('export');const download=await downloadPromise;const file=path.join(out,`save-${mode}.json`);await download.saveAs(file);
      await page.locator('#import-save').setInputFiles(file);await page.locator('#confirm-import').tap();
      assert.equal(await page.locator('.end-stamp').count(),1);
      await act('title');await act('restart');await act('cancel');await act('continue');assert.equal(await page.locator('.end-stamp').count(),1);
      await act('title');await act('restart');await act('confirmRestart');assert.equal(await page.locator('[data-action="sea"]').count(),1);
      await page.setViewportSize({width:320,height:568});await fit();
      await page.setViewportSize({width:844,height:390});await fit();
      assert.deepEqual(errors,[]);await context.close();console.log(`PASS ${mode}: complete, hints, reload, journal, settings, export/import, restart, 320/390/844 widths`);
    }
    const response=await fetch(`${base}/FAMILY_TRAVEL_RPG_PLAN.md`);assert.equal(response.status,404);
    const context=await browser.newContext();await context.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw Error('disabled');}});});
    const p=await context.newPage();await p.goto(`${base}/family.html`);await p.locator('[data-action="start"]').click();assert.match(await p.locator('#save-status').innerText(),/保存できません/);await context.close();
    console.log('PASS storage unavailable fallback and private-file isolation');
  }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
