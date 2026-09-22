#!/usr/bin/env python3
"""isl-studio.html → isl-studio-offline.html
   CDN 에서 불러오는 three.js r128 을 파일 안에 넣은 판을 만든다. 편집은 isl-studio.html 에서만 한다.
   three.min.js 경로: 인자로 주거나, 없으면 기존 offline 판에서 뽑아 쓴다."""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'isl-studio.html')
DST = os.path.join(ROOT, 'isl-studio-offline.html')
CDN = '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'


def three_source():
    if len(sys.argv) > 1:
        return open(sys.argv[1], encoding='utf-8').read()
    old = open(DST, encoding='utf-8').read()
    m = re.search(r'<script>\s*(/\*\*?\s*\n?\s*\*?\s*@license[\s\S]*?)</script>', old)
    if not m:
        raise SystemExit('기존 offline 판에서 three.js 를 찾지 못했습니다. three.min.js 경로를 인자로 주십시오.')
    return m.group(1)


if __name__ == '__main__':
    src = open(SRC, encoding='utf-8').read()
    if src.count(CDN) != 1:
        raise SystemExit('isl-studio.html 에서 three.js CDN 태그를 정확히 하나 찾지 못했습니다.')
    three = three_source().strip()
    out = src.replace(CDN, '<script>\n' + three + '\n</script>')
    open(DST, 'w', encoding='utf-8').write(out)
    print(f'offline 판 생성: {len(out):,} bytes (three.js {len(three):,})')
