import React,{useEffect,useRef,useState} from 'react';
import {AutoTextarea} from './ui';

/** Một lựa chọn trong menu "/". `group` là tiêu đề nhóm (vd. "Báo cáo dự án"). */
export type SlashItem={id:string;label:string;hint?:string;group:string;icon?:React.ReactNode};
/** So khớp không dấu: "/igo", "/du an" đều tìm được. */
const norm=(s:string)=>s.normalize('NFD').replace(/\p{M}/gu,'').replace(/đ/gi,'d').toLowerCase();

type Props=Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>,'value'|'onChange'>&{value:string;onChange:(v:string)=>void;items:SlashItem[];onPick:(id:string)=>void;focusNow?:boolean};

/**
 * Textarea có lệnh "/" kiểu Notion: gõ "/" ở đầu dòng → menu chèn khung (báo cáo chung / báo cáo dự án), gõ tiếp để lọc,
 * ↑↓ chọn, Enter/Tab chèn, Esc đóng. Khi chèn, đoạn "/…" vừa gõ được xóa khỏi nội dung.
 * `focusNow` = đưa con trỏ vào cuối ô ngay khi render (dùng khi vừa tạo khung mới).
 */
export function SlashTextarea({value,onChange,items,onPick,focusNow,onKeyDown,...rest}:Props){
 const [menu,setMenu]=useState<{start:number;q:string}|null>(null),[active,setActive]=useState(0);
 const wrap=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(!focusNow)return;const el=wrap.current?.querySelector('textarea');if(el){el.focus();el.setSelectionRange(el.value.length,el.value.length)}},[focusNow]);
 const list=menu?items.filter(x=>norm(x.label+' '+x.group).includes(norm(menu.q))):[];
 // "/" chỉ mở menu khi đứng đầu dòng và chưa có khoảng trắng phía sau, để gõ "15/09" hay "và/hoặc" không bị bật menu.
 const detect=(v:string,caret:number)=>{const line=v.slice(0,caret).split('\n').pop()!;const m=line.match(/^\/([^\s/]*)$/);return m?{start:caret-line.length,q:m[1]}:null};
 const pick=(x:SlashItem)=>{if(!menu)return;const before=value.slice(0,menu.start),after=value.slice(menu.start+1+menu.q.length);onChange((before+after).replace(/\n$/,''));setMenu(null);onPick(x.id)};
 const groups=[...new Set(list.map(x=>x.group))];
 return <div className="slash-wrap" ref={wrap}>
  <AutoTextarea {...rest} value={value}
   onChange={e=>{onChange(e.target.value);const m=detect(e.target.value,e.target.selectionStart);setMenu(m);if(m?.q!==menu?.q)setActive(0)}}
   onBlur={()=>setMenu(null)}
   onKeyDown={e=>{if(menu&&list.length){if(e.key==='ArrowDown'){e.preventDefault();setActive((active+1)%list.length);return}if(e.key==='ArrowUp'){e.preventDefault();setActive((active-1+list.length)%list.length);return}if(e.key==='Enter'||e.key==='Tab'){e.preventDefault();pick(list[Math.min(active,list.length-1)]);return}}if(menu&&e.key==='Escape'){e.preventDefault();e.stopPropagation();setMenu(null);return}onKeyDown?.(e)}}/>
  {menu&&<div className="slash-menu" role="listbox" aria-label="Chèn khung báo cáo">
   {list.length?groups.map(g=><div key={g}><div className="rp-group">{g}</div>{list.filter(x=>x.group===g).map(x=>{const i=list.indexOf(x);
    return <button key={x.id} type="button" role="option" aria-selected={i===active} className={'slash-row'+(i===active?' on':'')} onMouseDown={e=>{e.preventDefault();pick(x)}} onMouseEnter={()=>setActive(i)}>{x.icon&&<span className="slash-icon">{x.icon}</span>}<span><strong>{x.label}</strong>{x.hint&&<small>{x.hint}</small>}</span></button>})}</div>)
   :<p className="rp-empty">Không có lựa chọn phù hợp</p>}
  </div>}
 </div>;
}
