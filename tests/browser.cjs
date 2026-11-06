const {chromium}=require('playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
fs.mkdirSync('test-results',{recursive:true}); const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1920,height:1080}});const errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.goto('http://127.0.0.1:4173');await page.waitForTimeout(1800);
const snap=()=>page.evaluate(()=>window.chromaticFlow.snapshot());
let s=await snap();assert.equal(s.glError,0);assert(s.frames>5);assert.equal(s.drawCount,35040);assert.equal(s.config.sensitivity,.65);
await page.screenshot({path:'test-results/desktop-preview.png'});
await page.click('#demo');await page.waitForTimeout(1000);s=await snap();assert(s.audio.some(v=>v>.1));await page.screenshot({path:'test-results/music-preview.png'});
await page.click('#demo');await page.waitForTimeout(5000);s=await snap();assert(s.audio.every(v=>v<.001));
await page.click('#pause');const before=(await snap()).frames;await page.waitForTimeout(300);assert.equal((await snap()).frames,before);await page.click('#pause');await page.waitForTimeout(250);assert((await snap()).frames>before);
await page.locator('#density').evaluate(el=>{el.value=2;el.dispatchEvent(new Event('input'));});assert.equal((await snap()).drawCount,62720);
await page.locator('#density').evaluate(el=>{el.value=1;el.dispatchEvent(new Event('input'));});
await page.click('#hide');await page.screenshot({path:'test-results/wallpaper-preview.png'});
await page.screenshot({path:'test-results/cover.png'});
await page.setViewportSize({width:390,height:844});await page.click('#reveal');await page.waitForTimeout(300);await page.screenshot({path:'test-results/mobile-preview.png'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390);
await page.setViewportSize({width:3440,height:1440});await page.waitForTimeout(300);assert.equal((await snap()).glError,0);await page.screenshot({path:'test-results/ultrawide-preview.png'});
// Exercise the actual registered host callback and global lifecycle contract.
const host=await browser.newPage({viewport:{width:1280,height:720}});
await host.addInitScript(()=>{window.registrationCount=0;window.wallpaperRegisterAudioListener=cb=>{window.registrationCount++;window.hostAudio=cb;};});
await host.goto('http://127.0.0.1:4173');await host.waitForTimeout(400);
assert.equal(await host.evaluate(()=>window.registrationCount),1);assert(await host.locator('body').evaluate(el=>el.classList.contains('wallpaper')));
await host.evaluate(()=>{window.hostAudio(Array(128).fill(1));window.wallpaperPropertyListener.applyUserProperties({sensitivity:{value:65},density:{value:0}});window.wallpaperPropertyListener.applyGeneralProperties({fps:30});});
await host.waitForTimeout(250);let h=await host.evaluate(()=>window.chromaticFlow.snapshot());assert(h.audio[0]>.4);assert.equal(h.drawCount,12960);assert.equal(h.fpsLimit,30);
await host.evaluate(()=>window.hostAudio(Array.from({length:128},(_,i)=>[NaN,Infinity,-1,50][i%4])));await host.waitForTimeout(300);assert((await host.evaluate(()=>window.chromaticFlow.snapshot())).audio.every(Number.isFinite));
await host.waitForTimeout(5500);assert((await host.evaluate(()=>window.chromaticFlow.snapshot())).audio.every(v=>v<.001));
await host.evaluate(()=>window.wallpaperPropertyListener.setPaused(true));const hf=(await host.evaluate(()=>window.chromaticFlow.snapshot())).frames;await host.waitForTimeout(200);assert.equal((await host.evaluate(()=>window.chromaticFlow.snapshot())).frames,hf);
await host.evaluate(()=>window.wallpaperPropertyListener.setPaused(false));await host.waitForTimeout(300);
await host.evaluate(()=>{window.ext=document.getElementById('scene').getContext('webgl').getExtension('WEBGL_lose_context');window.ext.loseContext();});await host.waitForTimeout(300);assert((await host.evaluate(()=>window.chromaticFlow.snapshot())).lost);await host.evaluate(()=>window.ext.restoreContext());await host.waitForTimeout(1000);h=await host.evaluate(()=>window.chromaticFlow.snapshot());assert(!h.lost);assert.equal(h.glError,0);
const offline=await browser.newPage();await offline.goto('file:///'+process.cwd().replaceAll('\\','/')+'/index.html');await offline.waitForTimeout(300);assert((await offline.evaluate(()=>window.chromaticFlow.snapshot())).frames>0);
assert.deepEqual(errors,[]);fs.writeFileSync('test-results/acceptance.json',JSON.stringify({browser:await browser.version(),renderer:'SwiftShader software WebGL (not a hardware GPU benchmark)',checks:['shader compilation / draw with GL_NO_ERROR','default medium / 65%','simulated music and decay','pause / resume','density buffer rebuild','390x844 / 1920x1080 / 3440x1440','host callback registration / stereo data / malformed input / stale input','host FPS / pause','context loss / restore','offline file URL'],errors,desktop:s,host:h},null,2));
await browser.close();console.log('PASS: browser acceptance, host mock, offline and context restore');
})().catch(e=>{console.error(e);process.exit(1)});

