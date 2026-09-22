#!/usr/bin/env python3
"""manual/i18n_en.json (한국어 → 영어) 을 isl-studio.html 의 <script id="i18n-en"> 에 넣고,
   화면 문구 중 표에 없는 것을 찾아 보고한다.

    python manual/i18n_build.py            # 표 주입 + 소스 리터럴 기준 누락 보고
    python manual/i18n_build.py --dom      # 브라우저로 화면을 여러 상태로 돌려 실제 DOM 문구까지 검사 (Playwright)

isl-studio.html 을 고친 뒤 build_offline.py 전에 실행한다."""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML = os.path.join(ROOT, 'isl-studio.html')
TABLE = os.path.join(ROOT, 'manual', 'i18n_en.json')


def load_table():
    t = json.load(open(TABLE, encoding='utf-8')); t.pop('_', None); return t


def compile_templates(t):
    out = []
    for k, v in t.items():
        if re.search(r'\{\d+\}', k):
            pat = '^' + re.sub(r'\\\{(\d+)\\\}', r'([\\s\\S]+?)', re.escape(k)) + '$'
            out.append((re.compile(pat), k))
    return out


def covered(s, t, tpl):
    s = s.strip()
    if not re.search('[가-힣]', s): return True
    if s in t: return True
    return any(p.match(s) for p, _ in tpl)


def inject(html, t):
    body = 'const I18N_EN=' + json.dumps(t, ensure_ascii=False, indent=0).replace('</', '<\\/') + ';'
    new, n = re.subn(r'(<script id="i18n-en">\n)(?:.|\n)*?(\n</script>)', lambda m: m.group(1) + '/* 영어 표 — manual/i18n_en.json 에서 manual/i18n_build.py 가 생성. 손으로 고치지 말 것. */\n' + body + m.group(2), html, count=1)
    assert n == 1, 'i18n-en 스크립트 블록을 찾지 못함'
    return new


def source_keys(html):
    i = html.index('<script>\n/* ═══'); js = html[i:]
    keys = set()
    # 완결된 문장 리터럴만 (이어 붙이는 조각은 DOM 검사에서 잡는다)
    for m in re.findall(r"'((?:[^'\\\n]|\\.)*[가-힣](?:[^'\\\n]|\\.)*)'", js):
        keys.add(m.replace("\\'", "'"))
    head = html[:i]
    for m in re.findall(r'>([^<]*[가-힣][^<]*)<', head): keys.add(m.strip())
    for m in re.findall(r'(?:data-info|data-info-t|data-info-s|title|aria-label)="([^"]*[가-힣][^"]*)"', head): keys.add(m)
    return keys


def main():
    t = load_table(); tpl = compile_templates(t)
    html = open(HTML, encoding='utf-8').read()
    html = inject(html, t); open(HTML, 'w', encoding='utf-8').write(html)
    print(f'표 {len(t)}개 항목 주입 (템플릿 {len(tpl)}개)')
    miss = sorted(k for k in source_keys(html) if not covered(k, t, tpl))
    miss = [k for k in miss if '<' not in k and '{' not in k]
    frag = [k for k in miss if k != k.strip() or len(k) < 3 or k.endswith((' ', '·', '–', '(', '·')) or k.startswith((' ', '%', '/', '·'))]
    whole = [k for k in miss if k not in frag]
    print(f'소스 기준 미번역 완결 문구 {len(whole)}개 (조각 {len(frag)}개는 DOM 검사로 확인):')
    for k in whole: print('  ', repr(k))
    if '--dom' in sys.argv:
        sys.path.insert(0, os.path.join(ROOT, 'manual'))
        keys = dom_keys()
        miss = sorted(k for k in keys if not covered(k, t, tpl))
        print(f'DOM 기준 미번역 {len(miss)}개:')
        for k in miss: print('  ', repr(k))


def dom_keys():
    """오프라인 판을 임시 서버로 열어 여러 상태의 화면 문구를 모은다."""
    import asyncio, functools, threading, http.server
    from playwright.async_api import async_playwright
    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    url = f'http://127.0.0.1:{srv.server_port}/isl-studio-offline.html?lang=ko'
    JS = """()=>{const out=new Set(); const ko=s=>/[가-힣]/.test(s);
     const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT,{acceptNode:n=>n.nodeType===1?(/^(SCRIPT|STYLE)$/.test(n.tagName)?2:1):1});
     let n; while((n=w.nextNode())){ if(n.nodeType===3){ const t=(n.__ko||n.nodeValue).trim(); if(ko(t)) out.add(t);} else { for(const a of ['data-info','data-info-t','data-info-s','title','aria-label','placeholder']){ const v=(n.__koA&&n.__koA[a])||n.getAttribute(a); if(v&&ko(v)) out.add(v.trim()); } } }
     return [...out]; }"""
    async def run():
        keys = set()
        async with async_playwright() as p:
            b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
            pg = await b.new_page(viewport={'width': 1440, 'height': 900}); dlg = []
            pg.on('dialog', lambda d: (dlg.append(d.message), asyncio.ensure_future(d.dismiss())))
            await pg.goto(url); await pg.wait_for_timeout(2000)
            async def grab(): keys.update(await pg.evaluate(JS))
            mode = lambda i: pg.evaluate(f"document.querySelectorAll('#modes button')[{i}].click()")
            await grab(); await pg.click('#about .ok')
            for n in [1, 150, 900, 1200, 1800]:
                await pg.evaluate(f"Slope.advance({n}); Slope.tick(0); Slope.drawSection()"); await pg.wait_for_timeout(250); await grab()
            for i in range(4): await mode(i); await pg.wait_for_timeout(120); await grab()
            for lbl in ['도액공', '하류 차수벽', '양수 차단정', '기반암 차수층 결손']:
                await pg.locator('#ctl-slope .tog', has_text=lbl).locator('input').click(); await pg.wait_for_timeout(150); await grab()
            await pg.click('#tabs button[data-tab="pattern"]'); await pg.mouse.move(700, 500); await pg.wait_for_timeout(1000); await grab()
            for i in range(4): await mode(i); await pg.wait_for_timeout(120); await grab()
            for pat in ['7spot', 'line', '5spot']: await pg.click(f'#ctl-pattern .seg button[data-v="{pat}"]'); await pg.wait_for_timeout(250); await grab()
            box = pg.locator('#ctl-pattern .field', has_text='Bleed').locator('.val input'); await box.click(); await box.fill('-10'); await box.press('Enter')
            for n in [20, 200, 400]: await pg.evaluate(f"Pattern.advance({n}); Pattern.tick(0)"); await pg.wait_for_timeout(300); await grab()
            kb = pg.locator('#ctl-pattern .field', has_text='투수계수').locator('.val input'); await kb.click(); await kb.fill('0.1'); await kb.press('Enter'); await pg.wait_for_timeout(300); await grab()
            await pg.locator('#ctl-pattern .tog', has_text='이온흡착형').locator('input').click(); await pg.wait_for_timeout(250); await grab()
            await pg.locator('#ctl-pattern button', has_text='참조해 불러오기').click(); await pg.wait_for_timeout(3000); await grab()
            for n in [300, 3000, 6000]: await pg.evaluate(f"Pattern.advance({n}); Pattern.tick(0)"); await pg.wait_for_timeout(400); await grab()
            await mode(1); await pg.wait_for_timeout(250); await grab(); await mode(3); await pg.wait_for_timeout(250); await grab()
            await box.click(); await box.fill('5'); await box.press('Enter'); await pg.wait_for_timeout(250); await grab()
            await pg.click('#tabs button[data-tab="compare"]'); await pg.wait_for_timeout(250); await grab()
            await pg.click('#cmp-run'); await pg.wait_for_timeout(14000); await grab()
            await pg.click('#tabs button[data-tab="pattern"]'); await pg.click('#play'); await pg.wait_for_timeout(250); await grab(); await pg.click('#play')
            keys.update(dlg); await b.close()
        return keys
    return asyncio.run(run())


if __name__ == '__main__': main()
