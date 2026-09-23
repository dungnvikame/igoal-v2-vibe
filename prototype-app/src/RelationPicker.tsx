import React,{useEffect,useRef,useState} from 'react';
import {X,Plus,MagnifyingGlass,Check,Lock} from 'phosphor-react';
import {entities,projects,Relation} from './model';

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
export function RelationPicker({value,onChange,locked=[],suggestions=[]}:{value:string[];onChange:(v:string[])=>void;locked?:string[];suggestions?:string[]}){
 const [open,setOpen]=useState(false),[q,setQ]=useState('');const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(!open)return;const off=(e:MouseEvent)=>{if(!ref.current?.contains(e.target as Node))setOpen(false)};const esc=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false)};document.addEventListener('mousedown',off);document.addEventListener('keydown',esc);return()=>{document.removeEventListener('mousedown',off);document.removeEventListener('keydown',esc)}},[open]);
 const toggle=(id:string)=>{if(locked.includes(id))return;onChange(value.includes(id)?value.filter(x=>x!==id):[...value,id])};
 const selected=value.map(id=>entities.find(e=>e.id===id)).filter((e):e is Relation=>!!e);
 const pending=suggestions.filter(id=>!value.includes(id)).map(id=>entities.find(e=>e.id===id)).filter((e):e is Relation=>!!e);
 const match=(e:Relation)=>!q.trim()||e.label.toLowerCase().includes(q.toLowerCase());
 const groups=projects.map(p=>({p,items:entities.filter(e=>e.project===p.id&&match(e)).sort((a,b)=>ORDER.indexOf(a.type)-ORDER.indexOf(b.type))})).filter(g=>g.items.length);
 return <div className="rp" ref={ref}>
  <div className="rp-chips">
   {selected.map(e=><span className="rp-chip" key={e.id} title={e.label}><b>{codeOf(e)}</b><span>{nameOf(e)}</span>{locked.includes(e.id)?<Lock size={12} aria-label="Gắn cố định"/>:<button aria-label={'Gỡ '+e.label} onClick={()=>toggle(e.id)}><X size={12}/></button>}</span>)}
   {pending.map(e=><button className="rp-chip suggest" key={e.id} title={'Gợi ý: '+e.label} onClick={()=>toggle(e.id)}><Plus size={12}/><b>{codeOf(e)}</b><span>{nameOf(e)}</span></button>)}
   <button className="rp-add" onClick={()=>setOpen(!open)} aria-expanded={open}><Plus size={14}/> {selected.length?'Thêm':'Thêm liên kết'}</button>
  </div>
  {open&&<div className="rp-pop" role="listbox" aria-label="Chọn liên kết">
   <div className="rp-search"><MagnifyingGlass size={16}/><input autoFocus aria-label="Tìm liên kết" placeholder="Tìm dự án, mục tiêu, KR, KS…" value={q} onChange={e=>setQ(e.target.value)}/></div>
   <div className="rp-list">{groups.length?groups.map(({p,items})=><div key={p.id}><div className="rp-group">{p.label}</div>{items.map(e=>{const on=value.includes(e.id);return <button key={e.id} role="option" aria-selected={on} className={'rp-row '+(e.type==='Project'?'root':'')+(on?' on':'')} disabled={locked.includes(e.id)} onClick={()=>toggle(e.id)}><span className="rp-code">{codeOf(e)}</span><span className="rp-name">{nameOf(e)}</span>{on&&<Check size={16}/>}</button>})}</div>):<p className="rp-empty">Không tìm thấy</p>}</div>
  </div>}
 </div>;
}
