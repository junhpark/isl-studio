#!/usr/bin/env python3
"""COMPARE.md 용 그림 3장.
   fig1 추적자 필드 나란히 (브라우저 / OGS / 차이) — 2 PV 시점
   fig2 sweep 접촉율 vs PV, 광체 밖 추적자 vs PV (두 모델)
   fig3 물질수지: 잔존/주입 vs 일 (두 모델) — 참조해 결함 검출용 지표"""
import json, os, sys, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fields_io import read_fields
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BR, OG = '#2a78d6', '#eb6834'                       # 카테고리 슬롯 1, 2
INK, INK2, GRID, SURF = '#0b0b0b', '#52514e', '#e1e0d9', '#fcfcfb'
SEQ = LinearSegmentedColormap.from_list('seqblue', ['#fcfcfb', '#cde2fb', '#86b6ef', '#3987e5', '#1c5cab', '#0d366b'])
import matplotlib.font_manager as fm
_ck=[f for f in fm.findSystemFonts() if 'CJK' in f and ('Sans' in f or 'Serif' in f)]
if _ck: fm.fontManager.addfont(sorted(_ck, key=lambda f:('Sans' not in f, f))[0])
_names=sorted({x.name for x in fm.fontManager.ttflist if 'CJK' in x.name}, key=lambda n:('Sans' not in n, 'KR' not in n, n))
_fam=_names[0] if _names else 'sans-serif'
print('font:', _fam)
plt.rcParams.update({'font.family': _fam, 'axes.unicode_minus': False, 'font.size': 9, 'axes.edgecolor': '#c3c2b7', 'axes.labelcolor': INK2,
                     'xtick.color': '#898781', 'ytick.color': '#898781', 'axes.grid': True, 'grid.color': GRID, 'grid.linewidth': 0.6,
                     'axes.spines.top': False, 'axes.spines.right': False, 'figure.facecolor': SURF, 'axes.facecolor': SURF})

def load_ref(case):
    meta = json.load(open(os.path.join(case, 'results.json'))); N = meta['nx']*meta['ny']
    return read_fields(case)

def ore_rect(meta):
    w = meta['wells']; s = meta['scenario']['wells']['spacing_m']
    return (min(q['x'] for q in w)-s/2, max(q['x'] for q in w)+s/2, min(q['y'] for q in w)-s/2, max(q['y'] for q in w)+s/2)

def fig1(case, snap, out):
    meta, arr = load_ref(case); nx, DX, L = meta['nx'], meta['DX'], meta['domain_m']
    b = json.load(open(snap)); k = int(np.argmin(np.abs(np.array(meta['times_days'])-b['day'])))
    cb = np.clip(np.array(b['Cl'])/b['conc'], 0, 1).reshape(nx, nx); co = np.clip(arr[k, 1], 0, 1).reshape(nx, nx)
    x0, x1, y0, y1 = ore_rect(meta)
    fig, axs = plt.subplots(1, 3, figsize=(11, 3.7), constrained_layout=True)
    for ax, f, ttl, cm, vmin, vmax in [(axs[0], cb, f'브라우저 근사 · {b["day"]:.0f}일', SEQ, 0, 1), (axs[1], co, f'OGS 참조해 · {meta["times_days"][k]:.0f}일', SEQ, 0, 1),
                                        (axs[2], cb-co, '차이 (브라우저 − OGS)', 'RdBu_r', -0.3, 0.3)]:
        im = ax.imshow(f, origin='lower', extent=[0, L, 0, L], cmap=cm, vmin=vmin, vmax=vmax, interpolation='nearest')
        ax.add_patch(plt.Rectangle((x0, y0), x1-x0, y1-y0, fill=False, ec='#eda100', lw=1.2, ls='--'))
        for q in meta['wells']: ax.plot(q['x'], q['y'], marker='v' if q['type'] == 'I' else '^', ms=5, color='#0b0b0b' if q['type'] == 'I' else '#e34948', mec='white', mew=0.5, ls='none')
        ax.set_title(ttl, color=INK, fontsize=10); ax.set_xlabel('x (m)'); ax.grid(False); ax.set_aspect('equal')
        cb_ = fig.colorbar(im, ax=ax, shrink=0.8); cb_.outline.set_visible(False)
    axs[0].set_ylabel('y (m)'); axs[0].text(0.02, 0.98, '▼ 주입정  ▲ 회수정  - - 광체 범위', transform=axs[0].transAxes, va='top', fontsize=8, color=INK2)
    fig.savefig(out, dpi=150); plt.close(fig)

def fig2(case, brjson, name, out):
    meta, arr = load_ref(case); t = np.array(meta['times_days']); pv = t/meta['pv_days']
    b = json.load(open(brjson))[name]
    fig, axs = plt.subplots(1, 2, figsize=(10, 3.6), constrained_layout=True)
    ax = axs[0]; ax.plot(pv, np.array(meta['sweep_frac'])*100, color=OG, lw=2, label='OGS 참조해'); ax.plot(b['pv'], np.array(b['sweep'])*100, color=BR, lw=2, marker='o', ms=4, label='브라우저 근사')
    ax.set_xlabel('누적 양수 공극체적 (PV)'); ax.set_ylabel('sweep 접촉율 (%)'); ax.set_ylim(0, 100); ax.set_title('광체 중 침출액이 닿은 비율 (추적자 > 5 %)', color=INK, fontsize=10); ax.legend(frameon=False)
    ax = axs[1]; ax.plot(pv, np.array(meta['tracer_outside_ore_frac'])*100, color=OG, lw=2, label='OGS 참조해'); ax.plot(b['pv'], np.array(b['out_ore'])*100, color=BR, lw=2, marker='o', ms=4, label='브라우저 근사')
    ax.set_xlabel('누적 양수 공극체적 (PV)'); ax.set_ylabel('광체 밖 추적자 (% of 도메인 총량)'); ax.set_title('광체 범위 밖으로 번진 비율', color=INK, fontsize=10); ax.legend(frameon=False)
    fig.savefig(out, dpi=150); plt.close(fig)

def fig3(cases, labels, browser_snaps, out):
    fig, ax = plt.subplots(figsize=(7, 3.6), constrained_layout=True)
    cols = [OG, '#898781', '#c3c2b7']
    for (case, lab, col) in zip(cases, labels, cols):
        meta = json.load(open(os.path.join(case, 'results.json')))
        if 'mass_balance' in meta: r = meta['mass_balance']['retained_over_injected']; ax.plot(meta['times_days'], r, color=col, lw=2 if col == OG else 1.4, ls='-' if col == OG else '--', label=lab)
        else:
            arr = read_fields(case)[1]
            V = meta['DX']**2*meta['scenario']['grid']['aquifer_thickness_m']*meta['scenario']['aquifer']['porosity']
            ninj = len([q for q in meta['wells'] if q['type'] == 'I']); Qi = [q['Q_m3_per_d'] for q in meta['wells'] if q['type'] == 'I'][0]
            r = [arr[k, 1].sum()*V/max(ninj*Qi*d, 1e-9) for k, d in enumerate(meta['times_days'])]; ax.plot(meta['times_days'], r, color=col, lw=1.4, ls='--', label=lab)
    bd, br_ = [], []
    for sp in browser_snaps:
        b = json.load(open(sp)); V = b['DX']**2*8*0.3; bd.append(b['day']); br_.append((np.array(b['Cl'])/b['conc']).sum()*V/(4*100*b['day']))
    ax.plot(bd, br_, color=BR, lw=2, marker='o', ms=4, label='브라우저 근사')
    ax.set_xlabel('일'); ax.set_ylabel('도메인 잔존 / 누적 주입'); ax.set_ylim(0, 1.1); ax.set_title('물질수지 — 회수정이 용질을 빼면 1 아래로 떨어져야 한다', color=INK, fontsize=10); ax.legend(frameon=False, fontsize=8)
    fig.savefig(out, dpi=150); plt.close(fig)

if __name__ == '__main__':
    os.makedirs(os.path.join(ROOT, 'figs'), exist_ok=True)
    fig1(os.path.join(ROOT, 'cases/base'), os.path.join(ROOT, 'cases/browser/browser_snapshot_day270.json'), os.path.join(ROOT, 'figs/fig1_tracer_fields.png'))
    fig2(os.path.join(ROOT, 'cases/base'), os.path.join(ROOT, 'cases/lib_browser.json'), '5spot_s50_bp5', os.path.join(ROOT, 'figs/fig2_sweep_outside.png'))
    fig3([os.path.join(ROOT, 'cases/base'), os.path.join(ROOT, 'cases/base_v0_buggy'), os.path.join(ROOT, 'cases/base_v1_nonadv_buggy')],
         ['OGS 최종 (이류형 + 등방확산)', 'OGS v0 결함 (FullUpwind)', 'OGS v1 결함 (보존형)'],
         [os.path.join(ROOT, f'cases/browser/browser_snapshot_day{d}.json') for d in (21, 135, 270, 405, 540)], os.path.join(ROOT, 'figs/fig3_mass_balance.png'))
    print('figs written')
