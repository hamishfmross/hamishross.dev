(()=>{
/* ================= Data ================= */
const PAGES={
  projects:{title:'Projects',ref:'U1',part:'FPGA',blurb:"Things I've built and am building, with write-ups",tint:'#bfc6ca'},
  cv:{title:'CV',ref:'U2 U3',part:'DDR4 memory',blurb:'Education, experience and skills',tint:'#1e2225'},
  blog:{title:'Blog',ref:'Y1',part:'100 MHz crystal',blurb:'Build logs and notes, newest first',tint:'#cbd1d4'},
  about:{title:'About',ref:'U5',part:'Power regulator',blurb:"Who I am and what I'm working towards",tint:'#2a2f33'},
  contact:{title:'Contact',ref:'J1 J2',part:'USB-C and Ethernet',blurb:'Email, GitHub and LinkedIn',tint:'#c5cbce'}
};
const STATUS={title:'Server status',ref:'LD0–3',blurb:'On the live site these LEDs will show the Raspberry Pi 5 this page runs on'};

/* ================= Drawing primitives ================= */
const C={gap:'#082c23',trace:'#1b5b4a',pour:'#0e4336',tin:'#c8cdd0'};
const n=v=>Math.round(v*10)/10;
const P=pts=>'M'+pts.map(p=>n(p[0])+' '+n(p[1])).join(' L');
const R=(x,y,w,h,a='')=>`<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" ${a}/>`;
const T=(x,y,s,c,t,a='')=>`<text x="${n(x)}" y="${n(y)}" font-size="${n(s)}" class="${c}" ${a}>${t}</text>`;
const Ci=(x,y,r,a='')=>`<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" ${a}/>`;
const soft=(x,y,w,h,rx=3)=>R(x+1,y+3,w+1,h+1,`rx="${rx}" fill="#011410" opacity=".38"`)+R(x-2,y+6,w+5,h+5,`rx="${rx+3}" fill="#011410" opacity=".15"`);
const place=(x,y,rot,inner)=>`<g transform="translate(${x} ${y}) rotate(${rot})">${inner}</g>`;
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

/* traces */
function nrm(a,b){const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;return[-dy/l,dx/l];}
function offset(pts,d){return pts.map((p,i)=>{const n1=i>0?nrm(pts[i-1],p):null,n2=i<pts.length-1?nrm(p,pts[i+1]):null;let nx,ny,k=1;if(n1&&n2){nx=n1[0]+n2[0];ny=n1[1]+n2[1];const l=Math.hypot(nx,ny)||1;nx/=l;ny/=l;k=1/(nx*n1[0]+ny*n1[1]);}else{const m=n1||n2;nx=m[0];ny=m[1];}return[p[0]+nx*d*k,p[1]+ny*d*k];});}
const bus=(pts,c,pitch)=>Array.from({length:c},(_,i)=>offset(pts,(i-(c-1)/2)*pitch));
function diff(pts,pairs,intra,inter){const o=[];for(let p=0;p<pairs;p++){const c=(p-(pairs-1)/2)*inter;o.push(offset(pts,c-intra/2),offset(pts,c+intra/2));}return o;}
function meander(x1,x2,y,dir,amp=12,p=7){let x=x1+18,d=`M${x1} ${n(y)} H${x}`;while(x+2*p<=x2-18){d+=` V${n(y+dir*amp)} h${p} V${n(y)} h${p}`;x+=2*p;}return d+` H${x2}`;}
function lane(x1,x2,yc,c,pitch){const o=[];for(let i=0;i<c;i++){const y=yc+(i-(c-1)/2)*pitch;o.push(i===0?meander(x1,x2,y,-1):i===c-1?meander(x1,x2,y,1):`M${x1} ${n(y)} H${x2}`);}return o;}
let pulseSeed=0;
function tr(lines,w=3,busName=null){
  const ds=lines.map(l=>typeof l==='string'?l:P(l));
  const paths=ds.map(d=>`<path d="${d}"/>`).join('');
  let o=`<g fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="${C.gap}" stroke-width="${w+3.6}">${paths}</g><g stroke="${C.trace}" stroke-width="${w}">${paths}</g></g>`;
  if(busName){
    o+=`<g class="live" data-bus="${busName}" fill="none" stroke-linecap="round" stroke-linejoin="round">`+ds.map(d=>{pulseSeed=(pulseSeed+37)%100;return `<path class="glowline" d="${d}" stroke-width="${n(w+1.4)}"/><path class="pulse" d="${d}" pathLength="100" stroke-width="${Math.max(w,2.6)}" style="animation-delay:-${(pulseSeed/100*1.15).toFixed(2)}s"/>`;}).join('')+`</g>`;
  }
  return o;
}

/* vias, pours, board */
const via=(x,y,r=3,g=false)=>g?Ci(x,y,r+1.3,'fill="url(#gGold)"')+Ci(x,y,r*.5,'fill="#061f19"'):Ci(x,y,r+1.2,'fill="#124f40"')+Ci(x,y,r*.45,'fill="#0a3229"');
function viaField(x,y,w,h,c,seed,g=.25){const r=rng(seed),pts=[];let o='';for(let t=0;t<c*40&&pts.length<c;t++){const px=x+r()*w,py=y+r()*h;if(pts.every(q=>Math.hypot(q[0]-px,q[1]-py)>14)){pts.push([px,py]);o+=via(px,py,3,r()<g);}}return o;}
function stitch(b,skip){let o='';const ins=17,st=26,pts=[];for(let x=b.x+50;x<=b.x+b.w-50;x+=st)pts.push([x,b.y+ins],[x,b.y+b.h-ins]);for(let y=b.y+50;y<=b.y+b.h-50;y+=st)pts.push([b.x+ins,y],[b.x+b.w-ins,y]);for(const[x,y]of pts){if(skip.some(s=>x>s[0]&&x<s[0]+s[2]&&y>s[1]&&y<s[1]+s[3]))continue;o+=via(x,y,2.6);}return o;}
const pour=(x,y,w,h)=>R(x,y,w,h,`rx="10" fill="${C.pour}" stroke="${C.gap}" stroke-width="3"`);
function base(b){let o='';for(let i=6;i>=1;i--)o+=R(b.x-i*3,b.y+i*4+2,b.w+i*6,b.h+i*3,`rx="${b.r+i*4}" style="fill:rgba(var(--shade),.055)"`);o+=R(b.x-1,b.y+2,b.w+2,b.h+2,`rx="${b.r+1}" style="fill:rgba(var(--shade),.3)"`);return o+R(b.x-1.6,b.y-1.6,b.w+3.2,b.h+3.2,`rx="${b.r+1.6}" fill="#a69a6e"`)+R(b.x,b.y,b.w,b.h,`rx="${b.r}" fill="url(#gBoard)"`);}
const sheen=b=>R(b.x,b.y,b.w,b.h,`rx="${b.r}" fill="url(#gSheen)" pointer-events="none"`);

/* passives */
function mlcc(x,y,h=true,s=1,body='#b59c70'){const L=14*s,W=7*s,e=3.4*s,t=`fill="${C.tin}"`;return h?R(x,y,L,W,`fill="${body}"`)+R(x,y,e,W,t)+R(x+L-e,y,e,W,t):R(x,y,W,L,`fill="${body}"`)+R(x,y,W,e,t)+R(x,y+L-e,W,e,t);}
const res=(x,y,h=true,s=1)=>mlcc(x,y,h,s,'#16191b');
function pins(x,y,w,h,c,sides,len=6,wid=3.2){let o='';const f=`fill="${C.tin}"`,at=L=>Array.from({length:c},(_,i)=>L/(c+1)*(i+1));if(sides.includes('l'))at(h).forEach(d=>o+=R(x-len,y+d-wid/2,len+1,wid,f));if(sides.includes('r'))at(h).forEach(d=>o+=R(x+w-1,y+d-wid/2,len+1,wid,f));if(sides.includes('t'))at(w).forEach(d=>o+=R(x+d-wid/2,y-len,wid,len+1,f));if(sides.includes('b'))at(w).forEach(d=>o+=R(x+d-wid/2,y+h-1,wid,len+1,f));return o;}

/* ICs */
function plastic(x,y,w,h,lines=[],fs){const m=Math.min(w,h);fs=fs||m*.12;let o=soft(x,y,w,h,3)+R(x,y,w,h,'rx="3" fill="url(#gChip)" stroke="#0a0c0e" stroke-width="1.2"')+R(x+1.5,y+1.5,w-3,h-3,'rx="2" fill="none" stroke="#fff" stroke-opacity=".06"')+Ci(x+m*.15,y+m*.15,m*.045+1.6,'fill="#0f1214" stroke="#fff" stroke-opacity=".12"');const lh=fs*1.45,y0=y+h/2-(lines.length-1)*lh/2+fs*.36;lines.forEach((t,i)=>o+=T(x+w/2,y0+i*lh,i===0?fs*1.18:fs,'etch',t,'text-anchor="middle"'));return o;}
const qfn=(x,y,s,lines,fs)=>pins(x,y,s,s,Math.max(4,Math.round(s/9)),'lrtb',5,2.8)+plastic(x,y,s,s,lines,fs);
const soic=(x,y,w,h,lines,fs)=>pins(x,y,w,h,4,'tb',8,4.4)+plastic(x,y,w,h,lines,fs);
function fpga(x,y,s){
  const m=s*.14,lx=x+m,ly=y+m,ls=s-2*m,cx=x+s/2,cs=.8,ch=7*cs;
  let o=soft(x,y,s,s,8)+R(x,y,s,s,'rx="8" fill="#1f2b26" stroke="#111915" stroke-width="2"')+R(x+3,y+3,s-6,s-6,'rx="6" fill="none" stroke="#fff" stroke-opacity=".05"');
  for(let i=0;i<5;i++){const px=lx+ls*.14+i*ls*.17;o+=mlcc(px,y+m/2-ch/2,true,cs)+mlcc(px,y+s-m/2-ch/2,true,cs);}
  for(let i=0;i<4;i++){const py=ly+ls*.18+i*ls*.2;o+=mlcc(x+m/2-ch/2,py,false,cs)+mlcc(x+s-m/2-ch/2,py,false,cs);}
  o+=`<path d="M${n(x+7)} ${n(y+7)} h16 l-16 16z" fill="url(#gGold)"/>`;
  o+=R(lx+2,ly+4,ls,ls,'rx="12" fill="#000" opacity=".3"')+R(lx,ly,ls,ls,'rx="12" fill="url(#gLid)" stroke="#858e93" stroke-width="1.5"')+R(lx,ly,ls,ls,'rx="12" fill="url(#brush)"')+R(lx+2.5,ly+2.5,ls-5,ls-5,'rx="10" fill="none" stroke="#fff" stroke-opacity=".6"');
  o+=Ci(lx+ls*.09,ly+ls*.09,ls*.022,'fill="#5c656a" fill-opacity=".6"');
  o+='<g text-anchor="middle">'+T(cx,ly+ls*.2,ls*.058,'etch-dark','HR-7Z020  FPGA')+T(cx,ly+ls*.445,ls*.165,'etch-lid','PROJECTS')+`<path d="M${n(cx-ls*.3)} ${n(ly+ls*.54)} H${n(cx+ls*.3)}" stroke="#454e53" stroke-opacity=".4" stroke-width="1.2"/>`+T(cx,ly+ls*.66,ls*.052,'etch-dark','BGA-400  -1C  0–85 °C')+T(cx,ly+ls*.77,ls*.052,'etch-dark','DESIGNED IN EDINBURGH')+T(cx,ly+ls*.88,ls*.052,'etch-dark','2641  A1')+'</g>';
  return o;
}
function crystal(x,y,w,h){
  return R(x-12,y+h*.25,12,h*.5,'fill="url(#gGold)"')+R(x+w,y+h*.25,12,h*.5,'fill="url(#gGold)"')+soft(x-4,y-3,w+8,h+6,4)+R(x-4,y-3,w+8,h+6,'rx="4" fill="#15181a"')
   +R(x,y,w,h,`rx="${h/2}" fill="url(#gMetal)" stroke="#7e878d" stroke-width="1.2"`)
   +`<path d="M${n(x+h/2)} ${n(y+4)} H${n(x+w-h/2)}" stroke="#fff" stroke-opacity=".8" stroke-width="2" stroke-linecap="round"/>`
   +R(x+5,y+5,w-10,h-10,`rx="${(h-10)/2}" fill="none" stroke="#000" stroke-opacity=".12"`)
   +T(x+w/2,y+h/2+h*.12,h*.3,'etch-dark','100.000','text-anchor="middle"');
}
/* connectors, drawn pointing left (opening at local x=0) */
function usbc(L=100,W=70){const g='fill="url(#gGold)"';return R(L-18,-W/2-8,12,10,g)+R(L-18,W/2-2,12,10,g)+R(L-42,-W/2-5,10,6,g)+R(L-42,W/2-1,10,6,g)+soft(0,-W/2,L,W,6)+R(0,-W/2,L,W,'rx="6" fill="url(#gMetal)" stroke="#7a8389" stroke-width="1.2"')+R(12,-W/2+7,L-24,W-14,'rx="4" fill="none" stroke="#000" stroke-opacity=".16"')+Ci(L*.62,-W*.18,4,'fill="#000" fill-opacity=".1"')+Ci(L*.62,W*.18,4,'fill="#000" fill-opacity=".1"')+R(-2,-W*.3,8,W*.6,'rx="3" fill="#0b0d0f"');}
function rj45(L=170,W=150){let o=soft(0,-W/2,L,W,4)+R(0,-W/2,L,W,'rx="5" fill="url(#gMetal)" stroke="#788187" stroke-width="1.2"')+R(16,-W/2+12,L-30,W-24,'rx="3" fill="#000" fill-opacity=".04" stroke="#000" stroke-opacity=".14"');for(let i=0;i<5;i++)o+=`<path d="M${30+i*22} ${-W/2+20} V${W/2-20}" stroke="#fff" stroke-opacity=".35" stroke-width="1.4"/>`;return o+`<path d="M-3 ${n(-W*.3)} H10 V${n(W*.3)} H-3 Z" fill="#0b0d0f"/>`+R(-3,-W*.08,6,W*.16,'fill="#2a2e31"')+`<g class="rj-led">${R(-3,-W/2+8,9,14,'rx="1.5" fill="#58e08a"')}</g>`+R(-3,W/2-22,9,14,'rx="1.5" fill="#f5b545"');}
function barrel(L=118,W=86){const g='fill="url(#gGold)"';let o=R(L-10,-W/2+8,14,18,g)+R(L-10,W/2-26,14,18,g)+R(L*.45,W/2-2,18,10,g)+soft(0,-W/2,L,W,5)+R(0,-W/2,L,W,'rx="5" fill="#17191b" stroke="#08090a" stroke-width="1.2"')+R(8,-W/2+8,L-16,W-16,'rx="3" fill="none" stroke="#fff" stroke-opacity=".06"');for(let i=0;i<3;i++)o+=`<path d="M${n(L*.35+i*16)} ${-W/2+12} V${W/2-12}" stroke="#fff" stroke-opacity=".05" stroke-width="2"/>`;return o+R(-2,-W*.28,10,W*.56,'rx="3" fill="#050607"')+Ci(3,0,W*.12,'fill="#6c7378"');}
function inductor(x,y,s,mark){const t=`fill="${C.tin}"`;return R(x-5,y+s*.22,7,s*.56,t)+R(x+s-2,y+s*.22,7,s*.56,t)+soft(x,y,s,s,s*.16)+R(x,y,s,s,`rx="${n(s*.16)}" fill="url(#gInd)" stroke="#111315"`)+Ci(x+s/2,y+s/2,s*.33,'fill="#000" fill-opacity=".2"')+R(x+3,y+3,s-6,s-6,`rx="${n(s*.13)}" fill="none" stroke="#fff" stroke-opacity=".07"`)+T(x+s/2,y+s/2+s*.08,s*.22,'etch-light',mark,'text-anchor="middle"');}
function polycap(cx,cy,r,mark){const x0=cx-r-5,y0=cy-r-5,w=2*r+10;return soft(x0,y0,w,w,2)+`<path d="M${n(x0+9)} ${n(y0)} H${n(x0+w)} V${n(y0+w)} H${n(x0+9)} L${n(x0)} ${n(y0+w-9)} V${n(y0+9)} Z" fill="#1a1d20"/>`+Ci(cx,cy,r,'fill="url(#gMetal)" stroke="#788188" stroke-width="1.2"')+`<path d="M${n(cx-r*.55)} ${n(cy-r*.835)} A${r} ${r} 0 0 0 ${n(cx-r*.55)} ${n(cy+r*.835)} Z" fill="#1e2225"/>`+Ci(cx,cy,r*.72,'fill="none" stroke="#000" stroke-opacity=".12"')+T(cx+r*.2,cy+r*.14,r*.36,'etch-dark',mark,'text-anchor="middle"');}
function led(cx,cy,g,lens,id){return `<g class="led" data-led="${id}">${Ci(cx,cy,26,`class="glow" fill="url(#${g})"`)}${R(cx-12,cy-5,5,10,`fill="${C.tin}"`)}${R(cx+7,cy-5,5,10,`fill="${C.tin}"`)}${R(cx-8,cy-5.5,16,11,'rx="1.5" fill="#e6e9e9"')}${R(cx-5,cy-3.5,10,7,`rx="1" class="lens" fill="${lens}"`)}</g>`;}
function tact(x,y,s){const t=`fill="${C.tin}"`;return R(x-6,y+5,8,7,t)+R(x+s-2,y+5,8,7,t)+R(x-6,y+s-12,8,7,t)+R(x+s-2,y+s-12,8,7,t)+soft(x,y,s,s,3)+R(x,y,s,s,'rx="3" fill="url(#gMetal)" stroke="#788188"')+R(x+5,y+5,s-10,s-10,'rx="2" fill="none" stroke="#000" stroke-opacity=".14"')+Ci(x+s/2,y+s/2,s*.27,'fill="#1b1e21" stroke="#000" stroke-opacity=".5"')+Ci(x+s/2-s*.07,y+s/2-s*.07,s*.08,'fill="#fff" fill-opacity=".12"');}
function header(x,y,cols,rows,p=24){let o=soft(x,y,cols*p,rows*p,3)+R(x,y,cols*p,rows*p,'rx="3" fill="#18191b" stroke="#08090a"');for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const cx=x+p/2+c*p,cy=y+p/2+r*p;o+=R(cx-p*.38,cy-p*.38,p*.76,p*.76,'rx="1.5" fill="#1f2123"')+R(cx-4,cy-4,8,8,'fill="url(#gGold)"')+R(cx-4,cy-4,8,2.2,'fill="#fff" opacity=".35"');}return o;}
function hole(cx,cy){let o=Ci(cx,cy,24,'fill="url(#gGold)"')+Ci(cx,cy,24,'fill="none" stroke="#6b5120" stroke-opacity=".5"');for(let i=0;i<8;i++){const a=i*Math.PI/4;o+=Ci(cx+Math.cos(a)*19,cy+Math.sin(a)*19,1.8,'fill="#5c4518" fill-opacity=".7"');}return o+Ci(cx,cy,13.5,'style="fill:var(--mat)"')+Ci(cx,cy,13.5,'fill="none" stroke="#000" stroke-opacity=".35" stroke-width="2"');}
const fid=(cx,cy)=>Ci(cx,cy,10,'fill="#0a2c23"')+Ci(cx,cy,4.5,'fill="url(#gGold)"');
const tp=(cx,cy,l)=>Ci(cx,cy,9,'class="silkline"')+Ci(cx,cy,5.5,'fill="url(#gGold)"')+T(cx+14,cy+3.5,10,'silk ref',l);
function sticker(x,y,w,h,rot){const r=rng(11);let bars='',bx=x+8;while(bx<x+w*.62){const bw=.8+Math.floor(r()*3)*.9;if(r()>.35)bars+=R(bx,y+8,bw,h-24,'fill="#1d1f21"');bx+=bw+.9;}return `<g transform="rotate(${rot} ${n(x+w/2)} ${n(y+h/2)})">${R(x+1,y+3,w,h,'rx="2" fill="#011410" opacity=".35"')}${R(x,y,w,h,'rx="2" fill="#f1f1ec"')}${bars}${T(x+8,y+h-6,8.5,'sticker-t','SN HR01-0001')}${R(x+w-36,y+8,28,17,'rx="2" fill="none" stroke="#25282a" stroke-width="1.2"')}${T(x+w-22,y+20,9,'sticker-t','QC','text-anchor="middle"')}${T(x+w-8,y+h-6,8.5,'sticker-t','26/40','text-anchor="end"')}</g>`;}
const titleBlock=(x,y,s=1)=>T(x,y,40*s,'silk name','HR-01')+T(x,y+21*s,14*s,'silk','HAMISH ROSS')+T(x,y+38*s,10*s,'silk ref','DEV BOARD  REV A')+T(x,y+56*s,12*s,'silk lower','hamishross.dev');

/* interactive groups */
function brk([x,y,w,h],L=18){return `<path class="brk" d="M${x} ${y+L} V${y} H${x+L} M${x+w-L} ${y} H${x+w} V${y+L} M${x+w} ${y+h-L} V${y+h} H${x+w-L} M${x+L} ${y+h} H${x} V${y+h-L}"/>`;}
function label(x,y,ref,name,s,a='middle'){return `<g class="lbl">${T(x,y,Math.max(11,s*.36),'silk ref',ref,`text-anchor="${a}"`)}${T(x,y+s*.98,s,'silk name',name,`text-anchor="${a}"`)}</g>`;}
function comp(key,region,parts,lbl,aria,link=true,d=0){const[x,y,w,h]=region;return `<g class="comp${link?'':' static'}" id="c-${key}" data-key="${key}" ${link?`tabindex="0" role="link" aria-label="${aria}"`:`role="img" aria-label="${aria}"`} style="--d:${d}ms">${link?brk(region):''}<g class="parts">${parts}</g>${lbl}${R(x,y,w,h,'class="hit" fill="none" pointer-events="all"')}</g>`;}

function defs(){return `<defs>
<linearGradient id="gBoard" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f4034"/><stop offset="1" stop-color="#0a3229"/></linearGradient>
<radialGradient id="gSheen" cx=".3" cy=".15" r="1"><stop offset="0" stop-color="#fff" stop-opacity=".08"/><stop offset=".5" stop-color="#fff" stop-opacity=".015"/><stop offset="1" stop-color="#000" stop-opacity=".14"/></radialGradient>
<linearGradient id="gChip" x1="0" y1="0" x2=".7" y2="1"><stop offset="0" stop-color="#2c3135"/><stop offset="1" stop-color="#15181b"/></linearGradient>
<linearGradient id="gLid" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2e6e8"/><stop offset=".4" stop-color="#bfc6ca"/><stop offset=".5" stop-color="#d7dcdf"/><stop offset=".6" stop-color="#b5bcc1"/><stop offset="1" stop-color="#99a1a6"/></linearGradient>
<linearGradient id="gMetal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1f3f4"/><stop offset=".55" stop-color="#bec5ca"/><stop offset="1" stop-color="#8d969c"/></linearGradient>
<linearGradient id="gGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0cf7f"/><stop offset="1" stop-color="#b88e36"/></linearGradient>
<linearGradient id="gInd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#42484d"/><stop offset="1" stop-color="#1e2225"/></linearGradient>
<pattern id="brush" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-32)"><rect width="5" height=".9" fill="#fff" opacity=".22"/><rect y="2.6" width="5" height=".5" fill="#000" opacity=".06"/></pattern>
<radialGradient id="glowR"><stop offset="0" stop-color="#ff7a68" stop-opacity=".95"/><stop offset=".3" stop-color="#ff4a38" stop-opacity=".4"/><stop offset="1" stop-color="#ff4a38" stop-opacity="0"/></radialGradient>
<radialGradient id="glowG"><stop offset="0" stop-color="#8dffb8" stop-opacity=".95"/><stop offset=".3" stop-color="#3fe486" stop-opacity=".4"/><stop offset="1" stop-color="#3fe486" stop-opacity="0"/></radialGradient>
<radialGradient id="glowA"><stop offset="0" stop-color="#ffd27a" stop-opacity=".95"/><stop offset=".3" stop-color="#ffab2e" stop-opacity=".4"/><stop offset="1" stop-color="#ffab2e" stop-opacity="0"/></radialGradient>
</defs>`;}

const ddrLines=['D4-8G16','DDR4 SDRAM','2638  REV B'];
const ledRow=(xs,y)=>led(xs[0],y,'glowR','#ff5a4a','pwr')+led(xs[1],y,'glowG','#57e38c','done')+led(xs[2],y,'glowA','#ffb347','ld0')+led(xs[3],y,'glowA','#ffb347','ld1')+led(xs[4],y,'glowA','#ffb347','ld2')+led(xs[5],y,'glowA','#ffb347','ld3');
const ledLabels=(xs,y)=>['PWR','DONE','LD0','LD1','LD2','LD3'].map((t,i)=>T(xs[i],y,9.5,'silk ref',t,'text-anchor="middle"')).join('');

/* ================= Landscape board ================= */
function drawLandscape(){
  const b={x:50,y:40,w:1300,h:820,r:26};
  let o=base(b);
  o+=pour(64,586,404,260)+pour(1146,148,190,700)+pour(326,410,214,172)+pour(870,664,262,182);
  o+=stitch(b,[[0,120,250,420],[0,600,200,170],[870,40,390,110],[40,40,100,100],[1250,40,140,100],[40,760,100,130],[1250,760,140,130]]);
  o+=viaField(346,426,174,140,24,3)+viaField(884,676,100,40,7,5)+viaField(1180,200,140,30,6,9)+viaField(1050,556,90,36,5,13)+viaField(372,240,100,36,6,17);

  // traces
  o+=tr(diff([[130,195],[252,195]],1,6,0),3,'contact');
  o+=tr(bus([[302,195],[470,195],[540,265],[600,265]],4,8),3,'contact');
  o+=tr(diff([[196,352],[252,352]],4,6,15),3,'contact');
  o+=tr(bus([[310,352],[600,352]],12,7.5),2.6,'contact');
  o+=tr([[[634,186],[634,212],[660,238],[660,270]],[[766,186],[766,212],[740,238],[740,270]]],3,'blog');
  o+=tr(bus([[972,112],[972,150],[946,176],[866,176],[840,202],[840,280]],8,8),2.6);
  const jb=[];for(let i=0;i<8;i++){const x=1124+i*8;jb.push([[x,112],[x,158+(i%2)*14]]);}
  o+=tr(jb,2.6);jb.forEach(l=>o+=via(l[1][0],l[1][1],2.6,true));
  o+=tr(lane(860,980,298,8,9),2.5,'cv')+tr(lane(860,980,458,8,9),2.5,'cv');
  o+=tr(bus([[860,378],[1140,378]],6,7),2.3,'cv');
  o+=tr(bus([[1024,628],[1024,566],[998,540],[840,540]],4,8),2.6);
  o+=tr(bus([[820,606],[820,530]],4,8),2.6,'boot');
  o+=tr([[[690,540],[690,700],[640,750],[640,768]],[[700,540],[700,768]],[[710,540],[710,720],[740,750],[740,768]],[[720,540],[720,700],[780,760],[780,768]],[[730,540],[730,672],[820,762],[820,768]],[[600,768],[600,700],[574,674]]],2.5,'status');
  o+=tr([[[146,690],[252,690]]],14,'about');
  o+=tr([[[314,676],[330,676],[350,656]],[[314,708],[330,708],[350,728]]],10,'about');
  o+=tr([[[396,656],[470,656],[540,586],[610,586],[610,540]],[[396,732],[500,732],[560,672],[650,672],[650,540]]],13,'about');

  // supporting parts
  [562,582,682,702].forEach(x=>o+=mlcc(x,227));[440,462,484,506].forEach(y=>o+=mlcc(538,y,false));
  o+=T(562,221,8,'silk ref','C21');
  o+=header(900,70,6,2)+header(1080,70,6,2)+T(890,100,12,'silk','JA','text-anchor="end"')+T(1236,100,12,'silk','JB')+T(906,63,8,'silk ref','1')+T(1086,63,8,'silk ref','1');
  o+=header(1000,620,6,1)+T(1000,612,11,'silk','JTAG');
  ['TCK','TDO','TDI','TMS','GND','3V3'].forEach((t,i)=>o+=T(1012+i*24,662,8.5,'silk ref',t,'text-anchor="middle"'));
  o+=soic(790,600,60,44,['QSPI','128Mb'])+T(790,668,9,'silk ref','U6');
  o+=tact(880,742,38)+tact(940,742,38)+tact(1000,742,38);
  ['PROG','BTN0','BTN1'].forEach((t,i)=>o+=T(899+i*60,800,10,'silk ref',t,'text-anchor="middle"'));
  for(let i=0;i<4;i++)o+=res(1138,361+i*8);
  o+=sticker(190,70,150,52,-2);
  o+=titleBlock(1160,730)+T(1160,692,9,'silk ref','94V-0  RoHS  6 LAYER');
  o+=hole(96,86)+hole(1304,86)+hole(96,814)+hole(1304,814);
  o+=fid(180,560)+fid(1100,204)+fid(1090,826);
  o+=tp(470,790,'3V3')+tp(530,814,'GND');

  // interactive components
  o+=comp('contact',[60,146,276,368],place(30,195,0,usbc())+qfn(250,169,52,['U8','USB UART'])+place(26,352,0,rj45())+qfn(250,322,60,['U4','GbE PHY']),label(128,462,'J1 J2  USB-C  RJ45','CONTACT',32),'Contact: email, GitHub and LinkedIn',true,300);
  o+=comp('blog',[544,144,232,96],crystal(640,160,120,40)+mlcc(612,206,false)+mlcc(780,206,false),label(620,168,'Y1  100 MHz','BLOG',34,'end'),'Blog: build logs and notes',true,150);
  o+=comp('projects',[548,238,324,324],fpga(560,250,300),'','Projects: things I have built',true,0);
  o+=comp('cv',[960,232,290,292],plastic(980,248,150,100,ddrLines)+plastic(980,408,150,100,ddrLines),label(1172,362,'U2  U3','CV',48,'start'),'CV: education, experience and skills',true,100);
  o+=comp('about',[60,604,396,234],place(28,690,0,barrel())+polycap(196,640,22,'220')+polycap(196,742,22,'220')+qfn(250,660,64,['U5','PMIC','5V  3A'])+inductor(340,628,56,'1R0')+inductor(340,704,56,'2R2')+mlcc(412,612,true,1.4)+mlcc(412,768,true,1.4)+T(60,636,10,'silk ref','5V IN'),label(262,790,'U5  PMIC','ABOUT',32),'About: who I am',true,200);
  const xs=[600,640,700,740,780,820];
  o+=comp('status',[578,752,264,60],ledRow(xs,772),ledLabels(xs,800),'Status LEDs',false);
  o+=sheen(b);
  return{vb:[0,0,1400,900],svg:o};
}

/* ================= Portrait board ================= */
function drawPortrait(){
  const b={x:30,y:30,w:740,h:1180,r:24};
  let o=base(b);
  o+=pour(42,918,350,280)+pour(470,960,290,236)+pour(42,500,140,410);
  o+=stitch(b,[[90,0,310,200],[420,40,180,90],[90,1080,140,160],[30,30,90,90],[680,30,100,90],[30,1120,90,100],[680,1120,100,100]]);
  o+=viaField(196,744,48,150,7,21)+viaField(600,822,140,36,6,23)+viaField(560,374,180,30,7,25)+viaField(44,300,40,140,5,27);

  o+=tr(diff([[150,112],[150,174]],1,6,0),3,'contact');
  o+=tr(diff([[300,178],[300,234]],4,6,15),3,'contact');
  o+=tr(bus([[300,286],[300,440]],12,7.5),2.6,'contact');
  o+=tr(bus([[150,220],[150,470],[196,516],[230,516]],4,8),3,'contact');
  o+=tr([[[554,264],[500,264],[470,294],[470,440]],[[554,276],[506,276],[482,300],[482,440]]],3,'blog');
  const ja=[];for(let i=0;i<8;i++){const x=484+i*8;ja.push([[x,104],[x,146+(i%2)*14]]);}
  o+=tr(ja,2.6);ja.forEach(l=>o+=via(l[1][0],l[1][1],2.6,true));
  o+=tr(lane(490,580,480,8,9),2.5,'cv')+tr(lane(490,580,660,8,9),2.5,'cv');
  o+=tr(bus([[490,570],[730,570]],6,7),2.3,'cv');
  o+=tr(bus([[388,766],[388,700]],4,8),2.6,'boot');
  o+=tr([[[440,700],[440,899],[540,999]],[[452,700],[452,871],[580,999]],[[464,700],[464,843],[620,999]],[[476,700],[476,815],[660,999]],[[488,700],[488,787],[700,999]],[[500,1006],[500,1034],[366,1034]]],2.5,'status');
  o+=via(366,1034,2.8,true);
  o+=tr([[[150,1110],[150,1022]]],14,'about');
  o+=tr([[[182,980],[238,980]],[[182,1006],[290,1006],[306,990]]],10,'about');
  o+=tr([[[258,950],[258,700]],[[328,950],[328,700]]],13,'about');

  [200,220,360,380,400,420].forEach(x=>o+=mlcc(x,398));[592,614,636,658].forEach(y=>o+=mlcc(168,y,false));
  o+=header(440,60,6,2)+T(430,90,12,'silk','JA','text-anchor="end"')+T(446,53,8,'silk ref','1');
  o+=soic(360,760,56,42,['QSPI','128Mb'])+T(388,828,9,'silk ref','U6','text-anchor="middle"');
  o+=tact(510,1066,36)+tact(570,1066,36)+tact(630,1066,36);
  ['PROG','BTN0','BTN1'].forEach((t,i)=>o+=T(528+i*60,1122,10,'silk ref',t,'text-anchor="middle"'));
  for(let i=0;i<4;i++)o+=res(728,553+i*8);
  o+=sticker(600,140,130,46,2);
  o+=titleBlock(56,790,.9)+T(56,868,8.5,'silk ref','94V-0  RoHS  6 LAYER');
  o+=hole(74,74)+hole(726,74)+hole(74,1166)+hole(726,1166);
  o+=fid(96,900)+fid(726,880);
  o+=tp(430,1150,'3V3')+tp(430,1182,'GND');

  o+=comp('contact',[100,34,366,270],place(150,12,90,usbc())+qfn(125,172,50,['U8','USB UART'])+place(300,8,90,rj45())+qfn(272,232,56,['U4','GbE PHY']),label(345,252,'J1 J2','CONTACT',30,'start'),'Contact: email, GitHub and LinkedIn',true,300);
  o+=comp('blog',[532,234,176,132],crystal(560,250,120,40)+mlcc(536,296,false)+mlcc(694,296,false),label(620,318,'Y1  100 MHz','BLOG',36),'Blog: build logs and notes',true,150);
  o+=comp('projects',[182,412,316,316],fpga(190,420,300),'','Projects: things I have built',true,0);
  o+=comp('cv',[562,414,190,392],plastic(580,430,140,100,ddrLines)+plastic(580,610,140,100,ddrLines),label(650,748,'U2  U3','CV',46),'CV: education, experience and skills',true,100);
  o+=comp('about',[96,926,290,272],place(150,1228,-90,barrel())+qfn(118,958,64,['U5','PMIC','5V  3A'])+inductor(230,940,56,'1R0')+inductor(300,940,56,'2R2')+polycap(250,1092,24,'220')+polycap(324,1092,24,'220')+T(200,1196,10,'silk ref','5V IN'),label(300,1152,'U5  PMIC','ABOUT',30),'About: who I am',true,200);
  const xs=[500,540,580,620,660,700];
  o+=comp('status',[478,984,244,58],ledRow(xs,1004),ledLabels(xs,1032),'Status LEDs',false);
  o+=sheen(b);
  return{vb:[0,0,800,1240],svg:o};
}

/* ================= App ================= */
const $=id=>document.getElementById(id);
const svg=$('board'),app=$('app'),sheet=$('sheet'),pageEl=$('page'),scrollEl=$('scroll'),bar=sheet.querySelector('.sheet-bar');
const rm=matchMedia('(prefers-reduced-motion: reduce)');
const portraitMQ=matchMedia('(max-width: 720px), (max-aspect-ratio: 5/6)');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const cssVar=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
let layout=null,baseVB=null,current=null,busy=false,hot=null,depth=0,openedFrom=null,needsRebuild=false,viaKeyboard=false;
const ledState={pwr:false,done:false,ld0:false,ld1:false,ld2:false,ld3:false,beat:false};

function setVB(b){svg.setAttribute('viewBox',`${n(b.x)} ${n(b.y)} ${n(b.w)} ${n(b.h)}`);}
function build(force){
  const name=portraitMQ.matches?'portrait':'landscape';
  if(name===layout&&!force)return;
  if(current&&!force){needsRebuild=true;return;}
  layout=name;needsRebuild=false;pulseSeed=0;hot=null;
  const spec=name==='portrait'?drawPortrait():drawLandscape();
  baseVB={x:spec.vb[0],y:spec.vb[1],w:spec.vb[2],h:spec.vb[3]};
  document.documentElement.dataset.layout=name;
  svg.innerHTML=defs()+spec.svg;setVB(baseVB);bind();applyLeds();
}
function bind(){
  svg.querySelectorAll('.comp').forEach(g=>{
    const k=g.dataset.key;
    g.addEventListener('pointerenter',()=>setHot(k));
    g.addEventListener('pointerleave',()=>setHot(null));
    if(g.classList.contains('static'))return;
    g.addEventListener('click',()=>go(k,{from:'board'}));
    g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();viaKeyboard=true;go(k,{from:'board'});}});
    g.addEventListener('focus',()=>setHot(k));
    g.addEventListener('blur',()=>setHot(null));
  });
}

/* hover + inspector */
function setHot(k){
  if(k===hot)return;
  if(hot){svg.querySelector('#c-'+hot)?.classList.remove('hot');svg.querySelectorAll(`.live[data-bus="${hot}"]`).forEach(g=>g.classList.remove('on'));document.querySelector(`.nav a[data-go="${hot}"]`)?.classList.remove('hot');}
  hot=k;
  if(k){svg.querySelector('#c-'+k)?.classList.add('hot');svg.querySelectorAll(`.live[data-bus="${k}"]`).forEach(g=>g.classList.add('on'));document.querySelector(`.nav a[data-go="${k}"]`)?.classList.add('hot');}
  if(!current)inspect(k);
}
function inspect(k){
  const d=k==='status'?STATUS:PAGES[k];
  $('insRef').textContent=d?d.ref:'';
  $('insTitle').textContent=d?d.title:'Select a component';
  $('insText').textContent=d?d.blurb:'Each labelled part of the board opens a page';
}
function sys(state,text){$('sysDot').classList.toggle('ok',state==='ok');$('sysText').textContent=text;}

/* camera */
function visibleBox(r){const s=Math.min(r.width/baseVB.w,r.height/baseVB.h),w=r.width/s,h=r.height/s;return{x:baseVB.x-(w-baseVB.w)/2,y:baseVB.y-(h-baseVB.h)/2,w,h};}
function targetBox(bb,r){const asp=r.width/r.height,fill=layout==='portrait'?.62:.5;let w=bb.width/fill,h=bb.height/fill;if(w/h>asp)h=w/asp;else w=h*asp;return{x:bb.x+bb.width/2-w/2,y:bb.y+bb.height/2-h/2,w,h};}
function mapRect(bb,to,r){const s=r.width/to.w,left=r.left+(bb.x-to.x)*s,top=r.top+(bb.y-to.y)*s,width=bb.width*s,height=bb.height*s;return{left,top,width,height,right:left+width,bottom:top+height};}
function animateVB(a,b,dur,mode){
  return new Promise(res=>{
    const ease=mode==='in'?t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2:t=>1-Math.pow(1-t,3);
    const la=Math.log(a.w),lb=Math.log(b.w),ra=a.h/a.w,rb=b.h/b.w;
    const F=mode==='in'?{x:b.x+b.w/2,y:b.y+b.h/2}:{x:a.x+a.w/2,y:a.y+a.h/2};
    const ref=mode==='in'?a:b,ux=(F.x-(ref.x+ref.w/2))/ref.w,uy=(F.y-(ref.y+ref.h/2))/ref.h;
    const t0=performance.now();
    const step=now=>{const t=Math.min(1,(now-t0)/dur),e=ease(t),w=Math.exp(la+(lb-la)*e),h=w*(ra+(rb-ra)*e),k=mode==='in'?1-e:e;setVB({x:F.x-ux*k*w-w/2,y:F.y-uy*k*h-h/2,w,h});if(t<1)requestAnimationFrame(step);else{setVB(b);res();}};
    requestAnimationFrame(step);
  });
}

/* sheet */
function insetOf(r){const W=innerWidth,H=innerHeight;return `inset(${n(Math.max(0,r.top))}px ${n(Math.max(0,W-r.right))}px ${n(Math.max(0,H-r.bottom))}px ${n(Math.max(0,r.left))}px round 10px)`;}
function showSheet(){sheet.hidden=false;document.body.classList.add('sheet-open');scrollEl.scrollTop=0;}
function hideSheet(){sheet.hidden=true;sheet.getAnimations().forEach(a=>a.cancel());[bar,pageEl].forEach(el=>el.getAnimations().forEach(a=>a.cancel()));document.body.classList.remove('sheet-open');}
async function reveal(rect,tint){
  showSheet();
  const a=sheet.animate([{clipPath:insetOf(rect),backgroundColor:tint},{clipPath:'inset(0px 0px 0px 0px round 0px)',backgroundColor:cssVar('--paper')}],{duration:340,easing:'cubic-bezier(.25,.8,.25,1)'});
  [bar,pageEl].forEach((el,i)=>el.animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'none'}],{duration:300,delay:150+i*50,easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'}));
  await a.finished;
}
async function collapse(rect,tint){
  [bar,pageEl].forEach(el=>el.animate([{opacity:1},{opacity:0}],{duration:110,fill:'forwards'}));
  await sheet.animate([{clipPath:'inset(0px 0px 0px 0px round 0px)',backgroundColor:cssVar('--paper')},{clipPath:insetOf(rect),backgroundColor:tint}],{duration:250,easing:'cubic-bezier(.55,0,.8,.3)',fill:'forwards'}).finished;
}
const isVisible=r=>r.width>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;

function renderPage(k,post){
  const t=$(post?'t-post-'+post:'t-'+k);
  pageEl.replaceChildren(t.content.cloneNode(true));
  pageEl.classList.toggle('article',!!post);
  $('crumb').textContent=post?'blog / fpga-homepage':k;
  $('pref').textContent=PAGES[k].ref;$('pname').textContent=PAGES[k].part;
  tick();
}
async function open(k,{from='board',el=null,instant=false,post=null}={}){
  busy=true;current=k;openedFrom={from,el};
  renderPage(k,post);
  app.classList.add('zooming');
  const reduce=rm.matches,comp=svg.querySelector('#c-'+k),parts=comp&&comp.querySelector('.parts');
  try{
    if(!instant&&!reduce&&from==='board'&&parts){
      setHot(k);
      const r=svg.getBoundingClientRect(),bb=parts.getBBox(),to=targetBox(bb,r);
      const zoom=animateVB(visibleBox(r),to,360,'in');
      await wait(220);
      await Promise.all([reveal(mapRect(bb,to,r),PAGES[k].tint),zoom]);
    }else if(!instant&&!reduce&&el){
      await reveal(el.getBoundingClientRect(),cssVar('--paper'));
    }else{
      showSheet();
      if(!instant)await sheet.animate([{opacity:0},{opacity:1}],{duration:reduce?160:220,easing:'ease-out'}).finished;
    }
  }finally{
    setHot(null);busy=false;
  }
  $('back').focus({preventScroll:true});
}
async function close(){
  if(!current||busy)return;
  busy=true;const k=current,reduce=rm.matches;
  if(needsRebuild)build(true);
  const comp=svg.querySelector('#c-'+k),parts=comp&&comp.querySelector('.parts');
  let done=false;
  try{
    if(!reduce&&openedFrom&&openedFrom.el&&isVisible(openedFrom.el.getBoundingClientRect())){
      await collapse(openedFrom.el.getBoundingClientRect(),cssVar('--paper'));hideSheet();setVB(baseVB);done=true;
    }else if(!reduce&&parts){
      const r=svg.getBoundingClientRect(),bb=parts.getBBox(),to=targetBox(bb,r);
      setVB(to);
      const chip=mapRect(bb,to,r);
      if(isVisible(chip)){await collapse(chip,PAGES[k].tint);hideSheet();await animateVB(to,visibleBox(r),340,'out');setVB(baseVB);done=true;}
    }
    if(!done){await sheet.animate([{opacity:1},{opacity:0}],{duration:reduce?140:200}).finished;hideSheet();setVB(baseVB);}
  }finally{
    if(!sheet.hidden)hideSheet();
    app.classList.remove('zooming');current=null;busy=false;inspect(hot);
  }
  if(viaKeyboard&&comp)comp.focus({preventScroll:true});
  viaKeyboard=false;
}
async function swap(k,push,post){
  if(busy)return;busy=true;
  try{
    if(push)pushHist(k);
    await pageEl.animate([{opacity:1},{opacity:0}],{duration:110,fill:'forwards'}).finished;
    current=k;renderPage(k,post);scrollEl.scrollTop=0;
    pageEl.getAnimations().forEach(a=>a.cancel());
    await pageEl.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:240,easing:'cubic-bezier(.2,.7,.2,1)'}).finished;
  }finally{busy=false;}
}

/* navigation + history */
function pushHist(k){try{history.pushState({p:k,d:depth+1},'','#'+k);depth++;}catch(e){}}
function go(k,opts={}){
  if(busy||!PAGES[k])return;
  if(current){if(current!==k||opts.post)swap(k,current!==k,opts.post);return;}
  pushHist(k);open(k,opts);
}
function backToBoard(){
  if(!current||busy)return;
  if(depth>0){const d=depth;depth=0;try{history.go(-d);}catch(e){}setTimeout(()=>{if(current&&!busy)close();},450);}
  else{try{history.replaceState(null,'',location.pathname+location.search);}catch(e){}close();}
}
function route(){
  if(busy){setTimeout(route,120);return;}
  depth=(history.state&&history.state.d)||0;
  const h=location.hash.slice(1);
  if(PAGES[h]){if(!current)open(h,{from:'board'});else if(current!==h)swap(h,false);}
  else if(current)close();
}
addEventListener('popstate',route);

document.addEventListener('click',e=>{
  const g=e.target.closest('[data-go]');
  if(g){e.preventDefault();const k=g.dataset.go;const fromIdx=!!g.closest('.index');go(k,{from:fromIdx?'el':'board',el:fromIdx?g:null,post:g.dataset.post||null});return;}
  const p=e.target.closest('[data-post]');
  if(p){e.preventDefault();swap('blog',false,p.dataset.post);return;}
  if(e.target.closest('[data-allposts]')){e.preventDefault();swap('blog',false);return;}
  const s=e.target.closest('[data-soon]');
  if(s){e.preventDefault();toast(s.dataset.soon);return;}
  const c=e.target.closest('[data-copy]');
  if(c){copy(c.dataset.copy);return;}
});
$('back').addEventListener('click',backToBoard);
$('home').addEventListener('click',e=>{e.preventDefault();backToBoard();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&current)backToBoard();});
document.querySelectorAll('.nav a').forEach(a=>{a.addEventListener('pointerenter',()=>setHot(a.dataset.go));a.addEventListener('pointerleave',()=>setHot(null));a.addEventListener('focus',()=>setHot(a.dataset.go));a.addEventListener('blur',()=>setHot(null));});

/* small things */
let toastTimer;
function toast(msg){const t=$('toast');t.textContent=msg;t.hidden=false;clearTimeout(toastTimer);t.animate([{opacity:0,transform:'translate(-50%,8px)'},{opacity:1,transform:'translate(-50%,0)'}],{duration:200,easing:'ease-out'});toastTimer=setTimeout(()=>{t.hidden=true;},2400);}
function copy(v){
  const ok=()=>toast('Copied '+v);
  const fallback=()=>{const el=$('emailVal');if(el){const r=document.createRange();r.selectNodeContents(el);const s=getSelection();s.removeAllRanges();s.addRange(r);}toast('Selected. Press Ctrl+C or ⌘C to copy');};
  try{navigator.clipboard.writeText(v).then(ok,fallback);}catch(e){fallback();}
}
const fmt=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',hour:'2-digit',minute:'2-digit'});
function tick(){const t=fmt.format(new Date());document.querySelectorAll('[data-clock]').forEach(el=>el.textContent=t);}
setInterval(tick,10000);

/* LEDs + power-on sequence */
function applyLeds(){svg.querySelectorAll('.led').forEach(g=>{const k=g.dataset.led;g.classList.toggle('on',!!ledState[k]);g.classList.toggle('beat',k==='ld0'&&ledState.beat);});}
function setLed(k,v){ledState[k]=v;applyLeds();}
async function powerOn(){
  if(rm.matches){Object.assign(ledState,{pwr:true,done:true,ld0:true,beat:true});applyLeds();sys('ok','FPGA configured');return;}
  await wait(250);setLed('pwr',true);sys('busy','Loading bitstream from flash');
  await wait(300);
  const boot=()=>svg.querySelectorAll('.live[data-bus="boot"]');
  boot().forEach(g=>g.classList.add('on'));
  await wait(1100);
  boot().forEach(g=>g.classList.remove('on'));
  setLed('done',true);sys('ok','FPGA configured');
  svg.classList.add('intro-run');setTimeout(()=>svg.classList.remove('intro-run'),1800);
  for(let r=0;r<2;r++)for(const k of['ld0','ld1','ld2','ld3']){setLed(k,true);await wait(65);setLed(k,false);}
  ledState.ld0=true;ledState.beat=true;applyLeds();
}

/* boot */
build();tick();
portraitMQ.addEventListener('change',()=>build());
const startHash=location.hash.slice(1);
if(PAGES[startHash])open(startHash,{instant:true});
powerOn();
})();
