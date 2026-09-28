import React,{useState} from 'react';
import {ArrowLeft,CaretRight,Plus,Check,MagnifyingGlass,ArrowSquareOut} from 'phosphor-react';
import {Report,Suggestion,projects,kindLabel,dateLabel} from './model';

/** Một báo cáo nguồn trong panel: nội dung đã chia theo mục đích đến (vd. "Kết quả tuần này"). */
/** `project` / `kind` / `owner` / `date` dùng cho bộ lọc của panel. */
export type SourceOption={id:string;title:string;meta:string;pinned?:boolean;project?:string;kind?:Report['kind'];owner?:string;date?:string;groups:{label:string;items:{key:string;text:string}[]}[]};

/**
 * Dựng danh sách nguồn cho panel từ các gợi ý: gom theo báo cáo nguồn, chia dòng theo mục đích đến.
 * `targetOf` map loại gợi ý → nhãn mục (bỏ qua nếu undefined). `order` là thứ tự các mục. `byOwner` hiện người viết thay vì dự án (PM).
 * `prev` (tùy chọn) là kế hoạch kỳ trước, ghim đầu danh sách, mỗi việc có 2 dạng "Hoàn thành" / "Tiếp tục".
 */
export function buildSourceOptions(reports:Report[],sugg:Suggestion[],targetOf:(k:Suggestion['kind'])=>string|undefined,order:string[],opts:{byOwner?:boolean;prev?:{report:Report;items:string[];done:string;todo:string}}={}):SourceOption[]{
 const out:SourceOption[]=[];const p=opts.prev;
 if(p&&p.items.length)out.push({id:p.report.id,title:p.report.title,meta:'Kế hoạch kỳ trước · '+dateLabel(p.report.date),pinned:true,groups:[{label:p.done,items:p.items.map((x,i)=>({key:'carry-r-'+i,text:'Hoàn thành: '+x}))},{label:p.todo,items:p.items.map((x,i)=>({key:'carry-p-'+i,text:'Tiếp tục: '+x}))}]});
 [...new Set(sugg.map(s=>s.source))].forEach(id=>{const rep=reports.find(x=>x.id===id);if(!rep)return;const own=sugg.filter(s=>s.source===id);
  const groups=order.map(label=>({label,items:own.filter(s=>targetOf(s.kind)===label).map(s=>({key:s.id,text:s.text}))})).filter(g=>g.items.length);
  const project=projects.find(x=>rep.relations.includes(x.id))?.id;
  if(groups.length)out.push({id,title:rep.title,meta:[opts.byOwner?rep.owner:projects.find(x=>x.id===project)?.label,kindLabel[rep.kind],dateLabel(rep.date)].filter(Boolean).join(' · '),project,kind:rep.kind,owner:rep.owner,date:rep.date,groups});
 });
 return out;
}
/** Hai dạng của cùng một việc kỳ trước dùng chung dấu "đã thêm". */
export const addedKeys=(key:string)=>[key,key.replace(/^carry-[rp]-/,'carry-r-'),key.replace(/^carry-[rp]-/,'carry-p-')];

/**
 * Panel "Lấy từ báo cáo", 2 bước để không sổ hết mọi dòng:
 * 1) danh sách báo cáo nguồn (tiêu đề · meta · số ý), có ô tìm khi nhiều nguồn;
 * 2) bấm một báo cáo → các dòng của nó, gom theo mục sẽ chèn vào, mỗi dòng một nút ＋.
 * Dùng chung cho báo cáo tuần; `onAdd(sourceId, groupLabel, key, text)` do màn gọi quyết định chèn ở đâu.
 */
/** `groupLabel` = tên nhóm dòng (mặc định: Vào “mục”); `destOf` = dòng "Chèn vào: …" cho biết nội dung sẽ đi đâu. */
export function SourcePicker({title,options,added,onAdd,openSource,empty,context,groupLabel=l=>`Vào “${l}”`,destOf}:{title:string;options:SourceOption[];added:string[];onAdd:(sourceId:string,label:string,key:string,text:string)=>void;openSource:(id:string)=>void;empty:string;context?:React.ReactNode;groupLabel?:(label:string)=>string;destOf?:(sourceId:string)=>React.ReactNode}){
 const [cur,setCur]=useState<string|null>(null),[q,setQ]=useState(''),[fp,setFp]=useState('all'),[fk,setFk]=useState('all'),[fo,setFo]=useState('all');
 const left=(o:SourceOption)=>o.groups.reduce((n,g)=>n+g.items.filter(it=>!added.includes(it.key)).length,0)/(o.pinned?2:1);
 const opt=options.find(o=>o.id===cur);
 if(opt)return <div className="sp">
  <button className="sp-back" onClick={()=>setCur(null)}><ArrowLeft/> Tất cả báo cáo</button>
  <div className="sp-head"><h3>{opt.title}</h3><button className="sp-open" aria-label="Mở báo cáo gốc" title="Mở báo cáo gốc" onClick={()=>openSource(opt.id)}><ArrowSquareOut/></button></div>
  <p className="sp-meta">{opt.meta}</p>{destOf&&<p className="sp-dest">{destOf(opt.id)}</p>}{context}
  {opt.groups.map(g=><section key={g.label}><div className="sp-group">{groupLabel(g.label)}</div>{g.items.map(it=>{const done=added.includes(it.key);return <button key={it.key} className={'sp-line'+(done?' done':'')} disabled={done} onClick={()=>onAdd(opt.id,g.label,it.key,it.text)}><span>{it.text}</span>{done?<Check weight="bold"/>:<Plus weight="bold"/>}</button>})}</section>)}
 </div>;
 // Bộ lọc: Dự án · Loại báo cáo · Người viết. Chỉ hiện bộ lọc có từ 2 giá trị trở lên để không thừa.
 const uniq=<T,>(xs:(T|undefined)[])=>[...new Set(xs.filter((x):x is T=>!!x))];
 const projectIds=uniq(options.map(o=>o.project)),kinds=uniq(options.map(o=>o.kind)),owners=uniq(options.map(o=>o.owner));
 const match=(o:SourceOption)=>(fp==='all'||o.project===fp)&&(fk==='all'||o.kind===fk)&&(fo==='all'||o.owner===fo)&&(!q.trim()||(o.title+o.meta).toLowerCase().includes(q.toLowerCase()));
 const shown=options.filter(match);const filtering=fp!=='all'||fk!=='all'||fo!=='all'||!!q.trim();
 const clear=()=>{setFp('all');setFk('all');setFo('all');setQ('')};
 return <div className="sp">
  <div className="sp-head"><h3>{title}</h3></div>{context}
  {options.length>1&&<div className="sp-filters">
   <div className="sp-search"><MagnifyingGlass/><input aria-label="Tìm báo cáo nguồn" placeholder="Tìm báo cáo…" value={q} onChange={e=>setQ(e.target.value)}/></div>
   <div className="sp-selects">
    {projectIds.length>1&&<select aria-label="Lọc theo dự án" className={fp!=='all'?'on':''} value={fp} onChange={e=>setFp(e.target.value)}><option value="all">Dự án</option>{projectIds.map(id=><option key={id} value={id}>{projects.find(p=>p.id===id)?.label??id}</option>)}</select>}
    {kinds.length>1&&<select aria-label="Lọc theo loại báo cáo" className={fk!=='all'?'on':''} value={fk} onChange={e=>setFk(e.target.value)}><option value="all">Loại</option>{kinds.map(k=><option key={k} value={k}>{kindLabel[k]}</option>)}</select>}
    {owners.length>1&&<select aria-label="Lọc theo người viết" className={fo!=='all'?'on':''} value={fo} onChange={e=>setFo(e.target.value)}><option value="all">Người viết</option>{owners.map(o=><option key={o}>{o}</option>)}</select>}
   </div>
   <div className="sp-filter-meta"><span>{shown.length}/{options.length} báo cáo</span>{filtering&&<button className="text-button" onClick={clear}>Xóa lọc</button>}</div>
  </div>}
  {shown.length?<div className="sp-list">{shown.map(o=>{const n=Math.ceil(left(o));return <button key={o.id} className={'sp-source'+(o.pinned?' pinned':'')} onClick={()=>setCur(o.id)}><span className="sp-source-text"><strong>{o.title}</strong><small>{o.meta}</small></span><span className="sp-count">{n>0?n+' ý':<Check/>}</span><CaretRight/></button>})}</div>:<p className="sp-empty">{options.length?'Không có báo cáo phù hợp bộ lọc':empty}</p>}
 </div>;
}
