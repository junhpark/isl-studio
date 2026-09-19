#!/usr/bin/env python3
"""브라우저 스냅샷(JSON) vs OGS results (results.json + fields.bin)
   지표: 수두 RMS 차, 추적자 MAE, sweep 접촉율(양쪽), 광체 밖 추적자 분율(양쪽)
   해상도가 다르면(브라우저 2배 세분) 블록 평균으로 OGS 격자에 맞춰 비교한다.
   sweep / out_ore 는 각자 원 격자에서 계산 (격자 무관한 비율)."""
import sys, json, numpy as np, os

def load_ref(case):
    meta = json.load(open(os.path.join(case, 'results.json'))); N = meta['nx']*meta['ny']
    arr = np.fromfile(os.path.join(case, 'fields.bin'), np.float32).reshape(len(meta['times_days']), 2, N)
    return meta, arr

def frame(meta, day):
    t = np.array(meta['times_days']); return int(np.argmin(np.abs(t-day)))

def ore_mask(meta, nx, DX):
    w = meta['wells']; s = meta['scenario']['wells']['spacing_m']
    x0 = min(q['x'] for q in w)-s/2; x1 = max(q['x'] for q in w)+s/2
    y0 = min(q['y'] for q in w)-s/2; y1 = max(q['y'] for q in w)+s/2
    xc = (np.arange(nx)+0.5)*DX; XX, YY = np.meshgrid(xc, xc)
    return ((XX >= x0) & (XX <= x1) & (YY >= y0) & (YY <= y1)).ravel()

def block_avg(a, nb, no):
    f = nb // no; assert f*no == nb, f'grid ratio not integer: {nb}/{no}'
    return a.reshape(no, f, no, f).mean(axis=(1, 3)).ravel()

def main(case, snaps, label=''):
    meta, arr = load_ref(case); nxo = meta['nx']; DXo = meta['DX']; oreo = ore_mask(meta, nxo, DXo)
    print(f"OGS[{label or case}]: {meta['source']}  grid {nxo}×{nxo}  frames={len(meta['times_days'])}  1PV={meta['pv_days']:.0f} d")
    print(f"{'day':>5} {'h_rms[m]':>9} {'h_rng':>7} {'trc_MAE':>8} {'sweep_br':>9} {'sweep_ogs':>10} {'out_br':>7} {'out_ogs':>8}   (br grid)")
    rows = []
    for sp in snaps:
        b = json.load(open(sp)); k = frame(meta, b['day']); hh = arr[k, 0]; cc = arr[k, 1]
        nxb = b['nx']; hb = np.array(b['h']); cb = np.clip(np.array(b['Cl'])/b['conc'], 0, 1)
        oreb = ore_mask(meta, nxb, b['DX'])
        sb = (cb[oreb] > 0.05).mean(); so = (cc[oreo] > 0.05).mean()
        ob = cb[~oreb].sum()/max(cb.sum(), 1e-9); oo = cc[~oreo].sum()/max(cc.sum(), 1e-9)
        if nxb != nxo: hb2 = block_avg(hb.reshape(nxb, nxb), nxb, nxo); cb2 = block_avg(cb.reshape(nxb, nxb), nxb, nxo)
        else: hb2, cb2 = hb, cb
        rms = np.sqrt(((hb2-hh)**2).mean()); mae = np.abs(cb2-np.clip(cc, 0, 1)).mean()
        rows.append(dict(day=b['day'], h_rms=rms, mae=mae, sweep_br=sb, sweep_ogs=so, out_br=ob, out_ogs=oo, br_grid=nxb))
        print(f"{b['day']:5.0f} {rms:9.3f} {hh.max()-hh.min():7.2f} {mae:8.3f} {sb*100:8.1f}% {so*100:9.1f}% {ob*100:6.1f}% {oo*100:7.1f}%   ({nxb}×{nxb})")
    return rows

if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--label=')]
    lab = next((a.split('=', 1)[1] for a in sys.argv[1:] if a.startswith('--label=')), '')
    main(args[0], args[1:], lab)
