import {PROFILES,validateInputs,type PlanningInputs} from "./hydrology.ts";
export const SCENARIO_STORAGE_KEY="hydrolens.scenario.v1";
export type SavedScenario={schemaVersion:1;profile:string;inputs:PlanningInputs};

/** Copy only known fields, validate untrusted imported or device-local JSON. */
export function parseScenario(raw:unknown):SavedScenario{
 if(typeof raw!=="object"||raw===null)throw Error("Choose a HydroLens scenario JSON file.");
 const v=raw as Record<string,unknown>;
 if(v.schemaVersion!==1||typeof v.profile!=="string"||!PROFILES.some(p=>p.id===v.profile))throw Error("Unsupported scenario version or rainfall profile.");
 if(typeof v.inputs!=="object"||v.inputs===null)throw Error("The scenario is missing its planning inputs.");
 const i=v.inputs as Record<string,unknown>;
 const inputs:PlanningInputs={area:i.area as number,runoff:i.runoff as number,efficiency:i.efficiency as number,tank:i.tank as number,people:i.people as number,dailyPerPerson:i.dailyPerPerson as number,rain:Array.isArray(i.rain)?[...i.rain]:[]};
 validateInputs(inputs);
 if(inputs.tank<1000||inputs.tank>15000||inputs.tank%500!==0||inputs.people>100||inputs.dailyPerPerson<1||inputs.dailyPerPerson>500||inputs.efficiency<.5)throw Error("Use a 1,000–15,000 L tank in 500 L steps, up to 100 people, 1–500 L daily demand, and 50–100% efficiency.");
 return {schemaVersion:1,profile:v.profile,inputs};
}
