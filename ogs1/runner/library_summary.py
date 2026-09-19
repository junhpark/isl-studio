#!/usr/bin/env python3
"""cases/lib/*/results.json (OGS) + cases/lib_browser.json (브라우저) → 12개 시나리오 비교표 (마크다운)."""
import json, os, glob, numpy as np, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def ogs_metrics(case):
    meta = json.load(open(os.path.join(case, 'results.json')))
    t = np.array(meta['times_days']); pv = t/meta['pv_days']
    sw = np.array(meta['sweep_frac']); oo = np.array(meta['tracer_outside_ore_frac'])
    N = meta['nx']*meta['ny']; arr = np.fromfile(os.path.join(case, 'fields.bin'), np.float32).reshape(len(t), 2, N)
    nx, DX = meta['nx'], meta['DX']
    # 파과: 회수정 위치 추적자 > 5% 최초 시각
    prod = [q for q in meta['wells'] if q['type'] == 'P']; bt = None
    for k in range(len(t)):
        for q in prod:
            i = min(nx-1, int(q['x']/DX)); j = min(nx-1, int(q['y']/DX))
            if arr[k, 1, i+j*nx] > 0.05: bt = t[k]; break
        if bt is not None: break
    def at(p):
        k = int(np.argmin(np.abs(pv-p))); return sw[k], oo[k]
    return dict(sweep1=at(1)[0], sweep2=at(2)[0], sweep5=at(5)[0], out_peak=float(oo.max()), bt=bt, pv_days=meta['pv_days'], wells=len(meta['wells']))

def main():
    br = json.load(open(os.path.join(ROOT, 'cases', 'lib_browser.json')))
    rows = []
    for name in sorted(br):
        case = os.path.join(ROOT, 'cases', 'lib', name)
        b = br[name]; o = ogs_metrics(case) if os.path.exists(os.path.join(case, 'results.json')) else None
        bs = dict(zip(b['pv'], b['sweep']))
        def bsw(p, _bs=bs): return _bs.get(p, float('nan'))
        rows.append((name, b, o, bsw))
    lines = ['| 시나리오 | 정호 | 1 PV 일수 | sweep @1 PV (브라우저 / OGS) | sweep @5 PV (브라우저 / OGS) | 광체 밖 최대 (브라우저 / OGS) | 파과 (브라우저 / OGS) |',
             '|---|---|---|---|---|---|---|']
    for name, b, o, bsw in rows:
        if o is None:
            lines.append(f"| {name} | {b['wells']} | {b['pvDays']:.0f} | {bsw(1)*100:.0f}% / — | {bsw(5)*100:.0f}% / — | {b['out_ore_peak']*100:.1f}% / — | {b['breakthrough_day'] or 0:.0f} d / — |"); continue
        lines.append(f"| {name} | {o['wells']} | {o['pv_days']:.0f} | {bsw(1)*100:.0f}% / {o['sweep1']*100:.0f}% | {bsw(5)*100:.0f}% / {o['sweep5']*100:.0f}% | {b['out_ore_peak']*100:.1f}% / {o['out_peak']*100:.1f}% | {b['breakthrough_day'] or 0:.0f} d / {o['bt'] or 0:.0f} d |")
    done = [r for r in rows if r[2] is not None]
    if done:
        d1 = np.array([r[3](1)-r[2]['sweep1'] for r in done]); d5 = np.array([r[3](5)-r[2]['sweep5'] for r in done])
        do = np.array([r[1]['out_ore_peak']-r[2]['out_peak'] for r in done])
        lines.append('')
        lines.append(f"완료 {len(done)}/12. 브라우저−OGS 평균 차: sweep@1PV {d1.mean()*100:+.1f}%p (범위 {d1.min()*100:+.1f}~{d1.max()*100:+.1f}), sweep@5PV {d5.mean()*100:+.1f}%p, 광체 밖 최대 {do.mean()*100:+.2f}%p")
    out = '\n'.join(lines); print(out)
    open(os.path.join(ROOT, 'cases', 'LIBRARY.md'), 'w').write(out+'\n')

if __name__ == '__main__': main()
