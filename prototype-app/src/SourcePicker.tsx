import React,{useState} from 'react';
import {ArrowLeft,CaretRight,Plus,Check,MagnifyingGlass,ArrowSquareOut} from 'phosphor-react';
import {Report,Suggestion,projects,kindLabel,dateLabel} from './model';

/** Một báo cáo nguồn trong panel: nội dung đã chia theo mục đích đến (vd. "Kết quả tuần này"). */
export type SourceOption={id:string;title:string;meta:string;pinned?:boolean;groups:{label:string;items:{key:string;text:string}[]}[]};

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
  if(groups.length)out.push({id,title:rep.title,meta:[opts.byOwner?rep.owner:projects.find(x=>rep.relations.includes(x.id))?.label,kindLabel[rep.kind],dateLabel(rep.date)].filter(Boolean).join(' · '),groups});
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
export function SourcePicker({title,options,added,onAdd,openSource,empty,context}:{title:string;options:SourceOption[];added:string[];onAdd:(sourceId:string,label:string,key:string,text:string)=>void;openSource:(id:string)=>void;empty:string;context?:React.ReactNode}){
 const [cur,setCur]=useState<string|null>(null),[q,setQ]=useState('');
 const left=(o:SourceOption)=>o.groups.reduce((n,g)=>n+g.items.filter(it=>!added.includes(it.key)).length,0)/(o.pinned?2:1);
 const opt=options.find(o=>o.id===cur);
 if(opt)return <div className="sp">
  <button className="sp-back" onClick={()=>setCur(null)}><ArrowLeft/> Tất cả báo cáo</button>
  <div className="sp-head"><h3>{opt.title}</h3><button className="sp-open" aria-label="Mở báo cáo gốc" title="Mở báo cáo gốc" onClick={()=>openSource(opt.id)}><ArrowSquareOut/></button></div>
  <p className="sp-meta">{opt.meta}</p>{context}
  {opt.groups.map(g=><section key={g.label}><div className="sp-group">Vào “{g.label}”</div>{g.items.map(it=>{const done=added.includes(it.key);return <button key={it.key} className={'sp-line'+(done?' done':'')} disabled={done} onClick={()=>onAdd(opt.id,g.label,it.key,it.text)}><span>{it.text}</span>{done?<Check weight="bold"/>:<Plus weight="bold"/>}</button>})}</section>)}
 </div>;
 const shown=options.filter(o=>!q.trim()||(o.title+o.meta).toLowerCase().includes(q.toLowerCase()));
 return <div className="sp">
  <div className="sp-head"><h3>{title}</h3></div>{context}
  {options.length>5&&<div className="sp-search"><MagnifyingGlass/><input aria-label="Tìm báo cáo nguồn" placeholder="Tìm báo cáo…" value={q} onChange={e=>setQ(e.target.value)}/></div>}
  {shown.length?<div className="sp-list">{shown.map(o=>{const n=Math.ceil(left(o));return <button key={o.id} className={'sp-source'+(o.pinned?' pinned':'')} onClick={()=>setCur(o.id)}><span className="sp-source-text"><strong>{o.title}</strong><small>{o.meta}</small></span><span className="sp-count">{n>0?n+' ý':<Check/>}</span><CaretRight/></button>})}</div>:<p className="sp-empty">{options.length?'Không tìm thấy':empty}</p>}
 </div>;
}
