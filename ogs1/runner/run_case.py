#!/usr/bin/env python3
"""OGS 결과(VTU 시계열) -> 브라우저용 results.json + fields.bin
   fields.bin: Float32 [T][F][N], N = nx*ny (브라우저 셀 순서 i + j*nx), F = head_m, tracer_frac"""
import sys, os, glob, json, numpy as np, meshio, subprocess

def run(case_dir, do_run=True):
    if do_run: subprocess.run(['ogs','pattern.prj','-o','.'],cwd=case_dir,check=True,stdout=open(os.path.join(case_dir,'ogs.log'),'w'),stderr=subprocess.STDOUT)
    meta=json.load(open(os.path.join(case_dir,'case_meta.json'))); NX,NY,DX=meta['NX'],meta['NY'],meta['DX']
    cinj=meta['scenario']['chemistry']['lixiviant_conc_mol_m3']
    files=sorted(glob.glob(os.path.join(case_dir,'pattern_ts_*.vtu')), key=lambda f:int(os.path.basename(f).split('_ts_')[1].split('_')[0]))
    m0=meshio.read(files[0]); P=m0.points[:,:2]
    ii=np.clip(np.round(P[:,0]/DX-0.5).astype(int),0,NX-1); jj=np.clip(np.round(P[:,1]/DX-0.5).astype(int),0,NY-1)
    cell=ii+jj*NX; assert len(set(cell.tolist()))==NX*NY, 'node->cell mapping not bijective'
    T=len(files); N=NX*NY; out=np.zeros((T,2,N),np.float32); times=[]
    for t,f in enumerate(files):
        m=meshio.read(f); times.append(float(os.path.basename(f).split('_t_')[1].replace('.vtu',''))/86400.0)
        h=(m.point_data['pressure']-200000.0)/(1000*9.81); c=m.point_data['Tracer']/cinj
        out[t,0,cell]=h; out[t,1,cell]=c
    # 지표: sweep(광체 내 추적자>5% 셀 비율), 광체 밖 추적자 질량 분율 (근사: 농도합 비)
    sc=meta['scenario']; w=sc['wells']['list']; s=sc['wells']['spacing_m']
    x0=min(q['x'] for q in w)-s/2; x1=max(q['x'] for q in w)+s/2; y0=min(q['y'] for q in w)-s/2; y1=max(q['y'] for q in w)+s/2
    xc=(np.arange(NX)+0.5)*DX; yc=(np.arange(NY)+0.5)*DX; XX,YY=np.meshgrid(xc,yc); ore=((XX>=x0)&(XX<=x1)&(YY>=y0)&(YY<=y1)).ravel()
    sweep=[float((out[t,1,ore]>0.05).mean()) for t in range(T)]
    outside=[float(out[t,1,~ore].sum()/max(out[t,1].sum(),1e-9)) for t in range(T)]
    # 물질수지: 도메인 잔존 / 주입 누적 (회수정이 용질을 빼면 1 미만으로 떨어져야 함)
    V=DX*DX*meta['scenario']['grid']['aquifer_thickness_m']*meta['scenario']['aquifer']['porosity']
    ninj=len([q for q in sc['wells']['list'] if q['type']=='I'])
    Qi=[q['Q_m3_per_d'] for q in sc['wells']['list'] if q['type']=='I'][0]
    mass_ratio=[float(out[t,1].sum()*V/max(ninj*Qi*times[t],1e-9)) for t in range(T)]
    prod=[q for q in sc['wells']['list'] if q['type']=='P']; pc_max=[float(max(out[t,1,min(NX-1,int(q['x']/DX))+min(NY-1,int(q['y']/DX))*NX] for q in prod)) for t in range(T)]
    res={'nx':NX,'ny':NY,'DX':DX,'mass_balance':{'retained_over_injected':mass_ratio,'producer_c_max':pc_max,
         'note':'retained_over_injected 는 파과 후 1 미만이어야 하고 producer_c_max 는 1을 크게 넘으면 안 됨'},'domain_m':sc['grid']['domain_m'],'fields':['head_m','tracer_frac'],'times_days':times,'pv_days':meta['pv_days'],
         'sweep_frac':sweep,'tracer_outside_ore_frac':outside,'wells':w,'source':'OpenGeoSys 6.5.9 ComponentTransport (tracer, advective form, IsotropicDiffusion 0.5)','scenario':sc}
    json.dump(res,open(os.path.join(case_dir,'results.json'),'w'),indent=1,ensure_ascii=False)
    out.tofile(os.path.join(case_dir,'fields.bin'))
    flag='OK' if (mass_ratio[-1]<0.95 and pc_max[-1]<1.2) else 'MASS BALANCE SUSPECT'
    print(f'results: T={T} frames, {out.nbytes/1e6:.1f} MB, last sweep={sweep[-1]:.2f}, outside={outside[-1]:.3f}, t_end={times[-1]:.0f} d, retained/injected={mass_ratio[-1]:.2f}, prod_c_max={pc_max[-1]:.2f} [{flag}]')

if __name__=='__main__': run(sys.argv[1], do_run=('--no-run' not in sys.argv))
