import React,{useEffect,useRef,useState} from 'react';
import {X,Plus,Check,CaretDown} from 'phosphor-react';
import {User} from './model';
import {roles,roleLabel} from './project-config';
import {MemberSearch} from './MemberSearch';

const initial=(n:string)=>n.trim().split(/\s+/).pop()?.[0];
/** Vai trò viết báo cáo mảng nào (chỉ vai trò có sẵn PM / UA / Creative). */
const writes=(role:string)=>roles.find(r=>r.id===role&&'writes' in r) as {writes?:string}|undefined;

/**
 * Chọn vai trò cho một thành viên: danh sách vai trò có sẵn + vai trò đã dùng trong dự án + "Vai trò mới…" (gõ tên, Enter).
 * `autoOpen` = mở ngay khi thành viên vừa được thêm (đúng luồng: thêm tên → hệ thống hỏi vai trò).
 */
function RolePicker({value,options,onChange,autoOpen,name}:{value:string;options:string[];onChange:(r:string)=>void;autoOpen?:boolean;name:string}){
 const [open,setOpen]=useState(!!autoOpen),[adding,setAdding]=useState(false),[draft,setDraft]=useState('');const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(!open)return;const off=(e:MouseEvent)=>{if(!ref.current?.contains(e.target as Node)){setOpen(false);setAdding(false)}};document.addEventListener('mousedown',off);return()=>document.removeEventListener('mousedown',off)},[open]);
 const pick=(r:string)=>{onChange(r);setOpen(false);setAdding(false);setDraft('')};
 return <div className="mr-role" ref={ref}>
  <button className={'mr-role-btn'+(value?'':' empty')} aria-haspopup="listbox" aria-expanded={open} aria-label={'Vai trò của '+name} onClick={()=>setOpen(!open)}>{value?roleLabel(value):'Chọn vai trò'}<CaretDown size={12}/></button>
  {open&&<div className="mr-pop" role="listbox" aria-label={'Vai trò của '+name}>
   {options.map(r=><button key={r} role="option" aria-selected={r===value} className={'mr-opt'+(r===value?' on':'')} onClick={()=>pick(r)}><span><strong>{roleLabel(r)}</strong>{writes(r)?.writes&&<small>Viết báo cáo {writes(r)!.writes}</small>}</span>{r===value&&<Check size={14}/>}</button>)}
   {adding?<div className="mr-new"><input autoFocus aria-label="Tên vai trò mới" placeholder="Tên vai trò, vd. Designer" value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&draft.trim()){e.preventDefault();pick(draft.trim())}if(e.key==='Escape')setAdding(false)}}/><button disabled={!draft.trim()} onClick={()=>pick(draft.trim())}>Thêm</button></div>
    :<button className="mr-opt add" onClick={()=>setAdding(true)}><Plus size={13}/> Vai trò mới…</button>}
  </div>}
 </div>;
}

/**
 * Bước "Thành viên": thêm người trước, chọn vai trò sau (không cố định sẵn các ô Creative / Dev / QA).
 * - Ô tìm thêm thành viên → dòng mới + hộp chọn vai trò tự mở. Vai trò: có sẵn (PM, UA, Creative, Dev, QA) hoặc vai trò mới tự đặt.
 * - PM, UA chọn ở Thông tin chung hiện ở đầu danh sách, khóa vai trò (sửa ở bước 1).
 * - `pending` = người đã thêm nhưng chưa chọn vai trò (chưa được lưu vào roles), bước này chưa qua được.
 */
export function MemberRoles({users,value,onChange,pending,setPending}:{users:User[];value:Record<string,string[]>;onChange:(v:Record<string,string[]>)=>void;pending:string[];setPending:(p:string[])=>void}){
 const [fresh,setFresh]=useState<string|null>(null);
 const rows=Object.entries(value).flatMap(([role,ids])=>ids.map(id=>({id,role})));
 const locked=(r:{role:string})=>r.role==='PM'||r.role==='UA';
 const all=[...rows.map(r=>r.id),...pending];
 const options=[...new Set([...roles.map(r=>r.id).filter(r=>r!=='PM'),...Object.keys(value).filter(k=>k!=='PM')])];
 const assign=(id:string,from:string|null,to:string)=>{const next:Record<string,string[]>={};for(const [k,v] of Object.entries(value))next[k]=v.filter(x=>!(x===id&&k===from));next[to]=[...(next[to]??[]).filter(x=>x!==id),id];onChange(next);if(from===null)setPending(pending.filter(x=>x!==id))};
 const remove=(id:string,role:string|null)=>{if(role===null){setPending(pending.filter(x=>x!==id));return}onChange({...value,[role]:value[role].filter(x=>x!==id)})};
 const user=(id:string)=>users.find(u=>u.id===id);
 const ordered=[...rows.filter(locked),...rows.filter(r=>!locked(r))];
 return <div className="mr">
  <MemberSearch hideChips label="Thêm thành viên" placeholder="Tìm và thêm thành viên theo tên, chức danh, team" users={users} value={all} onChange={ids=>{const added=ids.filter(x=>!all.includes(x));if(added.length){setPending([...pending,...added]);setFresh(added[added.length-1])}}}/>
  <ul className="mr-list">
   {pending.map(id=>{const u=user(id);return u&&<li key={'p-'+id} className="mr-row pending"><span className="avatar tiny">{initial(u.name)}</span><span className="mr-name"><strong>{u.name}</strong><small>{u.role}</small></span>
    <RolePicker name={u.name} value="" options={options} autoOpen={fresh===id} onChange={r=>assign(id,null,r)}/><button className="pf-x" aria-label={'Bỏ '+u.name} onClick={()=>remove(id,null)}><X size={14}/></button></li>})}
   {ordered.map(r=>{const u=user(r.id);return u&&<li key={r.role+'-'+r.id} className="mr-row"><span className="avatar tiny">{initial(u.name)}</span><span className="mr-name"><strong>{u.name}</strong><small>{u.role}</small></span>
    {locked(r)?<span className="mr-role-fixed" title="Chọn ở bước Thông tin chung">{roleLabel(r.role)}{r.role==='PM'?' · viết báo cáo Sản phẩm':' · viết báo cáo Kinh doanh'}</span>:<RolePicker name={u.name} value={r.role} options={options} onChange={to=>assign(r.id,r.role,to)}/>}
    {!locked(r)?<button className="pf-x" aria-label={'Bỏ '+u.name} onClick={()=>remove(r.id,r.role)}><X size={14}/></button>:<span/>}</li>})}
  </ul>
  {!ordered.length&&!pending.length&&<p className="hint">Chưa có thành viên.</p>}
 </div>;
}
