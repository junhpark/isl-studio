#!/usr/bin/env python3
"""isl-studio.html 의 Pattern 모듈을 그대로 떼어 Node 용 헤드리스 스크립트를 만든다.

    python browser/build_headless.py      →  browser/library_browser.js, browser/make_browser_snapshots.js

스튜디오 물리(genWells·solveHead·step)를 고칠 때마다 다시 만들어야 두 헤드리스 스크립트가 화면과 같은 모델을 돈다.
드라이버(실행 루프)는 browser/drivers/*.js 에 있고, 그 앞에 스튜디오의 공통 유틸(clamp 등)과 DOM 없는 환경용 빈 함수를 붙인다."""
import os, re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
STUDIO = os.path.join(ROOT, 'isl-studio.html')

STUB = """/* ── 생성 파일 — 손으로 고치지 말 것. browser/build_headless.py 가 isl-studio.html 에서 만든다 ── */
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const rgbStr=()=>'', ramp=()=>[0,0,0], gradientCSS=()=>'';
const uiSection=()=>({appendChild(){}}), uiSlider=()=>({}), uiToggle=()=>({}), uiSegment=()=>({});
const ICON={}, Pop={}, infoBtn=()=>'', setRangeFill=()=>{}, fmtN=v=>String(v);
"""


def studio_pattern_module():
    s = open(STUDIO, encoding='utf-8').read()
    i = s.index('const Pattern=(function(){')
    j = s.index('\n})();', i) + len('\n})();')
    return s[i:j]


def build(driver, out):
    drv = open(os.path.join(HERE, 'drivers', driver), encoding='utf-8').read()
    src = STUB + '\n' + studio_pattern_module() + '\n\n' + drv
    open(os.path.join(HERE, out), 'w', encoding='utf-8').write(src)
    print(f'{out}: {len(src):,} bytes (driver {driver})')


if __name__ == '__main__':
    build('library.js', 'library_browser.js')
    build('snapshots.js', 'make_browser_snapshots.js')
