import asyncio
from playwright.async_api import async_playwright
import os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL='file://'+os.path.join(ROOT,'isl-studio-offline.html')
os.makedirs(os.path.join(ROOT,'docs','screenshots'),exist_ok=True)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg=await b.new_page(viewport={'width':1600,'height':960}); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(3000); print('errors:',errs[:3])
        # 1 사면 탭 초기
        await pg.screenshot(path=ROOT+'/docs/screenshots/01_slope_start.png')
        # 재생 → 보통 속도 → 약 25초 후
        await pg.click('#speed button[data-s="10"]'); await pg.click('#play'); await pg.wait_for_timeout(9000); await pg.click('#play')
        await pg.screenshot(path=ROOT+'/docs/screenshots/02_slope_running.png')
        # 절개 슬라이더 이동
        await pg.evaluate("(()=>{const s=document.getElementById('s-clip'); s.value=35; s.dispatchEvent(new Event('input'));})()"); await pg.wait_for_timeout(800)
        await pg.screenshot(path=ROOT+'/docs/screenshots/03_slope_section.png')
        # 2 패턴 탭
        await pg.click('#tabs button[data-tab="pattern"]'); await pg.wait_for_timeout(1500)
        await pg.screenshot(path=ROOT+'/docs/screenshots/04_pattern_start.png')
        await pg.click('#speed button[data-s="10"]'); await pg.click('#play'); await pg.wait_for_timeout(9000); await pg.click('#play')
        await pg.screenshot(path=ROOT+'/docs/screenshots/05_pattern_running.png')
        # 절개
        await pg.evaluate("(()=>{const s=document.getElementById('s-clip'); s.value=45; s.dispatchEvent(new Event('input'));})()"); await pg.wait_for_timeout(800)
        await pg.screenshot(path=ROOT+'/docs/screenshots/06_pattern_section.png')
        # bleed -10 → 유선 이탈
        await pg.evaluate("(()=>{const s=[...document.querySelectorAll('#ctl-pattern input[type=range]')].find(x=>x.closest('.field').textContent.includes('Bleed')); s.value=-10; s.dispatchEvent(new Event('input'));})()"); await pg.wait_for_timeout(1500)
        await pg.evaluate("(()=>{const s=document.getElementById('s-clip'); s.value=100; s.dispatchEvent(new Event('input'));})()"); await pg.wait_for_timeout(800)
        await pg.screenshot(path=ROOT+'/docs/screenshots/07_pattern_bleed_neg.png')
        # 좌측 패널 · 우측 패널 클로즈업
        await pg.screenshot(path=ROOT+'/docs/screenshots/08_left_panel.png', clip={'x':0,'y':80,'width':270,'height':880})
        await pg.screenshot(path=ROOT+'/docs/screenshots/09_right_panel.png', clip={'x':1300,'y':80,'width':300,'height':880})
        # 3 비교 탭
        await pg.click('#tabs button[data-tab="compare"]'); await pg.wait_for_timeout(500); await pg.click('#cmp-run'); await pg.wait_for_timeout(15000)
        await pg.screenshot(path=ROOT+'/docs/screenshots/10_compare.png', full_page=True)
        await b.close()
asyncio.run(main())
