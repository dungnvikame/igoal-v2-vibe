import React,{useEffect,useRef,useState} from 'react';
import {ArrowElbowDownRight,Plus,Check,PencilSimple} from 'phosphor-react';
import {Data,entities,teamGoals,teams,TeamGoal} from './model';
import {useStore} from './store';
import {codeOf,nameOf} from './RelationPicker';

/**
 * Liên kết EKS → mục tiêu team.
 * Rule: báo cáo chỉ gắn EKS cá nhân / mục tiêu dự án; đóng góp cho OKR team đi qua EKS.
 * Liên kết được thiết lập một lần ở My EKS (bước thiết lập EKS), editor báo cáo chỉ đọc lại để người viết thấy báo cáo đang phục vụ mục tiêu team nào.
 */
export const alignedGoals=(d:Data,eksId:string)=>(d.alignments?.[eksId]??[]).map(id=>teamGoals.find(g=>g.id===id)).filter((g):g is TeamGoal=>!!g);
const teamName=(id:string)=>teams.find(t=>t.id===id)?.label??id;

function GoalChip({g}:{g:TeamGoal}){return <span className="al-chip" title={`Team ${teamName(g.team)} · ${g.code} · ${g.label}`}><b>{g.code}</b><span>{g.label}</span></span>}

/** Dòng dưới một EKS trên card My EKS: mục tiêu team đang đóng góp + nút thiết lập (popover chọn Team OKR). */
export function AlignmentLine({eksId}:{eksId:string}){
 const {data,saveAlignment}=useStore();const [open,setOpen]=useState(false);const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(!open)return;const off=(e:MouseEvent)=>{if(!ref.current?.contains(e.target as Node))setOpen(false)};const esc=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false)};document.addEventListener('mousedown',off);document.addEventListener('keydown',esc);return()=>{document.removeEventListener('mousedown',off);document.removeEventListener('keydown',esc)}},[open]);
 const goals=alignedGoals(data,eksId);const ids=goals.map(g=>g.id);
 const toggle=(id:string)=>saveAlignment(eksId,ids.includes(id)?ids.filter(x=>x!==id):[...ids,id]);
 const groups=[...new Set(teamGoals.map(g=>g.team))];
 return <div className="al-line" ref={ref}>
  <ArrowElbowDownRight className="al-icon"/><span className="al-label">Đóng góp cho mục tiêu team</span>
  {goals.map(g=><GoalChip key={g.id} g={g}/>)}
  <button className="al-edit" aria-expanded={open} onClick={()=>setOpen(!open)}>{goals.length?<><PencilSimple size={13}/> Sửa</>:<><Plus size={13}/> Liên kết mục tiêu team</>}</button>
  {open&&<div className="rp-pop al-pop" role="listbox" aria-label="Chọn mục tiêu team">
   <p className="al-pop-hint">Chọn KR của team mà EKS này đóng góp vào. Báo cáo gắn EKS sẽ hiển thị liên kết này.</p>
   {groups.map(t=><div key={t}><div className="rp-group">Team {teamName(t)} · H2 2026</div>{teamGoals.filter(g=>g.team===t).map(g=>{const root=!g.parent;const on=ids.includes(g.id);
    return <button key={g.id} role="option" aria-selected={on} className={'rp-row'+(root?' root':'')+(on?' on':'')} disabled={root} title={root?'Liên kết ở cấp KR':undefined} onClick={()=>toggle(g.id)}><span className="rp-code">{g.code}</span><span className="rp-name">{g.label}</span>{on&&<Check size={16}/>}</button>})}</div>)}
  </div>}
 </div>;
}

/** Trong editor báo cáo: mỗi EKS đang gắn → mục tiêu team nó đóng góp (chỉ đọc, thiết lập ở My EKS). */
export function EksAlignmentSummary({relations}:{relations:string[]}){
 const {data}=useStore();const eks=entities.filter(e=>e.type==='EKS'&&relations.includes(e.id));
 if(!eks.length)return <span className="hint">Gắn EKS ở Liên kết để thấy mục tiêu team mà báo cáo đóng góp.</span>;
 const team=eks.flatMap(e=>alignedGoals(data,e.id))[0]?.team;
 return <div className="al-summary">{eks.map(e=>{const goals=alignedGoals(data,e.id);return <div className="al-sum-row" key={e.id}>
  <b className="al-eks" title={e.label}>{codeOf(e)}</b><ArrowElbowDownRight className="al-icon"/>
  {goals.length?goals.map(g=><GoalChip key={g.id} g={g}/>):<small className="hint">Chưa liên kết mục tiêu team</small>}
 </div>})}<small className="hint">{team?'OKR team '+teamName(team)+' · ':''}Liên kết thiết lập ở My EKS</small></div>;
}

/** Nhãn ngắn cho dòng EKS trong popover Liên kết: "→ KR1, KR3 · Team Technology". */
export const alignmentHint=(d:Data,eksId:string)=>{const g=alignedGoals(d,eksId);return g.length?`→ ${g.map(x=>x.code).join(', ')} · Team ${teamName(g[0].team)}`:'Chưa liên kết mục tiêu team'};
