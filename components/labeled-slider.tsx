"use client";
import type {ComponentProps} from "react";
import {Slider} from "@/components/ui/slider";

/** Add the name to the focusable thumb, rather than only to its wrapper. */
export function LabeledSlider({label,unit="",...props}:ComponentProps<typeof Slider>&{label:string;unit?:string}){
 return <Slider {...props} aria-label={label} ref={node=>{
  node?.querySelectorAll('[role="slider"]').forEach(thumb=>{
   thumb.setAttribute("aria-label",label);
   if(props.value?.[0]!==undefined)thumb.setAttribute("aria-valuetext",`${props.value[0].toLocaleString("en-IN")} ${unit}`.trim());
  });
 }}/>;
}
