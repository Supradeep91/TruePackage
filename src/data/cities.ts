export const CITIES = {
  de:{
    // ── Existing cities ──────────────────────────────────────────────────────
    Munich:    {rent:[1700,2300],groc:[300,410], trans:57, util:[130,190]},
    Berlin:    {rent:[1100,1650],groc:[280,370], trans:86, util:[110,165]},
    Frankfurt: {rent:[1450,2050],groc:[300,400], trans:102,util:[125,175]},
    Hamburg:   {rent:[1300,1850],groc:[290,385], trans:109,util:[120,170]},
    Stuttgart: {rent:[1250,1750],groc:[285,375], trans:78, util:[118,168]},
    Nuremberg: {rent:[900,1400], groc:[270,360], trans:62, util:[105,155]},
    Cologne:   {rent:[1050,1550],groc:[275,365], trans:102,util:[112,162]},
    Dusseldorf:{rent:[1050,1600],groc:[280,370], trans:102,util:[115,165]},
    // ── New cities — verified March 2026 (Numbeo + germany-visa.org) ────────
    // rent = 2BR range; WG and 1BR in calcHelpers/App rentRanges tables
    Karlsruhe: {rent:[1250,1750],groc:[280,370], trans:80, util:[130,180]},
    Leipzig:   {rent:[900,1350], groc:[260,350], trans:63, util:[110,160]},
    Dresden:   {rent:[950,1450], groc:[265,355], trans:68, util:[115,165]},
    Mannheim:  {rent:[1300,1850],groc:[275,370], trans:80, util:[125,175]},
  } as Record<string,{rent:number[];groc:number[];trans:number;util:number[]}>,
  in:{
    // ── Existing cities ──────────────────────────────────────────────────────
    Bangalore:   {help:[12000,18000],pt:2400,rent:[28000,55000],groc:[12000,18000]},
    Hyderabad:   {help:[10000,16000],pt:2400,rent:[22000,45000],groc:[11000,16000]},
    Pune:        {help:[10000,15000],pt:2500,rent:[20000,40000],groc:[11000,16000]},
    Mumbai:      {help:[14000,20000],pt:2500,rent:[40000,90000],groc:[13000,20000]},
    'Delhi NCR': {help:[11000,17000],pt:0,   rent:[25000,55000],groc:[12000,18000]},
    Chennai:     {help:[10000,15000],pt:2400,rent:[20000,42000],groc:[11000,16000]},
    Kolkata:     {help:[8000,13000], pt:2400,rent:[15000,30000],groc:[9000,14000]},
    Ahmedabad:   {help:[8000,13000], pt:0,   rent:[14000,28000],groc:[9000,14000]},
    // ── New cities — verified March 2026 (99acres, NoBroker, QuikrHomes) ───
    // pt: UP/Haryana=0, Kerala/MP/TN=2400 (₹200/mo)
    Gurgaon:     {help:[12000,18000],pt:0,   rent:[28000,55000],groc:[12000,18000]},
    Noida:       {help:[10000,15000],pt:0,   rent:[18000,38000],groc:[11000,16000]},
    Kochi:       {help:[8000,12000], pt:2400,rent:[15000,28000],groc:[9000,14000]},
    Indore:      {help:[5000,9000],  pt:2400,rent:[10000,20000],groc:[7000,12000]},
    Coimbatore:  {help:[6000,10000], pt:2400,rent:[10000,18000],groc:[8000,13000]},
  } as Record<string,{help:number[];pt:number;rent:number[];groc:number[]}>,
};
