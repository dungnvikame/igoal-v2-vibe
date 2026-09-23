import React,{useState} from 'react';
import {MagnifyingGlass,Flag,CalendarBlank,Clock,ChatsCircle,CheckCircle,FileText} from 'phosphor-react';
import {projects,kindLabel,relativeDate} from './model';
import {useStore} from './store';

type Hit={key:string;group:string;title:string;meta:string;Icon:React.ElementType;kind:string;go:()=>void};
const KIND_ICON:Record<string,React.ElementType>={weekly:CalendarBlank,instant:Clock,meeting:ChatsCircle,checkin:Flag};
const MAX_PER_GROUP=5;

/** Tô đậm đoạn khớp từ khóa (không phân biệt hoa thường). */
function Highlight({text,q}:{text:string;q:string}){const i=text.toLowerCase().indexOf(q.toLowerCase());if(!q||i<0)return <>{text}</>;return <>{text.slice(0,i)}<mark>{text.slice(i,i+q.length)}</mark>{text.slice(i+q.length)}</>}

/**
 * Ô tìm kiếm trên topbar: kết quả gom theo Dự án / Báo cáo / Đóng góp, mỗi dòng có icon loại, meta và phần khớp được tô.
 * Bàn phím: Ctrl K vào ô (App gắn ref), ↑ ↓ chọn, Enter mở, Esc xóa.
 */
export function GlobalSearch({inputRef,openSource,openProject}:{inputRef:React.RefObject<HTMLInputElement|null>;openSource:(id:string)=>void;openProject:(id:string)=>void}){
 const {data}=useStore();const [q,setQ]=useState(''),[cursor,setCursor]=useState(0);
 const term=q.trim().toLowerCase();const has=(s:string)=>s.toLowerCase().includes(term);
 const hits:Hit[]=!term?[]:[
  ...projects.filter(p=>has(p.label)).slice(0,MAX_PER_GROUP).map(p=>({key:p.id,group:'Dự án',title:p.label,meta:'Dự án',Icon:Flag,kind:'project',go:()=>openProject(p.id)})),
  ...data.reports.filter(r=>has(r.title)).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,MAX_PER_GROUP).map(r=>({key:r.id,group:'Báo cáo',title:r.title,meta:[kindLabel[r.kind],r.owner,relativeDate(r.date)].join(' · ')+(r.status==='DRAFT'?' · Bản nháp':''),Icon:KIND_ICON[r.kind]??FileText,kind:r.kind,go:()=>openSource(r.id)})),
  ...data.contributions.filter(c=>has(c.title)).slice(0,MAX_PER_GROUP).map(c=>({key:c.id,group:'Đóng góp',title:c.title,meta:[c.owner,relativeDate(c.date)].join(' · '),Icon:CheckCircle,kind:'contribution',go:()=>openSource(c.id)})),
 ];
 const pick=(h?:Hit)=>{if(!h)return;h.go();setQ('');setCursor(0);inputRef.current?.blur()};
 const onKey=(e:React.KeyboardEvent<HTMLInputElement>)=>{
  if(e.key==='Escape'){setQ('');e.currentTarget.blur()}
  else if(e.key==='ArrowDown'){e.preventDefault();setCursor(c=>Math.min(c+1,hits.length-1))}
  else if(e.key==='ArrowUp'){e.preventDefault();setCursor(c=>Math.max(c-1,0))}
  else if(e.key==='Enter')pick(hits[cursor]);
 };
 let last='';
 return <div className="global-search">
  <MagnifyingGlass/>
  <input ref={inputRef} role="combobox" aria-expanded={!!term} aria-controls="gs-results" aria-activedescendant={hits[cursor]?'gs-'+hits[cursor].key:undefined} aria-label="Tìm dữ liệu demo" aria-keyshortcuts="Control+K" placeholder="Tìm kiếm thành viên, dự án, nhóm" value={q} onChange={e=>{setQ(e.target.value);setCursor(0)}} onKeyDown={onKey}/>
  <kbd aria-hidden="true">Ctrl K</kbd>
  {term&&<div className="search-results" id="gs-results" role="listbox" aria-label="Kết quả tìm kiếm">
   {hits.map((h,i)=>{const head=h.group!==last;last=h.group;return <React.Fragment key={h.key}>{head&&<div className="gs-group">{h.group}</div>}<button id={'gs-'+h.key} role="option" aria-selected={i===cursor} className={'gs-row'+(i===cursor?' active':'')} onMouseEnter={()=>setCursor(i)} onMouseDown={e=>e.preventDefault()} onClick={()=>pick(h)}><span className={'type-icon small '+h.kind}><h.Icon size={16}/></span><span className="gs-text"><strong><Highlight text={h.title} q={q.trim()}/></strong><small>{h.meta}</small></span></button></React.Fragment>})}
   {!hits.length&&<p className="gs-empty">Không có kết quả cho “{q.trim()}”</p>}
   {hits.length>0&&<div className="gs-foot"><span><kbd>↑</kbd><kbd>↓</kbd> chọn</span><span><kbd>Enter</kbd> mở</span><span><kbd>Esc</kbd> đóng</span></div>}
  </div>}
 </div>;
}
