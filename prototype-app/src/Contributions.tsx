import React,{useState,useEffect,useContext,useRef} from 'react';
import {Plus,CheckCircle,LinkSimple,FileText,Paperclip,X,Check,MagnifyingGlass,UploadSimple,PaperPlaneTilt} from 'phosphor-react';
import {Contribution,Evidence,Report,blankContribution,people,dateLabel} from './model';
import {useStore,ActiveRelatedContext} from './store';
import {Button,Badge,Relations,EntityRelationPicker,Empty,Modal,MetaRow,LeaveDialog} from './ui';
const ROLES=['Chủ trì','Đóng góp chính','Phối hợp','Hỗ trợ'];
const PEOPLE=['Lục','Nguyệt','Quỳnh','Quý'];
/** Thêm bằng chứng: chọn báo cáo từ danh sách có tìm kiếm (mới nhất trước), hoặc dán link / đính file. Một popover, không select lồng nhau. */
function EvidenceAdd({reports,onAdd,exclude}:{reports:Report[];onAdd:(e:Evidence)=>void;exclude:string[]}){
 const [open,setOpen]=useState(false),[mode,setMode]=useState<'Report'|'URL'|'File'>('Report'),[q,setQ]=useState(''),[url,setUrl]=useState(''),[err,setErr]=useState('');
 const list=reports.filter(r=>!exclude.includes(r.id)&&r.title.toLowerCase().includes(q.toLowerCase())).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,8);
 const done=(e:Evidence)=>{onAdd(e);setOpen(false);setQ('');setUrl('');setErr('')};
 return <div className="rp">{!open?<button className="rp-add" onClick={()=>setOpen(true)}><Plus size={14}/> Thêm bằng chứng</button>:<div className="ev-pop">
  <div className="segmented">{(['Report','URL','File'] as const).map(m=><button key={m} className={mode===m?'active':''} onClick={()=>setMode(m)}>{m==='Report'?'Báo cáo':m==='URL'?'Link':'File'}</button>)}</div>
  {mode==='Report'&&<><div className="rp-search"><MagnifyingGlass size={16}/><input autoFocus aria-label="Tìm báo cáo làm bằng chứng" placeholder="Tìm báo cáo…" value={q} onChange={e=>setQ(e.target.value)}/></div><div className="rp-list">{list.length?list.map(r=><button key={r.id} className="rp-row ev" onClick={()=>done({type:'Report',value:r.id,label:r.title})}><FileText/><span className="rp-name">{r.title}</span><small>{dateLabel(r.date)}</small></button>):<p className="rp-empty">Không tìm thấy</p>}</div></>}
  {mode==='URL'&&<div className="ev-url"><input autoFocus type="url" aria-label="Link bằng chứng" placeholder="https://… (Slack, Asana, Drive)" value={url} onChange={e=>{setUrl(e.target.value);setErr('')}}/><Button onClick={()=>/^https?:\/\//i.test(url)?done({type:'URL',value:url,label:url}):setErr('Link phải bắt đầu bằng https://')}>Thêm</Button>{err&&<p className="error">{err}</p>}</div>}
  {mode==='File'&&<label className="dropzone small"><UploadSimple size={20}/><strong>Chọn file</strong><input type="file" onChange={e=>{const n=e.target.files?.[0]?.name;if(n)done({type:'File',value:n,label:n})}}/></label>}
  <div className="ev-foot"><Button quiet onClick={()=>setOpen(false)}>Đóng</Button></div>
 </div>}</div>;
}
export function ContributionForm({initial,close,source,notify}:{initial:Contribution;close:()=>void;source:(id:string)=>void;notify:(s:string)=>void}){
 const {data,saveContribution}=useStore();const [c,setC]=useState(initial),[errors,setErrors]=useState<{title?:string;impact?:string}>({}),[leaving,setLeaving]=useState(false);
 const titleRef=useRef<HTMLTextAreaElement>(null),impactRef=useRef<HTMLTextAreaElement>(null);
 // Sửa ô nào thì xóa lỗi của ô đó.
 const patch=(p:Partial<Contribution>)=>{setC({...c,...p});setErrors(e=>({title:'title' in p?undefined:e.title,impact:'impact' in p?undefined:e.impact}))};
 const dirty=JSON.stringify(c)!==JSON.stringify(initial);
 // Lưu nháp giữ nguyên confirmationStatus và note (không mất yêu cầu bổ sung của người xác nhận). Chỉ khi Gửi xác nhận mới reset về PENDING.
 // Gửi thiếu ô bắt buộc: báo lỗi ngay dưới ô đó và đưa con trỏ vào ô lỗi đầu tiên.
 const save=(draft:boolean)=>{if(!draft){const e={title:c.title.trim()?undefined:'Mô tả ngắn bạn đã đóng góp gì.',impact:c.impact.trim()?undefined:'Nêu kết quả hoặc thay đổi nhờ đóng góp này.'};if(e.title||e.impact){setErrors(e);(e.title?titleRef:impactRef).current?.focus();return}}saveContribution(draft?{...c,recordStatus:'DRAFT'}:{...c,recordStatus:'SUBMITTED',confirmationStatus:'PENDING',note:''});notify(draft?'Đã lưu nháp':'Đã gửi cho '+people.find(p=>p.id===c.confirmerId)?.name);close()};
 const tryClose=()=>dirty?setLeaving(true):close();
 // Liên kết gợi ý: mục tiêu của các báo cáo đã đính làm bằng chứng.
 const relSuggest=[...new Set(c.evidence.filter(e=>e.type==='Report').flatMap(e=>data.reports.find(r=>r.id===e.value)?.relations??[]))];
 return <><Modal wide title={initial.title?'Ghi nhận đóng góp':'Ghi nhận đóng góp mới'} close={tryClose} footer={<><Button onClick={()=>save(true)}>Lưu nháp</Button><Button primary onClick={()=>save(false)}><PaperPlaneTilt/> Gửi xác nhận</Button></>}>
  {c.confirmationStatus==='NEED_MORE_INFO'&&<div className="notice warning">Cần bổ sung: {c.note}</div>}
  <label className={'field'+(errors.title?' invalid':'')}><span>Tôi đã đóng góp gì? <em>*</em></span><textarea ref={titleRef} rows={2} value={c.title} aria-required="true" aria-invalid={!!errors.title} aria-describedby={errors.title?'cf-title-err':undefined} placeholder="Ví dụ: Làm rõ luồng báo cáo tuần với Game/App" onChange={e=>patch({title:e.target.value})}/>{errors.title&&<p id="cf-title-err" role="alert" className="field-error">{errors.title}</p>}</label>
  <label className={'field'+(errors.impact?' invalid':'')}><span>Kết quả / ảnh hưởng <em>*</em></span><textarea ref={impactRef} rows={2} value={c.impact} aria-required="true" aria-invalid={!!errors.impact} aria-describedby={errors.impact?'cf-impact-err':undefined} placeholder="Thay đổi gì nhờ đóng góp này?" onChange={e=>patch({impact:e.target.value})}/>{errors.impact&&<p id="cf-impact-err" role="alert" className="field-error">{errors.impact}</p>}</label>
  <MetaRow label="Vai trò"><div className="segmented">{ROLES.map(x=><button key={x} className={c.role===x?'active':''} onClick={()=>patch({role:x})}>{x}</button>)}</div></MetaRow>
  <MetaRow label="Bằng chứng"><div className="rp-chips">{c.evidence.map((e,i)=><span className="rp-chip" key={i} title={e.label}>{e.type==='Report'?<FileText size={13}/>:e.type==='URL'?<LinkSimple size={13}/>:<Paperclip size={13}/>}<span>{e.type==='Report'?<button className="chip-link" onClick={()=>source(e.value)}>{e.label}</button>:e.label}</span><button aria-label="Gỡ bằng chứng" onClick={()=>patch({evidence:c.evidence.filter((_,j)=>j!==i)})}><X size={12}/></button></span>)}<EvidenceAdd reports={data.reports.filter(r=>r.status==='PUBLISHED')} exclude={c.evidence.map(e=>e.value)} onAdd={e=>patch({evidence:[...c.evidence,e]})}/></div></MetaRow>
  <MetaRow label="Liên kết"><EntityRelationPicker value={c.relations} onChange={v=>patch({relations:v})} suggestions={relSuggest}/></MetaRow>
  <MetaRow label="Người phối hợp"><div className="rp-chips">{PEOPLE.map(p=>{const on=c.collaborators.includes(p);return <button key={p} className={'person-chip'+(on?' on':'')} aria-pressed={on} onClick={()=>patch({collaborators:on?c.collaborators.filter(x=>x!==p):[...c.collaborators,p]})}>{on&&<Check size={12}/>}{p}</button>})}</div></MetaRow>
  <MetaRow label="Người xác nhận"><select className="meta-input" value={c.confirmerId} onChange={e=>patch({confirmerId:e.target.value})}>{people.filter(p=>p.canConfirm).map(p=><option key={p.id} value={p.id}>{p.name} · {p.role}</option>)}</select></MetaRow>
 </Modal>{leaving&&<LeaveDialog form stay={()=>setLeaving(false)} discard={close} save={()=>save(true)}/>}</>;
}
/** Bộ lọc = các ô số liệu trên cùng (bấm để lọc). "Bản nháp" chỉ có với người viết. */
const FILTERS:{k:string;l:string;test:(c:Contribution)=>boolean;writerOnly?:boolean}[]=[
 {k:'all',l:'Tất cả',test:()=>true},
 {k:'pending',l:'Chờ xác nhận',test:c=>c.recordStatus==='SUBMITTED'&&c.confirmationStatus==='PENDING'},
 {k:'more',l:'Cần bổ sung',test:c=>c.confirmationStatus==='NEED_MORE_INFO'},
 {k:'ok',l:'Đã xác nhận',test:c=>c.confirmationStatus==='CONFIRMED'},
 {k:'draft',l:'Bản nháp',test:c=>c.recordStatus==='DRAFT',writerOnly:true},
];
/**
 * Contribution Log: ô số liệu (bấm để lọc) · danh sách / dòng thời gian 2 dòng · chi tiết ở panel phải (không drawer).
 * Người viết: xem và "Bổ sung / Tiếp tục soạn" trong panel. Người xác nhận: ghi chú + Yêu cầu bổ sung / Xác nhận ngay trong panel.
 * Phạm vi: người xác nhận chỉ thấy bản ĐÃ GỬI giao cho mình; người viết chỉ thấy đóng góp của mình.
 */
export function ContributionList({user,edit,source}:{user:string;edit:(c:Contribution)=>void;source:(id:string)=>void}){
 const {data,saveContribution}=useStore();const me=people.find(p=>p.id===user);const confirmer=!!me?.canConfirm;
 const [filter,setFilter]=useState('all'),[selectedId,setSelectedId]=useState<string|null>(null),[note,setNote]=useState(''),[error,setError]=useState(''),[view,setView]=useState<'list'|'timeline'>('list');
 // Mở Lịch sử mục tiêu (panel trang) thì đóng panel chi tiết để không có 2 panel cùng lúc.
 const activeGoal=useContext(ActiveRelatedContext);useEffect(()=>{if(activeGoal)setSelectedId(null)},[activeGoal]);
 const scoped=data.contributions.filter(c=>confirmer?c.confirmerId===user&&c.recordStatus==='SUBMITTED':c.owner===me?.name);
 const filters=FILTERS.filter(f=>!f.writerOnly||!confirmer);
 const items=scoped.filter(filters.find(f=>f.k===filter)?.test??(()=>true)).sort((a,b)=>b.date.localeCompare(a.date));
 const selected=data.contributions.find(c=>c.id===selectedId);
 const openDetail=(c:Contribution)=>{setSelectedId(c.id===selectedId?null:c.id);setNote(c.note);setError('')};
 const resolve=(state:Contribution['confirmationStatus'])=>{if(!selected)return;if(state==='NEED_MORE_INFO'&&!note.trim()){setError('Ghi rõ cần bổ sung gì.');return}saveContribution({...selected,confirmationStatus:state,note})};
 const months=Array.from(new Set(scoped.map(c=>c.date.slice(0,7)))).sort();
 const Row=({c}:{c:Contribution})=><button className={'tl-row'+(selectedId===c.id?' selected':'')} onClick={()=>openDetail(c)} title={c.impact}><span className="tl-date">{c.date.slice(8,10)}/{c.date.slice(5,7)}</span><CheckCircle className="tl-icon"/><span className="tl-main"><strong>{c.title||'Chưa đặt tên'}</strong><small>{confirmer&&<>{c.owner}<i>·</i></>}{c.role}<i>·</i>{c.evidence.length} bằng chứng{c.relations.length>0&&<><i>·</i><Relations compact ids={c.relations}/></>}</small></span><ContributionBadge c={c}/></button>;
 const canFix=!!selected&&!confirmer&&(selected.recordStatus==='DRAFT'||selected.confirmationStatus==='NEED_MORE_INFO');
 const canReview=!!selected&&confirmer&&selected.recordStatus==='SUBMITTED'&&selected.confirmationStatus!=='CONFIRMED';

 return <>
  <div className="subnav-row"><h2>{confirmer?'Xác nhận đóng góp':'Contribution Log'}</h2>{!confirmer&&<Button primary onClick={()=>edit(blankContribution())}><Plus/> Ghi nhận đóng góp</Button>}</div>
  <div className="stat-filter">{filters.map(f=><button key={f.k} className={filter===f.k?'active':''} aria-pressed={filter===f.k} onClick={()=>setFilter(f.k)}><span><i className={'stat-dot '+f.k} aria-hidden="true"/>{f.l}</span><strong>{scoped.filter(f.test).length}</strong></button>)}</div>
  <div className={'cl-split'+(selected?' open':'')}>
   <div className="cl-main">
    <div className="subnav-row"><div className="inner-tabs">{([['list','Danh sách'],['timeline','Theo tháng']] as const).map(([k,l])=><button key={k} className={view===k?'active':''} onClick={()=>setView(k)}>{l}</button>)}</div></div>
    {view==='timeline'&&<section className="surface chart-card"><div className="bar-chart">{months.map(m=>{const inM=scoped.filter(c=>c.date.startsWith(m));const ok=inM.filter(c=>c.confirmationStatus==='CONFIRMED').length;const max=Math.max(1,...months.map(x=>scoped.filter(c=>c.date.startsWith(x)).length));return <div className="bar-col" key={m}><div className="bar" style={{height:`${inM.length/max*100}%`}}><span className="confirmed" style={{height:`${inM.length?ok/inM.length*100:0}%`}}/></div><small>{m.slice(5)}/{m.slice(2,4)}</small><strong>{inM.length}</strong></div>})}</div><p className="hint"><i className="swatch confirmed"/> Đã xác nhận <i className="swatch pending"/> Chưa xác nhận</p></section>}
    <div className="tl-list surface">{items.length?items.map(c=><Row key={c.id} c={c}/>):<Empty title="Không có đóng góp" text={filter==='all'?'Đóng góp bạn ghi nhận sẽ hiện ở đây.':'Không có đóng góp ở trạng thái này.'}/>}</div>
    <p className="hint footer-note">Xác nhận là công nhận bằng chứng hợp lệ, không phải điểm đánh giá.</p>
   </div>
   {selected&&<aside className="cl-panel">
    <div className="gh-head"><div><small>{selected.owner} · {selected.role} · {dateLabel(selected.date)}</small><h3>{selected.title||'Chưa đặt tên'}</h3></div><button className="icon-x" aria-label="Đóng" onClick={()=>setSelectedId(null)}><X/></button></div>
    <ContributionBadge c={selected}/>
    {selected.note&&selected.confirmationStatus==='NEED_MORE_INFO'&&<div className="notice warning">{selected.note}</div>}
    <div className="cl-block"><label>Kết quả / ảnh hưởng</label><p className="preserve">{selected.impact||'—'}</p></div>
    <div className="cl-block"><label>Bằng chứng</label>{selected.evidence.length?<div className="rp-chips readonly">{selected.evidence.map((e,i)=>e.type==='Report'?<button key={i} className="rp-chip link" onClick={()=>source(e.value)} title={e.label}><FileText size={13}/><span>{e.label}</span></button>:e.type==='URL'?<a key={i} className="rp-chip link" href={e.value} target="_blank" rel="noreferrer" title={e.label}><LinkSimple size={13}/><span>{e.label}</span></a>:<span key={i} className="rp-chip" title={e.label}><Paperclip size={13}/><span>{e.label}</span></span>)}</div>:<p className="hint">Chưa có bằng chứng.</p>}</div>
    {selected.relations.length>0&&<div className="cl-block"><label>Liên kết</label><Relations ids={selected.relations} max={6}/></div>}
    <div className="cl-block"><label>Người phối hợp</label><p>{selected.collaborators.join(', ')||'—'}</p></div>
    <div className="cl-block"><label>Người xác nhận</label><p>{people.find(p=>p.id===selected.confirmerId)?.name}</p></div>
    {canFix&&<div className="cl-actions"><Button primary onClick={()=>edit(selected)}>{selected.recordStatus==='DRAFT'?'Tiếp tục soạn':'Bổ sung & gửi lại'}</Button></div>}
    {canReview&&<div className="cl-review"><label className="field">Ghi chú cho người gửi<textarea rows={3} value={note} placeholder="Cần bổ sung gì? (bắt buộc khi yêu cầu bổ sung)" onChange={e=>{setNote(e.target.value);setError('')}}/></label>{error&&<p role="alert" className="error">{error}</p>}<div className="cl-actions"><Button onClick={()=>resolve('NEED_MORE_INFO')}>Yêu cầu bổ sung</Button><Button primary onClick={()=>resolve('CONFIRMED')}><Check/> Xác nhận</Button></div></div>}
    {selected.confirmationStatus==='CONFIRMED'&&selected.note&&<div className="notice">{selected.note}</div>}
   </aside>}
  </div>
 </>;
}
export function ContributionBadge({c}:{c:Contribution}){return <Badge tone={c.recordStatus==='DRAFT'?'neutral':c.confirmationStatus==='CONFIRMED'?'success':'warning'}>{c.recordStatus==='DRAFT'?'Bản nháp':c.confirmationStatus==='CONFIRMED'?'Đã xác nhận':c.confirmationStatus==='NEED_MORE_INFO'?'Cần bổ sung':'Chờ xác nhận'}</Badge>}
