import {test} from "node:test";
import assert from "node:assert/strict";
import {DEFAULT_INPUTS,recommendStorage,simulate,validRoofOutline} from "../lib/hydrology.ts";
import {parseScenario} from "../lib/scenario.ts";

test("recommendation reaches its supply target with the smallest tested tank",()=>{
 for(const rain of [DEFAULT_INPUTS.rain,Array(12).fill(10),Array(12).fill(500)]){
  const v={...DEFAULT_INPUTS,rain};const s=recommendStorage(v);assert.equal(s.options.length,29);
  assert.ok(s.recommended);assert.ok(s.recommended.supplied>=s.bestSupply*.95-1e-6);
  assert.ok(s.options.filter(o=>o.tank<s.recommended!.tank).every(o=>o.supplied<s.bestSupply*.95-1e-6));
 }
});
test("no recommendation is invented for zero rainfall or zero demand",()=>{
 assert.equal(recommendStorage({...DEFAULT_INPUTS,rain:Array(12).fill(0)}).recommended,null);
 assert.equal(recommendStorage({...DEFAULT_INPUTS,dailyPerPerson:0}).recommended,null);
});
test("scenario export/import preserves the calculated water balance and copies inputs",()=>{
 const data={schemaVersion:1,profile:"bengaluru",inputs:{...DEFAULT_INPUTS,tank:7500}};
 const parsed=parseScenario(JSON.parse(JSON.stringify(data)));
 assert.deepEqual(simulate(parsed.inputs),simulate(data.inputs));
 parsed.inputs.rain[0]=99;assert.equal(data.inputs.rain[0],2);
});
test("scenario import rejects malformed, unsupported and out-of-control-range inputs",()=>{
 for(const data of [null,{}, {schemaVersion:2,profile:"bengaluru",inputs:DEFAULT_INPUTS},{schemaVersion:1,profile:"unknown",inputs:DEFAULT_INPUTS},...[-1,0,501,999999].map(tank=>({schemaVersion:1,profile:"bengaluru",inputs:{...DEFAULT_INPUTS,tank}}))])assert.throws(()=>parseScenario(data));
 assert.throws(()=>parseScenario({schemaVersion:1,profile:"bengaluru",inputs:{...DEFAULT_INPUTS,people:2.5}}));
 assert.throws(()=>simulate({...DEFAULT_INPUTS,rain:new Array(12)}));
});
test("roof boundary rejects crossed edges, collinear corners and non-finite points",()=>{
 assert.equal(validRoofOutline([[0,0],[20,0],[20,20],[0,20]]),true);
 assert.equal(validRoofOutline([[0,0],[20,20],[20,0],[0,20]]),false);
 assert.equal(validRoofOutline([[0,0],[5,0],[10,0],[20,0]]),false);
 assert.equal(validRoofOutline([[NaN,0],[20,0],[20,20],[0,20]]),false);
});
