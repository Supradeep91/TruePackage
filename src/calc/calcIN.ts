import { CITIES } from "../data/cities";

export function calcIN(ctc:number,city:string,regime:"new"|"old"="new") {
  const c=CITIES.in[city]||CITIES.in.Bangalore;
  const pf=Math.min(ctc*.4*.12,21600);
  let tax=0;

  if(regime==="old") {
    // FY2025-26 old regime with standard deduction ₹50K + PF deduction (80C, capped ₹1.5L)
    const stdDed=50000;
    const pfDed=Math.min(pf,150000); // 80C — employer + employee PF, capped ₹1.5L
    const taxable=Math.max(0,ctc-stdDed-pfDed);
    // Old regime slabs: 0–2.5L@0%, 2.5–5L@5%, 5–10L@20%, 10L+@30%
    const oldSlabs:number[][]= [[250000,0],[250000,.05],[500000,.20],[Infinity,.30]];
    let r=taxable;
    for(const[b,s]of oldSlabs){const x=Math.min(r,b);tax+=x*s;r-=x;if(r<=0)break;}
    // Rebate 87A: if taxable ≤ ₹5L, tax = 0
    if(taxable<=500000)tax=0;
    tax*=1.04; // 4% health & education cess
  } else {
    // FY2025-26 new regime (default): ₹75K standard deduction, zero-tax ≤ ₹12L
    const t=Math.max(0,ctc-75000);
    const slabs:number[][]= [[400000,0],[400000,.05],[400000,.10],[400000,.15],[400000,.20],[400000,.25],[Infinity,.30]];
    let r=t;
    for(const[b,s]of slabs){const x=Math.min(r,b);tax+=x*s;r-=x;if(r<=0)break;}
    if(t<=1200000)tax=0;
    tax*=1.04;
  }

  return {net:Math.round((ctc-tax-pf-c.pt)/12),tax:Math.round(tax/12),pf:Math.round(pf/12),eff:((tax+pf+c.pt)/ctc*100).toFixed(1)};
}
