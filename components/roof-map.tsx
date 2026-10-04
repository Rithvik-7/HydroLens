"use client";
import {useRef,useState,type PointerEvent as ReactPointerEvent} from "react";
import {Check,Crosshair,Minus,Pencil,Plus,ScanLine,Upload,RotateCcw,Move} from "lucide-react";
import {Tabs,TabsList,TabsTrigger} from "@/components/ui/tabs";
import {NumberField} from "@/components/planner-panels";
import {assetPath} from "@/lib/assets";
import {fmt,polygonArea,validRoofOutline} from "@/lib/hydrology";

const ORIGINAL=[[400.4,274.4],[602.2,274.4],[608.7,678.7],[395.8,678.7]];
const DIRECTIONS=[{label:"Left",key:"ArrowLeft"},{label:"Up",key:"ArrowUp"},{label:"Down",key:"ArrowDown"},{label:"Right",key:"ArrowRight"}];

export function RoofMap({area,onArea,expanded=false}:{area:number;onArea:(n:number)=>void;expanded?:boolean}){
 const [points,setPoints]=useState(ORIGINAL);
 const [editing,setEditing]=useState(false);
 const [corner,setCorner]=useState(0);
 const [layer,setLayer]=useState("boundary");
 const [zoom,setZoom]=useState(1);
 const [source,setSource]=useState<string|null>(null);
 const [error,setError]=useState("");
 const [failedImage,setFailedImage]=useState(false);
 const svg=useRef<SVGSVGElement>(null);
 const file=useRef<HTMLInputElement>(null);
 const drag=useRef<{index:number;before:number;base:number}|null>(null);

 function scaleArea(next:number[][],before=polygonArea(points),base=area){
  const ratio=polygonArea(next)/before;
  if(ratio>0.02)onArea(Math.max(1,Math.min(100000,Math.round(base*ratio*10)/10)));
 }
 function start(e:ReactPointerEvent<SVGCircleElement>,index:number){
  if(!editing)return;
  e.preventDefault();setCorner(index);e.currentTarget.setPointerCapture(e.pointerId);
  drag.current={index,before:polygonArea(points),base:area};
 }
 function move(e:ReactPointerEvent<SVGCircleElement>){
  const d=drag.current;if(!d||!svg.current)return;
  const rect=svg.current.getBoundingClientRect();
  const x=Math.max(10,Math.min(990,(e.clientX-rect.left)/rect.width*1000));
  const y=Math.max(10,Math.min(990,(e.clientY-rect.top)/rect.height*1000));
  const next=points.map((p,i)=>i===d.index?[x,y]:p);
  if(validRoofOutline(next)&&polygonArea(next)/d.before>0.02){setPoints(next);scaleArea(next,d.before,d.base);}
 }
 function keyMove(index:number,key:string){
  if(!editing)return;
  const delta=key==="ArrowLeft"?[-8,0]:key==="ArrowRight"?[8,0]:key==="ArrowUp"?[0,-8]:key==="ArrowDown"?[0,8]:null;
  if(!delta)return;
  const next=points.map((p,i)=>i===index?[Math.max(10,Math.min(990,p[0]+delta[0])),Math.max(10,Math.min(990,p[1]+delta[1]))]:p);
  if(!validRoofOutline(next)||polygonArea(next)/polygonArea(points)<=0.02)return;
  scaleArea(next);setPoints(next);
 }
 function upload(e:React.ChangeEvent<HTMLInputElement>){
  const f=e.target.files?.[0];if(!f)return;setError("");
  if(!["image/jpeg","image/png","image/webp"].includes(f.type)||f.size>8*1024*1024){setError("Choose a JPG, PNG or WebP image smaller than 8 MB.");e.target.value="";return;}
  const reader=new FileReader();
  reader.onload=()=>{setSource(String(reader.result));setFailedImage(false);setPoints(ORIGINAL);setZoom(1);setEditing(true);setLayer("boundary");};
  reader.onerror=()=>setError("This image could not be opened. Try another file.");
  reader.readAsDataURL(f);e.target.value="";
 }
 return <section className={`glass-panel map-panel ${expanded?"expanded-map":""}`} aria-label="Roof workspace">
  <div className="panel-top"><div className="panel-title"><ScanLine size={18}/>Your catchment</div><span className="subtle-tag">Manual outline</span></div>
  <div className="map-surface">
   <div className="map-grid"/>
   <div className="map-viewport" style={{transform:`scale(${zoom})`}}>
    <svg role="group" ref={svg} viewBox="0 0 1000 1000" preserveAspectRatio="none" className={`roof-overlay ${editing?"editing":""}`} aria-label="Roof image with manual boundary">
     <image href={source||assetPath("neighborhood.webp")} width="1000" height="1000" preserveAspectRatio="none" onError={()=>setFailedImage(true)}/>
     <rect width="1000" height="1000" className="map-shade"/>
     {layer==="boundary"&&<>
      <polygon points={points.map(p=>p.join(",")).join(" ")} fill="rgba(72,212,169,.2)" stroke="#a1ffce" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
      {points.map(([x,y],i)=><circle key={i} cx={x} cy={y} r={editing?14:6} fill={editing&&corner===i?"#9aebc8":"#e0ffef"} stroke="#358968" strokeWidth="2" vectorEffect="non-scaling-stroke" role={editing?"button":undefined} tabIndex={editing?0:undefined} aria-label={editing?`Corner ${i+1}. Use arrow keys to move.`:undefined} onFocus={()=>setCorner(i)} onKeyDown={e=>{if(e.key.startsWith("Arrow")){e.preventDefault();keyMove(i,e.key);}else if(e.key==="Enter"||e.key===" "){e.preventDefault();setCorner(i);}}} onPointerDown={e=>start(e,i)} onPointerMove={move} onPointerUp={()=>{drag.current=null}} onPointerCancel={()=>{drag.current=null}}/>)}
      <g pointerEvents="none"><rect x="415" y="425" width="166" height="104" rx="10" fill="#102f2be8" stroke="#acffd760" strokeWidth="1"/><text x="498" y="454" textAnchor="middle" className="roof-svg-label">ROOF AREA</text><text x="498" y="500" textAnchor="middle" className="roof-svg-area">{fmt(area)} m²</text></g>
     </>}
    </svg>
   </div>
   {failedImage&&<div className="image-error">Image unavailable. Your area-based calculations still work.</div>}
   <span className="image-type">{source?"YOUR IMAGE":"SAMPLE NEIGHBORHOOD"}</span>
   <div className="map-tools"><button aria-label="Zoom in" onClick={()=>setZoom(z=>Math.min(2,z+.2))} disabled={zoom>=2}><Plus size={18}/></button><button aria-label="Zoom out" onClick={()=>setZoom(z=>Math.max(1,z-.2))} disabled={zoom<=1}><Minus size={18}/></button><button aria-label="Reset zoom" onClick={()=>setZoom(1)}><Crosshair size={18}/></button></div>
   <div className="map-bottom"><Tabs value={layer} onValueChange={setLayer}><TabsList className="map-tabs"><TabsTrigger value="boundary">Outline</TabsTrigger><TabsTrigger value="image">Image</TabsTrigger></TabsList></Tabs><button className={`map-edit ${editing?"is-editing":""}`} aria-pressed={editing} onClick={()=>{setEditing(!editing);setLayer("boundary")}}>{editing?<Check size={16}/>:<Pencil size={16}/>} {editing?"Done":"Edit outline"}</button></div>
   <span className="map-attribution">{source?"Image stays in this session":"Illustrative image · no ground scale"}</span>
  </div>
  <div className="roof-measure"><NumberField label="Roof area" value={area} min={1} max={100000} step={.1} unit="m²" onChange={onArea}/><p>Use your measured area.<br/>Estimates update as you edit.</p><button className="button secondary" onClick={()=>file.current?.click()}><Upload size={16}/>Upload image</button></div>
  <input ref={file} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label="Choose a roof image" onChange={upload}/>
  {error&&<p className="inline-error" role="alert">{error}</p>}
  {editing&&<div className="corner-editor"><div className="corner-editor-heading"><Move size={16}/><span>Move a corner</span><span>Drag or use the controls</span></div><div className="corner-controls"><div className="corner-picker" aria-label="Select a roof corner">{points.map((_,i)=><button key={i} aria-label={`Select corner ${i+1}`} aria-pressed={corner===i} onClick={()=>setCorner(i)}>{i+1}</button>)}</div><div className="direction-controls">{DIRECTIONS.map(d=><button key={d.key} aria-label={`Move corner ${corner+1} ${d.label.toLowerCase()}`} onClick={()=>keyMove(corner,d.key)}>{d.label}</button>)}</div></div><p>Moving the outline scales the entered area proportionally. Enter a measured area for a more useful estimate.</p></div>}
  {(editing||source)&&<div className="edit-note"><span>{source?"Your image is kept while you explore this session.":"The sample outline is a starting point for planning."}</span><button onClick={()=>{setPoints(ORIGINAL);setSource(null);setFailedImage(false);setEditing(false);onArea(186);setZoom(1)}}><RotateCcw size={15}/>Reset sample</button></div>}
 </section>;
}
