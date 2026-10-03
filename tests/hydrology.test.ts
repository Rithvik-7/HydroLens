import {test} from "node:test";
import assert from "node:assert/strict";
import {DEFAULT_INPUTS,simulate} from "../lib/hydrology.ts";
test("conserves water across collection, supply, overflow and final storage",()=>{for(const tank of [0,1000,5000,10000,100000]){const r=simulate({...DEFAULT_INPUTS,tank});assert.ok(Math.abs(r.annualHarvest-r.supplied-r.overflow-r.closingStorage)<1e-6);assert.ok(r.coverage>=0&&r.coverage<=100);assert.ok(r.monthly.every(m=>m.closingStorage>=0&&m.closingStorage<=tank));}});
test("one millimetre over one square metre yields one litre before losses",()=>{const r=simulate({...DEFAULT_INPUTS,area:100,runoff:.8,efficiency:.9,rain:Array(12).fill(100)});assert.ok(Math.abs(r.annualHarvest-86400)<1e-6)});
test("no rain and zero collection efficiency supply no water",()=>{for(const v of [{...DEFAULT_INPUTS,rain:Array(12).fill(0)},{...DEFAULT_INPUTS,efficiency:0}])assert.equal(simulate(v).supplied,0)});
test("larger tanks do not reduce annual supply for the same inflows",()=>{const a=simulate({...DEFAULT_INPUTS,tank:2000});const b=simulate({...DEFAULT_INPUTS,tank:10000});assert.ok(b.supplied>=a.supplied);assert.ok(b.overflow<=a.overflow)});
test("rejects malformed data instead of propagating invalid estimates",()=>{assert.throws(()=>simulate({...DEFAULT_INPUTS,area:NaN}));assert.throws(()=>simulate({...DEFAULT_INPUTS,rain:[1]}));assert.throws(()=>simulate({...DEFAULT_INPUTS,rain:Array(12).fill(-1)}))});
