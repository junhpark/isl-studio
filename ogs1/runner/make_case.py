#!/usr/bin/env python3
"""scenario.json -> OGS-6 ComponentTransport case (mesh + subdomains + prj).
   브라우저(ISL Studio 패턴 탭) 격자의 셀 중심에 OGS 절점을 놓아 결과를 보간 없이 비교한다."""
import json, sys, os, subprocess, math, numpy as np, meshio

RHO, G, MU = 1000.0, 9.81, 1.0e-3
def sh(cmd): print('  $', ' '.join(cmd)); subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL)

def studio_domain(pattern, s, n, ring=25.0):
    """ISL Studio 패턴 탭의 genWells() 와 같은 도메인 공식. 참조해를 스튜디오에 겹치려면 이 값과 같아야 한다."""
    if pattern == '7spot': extent = n*s*1.84 + s
    elif pattern == 'line': extent = max(n*s + s, (2*n)*s*0.6 + s)
    else: extent = n*s + s
    return max(200.0, extent + 2*(ring + 44))

def gen_wells(sc):
    w=sc['wells']; s=w['spacing_m']; n=w['n']; L=sc['grid']['domain_m']; cx=cy=L/2
    A,Bt=('P','I') if w['outer_producers'] else ('I','P'); out=[]
    add=lambda x,y,t: out.append({'x':x,'y':y,'type':t})
    if w['pattern']=='5spot':
        h=n*s/2
        for i in range(n+1):
            for j in range(n+1): add(cx-h+i*s,cy-h+j*s,A)
        for i in range(n):
            for j in range(n): add(cx-h+(i+.5)*s,cy-h+(j+.5)*s,Bt)
    elif w['pattern']=='7spot':
        R=max(n*s*0.92, s*1.05); pts=[]
        for j in range(-n-1,n+2):
            for i in range(-n-2,n+3):
                x=cx+(i+.5*j)*s; y=cy+j*s*0.8660; r=math.hypot(x-cx,y-cy)
                if r>R: continue
                pts.append((x,y,r,((i+2*j)%3)==0))
        # 가장 바깥 껍질이 속한 부분격자를 A(켜면 회수정)로 — 스튜디오 genWells() 와 같은 규칙
        rmax=max(p[2] for p in pts); shell=[p for p in pts if p[2]>rmax-0.01*s]
        cen_out=2*sum(p[3] for p in shell)>=len(shell)
        for x,y,r,cen in pts: add(x,y,A if cen==cen_out else Bt)
    else:
        rows=2*n+1; h=n*s/2; rs=s*0.6
        for j in range(rows):
            t=A if j%2==0 else Bt; yy=cy-(rows-1)*rs/2+j*rs
            for i in range(n+1): add(cx-h+i*s,yy,t)
    inj=[q for q in out if q['type']=='I']; prod=[q for q in out if q['type']=='P']
    Qi=w['Q_inj_m3_per_d']; Qp=len(inj)*Qi*(1+w['bleed'])/max(len(prod),1)
    for q in inj: q['Q_m3_per_d']=Qi
    for q in prod: q['Q_m3_per_d']=Qp
    return out

def main(scn_path, out_dir):
    sc=json.load(open(scn_path)); os.makedirs(out_dir, exist_ok=True)
    w0=sc['wells']; dom=studio_domain(w0['pattern'], w0['spacing_m'], w0['n'], sc.get('monitoring',{}).get('ring_offset_m',25.0))
    if abs(sc['grid']['domain_m']-dom)>1e-6:
        print(f"  [경고] domain_m {sc['grid']['domain_m']} m ≠ 스튜디오 도메인 {dom:.1f} m — 이 참조해는 스튜디오에 겹칠 수 없습니다")
    g=sc['grid']; NX,NY,L,B=g['nx'],g['ny'],g['domain_m'],g['aquifer_thickness_m']; DX=L/NX
    aq=sc['aquifer']; K=aq['K_m_per_d']/86400.0; k=K*MU/(RHO*G)
    wells=sc['wells']['list'] or gen_wells(sc); sc['wells']['list']=wells
    bulk=os.path.join(out_dir,'domain.vtu')
    sh(['generateStructuredMesh','-e','quad','-o',bulk,'--lx',str((NX-1)*DX),'--ly',str((NY-1)*DX),
        '--nx',str(NX-1),'--ny',str(NY-1),'--ox',str(DX/2),'--oy',str(DX/2)])
    sh(['ExtractBoundary','-i',bulk,'-o',os.path.join(out_dir,'boundary.vtu')])
    m=meshio.read(bulk); P=m.points[:,:2]
    def write_pts(name, pts):
        ids=sorted(set(int(np.argmin(((P-np.array([p['x'],p['y']]))**2).sum(1))) for p in pts))
        mm=meshio.Mesh(points=np.c_[P[ids],np.zeros(len(ids))], cells=[('vertex',np.arange(len(ids)).reshape(-1,1))])
        path=os.path.join(out_dir,name+'.vtu'); meshio.write(path,mm); return path,ids
    inj=[q for q in wells if q['type']=='I']; prod=[q for q in wells if q['type']=='P']
    pi,inj_ids=write_pts('inj_raw',inj); pp,prod_ids=write_pts('prod_raw',prod)
    sh(['identifySubdomains','-m',bulk,'-s','1e-6','-o',os.path.join(out_dir,'sub_'),'--',pi,pp])
    for a,b in (('sub_inj_raw.vtu','inj.vtu'),('sub_prod_raw.vtu','prod.vtu')):
        os.replace(os.path.join(out_dir,a),os.path.join(out_dir,b))
    Qi_node=inj[0]['Q_m3_per_d']/86400.0/B*RHO
    Qp_node=-prod[0]['Q_m3_per_d']/86400.0/B*RHO
    s=sc['wells']['spacing_m']; sch=sc['schedule']; dt_d=sch['dt_days']
    pv_vol=aq['porosity']*B*(max(q['x'] for q in wells)-min(q['x'] for q in wells)+s)*(max(q['y'] for q in wells)-min(q['y'] for q in wells)+s)
    sch['pv_volume_m3']=pv_vol
    # 1 PV = 양수(회수정 총량)로 공극체적만큼 퍼내는 시간 — 스튜디오 시간축(S.pv = 누적 양수 / PV)과 같은 기준.
    # 침출 leach_pv 동안 주입+양수, 이어서 복원 restore_pv 동안 주입을 끄고 양수만 계속한다(지하수 스윕).
    q_prod_total=sum(q['Q_m3_per_d'] for q in prod)
    pv_days=pv_vol/q_prod_total
    t_leach_d=sch['leach_pv']*pv_days
    t_end_d=(sch['leach_pv']+sch.get('restore_pv',0.0))*pv_days
    out_every=max(1,int(round(5.0/dt_d)))
    n_steps=int(math.ceil(t_end_d/dt_d/out_every))*out_every   # 저장 간격(5일)의 배수로 올려 마지막 프레임이 종료 시각에 오게
    t_end_s=n_steps*dt_d*86400.0
    t_leach_s=t_leach_d*86400.0
    tmpl=open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'templates','pattern_hc.prj.tmpl')).read()
    prj=tmpl.format(k=k, phi=aq['porosity'], aL=aq['dispersivity_L_m'], aT=aq['dispersivity_T_m'], Dm=aq['pore_diffusion_m2_s'],
        rho=RHO, mu=MU, p_grad=RHO*G*aq['regional_gradient'], q_inj=Qi_node, q_prod=Qp_node,
        c_inj=sc['chemistry']['lixiviant_conc_mol_m3'], dt=dt_d*86400.0, n_steps=n_steps, t_end=t_end_s,
        t_leach=t_leach_s, t_off=t_leach_s+1.0, t_big=max(t_end_s,t_leach_s)*2+86400.0,
        out_every=out_every)
    open(os.path.join(out_dir,'pattern.prj'),'w').write(prj)
    meta={'scenario':sc,'inj_node_ids':inj_ids,'prod_node_ids':prod_ids,'t_end_days':n_steps*dt_d,'t_leach_days':t_leach_d,
          'DX':DX,'NX':NX,'NY':NY,'pv_days':pv_days,'pv_basis':'production'}
    json.dump(meta,open(os.path.join(out_dir,'case_meta.json'),'w'),indent=1,ensure_ascii=False)
    print(f"case ready: {out_dir}  inj={len(inj)} prod={len(prod)}  1PV={pv_days:.1f} d (양수 기준)  침출 {t_leach_d:.0f} d + 복원 → {meta['t_end_days']:.0f} d  k={k:.3e} m2")

if __name__=='__main__': main(sys.argv[1], sys.argv[2])
