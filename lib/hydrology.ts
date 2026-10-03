/** All supplied rainfall profiles are illustrative teaching datasets, not observations. */
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const DAYS = [31,28,31,30,31,30,31,31,30,31,30,31];
export const PROFILES = [
  {id:"bengaluru",city:"Bengaluru",region:"Karnataka",neighborhood:"Jayanagar",rain:[2,5,15,45,105,115,125,150,210,170,75,18]},
  {id:"pune",city:"Pune",region:"Maharashtra",neighborhood:"Kothrud",rain:[1,1,5,18,42,135,190,145,130,72,28,4]},
  {id:"chennai",city:"Chennai",region:"Tamil Nadu",neighborhood:"Adyar",rain:[25,5,5,12,45,55,80,115,130,285,360,150]},
] as const;
export type PlanningInputs={area:number;runoff:number;efficiency:number;tank:number;people:number;dailyPerPerson:number;rain:number[]};
export const DEFAULT_INPUTS:PlanningInputs={area:186,runoff:.85,efficiency:.9,tank:5000,people:4,dailyPerPerson:80,rain:[...PROFILES[0].rain]};
export type MonthResult={month:string;rain:number;collected:number;supplied:number;overflow:number;unmet:number;closingStorage:number};
export function validateInputs(v:PlanningInputs){
 for(const [key,min,max] of [["area",1,100000],["runoff",0,1],["efficiency",0,1],["tank",0,1000000],["people",1,1000],["dailyPerPerson",0,1000]] as const){if(!Number.isFinite(v[key])||v[key]<min||v[key]>max)throw new Error(`Invalid ${key}`);}
 if(v.rain.length!==12||v.rain.some(x=>!Number.isFinite(x)||x<0||x>3000))throw new Error("Supply twelve monthly rainfall amounts between 0 and 3,000 mm.");
}
/** Daily mass balance, initially empty. Rain is spread over synthetic wet days.
 * Storage fills before daily demand is met; excess over capacity is lost first.
 * No assertion is made about actual storm timing, forecast skill or reliability.
 */
export function simulate(v:PlanningInputs){
 validateInputs(v);let storage=0;let storageSum=0;const dailyDemand=v.people*v.dailyPerPerson;
 const monthly:MonthResult[]=v.rain.map((rain,m)=>{
   const collected=rain*v.area*v.runoff*v.efficiency;
   const wetDays=rain===0?0:Math.min(DAYS[m],Math.max(1,Math.round(rain/12)));
   const r:MonthResult={month:MONTHS[m],rain,collected,supplied:0,overflow:0,unmet:0,closingStorage:0};
   for(let d=0;d<DAYS[m];d++){
     const isWet=Math.floor((d+1)*wetDays/DAYS[m])>Math.floor(d*wetDays/DAYS[m]);
     const inflow=isWet?collected/wetDays:0;
     r.overflow+=Math.max(0,storage+inflow-v.tank);
     storage=Math.min(v.tank,storage+inflow);
     const used=Math.min(storage,dailyDemand);storage-=used;r.supplied+=used;r.unmet+=dailyDemand-used;storageSum+=storage;
   }
   r.closingStorage=storage;return r;
 });
 const annualRain=v.rain.reduce((a,b)=>a+b,0);const annualHarvest=monthly.reduce((a,b)=>a+b.collected,0);const supplied=monthly.reduce((a,b)=>a+b.supplied,0);const overflow=monthly.reduce((a,b)=>a+b.overflow,0);const demand=dailyDemand*365;
 return {monthly,annualRain,annualHarvest,supplied,overflow,demand,unmet:demand-supplied,coverage:demand?100*supplied/demand:0,closingStorage:storage,averageStorage:storageSum/365};
}
export function polygonArea(points:number[][]){return Math.abs(points.reduce((sum,p,i)=>{const next=points[(i+1)%points.length];return sum+p[0]*next[1]-next[0]*p[1]},0))/2;}
export const fmt=(v:number)=>Math.round(v).toLocaleString("en-IN");
