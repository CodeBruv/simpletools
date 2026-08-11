import{f as s,j as i}from"./index-tKOoBib7.js";/**
 * @license lucide-react v0.513.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]],$=s("loader-circle",u);/**
 * @license lucide-react v0.513.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const m=[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}]],M=s("rotate-ccw",m);/**
 * @license lucide-react v0.513.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],x=s("shield-check",p);/**
 * @license lucide-react v0.513.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h=[["path",{d:"M12 3v12",key:"1x0j5s"}],["path",{d:"m17 8-5-5-5 5",key:"7q97r8"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}]],N=s("upload",h),o=1024,c=o*1024;function r(e,t){if(!Number.isFinite(e)||e<0)return"—";if(e<o)return`${Math.round(e)} B`;const n=e>=c,a=n?e/c:e/o,d=n?"MB":"KB";return`${a.toFixed(t??1)} ${d}`}function F(e,t){return!Number.isFinite(e)||e<=0||!Number.isFinite(t)||t<0?0:(e-t)/e*100}function _(e,t=1){return Number.isFinite(e)?`${e.toFixed(t)}%`:"—"}function f(e){const t=e.lastIndexOf(".");return t>0?e.slice(0,t):e}function k(e){const t=e.lastIndexOf(".");return t>0?e.slice(t+1).toLowerCase():""}function v(e,t,n="-compressed"){return`${f(e).trim()||"file"}${n}.${t}`}function z(e,t){if(e.size===0)return{ok:!1,message:`${e.name} is empty. Pick a file with content in it.`};const n=t.acceptedMimeTypes.includes(e.type),a=t.acceptedExtensions.includes(k(e.name));return!n&&!a?{ok:!1,message:`${t.acceptedLabel} files only. ${e.name} isn't one of those.`}:e.size>t.maxBytes?{ok:!1,message:`${e.name} is ${r(e.size)}. The limit is ${r(t.maxBytes,0)}.`}:{ok:!0}}function j({children:e}){return i.jsxs("p",{className:"flex items-start gap-2.5 text-[13px] leading-relaxed text-muted",children:[i.jsx(x,{className:"mt-px size-4 shrink-0 text-accent",strokeWidth:1.75,"aria-hidden":"true"}),i.jsx("span",{children:e})]})}export{$ as L,j as P,M as R,N as U,_ as a,v as b,r as f,k as g,F as r,z as v};
