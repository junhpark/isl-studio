#!/usr/bin/env python3
"""기술 배경서용 수식 → PNG (matplotlib mathtext). manifest.json 에 픽셀 크기 기록."""
import os, json, matplotlib
matplotlib.use('Agg'); import matplotlib.pyplot as plt
from matplotlib import mathtext

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'eq'); os.makedirs(OUT, exist_ok=True)
plt.rcParams.update({'mathtext.fontset': 'stix', 'font.family': 'STIXGeneral', 'font.size': 13})

EQ = {
 # 3 공통 이론
 'darcy':     r"$\mathbf{q} = -K\,\nabla h, \qquad K = \dfrac{k\,\rho g}{\mu}, \qquad h = \dfrac{p}{\rho g} + z$",
 'confined':  r"$S_s\,\dfrac{\partial h}{\partial t} = \nabla\!\cdot\!\left(K\nabla h\right) + \sum_w \dfrac{Q_w}{B}\,\delta(\mathbf{x}-\mathbf{x}_w) \;\;\Rightarrow\;\; T\,\nabla^2 h + \sum_w Q_w\,\delta(\mathbf{x}-\mathbf{x}_w) = 0,\quad T = KB$",
 'thiem':     r"$Q = \dfrac{2\pi K B\,\Delta s}{\ln\left(r_e/r_w\right)}$",
 'richards':  r"$\dfrac{\partial \theta}{\partial t} = \nabla\!\cdot\!\left[K(\theta)\,\nabla\left(\psi + z\right)\right]$",
 'se_k':      r"$S_e = \dfrac{\theta-\theta_r}{\theta_s-\theta_r}, \qquad K(S_e) = K_s\,S_e^{\,3}$",
 'ade':       r"$\dfrac{\partial(\phi C)}{\partial t} + \nabla\!\cdot\!\left(\mathbf{q}\,C\right) - \nabla\!\cdot\!\left(\phi\,\mathbf{D}\,\nabla C\right) = Q_C$",
 'disp':      r"$D_{ij} = \left(D_m + \alpha_T |\mathbf{v}|\right)\delta_{ij} + \left(\alpha_L - \alpha_T\right)\dfrac{v_i v_j}{|\mathbf{v}|}, \qquad \mathbf{v} = \mathbf{q}/\phi$",
 'peclet':    r"$Pe_{\Delta x} = \dfrac{|\mathbf{v}|\,\Delta x}{D_L} \approx \dfrac{\Delta x}{\alpha_L}$",
 'exchange':  r"$\left[\mathrm{Clay}\right]\!\cdot\!\mathrm{RE}^{3+} + 3\,\mathrm{NH}_4^{+} \;\rightleftharpoons\; \left[\mathrm{Clay}\right]\!\cdot\!3\,\mathrm{NH}_4^{+} + \mathrm{RE}^{3+}$",
 'kinetic':   r"$r = k_r\,S\,\dfrac{c}{K_H + c}\,S_e, \qquad \dfrac{dS}{dt} = -r, \qquad \dfrac{dM_l}{dt} = -1.5\,r, \qquad \dfrac{dM_r}{dt} = +r$",
 'ore':       r"$S_0 = \dfrac{g}{100}\cdot\dfrac{\rho_b}{M_{\mathrm{RE_2O_3}}}\cdot 2 \;=\; \dfrac{0.05}{100}\cdot\dfrac{1900}{0.330}\cdot 2 \approx 5.76\ \mathrm{mol\,RE/m^3}$",
 'bishop':    r"$F = \dfrac{\sum_n \left[c_n b_n + \left(W_n - u_n b_n\right)\tan\varphi_n\right]/m_{\alpha,n}}{\sum_n W_n \sin\alpha_n}, \qquad m_{\alpha,n} = \cos\alpha_n + \dfrac{\sin\alpha_n \tan\varphi_n}{F}$",
 # 4 사면 모듈
 'slope_w':   r"$w_c \leftarrow w_c + q_{inj}\,\Delta t, \qquad M_{l,c} \leftarrow M_{l,c} + q_{inj}\,\Delta t\,c_{inj}$",
 'slope_qz':  r"$q_z = \min\!\left(K_f\,\Delta t,\; w_c - w_{r,c},\; w_{s,b} - w_b\right), \qquad K_f = \dfrac{2\,K_a K_{s,b}}{K_a + K_{s,b}}, \qquad K_a = K_s S_e^{\,3}$",
 'slope_qx':  r"$q_x = \min\!\left(K_f\,\sin\beta\,\Delta t,\; 0.5\,(w_c - w_{r,c}),\; w_{s,t} - w_t\right)\quad (S_e \geq 0.8)$",
 'slope_drain': r"$q_{drain} = \min\!\left(a,\; \eta\,a\,\dfrac{\Delta t}{0.5}\right), \quad a = w_c - w_{r,c}, \quad \eta = 0.55 + 0.15\,[\mathrm{GH}] + 0.12\,[\mathrm{CW}] + 0.08\,[\mathrm{PB}] \leq 0.92$",
 'slope_metrics': r"$R = \dfrac{\sum M_{r,\mathrm{recovered}}}{\sum S_0}, \qquad L = \dfrac{V_{loss}}{V_{inj}}, \qquad c_{liquor} = \dfrac{\dot m_{RE}}{\dot V}\cdot 0.140\ \mathrm{kg/mol}$",
 # 5 패턴 모듈
 'sor':       r"$h_{ij}^{\,new} = h_{ij} + \omega\left[\dfrac{1}{4}\left(h_{i-1,j}+h_{i+1,j}+h_{i,j-1}+h_{i,j+1} + \dfrac{Q_{ij}}{T}\right) - h_{ij}\right], \quad \omega = 1.82$",
 'face':      r"$F_{x,i+\frac{1}{2}} = -K\,\dfrac{h_{i+1}-h_i}{\Delta x}\,\Delta y\,B, \qquad v_{x} = \dfrac{F_x}{\phi\,\Delta y\,B}$",
 'upwind':    r"$M_c^{\,n+1} = M_c^{\,n} - \Delta t \sum_{f} F_f\, C_{up,f} + \Delta t\left(Q_{inj} c_{inj} - Q_{prod} C_c\right), \qquad C_c = M_c / V_c$",
 'cfl':       r"$\Delta t \leq 0.7\,\min_c \dfrac{V_c}{\sum_{f,out} F_f}, \qquad \Delta t \leq 0.2\,\dfrac{\Delta x^2}{D_{max}}$",
 'disp_fv':   r"$J_{x,i+\frac{1}{2}} = \phi\,D_{xx,f}\,\dfrac{C_{i+1}-C_i}{\Delta x}\,\Delta y\,B, \qquad D_{xx,f} = \dfrac{\alpha_{L,e} v_x^2 + \alpha_T v_y^2}{|\mathbf{v}|} + D_m$",
 'numdisp':   r"$D_{num} = \dfrac{|\mathbf{v}|\,\Delta x}{2} \;\;\Rightarrow\;\; \alpha_{num} = \dfrac{\Delta x}{2}, \qquad \alpha_{L,e} = \max\!\left(0,\;\alpha_L - \dfrac{\Delta x}{2}\right)$",
 'stream':    r"$\mathbf{x}_{k+1} = \mathbf{x}_k + \Delta s\,\hat{\mathbf{v}}\!\left(\mathbf{x}_k + \frac{\Delta s}{2}\hat{\mathbf{v}}(\mathbf{x}_k)\right), \qquad \hat{\mathbf{v}} = \mathbf{v}/|\mathbf{v}|$",
 'pv':        r"$PV = \phi\,B\,A_{pattern}, \qquad \sum Q_{prod} = (1+\beta)\sum Q_{inj}, \qquad t_{1PV} = \dfrac{PV}{\sum Q_{prod}}$",
 'pattern_metrics': r"$\mathrm{sweep} = \dfrac{\#\{c \in \mathrm{ore}: C_c/c_{inj} > 0.05\}}{\#\mathrm{ore}}, \qquad L = \dfrac{M_{out,boundary} + \sum_{c \notin \mathrm{ore}} M_c}{\sum Q_{inj} c_{inj}\, t}$",
 # 6 OGS
 'ogs_flow':  r"$\phi\,\dfrac{\partial \rho}{\partial p}\dfrac{\partial p}{\partial t} + \nabla\!\cdot\!\left(\rho\,\mathbf{q}\right) = Q_p, \qquad \mathbf{q} = -\dfrac{\mathbf{k}}{\mu}\left(\nabla p - \rho\,\mathbf{g}\right)$",
 'ogs_ct':    r"$\phi R\,\dfrac{\partial C}{\partial t} + \mathbf{q}\!\cdot\!\nabla C - \nabla\!\cdot\!\left(\phi\,\mathbf{D}\,\nabla C\right) + \phi R\,\lambda\,C = Q_C$",
 'ogs_ct_cons': r"$\dfrac{\partial(\phi R\,C)}{\partial t} + \nabla\!\cdot\!\left(\mathbf{q}\,C\right) - \nabla\!\cdot\!\left(\phi\,\mathbf{D}\,\nabla C\right) + \phi R\,\lambda\,C = Q_C$",
 'ogs_D':     r"$\phi\,\mathbf{D} = \left(\phi D_p + \alpha_T |\mathbf{q}|\right)\mathbf{I} + \left(\alpha_L - \alpha_T\right)\dfrac{\mathbf{q}\,\mathbf{q}^{T}}{|\mathbf{q}|}$",
 'ogs_stab':  r"$D_{art} = \delta\,\dfrac{h_e\,|\mathbf{v}|}{2}\ \ (\delta = 0.5) \;\;\Rightarrow\;\; \alpha_{art} \approx \delta\,\dfrac{h_e}{2} = 0.5\times\dfrac{3.6}{2} \approx 0.9\ \mathrm{m}$",
 'ogs_be':    r"$\dfrac{\mathbf{M}}{\Delta t}\left(\mathbf{C}^{n+1} - \mathbf{C}^{n}\right) + \mathbf{K}\!\left(\mathbf{q}^{n+1}\right)\mathbf{C}^{n+1} = \mathbf{b}^{n+1}$",
 'ogs_unit':  r"$\dot m_{node} = \dfrac{Q\,[\mathrm{m^3/d}]}{86400}\cdot\dfrac{1}{B}\cdot\rho \quad [\mathrm{kg\,s^{-1}\,m^{-1}}], \qquad k = \dfrac{K\mu}{\rho g} = \dfrac{(1/86400)\times 10^{-3}}{1000\times 9.81} \approx 1.18\times10^{-12}\ \mathrm{m^2}$",
 'ogs_p':     r"$p_{bc}(x) = 2\times10^5 - \rho g\, i\, x, \qquad h = \dfrac{p - 2\times10^5}{\rho g}$",
 # 8 검증
 'rms':       r"$\mathrm{RMS}_h = \sqrt{\dfrac{1}{N}\sum_c \left(h_c^{br} - h_c^{ogs}\right)^2}, \qquad \mathrm{MAE}_C = \dfrac{1}{N}\sum_c \left|\dfrac{C_c^{br}}{c_{inj}} - \dfrac{C_c^{ogs}}{c_{inj}}\right|$",
 'massbal':   r"$\mathcal{M}(t) = \dfrac{\sum_c C_c(t)\,V_c}{\sum Q_{inj}\,c_{inj}\,t} \quad \left\{ = 1\ \mathrm{(before)},\;\; < 1\ \mathrm{(after\ breakthrough)} \right\}$",
}

man = {}
for name, tex in EQ.items():
    tex = tex.replace(r'\text{정상}', r'\mathrm{steady}').replace(r'\text{파과 전}', r'\mathrm{before\ breakthrough}').replace(r'\text{파과 후 (회수정이 용질을 뺌)}', r'\mathrm{after\ breakthrough}')
    fig = plt.figure(figsize=(0.1, 0.1), dpi=300)
    t = fig.text(0, 0, tex, fontsize=13)
    fig.canvas.draw(); bb = t.get_window_extent(renderer=fig.canvas.get_renderer())
    w, h = bb.width/300 + 0.15, bb.height/300 + 0.15
    plt.close(fig)
    fig = plt.figure(figsize=(w, h), dpi=300); fig.patch.set_alpha(0)
    fig.text(0.5, 0.5, tex, fontsize=13, ha='center', va='center')
    p = os.path.join(OUT, name + '.png'); fig.savefig(p, dpi=300, transparent=True); plt.close(fig)
    man[name] = {'w': int(w*300), 'h': int(h*300)}
json.dump(man, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1)
print(len(man), 'equations')
