import React,{useEffect,useRef,useState} from 'react';
import {AutoTextarea} from './ui';

/**
 * Một lựa chọn trong menu "/". `group` là tiêu đề nhóm.
 * `insert` = lệnh editor: thay "/…" bằng đoạn chữ này (con trỏ đặt tại `caret`, mặc định cuối đoạn). Không có `insert` → gọi `onPick(id)`.
 */
export type SlashItem={id:string;label:string;hint?:string;group:string;icon?:React.ReactNode;insert?:string;caret?:number};
/** So khớp không dấu: "/igo", "/du an" đều tìm được. */
const norm=(s:string)=>s.normalize('NFD').replace(/\p{M}/gu,'').replace(/đ/gi,'d').toLowerCase();
const glyph=(s:string)=><span className="slash-glyph">{s}</span>;
/**
 * Lệnh editor có sẵn, giữ như editor iGoal (Style / Insert). Prototype dùng textarea nên định dạng là tiền tố kiểu markdown trên dòng;
 * bản thật dùng rich text editor, chỉ cần thêm nhóm "Báo cáo dự án" xuống dưới cùng menu.
 */
export const EDITOR_ITEMS:SlashItem[]=[
 {id:'text',label:'Text',group:'Style',icon:glyph('T'),insert:''},
 {id:'h1',label:'Heading 1',group:'Style',icon:glyph('H1'),insert:'# '},
 {id:'h2',label:'Heading 2',group:'Style',icon:glyph('H2'),insert:'## '},
 {id:'h3',label:'Heading 3',group:'Style',icon:glyph('H3'),insert:'### '},
 {id:'h4',label:'Heading 4',group:'Style',icon:glyph('H4'),insert:'#### '},
 {id:'bullet',label:'Bullet List',group:'Style',icon:glyph('•'),insert:'• '},
 {id:'numbered',label:'Numbered List',group:'Style',icon:glyph('1.'),insert:'1. '},
 {id:'todo',label:'To-do list',group:'Style',icon:glyph('☐'),insert:'☐ '},
 {id:'quote',label:'Blockquote',group:'Style',icon:glyph('❝'),insert:'> '},
 {id:'code',label:'Code Block',group:'Style',icon:glyph('</>'),insert:'```\n\n```',caret:4},
 {id:'divider',label:'Divider',group:'Insert',icon:glyph('—'),insert:'———\n'},
 {id:'table',label:'Table',group:'Insert',icon:glyph('▦'),insert:'| Cột 1 | Cột 2 |\n|---|---|\n|  |  |',caret:2},
];

type Props=Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>,'value'|'onChange'>&{value:string;onChange:(v:string)=>void;items:SlashItem[];onPick:(id:string)=>void;focusNow?:boolean};

/**
 * Textarea có lệnh "/" kiểu Notion: gõ "/" ở đầu dòng → menu gồm lệnh editor (Style, Insert) và các mục riêng của màn gọi
 * (vd. "Báo cáo dự án" ở dưới cùng). Gõ tiếp để lọc, ↑↓ chọn, Enter/Tab chèn, Esc đóng. Đoạn "/…" vừa gõ được thay / xóa khi chọn.
 * `focusNow` = đưa con trỏ vào cuối ô ngay khi render.
 */
export function SlashTextarea({value,onChange,items,onPick,focusNow,onKeyDown,...rest}:Props){
 const [menu,setMenu]=useState<{start:number;q:string}|null>(null),[active,setActive]=useState(0);
 const wrap=useRef<HTMLDivElement>(null);const area=()=>wrap.current?.querySelector('textarea');
 useEffect(()=>{if(!focusNow)return;const el=area();if(el){el.focus();el.setSelectionRange(el.value.length,el.value.length)}},[focusNow]);
 const all=[...EDITOR_ITEMS,...items];
 const list=menu?all.filter(x=>norm(x.label+' '+x.group).includes(norm(menu.q))):[];
 // "/" chỉ mở menu khi đứng đầu dòng và chưa có khoảng trắng phía sau, để gõ "15/09" hay "và/hoặc" không bị bật menu.
 const detect=(v:string,caret:number)=>{const line=v.slice(0,caret).split('\n').pop()!;const m=line.match(/^\/([^\s/]*)$/);return m?{start:caret-line.length,q:m[1]}:null};
 const pick=(x:SlashItem)=>{if(!menu)return;const before=value.slice(0,menu.start),after=value.slice(menu.start+1+menu.q.length);setMenu(null);
  if(x.insert!==undefined){const ins=x.insert;onChange(before+ins+after);const pos=before.length+(x.caret??ins.length);requestAnimationFrame(()=>{const el=area();if(el){el.focus();el.setSelectionRange(pos,pos)}});return}
  onChange((before+after).replace(/\n$/,''));onPick(x.id)};
 const groups=[...new Set(list.map(x=>x.group))];
 return <div className="slash-wrap" ref={wrap}>
  <AutoTextarea {...rest} value={value}
   onChange={e=>{onChange(e.target.value);const m=detect(e.target.value,e.target.selectionStart);setMenu(m);if(m?.q!==menu?.q)setActive(0)}}
   onBlur={()=>setMenu(null)}
   onKeyDown={e=>{if(menu&&list.length){if(e.key==='ArrowDown'){e.preventDefault();setActive((active+1)%list.length);return}if(e.key==='ArrowUp'){e.preventDefault();setActive((active-1+list.length)%list.length);return}if(e.key==='Enter'||e.key==='Tab'){e.preventDefault();pick(list[Math.min(active,list.length-1)]);return}}if(menu&&e.key==='Escape'){e.preventDefault();e.stopPropagation();setMenu(null);return}onKeyDown?.(e)}}/>
  {menu&&<div className="slash-menu" role="listbox" aria-label="Lệnh chèn">
   {list.length?groups.map(g=><div key={g} className="slash-group"><div className="rp-group">{g}</div>{list.filter(x=>x.group===g).map(x=>{const i=list.indexOf(x);
    return <button key={x.id} type="button" role="option" aria-selected={i===active} className={'slash-row'+(i===active?' on':'')} ref={el=>{if(i===active)el?.scrollIntoView({block:'nearest'})}} onMouseDown={e=>{e.preventDefault();pick(x)}} onMouseEnter={()=>setActive(i)}>{x.icon&&<span className="slash-icon">{x.icon}</span>}<span><strong>{x.label}</strong>{x.hint&&<small>{x.hint}</small>}</span></button>})}</div>)
   :<p className="rp-empty">Không có lựa chọn phù hợp</p>}
  </div>}
 </div>;
}
