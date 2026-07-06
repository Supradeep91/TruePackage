import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { CITIES } from "./data/cities";
import { calcDE } from "./calc/calcDE";
import { calcIN } from "./calc/calcIN";
import { calcThresholds, calcBreakEven, calcMatchCTC, calcOpp, DE_RENT_RANGES } from "./calc/calcHelpers";
import { getMarketRange } from "./data/salaryRanges";
import { useURLState } from "./hooks/useURLState";
import { Acc } from "./components/shared/Accordion";
import { pillStyle } from "./components/shared/PillSelector";
import { CalcWorking } from "./components/shared/CalcWorking";
import type { CalcRow } from "./components/shared/CalcWorking";

// ─── TYPES ───────────────────────────────────────────────────────────────────
type Dir = "in2de" | "de2in" | "opp" | "student";
type Fam = "single" | "married" | "married-kids";
interface DE { net:number;gross:number;gap:number;tax:number;soli:number;kirche:number;health:number;pension:number;nursing:number;effRate:string; }
interface IN { net:number;tax:number;pf:number;eff:string; }
interface Match { match:number;matchLPA:string;tgt:number;targetNet:number;costs:{rent:number;groc:number;help:number;trans:number;school:number;leisure:number;health:number;misc:number};ppGap:number;ppGapPct:number;ppGapColor:string;fixedFloor:number;fixedFloorLPA:string;indiaMatchNet:number; }
interface Thr { floor:number;match:number;comfort:number;gm:number;remEur:number;matchT:number;comfortT:number;rentUsed:number;pos:(g:number)=>string; }
interface BE { ok:boolean;surplus:number;total:number;dep?:number;mo?:number;yrs?:string;at5?:number;years:{y:number;v:number}[];msg:string; }
interface AI { neg:string;q:string[];insight:string;pos:string;verdict?:string; }
interface OppLifestyle { apartment:string; cooking:string; car:boolean; gym:string; }
interface OppResult { monthlyBurn:number;runwayMonths:number;runwayText:string;targetGross:number;legalMin:number;belowLegal:boolean;safeMonths:number;cashPositions:{month:number;hasSalary:boolean;net:number;burn:number;cash:number}[];rentMid:number;rentRange:number[];grocMid:number;eatingOut:number;trans:number;gym:number;utilMid:number;healthFull:number;phone:number;tc:number;rate:number; }

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
// API key is injected server-side by Vite's proxy (/api/gemini → Google). Never exposed in the bundle.
const GEMINI_URL = `/api/gemini`;
const CALENDLY   = "https://calendly.com/supradeep_cm";

function formatCurrency(num: number, currency: "inr" | "eur"): string {
  if (currency === "inr") {
    if (num >= 100000) {
      return `${(num / 100000).toFixed(0)}L`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`;
    }
  } else if (currency === "eur") {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`;
    }
  }
  return num.toLocaleString();
}

const C = {
  // Dark zone (calculator layer) — softer base, less harsh
  bg0:"#111827",bg1:"#1a2437",bg2:"#1e2d45",bgi:"#141f32",
  gold:"#f59e0b",goldD:"rgba(245,158,11,.13)",goldL:"rgba(245,158,11,.32)",
  grn:"#10d98c",grnD:"rgba(16,217,140,.08)",grnL:"rgba(16,217,140,.28)",
  red:"#f55b5b",redD:"rgba(245,91,91,.08)",
  t1:"#eef2f9",t2:"#8fa3c0",t3:"#5a7290",
  b0:"rgba(255,255,255,.06)",b1:"rgba(255,255,255,.11)",
  accentBlue:"rgba(99,179,237,.6)",accentAmber:"rgba(245,158,11,.6)",accentGreen:"rgba(16,217,140,.5)",
  // Light zone (nav + journey band)
  lbg:"#F7F5F0",lbg2:"#EFECE6",lborder:"rgba(0,0,0,.08)",
  ltxt:"#1a2437",ltxt2:"#4a5568",ltxt3:"#8a98a8",
};

// ─── CALC ENGINE ─────────────────────────────────────────────────────────────
// calcDE, calcIN, calcThresholds, calcBreakEven, calcMatchCTC imported above

// ─── GEMINI ───────────────────────────────────────────────────────────────────
async function callGemini(prompt:string,maxTok=320):Promise<string> {
  const body={contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:.7,maxOutputTokens:maxTok}};
  const r=await Promise.race([
    fetch(GEMINI_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}),
    new Promise<never>((_,rej)=>setTimeout(()=>rej(new Error("timeout")),12000))
  ]);
  if(!r.ok) throw new Error(String(r.status));
  return (await r.json()).candidates[0].content.parts[0].text;
}

async function runAI(dir:Dir,inCity:string,deCity:string,gross:number,ctc:number,fam:Fam,rem:number,de:DE,india:IN,remEur:number,match:Match|null,rate:number):Promise<AI> {
  const p=dir==="in2de"
    ?`Trusted advisor for Indians evaluating Germany offers. Direct, warm.\nUser: ${inCity}→${deCity} · ₹${(ctc/1e5).toFixed(0)}L CTC · net ₹${india.net}/mo · €${(gross/1000).toFixed(0)}K gross · net €${de.net}/mo · gap −€${de.gap}/mo · tax ${de.effRate}% · ${fam} · rem €${remEur}/mo\nReturn ONLY valid JSON: {"neg":"3 sentences: market rate/counter/exact words <90w","q":["Q1 for someone ${inCity}→${deCity}","Q2","Q3"],"insight":"1 sentence starts with number <20w","pos":"below_market|within_market|above_market"}`
    :`Trusted advisor for expats evaluating India return. Direct, warm.\nUser: ${deCity}→${inCity} · €${(gross/1000).toFixed(0)}K · net €${de.net}/mo · offer ₹${(ctc/1e5).toFixed(0)}L · net ₹${india.net}/mo · match ₹${match?.matchLPA}L · ${fam}\nReturn ONLY valid JSON: {"neg":"3 sentences: vs threshold/counter/exact words <90w","q":["Q1 Germany→${inCity}","Q2 health ins","Q3 career"],"insight":"1 sentence starts with number <20w","pos":"below_match|at_match|above_match","verdict":"take/negotiate/pass in 1 sentence"}`;
  try {
    return JSON.parse((await callGemini(p)).replace(/```json|```/g,"").trim());
  } catch {
    if(dir==="in2de") return {neg:`${deCity} market €65–80K. Counter €${Math.round(gross*1.1/5000)*5}K + €5K relocation.`,q:["Net month 1 vs expectation?","Life without domestic help?","What to negotiate differently?"],insight:`€${(gross/1000).toFixed(0)}K in ${deCity} = €${de.net}/mo net, not €${de.gross}.`,pos:gross>=75000?"above_market":gross>=60000?"within_market":"below_market"};
    return {neg:`Counter ₹${((match!.match)*1.1/1e5).toFixed(1)}L + group health cover.`,q:["Actual take-home vs CTC?","Health ins after Germany?","Career trajectory?"],insight:`~${((india.net*12/ctc)*100).toFixed(0)}% of CTC is take-home.`,pos:ctc>=match!.match?"above_match":"below_match",verdict:ctc>=match!.match?"Offer clears threshold — negotiate 10% higher.":"Below threshold — negotiate before accepting."};
  }
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const S = {
  card:{background:C.bg2,border:`1px solid ${C.b0}`,borderRadius:20,padding:28,marginBottom:16},
  eye:{fontSize:11,fontWeight:600,letterSpacing:"2px",textTransform:"uppercase" as const,color:C.t3,marginBottom:4},
  title:{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,color:C.t1,marginBottom:20},
  hlGold:{background:C.goldD,border:`1px solid ${C.goldL}`,borderRadius:8,padding:"14px 16px"},
  hlGrn:{background:C.grnD,border:`1px solid ${C.grnL}`,borderRadius:8,padding:"14px 16px"},
  hlRed:{background:C.redD,border:`1px solid rgba(255,91,91,.25)`,borderRadius:8,padding:"14px 16px"},
  badge:(col:string,bg:string,bdr:string)=>({display:"inline-flex",alignItems:"center",fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase" as const,padding:"2px 8px",borderRadius:20,verticalAlign:"middle",marginLeft:6,color:col,background:bg,border:`1px solid ${bdr}`}),
};

// ─── CARD D: in2de ────────────────────────────────────────────────────────────
function CardD_in({gross,thr,be,deCity,inCity,tc,noKirche,savings,de,remEur,rate,dc,fam,field,seniority}:{gross:number;thr:Thr;be:BE;deCity:string;inCity:string;tc:number;noKirche:boolean;savings:number;de:DE;remEur:number;rate:number;dc:any;fam:Fam;field:string;seniority:string}) {
  const isAboveComfort = gross >= thr.comfort;
  const isAboveParity  = gross >= thr.match;
  const isAboveFloor   = gross >= thr.floor;
  const delta          = gross - thr.match;
  const [calcOpen,setCalcOpen]=useState(false);
  const [accOpen,setAccOpen]  =useState(false);
  const [whatIfGross,setWhatIfGross]=useState<number|null>(null);
  const activeGross=whatIfGross!==null?whatIfGross:gross;
  const whatIfDe=calcDE(activeGross,tc,noKirche);
  const whatIfNet=whatIfDe.net;
  const whatIfVerdict=activeGross>=thr.comfort
    ?`✓ Clears comfort at €${(activeGross/1000).toFixed(0)}K — net €${whatIfNet.toLocaleString()}/mo`
    :activeGross>=thr.match
    ?`↗ Above parity at €${(activeGross/1000).toFixed(0)}K — counter to €${(thr.comfort/1000).toFixed(0)}K`
    :`⚠ Below parity at €${(activeGross/1000).toFixed(0)}K — minimum €${(thr.match/1000).toFixed(0)}K`;
  const whatIfColor=activeGross>=thr.comfort?C.grn:activeGross>=thr.match?C.gold:C.red;
  const rentMid2=Math.round((dc.rent[0]+dc.rent[1])/2);
  const grocMid2=Math.round((dc.groc[0]+dc.groc[1])/2);
  const utilMid2=Math.round((dc.util[0]+dc.util[1])/2);

  // Cash flow pre-computed
  let cash=savings;
  const cashFlow=[0,1,2,3,4,5].map(i=>{
    const setup=i===0?be.total:0;
    const salary=i>=1?de.net:0;
    const costs=i>=1?thr.matchT:0;
    cash=cash-setup+salary-costs;
    return {label:['Mo 1','Mo 2','Mo 3','Mo 4','Mo 5','Mo 6'][i],cash,neg:cash<0};
  });
  const lowestCash=Math.min(...cashFlow.map(m=>m.cash));
  const neverNeg=lowestCash>=0;
  const recoveryIdx=cashFlow.findIndex((m,i)=>i>0&&m.cash>=0&&cashFlow[i-1].cash<0);
  const cashSummaryColor=neverNeg?'#00c98b':recoveryIdx>=0?'#e8a020':'#ff5b5b';
  const cashSummaryText=neverNeg
    ?'✓ You stay cash-positive throughout. Setup costs covered by savings.'
    :recoveryIdx>=0
    ?`Cash goes negative Month 1, recovers by Month ${recoveryIdx+1}. Bring €${Math.abs(lowestCash).toLocaleString()} extra or negotiate a signing bonus.`
    :`Cash remains negative through Month 6. You need €${Math.abs(lowestCash).toLocaleString()} additional savings or a relocation bonus before accepting.`;
  const cfMax=Math.max(...cashFlow.map(d=>Math.abs(d.cash)),1);

  const verdictColor = isAboveParity ? (isAboveComfort ? C.grn : C.gold) : C.red;
  const verdictText  = isAboveComfort
    ? `Your offer of €${(gross/1000).toFixed(0)}K is €${(Math.abs(delta)/1000).toFixed(0)}K above parity.`
    : isAboveParity
    ? `Your offer of €${(gross/1000).toFixed(0)}K clears your number.`
    : isAboveFloor
    ? `Your offer of €${(gross/1000).toFixed(0)}K is €${(Math.abs(delta)/1000).toFixed(0)}K below parity.`
    : `Your offer of €${(gross/1000).toFixed(0)}K does not cover German living costs.`;

  const actionText = isAboveComfort
    ? `Accept. Your offer clears every threshold. Strong position.`
    : isAboveParity
    ? `Accept. Counter to €${(thr.comfort/1000).toFixed(0)}K if there's room.`
    : isAboveFloor
    ? `Counter at €${(thr.match/1000).toFixed(0)}K minimum before signing.`
    : `Do not accept. Counter at €${(thr.match/1000).toFixed(0)}K — this offer is not viable.`;

  const cityNumber = `Your ${deCity} Number is €${Math.round(thr.comfort/1000)}K`;
  const cityNumberSub = `The gross salary where this move makes financial sense`;

  return (
    <div style={S.card}>
      <div style={S.eye}>Your Decision Numbers</div>

      {/* Hero: Your Germany Number */}
      <div style={{textAlign:"center",padding:"24px 0 16px"}}>
        <div style={{fontSize:11,fontWeight:600,letterSpacing:"2px",textTransform:"uppercase",color:C.t3,marginBottom:10}}>Your Germany Number</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:72,fontWeight:700,color:C.gold,lineHeight:1}}>€{(thr.match/1000).toFixed(0)}K</div>
        <div style={{fontSize:12,color:C.t3,marginTop:8}}>gross annual · {deCity} · parity with {inCity}</div>
      </div>

      {/* Verdict */}
      <div style={{textAlign:"center",fontSize:15,fontWeight:600,color:verdictColor,padding:"0 12px",marginBottom:8}}>
        {verdictText}
      </div>

      {/* Action */}
      <div style={{textAlign:"center",fontSize:14,color:C.t2,padding:"0 12px",marginBottom:24}}>
        {actionText}
      </div>

      {/* Market Position Block — shown when profession is not 'Other' */}
      {field!=='Other'&&(()=>{
        const marketRange=getMarketRange(field,deCity,seniority);
        if(!marketRange) return null;
        const [marketLow,marketHigh]=marketRange;
        const marketPos=gross>=marketHigh?'above':gross>=marketLow?'within':'below';
        const marketColor=marketPos==='above'?'#00c98b':marketPos==='within'?'#e8a020':'#ff5b5b';
        const mBg=marketPos==='above'?'rgba(0,201,139,0.08)':marketPos==='within'?'rgba(232,160,32,0.08)':'rgba(255,91,91,0.08)';
        const mBd=marketPos==='above'?'rgba(0,201,139,0.25)':marketPos==='within'?'rgba(232,160,32,0.25)':'rgba(255,91,91,0.25)';
        const marketLabel=marketPos==='above'?'ABOVE MARKET':marketPos==='within'?'WITHIN MARKET RANGE':'BELOW MARKET';
        return (
          <div style={{background:C.bg1,border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:16,marginBottom:20,marginLeft:4,marginRight:4}}>
            <div style={{fontSize:12,color:C.t2,marginBottom:6}}>{field} · {deCity} · {seniority}</div>
            <div style={{fontSize:13,color:C.t2,marginBottom:10}}>Market range: €{(marketLow/1000).toFixed(0)}K – €{(marketHigh/1000).toFixed(0)}K</div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <span style={{fontSize:13,color:C.t1,fontWeight:600}}>Your offer: €{Math.round(gross/1000)}K</span>
              <span style={{display:"inline-flex",alignItems:"center",fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase" as const,padding:"2px 8px",borderRadius:20,color:marketColor,background:mBg,border:`1px solid ${mBd}`}}>{marketLabel}</span>
            </div>
            {marketPos==='below'&&<div style={{fontSize:13,color:C.t1,lineHeight:1.5}}>Counter to at least €{(marketLow/1000).toFixed(0)}K — both market rate and your lifestyle threshold agree.</div>}
            {marketPos==='within'&&<div style={{fontSize:13,color:C.t1,lineHeight:1.5}}>Your offer is within market. Negotiate toward the upper range: €{(marketHigh/1000).toFixed(0)}K.</div>}
            {marketPos==='above'&&<div style={{fontSize:13,color:C.t1,lineHeight:1.5}}>Your offer is above market. Strong position — focus on non-salary terms.</div>}
          </div>
        );
      })()}

      {/* Collapsible breakdown */}
      <div style={{textAlign:"center",marginBottom:calcOpen?16:0}}>
        <button onClick={()=>setCalcOpen(p=>!p)}
          style={{background:"none",border:"none",cursor:"pointer",fontFamily:"Outfit,sans-serif",fontSize:12,color:C.t3,padding:"2px 0"}}>
          {calcOpen?"▾ Hide breakdown":"See how this is calculated →"}
        </button>
      </div>
      {calcOpen&&(
        <div style={{marginBottom:16}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
            <div style={{background:C.bg1,border:`1px solid ${C.b0}`,borderRadius:8,padding:10,textAlign:"center"}}>
              <div style={{fontSize:10,color:C.t2,marginBottom:4}}>Survival</div>
              <div style={{fontSize:15,fontWeight:700,color:C.t2}}>€{(thr.floor/1000).toFixed(0)}K</div>
              <div style={{fontSize:10,color:C.t3,marginTop:2}}>Covers German costs only</div>
              <Acc note={`Floor = gross where net covers ${deCity} costs: rent €${thr.rentUsed} + groceries €${grocMid2} + transport €${dc.trans} + utilities €${utilMid2}/mo. Binary search on calcDE.`}/>
            </div>
            <div style={{background:C.goldD,border:`1px solid ${C.goldL}`,borderRadius:8,padding:10,textAlign:"center"}}>
              <div style={{fontSize:10,color:C.gold,marginBottom:4}}>Parity ★</div>
              <div style={{fontSize:15,fontWeight:700,color:C.gold}}>€{(thr.match/1000).toFixed(0)}K</div>
              <div style={{fontSize:10,color:C.t3,marginTop:2}}>Same lifestyle as India</div>
              <Acc note={`Parity = Floor + remittance €${remEur}/mo at EUR/INR ₹${rate.toFixed(1)}. Gross where Germany life matches India lifestyle.`}/>
            </div>
            <div style={{background:C.grnD,border:`1px solid ${C.grnL}`,borderRadius:8,padding:10,textAlign:"center"}}>
              <div style={{fontSize:10,color:C.grn,marginBottom:4}}>Comfort</div>
              <div style={{fontSize:15,fontWeight:700,color:C.grn}}>€{(thr.comfort/1000).toFixed(0)}K</div>
              <div style={{fontSize:10,color:C.t3,marginTop:2}}>20% buffer</div>
              <Acc note="Comfort = Parity × 1.20. 20% buffer above parity for savings, travel, unexpected costs."/>
            </div>
          </div>
          <div style={{fontSize:12,color:C.t3,textAlign:"center",lineHeight:1.6,padding:"0 8px"}}>
            Parity = German net after all taxes + local costs + remittance to match your {inCity} lifestyle.
          </div>
        </div>
      )}
      <CalcWorking title="How is this calculated?" rows={(()=>{
        const rows:CalcRow[]=[
          {label:`Rent (${fam==="single"?"WG room":fam==="married"?"1BR":"2BR"})`,value:`€${thr.rentUsed}/mo`},
          {label:"Groceries (avg of range)",value:`€${grocMid2}/mo`},
          {label:"Transport (monthly pass)",value:`€${dc.trans}/mo`},
          {label:"Utilities (avg of range)",value:`€${utilMid2}/mo`},
          {label:"City cost floor (gm)",value:`€${thr.gm}/mo`},
          {label:"Remittance",value:`€${remEur}/mo`,note:"at EUR/INR rate"},
          {label:"Parity target (gm + remittance)",value:`€${thr.matchT}/mo`},
          {label:"Floor gross (binary search, calcDE)",value:`€${(thr.floor/1000).toFixed(0)}K`},
          {label:"Parity gross",value:`€${(thr.match/1000).toFixed(0)}K`},
          {label:"Comfort gross (parity × 1.20)",value:`€${(thr.comfort/1000).toFixed(0)}K`,muted:true},
        ];
        return rows;
      })()}/>

      {/* City Number label */}
      <div style={{marginBottom:16,marginTop:24}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:C.t1}}>{cityNumber}</div>
        <div style={{fontFamily:"Outfit,sans-serif",fontSize:12,color:C.t3}}>{cityNumberSub}</div>
      </div>

      {/* What-if slider */}
      <div style={{paddingTop:20,borderTop:`1px solid ${C.b0}`}}>
        <div style={{fontSize:11,fontWeight:600,letterSpacing:"1.8px",textTransform:"uppercase",color:C.t3,marginBottom:12}}>Explore Scenarios</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <span style={{fontSize:12,color:C.t2}}>Adjust gross offer</span>
          <span style={{fontSize:13,fontWeight:700,color:C.gold}}>€{(activeGross/1000).toFixed(0)}K/yr</span>
        </div>
        <div style={{padding:"0 8px",background:C.bgi,border:`1px solid ${C.b1}`,borderRadius:8,marginBottom:12}}>
          <input type="range" min={40000} max={150000} step={1000} value={activeGross}
            onChange={e=>setWhatIfGross(+e.target.value)}
            style={{backgroundImage:`linear-gradient(to right,${C.gold} 0%,${C.gold} ${((activeGross-40000)/(150000-40000)*100).toFixed(1)}%,#111f35 ${((activeGross-40000)/(150000-40000)*100).toFixed(1)}%,#111f35 100%)`,width:"100%",height:4,borderRadius:2,cursor:"pointer",outline:"none",border:"none",WebkitAppearance:"none"}}/>
        </div>
        <div style={{fontSize:14,fontWeight:600,color:whatIfColor,marginBottom:4}}>{whatIfVerdict}</div>
        <div style={{fontSize:12,color:C.t3}}>Net: €{whatIfNet.toLocaleString()}/mo · {whatIfDe.effRate}% all-in (tax + social)</div>
        {whatIfGross!==null&&<button onClick={()=>setWhatIfGross(null)} style={{background:"none",border:"none",cursor:"pointer",fontFamily:"Outfit,sans-serif",fontSize:11,color:C.t3,padding:"6px 0 0",display:"block",marginLeft:"auto"}}>Reset to original</button>}
      </div>

      {/* Break-even */}
      {be.ok===true&&be.years.length>0&&(()=>{
        const vals=be.years.map(d=>d.v),vmax=Math.max(...vals,1),vmin=Math.min(...vals,0),vr=vmax-vmin||1;
        return (<>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase",color:C.t3,marginBottom:14,marginTop:24}}>Break-even timeline</div>
          <div style={{display:"flex",gap:6,alignItems:"flex-end",height:80,marginBottom:10,padding:"0 4px"}}>
            {be.years.map(({y,v})=>{
              const pos2=v>=0,px=Math.max(3,Math.round(Math.abs(v)/vr*60)),col=pos2?C.grn:"rgba(255,91,91,.7)";
              return (<div key={y} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,flex:1}}>
                <div style={{fontSize:9,color:pos2?C.grn:C.red,fontWeight:600}}>{pos2?"+":"-"}€{Math.round(Math.abs(v)/1000)}K</div>
                <div style={{width:"100%",height:px,background:col,borderRadius:"3px 3px 0 0",minHeight:3}}/>
                <div style={{fontSize:10,color:C.t3}}>Yr{y}</div>
              </div>);
            })}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
            {[{lbl:"Setup costs",val:`−€${(be.total/1000).toFixed(1)}K`,c:C.red},{lbl:"Break-even",val:`Year ${be.yrs}`,c:C.gold},{lbl:"At Year 5",val:`+€${(be.at5!/1000).toFixed(0)}K`,c:C.grn}].map(x=>(
              <div key={x.lbl} style={{background:C.bg1,borderRadius:8,padding:10,textAlign:"center"}}>
                <div style={{fontSize:10,color:C.t3,marginBottom:3}}>{x.lbl}</div>
                <div style={{fontSize:13,fontWeight:700,color:x.c}}>{x.val}</div>
              </div>
            ))}
          </div>
          <div style={{padding:"14px 16px",background:C.bg1,borderRadius:8,fontSize:13,color:C.t2,lineHeight:1.6,marginBottom:10}}>{be.msg}</div>
          <button onClick={()=>setAccOpen(!accOpen)} style={{background:"none",border:"none",cursor:"pointer",fontFamily:"Outfit,sans-serif",fontSize:11,color:C.t3,padding:"6px 0 0"}}>
            {accOpen?"▾ Hide":"▸ Setup cost breakdown"}
          </button>
          {accOpen&&<div style={{fontSize:12,color:C.t2,background:C.bg1,borderRadius:8,padding:"12px 14px",marginTop:8,display:"grid",gridTemplateColumns:"1fr auto",gap:"4px 16px"}}>
            {[["Security deposit (2.5× rent)",`€${be.dep!.toLocaleString()}`],["Furniture + setup","€2,500"],["Visa + admin","€250"],["Flights","€700"],["Misc","€500"],["Total upfront",`€${be.total.toLocaleString()}`]].map(([l,v])=>(
              <><span style={{color:C.t3}}>{l}</span><span style={{fontWeight:600}}>{v}</span></>
            ))}
          </div>}
        </>);
      })()}
      {be.ok===false&&gross>=thr.comfort&&(
        <div style={{fontSize:13,color:C.t2,lineHeight:1.6,marginTop:16,padding:"14px 16px",background:C.bg1,borderRadius:8}}>
          Your salary clears the comfort threshold. The €{be.total.toLocaleString()} setup cost takes longer to recover — ask for a relocation allowance to cover this directly.
        </div>
      )}

      {/* First 6 months cash flow */}
      {be.ok===true&&(
        <div style={{marginTop:32,paddingTop:20,borderTop:`1px solid ${C.b0}`}}>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:"1.8px",textTransform:"uppercase",color:C.t3,marginBottom:4}}>YOUR FIRST 6 MONTHS</div>
          <div style={{fontSize:12,color:C.t3,marginBottom:16}}>Cash position after landing. First salary arrives Month 2.</div>
          <div style={{display:"flex",gap:8,alignItems:"flex-end",height:80,marginBottom:10,padding:"0 4px"}}>
            {cashFlow.map(({label,cash,neg})=>{
              const px=Math.max(3,Math.round(Math.abs(cash)/cfMax*70));
              const col=neg?"rgba(255,91,91,.7)":C.grn;
              return (
                <div key={label} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,flex:1}}>
                  <div style={{fontSize:9,color:neg?C.red:C.grn,fontWeight:600}}>€{Math.round(cash/1000)}K</div>
                  <div style={{width:"100%",height:px,background:col,borderRadius:"3px 3px 0 0",minHeight:3}}/>
                  <div style={{fontSize:11,color:C.t3}}>{label}</div>
                </div>
              );
            })}
          </div>
          <div style={{fontSize:13,fontWeight:600,color:cashSummaryColor,marginBottom:8,textAlign:"center"}}>{cashSummaryText}</div>
          <div style={{fontSize:12,color:C.t3,textAlign:"center"}}>Adjust 'Savings to bring' in the form to see how more savings changes your position.</div>
        </div>
      )}
    </div>
  );
}

// ─── CARD D: de2in ────────────────────────────────────────────────────────────
function CardD_de({ctc,match,de,india,fam,rate,gross,ic,dc,inCity,deCity}:{ctc:number;match:Match;de:DE;india:IN;fam:Fam;rate:number;gross:number;ic:any;dc:any;inCity:string;deCity:string}) {
  const ok=ctc>=match.match,gap=Math.abs(match.match-ctc);
  const col=ok?C.grn:C.red,bg=ok?C.grnD:C.redD,bd=ok?C.grnL:"rgba(255,91,91,.25)";

  // ── What You're Trading: all computed values ───────────────────────────────
  const healthCost=fam==='married-kids'?45000:fam==='married'?28000:15000;
  const healthMonthly=Math.round(healthCost/12);
  const pensionLoss=Math.round(gross*0.093/12);
  const savingsDelta=de.net-Math.round(india.net/rate);
  const savingsDeltaPositive=savingsDelta>0;
  const helpGain=Math.round((ic.help[0]+ic.help[1])/2);
  const deRentAvg=Math.round((dc.rent[0]+dc.rent[1])/2);
  const inRentAvg=Math.round((ic.rent[0]+ic.rent[1])/2/rate);
  const rentDelta=deRentAvg-inRentAvg;
  const rentDeltaPositive=rentDelta>0;
  const netMonthlyDelta=Math.round(india.net/rate)-de.net;
  const netDeltaPositive=netMonthlyDelta>0;

  const deltaLabel=netDeltaPositive
    ?`In EUR terms you are €${Math.abs(netMonthlyDelta)}/mo better off financially in India`
    :`In EUR terms you are €${Math.abs(netMonthlyDelta)}/mo worse off financially in India`;
  const deltaBg=netDeltaPositive?'rgba(0,201,139,0.08)':'rgba(255,91,91,0.08)';
  const deltaBorder=netDeltaPositive?'rgba(0,201,139,0.25)':'rgba(255,91,91,0.25)';
  const deltaColor=netDeltaPositive?'#00c98b':'#ff5b5b';
  const savingsDeltaVal=savingsDeltaPositive?`−€${savingsDelta}/mo`:'±0';
  const rentDeltaVal=rentDeltaPositive?`+€${rentDelta}/mo equiv`:'Similar';

  const cityNumber = `Your ${inCity} Number is ₹${(match.match/100000).toFixed(1)}L`;
  const cityNumberSub = `The CTC where returning matches your Germany lifestyle`;

  const leaveRows=[
    {icon:"🏥",lbl:"Health insurance",val:`−₹${healthMonthly}/mo`,sub:"Personal expense. Was statutory in Germany."},
    {icon:"🏦",lbl:"German pension stops",val:`−€${pensionLoss}/mo`,sub:"No longer accruing toward German retirement."},
    {icon:"💶",lbl:"EUR savings power",val:savingsDeltaVal,sub:"Monthly capacity drop in EUR equivalent."},
    {icon:"✈️",lbl:"Global optionality",val:"Narrows",sub:"Returning closes some international doors. Harder to re-enter EU job market later."},
  ];
  const gainRows=[
    {icon:"🧹",lbl:"Domestic help",val:`+₹${helpGain.toLocaleString()}/mo`,sub:`Cook + cleaner in ${inCity}. Not affordable in Germany.`},
    {icon:"🏠",lbl:"Rent saving",val:rentDeltaVal,sub:`${inCity} vs ${deCity} rent converted to EUR.`},
    {icon:"👨‍👩‍👧",lbl:"Family proximity",val:"Priceless",sub:"No flights required. Back within reach."},
    {icon:"🍽️",lbl:"Cost of living",val:"Lower",sub:"Eating out, travel, leisure — fraction of Germany cost."},
  ];

  return (
    <div style={S.card}>
      <div style={S.eye}>Your Decision Numbers</div>
      <div style={S.title}>Is returning to India worth it?</div>
      {/* City Number label */}
      <div style={{marginBottom:4}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:C.t1}}>{cityNumber}</div>
        <div style={{fontFamily:"Outfit,sans-serif",fontSize:12,color:C.t3}}>{cityNumberSub}</div>
      </div>
      <CalcWorking title="How is this calculated?" rows={(()=>{
        const cs=match.costs;
        const rows:CalcRow[]=[
          {label:"Rent (70th pct × family mult)",value:`₹${cs.rent.toLocaleString()}/mo`},
          {label:"Groceries (70th pct)",value:`₹${cs.groc.toLocaleString()}/mo`},
          {label:"Domestic help (70th pct)",value:`₹${cs.help.toLocaleString()}/mo`},
          {label:"Car & transport",value:`₹${cs.trans.toLocaleString()}/mo`},
          ...(cs.school>0?[{label:"School fees",value:`₹${cs.school.toLocaleString()}/mo`}]:[]),
          {label:"Health insurance",value:`₹${cs.health.toLocaleString()}/mo`},
          {label:"Leisure & misc",value:`₹${(cs.leisure+cs.misc).toLocaleString()}/mo`},
          {label:"Target monthly net (costs × 1.45)",value:`₹${match.targetNet.toLocaleString()}/mo`,muted:false},
          {label:"Match CTC (binary search on calcIN)",value:`₹${match.matchLPA}L`,muted:false},
        ];
        return rows;
      })()}/>
      <div style={{marginBottom:16}}/>
      <div style={{background:bg,border:`1px solid ${bd}`,borderRadius:14,padding:"16px 18px",marginBottom:20}}>
        <div style={{fontSize:13,fontWeight:700,color:col,marginBottom:6}}>{ok?`✓ Offer clears threshold`:`⚠ ₹${(gap/1e5).toFixed(1)}L below lifestyle-match`}</div>
        {[["Your offer",`₹${(ctc/1e5).toFixed(1)}L`,C.t1],["Minimum CTC to maintain Germany lifestyle",`₹${match.matchLPA}L`,C.gold]].map(([l,v,c])=>(
          <div key={l as string} style={{display:"flex",justifyContent:"space-between",fontSize:13,color:C.t2,marginBottom:4}}>
            <span>{l}</span><span style={{fontWeight:600,color:c as string}}>{v}</span>
          </div>
        ))}
        <div style={{fontSize:12,color:C.t2,lineHeight:1.5,marginTop:10}}>{ok?"Offer clears threshold. Germany experience = ₹35L extra headroom by Year 3.":`Counter to ₹${(match.match*1.1/1e5).toFixed(1)}L. Germany experience worth ₹30–50L premium.`}</div>
      </div>
      <div style={{marginTop:16,padding:"12px 14px",borderRadius:10,background:ok?C.grnD:C.redD,border:`1px solid ${ok?C.grnL:"rgba(255,91,91,.25)"}`}}>
        <span style={{fontSize:13,fontWeight:700,color:ok?C.grn:C.red}}>
          {ok?"✓ Your offer is financially sound. Accept.":`✗ Below threshold. Negotiate to ₹${(match.match/1e5).toFixed(1)}L minimum.`}
        </span>
      </div>

      {/* ── What You're Trading ─────────────────────────────────────────────── */}
      <div style={{marginTop:32}}>
        <div style={{fontSize:11,fontWeight:600,letterSpacing:"1.8px",textTransform:"uppercase" as const,color:C.t3,marginBottom:6}}>What You're Trading</div>
        <div style={{fontSize:13,color:C.t3,lineHeight:1.5,marginBottom:16}}>Beyond the CTC number — what actually changes month to month.</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
          {/* Left — What you leave behind */}
          <div style={{background:"rgba(255,91,91,0.06)",border:"1px solid rgba(255,91,91,0.15)",borderRadius:14,padding:"18px"}}>
            <div style={{fontSize:11,fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase" as const,color:C.red,marginBottom:14}}>What you leave behind</div>
            {leaveRows.map((r,i)=>(
              <div key={r.lbl} style={{marginBottom:i<leaveRows.length-1?12:0}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:6,marginBottom:2}}>
                  <span style={{fontSize:12,color:C.t2,flexShrink:0}}>{r.icon} {r.lbl}</span>
                  <span style={{fontSize:12,fontWeight:700,color:C.red,whiteSpace:"nowrap" as const}}>{r.val}</span>
                </div>
                <div style={{fontSize:11,color:C.t3,lineHeight:1.5}}>{r.sub}</div>
              </div>
            ))}
          </div>
          {/* Right — What you gain */}
          <div style={{background:"rgba(0,201,139,0.06)",border:"1px solid rgba(0,201,139,0.15)",borderRadius:14,padding:"18px"}}>
            <div style={{fontSize:11,fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase" as const,color:C.grn,marginBottom:14}}>What you gain</div>
            {gainRows.map((r,i)=>(
              <div key={r.lbl} style={{marginBottom:i<gainRows.length-1?12:0}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:6,marginBottom:2}}>
                  <span style={{fontSize:12,color:C.t2,flexShrink:0}}>{r.icon} {r.lbl}</span>
                  <span style={{fontSize:12,fontWeight:700,color:C.grn,whiteSpace:"nowrap" as const}}>{r.val}</span>
                </div>
                <div style={{fontSize:11,color:C.t3,lineHeight:1.5}}>{r.sub}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Net delta bar */}
        <div style={{background:deltaBg,border:`1px solid ${deltaBorder}`,borderRadius:10,padding:"14px 16px",textAlign:"center" as const}}>
          <div style={{fontSize:14,fontWeight:600,color:deltaColor}}>{deltaLabel}</div>
          <div style={{fontSize:12,color:C.t3,marginTop:4}}>Excludes domestic help gain, health cost, and non-financial factors above.</div>
        </div>
      </div>
    </div>
  );
}

// ─── CARD A: in2de ────────────────────────────────────────────────────────────
function CardA_in({de,india,remEur,dc,ic,ctc,gross,isM,sk3,noKirche}:{de:DE;india:IN;remEur:number;dc:any;ic:any;ctc:number;gross:number;isM:boolean;sk3:number;noKirche?:boolean}) {
  const rentM=(dc.rent[0]+dc.rent[1])/2,grocM=(dc.groc[0]+dc.groc[1])/2,utilM=(dc.util[0]+dc.util[1])/2;
  const resid=Math.max(0,de.net-rentM-grocM-dc.trans-utilM-remEur);
  const segs=[{l:"Rent",c:"#e8a020",v:rentM},{l:"Groceries",c:"#4a90d9",v:grocM},{l:"Transport",c:"#9b59b6",v:dc.trans},{l:"Utilities",c:"#27ae60",v:utilM},{l:"Remittance",c:"#e74c3c",v:remEur},{l:"Yours",c:C.grn,v:resid}];
  const tot=segs.reduce((s,x)=>s+x.v,0)||1;
  return (
    <div style={S.card}>
      <div style={S.eye}>Your First Payslip</div>
      <div style={S.title}>What lands in your German bank account</div>
      <div style={{textAlign:"center",padding:"20px 0 10px"}}>
        <div style={{fontSize:13,color:C.t3,marginBottom:4}}>Real monthly net</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(42px,8vw,64px)",fontWeight:700,color:C.gold,lineHeight:1}}>€{de.net.toLocaleString()}</div>
        <div style={{fontSize:16,color:C.red,textDecoration:"line-through",marginTop:4}}>€{de.gross.toLocaleString()}</div>
        <Acc note="2026 Lohnsteuer (BMF tables). Health 7.3% + nursing 1.7%. Pension 9.3% + unemployment 1.3% capped €96,600. Soli abolished below €19,950 tax." />
        <div style={{display:"inline-flex",alignItems:"center",background:C.redD,border:"1px solid rgba(255,91,91,.25)",borderRadius:20,padding:"5px 14px",fontSize:12,fontWeight:600,color:C.red,marginTop:10}}>−€{de.gap.toLocaleString()}/mo · −€{(de.gap*12).toLocaleString()}/yr</div>
        <CalcWorking title="Deduction breakdown" rows={[
          {label:"Income tax (Lohnsteuer 2026)",value:`€${de.tax.toLocaleString()}/mo`},
          {label:"Solidarity surcharge",value:de.soli>0?`€${de.soli.toLocaleString()}/mo`:"€0 (below threshold)"},
          {label:"Church tax",value:"€0 — not applicable (declared non-Christian at Anmeldung)"},
          {label:"Health + nursing insurance",value:`€${(de.health+de.nursing).toLocaleString()}/mo`},
          {label:"Pension + unemployment",value:`€${de.pension.toLocaleString()}/mo`},
          {label:"Total deductions",value:`€${de.gap.toLocaleString()}/mo`,muted:false},
        ]}/>
      </div>
      <div style={{display:"flex",height:8,borderRadius:4,overflow:"hidden",margin:"20px 0 6px"}}>
        {segs.map(s=><div key={s.l} style={{height:"100%",width:`${(s.v/tot*100).toFixed(1)}%`,background:s.c}}/>)}
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:"6px 12px",fontSize:11,color:C.t3,marginBottom:20}}>
        {segs.map(s=><span key={s.l}><span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:s.c,marginRight:4}}/>{s.l}</span>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,margin:"16px 0"}}>
        {[{flag:"🇮🇳",lbl:"India now",rows:[["CTC",`₹${(ctc/1e5).toFixed(0)}L/yr`],["Net/month",`₹${india.net.toLocaleString()}`],["Tax rate",`${india.eff}%`]],hi:false},
          {flag:"🇩🇪",lbl:"Germany offer",rows:[["Gross",`€${(gross/1000).toFixed(0)}K/yr`],["Net/month",`€${de.net.toLocaleString()}`],["All-in rate",`${de.effRate}%`],["Health ins.","€0 (statutory)"]],hi:true}
        ].map(col=>(
          <div key={col.lbl} style={{background:C.bg1,border:`1px solid ${col.hi?C.goldL:C.b0}`,borderRadius:14,padding:18}}>
            <div style={{fontSize:11,fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase",color:C.t3,marginBottom:12}}>{col.flag} {col.lbl}</div>
            {col.rows.map(([l,v])=><div key={l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${C.b0}`,fontSize:13}}><span style={{color:C.t3}}>{l}</span><span style={{fontWeight:600}}>{v}</span></div>)}
          </div>
        ))}
      </div>
      <Acc note="FY2025-26 new regime: 0–4L@0%, 4–8L@5%, 8–12L@10%, 12–16L@15%, 16–20L@20%, 20–24L@25%, 24L+@30%. Zero tax ≤₹12L (87A). 4% cess." />
      {!isM&&sk3>0&&<div style={{...S.hlGold,fontSize:13,color:C.t2,lineHeight:1.6,marginTop:4}}>💑 <strong style={{color:C.gold}}>Steuerklasse 3:</strong> If you get married, +€{sk3.toLocaleString()}/mo savings.</div>}
    </div>
  );
}

// ─── CARD A: de2in ────────────────────────────────────────────────────────────
function CardA_de({de,india,match,ctc,rate,inCity}:{de:DE;india:IN;match:Match;ctc:number;rate:number;inCity:string}) {
  const cs=match.costs,tot=Object.values(cs).reduce((a,b)=>a+b,0)||1;
  const segs=[
    {l:"Rent",c:"#e8a020",v:cs.rent},
    {l:"Groceries",c:"#4a90d9",v:cs.groc},
    {l:"Help",c:"#9b59b6",v:cs.help},
    {l:"Transport",c:"#27ae60",v:cs.trans},
    ...(cs.school>0?[{l:"School",c:"#f39c12",v:cs.school}]:[]),
    {l:"Health",c:C.grn,v:cs.health},
    {l:"Leisure",c:"#e74c3c",v:cs.leisure},
    {l:"Misc",c:"#7f8c8d",v:cs.misc},
  ];
  const gap=match.match-ctc,ok=gap<=0;
  return (
    <div style={S.card}>
      <div style={S.eye}>Your India Offer — Reality Check</div>
      <div style={S.title}>The CTC you need to match your Germany life</div>
      <div style={{textAlign:"center",padding:"20px 0 10px"}}>
        <div style={{fontSize:13,color:C.t3,marginBottom:4}}>Lifestyle-match CTC needed</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(42px,8vw,64px)",fontWeight:700,color:C.gold,lineHeight:1}}>₹{match.matchLPA}L</div>
        <Acc note={`Match CTC = Indian CTC where take-home covers ${inCity} lifestyle × 1.45 buffer. Includes rent (70th pct × family), groceries, help, car, school (if kids), health, leisure. Binary search on calcIN.`}/>
        <div style={{display:"inline-flex",alignItems:"center",margin:"10px 0",padding:"6px 16px",borderRadius:20,background:ok?C.grnD:C.redD,border:`1px solid ${ok?C.grnL:"rgba(255,91,91,.25)"}`,fontSize:12,fontWeight:600,color:ok?C.grn:C.red}}>
          Your offer ₹{(ctc/1e5).toFixed(1)}L is ₹{Math.abs(gap/1e5).toFixed(1)}L {ok?"above ✓":"below threshold ⚠"}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,margin:"16px 0"}}>
        {[{lbl:"🇩🇪 Germany now",rows:[["Net/month",`€${de.net.toLocaleString()}`],["All-in rate",`${de.effRate}%`]],hi:true},
          {lbl:"🇮🇳 India offer",rows:[["CTC",`₹${(ctc/1e5).toFixed(1)}L/yr`],["Net/month",`₹${india.net.toLocaleString()}`],["EUR equiv",`€${Math.round(india.net/rate).toLocaleString()}`]],hi:false}
        ].map(col=>(
          <div key={col.lbl} style={{background:C.bg1,border:`1px solid ${col.hi?C.goldL:C.b0}`,borderRadius:14,padding:18}}>
            <div style={{fontSize:11,fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase",color:C.t3,marginBottom:12}}>{col.lbl}</div>
            {col.rows.map(([l,v])=><div key={l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${C.b0}`,fontSize:13}}><span style={{color:C.t3}}>{l}</span><span style={{fontWeight:600}}>{v}</span></div>)}
          </div>
        ))}
      </div>
      {/* Purchasing power gap block */}
      {(()=>{
        const deNetINR=Math.round(de.net*rate);
        const indiaMatchNet=deNetINR-match.ppGap;
        const gapColor=match.ppGapColor==="red"?C.red:match.ppGapColor==="gold"?C.gold:C.grn;
        const gapBg=match.ppGapColor==="red"?C.redD:match.ppGapColor==="gold"?C.goldD:C.grnD;
        const gapBd=match.ppGapColor==="red"?"rgba(255,91,91,.25)":match.ppGapColor==="gold"?C.goldL:C.grnL;
        const verdict=match.ppGapColor==="grn"?"Parity achieved":match.ppGapColor==="gold"?"Moderate lifestyle gap":"Significant purchasing power gap";
        return (
          <div style={{background:gapBg,border:`1px solid ${gapBd}`,borderRadius:10,padding:"14px 16px",marginTop:16,marginBottom:4}}>
            <div style={{fontSize:11,fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase" as const,color:gapColor,marginBottom:10}}>Purchasing Power Gap</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <span style={{fontSize:12,color:C.t3}}>🇩🇪 Germany net (INR equiv)</span>
              <span style={{fontSize:13,fontWeight:600,color:C.t1}}>₹{deNetINR.toLocaleString()}/mo</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <span style={{fontSize:12,color:C.t3}}>🇮🇳 India net at match CTC</span>
              <span style={{fontSize:13,fontWeight:600,color:C.t1}}>₹{indiaMatchNet.toLocaleString()}/mo</span>
            </div>
            <div style={{fontSize:14,fontWeight:700,color:gapColor,textAlign:"center" as const}}>
              {match.ppGapPct}% gap · {verdict}
            </div>
          </div>
        );
      })()}
      <div style={{display:"flex",height:8,borderRadius:4,overflow:"hidden",margin:"16px 0 6px"}}>
        {segs.map(s=><div key={s.l} style={{height:"100%",width:`${(s.v/tot*100).toFixed(1)}%`,background:s.c}}/>)}
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:"6px 12px",fontSize:11,color:C.t3}}>
        {segs.map(s=><span key={s.l}><span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:s.c,marginRight:4}}/>{s.l} ₹{Math.round(s.v/1000)}K</span>)}
      </div>
    </div>
  );
}

// ─── CARD B: in2de ────────────────────────────────────────────────────────────
function CardB_in({de,ic,ctc,sk3,rate,noKirche,remEur,fam,dc,deCity,view}:{de:DE;ic:any;ctc:number;sk3:number;rate:number;noKirche:boolean;remEur:number;fam:Fam;dc:any;deCity:string;view:'deductions'|'living'}) {
  const helpEur=Math.round((ic.help[0]+ic.help[1])/2/rate);
  const epf=Math.round(Math.min(ctc*.4*.12,21600)/12);
  const epfEur=Math.round(epf/rate);
  const spreadCost=remEur>0?Math.round(remEur*0.012/1.012):0;
  const bankSpread=0.012, wiseSpread=0.005;
  const monthlySaving=Math.round(remEur*(bankSpread-wiseSpread));
  const annualSaving=monthlySaving*12;
  const wiseNote:ReactNode=(
    <div>
      <div style={{fontSize:13,color:C.t2}}>Your bank charges ~1.2% FX spread on €{remEur}/mo. Wise charges ~0.5%.</div>
      <div style={{fontSize:13,color:C.gold,fontWeight:600,marginTop:4}}>That's €{monthlySaving}/mo (€{annualSaving}/yr) saved.</div>
      <a href="https://wise.com/invite/dic/supradeepc" target="_blank" rel="noopener noreferrer" className="wise-link" style={{display:"block",marginTop:8,fontSize:12,color:C.gold,textDecoration:"none"}}>Get your first transfer free with Wise →</a>
      <div style={{fontSize:10,color:C.t3,fontStyle:"italic",marginTop:4}}>Referral link — Supradeep uses Wise personally.</div>
    </div>
  );
  const isMarried=fam!=="single";

  type RowT={icon:string;lbl:string;val:string;note:ReactNode;type:"unavoidable"|"avoidable"|"opportunity";optedOut?:boolean};
  const rows:RowT[]=[
    {icon:"🏛",lbl:"Income tax",val:`−€${de.tax.toLocaleString()}/mo`,note:`€12,348 tax-free allowance (TC1). Income tax only — total all-in rate incl. social contributions is ${de.effRate}%.`,type:"unavoidable"},
    {icon:"🏥",lbl:"Health + nursing",val:`−€${(de.health+de.nursing).toLocaleString()}/mo`,note:"Statutory KV: employer splits 50/50. Nursing care ~2.05% employee-only. Both mandatory.",type:"unavoidable"},
    {icon:"🏦",lbl:"Pension + unemployment",val:`−€${de.pension.toLocaleString()}/mo`,note:"Pension (RV): 9.3% employee. Unemployment (AV): 1.3%. Ceiling €96,600/yr. Employer matches pension.",type:"unavoidable"},
    {icon:"⛪",lbl:"Church tax",val:`€0/mo — not applicable`,type:"opportunity",optedOut:true,note:'Kirchensteuer only applies to registered members of recognised German churches. Indians declare their religion at Anmeldung and are never enrolled — this deduction simply doesn\'t exist for you.'},
    {icon:"🧹",lbl:"Domestic help — gone",val:`−€${helpEur.toLocaleString()}/mo`,note:"Cook + cleaner ₹12–18K/mo in India. In Germany this is a luxury you can't afford.",type:"avoidable"},
    ...(remEur>0?[{icon:"💸",lbl:"Remittance cost",val:`−€${spreadCost.toLocaleString()}/mo`,note:wiseNote,type:"avoidable" as const}]:[]),
    {icon:"📦",lbl:"EPF stops",val:`−₹${epf.toLocaleString()}/mo (≈ −€${epfEur}/mo)`,note:"Employer PF (12% of basic) stops. German GRV replaces it but locked until German retirement age.",type:"unavoidable"},
    ...(isMarried?[{icon:"💑",lbl:"Steuerklasse 3",val:`+€${sk3.toLocaleString()}/mo`,note:"You're on Tax Class 3 — this is your monthly saving vs Class 1. Apply once at Finanzamt if not yet switched.",type:"opportunity" as const}]:[]),
  ];

  const totalImpact=de.tax+(de.health+de.nursing)+de.pension+(noKirche?0:de.kirche)+helpEur+spreadCost+epfEur;

  const getBadge=(r:RowT)=>{
    if(r.type==="unavoidable") return <span style={S.badge(C.red,"rgba(255,91,91,.08)","rgba(255,91,91,.3)")}>UNAVOIDABLE</span>;
    if(r.type==="opportunity") return <span style={S.badge(C.grn,C.grnD,C.grnL)}>OPPORTUNITY</span>;
    return <span style={S.badge(r.optedOut?C.grn:C.gold,r.optedOut?C.grnD:C.goldD,r.optedOut?C.grnL:C.goldL)}>{r.optedOut?"OPTED OUT":"AVOIDABLE"}</span>;
  };
  const getAmtColor=(r:RowT)=>{
    if(r.type==="opportunity") return C.grn;
    if(r.optedOut) return C.grn;
    if(r.type==="avoidable") return C.gold;
    return C.red;
  };

  // Lifestyle state
  const [lifestyle,setLifestyle]=useState({
    apartment:fam==='married-kids'?'2br':fam==='married'?'1br':'wg',
    cooking:'mix',
    car:false,
    gym:'none',
  });

  // Lifestyle-driven rent — all 12 German cities (Numbeo March 2026)
  const rentRanges={
    wg:{Munich:[700,1000],Berlin:[500,700],Frankfurt:[600,900],Hamburg:[550,800],Stuttgart:[520,780],Nuremberg:[380,600],Cologne:[440,680],Dusseldorf:[440,700],Karlsruhe:[420,650],Leipzig:[320,500],Dresden:[330,520],Mannheim:[430,660]},
    '1br':{Munich:[1200,1700],Berlin:[800,1200],Frankfurt:[1050,1500],Hamburg:[950,1350],Stuttgart:[900,1300],Nuremberg:[650,1000],Cologne:[760,1150],Dusseldorf:[760,1200],Karlsruhe:[900,1350],Leipzig:[650,1000],Dresden:[700,1100],Mannheim:[950,1400]},
    '2br':{Munich:[1700,2300],Berlin:[1100,1650],Frankfurt:[1450,2050],Hamburg:[1300,1850],Stuttgart:[1250,1750],Nuremberg:[900,1400],Cologne:[1050,1550],Dusseldorf:[1050,1600],Karlsruhe:[1250,1750],Leipzig:[900,1350],Dresden:[950,1450],Mannheim:[1300,1850]},
  };
  const rentRange=(rentRanges[lifestyle.apartment as keyof typeof rentRanges] as Record<string,[number,number]>)[deCity]||rentRanges[lifestyle.apartment as keyof typeof rentRanges]['Munich'];
  const rentMid=Math.round((rentRange[0]+rentRange[1])/2);
  const rentLabel=lifestyle.apartment==='wg'?'WG room — shared flat, most common for first 1–2 years':lifestyle.apartment==='1br'?'1-bedroom apartment — own space, mid cost':'2-bedroom apartment — comfortable family setup';
  const rentAccordion=lifestyle.apartment==='wg'?`WG (shared flat) is the norm for first 1–2 years without SCHUFA. Budget €${rentRange[0]}–€${rentRange[1]}/mo in ${deCity}. Use WG-Gesucht.de to search.`:lifestyle.apartment==='1br'?`1-bedroom apartment in ${deCity}. Budget €${rentRange[0]}–€${rentRange[1]}/mo. Expect 2–4 months search time. SCHUFA required by most landlords.`:`2-bedroom apartment in ${deCity}. Budget €${rentRange[0]}–€${rentRange[1]}/mo. School district matters — factor into neighbourhood choice.`;
  const rentValStr=`€${rentRange[0].toLocaleString()}–€${rentRange[1].toLocaleString()}/mo`;

  // Lifestyle-driven groceries
  const grocAmount=lifestyle.cooking==='cook'?dc.groc[1]:lifestyle.cooking==='mix'?Math.round((dc.groc[0]+dc.groc[1])/2):dc.groc[0];
  const eatingOut=lifestyle.cooking==='cook'?0:lifestyle.cooking==='mix'?150:350;
  const grocAccordion=lifestyle.cooking==='cook'?'Cooking most meals — budget toward upper grocery range. Lidl and Aldi significantly cheaper than Rewe or Edeka.':lifestyle.cooking==='mix'?'Mix of cooking and eating out. €150/mo eating out added. German lunch menus (Mittagstisch) run €8–12.':'Convenience-focused. €350/mo eating out added. Deliveroo and Wolt widely available in all major German cities.';

  // Lifestyle-driven transport
  const transAmount=lifestyle.car?dc.trans+400:dc.trans;
  const transAccordion=lifestyle.car?`Monthly pass €${dc.trans} + €400 car costs (insurance, fuel, depreciation). Consider whether you actually need a car — ${deCity} public transport is excellent.`:`Monthly public transport pass only — €${dc.trans}/mo. No car needed in ${deCity}. Germany public transport covers most daily needs.`;

  // Lifestyle-driven gym
  const gymAmount=lifestyle.gym==='none'?0:lifestyle.gym==='basic'?25:75;
  const gymLabel=lifestyle.gym==='none'?'No gym':lifestyle.gym==='basic'?'Basic gym (McFit, Clever Fit)':'Premium gym (Holmes Place, Fitness First)';
  const gymAccordion='Unlike India, company gyms are rare in Germany. Budget €30–80/mo depending on gym tier. Many Indians are surprised by this cost.';

  // Utilities
  const utilMid=Math.round((dc.util[0]+dc.util[1])/2);
  const utilValStr=`€${dc.util[0]}–€${dc.util[1]}/mo`;

  // Totals & remaining
  const totalLiving=rentMid+grocAmount+eatingOut+transAmount+utilMid+gymAmount+25+remEur;
  const remaining=de.net-totalLiving;
  const remainingColor=remaining<300?'#ff5b5b':remaining<600?'#e8a020':'#00c98b';
  const remainingBg=remaining<300?'rgba(255,91,91,0.08)':remaining<600?'rgba(232,160,32,0.12)':'rgba(0,201,139,0.08)';
  const remainingBorder=remaining<300?'rgba(255,91,91,0.25)':remaining<600?'rgba(232,160,32,0.28)':'rgba(0,201,139,0.25)';
  const remainingVerdict=remaining<300?'Tight. Any unexpected cost puts you in the red.':remaining<600?'Manageable. Limited buffer for savings or surprises.':'Comfortable. Room for savings and unexpected costs.';
  const remainingDisplay=remaining>=0?`€${remaining.toLocaleString()}/mo`:`−€${Math.abs(remaining).toLocaleString()}/mo`;

  if(view==='deductions') return (
    <div>
      <div style={{fontSize:11,fontWeight:600,letterSpacing:"1.8px",textTransform:"uppercase",color:C.t3,marginBottom:10}}>What disappears</div>
      {rows.map((r,i)=>(
        <div key={i} style={{padding:"10px 0",borderBottom:`1px solid ${C.b0}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
            <div style={{fontSize:13,fontWeight:600,color:C.t1,flexShrink:0,minWidth:0,flex:1}}>{r.icon} {r.lbl}{getBadge(r)}</div>
            <div style={{fontSize:14,fontWeight:700,whiteSpace:"nowrap",color:getAmtColor(r),flexShrink:0}}>{r.val}</div>
          </div>
          <Acc note={r.note}/>
        </div>
      ))}
      <div style={{padding:"16px 0 4px",borderTop:`2px solid rgba(255,255,255,.1)`,marginTop:4}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:8}}>
          <div style={{fontSize:12,fontWeight:600,color:C.t2,letterSpacing:"0.3px",flexShrink:0}}>Total monthly impact</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:700,color:C.red,lineHeight:1,whiteSpace:"nowrap"}}>−€{totalImpact.toLocaleString()}/mo</div>
        </div>
        <div style={{fontSize:11,color:C.t3,marginTop:3,textAlign:"right"}}>out of €{de.gross.toLocaleString()}/mo gross</div>
      </div>
    </div>
  );

  // view === 'living'
  return (
    <div>
      <div style={{fontSize:11,fontWeight:600,letterSpacing:"1.8px",textTransform:"uppercase",color:C.t3,marginBottom:6}}>What your net has to cover</div>
          {/* Lifestyle customiser */}
          <div style={{background:C.bgi,border:`1px solid ${C.b1}`,borderRadius:10,padding:"12px 14px",marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:600,letterSpacing:"1.8px",textTransform:"uppercase",color:C.t3,marginBottom:4}}>Customise your lifestyle</div>
            <div style={{fontSize:12,color:C.t3,marginBottom:12}}>Adjust to match how you actually plan to live.</div>
            {/* Q1 Apartment */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:600,color:C.t2,marginBottom:6}}>🏠 Apartment</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap" as const}}>
                {([['wg','WG room'],['1br','Studio / 1BR'],['2br','2-bedroom']] as const).map(([v,l])=>(
                  <button key={v} style={pillStyle(lifestyle.apartment===v)} onClick={()=>setLifestyle({...lifestyle,apartment:v})}>{l}</button>
                ))}
              </div>
            </div>
            {/* Q2 Eating habits */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:600,color:C.t2,marginBottom:6}}>🍽 Eating habits</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap" as const}}>
                {([['cook','Cook most meals'],['mix','Mix of both'],['convenience','Prefer convenience']] as const).map(([v,l])=>(
                  <button key={v} style={pillStyle(lifestyle.cooking===v)} onClick={()=>setLifestyle({...lifestyle,cooking:v})}>{l}</button>
                ))}
              </div>
            </div>
            {/* Q3 Car */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:600,color:C.t2,marginBottom:6}}>🚗 Car</div>
              <div style={{display:"flex",gap:6}}>
                <button style={pillStyle(!lifestyle.car)} onClick={()=>setLifestyle({...lifestyle,car:false})}>No car</button>
                <button style={pillStyle(lifestyle.car)} onClick={()=>setLifestyle({...lifestyle,car:true})}>Own a car</button>
              </div>
            </div>
            {/* Q4 Gym */}
            <div>
              <div style={{fontSize:12,fontWeight:600,color:C.t2,marginBottom:6}}>💪 Gym</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap" as const}}>
                {([['none','No gym'],['basic','Basic €25/mo'],['premium','Premium €75/mo']] as const).map(([v,l])=>(
                  <button key={v} style={pillStyle(lifestyle.gym===v)} onClick={()=>setLifestyle({...lifestyle,gym:v})}>{l}</button>
                ))}
              </div>
            </div>
          </div>
          {/* Divider */}
          <div style={{borderTop:`1px solid ${C.b0}`,marginBottom:2}}/>
          {/* Rent */}
          <div style={{padding:"10px 0",borderBottom:`1px solid ${C.b0}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
              <div style={{fontSize:13,fontWeight:600,color:C.t1,flex:1,minWidth:0}}>🏠 Rent</div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:14,fontWeight:700,whiteSpace:"nowrap",color:C.t1}}>{rentValStr}</div>
                <div style={{fontSize:11,color:C.t3,marginTop:2,whiteSpace:"normal",maxWidth:140,textAlign:"right"}}>{rentLabel}</div>
              </div>
            </div>
            <Acc note={rentAccordion}/>
          </div>
          {/* Groceries */}
          <div style={{padding:"10px 0",borderBottom:`1px solid ${C.b0}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
              <div style={{fontSize:13,fontWeight:600,color:C.t1,flex:1}}>🛒 Groceries</div>
              <div style={{fontSize:14,fontWeight:700,whiteSpace:"nowrap",color:C.t1}}>€{grocAmount}/mo</div>
            </div>
            <Acc note={grocAccordion}/>
          </div>
          {/* Eating out — conditional */}
          {eatingOut>0&&(
            <div style={{padding:"10px 0",borderBottom:`1px solid ${C.b0}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                <div style={{fontSize:13,fontWeight:600,color:C.t1,flex:1}}>🍽 Eating out</div>
                <div style={{fontSize:14,fontWeight:700,whiteSpace:"nowrap",color:C.t1}}>€{eatingOut}/mo</div>
              </div>
              <Acc note={`Restaurants and delivery in ${deCity}.`}/>
            </div>
          )}
          {/* Transport */}
          <div style={{padding:"10px 0",borderBottom:`1px solid ${C.b0}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
              <div style={{fontSize:13,fontWeight:600,color:C.t1,flex:1}}>🚌 Transport</div>
              <div style={{fontSize:14,fontWeight:700,whiteSpace:"nowrap",color:C.t1}}>€{transAmount}/mo</div>
            </div>
            <Acc note={transAccordion}/>
          </div>
          {/* Utilities */}
          <div style={{padding:"10px 0",borderBottom:`1px solid ${C.b0}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
              <div style={{fontSize:13,fontWeight:600,color:C.t1,flex:1}}>💡 Utilities</div>
              <div style={{fontSize:14,fontWeight:700,whiteSpace:"nowrap",color:C.t1}}>{utilValStr}</div>
            </div>
            <Acc note="Electricity, internet, heating. Usually partially included in Nebenkosten. Confirm with landlord."/>
          </div>
          {/* Gym — conditional */}
          {gymAmount>0&&(
            <div style={{padding:"10px 0",borderBottom:`1px solid ${C.b0}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                <div style={{fontSize:13,fontWeight:600,color:C.t1,flex:1}}>💪 Gym</div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:14,fontWeight:700,whiteSpace:"nowrap",color:C.t1}}>€{gymAmount}/mo</div>
                  <div style={{fontSize:11,color:C.t3,marginTop:2}}>{gymLabel}</div>
                </div>
              </div>
              <Acc note={gymAccordion}/>
            </div>
          )}
          {/* Phone */}
          <div style={{padding:"10px 0",borderBottom:`1px solid ${C.b0}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
              <div style={{fontSize:13,fontWeight:600,color:C.t1,flex:1}}>📱 Phone</div>
              <div style={{fontSize:14,fontWeight:700,whiteSpace:"nowrap",color:C.t1}}>€25/mo</div>
            </div>
            <Acc note="Prepaid only for first 6 months until SCHUFA builds. Budget €15–40/mo. Avoid signing contracts before SCHUFA is established."/>
          </div>
          {/* Remittance */}
          <div style={{padding:"10px 0",borderBottom:`1px solid ${C.b0}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
              <div style={{fontSize:13,fontWeight:600,color:C.t1,flex:1}}>💸 Remittance</div>
              <div style={{fontSize:14,fontWeight:700,whiteSpace:"nowrap",color:C.t1}}>€{remEur.toLocaleString()}/mo</div>
            </div>
            <Acc note="Your monthly transfer home. Use Wise or Revolut to reduce forex cost to ~0.5%."/>
          </div>
      {/* What's left */}
      <div style={{borderTop:`1px solid ${C.b0}`,marginTop:16,paddingTop:16}}>
        <div style={{background:remainingBg,border:`1px solid ${remainingBorder}`,borderRadius:12,padding:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
            <div style={{fontSize:13,color:C.t2}}>After all costs</div>
            <div style={{fontSize:20,fontWeight:700,whiteSpace:"nowrap",color:remainingColor}}>{remainingDisplay}</div>
          </div>
          <div style={{fontSize:13,color:remainingColor,textAlign:"center",marginTop:10}}>{remainingVerdict}</div>
        </div>
      </div>
    </div>
  );
}

// ─── CARD B: de2in ────────────────────────────────────────────────────────────
function CardB_de({de,india,match,ic,ctc,fam,inCity,view}:{de:DE;india:IN;match:Match;ic:any;ctc:number;fam:Fam;inCity:string;view:'deductions'|'living'}) {
  const pct=((india.net*12/ctc)*100).toFixed(0);
  const rows=[
    {icon:"💼",lbl:"CTC ≠ take-home",val:`~${pct}% reaches account`,note:"Tax + PF + Professional tax remove the rest. Only 60–70% of Indian CTC is typically in-hand."},
    {icon:"🏥",lbl:"Health insurance gap",val:`₹${(match.costs.health*12).toLocaleString()}/yr`,note:"German KV was employer-subsidised. In India a family floater costs ₹18,000–45,000/yr personal expense."},
    {icon:"🧹",lbl:"Domestic help — gain",val:`+₹${((ic.help[0]+ic.help[1])/2/1000).toFixed(0)}K/mo`,green:true,note:"Full-time cook + cleaner in metro India: ₹10,000–18,000/mo. Genuine lifestyle upgrade vs Germany."},
    {icon:"🚗",lbl:"Car cost appears",val:"₹10–20K/mo",note:"Indian metros need a car. EMI + fuel + maintenance = ₹10,000–20,000/mo."},
    {icon:"🏦",lbl:"NPS vs German pension",val:"Different model",note:"German GRV credits locked until retirement age. Indian NPS has 10% employer contribution."},
    {icon:"📊",lbl:"India income tax",val:`₹${(india.tax*12/1e5).toFixed(1)}L/yr`,note:`New regime FY2025-26. Often lower than Germany's ${de.effRate}% for equivalent income.`},
    {icon:"📈",lbl:"Variable pay risk",val:"20–30% of CTC",note:"Indian CTC includes 15–30% variable bonus. Conditional, may be withheld. German salaries are fixed."},
  ];

  // Lifestyle state
  const [lifestyleIn,setLifestyleIn]=useState({
    apartment:fam==='married-kids'?'2bhk':fam==='married'?'1bhk':'pg',
    cooking:'mix',
    transport:'cab',
    help:'none',
    gym:'none',
  });

  // Lifestyle-driven rent — all 13 Indian cities (99acres, NoBroker, QuikrHomes March 2026)
  const inRentRanges={
    pg:{Bangalore:[12000,18000],Hyderabad:[10000,15000],Pune:[9000,14000],Mumbai:[15000,22000],'Delhi NCR':[10000,16000],Chennai:[9000,14000],Kolkata:[7000,11000],Ahmedabad:[6000,10000],Gurgaon:[12000,20000],Noida:[10000,15000],Kochi:[8000,12000],Indore:[6000,10000],Coimbatore:[6000,10000]},
    '1bhk':{Bangalore:[25000,35000],Hyderabad:[18000,28000],Pune:[17000,26000],Mumbai:[35000,55000],'Delhi NCR':[22000,32000],Chennai:[17000,25000],Kolkata:[12000,20000],Ahmedabad:[11000,18000],Gurgaon:[22000,35000],Noida:[17000,28000],Kochi:[12000,20000],Indore:[9000,15000],Coimbatore:[9000,14000]},
    '2bhk':{Bangalore:[40000,55000],Hyderabad:[32000,45000],Pune:[28000,40000],Mumbai:[60000,90000],'Delhi NCR':[35000,55000],Chennai:[28000,42000],Kolkata:[18000,30000],Ahmedabad:[16000,28000],Gurgaon:[35000,55000],Noida:[25000,38000],Kochi:[18000,28000],Indore:[13000,20000],Coimbatore:[13000,18000]},
  };
  const inRentRange=(inRentRanges[lifestyleIn.apartment as keyof typeof inRentRanges] as Record<string,[number,number]>)[inCity]||inRentRanges[lifestyleIn.apartment as keyof typeof inRentRanges]['Bangalore'];
  const inRentMid=Math.round((inRentRange[0]+inRentRange[1])/2);
  const inRentLabel=lifestyleIn.apartment==='pg'?'PG / shared — budget option, common for first few months':lifestyleIn.apartment==='1bhk'?'1BHK — standard for single or couple':'2BHK — comfortable family setup';
  const inRentAccordion=lifestyleIn.apartment==='pg'?`PG or shared flat in ${inCity}. Budget ₹${inRentRange[0].toLocaleString()}–₹${inRentRange[1].toLocaleString()}/mo. Good option for first 3–6 months while you find a permanent place.`:lifestyleIn.apartment==='1bhk'?`1BHK in ${inCity}. Budget ₹${inRentRange[0].toLocaleString()}–₹${inRentRange[1].toLocaleString()}/mo. Expect broker fee of 1 month rent. Most leases are 11 months.`:`2BHK in ${inCity}. Budget ₹${inRentRange[0].toLocaleString()}–₹${inRentRange[1].toLocaleString()}/mo. School proximity and society amenities matter — factor into neighbourhood choice.`;
  const inRentValStr=`₹${inRentRange[0].toLocaleString()}–₹${inRentRange[1].toLocaleString()}/mo`;

  // Lifestyle-driven groceries
  const inGrocAmount=lifestyleIn.cooking==='cook'?ic.groc[1]:lifestyleIn.cooking==='mix'?Math.round((ic.groc[0]+ic.groc[1])/2):ic.groc[0];
  const inEatingOut=lifestyleIn.cooking==='cook'?0:lifestyleIn.cooking==='mix'?8000:20000;
  const inGrocAccordion=lifestyleIn.cooking==='cook'?'Cooking most meals — budget toward upper grocery range. Local sabzi mandis significantly cheaper than supermarkets.':lifestyleIn.cooking==='mix'?'Mix of cooking and eating out. ₹8,000/mo eating out added. Restaurant meals in India are far cheaper than Germany.':'Swiggy/Zomato heavy. ₹20,000/mo eating out added. ₹300–500 per order, 2–3 orders/week adds up fast.';

  // Lifestyle-driven transport
  const inTransCosts={
    cab:{Bangalore:8000,Hyderabad:7000,Pune:6000,Mumbai:5000,'Delhi NCR':7000,Chennai:6000,Kolkata:5000,Ahmedabad:5000,Gurgaon:9000,Noida:7000,Kochi:6000,Indore:5000,Coimbatore:5000},
    car:{Bangalore:18000,Hyderabad:16000,Pune:15000,Mumbai:20000,'Delhi NCR':17000,Chennai:15000,Kolkata:14000,Ahmedabad:13000,Gurgaon:20000,Noida:18000,Kochi:14000,Indore:12000,Coimbatore:11000},
  };
  const inTransAmount=lifestyleIn.transport==='company'?0:(inTransCosts[lifestyleIn.transport as 'cab'|'car'] as Record<string,number>)[inCity]||inTransCosts[lifestyleIn.transport as 'cab'|'car']['Bangalore'];
  const inTransAccordion=lifestyleIn.transport==='cab'?`Ola/Uber daily commute in ${inCity}. ₹${inTransAmount.toLocaleString()}/mo estimate. Auto-rickshaws cheaper for short distances.`:lifestyleIn.transport==='car'?`Own car in ${inCity}. ₹${inTransAmount.toLocaleString()}/mo includes EMI ₹10–12K + fuel ₹4–5K + parking ₹2–3K.`:'Company cab provided — no personal transport cost. Confirm this with your new employer before joining.';

  // Lifestyle-driven domestic help
  const inHelpAmount=lifestyleIn.help==='none'?0:lifestyleIn.help==='parttime'?Math.round(ic.help[0]*0.4):Math.round((ic.help[0]+ic.help[1])/2);
  const inHelpLabel=lifestyleIn.help==='none'?'No domestic help':lifestyleIn.help==='parttime'?'Part-time cleaner only':'Full-time cook + cleaner';
  const inHelpAccordion='Full-time domestic help in India is a genuine lifestyle upgrade vs Germany where it is unaffordable. Cook + cleaner combination is common in metro cities for working professionals.';

  // Lifestyle-driven gym
  const inGymAmount=lifestyleIn.gym==='none'?0:lifestyleIn.gym==='basic'?1500:4000;
  const inGymLabel=lifestyleIn.gym==='none'?'No gym':lifestyleIn.gym==='basic'?'Basic gym (Cult.fit basic, local gym)':'Premium (Cult.fit premium, hotel gym)';
  const inGymAccordion='Gym costs in India are significantly lower than Germany. Many societies also have basic gym facilities included in maintenance.';

  // Static costs
  const inHealthMonthly=fam==='married-kids'?Math.round(45000/12):fam==='married'?Math.round(28000/12):Math.round(15000/12);
  const inPT=Math.round(ic.pt/12);
  const inPhone=500;

  // Totals & remaining
  const inTotalLiving=inRentMid+inGrocAmount+inEatingOut+inTransAmount+inHelpAmount+inGymAmount+inPhone+inHealthMonthly+inPT;
  const inRemaining=india.net-inTotalLiving;
  const inRemainingColor=inRemaining<10000?'#ff5b5b':inRemaining<25000?'#e8a020':'#00c98b';
  const inRemainingBg=inRemaining<10000?'rgba(255,91,91,0.08)':inRemaining<25000?'rgba(232,160,32,0.12)':'rgba(0,201,139,0.08)';
  const inRemainingBorder=inRemaining<10000?'rgba(255,91,91,0.25)':inRemaining<25000?'rgba(232,160,32,0.28)':'rgba(0,201,139,0.25)';
  const inRemainingVerdict=inRemaining<10000?'Tight. Limited buffer at this lifestyle.':inRemaining<25000?'Manageable. Some room for savings.':'Comfortable. Good savings potential.';
  const inRemainingDisplay=inRemaining>=0?`₹${inRemaining.toLocaleString()}/mo`:`−₹${Math.abs(inRemaining).toLocaleString()}/mo`;

  // Pre-built value strings
  const inGrocStr=`₹${inGrocAmount.toLocaleString()}/mo`;
  const inEatingOutStr=`₹${inEatingOut.toLocaleString()}/mo`;
  const inTransStr=`₹${inTransAmount.toLocaleString()}/mo`;
  const inHelpStr=`₹${inHelpAmount.toLocaleString()}/mo`;
  const inGymStr=`₹${inGymAmount.toLocaleString()}/mo`;
  const inHealthStr=`₹${inHealthMonthly.toLocaleString()}/mo`;
  const inPTStr=`₹${inPT.toLocaleString()}/mo`;

  if(view==='deductions') return (
    <div>
      <div style={{fontSize:11,fontWeight:600,letterSpacing:"1.8px",textTransform:"uppercase",color:C.t3,marginBottom:10}}>What you leave behind</div>
      {rows.map((r,i)=>(
        <div key={i} style={{padding:"10px 0",borderBottom:`1px solid ${C.b0}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
            <div style={{fontSize:13,fontWeight:600,color:C.t1,flex:1,minWidth:0}}>{r.icon} {r.lbl}</div>
            <div style={{fontSize:14,fontWeight:700,whiteSpace:"nowrap",color:(r as any).green?C.grn:C.t2,flexShrink:0}}>{r.val}</div>
          </div>
          <Acc note={r.note}/>
        </div>
      ))}
    </div>
  );

  // view === 'living'
  return (
    <div>
      <div style={{fontSize:11,fontWeight:600,letterSpacing:"1.8px",textTransform:"uppercase",color:C.t3,marginBottom:6}}>What your net has to cover</div>
          {/* Lifestyle customiser */}
          <div style={{background:C.bgi,border:`1px solid ${C.b1}`,borderRadius:10,padding:"12px 14px",marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:600,letterSpacing:"1.8px",textTransform:"uppercase",color:C.t3,marginBottom:4}}>Customise your lifestyle</div>
            <div style={{fontSize:12,color:C.t3,marginBottom:12}}>Adjust to match how you actually plan to live in {inCity}.</div>
            {/* Q1 Apartment */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:600,color:C.t2,marginBottom:6}}>🏠 Apartment</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap" as const}}>
                {([['pg','PG / Shared'],['1bhk','1BHK'],['2bhk','2BHK']] as const).map(([v,l])=>(
                  <button key={v} style={pillStyle(lifestyleIn.apartment===v)} onClick={()=>setLifestyleIn({...lifestyleIn,apartment:v})}>{l}</button>
                ))}
              </div>
            </div>
            {/* Q2 Eating habits */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:600,color:C.t2,marginBottom:6}}>🍽 Eating habits</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap" as const}}>
                {([['cook','Cook most meals'],['mix','Mix of both'],['convenience','Swiggy / Zomato']] as const).map(([v,l])=>(
                  <button key={v} style={pillStyle(lifestyleIn.cooking===v)} onClick={()=>setLifestyleIn({...lifestyleIn,cooking:v})}>{l}</button>
                ))}
              </div>
            </div>
            {/* Q3 Transport */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:600,color:C.t2,marginBottom:6}}>🚗 Transport</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap" as const}}>
                {([['cab','Ola / Uber'],['car','Own a car'],['company','Company cab']] as const).map(([v,l])=>(
                  <button key={v} style={pillStyle(lifestyleIn.transport===v)} onClick={()=>setLifestyleIn({...lifestyleIn,transport:v})}>{l}</button>
                ))}
              </div>
            </div>
            {/* Q4 Domestic help */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:600,color:C.t2,marginBottom:6}}>🧹 Domestic help</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap" as const}}>
                {([['none','None'],['parttime','Part-time'],['fulltime','Full-time']] as const).map(([v,l])=>(
                  <button key={v} style={pillStyle(lifestyleIn.help===v)} onClick={()=>setLifestyleIn({...lifestyleIn,help:v})}>{l}</button>
                ))}
              </div>
            </div>
            {/* Q5 Gym */}
            <div>
              <div style={{fontSize:12,fontWeight:600,color:C.t2,marginBottom:6}}>💪 Gym</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap" as const}}>
                {([['none','No gym'],['basic','Basic ₹1,500'],['premium','Premium ₹4,000']] as const).map(([v,l])=>(
                  <button key={v} style={pillStyle(lifestyleIn.gym===v)} onClick={()=>setLifestyleIn({...lifestyleIn,gym:v})}>{l}</button>
                ))}
              </div>
            </div>
          </div>
          {/* Divider */}
          <div style={{borderTop:`1px solid ${C.b0}`,marginBottom:2}}/>
          {/* Rent */}
          <div style={{padding:"10px 0",borderBottom:`1px solid ${C.b0}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
              <div style={{fontSize:13,fontWeight:600,color:C.t1,flex:1,minWidth:0}}>🏠 Rent</div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:14,fontWeight:700,whiteSpace:"nowrap",color:C.t1}}>{inRentValStr}</div>
                <div style={{fontSize:11,color:C.t3,marginTop:2,whiteSpace:"normal",maxWidth:140,textAlign:"right"}}>{inRentLabel}</div>
              </div>
            </div>
            <Acc note={inRentAccordion}/>
          </div>
          {/* Groceries */}
          <div style={{padding:"10px 0",borderBottom:`1px solid ${C.b0}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
              <div style={{fontSize:13,fontWeight:600,color:C.t1,flex:1}}>🛒 Groceries</div>
              <div style={{fontSize:14,fontWeight:700,whiteSpace:"nowrap",color:C.t1}}>{inGrocStr}</div>
            </div>
            <Acc note={inGrocAccordion}/>
          </div>
          {/* Eating out — conditional */}
          {inEatingOut>0&&(
            <div style={{padding:"10px 0",borderBottom:`1px solid ${C.b0}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                <div style={{fontSize:13,fontWeight:600,color:C.t1,flex:1}}>🍽 Eating out</div>
                <div style={{fontSize:14,fontWeight:700,whiteSpace:"nowrap",color:C.t1}}>{inEatingOutStr}</div>
              </div>
              <Acc note={`Restaurants and delivery in ${inCity}. Far cheaper than Germany but adds up with frequency.`}/>
            </div>
          )}
          {/* Transport */}
          <div style={{padding:"10px 0",borderBottom:`1px solid ${C.b0}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
              <div style={{fontSize:13,fontWeight:600,color:C.t1,flex:1}}>🚗 Transport</div>
              <div style={{fontSize:14,fontWeight:700,whiteSpace:"nowrap",color:C.t1}}>{inTransStr}</div>
            </div>
            <Acc note={inTransAccordion}/>
          </div>
          {/* Domestic help — conditional */}
          {inHelpAmount>0&&(
            <div style={{padding:"10px 0",borderBottom:`1px solid ${C.b0}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                <div style={{fontSize:13,fontWeight:600,color:C.t1,flex:1}}>🧹 Domestic help</div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:14,fontWeight:700,whiteSpace:"nowrap",color:C.t1}}>{inHelpStr}</div>
                  <div style={{fontSize:11,color:C.t3,marginTop:2}}>{inHelpLabel}</div>
                </div>
              </div>
              <Acc note={inHelpAccordion}/>
            </div>
          )}
          {/* Gym — conditional */}
          {inGymAmount>0&&(
            <div style={{padding:"10px 0",borderBottom:`1px solid ${C.b0}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                <div style={{fontSize:13,fontWeight:600,color:C.t1,flex:1}}>💪 Gym</div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:14,fontWeight:700,whiteSpace:"nowrap",color:C.t1}}>{inGymStr}</div>
                  <div style={{fontSize:11,color:C.t3,marginTop:2}}>{inGymLabel}</div>
                </div>
              </div>
              <Acc note={inGymAccordion}/>
            </div>
          )}
          {/* Health insurance */}
          <div style={{padding:"10px 0",borderBottom:`1px solid ${C.b0}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
              <div style={{fontSize:13,fontWeight:600,color:C.t1,flex:1}}>🏥 Health insurance</div>
              <div style={{fontSize:14,fontWeight:700,whiteSpace:"nowrap",color:C.t1}}>{inHealthStr}</div>
            </div>
            <Acc note="Personal health cover — was statutory in Germany. Family floater with ₹10L cover costs ₹15,000–45,000/yr depending on family size and insurer."/>
          </div>
          {/* Professional tax — conditional */}
          {inPT>0&&(
            <div style={{padding:"10px 0",borderBottom:`1px solid ${C.b0}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                <div style={{fontSize:13,fontWeight:600,color:C.t1,flex:1}}>🏛 Professional tax</div>
                <div style={{fontSize:14,fontWeight:700,whiteSpace:"nowrap",color:C.t1}}>{inPTStr}</div>
              </div>
              <Acc note="State-level professional tax deducted by employer. Varies by state — Maharashtra ₹200/mo, Karnataka ₹200/mo, others may differ."/>
            </div>
          )}
          {/* Phone */}
          <div style={{padding:"10px 0",borderBottom:`1px solid ${C.b0}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
              <div style={{fontSize:13,fontWeight:600,color:C.t1,flex:1}}>📱 Phone</div>
              <div style={{fontSize:14,fontWeight:700,whiteSpace:"nowrap",color:C.t1}}>₹500/mo</div>
            </div>
            <Acc note="Jio or Airtel postpaid. Far cheaper than Germany — no SCHUFA equivalent needed."/>
          </div>
      {/* What's left */}
      <div style={{borderTop:`1px solid ${C.b0}`,marginTop:16,paddingTop:16}}>
        <div style={{background:inRemainingBg,border:`1px solid ${inRemainingBorder}`,borderRadius:12,padding:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
            <div style={{fontSize:13,color:C.t2}}>After all costs in {inCity}</div>
            <div style={{fontSize:20,fontWeight:700,whiteSpace:"nowrap",color:inRemainingColor}}>{inRemainingDisplay}</div>
          </div>
          <div style={{fontSize:13,color:inRemainingColor,textAlign:"center",marginTop:10}}>{inRemainingVerdict}</div>
        </div>
      </div>
    </div>
  );
}

// ─── CARD C ───────────────────────────────────────────────────────────────────
function CardC({ai,gross,dir}:{ai:AI;gross:number;dir:Dir}) {
  const [copied,setCopied]=useState(false);
  const [negCopied,setNegCopied]=useState(false);
  const [checked,setChecked]=useState({q1:false,q2:false,q3:false,q4:false});
  const [checkedIn,setCheckedIn]=useState({q1:false,q2:false,q3:false,q4:false});

  // ── Blue Card computation (in2de only) ────────────────────────────────────
  const blueCardStatus=gross>=45300?'eligible':gross>=41042?'possible':'ineligible';
  const blueCardBg=blueCardStatus==='eligible'?'rgba(0,201,139,0.08)':'rgba(232,160,32,0.12)';
  const blueCardBorder=blueCardStatus==='eligible'?'rgba(0,201,139,0.25)':'rgba(232,160,32,0.28)';
  const blueCardColor=blueCardStatus==='eligible'?'#00c98b':'#e8a020';
  const blueCardText=blueCardStatus==='eligible'
    ?'✓ Blue Card eligible — your offer clears the €45,300 threshold. Faster path to permanent residency than a standard work permit.'
    :blueCardStatus==='possible'
    ?'⚡ Possibly Blue Card eligible — your offer qualifies if your role is in IT, engineering, or medicine. Confirm with your employer.'
    :'⚠ Below Blue Card threshold — you will need a standard work permit. Ask your employer about sponsored visa options.';

  // ── in2de checklist data ───────────────────────────────────────────────────
  const checkItems:{key:'q1'|'q2'|'q3'|'q4';q:string;c:string}[]=[
    {key:'q1',q:"Do you have €4,000–6,000 saved for the apartment deposit before your first salary lands?",c:"Your first salary arrives 4–6 weeks after joining. Deposit is due before you get keys. Arrange a transfer from India before you fly."},
    {key:'q2',q:"Have you budgeted for 6 months with no credit history in Germany?",c:"No SCHUFA means landlords may reject you, no phone contract, no credit card. Expat-friendly landlords and WG-Gesucht are your first 3 months."},
    {key:'q3',q:"Do you know you need a registered address within 14 days of arrival?",c:"Anmeldung is mandatory within 14 days. Without it you cannot open a bank account or register for tax. Book a temporary flat or hotel with a landlord willing to sign the Wohnungsgeberbestätigung form."},
    {key:'q4',q:"Do you know you have a one-time window to choose GKV vs PKV health insurance?",c:"You have 3 months from start date to opt into private health insurance PKV. After that you are locked into statutory GKV until your salary drops below €69,300. At your salary it is worth evaluating — PKV can be cheaper and better."},
  ];

  // ── in2de summary ─────────────────────────────────────────────────────────
  const checkedCount=Object.values(checked).filter(Boolean).length;
  const summaryText=checkedCount===4
    ?"You have thought this through. Good to go."
    :checkedCount>=2
    ?"A few blind spots worth addressing before you sign."
    :"Several things to sort before you land. None are blockers — all are solvable.";
  const summaryColor=checkedCount===4?'#00c98b':'#e8a020';

  // ── de2in checklist data ───────────────────────────────────────────────────
  const checkItemsIn:{key:'q1'|'q2'|'q3'|'q4';q:string;c:string}[]=[
    {key:'q1',q:"Have you arranged health insurance before your Germany cover ends?",c:"German statutory health ends on your last day. Indian employer group cover may have a waiting period. Arrange a bridge policy or confirm day-one cover with your new employer."},
    {key:'q2',q:"Do you know how Indian PF and gratuity work after a Germany gap?",c:"If you left an Indian employer to move to Germany your PF may be partially withdrawn or dormant. New employer restarts the clock on gratuity — 5 years needed to vest."},
    {key:'q3',q:"Are you aware of your tax residency status for the transition year?",c:"If you spend 182 or more days in India in the financial year of return you become a tax resident. Your Germany income for that period may be taxable in India depending on DTAA provisions."},
    {key:'q4',q:"Have you confirmed when your India variable pay kicks in?",c:"Most Indian companies pay the first bonus after 12 months. Your CTC includes 20 to 30 percent variable — budget conservatively for year one."},
  ];

  // ── de2in summary ─────────────────────────────────────────────────────────
  const checkedInCount=Object.values(checkedIn).filter(Boolean).length;
  const summaryInText=checkedInCount===4
    ?"You have thought this through. Good to go."
    :checkedInCount>=2
    ?"A few things to sort before your last day in Germany."
    :"Several transition items need attention. None are blockers — all are solvable.";
  const summaryInColor=checkedInCount===4?'#00c98b':'#e8a020';

  // ── AI market position & negotiation ────────────────────────────────────────
  const posLabel = dir === 'in2de'
    ? ai.pos === 'above_market' ? 'ABOVE MARKET'
    : ai.pos === 'within_market' ? 'WITHIN MARKET' : 'BELOW MARKET'
    : ai.pos === 'above_match' ? 'ABOVE MATCH'
    : ai.pos === 'at_match' ? 'AT MATCH' : 'BELOW MATCH';
  const posColor = ai.pos?.includes('above') ? '#00c98b'
    : (ai.pos?.includes('within') || ai.pos?.includes('at')) ? '#e8a020'
    : '#ff5b5b';
  const posBg = posColor === '#00c98b' ? 'rgba(0,201,139,0.12)'
    : posColor === '#e8a020' ? 'rgba(232,160,32,0.12)'
    : 'rgba(255,91,91,0.12)';
  const posBorderColor = posColor === '#00c98b' ? 'rgba(0,201,139,0.30)'
    : posColor === '#e8a020' ? 'rgba(232,160,32,0.30)'
    : 'rgba(255,91,91,0.30)';

  // ── shared checklist renderer ─────────────────────────────────────────────
  type CheckKey='q1'|'q2'|'q3'|'q4';
  const renderChecklist=(
    items:{key:CheckKey;q:string;c:string}[],
    state:{q1:boolean;q2:boolean;q3:boolean;q4:boolean},
    toggle:(k:CheckKey)=>void,
    summary:string,
    summaryClr:string
  )=>(
    <div>
      {items.map((item,i)=>{
        const isChecked=state[item.key];
        return (
          <div key={item.key} style={{padding:"14px 0",borderBottom:i<items.length-1?`1px solid ${C.b0}`:"none"}}>
            <div onClick={()=>toggle(item.key)} style={{display:"flex",alignItems:"flex-start",gap:12,cursor:"pointer"}}>
              <div style={{flexShrink:0,width:18,height:18,borderRadius:4,marginTop:1,border:`2px solid ${isChecked?C.grn:C.b1}`,background:isChecked?C.grnD:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}>
                {isChecked&&<span style={{fontSize:10,color:C.grn,lineHeight:1,fontWeight:700}}>✓</span>}
              </div>
              <div style={{fontSize:14,fontWeight:600,color:C.t1,lineHeight:1.5,opacity:isChecked?0.45:1,transition:"opacity .15s"}}>{item.q}</div>
            </div>
            {!isChecked&&<div style={{marginLeft:30,marginTop:7,fontSize:13,color:C.gold,lineHeight:1.5}}>{item.c}</div>}
          </div>
        );
      })}
      <div style={{textAlign:"center" as const,marginTop:20,fontSize:13,fontWeight:600,color:summaryClr}}>{summary}</div>
    </div>
  );

  return (
    <div style={S.card}>
      {/* ── Market Position Badge ────────────────────────────────────────────── */}
      <div style={{marginBottom:20}}>
        <span style={{display:"inline-block",background:posBg,border:`1px solid ${posBorderColor}`,color:posColor,fontSize:11,fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase" as const,padding:"4px 12px",borderRadius:20}}>{posLabel}</span>
      </div>

      {/* ── Negotiation Script ────────────────────────────────────────────────── */}
      <div style={{marginBottom:28}}>
        <div style={{fontSize:11,fontWeight:600,letterSpacing:"1.8px",textTransform:"uppercase" as const,color:C.t3,marginBottom:12}}>Negotiation Script</div>
        <div style={{position:"relative",background:C.goldD,borderLeft:`3px solid ${C.gold}`,borderRadius:"0 10px 10px 0",padding:16}}>
          <div style={{fontSize:14,color:C.t1,lineHeight:1.6,paddingRight:60}}>{ai.neg}</div>
          <button onClick={()=>{navigator.clipboard.writeText(ai.neg);setNegCopied(true);setTimeout(()=>setNegCopied(false),2000);}} style={{position:"absolute",top:12,right:12,background:"none",border:`1px solid ${C.b1}`,borderRadius:8,padding:"5px 10px",color:negCopied?C.grn:C.t3,fontSize:11,cursor:"pointer",transition:"color .2s"}}>{negCopied?"✓ Copied":"⎘ Copy"}</button>
        </div>
      </div>

      {/* ── Verdict (de2in only) ─────────────────────────────────────────────── */}
      {dir==="de2in"&&ai.verdict&&(
        <div style={{background:C.grnD,borderLeft:`3px solid ${C.grn}`,borderRadius:"0 10px 10px 0",padding:16,marginBottom:28}}>
          <div style={{fontSize:14,color:C.t1,lineHeight:1.6}}>{ai.verdict}</div>
        </div>
      )}

      {/* ── 3 Questions ──────────────────────────────────────────────────────── */}
      <div style={{marginBottom:28}}>
        <div style={{fontSize:11,fontWeight:600,letterSpacing:"1.8px",textTransform:"uppercase" as const,color:C.t3,marginBottom:12}}>3 Questions to Ask Someone Who Made This Move</div>
        {ai.q.map((ques,i)=>(
          <div key={i} style={{background:C.bg1,borderRadius:10,padding:"14px 16px",marginBottom:8,display:"flex",gap:14,alignItems:"flex-start"}}>
            <span style={{fontSize:13,fontWeight:700,color:C.gold,flexShrink:0}}>{i+1}</span>
            <span style={{fontSize:14,color:C.t1,lineHeight:1.5}}>{ques}</span>
          </div>
        ))}
      </div>

      {/* ── Shareable Insight ─────────────────────────────────────────────── */}
      <div style={S.eye}>Shareable Insight</div>
      <div style={S.title}>The one line that explains your move</div>
      <div style={{position:"relative",background:C.bg1,borderLeft:`3px solid ${C.gold}`,borderRadius:"0 8px 8px 0",padding:"18px 56px 18px 20px"}}>
        <span style={{fontSize:15,color:C.t1,lineHeight:1.7,fontStyle:"italic"}}>"{ai.insight}"</span>
        <button onClick={()=>{navigator.clipboard.writeText(`"${ai.insight}"`);setCopied(true);setTimeout(()=>setCopied(false),2000);}} style={{position:"absolute",top:12,right:12,background:"none",border:`1px solid ${C.b1}`,borderRadius:8,padding:"5px 10px",color:copied?C.grn:C.t3,fontSize:11,cursor:"pointer",transition:"color .2s"}}>{copied?"✓ Copied":"⎘ Copy"}</button>
      </div>

      {/* ── Before You Sign ───────────────────────────────────────────────── */}
      <div style={{marginTop:36}}>
        <div style={{fontSize:11,fontWeight:600,letterSpacing:"1.8px",textTransform:"uppercase" as const,color:C.t3,marginBottom:16}}>Before You Sign</div>

        {dir==="in2de"?(
          <>
            {/* Blue Card auto block */}
            <div style={{background:blueCardBg,border:`1px solid ${blueCardBorder}`,borderRadius:10,padding:"14px 16px",marginBottom:22}}>
              <div style={{fontSize:13,color:blueCardColor,lineHeight:1.6,fontWeight:500}}>{blueCardText}</div>
            </div>
            {renderChecklist(checkItems,checked,(k)=>setChecked(p=>({...p,[k]:!p[k]})),summaryText,summaryColor)}
          </>
        ):(
          <>
            <div style={{fontSize:13,color:C.t3,lineHeight:1.5,marginBottom:16}}>Things to sort before your Germany chapter closes.</div>
            {renderChecklist(checkItemsIn,checkedIn,(k)=>setCheckedIn(p=>({...p,[k]:!p[k]})),summaryInText,summaryInColor)}
          </>
        )}
      </div>
    </div>
  );
}

// ─── BOOKING CARD ─────────────────────────────────────────────────────────────
function BookingCard({openIntake}:{openIntake:()=>void}) {
  return (
    <div style={{...S.card,background:`linear-gradient(135deg,${C.bg2} 0%,rgba(232,160,32,.06) 100%)`,border:`1px solid ${C.goldL}`}}>
      <div style={{display:"flex",alignItems:"center",gap:20}}>
        <div style={{fontSize:44,flexShrink:0}}>✉️</div>
        <div style={{flex:1}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:C.t1,marginBottom:6}}>Got a question?</div>
          <div style={{fontSize:13,color:C.t2,lineHeight:1.6,marginBottom:16}}>Ask anything about your move — we'll reply within 48 hours.</div>
          <button onClick={openIntake} style={{background:C.gold,color:"#070f1c",border:"none",borderRadius:10,padding:"12px 24px",fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 16px rgba(232,160,32,.3)"}}>Ask a question →</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const { getParam, hasParams, writeParams } = useURLState();
  const [dir,setDir]=useState<Dir>(getParam('dir','in2de') as Dir);
  const [fam,setFam]=useState<Fam>(getParam('fam','single') as Fam);
  const [inCity,setInCity]=useState(getParam('ic','Bangalore'));
  const [deCity,setDeCity]=useState(getParam('dc','Munich'));
  const [ctc,setCtc]=useState(Number(getParam('ctc','3000000')));
  const [gross,setGross]=useState(Number(getParam('gross','65000')));
  const [rem,setRem]=useState(Number(getParam('rem','20000')));
  const [remittanceCurrency,setRemittanceCurrency]=useState<"inr"|"eur">("inr");
  const [commitments,setCommitments]=useState(Number(getParam('comm','0')));
  const [commitmentsCurrency,setCommitmentsCurrency]=useState<"inr"|"eur">("inr");
  const [noKircheInit]=useState(true); // Indians are never enrolled in Kirchensteuer at Anmeldung
  const [rate,setRate]=useState(90);
  const [rateDate,setRateDate]=useState("");
  const [loading,setLoading]=useState(false);
  const [calOpen,setCalOpen]=useState(false);
  const [intakeOpen,setIntakeOpen]=useState(false);
  const [situation,setSituation]=useState('');
  const [question,setQuestion]=useState('');
  const [callInterest,setCallInterest]=useState('');
  const [email,setEmail]=useState('');
  const [submitted,setSubmitted]=useState(false);
  const [emailError,setEmailError]=useState(false);
  const [noKirche,setNoKirche]=useState(noKircheInit);
  const [focusedInput,setFocusedInput]=useState<string|null>(null);
  const [heroInEur,setHeroInEur]=useState(false);
  const [tempInputValue,setTempInputValue]=useState<string>("");
  const [advOpen,setAdvOpen]=useState(false);
  const [savings,setSavings]=useState(5000);
  const [oppLifestyle,setOppLifestyle]=useState<OppLifestyle>({apartment:'wg',cooking:'mix',car:false,gym:'none'});
  const [in2deLifestyle,setIn2deLifestyle]=useState<OppLifestyle>({apartment:'wg',cooking:'mix',car:false,gym:'none'});
  const [inRegime,setInRegime]=useState<"new"|"old">("new");
  const [studentDuration,setStudentDuration]=useState(2);
  const [studentFamilySupport,setStudentFamilySupport]=useState(40000);
  const [studentSavings,setStudentSavings]=useState(500000);

  const [sourcesOpen,setSourcesOpen]=useState(false);
  const [checkedOpp,setCheckedOpp]=useState<Record<string,boolean>>({blockacc:false,health:false,cvde:false,lang:false,network:false});
  const [whatIfGross,setWhatIfGross]=useState<number|null>(null);
  const [urlShared,setUrlShared]=useState(false);
  const [openModal,setOpenModal]=useState<null|'money'|'breakdown'|'nextsteps'|'runway'|'prelanding'>(null);
  const [showDeductions,setShowDeductions]=useState(false);
  const [verdictPulse,setVerdictPulse]=useState(false);
  const _prevVerdictRef=useRef('');

  // EUR/INR fetch
  useEffect(()=>{
    const CK="tp_rate";
    (async()=>{
      try{
        const cached=JSON.parse(localStorage.getItem(CK)||"null");
        if(cached&&Date.now()-cached.ts<4*3600000){setRate(cached.r);setRateDate(cached.d);return;}
        const d=await(await fetch("https://api.frankfurter.dev/v1/latest?base=EUR&symbols=INR")).json();
        setRate(d.rates.INR);setRateDate(d.date);
        localStorage.setItem(CK,JSON.stringify({r:d.rates.INR,d:d.date,ts:Date.now()}));
      }catch{}
    })();
  },[]);


  // Live preview
  const tc=fam!=="single"?3:1;
  const de_live=calcDE(gross,tc,noKirche);
  // de2in live tax preview (computed from current slider values, no calculation logic change)
  const liveDeNet=de_live.net.toLocaleString();
  const liveDeEff=de_live.effRate;
  const liveIn=calcIN(ctc,inCity,inRegime);
  const liveInNet=liveIn.net.toLocaleString();
  const liveInEff=liveIn.eff;
  const sk3Preview=Math.max(0,calcDE(gross,1,noKirche).tax-calcDE(gross,3,noKirche).tax);
  const helpPreview=Math.round(((CITIES.in[inCity]?.help||[12000,18000]).reduce((a,b)=>a+b,0)/2)/rate);

  // Slider fill
  const sliderBg=(val:number,min:number,max:number)=>{
    const pct=(val-min)/(max-min)*100;
    return `linear-gradient(to right,${C.gold} 0%,${C.gold} ${pct}%,#111f35 ${pct}%,#111f35 100%)`;
  };

  function updateOppLifestyle(key:keyof OppLifestyle,val:string|boolean){
    const next={...oppLifestyle,[key]:val};
    setOppLifestyle(next);
  }


  const inCities=["Ahmedabad","Bangalore","Chennai","Coimbatore","Delhi NCR","Gurgaon","Hyderabad","Indore","Kochi","Kolkata","Mumbai","Noida","Pune"];
  const deCities=["Berlin","Cologne","Dresden","Dusseldorf","Frankfurt","Hamburg","Karlsruhe","Leipzig","Mannheim","Munich","Nuremberg","Stuttgart"];

  // ── LIVE COMPUTED RESULTS (always derived from current slider state) ──────────
  const _liveTc = fam!=="single"?3:1;
  const _liveDe = calcDE(gross,_liveTc,noKirche);
  const _liveIn = calcIN(ctc,inCity,inRegime);
  const _liveRemINR = remittanceCurrency==="eur"?Math.round(rem*rate):rem;
  const _liveRemEur = Math.round(_liveRemINR/rate*1.012);
  const _liveIsM = fam!=="single";
  const _liveSk3 = _liveIsM?Math.max(0,calcDE(gross,1).tax-calcDE(gross,3).tax):0;

  const _liveThr = (dir==="in2de"||dir==="de2in")
    ? calcThresholds(deCity,_liveRemINR,rate,fam,ctc,inCity,dir==="in2de"?in2deLifestyle:undefined)
    : null;
  const _liveBe = (dir==="in2de"&&_liveThr)
    ? calcBreakEven(gross,_liveThr,_liveDe,_liveIn,rate,deCity,rem,remittanceCurrency,commitments,commitmentsCurrency)
    : null;
  const _liveFs = fam==="married-kids"?4:fam==="married"?2:1;
  const _liveMatch = dir==="de2in"
    ? calcMatchCTC(deCity,inCity,_liveFs,_liveDe.net,rate,inRegime)
    : null;
  const _liveOpp = dir==="opp"
    ? calcOpp(deCity,savings,fam,oppLifestyle,rate)
    : null;

  // Verdict logic — all derived live
  const _thr = _liveThr;
  const _match = _liveMatch;
  const _grossAboveComfort = !!(_thr && gross >= _thr.comfort);
  const _grossAboveMatch   = !!(_thr && gross >= _thr.match);
  const _grossAboveFloor   = !!(_thr && gross >= _thr.floor);
  const _ctcAboveMatch     = !!(_match && ctc >= _match.match);
  const _comfortK  = _thr ? (_thr.comfort/1000).toFixed(0) : '0';
  const _matchK    = _thr ? (_thr.match/1000).toFixed(0) : '0';
  const _grossK    = (gross/1000).toFixed(0);
  const _aboveComfortK = _thr ? Math.round((gross-_thr.comfort)/1000) : 0;
  const _shortOfComfortK = _thr ? Math.round((_thr.comfort-gross)/1000) : 0;
  const _ctcL   = (ctc/100000).toFixed(1);
  const _ctcAboveMatchL = _match ? ((ctc-_match.match)/100000).toFixed(1) : '0';
  const _counterL = _match ? (_match.match*1.1/100000).toFixed(1) : '0';

  const verdictColor = dir==='in2de' && _thr
    ? (_grossAboveComfort ? '#00c98b' : _grossAboveMatch ? '#e8a020' : '#ff5b5b')
    : dir==='de2in' && _match
      ? (_ctcAboveMatch ? '#00c98b' : '#ff5b5b')
      : C.t2;
  const verdictBg = verdictColor==='#00c98b' ? 'rgba(0,201,139,0.08)' : verdictColor==='#e8a020' ? 'rgba(232,160,32,0.08)' : verdictColor==='#ff5b5b' ? 'rgba(255,91,91,0.08)' : 'transparent';
  const verdictBorder = verdictColor==='#00c98b' ? 'rgba(0,201,139,0.25)' : verdictColor==='#e8a020' ? 'rgba(232,160,32,0.25)' : 'rgba(255,91,91,0.25)';

  const verdictHeadline = dir==='in2de' && _thr
    ? (_grossAboveComfort ? `Strong offer — €${_aboveComfortK}K above comfort`
      : _grossAboveMatch ? `Good offer — counter to €${_comfortK}K`
      : _grossAboveFloor ? `Below parity — minimum €${_matchK}K`
      : `Not viable — counter to €${_comfortK}K`)
    : dir==='de2in' && _match
      ? (_ctcAboveMatch ? `Offer clears threshold — ₹${_ctcAboveMatchL}L above match`
        : `Below match — counter to ₹${_counterL}L`)
      : '';
  const verdictSub = dir==='in2de' && _thr
    ? (_grossAboveComfort ? 'Accept. Your offer clears every threshold.'
      : _grossAboveMatch ? `Accept. Counter to €${_comfortK}K if there is room.`
      : _grossAboveFloor ? `Counter at €${_matchK}K minimum before signing.`
      : `Do not accept. Counter at €${_comfortK}K.`)
    : dir==='de2in' && _match
      ? (_ctcAboveMatch ? 'Accept. Ask for Day 1 health cover in writing.'
        : `Counter before accepting. Target ₹${_counterL}L.`)
      : '';

  const oneThingText = dir==='in2de' && _thr
    ? (_grossAboveComfort
        ? `Email your recruiter today. Subject: "Following up on the ${deCity} offer." Ask: "Is there flexibility on the gross or a relocation allowance? I am targeting €${Math.round(gross*1.08/5000)*5}K."`
        : _grossAboveMatch
        ? `Before your next recruiter call, write down this number: €${Math.round(_thr.comfort/1000)}K. That is your walk-away minimum. Do not accept below it.`
        : `Reply to the offer with one ask: "I am very interested. Can we discuss getting to €${Math.round(_thr.comfort/1000)}K gross? That is my minimum for ${deCity} based on cost of living."`)
    : dir==='de2in' && _match
      ? (_ctcAboveMatch
          ? `Ask your new employer to confirm Day 1 health insurance cover in writing before you resign from your German role.`
          : `Reply to the offer with one ask: "I am very interested. Can we discuss getting to ₹${_counterL}L? That is my lifestyle-match number for ${inCity}."`)
      : '';

  // Verdict pulse — fires when slider crosses a threshold boundary
  const _verdictPos = dir==='in2de'
    ? (_grossAboveComfort?'above_comfort':_grossAboveMatch?'above_match':_grossAboveFloor?'above_floor':'below')
    : dir==='de2in' ? (_ctcAboveMatch?'above':'below') : '';
  useEffect(()=>{
    if(_verdictPos && _prevVerdictRef.current && _verdictPos!==_prevVerdictRef.current){
      setVerdictPulse(true);
      const t=setTimeout(()=>setVerdictPulse(false),1200);
      return ()=>clearTimeout(t);
    }
    _prevVerdictRef.current=_verdictPos;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[_verdictPos]);

  // OPP computed vars
  const _oppR = _liveOpp;
  const _oppRunwayMonths = _oppR?.runwayMonths ?? 0;
  const _oppRunwayText = _oppR?.runwayText ?? '';
  const _oppTargetGross = _oppR?.targetGross ?? 0;
  const _oppTargetGrossK = _oppR ? Math.round(_oppTargetGross / 1000) : 0;
  const _oppMonthlyBurn = _oppR?.monthlyBurn ?? 0;
  const _oppBelowLegal = _oppR?.belowLegal ?? false;
  const _oppLegalMinStr = _oppR ? `€${_oppR.legalMin.toLocaleString()}` : '';
  const _oppRunwayGreat = _oppRunwayMonths >= 12;
  const _oppRunwayGood = !_oppRunwayGreat && _oppRunwayMonths >= 6;
  const _oppPinnedBg = !_oppR ? 'transparent' : _oppRunwayGreat ? 'rgba(0,100,60,0.9)' : _oppRunwayGood ? 'rgba(140,90,0,0.9)' : 'rgba(140,30,30,0.9)';
  const _oppPinnedColor = !_oppR ? C.t2 : _oppRunwayGreat ? '#00c98b' : _oppRunwayGood ? '#e8a020' : '#ff5b5b';
  const _oppPinnedText = !_oppR ? ''
    : _oppRunwayGreat ? `✓ Strong runway · ${_oppRunwayText} · target €${_oppTargetGrossK}K`
    : _oppRunwayGood  ? `↗ Solid runway · ${_oppRunwayText} · target €${_oppTargetGrossK}K`
    : `⚠ Short runway · ${_oppRunwayText} · secure offer within ${_oppRunwayMonths} months`;
  const _oppConfidenceText = !_oppR ? ''
    : _oppRunwayGreat ? 'Your savings cover a full year. Use it to be selective.'
    : _oppRunwayGood  ? 'You have enough to try. Start the job search the day you land.'
    : 'Tight runway. You need a job offer before you land or within 2 months.';
  const _oppConfidenceBg = _oppPinnedColor === '#00c98b' ? 'rgba(0,201,139,0.06)' : _oppPinnedColor === '#e8a020' ? 'rgba(232,160,32,0.06)' : _oppPinnedColor === '#ff5b5b' ? 'rgba(255,91,91,0.06)' : 'transparent';
  const _oppConfidenceBorder = _oppPinnedColor === '#00c98b' ? 'rgba(0,201,139,0.20)' : _oppPinnedColor === '#e8a020' ? 'rgba(232,160,32,0.20)' : _oppPinnedColor === '#ff5b5b' ? 'rgba(255,91,91,0.20)' : 'transparent';
  const _oppOneThingText = !_oppR ? ''
    : _oppRunwayGreat ? `Start your LinkedIn job search today. Set your salary expectation to €${_oppTargetGrossK}K minimum. That is your break-even number for ${deCity}.`
    : _oppRunwayGood  ? `Book a "Germany job search strategy" call this week. You have ${_oppRunwayMonths} months. Use month 1 to line up interviews, not just send CVs.`
    : `Apply for 5 German jobs today. With only ${_oppRunwayMonths} months of runway you cannot afford a slow start.`;
  const _oppChartPositions = _oppR?.cashPositions ?? [];
  const _oppChartMax = _oppChartPositions.length > 0 ? Math.max(..._oppChartPositions.map(m=>m.cash), savings) : 1;
  const _oppChartMin = _oppChartPositions.length > 0 ? Math.min(..._oppChartPositions.map(m=>m.cash), 0) : 0;
  const _oppChartRange = Math.max(1, _oppChartMax - _oppChartMin);
  const _oppRentMid = _oppR?.rentMid ?? 0;
  const _oppGrocMid = _oppR?.grocMid ?? 0;
  const _oppEatingOut = _oppR?.eatingOut ?? 0;
  const _oppTrans = _oppR?.trans ?? 0;
  const _oppGym = _oppR?.gym ?? 0;
  const _oppUtilMid = _oppR?.utilMid ?? 0;
  const _oppHealthFull = _oppR?.healthFull ?? 0;
  const _oppPhone = _oppR?.phone ?? 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Outfit:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Outfit',sans-serif;background:${C.lbg};color:${C.ltxt};overflow-x:hidden}
        select{appearance:none;outline:none}
        input[type=range]{-webkit-appearance:none;width:100%;height:4px;border-radius:2px;cursor:pointer;outline:none;border:none}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:${C.gold};cursor:pointer;box-shadow:0 0 0 4px ${C.goldD},0 2px 6px rgba(0,0,0,.4)}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes verdictPop{0%{transform:scale(1.025);box-shadow:0 0 0 3px rgba(255,255,255,0.08)}100%{transform:scale(1);box-shadow:none}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .jcard{transition:border-color .18s,background .18s,box-shadow .18s;cursor:pointer}
        .jcard:hover{border-color:rgba(0,0,0,0.18)!important;box-shadow:0 2px 12px rgba(0,0,0,.07)!important}
        .ul-input{background:none;border:none;border-bottom:1px solid rgba(255,255,255,0.12);border-radius:0;outline:none;width:100%;font-family:'Outfit',sans-serif;color:#eef2f9;padding:10px 0 8px;font-size:15px;font-weight:600;transition:border-color .15s}
        .ul-input:focus{border-bottom-color:#f59e0b}
        .ul-select{background:none;border:none;border-bottom:1px solid rgba(255,255,255,0.12);border-radius:0;outline:none;width:100%;font-family:'Outfit',sans-serif;color:#eef2f9;padding:10px 0 8px;font-size:15px;cursor:pointer;transition:border-color .15s;appearance:none}
        .ul-select:focus{border-bottom-color:#f59e0b}
        .pill-sm{flex:1;padding:8px 4px;text-align:center;border-radius:6px;font-family:'Outfit',sans-serif;font-size:12px;cursor:pointer;transition:all .15s;white-space:nowrap;border:1px solid transparent}
        @media(max-width:860px){.main-grid{grid-template-columns:1fr!important;gap:32px!important}}
        @media(max-width:760px){.jband-grid{grid-template-columns:1fr 1fr!important}}
        @media(max-width:480px){.jband-grid{grid-template-columns:1fr!important}}
      `}</style>

      {/* NAV — light zone */}
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,height:52,padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",background:C.lbg,borderBottom:`1px solid ${C.lborder}`}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:"#92400e",letterSpacing:".5px"}}>TruePackage</div>
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          {([
            {d:"in2de" as Dir, label:"India → Germany"},
            {d:"de2in" as Dir, label:"Germany → India"},
            {d:"opp"   as Dir, label:"Job Hunt Visa"},
            {d:"student" as Dir, label:"Student"},
          ]).map(item=>(
            <button key={item.d} onClick={()=>{
              setDir(item.d);
              setWhatIfGross(null);
              setTimeout(()=>document.getElementById("calculator")?.scrollIntoView({behavior:"smooth",block:"start"}),50);
            }} style={{
              padding:"5px 13px",borderRadius:20,fontFamily:"Outfit,sans-serif",fontSize:12,fontWeight:600,cursor:"pointer",
              border:`1px solid ${dir===item.d?C.ltxt:"rgba(0,0,0,.12)"}`,
              background:dir===item.d?C.ltxt:"transparent",
              color:dir===item.d?C.lbg:C.ltxt2,
              transition:"all .15s",
            }}>
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* HERO — centered, full-width */}
      <section style={{paddingTop:120,paddingBottom:72,background:C.lbg,textAlign:"center"}}>
        <div style={{maxWidth:680,margin:"0 auto",padding:"0 28px"}}>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(40px,5vw,68px)",fontWeight:700,lineHeight:1.06,color:C.ltxt,marginBottom:16}}>
            Your offer looks great.<br/><span style={{color:"#92400e"}}>Until tax hits.</span>
          </h1>
          <p style={{fontSize:17,color:C.ltxt2,lineHeight:1.7,maxWidth:520,margin:"0 auto 40px"}}>
            Built for Indians navigating Germany — see your real take-home, true living costs, and whether the numbers actually work.
          </p>
          <a href="#calculator" style={{display:"inline-flex",alignItems:"center",gap:8,background:C.ltxt,color:C.lbg,borderRadius:10,padding:"13px 28px",fontFamily:"Outfit,sans-serif",fontSize:15,fontWeight:600,textDecoration:"none",letterSpacing:".2px"}}>
            Start calculating →
          </a>
        </div>
      </section>

      {/* CALCULATOR */}
      <section id="calculator" style={{minHeight:"100vh",paddingTop:56,paddingBottom:80,background:C.lbg}}>
        <div className="main-grid" style={{maxWidth:1060,margin:"0 auto",padding:"0 28px",display:"grid",gridTemplateColumns:"1fr 380px",gap:72,alignItems:"start"}}>

          {/* ── LEFT: narrative + live output ── */}
          <div>
            {/* Glow blob */}
            <div style={{position:"absolute",width:400,height:300,borderRadius:"50%",background:dir==="in2de"?"radial-gradient(ellipse,rgba(99,179,237,.06) 0%,transparent 70%)":dir==="de2in"?"radial-gradient(ellipse,rgba(245,158,11,.06) 0%,transparent 70%)":"radial-gradient(ellipse,rgba(16,217,140,.06) 0%,transparent 70%)",pointerEvents:"none",transform:"translate(-80px,-60px)"}}/>

            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(28px,3.2vw,44px)",fontWeight:700,lineHeight:1.1,color:C.ltxt,marginBottom:10,position:"relative"}}>
              {dir==="in2de"
                ? <>"Germans keep only 52–57% of gross.<br/><span style={{color:"#2563eb"}}>Here's your real first payslip.</span>"</>
                : dir==="de2in"
                ? <>"Indian CTC is a marketing number.<br/><span style={{color:"#d97706"}}>Find the CTC that actually matches Germany.</span>"</>
                : dir==="opp"
                ? <>"No job yet? Here's how long you last.<br/><span style={{color:"#059669"}}>And the offer you must not go below.</span>"</>
                : <>"Before you apply — know your numbers.<br/><span style={{color:"#7c3aed"}}>Sperrkonto, work limits, funding gap.</span>"</>
              }
            </h2>
            <p style={{fontSize:15,color:C.ltxt2,lineHeight:1.7,marginBottom:32,maxWidth:440}}>
              {dir==="in2de"
                ? "Move the sliders and watch your real take-home appear — tax, health, pension and all. Then see your Germany Number: the gross where this move makes sense."
                : dir==="de2in"
                ? "Tax, PF, and variable pay mean Indian take-home is often 40–55% of CTC. See exactly what offer you need to match your Germany lifestyle."
                : dir==="opp"
                ? "Enter your savings and lifestyle. See your exact runway in months and the minimum salary you can accept when offers arrive."
                : "Germany requires €11,208 blocked before your visa. Part-time work covers only part of costs. See your real funding gap — semester by semester."}
            </p>

            {dir==="opp"&&(()=>{
              const wgRange=(DE_RENT_RANGES['wg'] as Record<string,[number,number]>)[deCity]||DE_RENT_RANGES['wg']['Munich'];
              const wgMid=Math.round((wgRange[0]+wgRange[1])/2);
              const dc2=CITIES.de[deCity]||CITIES.de.Munich;
              const oppBurnLo=wgMid+200+dc2.trans+400+25; // WG rent + groceries + transport + health + phone
              const oppBurnHi=Math.round(oppBurnLo*1.25);  // +25% for eating out, misc, one-offs
              return (
                <div style={{borderLeft:"3px solid rgba(5,150,105,.4)",paddingLeft:16,marginBottom:32}}>
                  <p style={{fontSize:15,color:C.ltxt,lineHeight:1.65,fontWeight:500}}>
                    A single person in a WG room in {deCity} typically spends €{oppBurnLo.toLocaleString()}–€{oppBurnHi.toLocaleString()}/mo (rent, groceries, transit, health). Enter your savings and lifestyle to see your exact runway.
                  </p>
                </div>
              );
            })()}
            {dir==="student"&&(()=>{
              const semesters=studentDuration*2;
              const blockedAccTotal=11208*studentDuration;
              const semFees=250*semesters; // avg €250/semester
              const dc=CITIES.de[deCity]||CITIES.de.Munich;
              const wgRange=(DE_RENT_RANGES['wg'] as Record<string,[number,number]>)[deCity]||DE_RENT_RANGES['wg']['Munich'];
              const wgMid=Math.round((wgRange[0]+wgRange[1])/2);
              const monthlyFixed=wgMid+125+Math.round((dc.groc[0]+dc.groc[1])/2)+dc.trans; // WG+health+groc+transit
              const partTimeMonthly=600; // realistic: ~€600/mo (120 days/yr limit)
              const familySupportEur=Math.round(studentFamilySupport/rate);
              const monthlyGap=Math.max(0,monthlyFixed-partTimeMonthly-familySupportEur);
              const totalMonthsStudy=studentDuration*12;
              const totalCashEur=blockedAccTotal+semFees+(monthlyGap*totalMonthsStudy);
              const savingsEur=Math.round(studentSavings/rate);
              const savingsCoversMonths=monthlyGap>0?Math.floor((savingsEur-blockedAccTotal)/Math.max(1,monthlyGap)):totalMonthsStudy;
              const gapColor=monthlyGap<=0?"#10d98c":monthlyGap<300?"#e8a020":"#ff5b5b";
              return (
                <div style={{marginBottom:32}}>
                  <div style={{borderLeft:"3px solid rgba(124,58,237,.5)",paddingLeft:16,marginBottom:24}}>
                    <p style={{fontSize:15,color:C.ltxt,lineHeight:1.65,fontWeight:500}}>
                      A {studentDuration}-year master's in {deCity} needs a Blocked Account of €{blockedAccTotal.toLocaleString()} upfront, plus €{semFees.toLocaleString()} in semester fees. Your monthly budget runs ~€{monthlyFixed.toLocaleString()}/mo — part-time work covers €{partTimeMonthly}/mo and family support covers ~€{familySupportEur.toLocaleString()}/mo.
                    </p>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
                    {[
                      {label:"Blocked Account (Sperrkonto)",val:`€${blockedAccTotal.toLocaleString()}`,sub:`€11,208 × ${studentDuration} yr · shown at visa`,c:"#a78bfa"},
                      {label:"Monthly budget",val:`€${monthlyFixed.toLocaleString()}/mo`,sub:"WG rent + health + groceries + transit",c:"#a78bfa"},
                      {label:"Part-time offset",val:`+€${partTimeMonthly}/mo`,sub:"120 days/yr · Minijob + SHK realistic",c:"#10d98c"},
                      {label:"Monthly gap",val:monthlyGap<=0?"Covered ✓":`€${monthlyGap.toLocaleString()}/mo`,sub:monthlyGap<=0?"Family support + work covers all costs":"Needed from savings or family",c:gapColor},
                    ].map(x=>(
                      <div key={x.label} style={{background:"rgba(124,58,237,.06)",border:"1px solid rgba(124,58,237,.18)",borderRadius:12,padding:"14px 16px"}}>
                        <div style={{fontSize:11,color:C.ltxt3,marginBottom:4}}>{x.label}</div>
                        <div style={{fontSize:18,fontWeight:700,color:x.c,marginBottom:2}}>{x.val}</div>
                        <div style={{fontSize:11,color:C.ltxt3}}>{x.sub}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{background:"rgba(124,58,237,.06)",border:`1px solid ${monthlyGap>400?"rgba(255,91,91,.3)":monthlyGap>0?"rgba(232,160,32,.3)":"rgba(16,217,140,.3)"}`,borderRadius:14,padding:"18px 20px",marginBottom:16}}>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase" as const,color:"#a78bfa",marginBottom:10}}>Total cash needed upfront</div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:34,fontWeight:700,color:"#a78bfa",lineHeight:1.15,marginBottom:4}}>
                      €{totalCashEur.toLocaleString()}
                    </div>
                    <div style={{fontSize:13,color:C.ltxt2,marginBottom:12}}>≈ ₹{Math.round(totalCashEur*rate).toLocaleString()} · Blocked account + semester fees + {studentDuration}-year gap funding</div>
                    <div style={{display:"flex",gap:8}}>
                      {[
                        {label:"Your savings",val:`₹${(studentSavings/1e5).toFixed(1)}L (€${savingsEur.toLocaleString()})`},
                        {label:"Savings runway",val:savingsCoversMonths>=totalMonthsStudy?"Full program":`${savingsCoversMonths} months`},
                        {label:"Semester fees",val:`€${semFees.toLocaleString()}`},
                      ].map(kv=>(
                        <div key={kv.label} style={{flex:1,background:"rgba(0,0,0,.06)",borderRadius:8,padding:"10px 12px"}}>
                          <div style={{fontSize:10,color:C.ltxt3,marginBottom:3}}>{kv.label}</div>
                          <div style={{fontSize:13,fontWeight:700,color:C.ltxt}}>{kv.val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{background:"rgba(124,58,237,.05)",border:"1px solid rgba(124,58,237,.15)",borderRadius:12,padding:"14px 16px"}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#a78bfa",marginBottom:8}}>Per semester breakdown</div>
                    {Array.from({length:semesters},(_,i)=>{
                      const isFirst=i===0;
                      const semCost=(isFirst?11208:0)+250+(monthlyFixed*6)-(partTimeMonthly*6)-(familySupportEur*6);
                      return (
                        <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:i<semesters-1?"1px solid rgba(124,58,237,.1)":"none"}}>
                          <span style={{fontSize:12,color:C.ltxt2}}>Semester {i+1}{isFirst?" (incl. Sperrkonto)":""}</span>
                          <span style={{fontSize:12,fontWeight:700,color:semCost>0?"#e8a020":"#10d98c"}}>{semCost>0?`€${semCost.toLocaleString()} needed`:"Self-funded ✓"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Live preview — tax waterfall */}
            {(dir==="in2de"||dir==="de2in")&&(()=>{
              const gross=de_live.gross,net=de_live.net,tax=de_live.tax,hn=de_live.health+de_live.nursing,pen=de_live.pension,soli=de_live.soli,kirche=de_live.kirche;
              const netPct=net/gross*100,taxPct=tax/gross*100,hnPct=hn/gross*100,penPct=pen/gross*100;
              const miniBar=(val:number,color:string)=>(
                <div style={{flex:1,height:3,background:"rgba(0,0,0,.08)",borderRadius:2,overflow:"hidden",marginLeft:8}}>
                  <div style={{height:"100%",background:color,borderRadius:2,width:`${Math.min(100,val/gross*100*3)}%`,transition:"width .4s"}}/>
                </div>
              );
              // de2in: hero shows India take-home with EUR/INR toggle
              const inNetINR=liveIn.net; // ₹/mo
              const inNetEUR=Math.round(inNetINR/rate);
              const heroVal=dir==="de2in"?(heroInEur?`€${inNetEUR.toLocaleString()}`:`₹${inNetINR.toLocaleString()}`):(`€${net.toLocaleString()}`);
              const heroSub=dir==="de2in"
                ?(heroInEur?`≈ ₹${inNetINR.toLocaleString()}/mo at today's rate`:`≈ €${inNetEUR.toLocaleString()}/mo at today's rate`)
                :`from €${gross.toLocaleString()} gross · only ${netPct.toFixed(0)}% reaches your account`;
              const heroLabel=dir==="de2in"?`India take-home on ₹${(ctc/1e5).toFixed(0)}L CTC`:"You take home";
              return (
                <div style={{marginBottom:28}}>
                  {/* Hero take-home — no box, just text */}
                  <div style={{marginBottom:20}}>
                    <div style={{fontSize:11,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",color:C.ltxt3,marginBottom:6,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" as const}}>
                      {heroLabel}
                      <span style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:"#059669",fontWeight:600}}>
                        <span style={{width:5,height:5,borderRadius:"50%",background:"#059669",display:"inline-block",animation:"pulse 2.5s ease-in-out infinite"}}/>live
                      </span>
                      {dir==="de2in"&&(
                        <button onClick={()=>setHeroInEur(p=>!p)} style={{marginLeft:"auto",fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:20,border:`1px solid ${C.lborder}`,background:"rgba(0,0,0,.05)",color:C.ltxt2,cursor:"pointer",fontFamily:"Outfit,sans-serif",letterSpacing:"0.5px"}}>
                          {heroInEur?"₹ INR":"€ EUR"}
                        </button>
                      )}
                    </div>
                    <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:4}}>
                      <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:64,fontWeight:700,color:"#92400e",lineHeight:1}}>{heroVal}</span>
                      <span style={{fontSize:16,color:C.ltxt3,fontWeight:500}}>/month</span>
                    </div>
                    <div style={{fontSize:13,color:C.ltxt3}}>{heroSub}</div>
                  </div>

                  {/* Compact deduction summary — always visible */}
                  <div style={{display:"flex",height:8,borderRadius:4,overflow:"hidden",marginBottom:10,gap:2}}>
                    {dir==="de2in"?(()=>{
                      const inGross=Math.round(ctc/12),inTax=liveIn.tax,inPF=liveIn.pf,inNet=liveIn.net;
                      const inNetPct=inNet/inGross*100,inTaxPct=inTax/inGross*100,inPFPct=inPF/inGross*100;
                      return (<>
                        <div style={{width:`${inNetPct}%`,background:C.gold,transition:"width .4s"}}/>
                        <div style={{width:`${inTaxPct}%`,background:C.red,transition:"width .4s"}}/>
                        <div style={{width:`${inPFPct}%`,background:"rgba(138,155,184,.4)",transition:"width .4s"}}/>
                        <div style={{flex:1,background:"rgba(0,0,0,.06)"}}/>
                      </>);
                    })():(<>
                      <div style={{width:`${netPct}%`,background:C.gold,transition:"width .4s"}}/>
                      <div style={{width:`${taxPct}%`,background:C.red,transition:"width .4s"}}/>
                      <div style={{width:`${hnPct}%`,background:"rgba(245,91,91,.5)",transition:"width .4s"}}/>
                      <div style={{width:`${penPct}%`,background:"rgba(138,155,184,.4)",transition:"width .4s"}}/>
                      <div style={{flex:1,background:"rgba(0,0,0,.06)"}}/>
                    </>)}
                  </div>
                  <button onClick={()=>setShowDeductions(p=>!p)}
                    style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",padding:0,cursor:"pointer",fontFamily:"Outfit,sans-serif",fontSize:12,color:C.ltxt3,marginBottom:showDeductions?12:0}}>
                    <span style={{fontSize:10,transition:"transform .2s",display:"inline-block",transform:showDeductions?"rotate(90deg)":"none"}}>▶</span>
                    {showDeductions?"Hide deductions":"How is this calculated?"}
                  </button>

                  {showDeductions&&(dir==="de2in"?(()=>{
                    const inGross=Math.round(ctc/12);
                    const inTax=liveIn.tax,inPF=liveIn.pf,inNet=liveIn.net;
                    const inTaxPct=inTax/inGross*100,inPFPct=inPF/inGross*100,inNetPct=inNet/inGross*100;
                    const inMiniBar=(val:number,color:string)=>(
                      <div style={{flex:1,height:3,background:"rgba(0,0,0,.08)",borderRadius:2,overflow:"hidden",marginLeft:8}}>
                        <div style={{height:"100%",background:color,borderRadius:2,width:`${Math.min(100,val/inGross*100*3)}%`,transition:"width .4s"}}/>
                      </div>
                    );
                    return (<>
                      <div style={{display:"flex",gap:14,marginBottom:16,fontSize:11,color:C.ltxt3,flexWrap:"wrap" as const}}>
                        {[{c:C.gold,l:`Take-home ${inNetPct.toFixed(0)}%`},{c:C.red,l:`Tax ${inTaxPct.toFixed(0)}%`},{c:"rgba(138,155,184,.4)",l:`PF ${inPFPct.toFixed(0)}%`}].map(x=>(
                          <span key={x.l} style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:2,background:x.c,display:"inline-block"}}/>{x.l}</span>
                        ))}
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:10,paddingBottom:16,borderBottom:`1px solid ${C.lborder}`}}>
                        {[
                          {lbl:"Income tax",sub:`${inRegime==="new"?"New regime FY26":"Old regime"} · zero tax up to ₹12L`,val:inTax,sym:"₹",color:C.red,pct:inTaxPct,mini:inMiniBar},
                          {lbl:"Provident Fund",sub:"Employee PF — 12% of basic, locked till retirement",val:inPF,sym:"₹",color:"rgba(138,155,184,.6)",pct:inPFPct,mini:inMiniBar},
                        ].map(r=>(
                          <div key={r.lbl}>
                            <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:2}}>
                              <span style={{fontSize:13,color:C.ltxt2,fontWeight:500}}>{r.lbl}</span>
                              <span style={{fontSize:14,fontWeight:700,color:C.ltxt}}>−{r.sym}{r.val.toLocaleString()}</span>
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <span style={{fontSize:11,color:C.ltxt3,flex:1}}>{r.sub}</span>
                              {r.mini(r.val,r.color)}
                              <span style={{fontSize:11,color:C.ltxt3,minWidth:26,textAlign:"right"}}>{r.pct.toFixed(0)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:14}}>
                        <div style={{fontSize:13,color:C.ltxt3}}>vs your German net</div>
                        <span style={{fontSize:14,fontWeight:700,color:net>inNet/rate*1?C.grn:C.red}}>
                          {net>Math.round(inNet/rate)?`+€${(net-Math.round(inNet/rate)).toLocaleString()}/mo ahead`:`−€${(Math.round(inNet/rate)-net).toLocaleString()}/mo behind`}
                        </span>
                      </div>
                    </>);
                  })():(
                  <>
                  <div style={{display:"flex",gap:14,marginBottom:16,fontSize:11,color:C.ltxt3,flexWrap:"wrap" as const}}>
                    {[{c:C.gold,l:`Net ${netPct.toFixed(0)}%`},{c:C.red,l:`Tax ${taxPct.toFixed(0)}%`},{c:"rgba(245,91,91,.5)",l:`Health ${hnPct.toFixed(0)}%`},{c:"rgba(138,155,184,.4)",l:`Pension ${penPct.toFixed(0)}%`}].map(x=>(
                      <span key={x.l} style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:2,background:x.c,display:"inline-block"}}/>{x.l}</span>
                    ))}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:10,paddingBottom:16,borderBottom:`1px solid ${C.lborder}`}}>
                    {[
                      {lbl:"Income tax",sub:"Lohnsteuer · progressive from 14%",val:tax,color:C.red},
                      {lbl:"Health + nursing",sub:"Kranken- & Pflegeversicherung",val:hn,color:"rgba(245,91,91,.6)"},
                      {lbl:"Pension + AV",sub:"Renten- & Arbeitslosenversicherung",val:pen,color:"rgba(138,155,184,.6)"},
                    ].map(r=>(
                      <div key={r.lbl}>
                        <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:2}}>
                          <span style={{fontSize:13,color:C.ltxt2,fontWeight:500}}>{r.lbl}</span>
                          <span style={{fontSize:14,fontWeight:700,color:C.ltxt}}>−€{r.val.toLocaleString()}</span>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:11,color:C.ltxt3,flex:1}}>{r.sub}</span>
                          {miniBar(r.val,r.color)}
                          <span style={{fontSize:11,color:C.t3,minWidth:26,textAlign:"right"}}>{(r.val/gross*100).toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:14,marginBottom:10}}>
                    <div>
                      <div style={{fontSize:13,color:C.ltxt3}}>Monthly gap from gross</div>
                      <div style={{fontSize:11,color:C.ltxt3,marginTop:1}}>Deductions that won't appear in your bank</div>
                    </div>
                    <span style={{fontSize:16,fontWeight:700,color:C.red}}>−€{de_live.gap.toLocaleString()}</span>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:4}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
                      <span style={{color:C.ltxt3}}>⛪ Church tax</span>
                      <span style={{fontWeight:600,color:C.grn}}>€0 — not applicable</span>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
                      <span style={{color:C.ltxt3}}>🧹 Domestic help delta</span>
                      <span style={{fontWeight:600,color:C.ltxt2}}>−€{helpPreview}/mo equiv</span>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:13,filter:"blur(3px)",userSelect:"none" as const}}>
                      <span style={{color:C.ltxt3}}>💡 Steuerklasse 3 tip</span>
                      <span style={{fontWeight:600,color:C.grn}}>+€{sk3Preview.toLocaleString()}/mo</span>
                    </div>
                  </div>
                  </>))}
                </div>
              );
            })()}


            {/* ── DECISION VERDICT CARD (in2de / de2in) ── */}
            {(dir==="in2de"||dir==="de2in")&&_thr&&(
              <div style={{marginTop:32,borderRadius:18,border:`2px solid ${verdictBorder}`,background:verdictBg,padding:"26px 26px 20px",animation:verdictPulse?"verdictPop 0.6s ease":undefined}}>
                <div style={{fontSize:11,fontWeight:800,letterSpacing:"2px",textTransform:"uppercase" as const,color:verdictColor,marginBottom:10}}>Your Decision</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:34,fontWeight:700,color:verdictColor,lineHeight:1.15,marginBottom:6}}>{verdictHeadline}</div>
                <div style={{fontSize:14,color:C.ltxt2,lineHeight:1.6,marginBottom:18}}>{verdictSub}</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap" as const,marginBottom:18}}>
                  {dir==="in2de"&&[
                    {label:"Take-home",val:`€${de_live.net.toLocaleString()}/mo`},
                    {label:"Your comfort number",val:`€${_comfortK}K gross`},
                    {label:"Break-even",val:_liveBe?.ok?`Yr ${_liveBe.yrs}`:"No surplus"},
                  ].map(kv=>(
                    <div key={kv.label} style={{flex:1,minWidth:100,background:"rgba(0,0,0,.05)",borderRadius:10,padding:"12px 14px"}}>
                      <div style={{fontSize:10,color:C.ltxt3,marginBottom:4}}>{kv.label}</div>
                      <div style={{fontSize:15,fontWeight:700,color:C.ltxt}}>{kv.val}</div>
                    </div>
                  ))}
                  {dir==="de2in"&&_match&&[
                    {label:"Your net (DE)",val:`€${de_live.net.toLocaleString()}/mo`},
                    {label:"Match CTC",val:`₹${(_match.match/1e5).toFixed(1)}L`},
                    {label:"India net",val:`₹${_liveIn.net.toLocaleString()}/mo`},
                  ].map(kv=>(
                    <div key={kv.label} style={{flex:1,minWidth:100,background:"rgba(0,0,0,.05)",borderRadius:10,padding:"12px 14px"}}>
                      <div style={{fontSize:10,color:C.ltxt3,marginBottom:4}}>{kv.label}</div>
                      <div style={{fontSize:15,fontWeight:700,color:C.ltxt}}>{kv.val}</div>
                    </div>
                  ))}
                </div>
                {oneThingText&&(
                  <div style={{background:"rgba(232,160,32,0.08)",border:"1px solid rgba(232,160,32,0.22)",borderRadius:12,padding:"14px 16px",marginBottom:16}}>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:"1.8px",textTransform:"uppercase" as const,color:"#e8a020",marginBottom:7}}>One thing to do today</div>
                    <div style={{fontSize:13,color:C.ltxt,lineHeight:1.65}}>{oneThingText}</div>
                  </div>
                )}
                <button onClick={()=>{navigator.clipboard.writeText(window.location.href);setUrlShared(true);setTimeout(()=>setUrlShared(false),2000);}}
                  style={{background:"none",border:`1px solid ${verdictBorder}`,borderRadius:20,padding:"5px 14px",fontSize:11,fontWeight:600,color:C.ltxt2,cursor:"pointer",fontFamily:"Outfit,sans-serif"}}>
                  {urlShared?"✓ Copied!":"🔗 Share these numbers"}
                </button>
              </div>
            )}

            {/* ── 3-CARD GRID (in2de / de2in) ── */}
            {(dir==="in2de"||dir==="de2in")&&_thr&&(()=>{
              const de=_liveDe,india=_liveIn;
              const netPct=Math.round(de.net/de.gross*100);
              const blueCardStatus=gross>=45300?'eligible':gross>=41042?'possible':'ineligible';
              const blueCardBadge=blueCardStatus==='eligible'?'✓ Blue Card eligible':blueCardStatus==='possible'?'⚡ Blue Card possible':'⚠ Below Blue Card';
              const blueCardColor=blueCardStatus==='eligible'?'#00c98b':'#e8a020';
              const cards=[
                {
                  id:'money' as const,
                  badge:'€€€',accent:'#2563eb',
                  title:'Your Money',
                  metric:`€${de.net.toLocaleString()}/mo`,
                  sub:`${netPct}% of gross reaches your account`,
                  tags:['Tax','Health & nursing','Pension'],
                },
                {
                  id:'breakdown' as const,
                  badge:'≡',accent:'#d97706',
                  title:'Full Breakdown',
                  metric:dir==='in2de'?`−€${de.gap.toLocaleString()}/mo`:`₹${india.net.toLocaleString()}/mo`,
                  sub:'Deductions + living cost comparison',
                  tags:['Deductions','Lifestyle costs','Scenarios'],
                },
                {
                  id:'nextsteps' as const,
                  badge:'✓',accent:C.gold,
                  title:'Before You Sign',
                  metric:blueCardBadge,
                  metricColor:blueCardColor,
                  sub:'Things to sort before you accept',
                  tags:['Deposit ready?','Health insurance','Address reg.'],
                },
              ];
              return (
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginTop:14}}>
                  {cards.map(card=>(
                    <button key={card.id} className="jcard" onClick={()=>setOpenModal(card.id)}
                      style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:10,padding:"18px 18px 14px",borderRadius:14,border:`1px solid ${C.lborder}`,background:C.lbg,cursor:"pointer",textAlign:"left" as const,width:"100%"}}>
                      <span style={{fontSize:13,fontWeight:800,color:card.accent,background:`${card.accent}15`,padding:"3px 8px",borderRadius:6}}>{card.badge}</span>
                      <div style={{fontSize:13,fontWeight:700,color:C.ltxt,lineHeight:1.3}}>{card.title}</div>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:700,color:card.metricColor??card.accent,lineHeight:1.2}}>{card.metric}</div>
                      <div style={{fontSize:11,color:C.ltxt3,lineHeight:1.45}}>{card.sub}</div>
                      <div style={{display:"flex",flexWrap:"wrap" as const,gap:4,marginTop:2}}>
                        {card.tags.map(t=>(
                          <span key={t} style={{fontSize:10,fontWeight:600,padding:"2px 7px",borderRadius:20,background:`${card.accent}15`,color:card.accent}}>{t}</span>
                        ))}
                      </div>
                      <div style={{fontSize:11,fontWeight:600,color:card.accent,marginTop:2}}>Open →</div>
                    </button>
                  ))}
                </div>
              );
            })()}

            {/* ── OPP VERDICT CARD + 2-CARD GRID ── */}
            {dir==="opp"&&_oppR&&(
              <>
                <div style={{marginTop:32,borderRadius:18,border:`2px solid ${_oppPinnedColor==='#00c98b'?'rgba(0,201,139,0.35)':_oppPinnedColor==='#e8a020'?'rgba(232,160,32,0.35)':'rgba(255,91,91,0.35)'}`,background:_oppPinnedColor==='#00c98b'?'rgba(0,201,139,0.07)':_oppPinnedColor==='#e8a020'?'rgba(232,160,32,0.07)':'rgba(255,91,91,0.07)',padding:"26px 26px 20px"}}>
                  <div style={{fontSize:11,fontWeight:800,letterSpacing:"2px",textTransform:"uppercase" as const,color:_oppPinnedColor,marginBottom:10}}>Job Hunt Verdict</div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:34,fontWeight:700,color:_oppPinnedColor,lineHeight:1.15,marginBottom:6}}>{_oppPinnedText}</div>
                  <div style={{fontSize:14,color:C.ltxt2,lineHeight:1.6,marginBottom:18}}>{_oppConfidenceText}</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap" as const}}>
                    {[
                      {label:"Runway",val:_oppRunwayText},
                      {label:"Target gross",val:`€${_oppTargetGrossK}K/yr`},
                      {label:"Monthly burn",val:`€${_oppMonthlyBurn.toLocaleString()}/mo`},
                    ].map(kv=>(
                      <div key={kv.label} style={{flex:1,minWidth:90,background:"rgba(0,0,0,.05)",borderRadius:10,padding:"12px 14px"}}>
                        <div style={{fontSize:10,color:C.ltxt3,marginBottom:4}}>{kv.label}</div>
                        <div style={{fontSize:15,fontWeight:700,color:C.ltxt}}>{kv.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:14}}>
                  {[
                    {id:'runway' as const,badge:'📊',accent:'#2563eb',title:'Job Hunt Details',metric:_oppRunwayText,sub:`€${savings.toLocaleString()} → ${_oppRunwayMonths} months`,tags:['Monthly burn','Lifestyle costs','Target gross']},
                    {id:'prelanding' as const,badge:'✓',accent:C.gold,title:'Before You Land',metric:'5 checks',sub:'Pre-departure action list',tags:['Bank account','Job search','Health ins.']},
                  ].map(card=>(
                    <button key={card.id} className="jcard" onClick={()=>setOpenModal(card.id)}
                      style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:10,padding:"18px 18px 14px",borderRadius:14,border:`1px solid ${C.lborder}`,background:C.lbg,cursor:"pointer",textAlign:"left" as const,width:"100%"}}>
                      <span style={{fontSize:13,fontWeight:800,color:card.accent,background:`${card.accent}15`,padding:"3px 8px",borderRadius:6}}>{card.badge}</span>
                      <div style={{fontSize:13,fontWeight:700,color:C.ltxt}}>{card.title}</div>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:card.accent,lineHeight:1.2}}>{card.metric}</div>
                      <div style={{fontSize:11,color:C.ltxt3}}>{card.sub}</div>
                      <div style={{display:"flex",flexWrap:"wrap" as const,gap:4,marginTop:2}}>
                        {card.tags.map(t=>(
                          <span key={t} style={{fontSize:10,fontWeight:600,padding:"2px 7px",borderRadius:20,background:`${card.accent}15`,color:card.accent}}>{t}</span>
                        ))}
                      </div>
                      <div style={{fontSize:11,fontWeight:600,color:card.accent,marginTop:2}}>Open →</div>
                    </button>
                  ))}
                </div>
              </>
            )}

          </div>

          {/* ── RIGHT: slim control strip — dark card ── */}
          <div style={{position:"sticky",top:72,alignSelf:"start",background:C.bg1,borderRadius:20,padding:"18px 18px",border:`1px solid ${C.b0}`}}>
            {(()=>{
              // Helpers
              const sec=(title:string,hint?:string)=>(
                <div style={{marginBottom:2}}>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase" as const,color:C.t3}}>{title}</div>
                  {hint&&<div style={{fontSize:11,color:C.t3,marginTop:2,lineHeight:1.5}}>{hint}</div>}
                </div>
              );
              const sub=(txt:string)=><div style={{fontSize:11,color:C.t3,marginTop:5,lineHeight:1.5}}>{txt}</div>;
              const pill=(label:string,active:boolean,onClick:()=>void,accentColor?:string)=>(
                <button className="pill-sm" onClick={onClick}
                  style={{background:active?(accentColor??C.gold):"transparent",border:`1px solid ${active?(accentColor??C.gold):"rgba(255,255,255,0.1)"}`,color:active?(accentColor?C.t1:"#070f1c"):C.t3,fontWeight:active?700:400}}>
                  {label}
                </button>
              );
              const divider=()=><div style={{height:1,background:"rgba(255,255,255,.06)",margin:"12px 0"}}/>;
              const sliderField=(lbl:string,val:number,setter:(v:number)=>void,min:number,max:number,step:number,fmtVal:string,ctx:string,inputKey:string)=>(
                <div style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:2}}>
                    <span style={{fontSize:13,color:C.t2,fontWeight:500}}>{lbl}</span>
                    <input className="currency-input" type="text"
                      value={focusedInput===inputKey?tempInputValue:fmtVal}
                      onFocus={()=>{setFocusedInput(inputKey);setTempInputValue(String(val));}}
                      onBlur={()=>{setFocusedInput(null);let p=parseFloat(tempInputValue);if(isNaN(p))p=min;setter(Math.max(min,Math.min(max,p)));}}
                      onChange={e=>setTempInputValue(e.target.value)}
                      style={{color:C.gold,fontSize:16,fontWeight:700,background:"none",border:"none",borderBottom:`1px solid ${focusedInput===inputKey?"rgba(245,158,11,.6)":"rgba(255,255,255,.1)"}`,outline:"none",fontFamily:"Outfit,sans-serif",padding:"0 0 3px",cursor:"text",width:120,textAlign:"right",transition:"border-color .15s"}}
                    />
                  </div>
                  <input type="range" min={min} max={max} step={step} value={val} onChange={e=>setter(+e.target.value)} style={{backgroundImage:sliderBg(val,min,max),marginBottom:3}}/>
                  {rateDate&&<div style={{fontSize:11,color:C.t3,textAlign:"right"}}>{ctx}</div>}
                </div>
              );

              return (
                <div style={{display:"flex",flexDirection:"column"}}>

                  {/* ── ROUTE ── */}
                  {sec("Route")}
                  {(dir==="opp"||dir==="student")
                    ? <div style={{position:"relative",marginBottom:16}}>
                        <select className="ul-select" value={deCity} onChange={e=>setDeCity(e.target.value)}>
                          {deCities.map(o=><option key={o} style={{background:"#0b1020"}}>{o}</option>)}
                        </select>
                        <span style={{position:"absolute",right:0,bottom:10,color:C.t3,pointerEvents:"none",fontSize:11}}>▾</span>
                      </div>
                    : <div style={{display:"flex",alignItems:"flex-end",gap:10,marginBottom:16}}>
                        <div style={{flex:1,position:"relative"}}>
                          <div style={{fontSize:10,color:C.t3,marginBottom:2}}>{dir==="in2de"?"From (India)":"From (Germany)"}</div>
                          <select className="ul-select" value={dir==="in2de"?inCity:deCity} onChange={e=>dir==="in2de"?setInCity(e.target.value):setDeCity(e.target.value)}>
                            {(dir==="in2de"?inCities:deCities).map(o=><option key={o} style={{background:"#0b1020"}}>{o}</option>)}
                          </select>
                          <span style={{position:"absolute",right:0,bottom:10,color:C.t3,pointerEvents:"none",fontSize:11}}>▾</span>
                        </div>
                        <span style={{fontSize:18,color:C.t3,paddingBottom:10,flexShrink:0}}>→</span>
                        <div style={{flex:1,position:"relative"}}>
                          <div style={{fontSize:10,color:C.t3,marginBottom:2}}>{dir==="in2de"?"To (Germany)":"To (India)"}</div>
                          <select className="ul-select" value={dir==="in2de"?deCity:inCity} onChange={e=>dir==="in2de"?setDeCity(e.target.value):setInCity(e.target.value)}>
                            {(dir==="in2de"?deCities:inCities).map(o=><option key={o} style={{background:"#0b1020"}}>{o}</option>)}
                          </select>
                          <span style={{position:"absolute",right:0,bottom:10,color:C.t3,pointerEvents:"none",fontSize:11}}>▾</span>
                        </div>
                      </div>
                  }


                  {dir==="opp"&&<>
                    {divider()}
                    {sec("Money to bring")}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:2}}>
                      <span style={{fontSize:13,color:C.t2}}>Liquid savings</span>
                      <span style={{fontSize:16,fontWeight:700,color:C.gold}}>€{(savings/1000).toFixed(0)}K</span>
                    </div>
                    <input type="range" min={2000} max={30000} step={500} value={savings} onChange={e=>setSavings(+e.target.value)} style={{backgroundImage:sliderBg(savings,2000,30000)}}/>
                    {sub(`Cash you can access freely — for rent deposit, IKEA run, and living costs until first payslip.`)}
                    <div style={{marginTop:10,background:"rgba(124,58,237,.08)",border:"1px solid rgba(124,58,237,.2)",borderRadius:8,padding:"10px 12px"}}>
                      <div style={{fontSize:11,fontWeight:700,color:"#a78bfa",marginBottom:4}}>Blocked Account (Sperrkonto)</div>
                      <div style={{fontSize:13,fontWeight:700,color:"#a78bfa"}}>€11,208</div>
                      <div style={{fontSize:11,color:C.t3,marginTop:2}}>Required by German embassy for job-seeker visa · separate from liquid savings · released ~€934/mo</div>
                    </div>
                    <div style={{marginTop:8,fontSize:11,color:C.t3,lineHeight:1.5}}>
                      Total you need: <span style={{color:C.gold,fontWeight:700}}>€{(savings+11208).toLocaleString()}</span> (€{(savings/1000).toFixed(0)}K liquid + €11,208 Sperrkonto)
                    </div>
                  </>}

                  {dir==="student"&&<>
                    {divider()}
                    {sec("Program duration")}
                    <div style={{display:"flex",gap:6,marginBottom:12}}>
                      {([2,3,4] as const).map(y=>(
                        <button key={y} className="pill-sm" onClick={()=>setStudentDuration(y)}
                          style={{flex:1,background:studentDuration===y?"#7c3aed":"transparent",border:`1px solid ${studentDuration===y?"#7c3aed":"rgba(255,255,255,0.1)"}`,color:studentDuration===y?"#fff":C.t3,fontWeight:studentDuration===y?700:400}}>
                          {y} yr
                        </button>
                      ))}
                    </div>
                    {divider()}
                    {sec("Family support","Monthly transfer from family in India.")}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:2}}>
                      <span style={{fontSize:13,color:C.t2}}>Amount</span>
                      <span style={{fontSize:16,fontWeight:700,color:"#a78bfa"}}>₹{(studentFamilySupport/1000).toFixed(0)}K/mo</span>
                    </div>
                    <input type="range" min={0} max={100000} step={5000} value={studentFamilySupport} onChange={e=>setStudentFamilySupport(+e.target.value)} style={{backgroundImage:sliderBg(studentFamilySupport,0,100000)}}/>
                    {sub(`≈ €${Math.round(studentFamilySupport/rate).toLocaleString()}/mo · covers part of the ${deCity} monthly budget`)}
                    {divider()}
                    {sec("Savings from India","Lump sum you bring before departure.")}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:2}}>
                      <span style={{fontSize:13,color:C.t2}}>Amount</span>
                      <span style={{fontSize:16,fontWeight:700,color:"#a78bfa"}}>₹{(studentSavings/1e5).toFixed(1)}L</span>
                    </div>
                    <input type="range" min={0} max={2000000} step={50000} value={studentSavings} onChange={e=>setStudentSavings(+e.target.value)} style={{backgroundImage:sliderBg(studentSavings,0,2000000)}}/>
                    {sub(`≈ €${Math.round(studentSavings/rate).toLocaleString()} · used for Sperrkonto + deposit + early gap months`)}
                  </>}

                  {dir!=="opp"&&divider()}

                  {/* ── NUMBERS ── */}
                  {dir!=="opp"&&<>
                    {sec("Numbers")}
                    {sliderField(
                      dir==="in2de"?"Your Indian CTC":"India offer CTC",
                      ctc,setCtc,
                      dir==="in2de"?500000:1500000,dir==="in2de"?10000000:30000000,500000,
                      `₹${(ctc/1e5).toFixed(0)}L/yr`,
                      `≈ €${Math.round(ctc/rate/1000)}K/yr · take-home ~₹${(ctc*0.47/12/1000).toFixed(0)}K/mo`,
                      "ctc"
                    )}
                    {dir==="de2in"&&<div style={{fontSize:11,color:C.t3,marginTop:-14,marginBottom:14}}>Only ₹{((ctc*0.7)/1e5).toFixed(1)}L (~70%) is likely fixed. Variable pay is conditional and often not paid to new joiners.</div>}

                    {sliderField(
                      dir==="in2de"?"German gross offer":"Your German gross",
                      gross,setGross,40000,150000,5000,
                      `€${(gross/1000).toFixed(0)}K/yr`,
                      `≈ ₹${(gross*rate/1e5).toFixed(1)}L/yr · net ~€${calcDE(gross,fam!=="single"?3:1,false).net.toLocaleString()}/mo`,
                      "gross"
                    )}
                    {dir==="de2in"&&<div style={{marginBottom:12}}>
                      <div style={{fontSize:13,color:C.t2,marginBottom:8}}>India tax regime</div>
                      <div style={{display:"flex",gap:6,marginBottom:6}}>
                        {([["new","New FY26"],["old","Old regime"]] as ["new"|"old",string][]).map(([v,l])=>pill(l,inRegime===v,()=>setInRegime(v),"rgba(245,158,11,.8)"))}
                      </div>
                      {sub(inRegime==="old"
                        ?"Old regime: ₹50K standard deduction + up to ₹1.5L via 80C (PF). Best if you claim HRA or have a home loan."
                        :"New regime: ₹75K standard deduction. Zero tax up to ₹12L income. No 80C or HRA — simpler and better for most salaried employees.")}
                    </div>}
                    {divider()}
                  </>}

                  {/* ── PROFILE ── */}
                  {sec("Profile")}
                  <div style={{fontSize:13,color:C.t2,marginBottom:8}}>Family status</div>
                  <div style={{display:"flex",gap:6,marginBottom:6}}>
                    {([["single","Single"],["married","Married"],["married-kids","+ Kids"]] as const).map(([v,l])=>pill(l,fam===v,()=>setFam(v),"rgba(16,217,140,.8)"))}
                  </div>
                  {dir==="in2de"&&sub(`Tax Class ${tc} in Germany. Your all-in deduction rate: ${de_live.effRate}% of gross (tax + health + pension).`)}
                  {dir==="de2in"&&sub(`🇩🇪 Take-home: €${liveDeNet}/mo at ${liveDeEff}% all-in · 🇮🇳 Take-home: ₹${liveInNet}/mo at ${liveInEff}% effective.`)}


                  {divider()}

                  {/* ── MORE OPTIONS ── */}
                  <button onClick={()=>setAdvOpen(p=>!p)}
                    style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",padding:"11px 14px",borderRadius:8,border:`1px dashed ${advOpen?"rgba(245,158,11,.4)":"rgba(255,255,255,.15)"}`,background:advOpen?"rgba(245,158,11,.05)":"transparent",cursor:"pointer",fontFamily:"Outfit,sans-serif",transition:"all .18s",marginBottom:advOpen?16:0}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(245,158,11,.5)";e.currentTarget.style.background="rgba(245,158,11,.07)";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=advOpen?"rgba(245,158,11,.4)":"rgba(255,255,255,.15)";e.currentTarget.style.background=advOpen?"rgba(245,158,11,.05)":"transparent";}}>
                    <span style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:2}}>
                      <span style={{fontSize:13,fontWeight:600,color:advOpen?C.gold:C.t1}}>Refine your numbers</span>
                      <span style={{fontSize:11,color:C.t3}}>Remittance · commitments · lifestyle</span>
                    </span>
                    <span style={{fontSize:12,color:advOpen?C.gold:C.t3,display:"inline-block",transform:advOpen?"rotate(180deg)":"rotate(0deg)",transition:"transform .18s"}}>▾</span>
                  </button>

                  {advOpen&&(()=>{
                    const ls=dir==="in2de"?in2deLifestyle:oppLifestyle;
                    const setLs=(k:string,v:string|boolean)=>dir==="in2de"?setIn2deLifestyle(p=>({...p,[k]:v})):updateOppLifestyle(k as keyof OppLifestyle,v);
                    const chipPill=(label:string,active:boolean,onClick:()=>void)=>(
                      <button onClick={onClick} style={{padding:"7px 10px",borderRadius:6,border:`1px solid ${active?"rgba(245,158,11,.7)":"rgba(255,255,255,.1)"}`,background:active?"rgba(245,158,11,.12)":"transparent",color:active?C.gold:C.t3,fontFamily:"Outfit,sans-serif",fontSize:12,fontWeight:active?600:400,cursor:"pointer",whiteSpace:"nowrap" as const,transition:"all .15s"}}>
                        {label}
                      </button>
                    );
                    const moneyChip=(label:string,value:string,expandKey:string,children:ReactNode)=>{
                      const open=focusedInput===expandKey;
                      return (
                        <div style={{background:"rgba(255,255,255,.04)",borderRadius:8,padding:"10px 12px",border:`1px solid ${open?"rgba(245,158,11,.3)":"rgba(255,255,255,.07)"}`,transition:"border-color .15s"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={()=>setFocusedInput(open?null:expandKey)}>
                            <span style={{fontSize:12,color:C.t2}}>{label}</span>
                            <div style={{display:"flex",alignItems:"center",gap:6}}>
                              <span style={{fontSize:13,fontWeight:700,color:open?C.gold:C.t1}}>{value}</span>
                              <span style={{fontSize:10,color:C.t3,transform:open?"rotate(180deg)":"none",transition:"transform .15s",display:"inline-block"}}>▾</span>
                            </div>
                          </div>
                          {open&&<div style={{marginTop:10}}>{children}</div>}
                        </div>
                      );
                    };
                    return (
                      <div style={{display:"flex",flexDirection:"column",gap:16,paddingTop:4}}>

                        {/* ── ① MONEY FLOWS ── */}
                        {dir!=="opp"&&<div>
                          <div style={{fontSize:10,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase" as const,color:C.t3,marginBottom:8}}>Money flows</div>
                          <div style={{display:"flex",flexDirection:"column",gap:8}}>
                            {moneyChip(
                              dir==="in2de"?"Monthly remittance to India":"Monthly transfer to Germany",
                              `${remittanceCurrency==="inr"?"₹":"€"}${formatCurrency(rem,remittanceCurrency)}/mo`,
                              "remittance",
                              <>
                                <div style={{display:"flex",gap:4,marginBottom:8}}>
                                  {(["inr","eur"] as const).map(c=><button key={c} onClick={()=>setRemittanceCurrency(c)} style={{padding:"3px 10px",borderRadius:4,border:`1px solid ${remittanceCurrency===c?"rgba(245,158,11,.6)":"rgba(255,255,255,.1)"}`,background:remittanceCurrency===c?"rgba(245,158,11,.12)":"transparent",color:remittanceCurrency===c?C.gold:C.t3,fontSize:11,fontWeight:600,cursor:"pointer"}}>{c==="inr"?"₹ INR":"€ EUR"}</button>)}
                                </div>
                                <input type="range" min={0} max={dir==="in2de"?300000:200000} step={5000} value={rem} onChange={e=>setRem(+e.target.value)} style={{backgroundImage:sliderBg(rem,0,dir==="in2de"?300000:200000)}}/>
                                <div style={{fontSize:11,color:C.t3,marginTop:4}}>Money sent home every month — reduces your effective surplus in Germany.</div>
                              </>
                            )}
                            {moneyChip(
                              "Fixed monthly commitments",
                              `${commitmentsCurrency==="inr"?"₹":"€"}${formatCurrency(commitments,commitmentsCurrency)}/mo`,
                              "commitments",
                              <>
                                <div style={{display:"flex",gap:4,marginBottom:8}}>
                                  {(["inr","eur"] as const).map(c=><button key={c} onClick={()=>setCommitmentsCurrency(c)} style={{padding:"3px 10px",borderRadius:4,border:`1px solid ${commitmentsCurrency===c?"rgba(245,158,11,.6)":"rgba(255,255,255,.1)"}`,background:commitmentsCurrency===c?"rgba(245,158,11,.12)":"transparent",color:commitmentsCurrency===c?C.gold:C.t3,fontSize:11,fontWeight:600,cursor:"pointer"}}>{c==="inr"?"₹ INR":"€ EUR"}</button>)}
                                </div>
                                <input type="range" min={0} max={500000} step={5000} value={commitments} onChange={e=>setCommitments(+e.target.value)} style={{backgroundImage:sliderBg(commitments,0,500000)}}/>
                                <div style={{fontSize:11,color:C.t3,marginTop:4}}>Home loan EMI, insurance, family support — anything leaving your account regardless of where you live.</div>
                              </>
                            )}
                            {dir==="in2de"&&moneyChip(
                              "Savings to bring",
                              `€${(savings/1000).toFixed(0)}K`,
                              "savings-adv",
                              <>
                                <input type="range" min={0} max={50000} step={1000} value={savings} onChange={e=>setSavings(+e.target.value)} style={{backgroundImage:sliderBg(savings,0,50000)}}/>
                                <div style={{fontSize:11,color:C.t3,marginTop:4}}>Covers apartment deposit (2–3mo rent), IKEA run, and the gap before first payslip.</div>
                              </>
                            )}
                          </div>
                        </div>}

                        {/* ── ② GERMANY LIFESTYLE ── */}
                        {(dir==="in2de"||dir==="opp")&&<div>
                          <div style={{fontSize:10,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase" as const,color:C.t3,marginBottom:4}}>Germany lifestyle</div>
                          <div style={{fontSize:11,color:C.t3,marginBottom:10}}>Adjusts your Floor / Parity / Comfort thresholds.</div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                            {/* Apartment */}
                            <div style={{background:"rgba(255,255,255,.03)",borderRadius:8,padding:"10px 12px"}}>
                              <div style={{fontSize:10,color:C.t3,marginBottom:6,fontWeight:600}}>🏠 Apartment</div>
                              <div style={{display:"flex",flexDirection:"column" as const,gap:4}}>
                                {([["wg","Shared (WG)"],["1br","1 Bedroom"],["2br","2 Bedroom"]] as [string,string][]).map(([v,l])=>chipPill(l,ls.apartment===v,()=>setLs("apartment",v)))}
                              </div>
                            </div>
                            {/* Eating */}
                            <div style={{background:"rgba(255,255,255,.03)",borderRadius:8,padding:"10px 12px"}}>
                              <div style={{fontSize:10,color:C.t3,marginBottom:6,fontWeight:600}}>🍽 Eating</div>
                              <div style={{display:"flex",flexDirection:"column" as const,gap:4}}>
                                {([["cook","Cook mostly"],["mix","Mix"],[(dir==="in2de"?"convenience":"eat-out"),"Eat out often"]] as [string,string][]).map(([v,l])=>chipPill(l,ls.cooking===v,()=>setLs("cooking",v)))}
                              </div>
                            </div>
                            {/* Car */}
                            <div style={{background:"rgba(255,255,255,.03)",borderRadius:8,padding:"10px 12px"}}>
                              <div style={{fontSize:10,color:C.t3,marginBottom:6,fontWeight:600}}>🚗 Car</div>
                              <div style={{display:"flex",flexDirection:"column" as const,gap:4}}>
                                {([["false","No car"],["true","Own a car"]] as [string,string][]).map(([v,l])=>chipPill(l,(ls.car?"true":"false")===v,()=>setLs("car",v==="true")))}
                              </div>
                            </div>
                            {/* Gym */}
                            <div style={{background:"rgba(255,255,255,.03)",borderRadius:8,padding:"10px 12px"}}>
                              <div style={{fontSize:10,color:C.t3,marginBottom:6,fontWeight:600}}>💪 Gym</div>
                              <div style={{display:"flex",flexDirection:"column" as const,gap:4}}>
                                {([["none","No gym"],["basic","Basic (€25/mo)"],["premium","Premium (€75/mo)"]] as [string,string][]).map(([v,l])=>chipPill(l,ls.gym===v,()=>setLs("gym",v)))}
                              </div>
                            </div>
                          </div>
                        </div>}

                        {/* ── ③ INDIA TAX ASSUMPTION (in2de only) ── */}
                        {dir==="in2de"&&<div style={{borderTop:"1px solid rgba(255,255,255,.06)",paddingTop:14}}>
                          <div style={{fontSize:10,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase" as const,color:C.t3,marginBottom:8}}>India tax assumption</div>
                          <div style={{display:"flex",gap:6,marginBottom:6}}>
                            {([["new","New regime FY26"],["old","Old regime"]] as ["new"|"old",string][]).map(([v,l])=>chipPill(l,inRegime===v,()=>setInRegime(v)))}
                          </div>
                          <div style={{fontSize:11,color:C.t3,lineHeight:1.5}}>Used only for the parity baseline — how much you'd need in Germany to match your India take-home. Most people leaving India are on the new regime.</div>
                        </div>}

                      </div>
                    );
                  })()}


                </div>
              );
            })()}

          </div>
        </div>

        {/* ── NARRATIVE CALLOUT (below right calculator card) ── */}
        {(dir==="in2de"||dir==="de2in")&&(()=>{
          const _net=de_live.net,_gross=de_live.gross,_effN=Math.round(_net/_gross*100);
          const _inNet=liveIn.net,_gapEur=_net-Math.round(_inNet/rate);
          const _narrative=dir==="in2de"
            ?`Your €${(_gross/1000).toFixed(0)}K offer in ${deCity} nets you €${_net.toLocaleString()}/mo — that's ${_effN}% of gross. You're ${_gapEur>=0?"€"+_gapEur.toLocaleString()+" ahead of":"€"+Math.abs(_gapEur).toLocaleString()+" short of"} parity with ${inCity}.`
            :`Your €${(_gross/1000).toFixed(0)}K German gross nets €${_net.toLocaleString()}/mo. The India offer of ₹${(ctc/1e5).toFixed(0)}L nets ₹${_inNet.toLocaleString()}/mo (≈ €${Math.round(_inNet/rate).toLocaleString()}/mo). ${_gapEur>=0?"+":"−"}€${Math.abs(_gapEur).toLocaleString()}/mo difference.`;
          return (
            <div style={{maxWidth:1060,margin:"12px auto 0",padding:"0 28px",display:"flex",justifyContent:"flex-end"}}>
              <div style={{width:380,borderLeft:`3px solid ${dir==="in2de"?"rgba(37,99,235,.4)":"rgba(217,119,6,.4)"}`,paddingLeft:14}}>
                <p style={{fontSize:13,color:C.ltxt2,lineHeight:1.65,fontWeight:500}}>{_narrative}</p>
                <p style={{fontSize:11,color:C.ltxt3,marginTop:4}}>Updates live as you move the sliders →</p>
              </div>
            </div>
          );
        })()}
      </section>

      {/* FOOTER */}
      <footer style={{borderTop:`1px solid ${C.b0}`,padding:"20px 24px",textAlign:"center",background:C.bg0,marginTop:40}}>
        <div style={{fontSize:12,color:C.t3,display:"flex",alignItems:"center",justifyContent:"center",gap:14,flexWrap:"wrap"}}>
          <span>© 2026 TruePackage</span>
          <span style={{color:C.b1}}>·</span>
          <span>Built by a fellow expat · India → Germany</span>
          <span style={{color:C.b1}}>·</span>
          <button onClick={()=>setSourcesOpen(true)} style={{background:"none",border:"none",cursor:"pointer",fontFamily:"Outfit,sans-serif",fontSize:12,color:C.t3,textDecoration:"underline",padding:0,textUnderlineOffset:3}}>Sources</button>
          <span style={{color:C.b1}}>·</span>
          <span>Data: June 2026</span>
        </div>
      </footer>

      {/* ── MODAL OVERLAY ── */}
      {openModal&&(()=>{
        const de=_liveDe,india=_liveIn;
        const dc=CITIES.de[deCity]||CITIES.de.Munich,ic=CITIES.in[inCity]||CITIES.in.Bangalore;
        const isM=_liveIsM,tcv=_liveTc;

        // Before You Sign checklist state (local to modal render — resets on close intentionally)
        // We embed the checklist data inline and use a module-level ref trick to persist state across reopens
        const blueCardStatus=gross>=45300?'eligible':gross>=41042?'possible':'ineligible';
        const blueCardBg=blueCardStatus==='eligible'?'rgba(0,201,139,0.08)':'rgba(232,160,32,0.12)';
        const blueCardBorder=blueCardStatus==='eligible'?'rgba(0,201,139,0.25)':'rgba(232,160,32,0.28)';
        const blueCardColor=blueCardStatus==='eligible'?'#00c98b':'#e8a020';
        const blueCardText=blueCardStatus==='eligible'
          ?'✓ Blue Card eligible — your offer clears the €45,300 threshold. Faster path to permanent residency than a standard work permit.'
          :blueCardStatus==='possible'
          ?'⚡ Possibly Blue Card eligible — your offer qualifies if your role is in IT, engineering, or medicine. Confirm with your employer.'
          :'⚠ Below Blue Card threshold — you will need a standard work permit. Ask your employer about sponsored visa options.';

        return (
          <div onClick={(e)=>{if(e.target===e.currentTarget)setOpenModal(null);}}
            style={{position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
            <div style={{background:C.bg1,borderRadius:20,maxWidth:720,width:"100%",maxHeight:"90vh",overflowY:"auto" as const,position:"relative" as const,boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}}>
              <div style={{position:"sticky",top:0,background:C.bg1,borderBottom:`1px solid ${C.b0}`,padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",zIndex:1,borderRadius:"20px 20px 0 0"}}>
                <span style={{fontSize:13,fontWeight:700,color:C.t2,letterSpacing:".3px"}}>
                  {openModal==='money'?'Your Money':openModal==='breakdown'?'Full Breakdown':openModal==='nextsteps'?'Before You Sign':openModal==='runway'?'Job Hunt Details':'Before You Land'}
                </span>
                <button onClick={()=>setOpenModal(null)}
                  style={{background:"none",border:`1px solid ${C.b1}`,borderRadius:8,padding:"5px 12px",color:C.t3,cursor:"pointer",fontSize:13,fontFamily:"Outfit,sans-serif"}}>
                  ✕ Close
                </button>
              </div>
              <div style={{padding:"24px 24px 32px"}}>
                {openModal==='money'&&(dir==='in2de'
                  ? <CardA_in de={de} india={india} remEur={_liveRemEur} dc={dc} ic={ic} ctc={ctc} gross={gross} isM={isM} sk3={_liveSk3} noKirche={noKirche}/>
                  : <CardA_de de={de} india={india} match={_liveMatch!} ctc={ctc} rate={rate} inCity={inCity}/>
                )}
                {openModal==='breakdown'&&(
                  dir==='in2de'
                    ? <><CardB_in de={de} ic={ic} ctc={ctc} sk3={_liveSk3} rate={rate} noKirche={noKirche} remEur={_liveRemEur} fam={fam} dc={dc} deCity={deCity} view="deductions"/>
                        <div style={{borderTop:`1px solid ${C.b0}`,margin:"24px 0"}}/>
                        <CardB_in de={de} ic={ic} ctc={ctc} sk3={_liveSk3} rate={rate} noKirche={noKirche} remEur={_liveRemEur} fam={fam} dc={dc} deCity={deCity} view="living"/></>
                    : <><CardB_de de={de} india={india} match={_liveMatch!} ic={ic} ctc={ctc} fam={fam} inCity={inCity} view="deductions"/>
                        <div style={{borderTop:`1px solid ${C.b0}`,margin:"24px 0"}}/>
                        <CardB_de de={de} india={india} match={_liveMatch!} ic={ic} ctc={ctc} fam={fam} inCity={inCity} view="living"/></>
                )}
                {openModal==='nextsteps'&&(
                  <div>
                    {dir==='in2de'&&(
                      <div style={{background:blueCardBg,border:`1px solid ${blueCardBorder}`,borderRadius:10,padding:"14px 16px",marginBottom:22}}>
                        <div style={{fontSize:13,color:blueCardColor,lineHeight:1.6,fontWeight:500}}>{blueCardText}</div>
                      </div>
                    )}
                    {dir==='de2in'&&(
                      <div style={{fontSize:13,color:C.t3,lineHeight:1.5,marginBottom:16}}>Things to sort before your Germany chapter closes.</div>
                    )}
                    {dir==='in2de'&&[
                      {key:'q1',q:"Do you have €4,000–6,000 saved for the apartment deposit before your first salary lands?",c:"Your first salary arrives 4–6 weeks after joining. Deposit is due before you get keys. Arrange a transfer from India before you fly."},
                      {key:'q2',q:"Have you budgeted for 6 months with no credit history in Germany?",c:"No SCHUFA means landlords may reject you, no phone contract, no credit card. Expat-friendly landlords and WG-Gesucht are your first 3 months."},
                      {key:'q3',q:"Do you know you need a registered address within 14 days of arrival?",c:"Anmeldung is mandatory within 14 days. Without it you cannot open a bank account or register for tax. Book a temporary flat or hotel with a landlord willing to sign the Wohnungsgeberbestätigung form."},
                      {key:'q4',q:"Do you know you have a one-time window to choose GKV vs PKV health insurance?",c:"You have 3 months from start date to opt into private health insurance PKV. After that you are locked into statutory GKV until your salary drops below €69,300. At your salary it is worth evaluating — PKV can be cheaper and better."},
                    ].map((item,i,arr)=>(
                      <div key={item.key} style={{padding:"14px 0",borderBottom:i<arr.length-1?`1px solid ${C.b0}`:"none"}}>
                        <div style={{fontSize:14,fontWeight:600,color:C.t1,lineHeight:1.5,marginBottom:6}}>{item.q}</div>
                        <div style={{fontSize:13,color:C.gold,lineHeight:1.5}}>{item.c}</div>
                      </div>
                    ))}
                    {dir==='de2in'&&[
                      {key:'q1',q:"Have you arranged health insurance before your Germany cover ends?",c:"German statutory health ends on your last day. Indian employer group cover may have a waiting period. Arrange a bridge policy or confirm day-one cover with your new employer."},
                      {key:'q2',q:"Do you know how Indian PF and gratuity work after a Germany gap?",c:"If you left an Indian employer to move to Germany your PF may be partially withdrawn or dormant. New employer restarts the clock on gratuity — 5 years needed to vest."},
                      {key:'q3',q:"Are you aware of your tax residency status for the transition year?",c:"If you spend 182 or more days in India in the financial year of return you become a tax resident. Your Germany income for that period may be taxable in India depending on DTAA provisions."},
                      {key:'q4',q:"Have you confirmed when your India variable pay kicks in?",c:"Most Indian companies pay the first bonus after 12 months. Your CTC includes 20 to 30 percent variable — budget conservatively for year one."},
                    ].map((item,i,arr)=>(
                      <div key={item.key} style={{padding:"14px 0",borderBottom:i<arr.length-1?`1px solid ${C.b0}`:"none"}}>
                        <div style={{fontSize:14,fontWeight:600,color:C.t1,lineHeight:1.5,marginBottom:6}}>{item.q}</div>
                        <div style={{fontSize:13,color:C.gold,lineHeight:1.5}}>{item.c}</div>
                      </div>
                    ))}
                    <div style={{marginTop:24}}>
                      <BookingCard openIntake={()=>{setOpenModal(null);setSubmitted(false);setEmailError(false);setIntakeOpen(true);}}/>
                    </div>
                  </div>
                )}
                {openModal==='runway'&&_oppR&&(
                  <div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:24}}>
                      <div style={{background:_oppRunwayGreat?C.grnD:_oppRunwayGood?C.goldD:C.redD,border:`1px solid ${_oppRunwayGreat?C.grnL:_oppRunwayGood?C.goldL:'rgba(255,91,91,.25)'}`,borderRadius:14,padding:"22px 16px",textAlign:"center" as const}}>
                        <div style={{fontSize:10,fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase" as const,color:C.t3,marginBottom:8}}>Runway</div>
                        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontWeight:700,color:_oppRunwayGreat?C.grn:_oppRunwayGood?C.gold:C.red,lineHeight:1.1}}>{_oppRunwayText}</div>
                        <div style={{fontSize:11,color:C.t3,marginTop:6}}>of savings at this lifestyle</div>
                      </div>
                      <div style={{background:C.goldD,border:`1px solid ${C.goldL}`,borderRadius:14,padding:"22px 16px",textAlign:"center" as const}}>
                        <div style={{fontSize:10,fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase" as const,color:C.t3,marginBottom:8}}>Target Gross</div>
                        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontWeight:700,color:C.gold,lineHeight:1.1}}>€{_oppTargetGrossK}K</div>
                        <div style={{fontSize:11,color:C.t3,marginTop:6}}>per year to break even</div>
                      </div>
                    </div>
                    {_oppOneThingText&&(
                      <div style={{background:"rgba(232,160,32,0.08)",border:"1px solid rgba(232,160,32,0.25)",borderRadius:14,padding:18}}>
                        <div style={{fontSize:14,color:C.t1,lineHeight:1.6}}>{_oppOneThingText}</div>
                      </div>
                    )}
                  </div>
                )}
                {openModal==='prelanding'&&(
                  <div>
                    <div style={{marginBottom:20}}>
                      <div style={{fontSize:14,color:C.t2,lineHeight:1.6,marginBottom:16}}>Things to arrange before you fly to Germany.</div>
                      {[
                        {key:'blockacc',q:"Have you opened a German bank account (Bunq, N26, or Deutsche Bank international)?",c:"Most landlords require a German IBAN for the deposit. Open Bunq or N26 before you arrive — both accept non-residents."},
                        {key:'health',q:"Do you have travel + health insurance that covers the first 90 days?",c:"German public health insurance only starts with your employment. Get a short-term expat policy for the gap — costs ~€60–100/month."},
                        {key:'cvde',q:"Is your CV in German format with a Lichtbild photo?",c:"German employers expect a photo and a specific layout. Use a tool like Europass or get a German template — it signals cultural fit."},
                        {key:'lang',q:"Can you handle basic German bureaucracy (Anmeldung forms, Deutsche Bahn, landlords)?",c:"A2 level is enough to register and open a bank account. The Duolingo German course takes 3 months to reach A2."},
                        {key:'network',q:"Do you have one contact in your target city you can call if things go wrong?",c:"Find a local WhatsApp group or Facebook group for Indian expats in your city. They answer the questions no one else will."},
                      ].map((item,i,arr)=>(
                        <div key={item.key} style={{padding:"14px 0",borderBottom:i<arr.length-1?`1px solid ${C.b0}`:"none"}}>
                          <div style={{fontSize:14,fontWeight:600,color:C.t1,lineHeight:1.5,marginBottom:6}}>{item.q}</div>
                          <div style={{fontSize:13,color:C.gold,lineHeight:1.5}}>{item.c}</div>
                        </div>
                      ))}
                    </div>
                    <BookingCard openIntake={()=>{setOpenModal(null);setSubmitted(false);setEmailError(false);setIntakeOpen(true);}}/>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ASK SUPRADEEP FAB */}
      <button onClick={()=>{setSubmitted(false);setEmailError(false);setIntakeOpen(true);}} style={{position:"fixed",bottom:24,right:24,zIndex:200,background:C.gold,color:C.bg0,border:"none",borderRadius:24,padding:"10px 18px",fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:600,cursor:"pointer",boxShadow:"0 4px 16px rgba(0,0,0,.4)"}}>✉ Got a question?</button>

      {/* INTAKE MODAL */}
      {intakeOpen&&(
        <div onClick={e=>e.target===e.currentTarget&&setIntakeOpen(false)} style={{position:"fixed",inset:0,zIndex:400,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:C.bg1,borderRadius:20,padding:28,maxWidth:440,width:"100%",maxHeight:"90vh",overflowY:"auto"}}>
            {submitted?(
              <div style={{textAlign:"center" as const,padding:"20px 0"}}>
                <div style={{fontSize:48,marginBottom:16}}>✅</div>
                <div style={{fontSize:16,fontWeight:600,color:C.t1,marginBottom:8}}>Message prepared in your email app.</div>
                <div style={{fontSize:13,color:C.t2,marginBottom:24}}>Your tool inputs are included so Supradeep has full context.</div>
                <button onClick={()=>setIntakeOpen(false)} style={{background:C.gold,color:C.bg0,border:"none",borderRadius:12,padding:"12px 24px",fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:600,cursor:"pointer"}}>Close</button>
              </div>
            ):(
              <>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:C.t1,marginBottom:6}}>Got a question?</div>
                <div style={{fontSize:13,color:C.t2,marginBottom:24}}>Ask anything — we'll reply within 48 hours.</div>
                {/* Field 1: Situation */}
                <div style={{marginBottom:20}}>
                  <div style={{fontSize:11,fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase" as const,color:C.t3,marginBottom:10}}>What is your situation?</div>
                  <div style={{display:"flex",flexWrap:"wrap" as const,gap:8}}>
                    {["I have a Germany offer","Considering Job Hunt Visa","In Germany, thinking of returning","Something else"].map(opt=>(
                      <button key={opt} onClick={()=>setSituation(opt)} style={pillStyle(situation===opt)}>{opt}</button>
                    ))}
                  </div>
                </div>
                {/* Field 2: Question */}
                <div style={{marginBottom:20}}>
                  <div style={{fontSize:11,fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase" as const,color:C.t3,marginBottom:10}}>What is your biggest question right now?</div>
                  <textarea value={question} onChange={e=>setQuestion(e.target.value)} rows={4} style={{width:"100%",background:C.bg2,border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:12,color:C.t1,fontSize:14,resize:"vertical" as const,fontFamily:"Outfit,sans-serif",outline:"none",boxSizing:"border-box" as const}} placeholder="Type your question here..."/>
                </div>
                {/* Field 3: Call interest */}
                <div style={{marginBottom:20}}>
                  <div style={{fontSize:11,fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase" as const,color:C.t3,marginBottom:10}}>Would you want a call to talk it through?</div>
                  <div style={{display:"flex",flexWrap:"wrap" as const,gap:8}}>
                    {["Yes, happy to pay for expert advice","Yes if it is free","No, just wanted to ask"].map(opt=>(
                      <button key={opt} onClick={()=>setCallInterest(opt)} style={pillStyle(callInterest===opt)}>{opt}</button>
                    ))}
                  </div>
                </div>
                {/* Field 4: Email */}
                <div style={{marginBottom:24}}>
                  <div style={{fontSize:11,fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase" as const,color:emailError?C.red:C.t3,marginBottom:10}}>Your email — so Supradeep can respond</div>
                  <input
                    required
                    value={email}
                    onChange={e=>{setEmail(e.target.value);if(emailError)setEmailError(false);}}
                    type="email"
                    placeholder="you@example.com"
                    style={{width:"100%",background:C.bg2,border:`1px solid ${emailError?"rgba(255,91,91,.6)":"rgba(255,255,255,0.08)"}`,borderRadius:10,padding:12,color:C.t1,fontSize:14,fontFamily:"Outfit,sans-serif",outline:"none",boxSizing:"border-box" as const,transition:"border-color .2s"}}
                  />
                  {emailError&&<div style={{fontSize:11,color:C.red,marginTop:6}}>Please enter your email so Supradeep can reply.</div>}
                  <div style={{fontSize:11,color:C.t3,marginTop:6}}>No spam. Just a human reply.</div>
                </div>
                {/* Submit */}
                <button onClick={()=>{
                  if(!email||!email.includes('@')){setEmailError(true);return;}
                  const subj=encodeURIComponent('TruePackage enquiry — '+situation);
                  const body=encodeURIComponent('Situation: '+situation+'\n\nQuestion: '+question+'\n\nCall interest: '+callInterest+'\n\nEmail: '+email+'\n\n---\nTool inputs: '+window.location.href);
                  window.location.href=`mailto:Supradeep91@gmail.com?subject=${subj}&body=${body}`;
                  setSubmitted(true);
                }} style={{width:"100%",background:C.gold,color:C.bg0,border:"none",borderRadius:12,padding:14,fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:600,cursor:"pointer"}}>
                  Send your question →
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* SOURCES MODAL */}
      {sourcesOpen&&(
        <div onClick={e=>e.target===e.currentTarget&&setSourcesOpen(false)} style={{position:"fixed",inset:0,zIndex:400,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:C.bg1,borderRadius:20,padding:28,maxWidth:520,width:"100%",maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:C.t1}}>About the data</div>
              <button onClick={()=>setSourcesOpen(false)} style={{background:"none",border:"none",color:C.t3,fontSize:20,cursor:"pointer",marginLeft:16,flexShrink:0}}>✕</button>
            </div>
            <p style={{fontSize:13,color:C.t2,lineHeight:1.75,marginBottom:16}}>
              <strong style={{color:C.t1}}>Salary ranges</strong> sourced from Gehalt.de, Stepstone Gehaltsreport, jobvector Gehaltsanalyse, and ingenieur.de/VDI Gehaltsstudie. German median salary data cross-referenced with Entgeltatlas (Bundesagentur für Arbeit). Ranges represent the 25th–75th percentile of reported salaries for each profession and city.
            </p>
            <p style={{fontSize:13,color:C.t2,lineHeight:1.75,marginBottom:24}}>
              <strong style={{color:C.t1}}>Cost of living</strong> data sourced from Numbeo (city-level, March 2026), supplemented by germany-visa.org and studying-in-germany.org for city comparisons. Indian city costs sourced from 99acres, NoBroker, and QuikrHomes live listings (March 2026).
            </p>
            <div style={{fontSize:11,fontWeight:600,letterSpacing:"1.8px",textTransform:"uppercase" as const,color:C.t3,marginBottom:14}}>Primary Sources</div>
            {[
              {name:"Entgeltatlas · Bundesagentur für Arbeit",type:"German salary medians (official government data)",url:"https://entgeltatlas.arbeitsagentur.de"},
              {name:"Gehalt.de",type:"German salary ranges — largest salary database",url:"https://www.gehalt.de"},
              {name:"Stepstone Gehaltsreport 2025",type:"German salary by profession and region",url:"https://www.stepstone.de/gehalt"},
              {name:"jobvector Gehaltsanalyse 2025",type:"German salary by profession (engineering focus)",url:"https://www.jobvector.de/gehalt"},
              {name:"ingenieur.de / VDI Gehaltsstudie",type:"Engineering salaries by field and function",url:"https://www.ingenieur.de/karriere/gehalt"},
              {name:"Numbeo Germany",type:"City cost of living — crowdsourced, updated continuously",url:"https://www.numbeo.com"},
            ].map(s=>(
              <div key={s.name} style={{padding:"12px 0",borderBottom:`1px solid ${C.b0}`,display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,color:C.t1,marginBottom:2}}>{s.name}</div>
                  <div style={{fontSize:11,color:C.t3,lineHeight:1.5}}>{s.type}</div>
                </div>
                <a href={s.url} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:C.gold,textDecoration:"none",flexShrink:0,padding:"4px 8px",border:`1px solid ${C.goldL}`,borderRadius:6}}>Visit →</a>
              </div>
            ))}
            <div style={{fontSize:12,color:C.t3,marginTop:20}}>Last updated: March 2026. If you spot an error, use the feedback form.</div>
          </div>
        </div>
      )}

      {/* CALENDLY MODAL */}
      {calOpen&&(
        <div onClick={e=>e.target===e.currentTarget&&setCalOpen(false)} style={{position:"fixed",inset:0,zIndex:400,background:"rgba(6,16,28,.92)",backdropFilter:"blur(10px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:C.bg2,border:`1px solid ${C.b1}`,borderRadius:20,overflow:"hidden",width:"100%",maxWidth:660}}>
            <div style={{padding:"18px 22px",borderBottom:`1px solid ${C.b0}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:16,fontWeight:600,color:C.t1}}>Talk to Supradeep</div>
                <div style={{fontSize:12,color:C.t3,marginTop:3}}>TruePackage founder · Fellow expat · India → Germany</div>
              </div>
              <button onClick={()=>setCalOpen(false)} style={{background:"none",border:"none",color:C.t3,fontSize:20,cursor:"pointer"}}>✕</button>
            </div>
            <iframe src={CALENDLY} style={{width:"100%",height:500,border:"none"}} title="Book a call"/>
          </div>
        </div>
      )}
    </>
  );
}