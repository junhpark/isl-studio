/* ── 생성 파일 — 손으로 고치지 말 것. browser/build_headless.py 가 isl-studio.html 에서 만든다 ── */
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const rgbStr=()=>'', ramp=()=>[0,0,0], gradientCSS=()=>'';
const uiSection=()=>({appendChild(){}}), uiSlider=()=>({}), uiToggle=()=>({}), uiSegment=()=>({});
const ICON={}, Pop={}, infoBtn=()=>'', setRangeFill=()=>{}, fmtN=v=>String(v);

const Pattern=(function(){
const NX=80, NY=80, B=8, PHI=0.30, N=NX*NY, ID=(i,j)=>i+j*NX;
let DX=3, DY=3, LX=240, LY=240, V=PHI*B*DX*DY;
const RE_MOLAR=0.140, KH=40, UCL=0.03;

const S={ day:0, pv:0, mode:0, clip:1.0,
  K:1.0, grad:0.002, spacing:50, n:2, pattern:'5spot', outerProd:true, Qinj:100, bleed:0.05, conc:250, grade:0.050, KR:0.30, aL:2.0, aT:0.2,
  iac:false, PV_LEACH:5, PV_END:7, ringDist:25,
  inWater:0, prodWater:0, injMass:0, prodLix:0, reRE:0, reagent:0, lsOut:0, totalSr0:1, liquor:0, hist:[], restoring:false,
  alarms:0, escFrac:0, escLeach:0, dtSub:0.1, pvVol:1, pvDays:0, hMin:0, hMax:1, pv50:null, pv80:null, domain:240, qMax:1e9, qEff:100, lossPeak:0, lossNow:0, stepCount:0, useRef:false, refStats:null };

const h=new Float32Array(N), fx=new Float32Array(N), fy=new Float32Array(N), vcx=new Float32Array(N), vcy=new Float32Array(N);
const Dfx=new Float32Array(N), Dfy=new Float32Array(N);   // 면 분산계수 (m²/d), x면·y면
const Cl=new Float32Array(N), Cr=new Float32Array(N), Sr=new Float32Array(N), Sr0=new Float32Array(N);
const ore=new Uint8Array(N), inRing=new Uint8Array(N), dm=new Float32Array(N), dr=new Float32Array(N);
let wells=[], monitors=[], bounds={x0:0,x1:0,y0:0,y1:0}, disp=null, streams=[], oreCells=[], injCells=[], prodCells=[];

function setDomain(L){ LX=LY=L; DX=DY=L/NX; V=PHI*B*DX*DY; S.domain=L; }
const cellOf=(x,y)=>[clamp(Math.floor(x/DX),1,NX-2),clamp(Math.floor(y/DY),1,NY-2)];
function genWells(){
  const s=S.spacing, n=S.n;
  const extent=(S.pattern==='7spot')?n*s*1.84+s:(S.pattern==='line'?Math.max(n*s+s,(2*n)*s*0.6+s):n*s+s);
  setDomain(Math.max(200,extent+2*(S.ringDist+44)));
  const cx=LX/2, cy=LY/2;
  wells=[]; const add=(x,y,t)=>{ const [i,j]=cellOf(x,y); wells.push({x:x,y:y,i:i,j:j,type:t,Q:0}); };
  const A=S.outerProd?'P':'I', Bt=S.outerProd?'I':'P';
  if(S.pattern==='5spot'){ const half=n*s/2;
    for(let i=0;i<=n;i++)for(let j=0;j<=n;j++) add(cx-half+i*s,cy-half+j*s,A);
    for(let i=0;i<n;i++)for(let j=0;j<n;j++) add(cx-half+(i+0.5)*s,cy-half+(j+0.5)*s,Bt);
  } else if(S.pattern==='7spot'){ const R=Math.max(n*s*0.92,s*1.05), pts=[];
    for(let j=-n-1;j<=n+1;j++)for(let i=-n-2;i<=n+2;i++){ const x=cx+(i+0.5*j)*s, y=cy+j*s*0.8660, r=Math.hypot(x-cx,y-cy); if(r>R) continue;
      pts.push({x:x,y:y,r:r,cen:(((i+2*j)%3)+3)%3===0}); }
    /* 육각 격자의 세 부분격자 중 가장 바깥 껍질이 속한 쪽을 A(켜면 회수정)로 — 규모와 무관하게 외곽이 회수정 */
    const rmax=Math.max.apply(null,pts.map(p=>p.r)), shell=pts.filter(p=>p.r>rmax-0.01*s), cenOut=2*shell.filter(p=>p.cen).length>=shell.length;
    pts.forEach(p=>add(p.x,p.y,(p.cen===cenOut)?A:Bt));
  } else { const rows=2*n+1, half=n*s/2, rs=s*0.6;
    for(let j=0;j<rows;j++){ const t=(j%2===0)?A:Bt, yy=cy-(rows-1)*rs/2+j*rs; for(let i=0;i<=n;i++) add(cx-half+i*s,yy,t); } }
  const inj=wells.filter(q=>q.type==='I'), prod=wells.filter(q=>q.type==='P');
  S.qMax=2*Math.PI*S.K*B*15/Math.log(Math.max(S.spacing,1)/0.1);
  S.qEff=Math.min(S.Qinj,S.qMax);
  const totalInjNominal=inj.length*S.qEff;
  const totalProd=Math.max(totalInjNominal*(1+S.bleed),1e-6);
  inj.forEach(q=>q.Q=S.restoring?0:S.qEff); prod.forEach(q=>q.Q=totalProd/Math.max(prod.length,1));
  injCells=inj.map(q=>({c:ID(q.i,q.j),Q:q.Q})); prodCells=prod.map(q=>({c:ID(q.i,q.j),Q:q.Q}));
  let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9; wells.forEach(q=>{x0=Math.min(x0,q.x);x1=Math.max(x1,q.x);y0=Math.min(y0,q.y);y1=Math.max(y1,q.y);});
  bounds={x0:x0-s/2,x1:x1+s/2,y0:y0-s/2,y1:y1+s/2};
  const rx0=bounds.x0-S.ringDist, rx1=bounds.x1+S.ringDist, ry0=bounds.y0-S.ringDist, ry1=bounds.y1+S.ringDist;
  oreCells=[];
  for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){ const x=(i+0.5)*DX,y=(j+0.5)*DY, c=ID(i,j);
    ore[c]=(x>=bounds.x0&&x<=bounds.x1&&y>=bounds.y0&&y<=bounds.y1)?1:0; if(ore[c]) oreCells.push(c);
    inRing[c]=(x>=rx0&&x<=rx1&&y>=ry0&&y<=ry1)?1:0; }
  monitors=[];
  for(let k=0;k<3;k++){ const f=(k+0.5)/3;
    [[rx0+(rx1-rx0)*f,ry0],[rx0+(rx1-rx0)*f,ry1],[rx0,ry0+(ry1-ry0)*f],[rx1,ry0+(ry1-ry0)*f]].forEach(p=>{ const [i,j]=cellOf(clamp(p[0],2,LX-2),clamp(p[1],2,LY-2)); monitors.push({x:p[0],y:p[1],i:i,j:j,streak:0,alarm:false,val:0}); }); }
  S.pvVol=PHI*B*(bounds.x1-bounds.x0)*(bounds.y1-bounds.y0);
  if(!S.restoring) S.pvDays=S.pvVol/totalProd;   /* 1 PV = 양수로 공극체적만큼 퍼내는 시간 (시간축 S.pv 와 같은 기준) */
}
function solveHead(){
  const T=S.K*B, src=new Float32Array(N);
  wells.forEach(q=>{ src[ID(q.i,q.j)]+=(q.type==='I'?q.Q:-q.Q)/(DX*DY); });
  for(let j=0;j<NY;j++)for(let i=0;i<NX;i++) h[ID(i,j)]=-S.grad*(i+0.5)*DX;
  const om=1.82, k2T=DX*DX/T;
  for(let it=0;it<800;it++){ let mx=0;
    for(let j=1;j<NY-1;j++){ const jo=j*NX; for(let i=1;i<NX-1;i++){ const c=jo+i;
      const hn=0.25*(h[c-1]+h[c+1]+h[c-NX]+h[c+NX]+src[c]*k2T), d=hn-h[c]; h[c]+=om*d; const ad=d<0?-d:d; if(ad>mx) mx=ad; } }
    if(mx<2e-5) break; }
  let hmin=1e9,hmax=-1e9;
  for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){ const c=ID(i,j);
    fx[c]=(i<NX-1)?-S.K*(h[c+1]-h[c])/DX:0; fy[c]=(j<NY-1)?-S.K*(h[c+NX]-h[c])/DY:0;
    if(h[c]<hmin) hmin=h[c]; if(h[c]>hmax) hmax=h[c]; }
  S.hMin=hmin; S.hMax=hmax;
  for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){ const c=ID(i,j);
    vcx[c]=0.5*((i>0?fx[c-1]:fx[c])+fx[c])/PHI; vcy[c]=0.5*((j>0?fy[c-NX]:fy[c])+fy[c])/PHI; }
  const wellOut=new Float32Array(N); prodCells.forEach(p=>{wellOut[p.c]+=p.Q;});
  let dtm=1e9;
  for(let j=1;j<NY-1;j++)for(let i=1;i<NX-1;i++){ const c=ID(i,j); let out=wellOut[c];
    if(fx[c]>0) out+=fx[c]*DY*B; if(fx[c-1]<0) out-=fx[c-1]*DY*B; if(fy[c]>0) out+=fy[c]*DX*B; if(fy[c-NX]<0) out-=fy[c-NX]*DX*B;
    if(out>1e-9) dtm=Math.min(dtm,V/out); }
  /* 물리 분산: 면 속도로 Dxx, Dyy (교차항 생략) */
  let Dmax=0; const Dm=1e-9*86400, aLe=Math.max(0,S.aL-0.5*DX), aTe=S.aT;   // 유효 = 목표 − 풍상차분 수치분산(Δx/2)
  for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){ const c=ID(i,j);
    { const vx=fx[c]/PHI, vy=0.5*(vcy[c]+(i<NX-1?vcy[c+1]:vcy[c])), sp=Math.hypot(vx,vy); Dfx[c]=sp>1e-12?(aLe*vx*vx+aTe*vy*vy)/sp+Dm:Dm; }
    { const vy=fy[c]/PHI, vx=0.5*(vcx[c]+(j<NY-1?vcx[c+NX]:vcx[c])), sp=Math.hypot(vx,vy); Dfy[c]=sp>1e-12?(aLe*vy*vy+aTe*vx*vx)/sp+Dm:Dm; }
    if(Dfx[c]>Dmax) Dmax=Dfx[c]; if(Dfy[c]>Dmax) Dmax=Dfy[c]; }
  const dtD=Dmax>1e-12?0.2*DX*DX/Dmax:1e9;
  S.dtSub=clamp(Math.min(0.7*dtm,dtD),0.01,0.6);
  traceStreams();
}
function velAt(x,y){ const gx=clamp(x/DX-0.5,0,NX-1.001), gy=clamp(y/DY-0.5,0,NY-1.001), i=Math.floor(gx), j=Math.floor(gy), a=gx-i, b=gy-j;
  const c00=ID(i,j), c10=ID(Math.min(i+1,NX-1),j), c01=ID(i,Math.min(j+1,NY-1)), c11=ID(Math.min(i+1,NX-1),Math.min(j+1,NY-1));
  return [(vcx[c00]*(1-a)+vcx[c10]*a)*(1-b)+(vcx[c01]*(1-a)+vcx[c11]*a)*b, (vcy[c00]*(1-a)+vcy[c10]*a)*(1-b)+(vcy[c01]*(1-a)+vcy[c11]*a)*b]; }
function traceStreams(){
  streams=[]; const prod=wells.filter(q=>q.type==='P'); let esc=0, tot=0; const ds=Math.max(1.2,DX*0.5);
  wells.filter(q=>q.type==='I'&&q.Q>0).forEach(q=>{
    for(let r=0;r<12;r++){ const th=r/12*Math.PI*2; let x=q.x+2.5*Math.cos(th), y=q.y+2.5*Math.sin(th); const pts=[x,y]; let cls='stag';
      for(let st=0;st<900;st++){ const v=velAt(x,y), sp=Math.hypot(v[0],v[1]); if(sp<1e-7) break;
        const mx=x+v[0]/sp*ds*0.5, my=y+v[1]/sp*ds*0.5, v2=velAt(mx,my), sp2=Math.hypot(v2[0],v2[1]); if(sp2<1e-7) break;
        x+=v2[0]/sp2*ds; y+=v2[1]/sp2*ds; pts.push(x,y);
        if(x<DX||y<DY||x>LX-DX||y>LY-DY){cls='esc';break;}
        let cap=false; for(const p of prod){ if(Math.hypot(p.x-x,p.y-y)<Math.max(2.6,DX*0.8)){cap=true;break;} } if(cap){cls='cap';break;} }
      streams.push({pts:pts,cls:cls}); tot++; if(cls==='esc') esc++; } });
  S.escFrac=tot?esc/tot:0; if(!S.restoring) S.escLeach=S.escFrac;
}
let sampleClock=0, acc=0;
function reset(){
  S.day=0; S.pv=0; S.inWater=S.prodWater=S.injMass=S.prodLix=S.reRE=S.reagent=S.lsOut=0; S.liquor=0; S.hist=[]; S.restoring=false; S.alarms=0; S.pv50=null; S.pv80=null; S.lossPeak=0; S.lossNow=0; S.stepCount=0;
  genWells(); solveHead();
  const molPerM3=(S.grade/100)*1900/0.330*2; let tot=0;
  for(let c=0;c<N;c++){ Cl[c]=0; Cr[c]=0; const s=ore[c]?molPerM3*B*DX*DY:0; Sr[c]=s; Sr0[c]=s; tot+=s; }
  S.totalSr0=Math.max(tot,1e-9); monitors.forEach(m=>{m.streak=0;m.alarm=false;m.val=0;});
  if(disp) disp.fill(0); sampleClock=0; acc=0; rebuildBlock(); rebuildWellVisuals();
}
function step(dt){
  const cInj=S.restoring?0:S.conc, KR=S.KR, fB=DY*B*dt, fB2=DX*B*dt;
  for(let n=0;n<oreCells.length;n++){ const c=oreCells[n]; if(Sr[c]<=0||Cl[c]<=1) continue;
    let r=KR*Sr[c]*(Cl[c]/(KH+Cl[c]))*dt; const cap=Cl[c]*V/1.5; if(r>Sr[c]) r=Sr[c]; if(r>cap) r=cap; Sr[c]-=r; Cr[c]+=r/V; Cl[c]-=1.5*r/V; }
  dm.fill(0); dr.fill(0);
  for(let j=1;j<NY-1;j++){ const jo=j*NX; for(let i=1;i<NX-1;i++){ const c=jo+i;
    if(i<NX-2){ const F=fx[c]*fB; if(F>0){ const a=F*Cl[c], b=F*Cr[c]; dm[c]-=a; dm[c+1]+=a; dr[c]-=b; dr[c+1]+=b; } else { const a=F*Cl[c+1], b=F*Cr[c+1]; dm[c]-=a; dm[c+1]+=a; dr[c]-=b; dr[c+1]+=b; } }
    if(j<NY-2){ const F=fy[c]*fB2; if(F>0){ const a=F*Cl[c], b=F*Cr[c]; dm[c]-=a; dm[c+NX]+=a; dr[c]-=b; dr[c+NX]+=b; } else { const a=F*Cl[c+NX], b=F*Cr[c+NX]; dm[c]-=a; dm[c+NX]+=a; dr[c]-=b; dr[c+NX]+=b; } } } }
  /* 분산 (명시적, 면 중심차분) */
  if(S.aL>0.5*DX||S.aT>0){ const gx=PHI*DY*B*dt/DX, gy=PHI*DX*B*dt/DY;
    for(let j=1;j<NY-1;j++){ const jo=j*NX; for(let i=1;i<NX-1;i++){ const c=jo+i;
      if(i<NX-2){ const Jl=Dfx[c]*(Cl[c+1]-Cl[c])*gx, Jr=Dfx[c]*(Cr[c+1]-Cr[c])*gx; dm[c]+=Jl; dm[c+1]-=Jl; dr[c]+=Jr; dr[c+1]-=Jr; }
      if(j<NY-2){ const Jl=Dfy[c]*(Cl[c+NX]-Cl[c])*gy, Jr=Dfy[c]*(Cr[c+NX]-Cr[c])*gy; dm[c]+=Jl; dm[c+NX]-=Jl; dr[c]+=Jr; dr[c+NX]-=Jr; } } } }
  for(let j=1;j<NY-1;j++){ let c=ID(1,j), F=-fx[ID(0,j)]*fB; if(F>0){ dm[c]-=F*Cl[c]; dr[c]-=F*Cr[c]; S.lsOut+=F*Cl[c]; }
    c=ID(NX-2,j); F=fx[c]*fB; if(F>0){ dm[c]-=F*Cl[c]; dr[c]-=F*Cr[c]; S.lsOut+=F*Cl[c]; } }
  for(let i=1;i<NX-1;i++){ let c=ID(i,1), F=-fy[ID(i,0)]*fB2; if(F>0){ dm[c]-=F*Cl[c]; dr[c]-=F*Cr[c]; S.lsOut+=F*Cl[c]; }
    c=ID(i,NY-2); F=fy[c]*fB2; if(F>0){ dm[c]-=F*Cl[c]; dr[c]-=F*Cr[c]; S.lsOut+=F*Cl[c]; } }
  let rw=0, rr=0;
  if(!S.restoring) for(let n=0;n<injCells.length;n++){ const q=injCells[n], F=q.Q*dt; dm[q.c]+=F*cInj; S.inWater+=F; S.injMass+=F*cInj; S.reagent+=F*cInj*0.132/1000; }
  for(let n=0;n<prodCells.length;n++){ const q=prodCells[n], c=q.c, F=q.Q*dt; dm[c]-=F*Cl[c]; dr[c]-=F*Cr[c]; rw+=F; rr+=F*Cr[c]; S.prodWater+=F; S.prodLix+=F*Cl[c]; }
  for(let c=0;c<N;c++){ let a=Cl[c]+dm[c]/V; Cl[c]=a<0?0:a; let b=Cr[c]+dr[c]/V; Cr[c]=b<0?0:b; }
  S.reRE+=rr; S.liquor= rw>1e-9?(rr/rw)*RE_MOLAR:S.liquor*0.95;
  S.day+=dt; S.pv=S.prodWater/S.pvVol; if((++S.stepCount)%8===0) trackLoss();
  const rf=S.reRE/S.totalSr0; if(S.pv50===null&&rf>=0.5) S.pv50=S.pv; if(S.pv80===null&&rf>=0.8) S.pv80=S.pv;
  sampleClock+=dt; if(sampleClock>=2){ sampleClock=0; S.alarms=0;
    for(let n=0;n<monitors.length;n++){ const m=monitors[n]; m.val=Cl[ID(m.i,m.j)]/Math.max(S.conc,1); if(m.val>UCL) m.streak++; else m.streak=0; m.alarm=m.streak>=2; if(m.alarm) S.alarms++; } }
  if(!S.restoring&&S.pv>=S.PV_LEACH){ S.restoring=true; genWells(); solveHead(); rebuildWellVisuals(); }
}
function outsideOreMass(){ let m=0; for(let c=0;c<N;c++) if(!ore[c]) m+=Cl[c]; return m*V; }
function lossPct(){ return S.injMass>0?(S.lsOut+outsideOreMass())/S.injMass*100:0; }
function meanLiquor(){ return S.prodWater>0?S.reRE/S.prodWater*RE_MOLAR:0; }
function trackLoss(){ S.lossNow=lossPct(); if(S.lossNow>S.lossPeak) S.lossPeak=S.lossNow; }

/* ── 3D ── */
let scene, camera, root, blockGroup, labelGroup, topCv, topCtx, topTex, streamLines, wellGroup, monMeshes=[], builtDomain=-1;
let clipPlane, faceCv, faceCtx, faceTex, faceMesh; const HF=50, HPZ=15;   // 절개면 높이(m), 정수두 기준면 (대수층 상면 +15 m)
const cam={a:-0.55,b:1.05,r:330};
function build3D(){
  scene=new THREE.Scene(); scene.background=new THREE.Color(0x0E1014);
  camera=new THREE.PerspectiveCamera(42,1,1,1600);
  root=new THREE.Group(); scene.add(root);
  scene.add(new THREE.AmbientLight(0xffffff,0.6));
  const dl=new THREE.DirectionalLight(0xfff3e0,0.85); dl.position.set(-120,220,140); scene.add(dl);
  clipPlane=new THREE.Plane(new THREE.Vector3(0,0,-1),0);
  topCv=document.createElement('canvas'); topCv.width=400; topCv.height=400; topCtx=topCv.getContext('2d'); topTex=new THREE.CanvasTexture(topCv);
  faceCv=document.createElement('canvas'); faceCv.width=640; faceCv.height=112; faceCtx=faceCv.getContext('2d'); faceTex=new THREE.CanvasTexture(faceCv);
  faceMesh=new THREE.Mesh(new THREE.PlaneBufferGeometry(10,10),new THREE.MeshBasicMaterial({map:faceTex,side:THREE.DoubleSide,transparent:true})); faceMesh.renderOrder=3; root.add(faceMesh);
  blockGroup=new THREE.Group(); root.add(blockGroup);
  wellGroup=new THREE.Group(); root.add(wellGroup);
  labelGroup=new THREE.Group(); root.add(labelGroup);
  streamLines=new THREE.LineSegments(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:0.9,clippingPlanes:[clipPlane]})); streamLines.renderOrder=2; root.add(streamLines);
  disp=new Float32Array(N); rebuildBlock(); rebuildWellVisuals(); applyClip();
}
function applyClip(){ if(!clipPlane) return; clipPlane.constant=S.clip*LY-LY/2; faceMesh.position.z=S.clip*LY-0.05; faceMesh.visible=S.clip<0.99; }
function rebuildBlock(){
  if(!blockGroup||builtDomain===LX) return; builtDomain=LX;
  while(blockGroup.children.length) blockGroup.remove(blockGroup.children[0]);
  while(labelGroup.children.length) labelGroup.remove(labelGroup.children[0]);
  root.position.set(-LX/2,-4,-LY/2);
  const cp=[clipPlane];
  const lower=new THREE.Mesh(new THREE.BoxBufferGeometry(LX,12,LY),new THREE.MeshLambertMaterial({color:0x3A414B,clippingPlanes:cp})); lower.position.set(LX/2,-6,LY/2); blockGroup.add(lower);
  const side=new THREE.MeshLambertMaterial({color:0x8E7A55,clippingPlanes:cp});
  const aq=new THREE.Mesh(new THREE.BoxBufferGeometry(LX,B,LY),[side,side,new THREE.MeshBasicMaterial({map:topTex,clippingPlanes:cp}),side,side,side]); aq.position.set(LX/2,B/2,LY/2); blockGroup.add(aq);
  const capM=new THREE.MeshLambertMaterial({color:0x2F3540,clippingPlanes:cp}); const RW=Math.max(14,LX*0.07), RH=6;
  [[LX/2,RW/2,LX,RW],[LX/2,LY-RW/2,LX,RW],[RW/2,LY/2,RW,LY-2*RW],[LX-RW/2,LY/2,RW,LY-2*RW]].forEach(p=>{ const m=new THREE.Mesh(new THREE.BoxBufferGeometry(p[2],RH,p[3]),capM); m.position.set(p[0],B+RH/2,p[1]); blockGroup.add(m); });
  /* 절개면 크기 갱신 */
  faceCv.height=Math.max(80,Math.round(640*HF/LX)); faceMesh.geometry.dispose(); faceMesh.geometry=new THREE.PlaneBufferGeometry(LX,HF); faceMesh.position.set(LX/2,-12+HF/2,0);
  cam.r=LX*1.38; applyClip();
}
function coneHead(type,x,y,r){
  const g=new THREE.ConeBufferGeometry(r,r*2.4,12), c=type==='I'?0x4FC3E8:0xE0A64A;
  const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({color:c,emissive:new THREE.Color(c).multiplyScalar(0.35),clippingPlanes:[clipPlane]}));
  if(type==='I') m.rotation.x=Math.PI;               // 주입정: 꼭짓점 아래(지중으로)
  m.position.set(x,B+11,y); return m;
}
function rebuildWellVisuals(){
  if(!wellGroup) return;
  while(wellGroup.children.length) wellGroup.remove(wellGroup.children[0]); monMeshes=[];
  const cp=[clipPlane], pts=[],col=[]; const cI=[0.31,0.76,0.91], cP=[0.88,0.65,0.29], cOff=[0.40,0.42,0.46];
  const r=Math.max(2.0,LX*0.010); let firstI=null, firstP=null;
  wells.forEach(q=>{ const c=q.type==='I'?(q.Q>0?cI:cOff):cP; pts.push(q.x,-2,q.y,q.x,B+11,q.y); col.push(c[0],c[1],c[2],c[0],c[1],c[2]);
    const head=coneHead(q.type,q.x,q.y,r); if(q.type==='I'&&q.Q<=0) head.material.color.setRGB(0.40,0.42,0.46); wellGroup.add(head);
    if(q.type==='I'&&!firstI) firstI=q; if(q.type==='P'&&!firstP) firstP=q; });
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3)); g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  wellGroup.add(new THREE.LineSegments(g,new THREE.LineBasicMaterial({vertexColors:true,clippingPlanes:cp})));
  monitors.forEach(m=>{ const mesh=new THREE.Mesh(new THREE.CylinderBufferGeometry(1.4,1.4,2.2,10),new THREE.MeshLambertMaterial({color:0x8B9099,clippingPlanes:cp})); mesh.position.set(m.x,B+7.5,m.y); wellGroup.add(mesh); monMeshes.push(mesh); });
  const sp=[],sc=[]; const CC={cap:[0.30,0.80,0.90],esc:[0.92,0.35,0.30],stag:[0.45,0.47,0.52]};
  streams.forEach(s=>{ const c=CC[s.cls]; for(let n=0;n+3<s.pts.length;n+=2){ sp.push(s.pts[n],B+0.5,s.pts[n+1],s.pts[n+2],B+0.5,s.pts[n+3]); sc.push(c[0],c[1],c[2],c[0],c[1],c[2]); } });
  const sg=new THREE.BufferGeometry(); sg.setAttribute('position',new THREE.Float32BufferAttribute(sp,3)); sg.setAttribute('color',new THREE.Float32BufferAttribute(sc,3));
  streamLines.geometry.dispose(); streamLines.geometry=sg;
}
/* 절개 종단면: 차수층 사이의 대수층, 수두면, 정호 스크린 */
function drawSection(){
  if(!faceCv||S.clip>=0.99) return;
  const j=clamp(Math.round(S.clip*NY)-1,0,NY-1), W=faceCv.width, H=faceCv.height, ctx=faceCtx, key=MODES[S.mode].key;
  const yOf=yw=>H-((yw+12)/HF)*H, cw=W/NX;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#3A414B'; ctx.fillRect(0,yOf(0),W,H-yOf(0));
  for(let i=0;i<NX;i++){ const c=ID(i,j); ctx.fillStyle=ore[c]?'#8E7A55':'#7A6947'; ctx.fillRect(i*cw,yOf(B),cw+0.7,yOf(0)-yOf(B));
    const v=disp[c]; if(v>0.012&&S.mode!==3){ const rg=ramp(key,v); ctx.fillStyle=rgbStr(rg[0],rg[1],rg[2],0.12+0.85*v); ctx.fillRect(i*cw,yOf(B),cw+0.7,yOf(0)-yOf(B)); } }
  ctx.fillStyle='#2F3540'; ctx.fillRect(0,yOf(B+6),W,yOf(B)-yOf(B+6));
  /* 수두면 (피압면): 대수층 상면 +15 m 기준 + 상대수두 */
  ctx.strokeStyle='#5FD8F0'; ctx.lineWidth=2; ctx.beginPath();
  for(let i=0;i<NX;i++){ const Y=yOf(B+HPZ+h[ID(i,j)]), X=(i+0.5)*cw; i===0?ctx.moveTo(X,Y):ctx.lineTo(X,Y); } ctx.stroke();
  ctx.strokeStyle='rgba(95,216,240,0.35)'; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.moveTo(0,yOf(B+HPZ)); ctx.lineTo(W,yOf(B+HPZ)); ctx.stroke(); ctx.setLineDash([]);
  /* 정호 (절개선 근처만) */
  wells.forEach(q=>{ if(Math.abs(q.y-(j+0.5)*DY)>DY*0.9) return; const X=q.x/LX*W, col=q.type==='I'?(q.Q>0?'#4FC3E8':'#6E7480'):'#E0A64A';
    ctx.strokeStyle=col; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(X,yOf(B+11)); ctx.lineTo(X,yOf(0)); ctx.stroke();
    ctx.lineWidth=6; ctx.beginPath(); ctx.moveTo(X,yOf(B)); ctx.lineTo(X,yOf(0)); ctx.stroke();
    ctx.fillStyle=col; ctx.beginPath(); const ay=yOf(B+9); if(q.type==='I'){ ctx.moveTo(X-5,ay-6); ctx.lineTo(X+5,ay-6); ctx.lineTo(X,ay+4); } else { ctx.moveTo(X-5,ay+4); ctx.lineTo(X+5,ay+4); ctx.lineTo(X,ay-6); } ctx.closePath(); ctx.fill(); });
  monitors.forEach(m=>{ if(Math.abs(m.y-(j+0.5)*DY)>DY*0.9) return; const X=m.x/LX*W; ctx.strokeStyle=m.alarm?'#E2574C':'#8B9099'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(X,yOf(B+9)); ctx.lineTo(X,yOf(1)); ctx.stroke(); });
  /* 라벨 */
  faceTex.needsUpdate=true;
}
/* ── OGS 참조해 연동 ── */
let REF=null;
function loadReference(meta,buf){ if(meta.nx!==NX||meta.ny!==NY){ alert('격자 크기 불일치: 참조해 '+meta.nx+'×'+meta.ny+' vs 브라우저 '+NX+'×'+NY); return false; }
  if(Math.abs(meta.domain_m-LX)>1e-6){ alert('도메인 크기 불일치: 참조해 '+meta.domain_m+' m vs 브라우저 '+LX.toFixed(1)+' m. 같은 시나리오로 다시 계산하십시오.'); return false; }
  if(meta.mass_balance){ const r=meta.mass_balance.retained_over_injected, pc=meta.mass_balance.producer_c_max; const rl=r[r.length-1], pl=pc[pc.length-1];
    if(rl>0.95||pl>1.2) alert('주의: 이 참조해는 물질수지가 의심스럽습니다.\n잔존/주입 = '+rl.toFixed(2)+' (파과 후 0.95 미만이어야 함), 회수정 최대 농도 = '+pl.toFixed(2)+' (1.2 이하여야 함).\n회수정이 용질을 빼지 않는 결함(FullUpwind 또는 보존형)일 수 있습니다. 불러오기는 진행합니다.'); }
  else alert('참고: 이 참조해에는 물질수지 정보가 없습니다(구버전 run_case.py). 결과를 신뢰하기 전에 잔존/주입 비를 확인하십시오.');
  REF={meta:meta,arr:new Float32Array(buf)}; S.useRef=true; return true; }
/* 참조해 필드 해제: v1 = Float32 [T][2][N] 그대로, v2 = gzip(수두 f32[N] + 추적자 u16[T][N]) → v1 배열로 펼침 */
async function decodeFields(meta,raw){
  const ff=meta.fields_format||{}; if(ff.version!==2) return raw;
  const N=meta.nx*meta.ny, T=meta.times_days.length, want=N*4+T*N*2, u8=new Uint8Array(raw,0,Math.min(2,raw.byteLength));
  let bytes=raw;
  /* 서버가 Content-Encoding: gzip 으로 보내면 브라우저가 이미 풀어 준다 — 크기가 아직 다르고 gzip 표지(1f 8b)가 있을 때만 해제 */
  if(ff.gzip!==false&&raw.byteLength!==want&&u8[0]===0x1f&&u8[1]===0x8b){
    if(typeof DecompressionStream==='undefined') throw new Error('이 브라우저는 gzip 해제(DecompressionStream)를 지원하지 않습니다. 최신 Chrome·Edge·Firefox·Safari를 쓰십시오');
    bytes=await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer(); }
  if(bytes.byteLength!==want) throw new Error('fields 크기가 results.json 과 맞지 않습니다');
  const head=new Float32Array(bytes,0,N), tr=new Uint16Array(bytes,N*4,T*N), out=new Float32Array(T*2*N), sc=ff.tracer_scale, of=ff.tracer_offset;
  for(let k=0;k<T;k++){ out.set(head,k*2*N); const o=(k*2+1)*N, b=k*N; for(let c=0;c<N;c++) out[o+c]=tr[b+c]*sc+of; }
  return out.buffer;
}
function refFrame(day){ const t=REF.meta.times_days; let k=0; while(k<t.length-1&&t[k+1]<=day) k++; return k; }
function refField(k,f){ const off=(k*2+f)*N; return REF.arr.subarray(off,off+N); }
function refCompare(){ if(!REF) return null; const k=refFrame(S.day), hh=refField(k,0), cc=refField(k,1);
  let se=0, n=0, sx=0, sy=0, sxx=0, syy=0, sxy=0;
  for(let c=0;c<N;c++){ const d=h[c]-hh[c]; se+=d*d; n++; const x=Cl[c]/Math.max(S.conc,1), y=cc[c]; sx+=x; sy+=y; sxx+=x*x; syy+=y*y; sxy+=x*y; }
  const r=(n*sxy-sx*sy)/Math.sqrt(Math.max((n*sxx-sx*sx)*(n*syy-sy*sy),1e-12));
  return {frameDay:REF.meta.times_days[k], hRms:Math.sqrt(se/n), cR2:r*r, sweep:REF.meta.sweep_frac[k], outside:REF.meta.tracer_outside_ore_frac[k]}; }
function exportScenario(){
  const sc={schema_version:'0.1',mode:'pattern',
    grid:{nx:NX,ny:NY,domain_m:+LX.toFixed(4),aquifer_thickness_m:B},
    aquifer:{K_m_per_d:S.K,porosity:PHI,regional_gradient:S.grad,dispersivity_L_m:S.aL,dispersivity_T_m:S.aT,pore_diffusion_m2_s:1e-9},
    wells:{pattern:S.pattern,spacing_m:S.spacing,n:S.n,outer_producers:S.outerProd,Q_inj_m3_per_d:S.qEff,bleed:S.bleed,
      list:wells.map(q=>({x:+q.x.toFixed(3),y:+q.y.toFixed(3),type:q.type,Q_m3_per_d:q.type==='I'?S.qEff:+q.Q.toFixed(4)}))},
    chemistry:{lixiviant_conc_mol_m3:S.conc,tracer_only:true},
    schedule:{leach_pv:S.PV_LEACH,restore_pv:S.PV_END-S.PV_LEACH,pv_volume_m3:+S.pvVol.toFixed(1),dt_days:1.0},
    monitoring:{ring_offset_m:S.ringDist,ucl_fraction:UCL},
    provenance:{exported_from:'isl-studio pattern tab',date:new Date().toISOString().slice(0,10)}};
  download('scenario.json',JSON.stringify(sc,null,1)); }
function exportSnapshot(){ download('browser_snapshot_day'+Math.round(S.day)+'.json',JSON.stringify({day:S.day,nx:NX,ny:NY,DX:DX,domain_m:LX,conc:S.conc,h:Array.from(h),Cl:Array.from(Cl)})); }
function download(name,text){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type:'application/json'})); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); }

const MODES=[{key:'lix',label:'침출액',lo:'없음',hi:'주입 농도',title:'침출액 (추적자)'},
             {key:'liquor',label:'모액',lo:'0 g/L',hi:'약 3 g/L',title:'모액 (용액 중 회수 대상)'},
             {key:'prog',label:'침출 진행도',lo:'미침출',hi:'완전 침출',title:'침출 진행도 (sweep)'},
             {key:'head',label:'수두',lo:'낮음',hi:'높음',title:'수두 (압력면)'}];
function fieldValue(c,m){ if(m===0) return Math.sqrt(Math.min(1,Cl[c]/Math.max(S.conc,1))); if(m===1) return Math.sqrt(Math.min(1,Cr[c]*RE_MOLAR/3.0));
  if(m===2) return Sr0[c]>0?1-Sr[c]/Sr0[c]:0; return (h[c]-S.hMin)/Math.max(S.hMax-S.hMin,1e-9); }
function tick(){
  const key=MODES[S.mode].key;
  if(S.useRef&&REF){ const k=refFrame(S.day), hh=refField(k,0), cc=refField(k,1); let mn=1e9,mx=-1e9; for(let c=0;c<N;c++){ if(hh[c]<mn) mn=hh[c]; if(hh[c]>mx) mx=hh[c]; }
    for(let c=0;c<N;c++){ const t=(S.mode===3)?(hh[c]-mn)/Math.max(mx-mn,1e-9):Math.sqrt(clamp(cc[c],0,1)); disp[c]+=(t-disp[c])*0.2; }
    S.refStats=refCompare(); }
  else { for(let c=0;c<N;c++){ const t=clamp(fieldValue(c,S.mode),0,1); disp[c]+=(t-disp[c])*0.2; } S.refStats=REF?refCompare():null; }
  const ctx=topCtx, W=topCv.width, H=topCv.height, cw=W/NX, ch=H/NY;
  ctx.fillStyle='#7A6947'; ctx.fillRect(0,0,W,H);
  for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){ const c=ID(i,j), v=disp[c]; if(ore[c]){ ctx.fillStyle='#8E7A55'; ctx.fillRect(i*cw,H-(j+1)*ch,cw+0.6,ch+0.6); }
    if(v>0.012||S.mode===3){ const rg=ramp(key,v); ctx.fillStyle=rgbStr(rg[0],rg[1],rg[2],S.mode===3?0.75:(0.10+0.85*v)); ctx.fillRect(i*cw,H-(j+1)*ch,cw+0.6,ch+0.6); } }
  if(S.mode===3){ ctx.strokeStyle='rgba(20,22,28,0.55)'; ctx.lineWidth=1; const lv=14, rng=Math.max(S.hMax-S.hMin,1e-9);
    for(let j=0;j<NY-1;j++)for(let i=0;i<NX-1;i++){ const a=(h[ID(i,j)]-S.hMin)/rng*lv, b=(h[ID(i+1,j)]-S.hMin)/rng*lv, c2=(h[ID(i,j+1)]-S.hMin)/rng*lv;
      if(Math.floor(a)!==Math.floor(b)){ ctx.beginPath(); ctx.moveTo((i+1)*cw,H-j*ch); ctx.lineTo((i+1)*cw,H-(j+1)*ch); ctx.stroke(); }
      if(Math.floor(a)!==Math.floor(c2)){ ctx.beginPath(); ctx.moveTo(i*cw,H-(j+1)*ch); ctx.lineTo((i+1)*cw,H-(j+1)*ch); ctx.stroke(); } } }
  ctx.strokeStyle='rgba(240,214,150,0.55)'; ctx.lineWidth=1.2; ctx.strokeRect(bounds.x0/LX*W,H-bounds.y1/LY*H,(bounds.x1-bounds.x0)/LX*W,(bounds.y1-bounds.y0)/LY*H);
  const rd=S.ringDist; ctx.strokeStyle='rgba(200,205,215,0.55)'; ctx.setLineDash([6,5]); ctx.strokeRect((bounds.x0-rd)/LX*W,H-(bounds.y1+rd)/LY*H,(bounds.x1-bounds.x0+2*rd)/LX*W,(bounds.y1-bounds.y0+2*rd)/LY*H); ctx.setLineDash([]);
  topTex.needsUpdate=true;
  monitors.forEach((m,n)=>{ if(monMeshes[n]) monMeshes[n].material.color.setHex(m.alarm?0xE2574C:0x8B9099); });
}
function advance(nSub){ for(let n=0;n<nSub;n++){ if(S.pv>=S.PV_END) break; step(S.dtSub); acc+=S.dtSub;
  if(acc>=2.0){ acc=0; S.hist.push({pv:S.pv,d:S.day,rf:S.reRE/S.totalSr0*100,ls:S.lossNow,cc:S.liquor,al:S.alarms}); } } }
function rebuild(){ const p=S.restoring; S.restoring=false; genWells(); if(p){ S.restoring=true; genWells(); } solveHead(); rebuildWellVisuals(); if(api.onLegend) api.onLegend(); }
function buildControls(rootEl){
  rootEl.innerHTML=''; const C={};
  let sec=uiSection(rootEl,'정호 배치','정호 간격이 가장 큰 설계 변수입니다. Honeymoon(2026)은 좁은 패턴 대신 50–60 m 광역 간격을 시험 중입니다.');
  C.pat=uiSegment(sec,{val:'5spot',options:[{v:'5spot',label:'5-spot'},{v:'7spot',label:'7-spot'},{v:'line',label:'Line drive'}],set:v=>{S.pattern=v; reset();}});
  C.spacing=uiSlider(sec,{label:'정호 간격',unit:'m',min:20,max:80,val:50,step:5,fmt:v=>String(v),set:v=>{S.spacing=v; reset();},
    info:'인접 정호 사이 거리. 문헌 범위 15–61 m.',src:'SME Mining Reference Handbook Ch.19 · Boss Energy Honeymoon EKT1 60 m, EKT2 50 m (2026)'});
  C.n=uiSlider(sec,{label:'패턴 규모',unit:'',min:1,max:3,val:2,fmt:v=>v+'×'+v,set:v=>{S.n=v; reset();},
    info:'패턴 반복 수. 5-spot 2×2이면 주입정 4공 · 회수정 9공.'});
  C.outer=uiToggle(sec,{label:'외곽 정호 = 회수정',info:'켜면 회수정이 바깥을 둘러쌉니다(Florence Copper 방식, 5-spot 2×2에서 주입 4 : 회수 9). 끄면 주입정이 바깥에 와서 봉쇄가 어려워집니다.',checked:true,set:v=>{S.outerProd=v; reset();}});
  sec=uiSection(rootEl,'운전 조건','회수량을 주입량보다 몇 % 많게(bleed) 유지하면 패턴 안쪽으로 동수경사가 생겨 침출액이 갇힙니다. 음수로 내리면 주입이 양수를 초과해 밖으로 밀려납니다.');
  C.Q=uiSlider(sec,{label:'주입량 / 정호',unit:'m³/d',min:30,max:300,val:100,step:10,fmt:v=>String(v),set:v=>{S.Qinj=v; rebuild();},
    info:'주입정 1공당 유량. 투수계수로 정해지는 Thiem 상한을 넘으면 자동으로 잘립니다(상세 지표에 표시).'});
  C.bleed=uiSlider(sec,{label:'Bleed',unit:'%',min:-15,max:15,val:5,fmt:v=>(v>0?'+':'')+v,set:v=>{S.bleed=v/100; rebuild();},
    info:'총 양수량 = 총 주입량 × (1 + bleed). 수 % 수준이 표준 운영이며, 음수면 봉쇄가 깨집니다.',src:'IAEA Nuclear Energy Series NF-T-1.4 (2016)'});
  C.conc=uiSlider(sec,{label:'침출제 농도',unit:'mol/L',min:5,max:50,val:25,fmt:v=>(v/100).toFixed(2),set:v=>{S.conc=v*10}});
  C.grade=uiSlider(sec,{label:'교환성 품위',unit:'wt%',min:10,max:110,val:50,fmt:v=>(v/1000).toFixed(3),set:v=>{S.grade=v/1000; reset();},
    info:'OGS 참조해와 비교할 때는 최소로 내려 화학 반응을 끄십시오. 참조해는 반응 없는 추적자만 풀었습니다.'});
  sec=uiSection(rootEl,'대수층','IAEA 경험칙 — 투수계수 1 m/d 이상이면 유리하고, 0.1 m/d 정도 이하에서는 ISL이 성립하지 않습니다.');
  const kSl=C.K=uiSlider(sec,{label:'투수계수',unit:'m/d',min:-130,max:70,val:0,fmt:v=>Math.pow(10,v/100).toFixed(2),set:v=>{S.K=Math.pow(10,v/100); rebuild();},
    info:'로그 눈금 슬라이더(0.05–5 m/d). 낮추면 같은 주입량을 넣기 위한 수두 상승이 커지고 주입량 상한이 줄어듭니다.',src:'IAEA NF-T-1.4 경험칙'});
  C.grad=uiSlider(sec,{label:'지역 동수경사',unit:'',min:0,max:20,val:2,fmt:v=>(v/1000).toFixed(3),set:v=>{S.grad=v/1000; rebuild();},
    info:'패턴과 무관한 배경 지하수 흐름의 경사(−x 방향). 클수록 봉쇄에 더 큰 bleed가 필요합니다.'});
  C.aL=uiSlider(sec,{label:'종분산도 αL',unit:'m',min:0,max:50,val:20,fmt:v=>(v/10).toFixed(1),set:v=>{S.aL=v/10; rebuild();},
    info:'목표값입니다. 브라우저 격자는 풍상차분 수치분산(≈Δx/2, 약 1.8 m)을 이미 갖고 있어 목표에서 그만큼 뺀 물리 분산만 더합니다. 내보내는 scenario.json에는 목표값이 실립니다.',src:'참조해 기본 αL 2 m, αT 0.2 m'});
  C.aT=uiSlider(sec,{label:'횡분산도 αT',unit:'m',min:0,max:10,val:2,fmt:v=>(v/10).toFixed(1),set:v=>{S.aT=v/10; rebuild();}});
  const og=uiSection(rootEl,'OGS 참조해','저장소에 OpenGeoSys 참조해 12개(3 패턴 × 간격 30·50 m × bleed +5·−10 %)가 들어 있습니다. 목록에서 고르면 화면 설정을 그 케이스에 맞추고 참조해를 겹칩니다. 다른 시나리오는 scenario.json을 내보내 OGS로 계산한 뒤 파일을 직접 선택하십시오.');
  const sel=document.createElement('select'); sel.className='refsel'; sel.setAttribute('aria-label','참조해 케이스');
  sel.innerHTML='<option>목록 불러오는 중…</option>'; sel.disabled=true; og.appendChild(sel);
  const bar=document.createElement('div'); bar.className='btnrow';
  const mk=(t,f,cls,ic,tip)=>{ const b=document.createElement('button'); b.type='button'; b.className='btn'+(cls?' '+cls:''); b.innerHTML=(ic||'')+'<span>'+t+'</span>';
    if(tip){ b.dataset.infoT=t; b.dataset.info=tip; } b.addEventListener('click',f); bar.appendChild(b); return b; };
  let CASES=[];
  const bLoad=mk('참조해 불러오기',async()=>{
    const c=CASES[sel.selectedIndex]; if(!c) return;
    const sp=bLoad.querySelector('span'), was=sp.textContent; sp.textContent='불러오는 중…'; bLoad.disabled=true;
    try{
      applyCase(c.settings);
      const [r1,r2]=await Promise.all([fetch(c.path+'/results.json'),fetch(c.path+'/'+c.fields_file)]);
      if(!r1.ok||!r2.ok) throw new Error('HTTP '+r1.status+'/'+r2.status);
      const meta=await r1.json(), buf=await decodeFields(meta,await r2.arrayBuffer());
      if(loadReference(meta,buf)){ refTog.checked=true; fname.textContent=c.label+' · '+(c.bytes/1e6).toFixed(1)+' MB'; }
    }catch(e){
      alert('참조해를 가져오지 못했습니다 ('+e.message+').\n\n이 기능은 저장소 폴더 구조가 그대로인 상태에서 웹으로 열었을 때 동작합니다(GitHub Pages 등).\nHTML 파일만 따로 열었다면 "파일 선택…"으로 results.json 과 fields 파일을 직접 고르십시오.');
    }finally{ sp.textContent=was; bLoad.disabled=CASES.length===0; }
  },'primary',ICON.layers,'고른 케이스의 설정(패턴·간격·bleed·주입량·투수계수·분산도 등)으로 화면을 맞추고, 교환성 품위는 최소로 내려 화학 반응을 끈 뒤 OGS 결과를 겹칩니다.');
  bLoad.disabled=true;
  mk('scenario.json',exportScenario,'',ICON.download,'현재 설정을 계약 v0.1 형식으로 저장합니다. ogs1/runner/make_case.py 의 입력입니다.');
  mk('스냅샷',exportSnapshot,'',ICON.download,'현재 시점의 수두·추적자 배열을 저장합니다. ogs1/runner/compare.py 로 수치 비교할 때 씁니다.');
  og.appendChild(bar);
  const pick=document.createElement('div'); pick.className='filepick';
  pick.innerHTML='<label class="btn">'+ICON.file+'<span>파일 선택…</span><input type="file" multiple accept=".json,.bin,.gz" hidden></label><span class="fname">results.json + fields 파일</span>';
  og.appendChild(pick);
  const fi=pick.querySelector('input'), fname=pick.querySelector('.fname');
  const refTog=uiToggle(og,{label:'OGS 참조해 표시',info:'켜면 침출액·수두 모드가 OGS 결과를 그립니다. 브라우저 계산은 그대로 진행되어 상세 지표에서 두 값(수두 RMS 차, 추적자 R² 등)을 비교합니다.',
    set:v=>{ if(v&&!REF){ alert('먼저 참조해를 불러오십시오 — 목록에서 골라 "참조해 불러오기" 또는 "파일 선택…".'); refTog.checked=false; return; } S.useRef=v; }});
  fi.addEventListener('change',async()=>{ let meta=null, raw=null; for(const f of fi.files){ if(f.name.endsWith('.json')) meta=JSON.parse(await f.text()); else raw=await f.arrayBuffer(); }
    fname.textContent=[...fi.files].map(f=>f.name).join(', ')||'results.json + fields 파일';
    if(!meta||!raw){ alert('results.json 과 fields 파일(fields.v2.bin.gz 또는 fields.bin) 두 개를 함께 선택하십시오.'); return; }
    try{ if(loadReference(meta,await decodeFields(meta,raw))) refTog.checked=true; }catch(e){ alert('참조해 파일을 읽지 못했습니다: '+e.message); } });
  /* 목록에서 고른 케이스로 화면 설정 맞추기 — 각 컨트롤에 입력 이벤트를 보내 평소 조작과 같은 경로로 반영 */
  const setR=(r,v)=>{ if(+r.value!==v){ r.value=v; r.dispatchEvent(new Event('input')); } };
  const setT=(t,v)=>{ if(t.checked!==v){ t.checked=v; t.dispatchEvent(new Event('change')); } };
  function applyCase(s){
    setT(C.iac,false);
    const pb=C.pat.querySelector('button[data-v="'+s.pattern+'"]'); if(pb&&!pb.classList.contains('on')) pb.click();
    setR(C.spacing,s.spacing); setR(C.n,s.n); setT(C.outer,!!s.outer); setR(C.Q,s.Q); setR(C.bleed,Math.round(s.bleed*100));
    setR(C.conc,Math.round(s.conc/10)); setR(C.grade,+C.grade.min); setR(C.K,Math.round(Math.log10(s.K)*100));
    setR(C.grad,Math.round(s.grad*1000)); setR(C.aL,Math.round(s.aL*10)); setR(C.aT,Math.round(s.aT*10));
  }
  fetch('ogs1/cases/index.json').then(r=>{ if(!r.ok) throw new Error(r.status); return r.json(); }).then(ix=>{
    CASES=ix.cases||[]; sel.innerHTML=CASES.map(c=>'<option>'+c.label+(c.default?' (기준)':'')+'</option>').join('');
    const d=CASES.findIndex(c=>c.default); if(d>=0) sel.selectedIndex=d; sel.disabled=bLoad.disabled=CASES.length===0;
  }).catch(()=>{ sel.innerHTML='<option>목록은 웹으로 열었을 때 사용 가능</option>'; });
  C.iac=uiToggle(sec,{label:'이온흡착형 풍화토 가정',hyp:true,info:'투수계수를 전풍화층 값 0.16 m/d(Wang 2022)로 바꿉니다. Yuan 2025는 2.59 m/d로 한 자릿수 차이. 사면형 광상은 불포화·비폐색이라 본래 패턴식 대상이 아닙니다.',set:v=>{S.iac=v; kSl.value=v?-80:0; kSl.dispatchEvent(new Event('input'));}});
}
function legendHTML(){
  const m=MODES[S.mode], nI=wells.filter(q=>q.type==='I').length, nP=wells.length-nI;
  const it=(ic,nm,role)=>ic+'<div class="nm">'+nm+(role?'<span class="role">'+role+'</span>':'')+'</div>';
  const sw=c=>'<i style="background:'+c+'"></i>', ln=c=>'<i class="ln" style="background:'+c+'"></i>';
  const faces=[ it(sw('#8E7A55'),'대수층 상면','광체 · 두께 8 m · 평면도에 표시 항목이 겹침'),
    it(sw('#2F3540'),'상부 차수층','불투수 · 안쪽은 걷어내고 테두리만'),
    it(sw('#3A414B'),'하부 차수층','불투수'),
    it(sw('#7A6947'),'광체 밖 대수층','품위 0 · 실선 사각형 바깥') ];
  const lines=[ it('<i class="tri" style="border-top:10px solid #4FC3E8"></i>','주입정 ▼ '+nI+'공','꼭짓점이 땅을 향한 원뿔 · 침출액 주입'),
    it('<i class="tri" style="border-bottom:10px solid #E0A64A"></i>','회수정 ▲ '+nP+'공','꼭짓점이 위를 향한 원뿔 · 모액 양수'),
    it('<i class="dot" style="background:#8B9099"></i>','감시정 12공','회색 원기둥 · 2회 연속 초과 시 적색'),
    it(ln('#4DCCE6'),'유선 · 포집','주입정에서 출발해 회수정에 도달'),
    it(ln('#EB5A4D'),'유선 · 이탈','경계 밖으로 나감 = 봉쇄 실패'),
    it(ln('#74787F'),'유선 · 정체','속도 0 근처에서 멈춤'),
    it(ln('#F0D696'),'실선 사각형','광체 범위 · 회수율 분모'),
    it('<i class="dsh" style="border-top-color:#C8CDD7"></i>','점선 사각형','감시정 링'),
    it(ln('#5FD8F0'),'수두면','절개면 위 실선 · 주입정에서 솟고 회수정에서 꺼짐') ];
  return '<div class="hd">표시 항목 — '+m.title+'</div><div class="bar2" style="background:'+gradientCSS(m.key)+'"></div><div class="barlbl"><span>'+m.lo+'</span><span>'+m.hi+'</span></div>'+
    '<div class="hd">면 (색)</div><div class="grp">'+faces.join('')+'</div>'+
    '<div class="hd">선 · 표식</div><div class="grp">'+lines.join('')+'</div>';
}
function ui(){
  const rf=S.reRE/S.totalSr0*100, ls=S.lossNow, nI=wells.filter(q=>q.type==='I').length, nP=wells.length-nI;
  let ph,cap;
  if(S.day<=0){ ph='주입 전'; cap='재생을 누르면 주입정에서 침출액이 들어가고 회수정이 양수합니다. 유선 색을 먼저 보십시오. 적색 유선이 있으면 봉쇄가 안 된 배치입니다.'; }
  else if(!S.restoring){ ph='침출 단계'; cap = S.escFrac>0.02 ? '유선의 '+(S.escFrac*100).toFixed(0)+'%가 회수정에 잡히지 않고 밖으로 나갑니다. 외곽을 회수정으로 바꾸거나 bleed를 올려보십시오.'
    : (S.alarms>0 ? '감시정 '+S.alarms+'공에서 추적자가 관리치를 넘었습니다.' : '포집 영역이 닫혀 있습니다. 정체 구역(꽃잎 모양)은 침출 진행도 모드에서 보입니다.'); }
  else { ph='복원 · 지하수 스윕'; cap='주입을 멈추고 양수만 합니다. 남은 침출액을 되끌어오는 구간이며 실제 조업에서는 회수보다 오래 걸립니다.'; }
  const warn=[]; if(S.alarms>0) warn.push('감시정 '+S.alarms+'/12 초과. 규정상 지시항목 2개 동시 초과가 excursion 기준이며 여기서는 추적자 1개로 대체.'); if(S.escFrac>0.02) warn.push('유선 '+(S.escFrac*100).toFixed(0)+'%가 도메인 밖으로 이탈합니다.'); if(S.qEff<S.Qinj-0.5) warn.push('투수계수 '+S.K.toFixed(2)+' m/d에서 허용 수위강하(15 m) 안에 넣을 수 있는 주입량이 정호당 '+S.qEff.toFixed(0)+' m³/d로 제한됩니다. 1 PV에 '+S.pvDays.toFixed(0)+'일.');
  return { ref:!!(S.useRef&&REF), day:S.pv.toFixed(2), dayUnit:'PV', progress:Math.min(S.pv,S.PV_END)/S.PV_END, phase:ph, caption:cap, warn:warn,
    kpis:[{l:'회수율',v:rf.toFixed(1),u:'%'},{l:'유실률',v:ls.toFixed(1),u:'% 광체 밖 침출액'},{l:'감시정 초과',v:S.alarms+'/12',u:'2회 연속 UCL 초과',color:S.alarms>0?'var(--alert)':'var(--safe)'}],
    chart:{xmax:S.PV_END,xunit:'PV',phases:[{x0:0,x1:S.PV_LEACH,label:'침출'},{x0:S.PV_LEACH,x1:S.PV_END,label:'복원'}],
      a:{min:0,max:100,series:[{name:'회수율',color:SER[0],pts:S.hist.map(x=>[x.pv,x.rf])},{name:'유실률',color:SER[1],pts:S.hist.map(x=>[x.pv,x.ls])}]},
      b:{title:'모액 농도',unit:'g/L',min:0,max:3,series:[{name:'모액',color:SER[2],pts:S.hist.map(x=>[x.pv,x.cc])}]}},
    chartHint:'가로축은 누적 양수 공극체적(PV). 1 PV ≈ '+S.pvDays.toFixed(0)+'일.',
    details:(S.refStats?[['OGS 참조해 프레임',S.refStats.frameDay.toFixed(0),'일'],['수두 RMS 차 (브라우저−OGS)',S.refStats.hRms.toFixed(2),'m'],['추적자 R² (브라우저 vs OGS)',S.refStats.cR2.toFixed(3),''],['OGS sweep 접촉율',(S.refStats.sweep*100).toFixed(0),'%'],['OGS 광체 밖 추적자',(S.refStats.outside*100).toFixed(1),'%']]:[]).concat([['경과 일수',S.day.toFixed(0),'일'],['1 PV 소요',S.pvDays.toFixed(0),'일'],['정호당 주입 (K 제한)',S.qEff.toFixed(0)+' / 허용 '+Math.min(S.qMax,9999).toFixed(0),'m³/d'],['정호 수 (주입/회수)',nI+' / '+nP,'공'],['도메인 한 변',LX.toFixed(0),'m'],['모액 농도 (현재/평균)',S.liquor.toFixed(2)+' / '+meanLiquor().toFixed(2),'g/L'],['50% 회수 도달',S.pv50===null?'—':S.pv50.toFixed(2),'PV'],['80% 회수 도달',S.pv80===null?'—':S.pv80.toFixed(2),'PV'],['누적 주입',S.inWater.toFixed(0),'m³'],['누적 양수',S.prodWater.toFixed(0),'m³'],['시약 순환 총량 (재사용 미고려)',S.reagent.toFixed(1),'t'],['유실률 최대 (침출 중)',S.lossPeak.toFixed(1),'%'],['이탈 유선 비율 (침출 중)',(S.escLeach*100).toFixed(0),'%'],['경계 유출 추적자',(S.injMass>0?S.lsOut/S.injMass*100:0).toFixed(1),'%']]),
    limits:['<b>흐름</b> · 2차원 평면 정류 피압류(Laplace). 연직 sweep·층상 불균질 없음. 수두는 정호 조건이 바뀔 때만 다시 풂.',
      '<b>분산</b> · 종·횡 분산도(αL, αT)를 면 속도 기반 대각 텐서로 넣음. 교차항(Dxy) 생략. αL 은 목표값에서 격자 수치분산(Δx/2)을 뺀 유효값으로 적용. 명시적 스킴이라 분산이 크면 부분스텝이 짧아짐.',
      '<b>화학</b> · 사면식과 같은 1차 속도식. 우라늄 침출 화학(산화·탄산염)이 아니라 이온교환 형태를 그대로 씀.',
      '<b>excursion</b> · 규정은 지시항목(Cl⁻·전기전도도·총알칼리도) 2개 동시 초과. 여기서는 추적자 1개의 2회 연속 초과로 대체.',
      '<b>OGS 참조해 대비</b> · 수치는 COMPARE.md 부록 B 참조. 12 시나리오에서 봉쇄 조건의 sweep 은 브라우저가 2~5 %p 낮고, 광체 밖 유실은 ±0.6 %p(봉쇄 실패 시 +2~3 %p).',
      '<b>폐색</b> · 석고·철수산화물 침전, 점토 팽윤에 의한 투수계수 저하 없음.',
      '<b>이온흡착형 가정</b> · 가설입니다. 사면형 광상은 불포화·비폐색이라 패턴식 대상이 아니며, 포화대에 놓인 평탄 광상 사례를 아직 확보하지 못했습니다.',
      '<b>복원</b> · 지하수 스윕만. 역삼투 재주입·환원 재순환 없음. 실제(Highland WY)는 15 PV 이상.'],
    tlLabel:'0 – '+S.PV_END+' PV', tlTicks:[0,1,2,3,4,5,6,7], tlPhase1:S.PV_LEACH/S.PV_END, done:S.pv>=S.PV_END };
}
function batch(opts){ Object.assign(S,opts||{}); reset(); let guard=0; while(S.pv<S.PV_END&&guard<400000){ step(S.dtSub); guard++; }
  trackLoss(); return {recov:S.reRE/S.totalSr0*100, loss:S.lossNow, lossPeak:S.lossPeak, water:S.inWater, reagent:S.reagent, days:S.day, wells:wells.length, alarms:S.alarms, liquor:meanLiquor(), escFrac:S.escLeach, qEff:S.qEff, pv50:S.pv50, pv80:S.pv80, pvDays:S.pvDays, area:(bounds.x1-bounds.x0)*(bounds.y1-bounds.y0)};
}
const api={ name:'정호 패턴식', S, MODES, cam, _dbg:()=>({h,Cl,wells,NX,NY,DX,LX}), loadReference, exportScenario, buildGeology:()=>{}, reset, advance, tick, drawSection, buildControls, legendHTML, ui, batch, applyClip,
  get scene(){return scene}, get camera(){return camera}, build3D, hasClip:true, onLegend:null, setMode:m=>{S.mode=m}, setClip:v=>{S.clip=v; applyClip();} };
return api;
})();

/* 라이브러리 12개 설정을 브라우저 모델로 헤드리스 실행 → 시각별 sweep·광체 밖 추적자·잔류량
   사용: node browser/library_browser.js <출력 json> [aL] [aT]
   시간축: 스튜디오와 같이 누적 양수량 / 공극체적 (PV). 침출 0–5 PV, 복원 5–7 PV(주입 정지, 양수 계속).
   기록: 0.5 PV 마다 pv·day·sweep·out_ore·mass(도메인 내 추적자 총량, 주입 농도 × 셀 기준), 파과일, 광체 밖 최대. */
const fs=require('fs'); const out=process.argv[2];
const PATTERNS=['5spot','7spot','line'], SP=[30,50], BL=[0.05,-0.10];
function oreMask(d,spacing){ const w=d.wells, s=spacing; let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
  w.forEach(q=>{x0=Math.min(x0,q.x);x1=Math.max(x1,q.x);y0=Math.min(y0,q.y);y1=Math.max(y1,q.y);}); x0-=s/2;x1+=s/2;y0-=s/2;y1+=s/2;
  const m=new Uint8Array(d.NX*d.NY); for(let j=0;j<d.NY;j++)for(let i=0;i<d.NX;i++){ const x=(i+0.5)*d.DX,y=(j+0.5)*d.DX; m[i+j*d.NX]=(x>=x0&&x<=x1&&y>=y0&&y<=y1)?1:0; } return m; }
const res={};
for(const p of PATTERNS)for(const s of SP)for(const b of BL){
  const name=p+'_s'+s+'_b'+(b>=0?'p':'m')+Math.abs(Math.round(b*100));
  Object.assign(Pattern.S,{pattern:p,spacing:s,n:2,outerProd:true,Qinj:100,bleed:b,conc:250,K:1.0,grad:0.002,grade:0.0001,aL:+(process.argv[3]||2.0),aT:+(process.argv[4]||0.2)});
  Pattern.reset(); const S=Pattern.S, d=Pattern._dbg(), ore=oreMask(d,s);
  const nI=d.wells.filter(q=>q.type==='I').length, nP=d.wells.length-nI;
  const rec={pv:[],day:[],sweep:[],out_ore:[],mass:[],escFrac:S.escLeach,domain:d.LX,pvDays:S.pvDays,wells:d.wells.length,nI:nI,nP:nP,leach_pv:S.PV_LEACH,end_pv:S.PV_END};
  let nextPV=0.5, outPeak=0, tb=null;
  while(S.pv<S.PV_END){ const before=S.pv; Pattern.advance(1); if(S.pv===before) break;
    let tot=0,outside=0,sw=0,nore=0; for(let c=0;c<d.NX*d.NY;c++){ const v=d.Cl[c]/S.conc; tot+=v; if(ore[c]){nore++; if(v>0.05) sw++;} else outside+=v; }
    const of=tot>0?outside/tot:0; if(S.pv<=S.PV_LEACH&&of>outPeak) outPeak=of;
    if(tb===null){ for(const q of d.wells){ if(q.type!=='P') continue; if(d.Cl[q.i+q.j*d.NX]/S.conc>0.05){ tb=S.day; break; } } }
    if(S.pv>=nextPV){ rec.pv.push(+S.pv.toFixed(2)); rec.day.push(+S.day.toFixed(1)); rec.sweep.push(+(sw/nore).toFixed(4)); rec.out_ore.push(+of.toFixed(5)); rec.mass.push(+tot.toFixed(2)); nextPV+=0.5; } }
  rec.out_ore_peak=+outPeak.toFixed(5); rec.breakthrough_day=tb; res[name]=rec;
  const at=pv=>rec.sweep[rec.pv.findIndex(x=>Math.abs(x-pv)<0.05)];
  const m5=rec.mass[rec.pv.findIndex(x=>Math.abs(x-5)<0.05)], m7=rec.mass[rec.mass.length-1];
  console.log(name.padEnd(16),'I/P',nI+'/'+nP,'1PV',S.pvDays.toFixed(0)+'d','sweep@1PV',(at(1)*100).toFixed(1)+'%','@5PV',(at(5)*100).toFixed(1)+'%','out_peak',(outPeak*100).toFixed(2)+'%','잔류@7PV',(m7/m5*100).toFixed(0)+'%','bt',tb===null?'-':tb.toFixed(0)+'d');
}
fs.writeFileSync(out,JSON.stringify(res,null,1));
