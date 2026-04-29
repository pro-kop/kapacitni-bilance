import React, { useState } from "react";

const uid = () => Math.random().toString(36).slice(2,9);
const defPart    = () => ({id:uid(),nazev:"",weeklyQty:"",takt:40,nasobnost:2,oee:85,smena:12,poznamka:""});
const defYT      = (yr="") => ({id:uid(),year:yr,parts:[defPart()]});
const defMachine = n => ({id:uid(),tonaz:"",cisloLisu:"",yearTables:[defYT("")],changes:[],scenarios:[]});
const defChange  = () => ({id:uid(),name:"",type:"navyseni",partName:"",delta:"",year:"",takt:40,nasobnost:2,oee:85,smena:12,poznamka:""});
const defScenario= n => ({id:uid(),name:`Scénář ${n}`,changeIds:[]});
const mLabel     = (m,i) => [m.tonaz,m.cisloLisu].filter(Boolean).join(" – ")||`Lis ${i+1}`;

function calcDays(wq,ta,na,oe,sm){
  const q=parseFloat(wq),t=parseFloat(ta),n=parseFloat(na),o=parseFloat(oe)/100,s=parseFloat(sm);
  if([q,t,n,o,s].some(v=>isNaN(v)||v===0)) return null;
  return q/((3600/t)*n*o*s*2);
}
const sumDays = ps => {
  const v=ps.map(p=>calcDays(p.weeklyQty,p.takt,p.nasobnost,p.oee,p.smena)).filter(x=>x!=null);
  return v.length ? v.reduce((a,b)=>a+b,0) : null;
};
const getYT = (m,yr) => yr ? m.yearTables.find(t=>t.year===yr)||m.yearTables[0] : m.yearTables[0];

// standalone — used by both planning view and ProjectionView
function applyScenarioForYT(machine, sc, yt) {
  const isPrimary = yt.id===machine.yearTables[0].id;
  let parts = yt.parts.map(p=>({...p,weeklyQty:parseFloat(p.weeklyQty)||0}));
  machine.changes.filter(c=>sc.changeIds.includes(c.id)).forEach(c=>{
    if(c.year!==yt.year&&!(c.year===""&&isPrimary)) return;
    if(c.type==="novy"){
      parts=[...parts,{id:"sc-"+c.id+yt.id,nazev:c.partName||"Nový díl",weeklyQty:parseFloat(c.delta)||0,
        takt:parseFloat(c.takt)||40,nasobnost:parseFloat(c.nasobnost)||2,
        oee:parseFloat(c.oee)||85,smena:parseFloat(c.smena)||12,poznamka:c.poznamka||"",_new:true}];
    } else {
      const delta=(parseFloat(c.delta)||0)*(c.type==="navyseni"?1:-1);
      parts=parts.map(p=>p.nazev===c.partName?{...p,weeklyQty:(p.weeklyQty||0)+delta,_modType:c.type}:p);
    }
  });
  return parts;
}

const D={bg:"#1f1f1e",card:"#272725",card2:"#2e2e2c",card3:"#343432",
  border:"rgba(255,255,255,0.07)",border2:"rgba(255,255,255,0.13)",
  txt:"#e4e4e0",txt2:"#8a8a86",txt3:"#555550",purple:"#9a93f5",purpleD:"#534AB7",purpleBg:"#2a2840"};
const pC = p=>p==null?"#6b6b67":p<70?"#3ecf6e":p<90?"#f0a030":"#f55555";
const pB = p=>p==null?"transparent":p<70?"#1a3326":p<90?"#332510":"#331515";
const pD = p=>p==null?"transparent":p<70?"#2a6644":p<90?"#7a4a10":"#7a2020";
const TC={navyseni:"#3ecf6e",snizeni:"#f55555",novy:"#9a93f5"};
const TL={navyseni:"▲ Navýšení",snizeni:"▼ Snížení",novy:"★ Nový projekt"};
const COLS=["Název dílu","Týd. ks","Vytíž. d/týd","Vytíž. %","Takt (s)","Násobnost","OEE (%)","Směna (h)","Poznámka",""];
const PH={nazev:"název",weeklyQty:"ks/týd",takt:"s",nasobnost:"ks",oee:"OEE%",smena:"hod",poznamka:"poznámka",partName:"název dílu",delta:"Δ ks",name:"poptávka"};
const iB={border:"none",outline:"none",background:"transparent",color:D.txt,fontFamily:"inherit",padding:0};
const fB={border:"none",borderBottom:`1px solid ${D.border2}`,padding:"3px 0",fontSize:13,outline:"none",background:"transparent",color:D.txt,fontFamily:"inherit",width:"100%"};

function TH({label,right,center,rowSpan,colSpan,bl,small}) {
  return (
    <th rowSpan={rowSpan} colSpan={colSpan} style={{padding:small?"6px 8px":"8px 10px",background:D.purpleBg,color:D.purple,fontSize:small?10:11,fontWeight:500,textAlign:center?"center":right?"right":"left",borderBottom:"1.5px solid #3d3960",whiteSpace:"nowrap",letterSpacing:"0.03em",borderLeft:bl?`0.5px solid rgba(157,147,245,0.25)`:"none"}}>
      {label}
    </th>
  );
}

function PR({part,onUpd,onDel,ro}) {
  const d=calcDays(part.weeklyQty,part.takt,part.nasobnost,part.oee,part.smena);
  const p=d!=null?(d/7)*100:null;
  const bg=part._new?"#444254":part._modType==="navyseni"?"#1a3326":part._modType==="snizeni"?"#2e2410":D.card;
  const f=(k,w)=>ro
    ? <span style={{fontSize:12.5,color:part[k]?D.txt:D.txt3,fontStyle:part[k]?"normal":"italic"}}>{part[k]||PH[k]||"—"}</span>
    : <input type="text" value={part[k]} placeholder={PH[k]||""} onChange={e=>onUpd({[k]:e.target.value})} style={{...iB,width:w||"100%",fontSize:12.5}} />;
  const nf=(k,w)=>ro
    ? <span style={{fontSize:12.5,color:D.txt2,textAlign:"right",display:"block"}}>{part[k]}</span>
    : <input type="number" value={part[k]} placeholder={PH[k]||""} onChange={e=>onUpd({[k]:e.target.value})} style={{...iB,width:w||55,fontSize:12.5,textAlign:"right"}} />;
  return (
    <tr style={{background:bg,borderBottom:`0.5px solid ${D.border}`}}>
      <td style={{padding:"7px 10px",minWidth:120}}>{f("nazev")}</td>
      <td style={{padding:"7px 10px"}}>{nf("weeklyQty",68)}</td>
      <td style={{padding:"7px 10px",fontWeight:500,color:pC(p),textAlign:"right"}}>{d!=null?d.toFixed(2):<span style={{color:D.txt3}}>—</span>}</td>
      <td style={{padding:"7px 10px"}}>{p!=null?<span style={{display:"inline-block",padding:"2px 9px",borderRadius:12,fontSize:11.5,fontWeight:500,background:pB(p),color:pC(p),border:`0.5px solid ${pD(p)}`}}>{p.toFixed(1)}%</span>:<span style={{color:D.txt3}}>—</span>}</td>
      <td style={{padding:"7px 10px"}}>{nf("takt",45)}</td>
      <td style={{padding:"7px 10px"}}>{nf("nasobnost",38)}</td>
      <td style={{padding:"7px 10px"}}>{nf("oee",42)}</td>
      <td style={{padding:"7px 10px"}}>{nf("smena",38)}</td>
      <td style={{padding:"7px 10px",minWidth:90}}>{f("poznamka")}</td>
      <td style={{padding:"7px 8px",width:32}}>
        {!ro&&onDel&&<button onClick={onDel} style={{background:"#3a1515",color:"#f55555",border:"0.5px solid #7a2020",borderRadius:6,padding:"2px 7px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>✕</button>}
      </td>
    </tr>
  );
}

function SumRow({parts}) {
  const d=sumDays(parts); const p=d!=null?(d/7)*100:null;
  return (
    <tr style={{background:p!=null?pB(p):D.card2,borderTop:"1.5px solid #3d3960"}}>
      <td colSpan={2} style={{padding:"9px 10px",fontWeight:500,color:D.purple,fontSize:12,letterSpacing:"0.05em"}}>CELKEM</td>
      <td style={{padding:"9px 10px",fontWeight:500,color:pC(p),textAlign:"right"}}>{d!=null?d.toFixed(2):<span style={{color:D.txt3}}>—</span>}</td>
      <td style={{padding:"9px 10px"}}>{p!=null&&<span style={{display:"inline-block",padding:"3px 10px",borderRadius:12,fontSize:12,fontWeight:500,background:pB(p),color:pC(p),border:`0.5px solid ${pD(p)}`}}>{p.toFixed(1)}%</span>}</td>
      <td colSpan={6} style={{padding:"9px 10px"}} />
    </tr>
  );
}

function PartTable({yt,onUpdPart,onDelPart,onAddPart}) {
  return (
    <div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12.5}}>
          <thead><tr>{COLS.map((h,i)=><TH key={i} label={h} right={i===2}/>)}</tr></thead>
          <tbody>
            {yt.parts.map(p=>(
              <PR key={p.id} part={p} onUpd={patch=>onUpdPart(p.id,patch)} onDel={yt.parts.length>1?()=>onDelPart(p.id):null}/>
            ))}
            <SumRow parts={yt.parts}/>
          </tbody>
        </table>
      </div>
      <div style={{padding:"10px 16px"}}>
        <Bp onClick={onAddPart} s={{fontSize:12,padding:"5px 11px"}}>+ Přidat díl</Bp>
      </div>
    </div>
  );
}

function Bp({onClick,children,s={}}) {
  return <button onClick={onClick} style={{background:D.purpleD,color:"white",border:"none",borderRadius:8,padding:"6px 13px",fontSize:12.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit",...s}}>{children}</button>;
}
function Bg({onClick,children,s={}}) {
  return <button onClick={onClick} style={{background:"transparent",color:D.purple,border:`1px solid rgba(154,147,245,0.35)`,borderRadius:8,padding:"5px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit",...s}}>{children}</button>;
}
function Bd({onClick,children,s={}}) {
  return <button onClick={onClick} style={{background:"#3a1515",color:"#f55555",border:"0.5px solid #7a2020",borderRadius:8,padding:"5px 11px",fontSize:12,cursor:"pointer",fontFamily:"inherit",...s}}>{children}</button>;
}
function FB({label,children,w}) {
  return (
    <div style={{display:"flex",flexDirection:"column",width:w||"auto"}}>
      <span style={{fontSize:11,color:D.txt2,fontWeight:500,display:"block",marginBottom:3}}>{label}</span>
      {children}
    </div>
  );
}

// ── Pct badge ──
function PctBadge({p,small}) {
  if(p==null) return <span style={{color:D.txt3}}>—</span>;
  return <span style={{display:"inline-block",padding:small?"1px 7px":"2px 9px",borderRadius:12,fontSize:small?10.5:11.5,fontWeight:500,background:pB(p),color:pC(p),border:`0.5px solid ${pD(p)}`}}>{p.toFixed(1)}%</span>;
}

// ── Summary view ──
function SummaryView({machines}) {
  const allYears=[...new Set(machines.flatMap(m=>m.yearTables.map(yt=>yt.year)).filter(y=>y))].sort();
  const showYears=allYears.length>0?allYears:[""];
  const multi=allYears.length>0;
  const groups={},order=[];
  machines.forEach(m=>{const k=m.tonaz||"—";if(!groups[k]){groups[k]=[];order.push(k);}groups[k].push(m);});
  const tdS={padding:"8px 10px",borderBottom:`0.5px solid ${D.border}`,verticalAlign:"middle"};

  return (
    <div style={{background:D.card,borderRadius:12,border:`0.5px solid ${D.border}`,overflow:"hidden"}}>
      <div style={{padding:"13px 16px",borderBottom:`0.5px solid ${D.border}`}}>
        <span style={{fontSize:14,fontWeight:500,color:D.txt}}>Souhrn vytížení — všechny lisy</span>
        <span style={{fontSize:12,color:D.txt2,marginLeft:8}}>agregováno dle tonážní skupiny</span>
      </div>
      {machines.length===0
        ? <div style={{padding:"24px 16px",color:D.txt2,fontSize:13}}>Žádné lisy. Přidejte lis tlačítkem ＋.</div>
        : (
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12.5}}>
              <thead>
                {multi && (
                  <tr>
                    <th rowSpan={2} style={{padding:"8px 10px",background:D.purpleBg,color:D.purple,fontSize:11,fontWeight:500,textAlign:"left",borderBottom:"1.5px solid #3d3960",whiteSpace:"nowrap"}}>Tonáž</th>
                    <th rowSpan={2} style={{padding:"8px 10px",background:D.purpleBg,color:D.purple,fontSize:11,fontWeight:500,textAlign:"left",borderBottom:"1.5px solid #3d3960",whiteSpace:"nowrap"}}>Číslo lisu</th>
                    {showYears.map((y,i) => (
                      <th key={y} colSpan={3} style={{padding:"7px 10px",background:"#221e3a",color:D.purple,fontSize:11,fontWeight:600,textAlign:"center",borderBottom:`0.5px solid rgba(157,147,245,0.2)`,borderLeft:i>0?`0.5px solid rgba(157,147,245,0.2)`:"none"}}>{y}</th>
                    ))}
                  </tr>
                )}
                <tr>
                  {!multi && <><TH label="Tonáž"/><TH label="Číslo lisu"/></>}
                  {showYears.map((y,yi) => [
                    <th key={y+"d"} style={{padding:"8px 10px",background:D.purpleBg,color:D.purple,fontSize:10.5,fontWeight:500,textAlign:"right",borderBottom:"1.5px solid #3d3960",whiteSpace:"nowrap",borderLeft:yi>0?`0.5px solid rgba(157,147,245,0.15)`:"none"}}>d/týd</th>,
                    <th key={y+"p"} style={{padding:"8px 10px",background:D.purpleBg,color:D.purple,fontSize:10.5,fontWeight:500,textAlign:"left",borderBottom:"1.5px solid #3d3960",whiteSpace:"nowrap"}}>Vytíž. %</th>,
                    <th key={y+"s"} style={{padding:"8px 10px",background:D.purpleBg,color:D.purple,fontSize:10.5,fontWeight:500,textAlign:"center",borderBottom:"1.5px solid #3d3960",whiteSpace:"nowrap",borderRight:`0.5px solid rgba(157,147,245,0.15)`}}>Suma ton.</th>
                  ])}
                </tr>
              </thead>
              <tbody>
                {order.flatMap(tonazKey => {
                  const grp=groups[tonazKey];
                  return grp.map((m,mi) => (
                    <tr key={m.id} style={{background:mi%2===0?D.card:D.card2}}>
                      {mi===0 && (
                        <td rowSpan={grp.length} style={{...tdS,fontWeight:500,color:D.txt,background:D.card2,borderRight:`0.5px solid ${D.border}`,fontSize:13,minWidth:80}}>
                          {tonazKey==="—" ? <span style={{color:D.txt3,fontStyle:"italic"}}>—</span> : tonazKey}
                        </td>
                      )}
                      <td style={{...tdS,color:D.txt,minWidth:80}}>
                        {m.cisloLisu||<span style={{color:D.txt3,fontStyle:"italic"}}>—</span>}
                      </td>
                      {showYears.flatMap((y,yi) => {
                        const yt=getYT(m,y);
                        const isFb=!!(y&&!m.yearTables.find(t=>t.year===y));
                        const d=sumDays(yt.parts); const p=d?(d/7)*100:null;
                        const grpSum=grp.reduce((s,gm)=>{const gd=sumDays(getYT(gm,y).parts);return s+(gd?(gd/7)*100:0);},0);
                        const normSum=grpSum/grp.length;
                        return [
                          <td key={y+"d"+m.id} title={isFb?"Přeneseno z dostupného roku":""} style={{...tdS,fontWeight:500,color:isFb?D.txt2:pC(p),textAlign:"right",borderLeft:yi>0?`0.5px solid ${D.border}`:"none"}}>
                            {d ? <span>{d.toFixed(2)}{isFb&&<span style={{color:D.txt3,fontSize:9}}> ✱</span>}</span> : <span style={{color:D.txt3}}>—</span>}
                          </td>,
                          <td key={y+"p"+m.id} style={tdS}>
                            {p!=null ? <span style={{display:"inline-block",padding:"2px 8px",borderRadius:12,fontSize:11,fontWeight:500,background:isFb?D.card3:pB(p),color:isFb?D.txt2:pC(p),border:`0.5px solid ${isFb?D.border2:pD(p)}`,opacity:isFb?0.65:1}}>{p.toFixed(1)}%{isFb?" ✱":""}</span> : <span style={{color:D.txt3}}>—</span>}
                          </td>,
                          mi===0
                            ? <td key={y+"s"+tonazKey} rowSpan={grp.length} style={{...tdS,textAlign:"center",background:D.card2,borderLeft:`0.5px solid ${D.border}`}}>
                                <span style={{display:"inline-block",padding:"3px 10px",borderRadius:12,fontSize:11.5,fontWeight:500,background:pB(normSum),color:pC(normSum),border:`0.5px solid ${pD(normSum)}`}}>{grpSum.toFixed(1)}%</span>
                                {grp.length>1&&<div style={{fontSize:10,color:D.txt2,marginTop:2}}>{grp.length} lisů</div>}
                              </td>
                            : null
                        ];
                      })}
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}

// ── Projection view ──
function ProjectionView({machines}) {
  const allYears=[...new Set(machines.flatMap(m=>m.yearTables.map(yt=>yt.year)).filter(y=>y))].sort();
  const showYears=allYears.length>0?allYears:[""];

  // Collect scenario names in stable order (preserve first-seen order across machines)
  const scNamesSeen=new Set(), scNames=[];
  machines.forEach(m=>m.scenarios.forEach(s=>{ if(!scNamesSeen.has(s.name)){scNamesSeen.add(s.name);scNames.push(s.name);} }));

  const groups={},order=[];
  machines.forEach(m=>{const k=m.tonaz||"—";if(!groups[k]){groups[k]=[];order.push(k);}groups[k].push(m);});

  const tdP={padding:"7px 8px",borderBottom:`0.5px solid ${D.border}`,verticalAlign:"middle"};

  // For a machine + year + scName: returns {d, p} or null
  const getLoad=(machine,yearStr,scName)=>{
    const sc=machine.scenarios.find(s=>s.name===scName);
    if(!sc) return null;
    const yt=getYT(machine,yearStr);
    const parts=applyScenarioForYT(machine,sc,yt);
    const d=sumDays(parts);
    return d?{d,p:(d/7)*100}:null;
  };

  const hasAnyScenario=scNames.length>0;

  // colSpan per scenario block = 3 (d/týd, %, Σ)
  // colSpan per year block = scNames.length * 3
  const yearSpan=scNames.length*3||1;

  return (
    <div style={{background:D.card,borderRadius:12,border:`0.5px solid ${D.border}`,overflow:"hidden"}}>
      <div style={{padding:"13px 16px",borderBottom:`0.5px solid ${D.border}`}}>
        <span style={{fontSize:14,fontWeight:500,color:D.txt}}>Projekce kapacity — scénáře</span>
        <span style={{fontSize:12,color:D.txt2,marginLeft:8}}>sumarizace kapacitních scénářů dle tonážních skupin a let</span>
      </div>
      {!hasAnyScenario ? (
        <div style={{padding:"24px 16px",color:D.txt2,fontSize:13}}>Žádné scénáře. Přidejte scénáře v záložkách jednotlivých lisů → Kapacitní plánování.</div>
      ) : (
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              {/* Row 1: years */}
              <tr>
                <th rowSpan={3} style={{padding:"8px 10px",background:D.purpleBg,color:D.purple,fontSize:11,fontWeight:500,textAlign:"left",borderBottom:"1.5px solid #3d3960",whiteSpace:"nowrap",minWidth:80}}>Tonáž</th>
                <th rowSpan={3} style={{padding:"8px 10px",background:D.purpleBg,color:D.purple,fontSize:11,fontWeight:500,textAlign:"left",borderBottom:"1.5px solid #3d3960",whiteSpace:"nowrap",minWidth:80}}>Číslo lisu</th>
                {showYears.map((y,yi) => (
                  <th key={y} colSpan={yearSpan} style={{padding:"7px 10px",background:"#1e1c35",color:D.purple,fontSize:11,fontWeight:700,textAlign:"center",borderBottom:`0.5px solid rgba(157,147,245,0.15)`,borderLeft:`0.5px solid rgba(157,147,245,0.25)`}}>
                    {y||"—"}
                  </th>
                ))}
              </tr>
              {/* Row 2: scenario names */}
              <tr>
                {showYears.flatMap((y,yi) =>
                  scNames.map((sn,si) => (
                    <th key={y+sn} colSpan={3} style={{padding:"6px 8px",background:"#222035",color:"#b0aaff",fontSize:10.5,fontWeight:600,textAlign:"center",borderBottom:`0.5px solid rgba(157,147,245,0.1)`,borderLeft:`0.5px solid rgba(157,147,245,0.2)`}}>
                      {sn}
                    </th>
                  ))
                )}
              </tr>
              {/* Row 3: d/týd | % | Σ per scenario */}
              <tr>
                {showYears.flatMap((y,yi) =>
                  scNames.map((sn,si) => [
                    <th key={y+sn+"d"} style={{padding:"6px 8px",background:D.purpleBg,color:D.purple,fontSize:10,fontWeight:500,textAlign:"right",borderBottom:"1.5px solid #3d3960",whiteSpace:"nowrap",borderLeft:`0.5px solid rgba(157,147,245,0.2)`}}>d/týd</th>,
                    <th key={y+sn+"p"} style={{padding:"6px 8px",background:D.purpleBg,color:D.purple,fontSize:10,fontWeight:500,textAlign:"center",borderBottom:"1.5px solid #3d3960",whiteSpace:"nowrap"}}>Vytíž. %</th>,
                    <th key={y+sn+"s"} style={{padding:"6px 8px",background:D.purpleBg,color:D.purple,fontSize:10,fontWeight:500,textAlign:"center",borderBottom:"1.5px solid #3d3960",whiteSpace:"nowrap",borderRight:`0.5px solid rgba(157,147,245,0.15)`}}>Σ ton.</th>
                  ])
                )}
              </tr>
            </thead>
            <tbody>
              {order.flatMap(tonazKey => {
                const grp=groups[tonazKey];
                return grp.map((m,mi) => (
                  <tr key={m.id} style={{background:mi%2===0?D.card:D.card2}}>
                    {mi===0 && (
                      <td rowSpan={grp.length} style={{...tdP,fontWeight:500,color:D.txt,background:D.card2,borderRight:`0.5px solid ${D.border}`,fontSize:13}}>
                        {tonazKey==="—"?<span style={{color:D.txt3,fontStyle:"italic"}}>—</span>:tonazKey}
                      </td>
                    )}
                    <td style={{...tdP,color:D.txt,minWidth:75}}>
                      {m.cisloLisu||<span style={{color:D.txt3,fontStyle:"italic"}}>—</span>}
                    </td>
                    {showYears.flatMap((y,yi) =>
                      scNames.map((sn,si) => {
                        const load=getLoad(m,y,sn);
                        // group sum for this year+scenario
                        const grpSum=mi===0?grp.reduce((s,gm)=>{const l=getLoad(gm,y,sn);return s+(l?l.p:0);},0):0;
                        const normSum=grpSum/grp.length;
                        return [
                          <td key={y+sn+"d"+m.id} style={{...tdP,textAlign:"right",fontWeight:500,color:load?pC(load.p):D.txt3,borderLeft:`0.5px solid ${D.border}`}}>
                            {load?load.d.toFixed(2):"—"}
                          </td>,
                          <td key={y+sn+"p"+m.id} style={{...tdP,textAlign:"center"}}>
                            {load?<PctBadge p={load.p} small/>:<span style={{color:D.txt3}}>—</span>}
                          </td>,
                          mi===0
                            ? <td key={y+sn+"s"+tonazKey} rowSpan={grp.length} style={{...tdP,textAlign:"center",background:D.card2,borderLeft:`0.5px solid ${D.border}`}}>
                                <PctBadge p={normSum} small/>
                                {grp.length>1&&<div style={{fontSize:9.5,color:D.txt2,marginTop:2}}>{grp.length} lisů</div>}
                              </td>
                            : null
                        ];
                      })
                    )}
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [machines,setMachines]=useState([defMachine(1)]);
  const [ai,setAi]=useState(0);
  const [view,setView]=useState("base");

  const isSummary=ai===-1;
  const isProjection=ai===-2;
  const m=(isSummary||isProjection)?null:machines[Math.min(ai,machines.length-1)];
  const upd=(id,p)=>setMachines(ms=>ms.map(x=>x.id===id?{...x,...p}:x));

  const updYT    = (ytId,patch) => upd(m.id,{yearTables:m.yearTables.map(yt=>yt.id===ytId?{...yt,...patch}:yt)});
  const addYT    = () => upd(m.id,{yearTables:[...m.yearTables,defYT("")]});
  const delYT    = ytId => upd(m.id,{yearTables:m.yearTables.filter(yt=>yt.id!==ytId)});
  const updYTPart= (ytId,pid,patch) => { const yt=m.yearTables.find(t=>t.id===ytId); updYT(ytId,{parts:yt.parts.map(p=>p.id===pid?{...p,...patch}:p)}); };
  const delYTPart= (ytId,pid) => { const yt=m.yearTables.find(t=>t.id===ytId); updYT(ytId,{parts:yt.parts.filter(p=>p.id!==pid)}); };
  const addYTPart= ytId => { const yt=m.yearTables.find(t=>t.id===ytId); updYT(ytId,{parts:[...yt.parts,defPart()]}); };
  const updChange= (cid,patch) => upd(m.id,{changes:m.changes.map(x=>x.id===cid?{...x,...patch}:x)});
  const updScene = (sid,patch) => upd(m.id,{scenarios:m.scenarios.map(x=>x.id===sid?{...x,...patch}:x)});

  const selSt={border:`0.5px solid ${D.border2}`,borderRadius:6,padding:"4px 6px",fontSize:12.5,outline:"none",background:D.card3,color:D.txt,fontFamily:"inherit",width:"100%",cursor:"pointer"};
  const allPartNames=[...new Set((m?.yearTables||[]).flatMap(yt=>yt.parts.map(p=>p.nazev)).filter(n=>n))];

  const tabBtn=(label,active,onClick)=>(
    <button onClick={onClick} style={{padding:"8px 16px",fontSize:13,fontWeight:active?500:400,cursor:"pointer",background:active?D.purpleD:"transparent",color:active?"white":D.txt2,border:"none",borderRadius:"8px 8px 0 0",outline:"none",whiteSpace:"nowrap",fontFamily:"inherit"}}>
      {label}
    </button>
  );
  const specialTab=(label,active,onClick)=>(
    <button onClick={onClick} style={{padding:"8px 16px",fontSize:13,fontWeight:active?500:400,cursor:"pointer",background:active?"#9a93f522":"transparent",color:active?D.purple:D.txt2,border:"none",borderRadius:"8px 8px 0 0",outline:"none",whiteSpace:"nowrap",fontFamily:"inherit",borderBottom:active?`2px solid ${D.purple}`:"none"}}>
      {label}
    </button>
  );

  return (
    <div style={{fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif",background:D.bg,minHeight:"100vh",color:D.txt}}>
      <style>{`input::placeholder{color:${D.txt3};font-style:italic}select option{background:${D.card2};color:${D.txt}}`}</style>

      {/* Top bar */}
      <div style={{background:D.card,borderBottom:`0.5px solid ${D.border}`,padding:"16px 20px 0"}}>
        <div style={{fontSize:16,fontWeight:500,color:D.txt,marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
          <span>📊</span> Kapacitní bilance — Vstřikolisy
        </div>
        <div style={{display:"flex",gap:2,overflowX:"auto"}}>
          {specialTab("∑ Souhrn", ai===-1, ()=>setAi(-1))}
          {specialTab("↗ Projekce", ai===-2, ()=>setAi(-2))}
          <div style={{width:"0.5px",background:D.border,margin:"8px 4px 0"}}/>
          {machines.map((mc,i) => tabBtn(mLabel(mc,i), i===ai, ()=>{setAi(i);setView("base");}))}
          <button onClick={()=>{const nm=defMachine(machines.length+1);setMachines(ms=>[...ms,nm]);setAi(machines.length);}} style={{padding:"8px 13px",fontSize:18,cursor:"pointer",background:"transparent",color:D.purple,border:"none",outline:"none",borderRadius:"8px 8px 0 0",fontFamily:"inherit"}}>＋</button>
        </div>
      </div>

      <div style={{padding:"18px 20px"}}>
        {isSummary && <SummaryView machines={machines}/>}
        {isProjection && <ProjectionView machines={machines}/>}

        {!isSummary&&!isProjection&&m && (
          <div>
            {/* Machine meta */}
            <div style={{display:"flex",alignItems:"flex-end",gap:14,marginBottom:14,flexWrap:"wrap"}}>
              <FB label="Tonáž" w={110}><input style={{...fB,fontSize:14,fontWeight:500}} value={m.tonaz} onChange={e=>upd(m.id,{tonaz:e.target.value})} placeholder="400 t"/></FB>
              <FB label="Číslo lisu" w={120}><input style={{...fB,fontSize:14,fontWeight:500}} value={m.cisloLisu} onChange={e=>upd(m.id,{cisloLisu:e.target.value})} placeholder="Lis-01"/></FB>
              <FB label="Rok" w={85}><input style={{...fB,fontSize:14,fontWeight:500}} value={m.yearTables[0].year} onChange={e=>updYT(m.yearTables[0].id,{year:e.target.value})} placeholder="2024"/></FB>
              <div style={{marginLeft:"auto"}}>
                {machines.length>1 && <Bd onClick={()=>{const nm=machines.filter((_,i)=>i!==ai);setMachines(nm);setAi(Math.min(ai,nm.length-1));}}>Smazat lis</Bd>}
              </div>
            </div>

            {/* Segment */}
            <div style={{display:"flex",background:D.card2,padding:3,borderRadius:10,width:"fit-content",marginBottom:16,border:`0.5px solid ${D.border}`}}>
              {[["base","Potvrzená kapacita"],["planning","Kapacitní plánování"]].map(([k,lbl]) => (
                <button key={k} onClick={()=>setView(k)} style={{padding:"6px 16px",fontSize:13,fontWeight:view===k?500:400,cursor:"pointer",background:view===k?D.card3:"transparent",color:view===k?D.txt:D.txt2,border:"none",borderRadius:8,outline:"none",fontFamily:"inherit"}}>{lbl}</button>
              ))}
            </div>

            {/* BASE VIEW */}
            {view==="base" && (
              <div>
                {m.yearTables.map((yt,yti) => (
                  <div key={yt.id} style={{background:D.card,borderRadius:12,border:`0.5px solid ${D.border}`,overflow:"hidden",marginBottom:12}}>
                    <div style={{padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`0.5px solid ${D.border}`,background:D.card2}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        {yti===0
                          ? <span style={{fontSize:13,color:D.txt2}}>Standardní výroba{yt.year&&<span style={{color:D.purple,fontWeight:500,marginLeft:6}}>{yt.year}</span>}</span>
                          : <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <span style={{fontSize:12,color:D.txt2,whiteSpace:"nowrap"}}>Rok</span>
                              <input style={{...fB,width:75}} value={yt.year} onChange={e=>updYT(yt.id,{year:e.target.value})} placeholder="2025"/>
                            </div>
                        }
                      </div>
                      {yti>0 && <Bd onClick={()=>delYT(yt.id)} s={{fontSize:11,padding:"3px 9px"}}>✕ Smazat rok</Bd>}
                    </div>
                    <PartTable yt={yt} onUpdPart={(pid,p)=>updYTPart(yt.id,pid,p)} onDelPart={pid=>delYTPart(yt.id,pid)} onAddPart={()=>addYTPart(yt.id)}/>
                  </div>
                ))}
                <div style={{padding:"0 0 8px"}}>
                  <Bg onClick={addYT}>＋ Přidat nový rok</Bg>
                </div>
              </div>
            )}

            {/* PLANNING VIEW */}
            {view==="planning" && (
              <div>
                {/* Changes */}
                <div style={{background:D.card,borderRadius:12,border:`0.5px solid ${D.border}`,overflow:"hidden",marginBottom:14}}>
                  <div style={{padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`0.5px solid ${D.border}`}}>
                    <div>
                      <span style={{fontSize:14,fontWeight:500}}>Zákaznické poptávky & změny</span>
                      <span style={{fontSize:12,color:D.txt2,marginLeft:8}}>Pool změn pro sestavování scénářů</span>
                    </div>
                    <Bp onClick={()=>upd(m.id,{changes:[...m.changes,defChange()]})}>+ Přidat poptávku</Bp>
                  </div>
                  {m.changes.length===0
                    ? <div style={{padding:"20px 16px",color:D.txt2,fontSize:13}}>Žádné poptávky.</div>
                    : <div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:10}}>
                        {m.changes.map(c => (
                          <div key={c.id} style={{background:D.card2,borderRadius:10,padding:"12px 14px",border:`0.5px solid ${D.border}`,borderLeft:`3px solid ${TC[c.type]}`}}>
                            <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
                              <FB label="Název" w={115}><input style={fB} value={c.name} placeholder={PH.name} onChange={e=>updChange(c.id,{name:e.target.value})}/></FB>
                              <FB label="Typ změny">
                                <select value={c.type} onChange={e=>updChange(c.id,{type:e.target.value})} style={{...selSt,color:TC[c.type],fontWeight:500,width:"auto"}}>
                                  <option value="navyseni">▲ Navýšení</option>
                                  <option value="snizeni">▼ Snížení</option>
                                  <option value="novy">★ Nový projekt</option>
                                </select>
                              </FB>
                              <FB label="Rok změny" w={85}>
                                <select value={c.year} onChange={e=>updChange(c.id,{year:e.target.value})} style={selSt}>
                                  <option value="">— vše —</option>
                                  {m.yearTables.filter(yt=>yt.year).map(yt=><option key={yt.id} value={yt.year}>{yt.year}</option>)}
                                </select>
                              </FB>
                              <FB label={c.type==="novy"?"Název nového dílu":"Název dílu"} w={155}>
                                {c.type==="novy"
                                  ? <input style={fB} value={c.partName} placeholder={PH.partName} onChange={e=>updChange(c.id,{partName:e.target.value})}/>
                                  : <select value={c.partName} onChange={e=>updChange(c.id,{partName:e.target.value})} style={selSt}>
                                      <option value="">— vybrat díl —</option>
                                      {allPartNames.map(n=><option key={n} value={n}>{n}</option>)}
                                    </select>
                                }
                              </FB>
                              {c.type!=="novy"
                                ? <FB label="Δ Týd. ks" w={75}><input style={fB} type="number" value={c.delta} placeholder={PH.delta} onChange={e=>updChange(c.id,{delta:e.target.value})}/></FB>
                                : [["Týd. ks","delta",65],["Takt","takt",46],["Násobnost","nasobnost",50],["OEE%","oee",46],["Směna h","smena",46]].map(([lbl,k,w]) => (
                                    <FB key={k} label={lbl} w={w}><input style={fB} type="number" value={c[k]} placeholder={PH[k]||k} onChange={e=>updChange(c.id,{[k]:e.target.value})}/></FB>
                                  ))
                              }
                              <FB label="Poznámka" w={95}><input style={fB} value={c.poznamka} placeholder={PH.poznamka} onChange={e=>updChange(c.id,{poznamka:e.target.value})}/></FB>
                              <Bd onClick={()=>upd(m.id,{changes:m.changes.filter(x=>x.id!==c.id)})} s={{alignSelf:"flex-end"}}>✕</Bd>
                            </div>
                          </div>
                        ))}
                      </div>
                  }
                </div>

                {/* Scenarios */}
                <div style={{background:D.card,borderRadius:12,border:`0.5px solid ${D.border}`,overflow:"hidden"}}>
                  <div style={{padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`0.5px solid ${D.border}`}}>
                    <div>
                      <span style={{fontSize:14,fontWeight:500}}>Kapacitní scénáře</span>
                      <span style={{fontSize:12,color:D.txt2,marginLeft:8}}>Projekce po rocích</span>
                    </div>
                    <Bp onClick={()=>upd(m.id,{scenarios:[...m.scenarios,defScenario(m.scenarios.length+1)]})}>+ Nový scénář</Bp>
                  </div>
                  {m.scenarios.length===0
                    ? <div style={{padding:"20px 16px",color:D.txt2,fontSize:13}}>Žádné scénáře.</div>
                    : m.scenarios.map((sc,si) => (
                        <div key={sc.id} style={{borderTop:si>0?`0.5px solid ${D.border}`:"none"}}>
                          <div style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",background:D.card2}}>
                            <input value={sc.name} placeholder="Název scénáře" onChange={e=>updScene(sc.id,{name:e.target.value})} style={{...fB,width:155,fontSize:14,fontWeight:500}}/>
                            <div style={{display:"flex",gap:5,flexWrap:"wrap",flex:1,alignItems:"center"}}>
                              {m.changes.length===0
                                ? <span style={{fontSize:12,color:D.txt2}}>Nejprve přidejte poptávky</span>
                                : m.changes.map(c => {
                                    const on=sc.changeIds.includes(c.id); const col=TC[c.type];
                                    return (
                                      <button key={c.id} onClick={()=>updScene(sc.id,{changeIds:on?sc.changeIds.filter(id=>id!==c.id):[...sc.changeIds,c.id]})}
                                        style={{padding:"3px 10px",borderRadius:14,fontSize:11.5,fontWeight:500,cursor:"pointer",fontFamily:"inherit",background:on?col+"33":"transparent",color:on?col:D.txt2,border:`1px solid ${on?col:D.border2}`,outline:"none"}}>
                                        {c.name||TL[c.type]}{c.year?` (${c.year})`:""}
                                      </button>
                                    );
                                  })
                              }
                            </div>
                            <Bd onClick={()=>upd(m.id,{scenarios:m.scenarios.filter(x=>x.id!==sc.id)})}>✕</Bd>
                          </div>
                          {m.yearTables.map((yt,yti) => {
                            const proj=applyScenarioForYT(m,sc,yt);
                            const d=sumDays(proj); const p=d?(d/7)*100:null;
                            return (
                              <div key={yt.id}>
                                <div style={{padding:"7px 16px",display:"flex",alignItems:"center",gap:10,background:"#232332",borderTop:`0.5px solid ${D.border}`}}>
                                  <span style={{fontSize:12,color:D.purple,fontWeight:500}}>{yt.year?`Rok ${yt.year}`:"Rok (nezadán)"}</span>
                                  {p!=null && <span style={{padding:"2px 10px",borderRadius:12,fontSize:12,fontWeight:500,background:pB(p),color:pC(p),border:`0.5px solid ${pD(p)}`}}>Celkem: {p.toFixed(1)}%</span>}
                                  <div style={{display:"flex",gap:10,marginLeft:"auto",flexWrap:"wrap"}}>
                                    {[["#1a3326","#2a6644","Navýšení"],["#2e2410","#7a4a10","Snížení"],["#444254","#6b5fa0","Nový projekt"]].map(([bg,bd,lbl]) => (
                                      <div key={lbl} style={{display:"flex",alignItems:"center",gap:4}}>
                                        <span style={{width:8,height:8,borderRadius:2,background:bg,border:`0.5px solid ${bd}`,display:"inline-block",flexShrink:0}}/>
                                        <span style={{fontSize:10.5,color:D.txt2}}>{lbl}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div style={{overflowX:"auto"}}>
                                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:12.5}}>
                                    <thead><tr>{COLS.map((h,i)=><TH key={i} label={h} right={i===2}/>)}</tr></thead>
                                    <tbody>
                                      {proj.map(p => <PR key={p.id} part={p} ro/>)}
                                      <SumRow parts={proj}/>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))
                  }
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
