import React,{useEffect,useRef,useState} from 'react';
import {X,MagnifyingGlass,CaretDown} from 'phosphor-react';
import {User,teams} from './model';

const norm=(s:string)=>s.normalize('NFD').replace(/\p{M}/gu,'').replace(/đ/gi,'d').toLowerCase();
const initial=(n:string)=>n.trim().split(/\s+/).pop()?.[0];

/**
 * Chọn thành viên theo vai trò bằng tìm kiếm (không liệt kê sẵn cả danh sách):
 * gõ tên / chức danh / team (không dấu vẫn tìm được) → danh sách gợi ý → Enter hoặc bấm để chọn. Người đã chọn hiện dạng chip, × để gỡ.
 * `single` = chỉ một người (vd. Product Manager): chọn người mới thay người cũ.
 */
/** `hideChips` = không hiện chip người đã chọn (màn gọi tự hiện danh sách, vd. bước Thành viên). */
export function MemberSearch({users,value,onChange,placeholder,single=false,label,hideChips=false}:{users:User[];value:string[];onChange:(v:string[])=>void;placeholder:string;single?:boolean;label:string;hideChips?:boolean}){
 const [q,setQ]=useState(''),[open,setOpen]=useState(false),[active,setActive]=useState(0);const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(!open)return;const off=(e:MouseEvent)=>{if(!ref.current?.contains(e.target as Node))setOpen(false)};document.addEventListener('mousedown',off);return()=>document.removeEventListener('mousedown',off)},[open]);
 const selected=value.map(id=>users.find(u=>u.id===id)).filter((u):u is User=>!!u);
 const team=(u:User)=>teams.find(t=>t.id===u.team)?.label??u.team;
 // Xếp hạng: đầu một chữ trong tên (0) → đầu chữ trong chức danh/team (1) → chứa ở giữa chữ (2). "an" ra "Bùi Hoài An" trước "Trần Quang Hưng".
 const qq=norm(q.trim());const starts=(s:string)=>norm(s).split(/\s+/).some(w=>w.startsWith(qq));
 const rank=(u:User)=>!qq?0:starts(u.name)?0:starts(`${u.role} ${team(u)}`)?1:norm(`${u.name} ${u.role} ${team(u)}`).includes(qq)?2:-1;
 const results=users.filter(u=>!value.includes(u.id)&&rank(u)>=0).sort((a,b)=>rank(a)-rank(b)).slice(0,6);
 const pick=(u:User)=>{onChange(single?[u.id]:[...value,u.id]);setQ('');setActive(0);if(single||hideChips)setOpen(false)};
 return <div className="ms" ref={ref}>
  <div className={'ms-box'+(open?' open':'')} onClick={()=>{setOpen(true);ref.current?.querySelector('input')?.focus()}}>
   {!hideChips&&selected.map(u=><span className="ms-chip" key={u.id}><span className="avatar tiny">{initial(u.name)}</span>{u.name}<button aria-label={'Gỡ '+u.name} onClick={e=>{e.stopPropagation();onChange(value.filter(x=>x!==u.id))}}><X size={11}/></button></span>)}
   {(!single||!selected.length)&&<span className="ms-input"><MagnifyingGlass size={14}/><input aria-label={label} placeholder={selected.length&&!hideChips?"Thêm…":placeholder} value={q} onFocus={()=>setOpen(true)}
    onChange={e=>{setQ(e.target.value);setOpen(true);setActive(0)}}
    onKeyDown={e=>{if(e.key==='ArrowDown'){e.preventDefault();setActive(a=>Math.min(a+1,results.length-1))}else if(e.key==='ArrowUp'){e.preventDefault();setActive(a=>Math.max(a-1,0))}else if(e.key==='Enter'&&results[active]){e.preventDefault();pick(results[active])}else if(e.key==='Escape'){e.stopPropagation();setOpen(false)}else if(e.key==='Backspace'&&!q&&value.length)onChange(value.slice(0,-1))}}/></span>}
   <CaretDown size={14} className="ms-caret"/>
  </div>
  {open&&(!single||!selected.length)&&<div className="ms-pop" role="listbox" aria-label={label}>{results.length?results.map((u,i)=><button key={u.id} role="option" aria-selected={i===active} className={'ms-row'+(i===active?' on':'')} onMouseDown={e=>{e.preventDefault();pick(u)}} onMouseEnter={()=>setActive(i)}><span className="avatar tiny">{initial(u.name)}</span><span><strong>{u.name}</strong><small>{u.role} · {team(u)}</small></span></button>):<p className="rp-empty">{q?'Không tìm thấy thành viên':'Đã chọn hết'}</p>}</div>}
 </div>;
}
