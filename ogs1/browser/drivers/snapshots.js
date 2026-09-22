const fs=require('fs'); const out=process.argv[2]; const aL=+process.argv[3], aT=+process.argv[4]; const days=process.argv.slice(5).map(Number);
Object.assign(Pattern.S,{pattern:'5spot',spacing:50,n:2,outerProd:true,Qinj:100,bleed:0.05,conc:250,K:1.0,grad:0.002,grade:0.0001,aL:aL,aT:aT});
Pattern.reset(); const S=Pattern.S; let di=0; console.log('domain',Pattern._dbg().LX,'dtSub',S.dtSub.toFixed(3),'aL',aL,'aT',aT);
while(di<days.length){ Pattern.advance(1); if(S.day>=days[di]){ const d=Pattern._dbg(); fs.writeFileSync(out+'/browser_snapshot_day'+days[di]+'.json',JSON.stringify({day:S.day,nx:d.NX,ny:d.NY,DX:d.DX,domain_m:d.LX,conc:S.conc,h:Array.from(d.h),Cl:Array.from(d.Cl)})); di++; } if(S.pv>=S.PV_END) break; }
