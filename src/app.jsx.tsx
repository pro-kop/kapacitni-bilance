import React, { useState, useRef } from "react";

const uid = () => Math.random().toString(36).slice(2, 9);
const num = v => { const n = parseFloat(v); return isNaN(n) ? null : n; };

const defPart     = () => ({ id:uid(), nazev:"", weeklyQty:"", takt:40, nasobnost:2, oee:85, smena:12, poznamka:"" });
const defYT       = (yr="") => ({ id:uid(), year:yr, parts:[defPart()] });
const defMachine  = () => ({ id:uid(), tonaz:"", cisloLisu:"", yearTables:[defYT("")], changes:[], scenarios:[] });
const defChange   = () => ({ id:uid(), name:"", type:"navyseni", years:[], selectedParts:[], partName:"", weeklyQty:"", takt:40, nasobnost:2, oee:85, smena:12, poznamka:"" });
const defScenario = n => ({ id:uid(), name:`Scénář ${n}`, changeIds:[] });
const mLabel      = (m,i) => [m.tonaz, m.cisloLisu].filter(Boolean).join(" – ") || `Lis ${i+1}`;

function calcDays(wq,ta,na,oe,sm) {
  const q=num(wq),t=num(ta),n=num(na),o=num(oe),s=num(sm);
  if([q,t,n,o,s].some(v=>v===null||v===0)) return null;
  return q/((3600/t)*n*(o/100)*s*2);
}
const sumDays = parts => {
  const v=parts.map(p=>calcDays(p.weeklyQty,p.takt,p.nasobnost,p.oee,p.smena)).filter(x=>x!==null);
  return v.length ? v.reduce((a,b)=>a+b,0) : null;
};
const getYT = (m,yr) => (yr ? m.yearTables.find(t=>t.year===yr) : null) || m.yearTables[m.yearTables.length-1];

function projectScenario(machine,sc,yt) {
  const isPrimary=yt.id===machine.yearTables[0].id;
  const result=yt.parts.map(p=>({
    id:p.id, nazev:String(p.nazev||""),
    weeklyQty:num(p.weeklyQty)??0, takt:num(p.takt)??40,
    nasobnost:num(p.nasobnost)??2, oee:num(p.oee)??85,
    smena:num(p.smena)??12, poznamka:p.poznamka||"",
  }));
  for(const c of machine.changes.filter(c=>sc.changeIds.includes(c.id))) {
    const years=c.years||[];
    if(years.length===0){if(!isPrimary)continue;}
    else{if(!years.includes(yt.year))continue;}
    if(c.type==="novy") {
      result.push({id:"sc_new_"+c.id+"_"+yt.id, nazev:c.partName||"Nový díl",
        weeklyQty:num(c.weeklyQty)??0, takt:num(c.takt)??40, nasobnost:num(c.nasobnost)??2,
        oee:num(c.oee)??85, smena:num(c.smena)??12, poznamka:c.poznamka||"", _new:true});
    } else {
      for(const sp of(c.selectedParts||[])) {
        const tgt=String(sp.partName||"").trim().toLowerCase();
        for(let i=0;i<result.length;i++) {
          if(String(result[i].nazev||"").trim().toLowerCase()!==tgt) continue;
          const nQ=num(sp.weeklyQty),nT=num(sp.takt),nN=num(sp.nasobnost),nO=num(sp.oee);
          result[i]={...result[i],
            weeklyQty:nQ!==null?nQ:result[i].weeklyQty,
            takt:nT!==null?nT:result[i].takt,
            nasobnost:nN!==null?nN:result[i].nasobnost,
            oee:nO!==null?nO:result[i].oee,
            _modType:c.type};
          break;
        }
      }
    }
  }
  return result;
}

// ── Theme tokens ──────────────────────────────────────────────────────────
const darkT = {
  bg:"#121314", card:"#191a1b", card2:"#1e1f20", card3:"#232425",
  border:"rgba(255,255,255,0.06)", border2:"rgba(255,255,255,0.10)",
  txt:"#bfbfbf", txt2:"#808080", txt3:"#555555",
  accent:"#00a3ee", accentH:"#0070b6", accentBg:"rgba(0,163,238,0.10)",
  thBg:"#0f1011", dot:"#2a2b2c",
  al1:"rgba(0,163,238,0.10)", al2:"rgba(0,163,238,0.15)", al3:"rgba(0,163,238,0.25)",
  rowNew:"rgba(0,163,238,0.08)", rowUp:"rgba(52,211,153,0.07)", rowDown:"rgba(248,113,113,0.07)",
  dragRow:"rgba(0,163,238,0.10)",
};
const lightT = {
  bg:"#F8FAFC", card:"#FFFFFF", card2:"#F1F5F9", card3:"#E2E8F0",
  border:"rgba(0,0,0,0.07)", border2:"rgba(0,0,0,0.12)",
  txt:"#040D1A", txt2:"#334155", txt3:"#64748B",
  accent:"#00a3ee", accentH:"#0070b6", accentBg:"rgba(0,163,238,0.10)",
  thBg:"#E0F2FA", dot:"#CBD5E1",
  al1:"rgba(0,163,238,0.10)", al2:"rgba(0,163,238,0.15)", al3:"rgba(0,163,238,0.25)",
  rowNew:"rgba(0,163,238,0.10)", rowUp:"rgba(52,211,153,0.12)", rowDown:"rgba(248,113,113,0.10)",
  dragRow:"rgba(0,163,238,0.10)",
};

let D = darkT;

const pC  = p=>p==null?"#64748B":p<70?"#059669":p<90?"#D97706":"#DC2626";
const pB  = p=>p==null?"transparent":p<70?"rgba(16,185,129,0.12)":p<90?"rgba(245,158,11,0.12)":"rgba(239,68,68,0.12)";
const pDc = p=>p==null?"transparent":p<70?"rgba(16,185,129,0.35)":p<90?"rgba(245,158,11,0.35)":"rgba(239,68,68,0.35)";

const TC = { navyseni:"#10B981", snizeni:"#EF4444", novy:"#00a3ee" };
const TL = { navyseni:"▲ Navýšení", snizeni:"▼ Snížení", novy:"★ Nový projekt" };
const COLS = ["","Název dílu","Týd. ks","Vytíž. d/týd","Vytíž. %","Takt (s)","Násobnost","OEE (%)","Směna (h)","Poznámka",""];

const iB  = ()=>({border:"none",outline:"none",background:"transparent",color:D.txt,fontFamily:"inherit",padding:0});
const fB  = ()=>({border:"none",borderBottom:`1px solid ${D.border2}`,padding:"3px 0",fontSize:13,outline:"none",background:"transparent",color:D.txt,fontFamily:"inherit",width:"100%"});

const getCSS = ()=>`
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
  *{box-sizing:border-box;}
  input::placeholder{color:${D.txt3};font-style:italic}
  select option{background:${D.card2};color:${D.txt}}
  input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
  input[type=number]{-moz-appearance:textfield}
  .kb-wrap{padding:16px}
  @media(min-width:640px){.kb-wrap{padding:20px 32px}}
  .kb-tabs{display:flex;gap:2px;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:1px}
  .kb-tabs::-webkit-scrollbar{height:3px}
  .kb-tabs::-webkit-scrollbar-thumb{background:${D.al2};border-radius:2px}
  .btn-accent{background:${D.accent};color:#040D1A;border:none;border-radius:9px;font-weight:600;cursor:pointer;transition:background 0.15s;}
  .btn-accent:hover{background:${D.accentH};}
  .btn-ghost{background:transparent;border:0.5px solid ${D.accent};color:${D.accent};border-radius:9px;font-weight:500;cursor:pointer;transition:background 0.15s,color 0.15s,border-color 0.15s;}
  .btn-ghost:hover{background:${D.al1};color:${D.accentH};border-color:${D.accentH};}
  .btn-export{transition:background 0.15s,color 0.15s;}
  .btn-export:hover{background:${D.al1}!important;color:${D.accentH}!important;}
`;

// ── Sub-components ────────────────────────────────────────────────────────

function TH({label,right,center,rowSpan,colSpan}) {
  return (
    <th rowSpan={rowSpan} colSpan={colSpan} style={{
      padding:"9px 10px", background:D.thBg, color:D.accent,
      fontSize:11, fontWeight:600, letterSpacing:"0.04em",
      textAlign:center?"center":right?"right":"left",
      borderBottom:`1px solid ${D.al2}`, whiteSpace:"nowrap",
    }}>{label}</th>
  );
}

function PR({part,onUpd,onDel,ro,isDragging,dragCellProps}) {
  const d=calcDays(part.weeklyQty,part.takt,part.nasobnost,part.oee,part.smena);
  const p=d!==null?(d/7)*100:null;
  const bg=isDragging?D.dragRow:part._new?D.rowNew:part._modType==="navyseni"?D.rowUp:part._modType==="snizeni"?D.rowDown:D.card;
  const lb=part._new?`2px solid ${D.accent}`:part._modType==="navyseni"?"2px solid #10B981":part._modType==="snizeni"?"2px solid #EF4444":"none";
  const cv=`0.5px solid ${D.border}`;
  const f=(k,w)=>ro
    ?<span style={{fontSize:12.5,color:part[k]?D.txt:D.txt3,fontStyle:part[k]?"normal":"italic"}}>{part[k]||"—"}</span>
    :<input type="text" value={part[k]} placeholder={k} onChange={e=>onUpd({[k]:e.target.value})} style={{...iB(),width:w||"100%",fontSize:12.5}}/>;
  const nf=(k,w)=>ro
    ?<span style={{fontSize:12.5,color:D.txt2,textAlign:"right",display:"block"}}>{part[k]}</span>
    :<input type="number" value={part[k]} placeholder={k} onChange={e=>onUpd({[k]:e.target.value})} style={{...iB(),width:w||55,fontSize:12.5,textAlign:"right"}}/>;
  return (
    <tr style={{background:bg,borderBottom:`0.5px solid ${D.border}`,borderLeft:lb,opacity:isDragging?0.45:1}}>
      <td {...(dragCellProps||{})} style={{width:18,padding:"0 4px",borderRight:cv,cursor:ro?"default":"grab",userSelect:"none",background:"inherit",textAlign:"center"}}>
        {!ro&&<span style={{display:"block",width:"100%",minHeight:28,lineHeight:"28px",fontSize:13,color:D.txt3,pointerEvents:"none"}}>⠿</span>}
      </td>
      <td style={{padding:"7px 10px",minWidth:120,borderRight:cv}}>{f("nazev")}</td>
      <td style={{padding:"7px 10px",borderRight:cv}}>{nf("weeklyQty",68)}</td>
      <td style={{padding:"7px 10px",fontWeight:500,color:pC(p),textAlign:"right",borderRight:cv}}>{d!==null?d.toFixed(2):<span style={{color:D.txt3}}>—</span>}</td>
      <td style={{padding:"7px 10px",borderRight:cv}}>
        {p!==null?<span style={{display:"inline-block",padding:"2px 9px",borderRadius:9,fontSize:11.5,fontWeight:500,background:pB(p),color:pC(p),border:`0.5px solid ${pDc(p)}`}}>{p.toFixed(1)}%</span>:<span style={{color:D.txt3}}>—</span>}
      </td>
      <td style={{padding:"7px 10px",borderRight:cv}}>{nf("takt",45)}</td>
      <td style={{padding:"7px 10px",borderRight:cv}}>{nf("nasobnost",38)}</td>
      <td style={{padding:"7px 10px",borderRight:cv}}>{nf("oee",42)}</td>
      <td style={{padding:"7px 10px",borderRight:cv}}>{nf("smena",38)}</td>
      <td style={{padding:"7px 10px",minWidth:90,borderRight:cv}}>{f("poznamka")}</td>
      <td style={{padding:"7px 8px",width:32}}>
        {!ro&&onDel&&<button onClick={onDel} style={{background:"rgba(239,68,68,0.1)",color:"#EF4444",border:"0.5px solid rgba(239,68,68,0.3)",borderRadius:5,padding:"2px 7px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>✕</button>}
      </td>
    </tr>
  );
}

function SumRow({parts}) {
  const d=sumDays(parts); const p=d!==null?(d/7)*100:null;
  return (
    <tr style={{background:p!==null?pB(p):D.card2,borderTop:`1px solid ${D.al2}`}}>
      <td style={{padding:"9px 8px",width:18}}/>
      <td colSpan={2} style={{padding:"9px 10px",fontWeight:600,color:D.accent,fontSize:12,letterSpacing:"0.06em"}}>CELKEM</td>
      <td style={{padding:"9px 10px",fontWeight:600,color:pC(p),textAlign:"right"}}>{d!==null?d.toFixed(2):<span style={{color:D.txt3}}>—</span>}</td>
      <td style={{padding:"9px 10px"}}>{p!==null&&<span style={{display:"inline-block",padding:"3px 10px",borderRadius:9,fontSize:12,fontWeight:600,background:pB(p),color:pC(p),border:`0.5px solid ${pDc(p)}`}}>{p.toFixed(1)}%</span>}</td>
      <td colSpan={6} style={{padding:"9px 10px"}}/>
    </tr>
  );
}

function PartTable({yt,onUpdPart,onDelPart,onAddPart,onReorder}) {
  const dragFrom=useRef(null);
  const [dragOver,setDragOver]=useState(null);
  return (
    <div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12.5}}>
          <thead><tr>{COLS.map((h,i)=><TH key={i} label={h} right={i===3}/>)}</tr></thead>
          <tbody>
            {yt.parts.map((p,i)=>(
              <PR key={p.id} part={p}
                onUpd={patch=>onUpdPart(p.id,patch)}
                onDel={yt.parts.length>1?()=>onDelPart(p.id):null}
                isDragging={dragOver===i&&dragFrom.current!==null&&dragFrom.current!==i}
                dragCellProps={{
                  draggable:true,
                  onDragStart:e=>{dragFrom.current=i;e.dataTransfer.effectAllowed="move";},
                  onDragOver:e=>{e.preventDefault();if(dragOver!==i)setDragOver(i);},
                  onDragEnd:()=>{dragFrom.current=null;setDragOver(null);},
                  onDrop:e=>{
                    e.preventDefault();
                    const from=dragFrom.current;
                    if(from===null||from===i){dragFrom.current=null;setDragOver(null);return;}
                    const arr=[...yt.parts];const[moved]=arr.splice(from,1);arr.splice(i,0,moved);
                    onReorder(arr);dragFrom.current=null;setDragOver(null);
                  },
                }}/>
            ))}
            <SumRow parts={yt.parts}/>
          </tbody>
        </table>
      </div>
      <div style={{padding:"10px 16px"}}>
        <BtnPrimary onClick={onAddPart} s={{fontSize:12,padding:"5px 13px"}}>+ Přidat díl</BtnPrimary>
      </div>
    </div>
  );
}

function BtnPrimary({onClick,children,s={}}) {
  return <button onClick={onClick} className="btn-accent" style={{padding:"7px 16px",fontSize:13,fontFamily:"inherit",...s}}>{children}</button>;
}
function BtnGhost({onClick,children,s={}}) {
  return <button onClick={onClick} className="btn-ghost" style={{padding:"6px 14px",fontSize:12.5,fontFamily:"inherit",...s}}>{children}</button>;
}
function BtnDanger({onClick,children,s={}}) {
  return <button onClick={onClick} style={{background:"rgba(239,68,68,0.08)",color:"#EF4444",border:"0.5px solid rgba(239,68,68,0.3)",borderRadius:9,padding:"5px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit",...s}}>{children}</button>;
}
function FB({label,children,w}) {
  return (
    <div style={{display:"flex",flexDirection:"column",width:w||"auto"}}>
      <span style={{fontSize:11,color:D.txt2,fontWeight:500,display:"block",marginBottom:4}}>{label}</span>
      {children}
    </div>
  );
}
function PctBadge({p,small}) {
  if(p===null) return <span style={{color:D.txt3}}>—</span>;
  return <span style={{display:"inline-block",padding:small?"1px 7px":"2px 9px",borderRadius:9,fontSize:small?10.5:11.5,fontWeight:500,background:pB(p),color:pC(p),border:`0.5px solid ${pDc(p)}`}}>{p.toFixed(1)}%</span>;
}
function LinkCell({text,onClick,tdStyle}) {
  return (
    <td style={{...tdStyle,minWidth:80}}>
      {text
        ?<span onClick={onClick} style={{color:D.accent,cursor:"pointer",textDecoration:"underline",textDecorationStyle:"dotted",textUnderlineOffset:3,fontSize:12.5}}>{text}</span>
        :<span style={{color:D.txt3,fontStyle:"italic"}}>—</span>}
    </td>
  );
}

// ── Summary view ──────────────────────────────────────────────────────────
function SummaryView({machines,onGoTo}) {
  const allYears=[...new Set(machines.flatMap(m=>m.yearTables.map(yt=>yt.year)).filter(y=>y))].sort();
  const showYears=allYears.length>0?allYears:[""];
  const multi=allYears.length>0;
  const groups={},order=[];
  machines.forEach(m=>{const k=m.tonaz||"—";if(!groups[k]){groups[k]=[];order.push(k);}groups[k].push(m);});
  const td={padding:"8px 10px",borderBottom:`0.5px solid ${D.border}`,verticalAlign:"middle"};
  const thS=(extra={})=>({padding:"9px 10px",background:D.thBg,color:D.accent,fontSize:11,fontWeight:600,textAlign:"left",borderBottom:`1px solid ${D.al2}`,whiteSpace:"nowrap",...extra});
  return (
    <div style={{background:D.card,borderRadius:12,border:`0.5px solid ${D.border}`,overflow:"hidden"}}>
      <div style={{padding:"14px 18px",borderBottom:`0.5px solid ${D.border}`}}>
        <span style={{fontSize:14,fontWeight:600,color:D.txt}}>Souhrn vytížení</span>
        <span style={{fontSize:12,color:D.txt2,marginLeft:8}}>agregováno dle tonážní skupiny</span>
      </div>
      {machines.length===0
        ?<div style={{padding:"24px 18px",color:D.txt2,fontSize:13}}>Žádné lisy.</div>
        :<div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12.5}}>
            <thead>
              {multi&&<tr>
                <th rowSpan={2} style={thS()}>Tonáž</th>
                <th rowSpan={2} style={thS()}>Číslo lisu</th>
                {showYears.map((y,i)=><th key={y} colSpan={3} style={thS({textAlign:"center",fontWeight:700,borderLeft:i>0?`0.5px solid ${D.al1}`:"none"})}>{y}</th>)}
              </tr>}
              <tr>
                {!multi&&<><TH label="Tonáž"/><TH label="Číslo lisu"/></>}
                {showYears.map((y,yi)=>[
                  <th key={y+"d"} style={thS({fontSize:10.5,fontWeight:500,textAlign:"right",borderLeft:yi>0?`0.5px solid ${D.al1}`:"none"})}>d/týd</th>,
                  <th key={y+"p"} style={thS({fontSize:10.5,fontWeight:500})}>Vytíž. %</th>,
                  <th key={y+"s"} style={thS({fontSize:10.5,fontWeight:500,textAlign:"center",borderRight:`0.5px solid ${D.al1}`})}>Σ ton.</th>,
                ])}
              </tr>
            </thead>
            <tbody>
              {order.flatMap(tk=>{
                const grp=groups[tk];
                return grp.map((m,mi)=>(
                  <tr key={m.id} style={{background:mi%2===0?D.card:D.card2}}>
                    {mi===0&&<td rowSpan={grp.length} style={{...td,fontWeight:600,color:D.txt,background:D.card2,borderRight:`0.5px solid ${D.border}`,fontSize:13,minWidth:80}}>{tk==="—"?<span style={{color:D.txt3,fontStyle:"italic"}}>—</span>:tk}</td>}
                    <LinkCell text={m.cisloLisu} onClick={()=>onGoTo(machines.indexOf(m))} tdStyle={td}/>
                    {showYears.flatMap((y,yi)=>{
                      const yt=getYT(m,y),fb=!!(y&&!m.yearTables.find(t=>t.year===y));
                      const d=sumDays(yt.parts),p=d?(d/7)*100:null;
                      const gs=grp.reduce((s,gm)=>{const gd=sumDays(getYT(gm,y).parts);return s+(gd?(gd/7)*100:0);},0);
                      return [
                        <td key={y+"d"+m.id} style={{...td,fontWeight:500,color:fb?D.txt2:pC(p),textAlign:"right",borderLeft:yi>0?`0.5px solid ${D.border}`:"none"}}>
                          {d?<span>{d.toFixed(2)}{fb&&<span style={{color:D.txt3,fontSize:9}}> ✱</span>}</span>:<span style={{color:D.txt3}}>—</span>}
                        </td>,
                        <td key={y+"p"+m.id} style={td}>
                          {p!==null?<span style={{display:"inline-block",padding:"2px 8px",borderRadius:9,fontSize:11,fontWeight:500,background:fb?D.card3:pB(p),color:fb?D.txt2:pC(p),border:`0.5px solid ${fb?D.border2:pDc(p)}`,opacity:fb?0.65:1}}>{p.toFixed(1)}%{fb?" ✱":""}</span>:<span style={{color:D.txt3}}>—</span>}
                        </td>,
                        mi===0?<td key={y+"s"+tk} rowSpan={grp.length} style={{...td,textAlign:"center",background:D.card2,borderLeft:`0.5px solid ${D.border}`}}>
                          <PctBadge p={gs/grp.length}/>
                          {grp.length>1&&<div style={{fontSize:10,color:D.txt2,marginTop:2}}>{grp.length} lisů</div>}
                        </td>:null,
                      ];
                    })}
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>}
    </div>
  );
}

// ── Projection view ───────────────────────────────────────────────────────
function ProjectionView({machines,onGoTo}) {
  const allYears=[...new Set(machines.flatMap(m=>m.yearTables.map(yt=>yt.year)).filter(y=>y))].sort();
  const showYears=allYears.length>0?allYears:[""];
  const scNamesSeen=new Set(),scNames=[];
  machines.forEach(m=>m.scenarios.forEach(s=>{if(!scNamesSeen.has(s.name)){scNamesSeen.add(s.name);scNames.push(s.name);}}));
  const groups={},order=[];
  machines.forEach(m=>{const k=m.tonaz||"—";if(!groups[k]){groups[k]=[];order.push(k);}groups[k].push(m);});
  const td={padding:"7px 8px",borderBottom:`0.5px solid ${D.border}`,verticalAlign:"middle"};
  const yearSpan=scNames.length*3||1;
  const getLoad=(machine,yearStr,scName)=>{
    const sc=machine.scenarios.find(s=>s.name===scName);
    if(!sc) return null;
    const yt=getYT(machine,yearStr);
    const parts=projectScenario(machine,sc,yt);
    const d=sumDays(parts);
    return d?{d,p:(d/7)*100}:null;
  };
  const thS=(extra={})=>({padding:"8px 10px",background:D.thBg,color:D.accent,fontSize:11,fontWeight:600,borderBottom:`1px solid ${D.al2}`,whiteSpace:"nowrap",...extra});
  return (
    <div style={{background:D.card,borderRadius:12,border:`0.5px solid ${D.border}`,overflow:"hidden"}}>
      <div style={{padding:"14px 18px",borderBottom:`0.5px solid ${D.border}`}}>
        <span style={{fontSize:14,fontWeight:600,color:D.txt}}>Projekce kapacity</span>
        <span style={{fontSize:12,color:D.txt2,marginLeft:8}}>sumarizace scénářů dle tonážních skupin a let</span>
      </div>
      {scNames.length===0
        ?<div style={{padding:"24px 18px",color:D.txt2,fontSize:13}}>Žádné scénáře.</div>
        :<div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr>
                <th rowSpan={3} style={thS({textAlign:"left",minWidth:80})}>Tonáž</th>
                <th rowSpan={3} style={thS({textAlign:"left",minWidth:80})}>Číslo lisu</th>
                {showYears.map((y,yi)=>(
                  <th key={y} colSpan={yearSpan} style={thS({fontWeight:700,textAlign:"center",borderLeft:`0.5px solid ${D.al3}`})}>{y||"—"}</th>
                ))}
              </tr>
              <tr>
                {showYears.flatMap(y=>scNames.map(sn=>(
                  <th key={y+sn} colSpan={3} style={thS({fontSize:10.5,fontWeight:500,textAlign:"center",borderLeft:`0.5px solid ${D.al1}`})}>{sn}</th>
                )))}
              </tr>
              <tr>
                {showYears.flatMap(y=>scNames.flatMap(sn=>[
                  <th key={y+sn+"d"} style={thS({fontSize:10,fontWeight:500,textAlign:"right",borderLeft:`0.5px solid ${D.al1}`})}>d/týd</th>,
                  <th key={y+sn+"p"} style={thS({fontSize:10,fontWeight:500,textAlign:"center"})}>Vytíž. %</th>,
                  <th key={y+sn+"s"} style={thS({fontSize:10,fontWeight:500,textAlign:"center",borderRight:`0.5px solid ${D.al1}`})}>Σ ton.</th>,
                ]))}
              </tr>
            </thead>
            <tbody>
              {order.flatMap(tk=>{
                const grp=groups[tk];
                return grp.map((m,mi)=>(
                  <tr key={m.id} style={{background:mi%2===0?D.card:D.card2}}>
                    {mi===0&&<td rowSpan={grp.length} style={{...td,fontWeight:600,color:D.txt,background:D.card2,borderRight:`0.5px solid ${D.border}`,fontSize:13}}>{tk==="—"?<span style={{color:D.txt3,fontStyle:"italic"}}>—</span>:tk}</td>}
                    <LinkCell text={m.cisloLisu} onClick={()=>onGoTo(machines.indexOf(m))} tdStyle={td}/>
                    {showYears.flatMap(y=>scNames.flatMap((sn)=>{
                      const load=getLoad(m,y,sn);
                      const gs=mi===0?grp.reduce((s,gm)=>{const l=getLoad(gm,y,sn);return s+(l?l.p:0);},0):0;
                      return [
                        <td key={y+sn+"d"+m.id} style={{...td,textAlign:"right",fontWeight:500,color:load?pC(load.p):D.txt3,borderLeft:`0.5px solid ${D.border}`}}>{load?load.d.toFixed(2):"—"}</td>,
                        <td key={y+sn+"p"+m.id} style={{...td,textAlign:"center"}}>{load?<PctBadge p={load.p} small/>:<span style={{color:D.txt3}}>—</span>}</td>,
                        mi===0?<td key={y+sn+"s"+tk} rowSpan={grp.length} style={{...td,textAlign:"center",background:D.card2,borderLeft:`0.5px solid ${D.border}`}}>
                          <PctBadge p={gs/grp.length} small/>
                          {grp.length>1&&<div style={{fontSize:9.5,color:D.txt2,marginTop:2}}>{grp.length} lisů</div>}
                        </td>:null,
                      ];
                    }))}
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>}
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────
export default function App() {
  const [machines,setMachines]=useState([defMachine()]);
  const [ai,setAi]=useState(0);
  const [view,setView]=useState("base");
  const [darkMode,setDarkMode]=useState(true);
  const dragIdx=useRef(null);

  D = darkMode ? darkT : lightT;

  const isSummary=ai===-1, isProjection=ai===-2;
  const m=(isSummary||isProjection)?null:machines[Math.min(ai,machines.length-1)];
  const setM=(id,p)=>setMachines(ms=>ms.map(x=>x.id===id?{...x,...p}:x));
  const onGoTo=idx=>{setAi(idx);setView("base");};

  const handleDrop=toIdx=>{
    const from=dragIdx.current;
    if(from===null||from===toIdx) return;
    const arr=[...machines];const[moved]=arr.splice(from,1);arr.splice(toIdx,0,moved);
    setMachines(arr);
    const am=machines[ai];if(am)setAi(arr.findIndex(x=>x.id===am.id));
    dragIdx.current=null;
  };

  const updYT     = (ytId,p) => setM(m.id,{yearTables:m.yearTables.map(yt=>yt.id===ytId?{...yt,...p}:yt)});
  const addYT     = () => { const last=m.yearTables[m.yearTables.length-1]; setM(m.id,{yearTables:[...m.yearTables,{id:uid(),year:"",parts:last.parts.map(p=>({...p,id:uid()}))}]}); };
  const delYT     = ytId => setM(m.id,{yearTables:m.yearTables.filter(yt=>yt.id!==ytId)});
  const updYTPart = (ytId,pid,p) => { const yt=m.yearTables.find(t=>t.id===ytId); updYT(ytId,{parts:yt.parts.map(x=>x.id===pid?{...x,...p}:x)}); };
  const delYTPart = (ytId,pid) => { const yt=m.yearTables.find(t=>t.id===ytId); updYT(ytId,{parts:yt.parts.filter(x=>x.id!==pid)}); };
  const addYTPart = ytId => { const yt=m.yearTables.find(t=>t.id===ytId); updYT(ytId,{parts:[...yt.parts,defPart()]}); };
  const updChange = (cid,p) => setM(m.id,{changes:m.changes.map(c=>c.id===cid?{...c,...p}:c)});
  const updScene  = (sid,p) => setM(m.id,{scenarios:m.scenarios.map(s=>s.id===sid?{...s,...p}:s)});

  const allPartNames=[...new Set((m?.yearTables||[]).flatMap(yt=>yt.parts.map(p=>p.nazev)).filter(n=>n))];
  const allPartsFlat=(m?.yearTables||[]).flatMap(yt=>yt.parts);
  const selSt={border:`0.5px solid ${D.border2}`,borderRadius:9,padding:"5px 8px",fontSize:12.5,outline:"none",background:D.card3,color:D.txt,fontFamily:"inherit",width:"100%",cursor:"pointer"};
  const dotBg={background:D.bg,backgroundImage:`radial-gradient(${D.dot} 1px, transparent 1px)`,backgroundSize:"28px 28px"};

  return (
    <div style={{fontFamily:"'Space Grotesk',-apple-system,BlinkMacSystemFont,sans-serif",...dotBg,minHeight:"100vh",color:D.txt}}>
      <style>{getCSS()}</style>

      {/* top bar */}
      <div style={{background:darkMode?`${D.card}E6`:`${D.card}F2`,backdropFilter:"blur(8px)",borderBottom:`0.5px solid ${D.border}`,padding:"14px 0 0",position:"sticky",top:0,zIndex:10}}>
        <div style={{padding:"0 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:18}}>📊</span>
              <span style={{fontSize:16,fontWeight:700,color:D.txt,letterSpacing:"-0.01em"}}>Kapacitní bilance</span>
              <span style={{fontSize:11,color:D.txt3,padding:"2px 8px",border:`0.5px solid ${D.border2}`,borderRadius:5,letterSpacing:"0.04em"}}>VSTŘIKOLISY</span>
            </div>
            <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
              <button onClick={()=>setDarkMode(d=>!d)} title={darkMode?"Světlý režim":"Tmavý režim"}
                style={{background:D.card2,color:D.txt2,border:`0.5px solid ${D.border2}`,borderRadius:9,padding:"5px 10px",fontSize:15,cursor:"pointer",fontFamily:"inherit",lineHeight:1}}>
                {darkMode?"☀️":"🌙"}
              </button>
              <button onClick={()=>{
                const blob=new Blob([JSON.stringify(machines,null,2)],{type:"application/json"});
                const url=URL.createObjectURL(blob);const a=document.createElement("a");
                a.href=url;a.download=`kapacitni-bilance-${new Date().toISOString().slice(0,10)}.json`;
                a.click();URL.revokeObjectURL(url);
              }} className="btn-export" style={{background:D.accentBg,color:D.accent,border:`0.5px solid ${D.al2}`,borderRadius:9,padding:"5px 14px",fontSize:12.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
                ↓ Export
              </button>
              <label className="btn-export" style={{background:D.accentBg,color:D.accent,border:`0.5px solid ${D.al2}`,borderRadius:9,padding:"5px 14px",fontSize:12.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
                ↑ Import
                <input type="file" accept=".json" style={{display:"none"}} onChange={e=>{
                  const file=e.target.files[0];if(!file)return;
                  const reader=new FileReader();
                  reader.onload=ev=>{try{const d=JSON.parse(ev.target.result);if(Array.isArray(d)){setMachines(d);setAi(0);setView("base");}else alert("Neplatný soubor.");}catch{alert("Chyba při čtení souboru.");}};
                  reader.readAsText(file);e.target.value="";
                }}/>
              </label>
            </div>
          </div>
        </div>
        <div className="kb-tabs" style={{padding:"0 16px"}}>
          {[[-1,"∑ Souhrn"],[-2,"↗ Projekce"]].map(([idx,lbl])=>(
            <button key={idx} onClick={()=>setAi(idx)} style={{padding:"8px 16px",fontSize:13,fontWeight:ai===idx?600:400,cursor:"pointer",background:"transparent",color:ai===idx?D.accent:D.txt2,border:"none",borderRadius:"5px 5px 0 0",outline:"none",whiteSpace:"nowrap",fontFamily:"inherit",borderBottom:ai===idx?`2px solid ${D.accent}`:"2px solid transparent",flexShrink:0}}>
              {lbl}
            </button>
          ))}
          <div style={{width:"0.5px",background:D.border,margin:"6px 4px 0",flexShrink:0}}/>
          {machines.map((mc,i)=>(
            <button key={mc.id} draggable
              onDragStart={()=>{dragIdx.current=i;}} onDragOver={e=>e.preventDefault()} onDrop={()=>handleDrop(i)}
              onClick={()=>{setAi(i);setView("base");}}
              style={{padding:"8px 16px",fontSize:13,fontWeight:i===ai?600:400,cursor:"grab",background:i===ai?D.accent:"transparent",color:i===ai?"#040D1A":D.txt2,border:"none",borderRadius:"5px 5px 0 0",outline:"none",whiteSpace:"nowrap",fontFamily:"inherit",userSelect:"none",flexShrink:0,borderBottom:i===ai?"none":"2px solid transparent"}}>
              {mLabel(mc,i)}
            </button>
          ))}
          <button onClick={()=>{const nm=defMachine();setMachines(ms=>[...ms,nm]);setAi(machines.length);}}
            style={{padding:"8px 14px",fontSize:18,cursor:"pointer",background:"transparent",color:D.accent,border:"none",outline:"none",borderRadius:"5px 5px 0 0",fontFamily:"inherit",flexShrink:0}}>＋</button>
        </div>
      </div>

      <div className="kb-wrap">
        {isSummary    && <SummaryView    machines={machines} onGoTo={onGoTo}/>}
        {isProjection && <ProjectionView machines={machines} onGoTo={onGoTo}/>}

        {!isSummary&&!isProjection&&m&&(
          <div>
            {/* machine meta */}
            <div style={{display:"flex",alignItems:"flex-end",gap:12,marginBottom:16,flexWrap:"wrap"}}>
              {[["Tonáž","tonaz","400 T",110],["Číslo lisu","cisloLisu","LIS-01",130]].map(([lbl,k,ph,w])=>(
                <FB key={k} label={lbl} w={w}>
                  <input style={{...fB(),fontSize:14,fontWeight:600,textTransform:"uppercase"}} value={m[k]} onChange={e=>setM(m.id,{[k]:e.target.value.toUpperCase()})} placeholder={ph}/>
                </FB>
              ))}
              <FB label="Rok" w={90}>
                <input style={{...fB(),fontSize:14,fontWeight:600}} value={m.yearTables[0].year} onChange={e=>updYT(m.yearTables[0].id,{year:e.target.value})} placeholder="2024"/>
              </FB>
              <div style={{marginLeft:"auto"}}>
                {machines.length>1&&<BtnDanger onClick={()=>{const nm=machines.filter((_,i)=>i!==ai);setMachines(nm);setAi(Math.min(ai,nm.length-1));}}>Smazat lis</BtnDanger>}
              </div>
            </div>

            {/* segment switcher */}
            <div style={{display:"flex",background:D.card,padding:"3px",borderRadius:9,width:"fit-content",marginBottom:16,border:`0.5px solid ${D.border}`}}>
              {[["base","Potvrzená kapacita"],["planning","Kapacitní plánování"]].map(([k,lbl])=>(
                <button key={k} onClick={()=>setView(k)} style={{padding:"7px 18px",fontSize:13,fontWeight:view===k?600:400,cursor:"pointer",background:view===k?D.accent:"transparent",color:view===k?"#040D1A":D.txt2,border:"none",borderRadius:7,outline:"none",fontFamily:"inherit",transition:"background 0.15s"}}>
                  {lbl}
                </button>
              ))}
            </div>

            {/* ── BASE VIEW ── */}
            {view==="base"&&(
              <div>
                {m.yearTables.map((yt,yti)=>(
                  <div key={yt.id} style={{background:D.card,borderRadius:12,border:`0.5px solid ${D.border}`,overflow:"hidden",marginBottom:12}}>
                    <div style={{padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`0.5px solid ${D.border}`,background:D.card2}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        {yti===0
                          ?<span style={{fontSize:13,color:D.txt2,fontWeight:500}}>Standardní výroba{yt.year&&<span style={{color:D.accent,fontWeight:600,marginLeft:8}}>{yt.year}</span>}</span>
                          :<div style={{display:"flex",alignItems:"center",gap:8}}>
                              <span style={{fontSize:12,color:D.txt2,fontWeight:500}}>Rok</span>
                              <input style={{...fB(),width:80,fontWeight:600}} value={yt.year} onChange={e=>updYT(yt.id,{year:e.target.value})} placeholder="2025"/>
                            </div>}
                      </div>
                      {yti>0&&<BtnDanger onClick={()=>delYT(yt.id)} s={{fontSize:11,padding:"3px 10px"}}>✕ Smazat rok</BtnDanger>}
                    </div>
                    <PartTable yt={yt} onUpdPart={(pid,p)=>updYTPart(yt.id,pid,p)} onDelPart={pid=>delYTPart(yt.id,pid)} onAddPart={()=>addYTPart(yt.id)} onReorder={parts=>updYT(yt.id,{parts})}/>
                  </div>
                ))}
                <div style={{paddingBottom:8}}><BtnGhost onClick={addYT}>＋ Přidat nový rok</BtnGhost></div>
              </div>
            )}

            {/* ── PLANNING VIEW ── */}
            {view==="planning"&&(
              <div>
                {/* changes */}
                <div style={{background:D.card,borderRadius:12,border:`0.5px solid ${D.border}`,overflow:"hidden",marginBottom:14}}>
                  <div style={{padding:"12px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`0.5px solid ${D.border}`,flexWrap:"wrap",gap:8}}>
                    <div>
                      <span style={{fontSize:14,fontWeight:600,color:D.txt}}>Zákaznické poptávky & změny</span>
                      <span style={{fontSize:12,color:D.txt2,marginLeft:8}}>pool změn pro scénáře</span>
                    </div>
                    <BtnPrimary onClick={()=>setM(m.id,{changes:[...m.changes,defChange()]})}>+ Přidat poptávku</BtnPrimary>
                  </div>
                  {m.changes.length===0
                    ?<div style={{padding:"20px 18px",color:D.txt2,fontSize:13}}>Žádné poptávky.</div>
                    :<div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:10}}>
                      {m.changes.map(c=>(
                        <div key={c.id} style={{background:D.card2,borderRadius:12,padding:"12px 14px",border:`0.5px solid ${D.border}`,borderLeft:`2px solid ${TC[c.type]}`}}>
                          <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end",marginBottom:10}}>
                            <FB label="Název poptávky" w={140}><input style={fB()} value={c.name} placeholder="poptávka" onChange={e=>updChange(c.id,{name:e.target.value})}/></FB>
                            <FB label="Typ změny">
                              <select value={c.type} onChange={e=>updChange(c.id,{type:e.target.value})} style={{...selSt,color:TC[c.type],fontWeight:600,width:"auto"}}>
                                <option value="navyseni">▲ Navýšení</option>
                                <option value="snizeni">▼ Snížení</option>
                                <option value="novy">★ Nový projekt</option>
                              </select>
                            </FB>
                            <FB label="Roky změny">
                              <div style={{display:"flex",gap:5,flexWrap:"wrap",paddingTop:4}}>
                                {m.yearTables.filter(yt=>yt.year).length===0
                                  ?<span style={{fontSize:11.5,color:D.txt3,fontStyle:"italic"}}>Nejprve zadejte rok</span>
                                  :m.yearTables.filter(yt=>yt.year).map(yt=>{
                                    const on=(c.years||[]).includes(yt.year);
                                    return <button key={yt.id} onClick={()=>updChange(c.id,{years:on?(c.years||[]).filter(y=>y!==yt.year):[...(c.years||[]),yt.year]})}
                                      style={{padding:"3px 12px",borderRadius:9,fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit",background:on?D.accentBg:"transparent",color:on?D.accent:D.txt2,border:`0.5px solid ${on?D.accent:D.border2}`,outline:"none"}}>{yt.year}</button>;
                                  })}
                                {m.yearTables.filter(yt=>yt.year).length>0&&(c.years||[]).length===0&&<span style={{fontSize:11,color:D.txt3,alignSelf:"center"}}>(žádný = primární rok)</span>}
                              </div>
                            </FB>
                            <div style={{marginLeft:"auto"}}><BtnDanger onClick={()=>setM(m.id,{changes:m.changes.filter(x=>x.id!==c.id)})}>✕</BtnDanger></div>
                          </div>

                          {c.type==="novy"&&(
                            <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end",background:D.card3,borderRadius:9,padding:"10px 12px"}}>
                              <FB label="Název nového dílu" w={160}><input style={fB()} value={c.partName||""} placeholder="název dílu" onChange={e=>updChange(c.id,{partName:e.target.value})}/></FB>
                              {[["Týd. ks","weeklyQty",75],["Takt (s)","takt",60],["Násobnost","nasobnost",65],["OEE (%)","oee",60],["Směna (h)","smena",65]].map(([lbl,k,w])=>(
                                <FB key={k} label={lbl} w={w}><input style={fB()} type="number" value={c[k]??""} placeholder="—" onChange={e=>updChange(c.id,{[k]:e.target.value})}/></FB>
                              ))}
                              <FB label="Poznámka" w={110}><input style={fB()} value={c.poznamka||""} placeholder="poznámka" onChange={e=>updChange(c.id,{poznamka:e.target.value})}/></FB>
                            </div>
                          )}

                          {c.type!=="novy"&&(
                            <div>
                              <div style={{marginBottom:8}}>
                                <select value="" onChange={e=>{
                                  const val=e.target.value;if(!val)return;
                                  if((c.selectedParts||[]).find(sp=>sp.partName===val))return;
                                  const base=allPartsFlat.find(p=>p.nazev===val);
                                  updChange(c.id,{selectedParts:[...(c.selectedParts||[]),{partName:val,weeklyQty:base?String(base.weeklyQty):"",takt:base?String(base.takt):"40",nasobnost:base?String(base.nasobnost):"2",oee:base?String(base.oee):"85"}]});
                                }} style={{...selSt,width:"auto",minWidth:220}}>
                                  <option value="">＋ Přidat díl…</option>
                                  {allPartNames.filter(n=>!(c.selectedParts||[]).find(sp=>sp.partName===n)).map(n=><option key={n} value={n}>{n}</option>)}
                                </select>
                              </div>
                              {(c.selectedParts||[]).length===0&&<span style={{fontSize:11.5,color:D.txt3,fontStyle:"italic"}}>Zatím nevybrán žádný díl.</span>}
                              {(c.selectedParts||[]).map((sp,spi)=>{
                                const updSP=p=>updChange(c.id,{selectedParts:(c.selectedParts||[]).map((x,i)=>i===spi?{...x,...p}:x)});
                                return (
                                  <div key={sp.partName} style={{display:"flex",alignItems:"center",gap:8,background:D.card3,borderRadius:9,padding:"8px 12px",marginBottom:6,flexWrap:"wrap"}}>
                                    <span style={{fontSize:12.5,color:D.txt,minWidth:130,fontWeight:500}}>{sp.partName}</span>
                                    {[["Nové týd. ks","weeklyQty",85],["Takt (s)","takt",62],["Násobnost","nasobnost",65],["OEE (%)","oee",60]].map(([lbl,k,w])=>(
                                      <div key={k} style={{display:"flex",flexDirection:"column",gap:2}}>
                                        <span style={{fontSize:10,color:D.txt2,fontWeight:500}}>{lbl}</span>
                                        <input type="number" value={sp[k]} placeholder="—" onChange={e=>updSP({[k]:e.target.value})}
                                          style={{...iB(),width:w,fontSize:12.5,textAlign:"right",borderBottom:`1px solid ${D.border2}`,padding:"2px 0"}}/>
                                      </div>
                                    ))}
                                    <button onClick={()=>updChange(c.id,{selectedParts:(c.selectedParts||[]).filter((_,i)=>i!==spi)})}
                                      style={{background:"rgba(239,68,68,0.1)",color:"#EF4444",border:"0.5px solid rgba(239,68,68,0.3)",borderRadius:5,padding:"2px 8px",fontSize:11,cursor:"pointer",fontFamily:"inherit",alignSelf:"flex-end"}}>✕</button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>}
                </div>

                {/* scenarios */}
                <div style={{background:D.card,borderRadius:12,border:`0.5px solid ${D.border}`,overflow:"hidden"}}>
                  <div style={{padding:"12px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`0.5px solid ${D.border}`,flexWrap:"wrap",gap:8}}>
                    <div>
                      <span style={{fontSize:14,fontWeight:600,color:D.txt}}>Kapacitní scénáře</span>
                      <span style={{fontSize:12,color:D.txt2,marginLeft:8}}>projekce po rocích</span>
                    </div>
                    <BtnPrimary onClick={()=>setM(m.id,{scenarios:[...m.scenarios,defScenario(m.scenarios.length+1)]})}>+ Nový scénář</BtnPrimary>
                  </div>
                  {m.scenarios.length===0
                    ?<div style={{padding:"20px 18px",color:D.txt2,fontSize:13}}>Žádné scénáře.</div>
                    :m.scenarios.map((sc,si)=>(
                      <div key={sc.id} style={{borderTop:si>0?`0.5px solid ${D.border}`:"none"}}>
                        <div style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",background:D.card2}}>
                          <input value={sc.name} placeholder="Název scénáře" onChange={e=>updScene(sc.id,{name:e.target.value})} style={{...fB(),width:160,fontSize:14,fontWeight:600}}/>
                          <div style={{display:"flex",gap:5,flexWrap:"wrap",flex:1,alignItems:"center"}}>
                            {m.changes.length===0
                              ?<span style={{fontSize:12,color:D.txt2}}>Nejprve přidejte poptávky</span>
                              :m.changes.map(c=>{
                                const on=sc.changeIds.includes(c.id),col=TC[c.type];
                                return <button key={c.id}
                                  onClick={()=>updScene(sc.id,{changeIds:on?sc.changeIds.filter(id=>id!==c.id):[...sc.changeIds,c.id]})}
                                  style={{padding:"3px 11px",borderRadius:9,fontSize:11.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit",background:on?col+"22":"transparent",color:on?col:D.txt2,border:`0.5px solid ${on?col:D.border2}`,outline:"none"}}>
                                  {c.name||TL[c.type]}{(c.years||[]).length>0?` (${c.years.join(", ")})` :""}
                                </button>;
                              })}
                          </div>
                          <BtnDanger onClick={()=>setM(m.id,{scenarios:m.scenarios.filter(x=>x.id!==sc.id)})}>✕</BtnDanger>
                        </div>
                        {m.yearTables.map(yt=>{
                          const proj=projectScenario(m,sc,yt);
                          const d=sumDays(proj),p=d?(d/7)*100:null;
                          return (
                            <div key={yt.id}>
                              <div style={{padding:"7px 16px",display:"flex",alignItems:"center",gap:10,background:D.card3,borderTop:`0.5px solid ${D.border}`,flexWrap:"wrap"}}>
                                <span style={{fontSize:12,color:D.accent,fontWeight:600}}>{yt.year?`Rok ${yt.year}`:"Rok (nezadán)"}</span>
                                {p!==null&&<span style={{padding:"2px 10px",borderRadius:9,fontSize:12,fontWeight:500,background:pB(p),color:pC(p),border:`0.5px solid ${pDc(p)}`}}>Celkem: {p.toFixed(1)}%</span>}
                                <div style={{display:"flex",gap:10,marginLeft:"auto",flexWrap:"wrap"}}>
                                  {[[D.rowUp,"rgba(16,185,129,0.4)","Navýšení"],[D.rowDown,"rgba(239,68,68,0.4)","Snížení"],[D.rowNew,D.al3,"Nový projekt"]].map(([bg,bd,lbl])=>(
                                    <div key={lbl} style={{display:"flex",alignItems:"center",gap:4}}>
                                      <span style={{width:8,height:8,borderRadius:2,background:bg,border:`0.5px solid ${bd}`,display:"inline-block",flexShrink:0}}/>
                                      <span style={{fontSize:10.5,color:D.txt2}}>{lbl}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div style={{overflowX:"auto"}}>
                                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12.5}}>
                                  <thead><tr>{COLS.map((h,i)=><TH key={i} label={h} right={i===3}/>)}</tr></thead>
                                  <tbody>
                                    {proj.map(p=><PR key={p.id} part={p} ro/>)}
                                    <SumRow parts={proj}/>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
