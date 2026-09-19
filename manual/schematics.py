#!/usr/bin/env python3
"""기술 배경서 개념도 3장 (matplotlib). docs/figs/ 아래 저장."""
import os, numpy as np, matplotlib
matplotlib.use('Agg'); import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
from matplotlib.patches import Rectangle, FancyArrowPatch, Circle, Polygon

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'docs', 'figs'); os.makedirs(OUT, exist_ok=True)
_ck = [f for f in fm.findSystemFonts() if 'CJK' in f]
if _ck: fm.fontManager.addfont(sorted(_ck, key=lambda f: ('Sans' not in f, f))[0])
_names = sorted({x.name for x in fm.fontManager.ttflist if 'CJK' in x.name}, key=lambda n: ('Sans' not in n, 'KR' not in n, n))
plt.rcParams.update({'font.family': _names[0] if _names else 'sans-serif', 'axes.unicode_minus': False, 'font.size': 9})
INK, INK2, BLUE, ORANGE, CYAN, RED, AMBER = '#0b0b0b', '#52514e', '#2a78d6', '#eb6834', '#1fa7a0', '#e34948', '#eda100'
LAY = ['#d9c9a8', '#c99a5b', '#a58a6b', '#7a7d84']

def slope():
    fig, ax = plt.subplots(figsize=(8.6, 4.2)); ax.set_xlim(0, 100); ax.set_ylim(-6, 80); ax.axis('off')
    BB = dict(fc='white', ec='none', alpha=0.85, pad=1.5)
    x = np.linspace(0, 100, 200); t = x/100; s = t*t*(3-2*t); zt = 72-44*s
    d = [0, 1.5, 11.5, 18.0, 30]
    names = ['표토 (K 7.08 m/d)', '완전풍화 광석층 (K 2.59 m/d)', '반풍화층 (K 1.30 m/d)', '기반암 차수층 (K 3.8e-4 m/d)']
    for m in range(4):
        top = zt-d[m]; bot = zt-d[m+1] if m < 3 else np.full_like(x, 4)
        ax.fill_between(x, bot, top, color=LAY[m], lw=0)
    ax.plot(x, zt, color=INK, lw=1.2)
    ax.plot(x, zt-18, color=INK, lw=1.0, ls='--')
    for m in range(4): ax.text(3, zt[6]-d[m]-(d[m+1]-d[m])/2 if m < 3 else 14, names[m], fontsize=8, color=INK, va='center', bbox=BB)
    # 주입공
    for xi in [12, 22, 32, 45, 58, 70]:
        zi = np.interp(xi, x, zt); ax.plot([xi, xi], [zi+3, zi-8], color=CYAN, lw=2); ax.plot(xi, zi+3, marker='v', color=CYAN, ms=7)
    ax.text(24, 76, '주입공 (황산암모늄 용액, 단계별 활성화)', color=CYAN, fontsize=8.5)
    # 흐름 화살표
    for xi in [30, 50, 66]:
        zi = np.interp(xi, x, zt)
        ax.add_patch(FancyArrowPatch((xi, zi-2), (xi, zi-13), arrowstyle='-|>', mutation_scale=10, color=BLUE, lw=1.4))
    for xi in [40, 60, 78]:
        zi = np.interp(xi, x, zt)-16.5
        ax.add_patch(FancyArrowPatch((xi, zi), (xi+9, np.interp(xi+9, x, zt)-16.5), arrowstyle='-|>', mutation_scale=10, color=BLUE, lw=1.4))
    ax.text(43, 63, '연직 배수  K(Se) = Ks·Se³', color=BLUE, fontsize=8, bbox=BB)
    ax.text(60, 51, '기반암 상면 위 측방 흐름 (Se ≥ 0.8)', color=BLUE, fontsize=8, bbox=BB)
    # 집액구
    zt90 = np.interp(91, x, zt)
    ax.add_patch(Rectangle((88, zt90-19), 9, 4, color=AMBER)); ax.text(86, zt90-23.5, '집액구 (효율 η)', color='#8a5a00', fontsize=8, bbox=BB)
    # 유실 경로
    ax.add_patch(FancyArrowPatch((50, np.interp(50, x, zt)-18.5), (50, 10), arrowstyle='-|>', mutation_scale=10, color=RED, lw=1.3, ls='--'))
    ax.text(52, 20, '기반암 누수\n(차수층 결손 시 ↑)', color=RED, fontsize=8, bbox=BB)
    ax.add_patch(FancyArrowPatch((97, zt90-8), (100, zt90-8), arrowstyle='-|>', mutation_scale=10, color=RED, lw=1.3, ls='--'))
    ax.text(80, zt90+9, '측면 유출 (차수벽 시 0)', color=RED, fontsize=8, ha='left', bbox=BB)
    ax.text(3, -4, '개념도 — 종단면 (y 중앙). 격자 40×24×28, Δ = 2.5 m. 사면 경사 sinβ ≈ 0.42.', color=INK2, fontsize=8)
    fig.savefig(os.path.join(OUT, 'sch_slope.png'), dpi=170, bbox_inches='tight'); plt.close(fig)

def pattern():
    fig, ax = plt.subplots(figsize=(8.2, 4.4)); ax.set_aspect('equal'); ax.axis('off')
    ax.set_xlim(-108, 150); ax.set_ylim(-112, 108)
    s = 50; half = s
    ore = Rectangle((-half-s/2, -half-s/2), 2*half+s, 2*half+s, fill=False, ec=AMBER, ls='--', lw=1.3); ax.add_patch(ore)
    ring = Rectangle((-half-s/2-25, -half-s/2-25), 2*half+s+50, 2*half+s+50, fill=False, ec=INK2, ls=':', lw=1.0); ax.add_patch(ring)
    P = [(-half+i*s, -half+j*s) for i in range(3) for j in range(3)]
    I = [(-half+(i+.5)*s, -half+(j+.5)*s) for i in range(2) for j in range(2)]
    for (x, y) in I:
        for th in np.linspace(0, 2*np.pi, 12, endpoint=False):
            r = np.linspace(3, 28, 20); xx = x+r*np.cos(th)*(1+0.15*np.sin(3*th)); yy = y+r*np.sin(th)*(1+0.15*np.cos(3*th))
            ax.plot(xx, yy, color=CYAN, lw=0.7, alpha=0.8)
    for (x, y) in P: ax.plot(x, y, marker='^', ms=9, color=RED, mec='white', mew=0.6, ls='none')
    for (x, y) in I: ax.plot(x, y, marker='v', ms=9, color=INK, mec='white', mew=0.6, ls='none')
    # 감시정
    for k in range(3):
        f = (k+.5)/3; L0 = -half-s/2-25; L1 = half+s/2+25
        for (x, y) in [(L0+(L1-L0)*f, L0), (L0+(L1-L0)*f, L1), (L0, L0+(L1-L0)*f), (L1, L0+(L1-L0)*f)]:
            ax.plot(x, y, marker='o', ms=5, color='white', mec=INK2, mew=1.2, ls='none')
    ax.text(0, half+s/2+3, '광체 범위 (정호 외곽 + s/2)', color='#8a5a00', ha='center', fontsize=8)
    ax.text(0, -half-s/2-25-6, '감시 링 (25 m 밖, 12공, UCL 3 %, 2연속 초과 → 경보)', color=INK2, ha='center', fontsize=8, va='top')
    # 지역 흐름 화살표
    ax.add_patch(FancyArrowPatch((-95, 88), (-72, 88), arrowstyle='-|>', mutation_scale=12, color=BLUE, lw=1.4))
    ax.text(-68, 88, '지역 지하수 흐름 i = 0.002', color=BLUE, fontsize=8, va='center')
    # 범례
    ax.plot(112, 55, marker='v', ms=9, color=INK, ls='none'); ax.text(118, 55, '주입정 Q_inj (4공)', va='center', fontsize=8.5)
    ax.plot(112, 45, marker='^', ms=9, color=RED, ls='none'); ax.text(118, 45, '회수정 (9공, 외곽)', va='center', fontsize=8.5)
    ax.plot([108, 116], [35, 35], color=CYAN, lw=1.2); ax.text(118, 35, '유선 (주입정당 12개)', va='center', fontsize=8.5)
    ax.plot(112, 25, marker='o', ms=5, color='white', mec=INK2, mew=1.2, ls='none'); ax.text(118, 25, '감시정', va='center', fontsize=8.5)
    ax.text(108, 10, 'ΣQ_prod = (1+β)·ΣQ_inj\nβ = bleed (+5 % 기본)\nβ < 0 → 유선이 밖으로 탈출', fontsize=8.5, va='top', color=INK)
    ax.text(108, -30, '피압대수층 두께 B = 8 m\nK = 1 m/d, φ = 0.30\n격자 80×80, Δx = 3.6 m\n도메인 288 m (5-spot 50 m)', fontsize=8.5, va='top', color=INK2)
    fig.savefig(os.path.join(OUT, 'sch_pattern.png'), dpi=170, bbox_inches='tight'); plt.close(fig)

def stencil():
    fig, axs = plt.subplots(1, 2, figsize=(8.6, 3.3));
    ax = axs[0]; ax.set_aspect('equal'); ax.axis('off'); ax.set_xlim(-0.3, 3.3); ax.set_ylim(-0.3, 3.3)
    for i in range(3):
        for j in range(3): ax.add_patch(Rectangle((i, j), 1, 1, fill=(i == 1 and j == 1), fc='#cde2fb', ec='#898781', lw=0.8))
    ax.text(1.5, 1.5, 'c\n(h, C)', ha='center', va='center', fontsize=9)
    for (x0, y0, x1, y1, lab) in [(1.5, 1.5, 2.45, 1.5, 'F_x'), (1.5, 1.5, 1.5, 2.45, 'F_y'), (0.55, 1.5, 1.5, 1.5, ''), (1.5, 0.55, 1.5, 1.5, '')]:
        ax.add_patch(FancyArrowPatch((x0, y0), (x1, y1), arrowstyle='-|>', mutation_scale=11, color=BLUE, lw=1.3))
    ax.text(2.05, 1.62, 'F_x = −K·Δh/Δx·Δy·B', fontsize=7.5, color=BLUE); ax.text(1.58, 2.5, 'F_y', fontsize=7.5, color=BLUE)
    ax.text(0.15, 3.15, '셀 중심 수두 h, 질량 M = C·V.  면(face)에서 유량 F 계산', fontsize=8, color=INK)
    ax.text(0.15, -0.2, '풍상차분: 면을 지나는 농도 = 상류 셀의 농도', fontsize=8, color=INK2)
    ax = axs[1]; ax.set_xlim(0, 10); ax.set_ylim(-0.05, 1.15); ax.set_xlabel('거리 (격자 수)'); ax.set_ylabel('C / c_inj')
    ax.spines['top'].set_visible(False); ax.spines['right'].set_visible(False)
    xx = np.linspace(0, 10, 400); ax.plot(xx, (xx < 5).astype(float), color=INK2, lw=1.2, ls='--', label='순수 이류 (정해)')
    from math import erf
    ax.plot(xx, [0.5*(1-erf((v-5)/np.sqrt(4*0.5*5)*1.0)) for v in xx], color=ORANGE, lw=2, label='수치분산만 (α = Δx/2)')
    ax.plot(xx, [0.5*(1-erf((v-5)/np.sqrt(4*(0.5+0.67)*5)*1.0)) for v in xx], color=BLUE, lw=2, label='물리 분산 αL=2 m 목표 (보정 후)')
    ax.legend(frameon=False, fontsize=7.5, loc='upper right'); ax.set_title('전선 번짐: 수치분산과 물리분산', fontsize=9, color=INK)
    fig.tight_layout(); fig.savefig(os.path.join(OUT, 'sch_stencil.png'), dpi=170, bbox_inches='tight'); plt.close(fig)

if __name__ == '__main__':
    slope(); pattern(); stencil(); print('schematics written to', OUT)
