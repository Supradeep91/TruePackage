import { useState, type ReactNode } from "react";

const C_T3 = "#4a6080";
const C_T2 = "#8a9bb8";
const C_BG1 = "#0d1829";

export function Acc({note}:{note:ReactNode}) {
  const [open,setOpen]=useState(false);
  return (<>
    <button onClick={()=>setOpen(!open)} style={{background:"none",border:"none",cursor:"pointer",fontFamily:"Outfit,sans-serif",fontSize:11,color:C_T3,padding:"6px 0 0",display:"flex",alignItems:"center",gap:4}}>
      {open?"▾ How is this calculated":"▸ How is this calculated"}
    </button>
    {open&&<div style={{fontSize:12,color:C_T2,lineHeight:1.65,background:C_BG1,borderRadius:8,padding:"12px 14px",marginTop:8}}>{note}</div>}
  </>);
}
