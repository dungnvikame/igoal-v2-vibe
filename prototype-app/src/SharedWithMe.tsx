import React,{useState} from 'react';
import {Funnel,MagnifyingGlass,CaretRight,ChatCircle,Paperclip,ShareNetwork} from 'phosphor-react';
import {Report,kindLabel,projects,dateLabel,relativeDate,weekGroup,daysAgo} from './model';
import {useStore} from './store';
import {sharedWithMe,teamLabel,shortName,SharedItem} from './sharing';
import {KIND_ICON} from './ReportHub';
import {Button,Badge,Empty,onActivate} from './ui';

type Via='all'|'direct'|'team';
const VIA_LABEL:Record<Via,string>={all:'Tất cả',direct:'Trực tiếp',team:'Qua team'};

/**
 * Màn "Được chia sẻ với tôi": báo cáo người khác chia sẻ trực tiếp cho user hoặc cho team hiện tại của user (không gồm quyền từ entity).
 * Lọc nhanh Nguồn chia sẻ (Tất cả / Trực tiếp / Qua team); nút Lọc mở Loại báo cáo · Người chia sẻ · Dự án · Thời gian chia sẻ; sắp xếp theo ngày chia sẻ hoặc ngày báo cáo.
 * Bấm dòng mở chi tiết báo cáo ở chế độ Người xem (xem + bình luận, không sửa).
 */
export function SharedWithMe({open}:{open:(r:Report)=>void}){
 const {data,user}=useStore();const all=sharedWithMe(data,user);
 const [q,setQ]=useState(''),[filterOpen,setFilterOpen]=useState(false),[via,setVia]=useState<Via>('all'),[kind,setKind]=useState('all'),[by,setBy]=useState('all'),[project,setProject]=useState('all'),[period,setPeriod]=useState('all'),[sort,setSort]=useState<'shared'|'report'>('shared');
 const sharers=[...new Map(all.flatMap(i=>i.by).map(u=>[u.id,u])).values()];
 const projectOptions=projects.filter(p=>all.some(i=>i.report.relations.includes(p.id)));
 const activeCount=[kind,by,project,period].filter(v=>v!=='all').length;
 const clear=()=>{setKind('all');setBy('all');setProject('all');setPeriod('all')};
 const matchVia=(i:SharedItem,v:Via)=>v==='all'||(v==='direct'?i.direct:!!i.viaTeam);
 const term=q.trim().toLowerCase();
 const list=all.filter(i=>matchVia(i,via)&&(kind==='all'||i.report.kind===kind)&&(by==='all'||i.by.some(u=>u.id===by))&&(project==='all'||i.report.relations.includes(project))&&(period==='all'||daysAgo(i.at)<=Number(period))&&(i.report.title+' '+i.report.owner).toLowerCase().includes(term))
  .sort((a,b)=>sort==='shared'?b.at.localeCompare(a.at):b.report.date.localeCompare(a.report.date));
 const dateOf=(i:SharedItem)=>sort==='shared'?i.at:i.report.date;
 const groups=[...list.reduce((m,i)=>{const g=weekGroup(dateOf(i));m.set(g,[...(m.get(g)??[]),i]);return m},new Map<string,SharedItem[]>())];

 return <section className="surface report-hub shared-hub">
  <header className="card-head"><div className="row"><h3>Được chia sẻ với tôi</h3><div className="inner-tabs compact" role="tablist" aria-label="Nguồn chia sẻ">{(Object.keys(VIA_LABEL) as Via[]).map(v=><button key={v} role="tab" aria-selected={via===v} className={via===v?'active':''} onClick={()=>setVia(v)}>{VIA_LABEL[v]} <span className="count-pill neutral">{all.filter(i=>matchVia(i,v)).length}</span></button>)}</div></div>
   <div className="head-actions"><label className="sw-sort">Sắp xếp<select className="meta-input" value={sort} onChange={e=>setSort(e.target.value as 'shared'|'report')}><option value="shared">Ngày chia sẻ</option><option value="report">Ngày báo cáo</option></select></label><Button onClick={()=>setFilterOpen(!filterOpen)} className={filterOpen||activeCount?'active-filter':''}><Funnel/> Lọc{activeCount>0&&<span className="count-pill neutral">{activeCount}</span>}</Button></div></header>
  <div className="list-toolbar">{filterOpen?<div className="hub-selects">
    <label>Loại báo cáo<select value={kind} onChange={e=>setKind(e.target.value)}><option value="all">Tất cả</option>{(Object.keys(kindLabel) as Report['kind'][]).map(k=><option key={k} value={k}>{kindLabel[k]}</option>)}</select></label>
    <label>Người chia sẻ<select value={by} onChange={e=>setBy(e.target.value)}><option value="all">Tất cả</option>{sharers.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
    <label>Dự án<select value={project} onChange={e=>setProject(e.target.value)}><option value="all">Tất cả</option>{projectOptions.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
    <label>Thời gian chia sẻ<select value={period} onChange={e=>setPeriod(e.target.value)}><option value="all">Tất cả</option><option value="7">7 ngày qua</option><option value="30">30 ngày qua</option></select></label>
    {activeCount>0&&<button className="text-button" onClick={clear}>Xóa lọc</button>}</div>
   :<span className="hint">{list.length} báo cáo{(activeCount>0||via!=='all')&&' · đang lọc'}</span>}
   <div className="search-input compact"><MagnifyingGlass/><input aria-label="Tìm báo cáo được chia sẻ" placeholder="Tìm theo tên, người viết…" value={q} onChange={e=>setQ(e.target.value)}/></div></div>
  {!all.length?<Empty title="Chưa có báo cáo nào được chia sẻ với bạn" text="Báo cáo người khác chia sẻ cho bạn hoặc team của bạn sẽ xuất hiện ở đây."/>
   :list.length?groups.map(([g,items])=><div className="rh-group" key={g} role="group" aria-label={g}><div className="rh-group-head"><span>{g}</span><small>{items.length}</small></div>{items.map(i=>{const r=i.report;const Icon=KIND_ICON[r.kind];const p=projects.find(x=>r.relations.includes(x.id));const comments=data.comments.filter(c=>c.reportId===r.id).length;
    return <article className="report-row slim" key={r.id} role="button" tabIndex={0} onClick={()=>open(r)} onKeyDown={onActivate(()=>open(r))}>
     <div className={'record-icon '+r.kind}><Icon size={20}/></div>
     <div className="record-content"><div className="row"><span className="record-title">{r.title}</span>{i.viaTeam&&<Badge>Qua team {teamLabel(i.viaTeam)}</Badge>}</div>
      <div className="record-meta">{r.owner}<i>·</i><span className="sw-by"><ShareNetwork size={12}/>{i.by.map(u=>shortName(u.name)).join(', ')} chia sẻ <time dateTime={i.at} title={dateLabel(i.at)}>{relativeDate(i.at).toLowerCase()}</time></span><i>·</i>{kindLabel[r.kind]}{p&&<><i>·</i>{p.label}</>}{!!r.attachments?.length&&<><i>·</i><span className="sw-by" title="Tệp đính kèm"><Paperclip size={12}/>{r.attachments.length}</span></>}</div></div>
     {comments>0&&<span className="sw-comments" title={comments+' bình luận'}><ChatCircle/>{comments}</span>}
     <span className="row-go" aria-hidden="true">Xem<CaretRight/></span></article>})}</div>)
   :<Empty title="Không có báo cáo phù hợp" text="Thử đổi từ khóa hoặc bộ lọc."><Button onClick={()=>{clear();setVia('all');setQ('')}}>Xóa lọc</Button></Empty>}
 </section>;
}
