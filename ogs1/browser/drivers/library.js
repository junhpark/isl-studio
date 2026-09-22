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
