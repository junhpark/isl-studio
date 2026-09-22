"""사용 설명서용 화면 캡처 (Playwright + Chromium). 결과: docs/screenshots/*.png
   python manual/shot.py   — 저장소를 임시 로컬 웹서버로 띄워 오프라인 판을 연다
   (참조해 목록 ogs1/cases/index.json 은 file:// 로는 읽히지 않는다). 첫 방문 안내 창을 캡처한 뒤 닫는다."""
import asyncio, os, functools, threading, http.server
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class _Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
_srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(_Quiet, directory=ROOT))
threading.Thread(target=_srv.serve_forever, daemon=True).start()
URL = f'http://127.0.0.1:{_srv.server_port}/isl-studio-offline.html?lang=ko'
OUT = os.path.join(ROOT, 'docs', 'screenshots'); os.makedirs(OUT, exist_ok=True)
S = lambda n: os.path.join(OUT, n)
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
CLIP = "(v=>{const s=document.getElementById('s-clip'); s.value=v; s.dispatchEvent(new Event('input'));})"

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=ARGS)
        pg = await b.new_page(viewport={'width': 1600, 'height': 960}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(3000)
        await pg.screenshot(path=S('00_about.png'), clip={'x': 500, 'y': 170, 'width': 600, 'height': 640})
        await pg.click('#about .ok'); await pg.wait_for_timeout(300)
        # 1 사면 탭
        await pg.screenshot(path=S('01_slope_start.png'))
        await pg.click('#speed button[data-s="10"]'); await pg.click('#play'); await pg.wait_for_timeout(9000); await pg.click('#play')
        await pg.mouse.move(800, 500); await pg.wait_for_timeout(300)
        await pg.screenshot(path=S('02_slope_running.png'))
        await pg.evaluate(CLIP + '(35)'); await pg.wait_for_timeout(800)
        await pg.screenshot(path=S('03_slope_section.png'))
        # 2 패턴 탭
        await pg.click('#tabs button[data-tab="pattern"]'); await pg.wait_for_timeout(1500)
        await pg.mouse.move(800, 500); await pg.wait_for_timeout(500)
        await pg.screenshot(path=S('04_pattern_start.png'))
        await pg.click('#play'); await pg.wait_for_timeout(9000); await pg.click('#play')
        await pg.mouse.move(800, 500); await pg.wait_for_timeout(500)
        await pg.screenshot(path=S('05_pattern_running.png'))
        await pg.evaluate(CLIP + '(45)'); await pg.wait_for_timeout(800)
        await pg.screenshot(path=S('06_pattern_section.png'))
        # bleed −10 (값 칸에 직접 입력) → 유선 이탈
        box = pg.locator('#ctl-pattern .field', has_text='Bleed').locator('.val input')
        await box.click(); await box.fill('-10'); await box.press('Enter'); await pg.wait_for_timeout(1500)
        await pg.evaluate(CLIP + '(100)'); await pg.mouse.move(800, 500); await pg.wait_for_timeout(800)
        await pg.screenshot(path=S('07_pattern_bleed_neg.png'))
        # 좌·우 패널 클로즈업
        await pg.screenshot(path=S('08_left_panel.png'), clip={'x': 0, 'y': 46, 'width': 284, 'height': 860})
        await pg.screenshot(path=S('09_right_panel.png'), clip={'x': 1306, 'y': 46, 'width': 294, 'height': 560})
        # ⓘ 팝오버
        await pg.locator('#ctl-pattern .field', has_text='Bleed').locator('.info').hover(); await pg.wait_for_timeout(500)
        await pg.screenshot(path=S('11_popover.png'), clip={'x': 0, 'y': 250, 'width': 620, 'height': 250})
        await pg.mouse.move(800, 500)
        # 3 비교 탭
        await pg.click('#tabs button[data-tab="compare"]'); await pg.wait_for_timeout(500)
        await pg.click('#cmp-run'); await pg.wait_for_timeout(15000)
        await pg.screenshot(path=S('10_compare.png'), full_page=True)
        await pg.click('#tabs button[data-tab="pattern"]'); await pg.wait_for_timeout(1200)
        # OGS 참조해 (비교 탭 뒤 — 불러오면 패턴 설정이 케이스 값으로 바뀌고 품위가 최소가 되므로) — 목록에서 7-spot · 30 m · bleed −10 % 를 골라 불러온 뒤 재생
        opts = await pg.eval_on_selector_all('#ctl-pattern select.refsel option', 'os=>os.map(o=>o.textContent)')
        await pg.select_option('#ctl-pattern select.refsel', index=next(i for i, o in enumerate(opts) if '7-spot · 30 m · bleed −10' in o))
        await pg.locator('#ctl-pattern button', has_text='참조해 불러오기').click(); await pg.wait_for_timeout(2500)
        await pg.click('#play'); await pg.wait_for_timeout(7000); await pg.click('#play')
        await pg.mouse.move(800, 500); await pg.wait_for_timeout(500)
        await pg.screenshot(path=S('14_ogs_loaded.png'))
        sec = pg.locator('#ctl-pattern .sec', has=pg.locator('select.refsel'))
        await sec.evaluate("e=>e.scrollIntoView({block:'center'})"); await pg.wait_for_timeout(400)
        box = await sec.bounding_box()
        await pg.screenshot(path=S('15_ogs_section.png'), clip={'x': 0, 'y': box['y'] - 6, 'width': 284, 'height': box['height'] + 12})
        # 4 모바일 (390 px) — 본 화면 · 설정 서랍
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        m = await ctx.new_page(); await m.goto(URL); await m.wait_for_timeout(2500); await m.tap('#about .ok')
        await m.tap('#tabs button[data-tab="pattern"]'); await m.wait_for_timeout(1500)
        await m.tap('#speed button[data-s="10"]'); await m.tap('#play'); await m.wait_for_timeout(6000); await m.tap('#play')
        await m.screenshot(path=S('12_mobile_main.png'))
        await m.tap('#btn-left'); await m.wait_for_timeout(500)
        await m.screenshot(path=S('13_mobile_drawer.png'))
        print('errors:', errs[:3])
        await b.close()
    _srv.shutdown()

asyncio.run(main())
