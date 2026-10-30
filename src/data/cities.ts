export const CITIES = {
  de:{
    // ── German cities — verified June 2026 (Numbeo, miet-check.de, DMB Betriebskostenspiegel 2024) ──
    // rent = 2BR Kaltmiete range; trans = Deutschlandticket €63/mo from Jan 2026 nationwide
    // util = Nebenkosten excl. personal electricity (DMB avg €2.67/m²/mo for ~65m² apt)
    Munich:    {rent:[1750,2400], groc:[310,420], trans:63, util:[135,200]},
    Berlin:    {rent:[1200,1750], groc:[290,380], trans:63, util:[115,170]},
    Frankfurt: {rent:[1500,2100], groc:[305,410], trans:63, util:[130,180]},
    Hamburg:   {rent:[1350,1950], groc:[295,395], trans:63, util:[125,175]},
    Stuttgart: {rent:[1300,1800], groc:[290,385], trans:63, util:[120,170]},
    Nuremberg: {rent:[950,1500],  groc:[275,370], trans:63, util:[108,158]},
    Cologne:   {rent:[1100,1650], groc:[280,375], trans:63, util:[115,170]},
    Dusseldorf:{rent:[1100,1700], groc:[285,380], trans:63, util:[118,168]},
    Karlsruhe: {rent:[1300,1800], groc:[285,380], trans:63, util:[135,190]},
    Leipzig:   {rent:[950,1450],  groc:[265,360], trans:63, util:[112,162]},
    Dresden:   {rent:[1000,1550], groc:[270,365], trans:63, util:[118,168]},
    Mannheim:  {rent:[1100,1600], groc:[280,375], trans:63, util:[115,165]},
  } as Record<string,{rent:number[];groc:number[];trans:number;util:number[]}>,
  in:{
    // ── Indian cities — verified June 2026 (NoBroker Apr 2026, Housing.com, Numbeo) ──
    // pt = professional tax annual (INR); 0 = UP/Haryana/Rajasthan (no PT)
    // Gujarat (Ahmedabad): pt=2400 corrected from 0 — Gujarat levies ₹200/mo PT
    // MP (Indore, Bhopal): pt=2500 (highest slab ~₹208/mo)
    Bangalore:   {help:[13000,20000],pt:2400,rent:[32000,62000],groc:[13000,20000]},
    Hyderabad:   {help:[11000,17000],pt:2400,rent:[24000,50000],groc:[12000,17000]},
    Pune:        {help:[11000,16000],pt:2500,rent:[22000,45000],groc:[12000,17000]},
    Mumbai:      {help:[15000,22000],pt:2500,rent:[45000,100000],groc:[14000,22000]},
    'Delhi NCR': {help:[12000,19000],pt:0,   rent:[28000,62000],groc:[13000,19000]},
    Chennai:     {help:[11000,16000],pt:2400,rent:[22000,47000],groc:[12000,17000]},
    Kolkata:     {help:[8000,14000], pt:2400,rent:[16000,33000],groc:[9000,15000]},
    Ahmedabad:   {help:[8000,13000], pt:2400,rent:[15000,30000],groc:[9000,15000]},
    Gurgaon:     {help:[13000,20000],pt:0,   rent:[32000,62000],groc:[13000,19000]},
    Noida:       {help:[11000,16000],pt:0,   rent:[20000,43000],groc:[12000,17000]},
    Kochi:       {help:[9000,14000], pt:2400,rent:[17000,32000],groc:[10000,15000]},
    Indore:      {help:[5500,10000], pt:2500,rent:[11000,22000],groc:[7500,13000]},
    Coimbatore:  {help:[6500,11000], pt:2400,rent:[11000,20000],groc:[8500,14000]},
  } as Record<string,{help:number[];pt:number;rent:number[];groc:number[]}>,
};
