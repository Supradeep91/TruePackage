import { useState } from "react";

const CW = {
  bg1:"#0d1829",
  t1:"#edf2f7",
  t2:"#8a9bb8",
  t3:"#4a6080",
  b0:"rgba(255,255,255,.05)",
};

export interface CalcRow { label:string; value:string; note?:string; muted?:boolean; }

export function CalcWorking({rows,title="How is this calculated?"}:{rows:CalcRow[];title?:string}) {
  const [open,setOpen]=useState(false);
  return (
    <div style={{marginTop:8}}>
      <button
        onClick={()=>setOpen(p=>!p)}
        style={{background:"none",border:"none",cursor:"pointer",fontFamily:"Outfit,sans-serif",fontSize:12,color:CW.t3,padding:"2px 0",display:"flex",alignItems:"center",gap:4}}
      >
        <span style={{fontSize:9,display:"inline-block",transform:open?"rotate(90deg)":"rotate(0deg)",transition:"transform .15s"}}>▸</span>
        {title}
      </button>
      {open&&(
        <div style={{background:CW.bg1,border:`1px solid ${CW.b0}`,borderRadius:8,padding:"10px 12px",marginTop:6,display:"grid",gridTemplateColumns:"1fr auto",gap:"4px 16px"}}>
          {rows.flatMap((r,i)=>[
            <span key={`l${i}`} style={{fontSize:11,color:r.muted?CW.t3:CW.t2,paddingTop:2}}>
              {r.label}{r.note&&<span style={{color:CW.t3,fontStyle:"italic"}}> · {r.note}</span>}
            </span>,
            <span key={`v${i}`} style={{fontSize:11,fontWeight:600,color:r.muted?CW.t3:CW.t1,whiteSpace:"nowrap",textAlign:"right",paddingTop:2}}>
              {r.value}
            </span>,
          ])}
        </div>
      )}
    </div>
  );
}
