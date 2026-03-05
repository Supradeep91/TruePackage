import { CITIES } from "../data/cities";

export function calcIN(ctc:number,city:string) {
  const c=CITIES.in[city]||CITIES.in.Bangalore;
  const t=Math.max(0,ctc-75000);
  const slabs:number[][]= [[400000,0],[400000,.05],[400000,.10],[400000,.15],[400000,.20],[400000,.25],[Infinity,.30]];
  let tax=0,r=t;
  for(const[b,s]of slabs){const x=Math.min(r,b);tax+=x*s;r-=x;if(r<=0)break;}
  if(t<=1200000)tax=0; tax*=1.04;
  const pf=Math.min(ctc*.4*.12,21600);
  return {net:Math.round((ctc-tax-pf-c.pt)/12),tax:Math.round(tax/12),pf:Math.round(pf/12),eff:((tax+pf+c.pt)/ctc*100).toFixed(1)};
}
