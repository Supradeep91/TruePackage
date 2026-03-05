export function calcDE(gross:number,tc:number,noKirche=false) {
  const allow=tc===3?24696:12348, zvE=Math.max(0,gross-allow);
  let tax=0;
  if(zvE<=17005) tax=zvE>0?(979.18*(zvE/10000-1.4177)+1400)*zvE/10000:0;
  else if(zvE<=66760) tax=(192.59*(zvE/10000-1.7005)+2397)*zvE/10000+966.53;
  else if(zvE<=277825) tax=0.42*zvE-10911.92;
  else tax=0.45*zvE-19246.67;
  if(tc===3) tax*=0.55;
  tax=Math.max(0,tax);
  const soli=tax>19950?tax*.055:0, kirche=tax*.09;
  const h=Math.min(gross,66150)*.09, p=Math.min(gross,96600)*.093;
  const u=Math.min(gross,96600)*.013, n=gross*.0205;
  const net=gross-(tax+soli+(noKirche?0:kirche)+h+p+u+n);
  return {net:Math.round(net/12),gross:Math.round(gross/12),gap:Math.round(gross/12-net/12),
    tax:Math.round(tax/12),soli:Math.round(soli/12),kirche:Math.round(kirche/12),
    health:Math.round(h/12),pension:Math.round((p+u)/12),nursing:Math.round(n/12),
    effRate:(((gross-net)/gross)*100).toFixed(1)};
}
