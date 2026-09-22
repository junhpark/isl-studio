#!/usr/bin/env python3
"""cases/lib/*/results.json (OGS) + 브라우저 헤드리스 결과 → 12개 시나리오 비교표 (마크다운).

사용:  python runner/library_summary.py [브라우저 json] [출력 md]
       기본값  cases/lib_browser.json → cases/LIBRARY.md
       분산항 없는 브라우저와 비교:  python runner/library_summary.py cases/lib_browser_nodisp.json cases/LIBRARY_nodisp.md

시간축은 두 모델 모두 누적 양수량 / 공극체적(PV) 이며 1 PV 의 일수가 같다(results.json 의 pv_basis = production).
같은 PV(= 같은 날짜)에서 비교한다. 침출 0–5 PV, 복원 5–7 PV.
도메인이나 1 PV 일수가 다르면 비교가 성립하지 않으므로 표에 '≠' 를 찍고 요약 통계에서 뺀다.
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
    mass = arr[:, 1].sum(axis=1)                       # 도메인 내 추적자 총량 (c/c_inj 의 셀 합, 브라우저와 같은 척도)
    nx, DX = meta['nx'], meta['DX']
    leach_pv = meta.get('leach_pv', 5.0); end_pv = leach_pv + meta.get('restore_pv', 0.0)
    prod = [q for q in meta['wells'] if q['type'] == 'P']; bt = None
    for k in range(len(t)):
        for q in prod:
            i = min(nx - 1, int(q['x'] / DX)); j = min(nx - 1, int(q['y'] / DX))
            if arr[k, 1, i + j * nx] > 0.05: bt = t[k]; break
        if bt is not None: break
    def at(p, a): return float(np.interp(p, pv, a))
    leach = pv <= leach_pv + 1e-9
    resid = at(end_pv, mass) / max(at(leach_pv, mass), 1e-9) if end_pv > leach_pv and pv[-1] >= end_pv - 0.05 else None
    return dict(sweep1=at(1, sw), sweep5=at(leach_pv, sw), out_peak=float(oo[leach].max()), bt=bt, resid=resid,
                pv_days=meta['pv_days'], basis=meta.get('pv_basis', 'injection'), wells=len(meta['wells']),
                nI=sum(q['type'] == 'I' for q in meta['wells']), nP=len(prod), domain=meta['domain_m'], pv_end=float(pv[-1]))


def browser_metrics(b):
    pv = np.array(b['pv']); sw = np.array(b['sweep']); mass = np.array(b.get('mass', [])) if b.get('mass') else None
    leach_pv = b.get('leach_pv', 5.0); end_pv = b.get('end_pv', 7.0)
    def at(p, a): return float(np.interp(p, pv, a))
    resid = at(end_pv, mass) / max(at(leach_pv, mass), 1e-9) if mass is not None and pv[-1] >= end_pv - 0.05 else None
    return dict(sweep1=at(1, sw), sweep5=at(leach_pv, sw), out_peak=b['out_ore_peak'], bt=b['breakthrough_day'] or 0, resid=resid,
                pv_days=b['pvDays'], wells=b['wells'], nI=b.get('nI'), nP=b.get('nP'), domain=b['domain'])


def fm(x, fmt):
    return fmt.format(x).replace('-', '−')   # 문서와 같은 빼기 기호


def rng(a, fmt):
    return f"{fm(a.min(), fmt)} ~ {fm(a.max(), fmt)}"


def pct(x): return '—' if x is None else f"{x*100:.0f}%"
def pct1(x): return '—' if x is None else f"{x*100:.1f}%"


def main():
    bj = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'cases', 'lib_browser.json')
    out_md = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'cases', 'LIBRARY.md')
    br = json.load(open(bj))
    lines = ['| 시나리오 | 도메인 | 주입/회수 | 1 PV 일수 | sweep @1 PV (브라우저 / OGS) | sweep @5 PV (브라우저 / OGS) | 광체 밖 최대, 침출 중 (브라우저 / OGS) | 파과 (브라우저 / OGS) | 복원 후 잔류 @7 PV (브라우저 / OGS) |',
             '|---|---|---|---|---|---|---|---|---|']
    ok = []; done = 0
    for name in sorted(br):
        b = browser_metrics(br[name]); case = os.path.join(ROOT, 'cases', 'lib', name)
        o = ogs_metrics(case) if os.path.exists(os.path.join(case, 'results.json')) else None
        if o is None:
            lines.append(f"| {name} | {b['domain']:g} m | {b['nI']}/{b['nP']} | {b['pv_days']:.0f} | {pct(b['sweep1'])} / — | {pct(b['sweep5'])} / — | {pct1(b['out_peak'])} / — | {b['bt']:.0f} d / — | {pct(b['resid'])} / — |"); continue
        done += 1
        match = abs(b['domain'] - o['domain']) < 1e-6 and abs(b['pv_days'] - o['pv_days']) < 0.5 and o['basis'] == 'production'
        dom = f"{o['domain']:g} m" if abs(b['domain'] - o['domain']) < 1e-6 else f"{b['domain']:g} ≠ {o['domain']:g} m"
        pvd = f"{o['pv_days']:.0f}" if abs(b['pv_days'] - o['pv_days']) < 0.5 else f"{b['pv_days']:.0f} ≠ {o['pv_days']:.0f}"
        lines.append(f"| {name} | {dom} | {o['nI']}/{o['nP']} | {pvd} | {pct(b['sweep1'])} / {pct(o['sweep1'])} | {pct(b['sweep5'])} / {pct(o['sweep5'])} | {pct1(b['out_peak'])} / {pct1(o['out_peak'])} | {b['bt']:.0f} d / {o['bt'] or 0:.0f} d | {pct(b['resid'])} / {pct(o['resid'])} |")
        if match:
            ok.append(dict(name=name, d1=b['sweep1'] - o['sweep1'], d5=b['sweep5'] - o['sweep5'], do=b['out_peak'] - o['out_peak'],
                           dbt=b['bt'] - (o['bt'] or 0), dr=(b['resid'] - o['resid']) if (b['resid'] is not None and o['resid'] is not None) else None,
                           contained=not name.endswith('bm10')))
        else:
            print(f'[경고] {name}: 도메인·PV 기준 불일치 (브라우저 {b["domain"]:g} m/{b["pv_days"]:.0f} d, OGS {o["domain"]:g} m/{o["pv_days"]:.0f} d, {o["basis"]}) — 요약에서 제외', file=sys.stderr)
    lines.append('')
    if ok:
        A = lambda k, sel=lambda r: True: np.array([r[k] for r in ok if sel(r) and r[k] is not None])
        d1, d5, dbt, dr = A('d1'), A('d5'), A('dbt'), A('dr')
        dc, df = A('do', lambda r: r['contained']), A('do', lambda r: not r['contained'])
        d1c, d1f = A('d1', lambda r: r['contained']), A('d1', lambda r: not r['contained'])
        lines.append(f"완료 {done}/12, 도메인·PV 기준 일치 {len(ok)}개로 요약. 같은 PV(= 같은 날짜)에서 브라우저 − OGS:")
        lines.append('')
        f1 = '{:+.1f}'
        lines.append(f"- sweep @1 PV 평균 {fm(d1.mean()*100, f1)} %p (범위 {rng(d1*100, f1)}) — 봉쇄 성립(bleed +5 %) {fm(d1c.mean()*100, f1)}, 봉쇄 실패(−10 %) {fm(d1f.mean()*100, f1)}; @5 PV 평균 {fm(d5.mean()*100, f1)} %p (범위 {rng(d5*100, f1)})")
        if len(dc): lines.append(f"- 광체 밖 최대(침출 중), 봉쇄 성립: 평균 {fm(dc.mean()*100, f1)} %p (범위 {rng(dc*100, f1)})")
        if len(df): lines.append(f"- 광체 밖 최대(침출 중), 봉쇄 실패: 평균 {fm(df.mean()*100, f1)} %p (범위 {rng(df*100, f1)})")
        lines.append(f"- 파과 시각: 평균 {fm(dbt.mean(), f1)} 일 (범위 {rng(dbt, '{:+.0f}')})")
        if len(dr): lines.append(f"- 복원 2 PV 후 잔류(5 PV 시점 대비): 평균 {fm(dr.mean()*100, f1)} %p (범위 {rng(dr*100, f1)})")
    out = '\n'.join(lines); print(out)
    open(out_md, 'w', encoding='utf-8').write(out + '\n')


if __name__ == '__main__': main()
