import React,{useEffect,useRef,useState} from 'react';
import {X,Plus,MagnifyingGlass,Check,Lock} from 'phosphor-react';
import {entities,projects,Relation} from './model';
import {useStore} from './store';
import {alignmentHint} from './Alignment';

const ORDER=['Project','Objective','KR','KS','EKS','Milestone'];
const TYPE_TAG:Record<string,string>={Project:'Dự án',Objective:'Mục tiêu',EKS:'EKS',Milestone:'Mốc'};
/** Mã ngắn để hiển thị: KR2 / KS1 lấy từ label, EKS đánh số E1/E2 như card My EKS, loại khác dùng nhãn loại. */
export const codeOf=(e:Relation)=>e.label.match(/^(KR|KS)\d+/)?.[0]??(e.type==='EKS'?'E'+(entities.filter(x=>x.type==='EKS').findIndex(x=>x.id===e.id)+1):TYPE_TAG[e.type]??e.type);
/** Tên ngắn: bỏ tiền tố mã, cắt sau dấu ":" để chip gọn. */
export const nameOf=(e:Relation)=>e.label.replace(/^(KR|KS)\d+\s*·\s*/,'').split(':')[0];

/**
 * Chọn liên kết cho báo cáo: chip đã chọn (× để gỡ), gợi ý AI dạng chip viền nét đứt (bấm để thêm),
 * và popover tìm kiếm gom theo dự án, bấm một dòng để bật/tắt. Liên kết khóa (dự án đang mở) không gỡ được.
 */
/**
 * `onlyProject` = báo cáo viết trong một dự án: chỉ gắn được mục tiêu của chính dự án đó (không gắn dự án khác → không mơ hồ nội dung thuộc dự án nào).
 * `projectIds` = dự án được chọn làm dòng "Dự án" (vd. dự án user có quyền viết, vì chọn dự án = thêm khung Báo cáo dự án).
 * `projectHint` = dòng chú thích dưới nhóm, giải thích chọn dự án sẽ làm gì.
 */
export function RelationPicker({value,onChange,locked=[],suggestions=[],personal=false,footer,onlyProject,projectIds,projectHint}:{value:string[];onChange:(v:string[])=>void;locked?:string[];suggestions?:string[];personal?:boolean;footer?:React.ReactNode;onlyProject?:string;projectIds?:string[];projectHint?:string}){
 const [open,setOpen]=useState(false),[q,setQ]=useState('');const ref=useRef<HTMLDivElement>(null);const {data}=useStore();
 useEffect(()=>{if(!open)return;const off=(e:MouseEvent)=>{if(!ref.current?.contains(e.target as Node))setOpen(false)};const esc=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false)};document.addEventListener('mousedown',off);document.addEventListener('keydown',esc);return()=>{document.removeEventListener('mousedown',off);document.removeEventListener('keydown',esc)}},[open]);
 const toggle=(id:string)=>{if(locked.includes(id))return;onChange(value.includes(id)?value.filter(x=>x!==id):[...value,id])};
 const selected=value.map(id=>entities.find(e=>e.id===id)).filter((e):e is Relation=>!!e);
 const pending=suggestions.filter(id=>!value.includes(id)).map(id=>entities.find(e=>e.id===id)).filter((e):e is Relation=>!!e);
 const match=(e:Relation)=>!q.trim()||e.label.toLowerCase().includes(q.toLowerCase());
 // Báo cáo cá nhân chỉ gắn EKS cá nhân + mục tiêu dự án (không gắn Mốc, không gắn thẳng OKR team: OKR team đi qua EKS, xem Alignment.tsx).
 const projectItems=(pid:string)=>entities.filter(e=>e.project===pid&&match(e)&&(!personal||!['EKS','Milestone'].includes(e.type))&&(e.type!=='Project'||!projectIds||projectIds.includes(e.id))).sort((a,b)=>ORDER.indexOf(a.type)-ORDER.indexOf(b.type));
 const groups=[...(personal?[{id:'eks',label:'EKS cá nhân',items:entities.filter(e=>e.type==='EKS'&&match(e))}]:[]),...projects.filter(p=>!onlyProject||p.id===onlyProject).map(p=>({id:p.id,label:p.label,items:projectItems(p.id)}))].filter(g=>g.items.length);
 return <div className="rp" ref={ref}>
  <div className="rp-chips">
   {selected.map(e=><span className="rp-chip" key={e.id} title={e.label}><b>{codeOf(e)}</b><span>{nameOf(e)}</span>{locked.includes(e.id)?<Lock size={12} aria-label="Gắn cố định"/>:<button aria-label={'Gỡ '+e.label} onClick={()=>toggle(e.id)}><X size={12}/></button>}</span>)}
   <button className="rp-add" onClick={()=>setOpen(!open)} aria-expanded={open}><Plus size={14}/> {selected.length?'Thêm':'Thêm liên kết'}</button>
  </div>
  {/* Gợi ý tách thành một dòng chữ nhỏ bên dưới, không trộn với chip đã chọn. */}
  {pending.length>0&&<div className="rp-suggest-line"><span>Gợi ý từ nguồn đã dùng:</span>{pending.map(e=><button key={e.id} title={'Thêm '+e.label} onClick={()=>toggle(e.id)}><Plus size={11}/>{codeOf(e)} {nameOf(e)}</button>)}</div>}
  {footer}
  {open&&<div className="rp-pop" role="listbox" aria-label="Chọn liên kết">
   <div className="rp-search"><MagnifyingGlass size={16}/><input autoFocus aria-label="Tìm liên kết" placeholder="Tìm dự án, mục tiêu, KR, KS…" value={q} onChange={e=>setQ(e.target.value)}/></div>
   {projectHint&&<p className="rp-hint">{projectHint}</p>}
   <div className="rp-list">{groups.length?groups.map(g=><div key={g.id}><div className="rp-group">{g.label}</div>{g.items.map(e=>{const on=value.includes(e.id);return <button key={e.id} role="option" aria-selected={on} className={'rp-row '+(e.type==='Project'?'root':'')+(on?' on':'')} disabled={locked.includes(e.id)} onClick={()=>toggle(e.id)}><span className="rp-code">{codeOf(e)}</span><span className="rp-name">{nameOf(e)}{e.type==='EKS'&&<small className="rp-align">{alignmentHint(data,e.id)}</small>}</span>{on&&<Check size={16}/>}</button>})}</div>):<p className="rp-empty">Không tìm thấy</p>}</div>
  </div>}
 </div>;
}
