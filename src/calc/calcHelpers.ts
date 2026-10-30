import { calcDE } from "./calcDE";
import { calcIN } from "./calcIN";
import { CITIES } from "../data/cities";

type Fam = "single" | "married" | "married-kids";

interface Thr { floor:number;match:number;comfort:number;gm:number;remEur:number;matchT:number;comfortT:number;rentUsed:number;pos:(g:number)=>string; }
interface DE { net:number;gross:number;gap:number;tax:number;soli:number;kirche:number;health:number;pension:number;nursing:number;effRate:string; }
interface IN { net:number;tax:number;pf:number;eff:string; }

// Shared rent ranges for all 12 German cities — used in calcThresholds and calcOpp
// Sources: Numbeo (June 2026), miet-check.de, germany-visa.org
export const DE_RENT_RANGES:Record<string,Record<string,number[]>>={
  wg:{Munich:[720,1050],Berlin:[520,730],Frankfurt:[620,920],Hamburg:[570,830],Stuttgart:[540,800],Nuremberg:[400,620],Cologne:[460,700],Dusseldorf:[460,720],Karlsruhe:[440,670],Leipzig:[340,520],Dresden:[350,540],Mannheim:[440,680]},
  "1br":{Munich:[1250,1750],Berlin:[850,1250],Frankfurt:[1100,1550],Hamburg:[980,1400],Stuttgart:[930,1350],Nuremberg:[680,1050],Cologne:[790,1200],Dusseldorf:[790,1250],Karlsruhe:[930,1400],Leipzig:[680,1050],Dresden:[730,1150],Mannheim:[970,1450]},
  "2br":{Munich:[1750,2400],Berlin:[1200,1750],Frankfurt:[1500,2100],Hamburg:[1350,1950],Stuttgart:[1300,1800],Nuremberg:[950,1500],Cologne:[1100,1650],Dusseldorf:[1100,1700],Karlsruhe:[1300,1800],Leipzig:[950,1450],Dresden:[1000,1550],Mannheim:[1100,1600]},
};

interface Lifestyle { apartment:string; cooking:string; car:boolean; gym:string; }

export function calcThresholds(deCity:string,remINR:number,rate:number,fam:Fam,ctc:number,inCity:string,lifestyle?:Lifestyle):Thr {
  const dc=CITIES.de[deCity]||CITIES.de.Munich,tc=fam==="single"?1:3;
  // Apartment tier: prefer explicit lifestyle choice if provided, else default by family size
  const tier=lifestyle?.apartment||(fam==="single"?"wg":fam==="married"?"1br":"2br");
  const rr=DE_RENT_RANGES[tier]?.[deCity]||DE_RENT_RANGES[tier]?.Munich||DE_RENT_RANGES['wg'].Munich;
  const rentUsed=Math.round((rr[0]+rr[1])/2);
  // Groceries + eating-out driven by cooking preference
  const grocBase=lifestyle?.cooking==='cook'?dc.groc[1]:lifestyle?.cooking==='convenience'?dc.groc[0]:Math.round((dc.groc[0]+dc.groc[1])/2);
  const eatingOut=lifestyle?.cooking==='cook'?0:lifestyle?.cooking==='convenience'?350:150;
  // Transport: add €400/mo for car ownership
  const transAmt=lifestyle?.car?(dc.trans+400):dc.trans;
  // Gym
  const gymAmt=lifestyle?.gym==='basic'?25:lifestyle?.gym==='premium'?75:0;
  const gm=Math.round(rentUsed+grocBase+eatingOut+transAmt+(dc.util[0]+dc.util[1])/2+gymAmt+25);
  const remEur=Math.round(remINR/rate*1.012);
  const indianNetMonthly=calcIN(ctc,inCity).net;
  const indianNetEur=Math.round(indianNetMonthly/rate);
  const matchT=gm+indianNetEur,comfortT=Math.round(matchT*1.2);
  function g4n(t:number){let lo=20000,hi=250000;for(let i=0;i<40;i++){const m=(lo+hi)/2;calcDE(m,tc).net<t?lo=m:hi=m;}return Math.round(lo/1000)*1000;}
  const floor=g4n(gm),match=g4n(matchT),comfort=g4n(comfortT);
  return {floor,match,comfort,gm,remEur,matchT,comfortT,rentUsed,
    pos:(g:number)=>g<floor?"below_floor":g<match?"below_match":g<comfort?"below_comfort":"above_comfort"};
}

export function calcBreakEven(gross:number,thr:Thr,de:DE,india:IN,rate:number,deCity:string,rem:number,remittanceCurrency:"inr"|"eur",commitments:number,commitmentsCurrency:"inr"|"eur") {
  const dc=CITIES.de[deCity]||CITIES.de.Munich;
  const dep=Math.round((dc.rent[0]+dc.rent[1])/2*2.5),total=dep+2500+250+700+500;
  const convertedRemittance = remittanceCurrency === "inr" ? Math.round(rem / rate) : rem;
  const convertedCommitments = commitmentsCurrency === "inr" ? Math.round(commitments / rate) : commitments;
  const surplus=de.net-thr.matchT-convertedRemittance-convertedCommitments;
  if(surplus<=0)return {ok:false,surplus,total,years:[],msg:"Does not break even at this offer."};
  const mo=Math.ceil(total/surplus),yrs=(mo/12).toFixed(1),at5=Math.round(-total+surplus*60);
  const years=[0,1,2,3,5,7].map(y=>({y,v:Math.round(-total+surplus*12*y)}));
  const msg=mo<=18?`Strong. Break-even yr ${yrs}, +€${at5.toLocaleString()} by Yr5.`
    :mo<=36?`Solid. Break-even yr ${yrs}. +€${at5.toLocaleString()} by Yr5.`
    :mo<=60?`Borderline. ${yrs}yr break-even. Stay 5+ years.`:`Long haul. ${yrs}yr. Negotiate harder.`;
  return {ok:true,surplus,total,dep,mo,yrs,at5,years,msg};
}

export function calcMatchCTC(deCity:string,inCity:string,fs:number,de_net:number,rate:number,regime:"new"|"old"="new") {
  const ic=CITIES.in[inCity]||CITIES.in.Bangalore;
  const famMult=fs<=1?1.0:fs<=2?1.4:1.7;
  const rent70=Math.round(ic.rent[0]+0.7*(ic.rent[1]-ic.rent[0]));
  const rent=Math.round(rent70*famMult);
  const groc=Math.round(ic.groc[0]+0.7*(ic.groc[1]-ic.groc[0]));
  const help=Math.round(ic.help[0]+0.7*(ic.help[1]-ic.help[0]));
  // Car costs — city-specific. Source: calcMatchCTC research (monthly all-in: EMI+fuel+parking)
  const carCosts:Record<string,number>={
    Mumbai:40000,Bangalore:35000,"Delhi NCR":35000,Hyderabad:30000,Pune:28000,Chennai:28000,Kolkata:22000,Ahmedabad:20000,
    Gurgaon:38000,Noida:30000,Kochi:28000,Indore:20000,Coimbatore:20000,
  };
  const trans=carCosts[inCity]||28000;
  const metroCities=["Mumbai","Bangalore","Delhi NCR","Gurgaon","Noida"];
  const school=fs>2?(metroCities.includes(inCity)?25000:15000):0;
  const health=Math.round((fs<=1?11500:fs<=2?24000:36500)/12);
  const leisure=fs<=1?15000:fs<=2?22000:30000;
  const misc=5000;
  const tot=rent+groc+help+trans+school+health+leisure+misc;
  const targetNet=Math.round(tot*1.45);
  let lo=targetNet*12,hi=targetNet*36;
  for(let i=0;i<40;i++){const mid=(lo+hi)/2;calcIN(mid,inCity,regime).net<targetNet?lo=mid:hi=mid;}
  const match=Math.round(lo/100000)*100000;
  const matchLPA=(match/100000).toFixed(1);
  const india_match=calcIN(match,inCity,regime);
  const deNetINR=Math.round(de_net*rate);
  const ppGap=Math.round(deNetINR-india_match.net);
  const ppGapPct=Math.round(Math.abs(ppGap)/Math.max(1,deNetINR)*100);
  const ppGapColor=ppGapPct>40?"red":ppGapPct>20?"gold":"grn";
  const fixedFloor=Math.round(match*0.7);
  const fixedFloorLPA=(fixedFloor/100000).toFixed(1);
  return {match,matchLPA,tgt:targetNet,targetNet,costs:{rent,groc,help,trans,school,health,leisure,misc},ppGap,ppGapPct,ppGapColor,fixedFloor,fixedFloorLPA,indiaMatchNet:india_match.net};
}

export function calcOpp(deCity:string,savings:number,fam:string,lifestyle:{apartment:string;cooking:string;car:boolean;gym:string},rate:number) {
  const dc=CITIES.de[deCity]||CITIES.de.Munich;
  const rentRange=DE_RENT_RANGES[lifestyle.apartment]?.[deCity]||DE_RENT_RANGES['wg']['Munich'];
  const rentMid=Math.round((rentRange[0]+rentRange[1])/2);
  const grocMid=lifestyle.cooking==='cook'?dc.groc[1]:lifestyle.cooking==='mix'?Math.round((dc.groc[0]+dc.groc[1])/2):dc.groc[0];
  const eatingOut=lifestyle.cooking==='cook'?0:lifestyle.cooking==='mix'?150:350;
  const trans=lifestyle.car?dc.trans+400:dc.trans;
  const gym=lifestyle.gym==='basic'?25:lifestyle.gym==='premium'?75:0;
  const utilMid=Math.round((dc.util[0]+dc.util[1])/2);
  const healthFull=fam==='married-kids'?800:fam==='married'?600:400;
  const phone=25;
  const monthlyBurn=rentMid+grocMid+eatingOut+trans+gym+utilMid+healthFull+phone;
  const runway=savings/monthlyBurn;
  const runwayMonths=Math.floor(runway);
  const runwayText=runwayMonths>=12?`${runwayMonths} months (${(runwayMonths/12).toFixed(1)} years)`:`${runwayMonths} months`;
  const legalMin=fam==='married-kids'?20756:fam==='married'?16756:12756;
  const belowLegal=savings<legalMin;
  const safeMonths=Math.max(1,runwayMonths-2);
  const tc=fam==='single'?1:3;
  let lo=20000,hi=150000;
  for(let i=0;i<40;i++){const mid=(lo+hi)/2;calcDE(mid,tc,false).net<monthlyBurn?lo=mid:hi=mid;}
  const targetGross=Math.round(lo/1000)*1000;
  const cashFlow=Array.from({length:12},(_,i)=>{
    const month=i+1;
    const hasSalary=month>safeMonths;
    const net=hasSalary?calcDE(targetGross,tc,false).net:0;
    return {month,hasSalary,net,burn:monthlyBurn};
  });
  let cash=savings;
  const cashPositions=cashFlow.map((m)=>{
    cash=cash-m.burn+(m.hasSalary?m.net:0);
    return {...m,cash};
  });
  return {monthlyBurn,runwayMonths,runwayText,targetGross,legalMin,belowLegal,safeMonths,cashPositions,rentMid,rentRange,grocMid,eatingOut,trans,gym,utilMid,healthFull,phone,tc,rate};
}
