#!/usr/bin/env python3
"""cases/lib/*/results.json (OGS) + 브라우저 헤드리스 결과 → 12개 시나리오 비교표 (마크다운).

사용:  python runner/library_summary.py [브라우저 json] [출력 md]
       기본값  cases/lib_browser.json → cases/LIBRARY.md
       분산항 없는 브라우저와 비교:  python runner/library_summary.py cases/lib_browser_nodisp.json cases/LIBRARY_nodisp.md

두 모델의 도메인이 다르면 비교가 성립하지 않으므로 표에 '≠' 를 찍고 요약 통계에서 뺀다.
"""
import json, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fields_io import read_fields

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def ogs_metrics(case):
    meta, arr = read_fields(case)
    t = np.array(meta['times_days']); pv = t / meta['pv_days']
    sw = np.array(meta['sweep_frac']); oo = np.array(meta['tracer_outside_ore_frac'])
    nx, DX = meta['nx'], meta['DX']
    # 파과: 회수정 위치 추적자 > 5% 최초 시각
    prod = [q for q in meta['wells'] if q['type'] == 'P']; bt = None
    for k in range(len(t)):
        for q in prod:
            i = min(nx - 1, int(q['x'] / DX)); j = min(nx - 1, int(q['y'] / DX))
            if arr[k, 1, i + j * nx] > 0.05: bt = t[k]; break
        if bt is not None: break
    def at(p):
        k = int(np.argmin(np.abs(pv - p))); return sw[k], oo[k]
    return dict(sweep1=at(1)[0], sweep5=at(5)[0], out_peak=float(oo.max()), bt=bt,
                pv_days=meta['pv_days'], wells=len(meta['wells']), domain=meta['domain_m'])


def fm(x, fmt):
    return fmt.format(x).replace('-', '−')   # 문서와 같은 빼기 기호


def rng(a, fmt):
    return f"{fm(a.min(), fmt)} ~ {fm(a.max(), fmt)}"


def main():
    bj = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'cases', 'lib_browser.json')
    out_md = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'cases', 'LIBRARY.md')
    br = json.load(open(bj))
    rows = []
    for name in sorted(br):
        case = os.path.join(ROOT, 'cases', 'lib', name)
        o = ogs_metrics(case) if os.path.exists(os.path.join(case, 'results.json')) else None
        rows.append((name, br[name], o))
    lines = ['| 시나리오 | 도메인 | 정호 | 1 PV 일수 | sweep @1 PV (브라우저 / OGS) | sweep @5 PV (브라우저 / OGS) | 광체 밖 최대 (브라우저 / OGS) | 파과 (브라우저 / OGS) |',
             '|---|---|---|---|---|---|---|---|']
    ok = []
    for name, b, o in rows:
        bs = dict(zip(b['pv'], b['sweep']))
        b1, b5 = bs.get(1, float('nan')), bs.get(5, float('nan'))
        bbt = b['breakthrough_day'] or 0
        if o is None:
            lines.append(f"| {name} | {b['domain']:g} m | {b['wells']} | {b['pvDays']:.0f} | {b1*100:.0f}% / — | {b5*100:.0f}% / — | {b['out_ore_peak']*100:.1f}% / — | {bbt:.0f} d / — |"); continue
        match = abs(b['domain'] - o['domain']) < 1e-6
        dom = f"{o['domain']:g} m" if match else f"{b['domain']:g} ≠ {o['domain']:g} m"
        lines.append(f"| {name} | {dom} | {o['wells']} | {o['pv_days']:.0f} | {b1*100:.0f}% / {o['sweep1']*100:.0f}% | {b5*100:.0f}% / {o['sweep5']*100:.0f}% | {b['out_ore_peak']*100:.1f}% / {o['out_peak']*100:.1f}% | {bbt:.0f} d / {o['bt'] or 0:.0f} d |")
        if match:
            ok.append(dict(name=name, d1=b1 - o['sweep1'], d5=b5 - o['sweep5'], do=b['out_ore_peak'] - o['out_peak'],
                           dbt=bbt - (o['bt'] or 0), contained=not name.endswith('bm10')))
        else:
            print(f'[경고] {name}: 도메인 불일치 (브라우저 {b["domain"]:g} m, OGS {o["domain"]:g} m) — 요약에서 제외', file=sys.stderr)
    done = sum(o is not None for _, _, o in rows)
    lines.append('')
    if ok:
        A = lambda k, sel=lambda r: True: np.array([r[k] for r in ok if sel(r)])
        d1, d5, dbt = A('d1'), A('d5'), A('dbt')
        dc, df = A('do', lambda r: r['contained']), A('do', lambda r: not r['contained'])
        lines.append(f"완료 {done}/12, 도메인 일치 {len(ok)}개로 요약. 브라우저 − OGS:")
        lines.append('')
        f1 = '{:+.1f}'
        lines.append(f"- sweep @1 PV 평균 {fm(d1.mean()*100, f1)} %p (범위 {rng(d1*100, f1)}), @5 PV 평균 {fm(d5.mean()*100, f1)} %p (범위 {rng(d5*100, f1)})")
        if len(dc): lines.append(f"- 광체 밖 최대, 봉쇄 성립(bleed +5 %): 평균 {fm(dc.mean()*100, f1)} %p (범위 {rng(dc*100, f1)})")
        if len(df): lines.append(f"- 광체 밖 최대, 봉쇄 실패(bleed −10 %): 평균 {fm(df.mean()*100, f1)} %p (범위 {rng(df*100, f1)})")
        lines.append(f"- 파과 시각: 평균 {fm(dbt.mean(), f1)} 일 (범위 {rng(dbt, '{:+.0f}')})")
    out = '\n'.join(lines); print(out)
    open(out_md, 'w', encoding='utf-8').write(out + '\n')


if __name__ == '__main__': main()
