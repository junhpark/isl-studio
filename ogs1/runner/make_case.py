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
        R=n*s*0.92
        for j in range(-n-1,n+2):
            for i in range(-n-2,n+3):
                x=cx+(i+.5*j)*s; y=cy+j*s*0.8660
                if math.hypot(x-cx,y-cy)>R: continue
                add(x,y,Bt if ((i+2*j)%3)==0 else A)
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
    s=sc['wells']['spacing_m']
    pv_vol=aq['porosity']*B*(max(q['x'] for q in wells)-min(q['x'] for q in wells)+s)*(max(q['y'] for q in wells)-min(q['y'] for q in wells)+s)
    sc['schedule']['pv_volume_m3']=pv_vol
    t_end_d=sc['schedule']['leach_pv']*pv_vol/(len(inj)*inj[0]['Q_m3_per_d'])
    n_steps=int(math.ceil(t_end_d/sc['schedule']['dt_days']))
    tmpl=open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'templates','pattern_hc.prj.tmpl')).read()
    prj=tmpl.format(k=k, phi=aq['porosity'], aL=aq['dispersivity_L_m'], aT=aq['dispersivity_T_m'], Dm=aq['pore_diffusion_m2_s'],
        rho=RHO, mu=MU, p_grad=RHO*G*aq['regional_gradient'], q_inj=Qi_node, q_prod=Qp_node,
        c_inj=sc['chemistry']['lixiviant_conc_mol_m3'], dt=sc['schedule']['dt_days']*86400.0, n_steps=n_steps, t_end=n_steps*sc['schedule']['dt_days']*86400.0,
        out_every=max(1,int(round(5.0/sc['schedule']['dt_days']))))
    open(os.path.join(out_dir,'pattern.prj'),'w').write(prj)
    meta={'scenario':sc,'inj_node_ids':inj_ids,'prod_node_ids':prod_ids,'t_end_days':n_steps*sc['schedule']['dt_days'],'DX':DX,'NX':NX,'NY':NY,'pv_days':pv_vol/(len(inj)*inj[0]['Q_m3_per_d'])}
    json.dump(meta,open(os.path.join(out_dir,'case_meta.json'),'w'),indent=1,ensure_ascii=False)
    print(f"case ready: {out_dir}  inj={len(inj)} prod={len(prod)}  t_end={meta['t_end_days']:.0f} d  1PV={meta['pv_days']:.0f} d  k={k:.3e} m2")

if __name__=='__main__': main(sys.argv[1], sys.argv[2])
