import React,{useContext,useState} from 'react';
import {Plus,ChatsCircle,Funnel,CalendarBlank,Clock,Flag,FileText,CheckCircle,MagnifyingGlass,CaretRight,PencilSimple} from 'phosphor-react';
import {Report,Relation,kindLabel,dateLabel,relativeDate,weekGroup,entities,entityCode,entityText} from './model';
import {useStore,RelatedContext,ActiveRelatedContext} from './store';
import {accessOf} from './sharing';
import {relatedCount} from './Related';
import {Button,Badge,Empty,Relations,ProgressBar,onActivate} from './ui';


/** Card mục tiêu (OKR dự án hoặc EKS cá nhân): mục tiêu + KR/KS con, tiến độ, nút Cập nhật tiến độ / Tạo mới (mock, không mutation). */
export function OkrCard({title,objectives,children,onCheckin}:{title:string;objectives:Relation[];children:(o:Relation)=>Relation[];onCheckin?:()=>void}){
 const [expanded,setExpanded]=useState(false);const shown=expanded?objectives:objectives.slice(0,2);
 const {data}=useStore();const openRelated=useContext(RelatedContext);const activeId=useContext(ActiveRelatedContext);
 // Mỗi dòng bấm được để mở drawer "Liên quan": báo cáo & đóng góp đã tag entity này (Relation layer).
 // Số liên kết chỉ hiện khi > 0, dạng icon + số rất nhỏ để không cạnh tranh với tên mục tiêu và tiến độ.
 const Row=({e,index,cls}:{e:Relation;index:number;cls:string})=>{const n=relatedCount(data,e.id);const has=n.reports+n.contributions>0;return <div className={'okr-row '+cls+(openRelated?' clickable':'')+(activeId===e.id?' selected':'')} role={openRelated?'button':undefined} tabIndex={openRelated?0:undefined} title={openRelated?'Xem báo cáo & đóng góp liên quan':undefined} onClick={()=>openRelated?.(e.id)} onKeyDown={openRelated?onActivate(()=>openRelated(e.id)):undefined}><span className={'okr-code '+(e.type==='Objective'||e.type==='EKS'?'circle':'')}>{entityCode(e,index)}</span><span className="okr-text">{entityText(e)}</span><span className="okr-links" aria-label={`${n.reports} báo cáo, ${n.contributions} đóng góp`}>{has&&<>{n.reports>0&&<span><FileText/>{n.reports}</span>}{n.contributions>0&&<span><CheckCircle/>{n.contributions}</span>}</>}</span><ProgressBar value={e.progress??0}/></div>};
 return <section className="surface okr-card"><header className="card-head"><h3>{title}</h3><div className="head-actions"><Button onClick={onCheckin} disabled={!onCheckin}>Cập nhật tiến độ</Button><Button disabled title="Ngoài phạm vi prototype">Tạo mới</Button></div></header>
  {objectives.length?shown.map((o,i)=><React.Fragment key={o.id}><Row e={o} index={i} cls="objective"/>{children(o).map((k,j)=><Row key={k.id} e={k} index={j} cls="child"/>)}</React.Fragment>):<Empty title="Chưa có mục tiêu" text="Các mục tiêu được tạo sẽ xuất hiện tại đây."/>}
  {objectives.length>2&&<button className="okr-more" onClick={()=>setExpanded(!expanded)}>{expanded?'Thu gọn':'Xem thêm'}</button>}
 </section>;
}

export const KIND_ICON={weekly:CalendarBlank,instant:Clock,meeting:ChatsCircle,checkin:Flag} as const;

/**
 * "Tổng hợp báo cáo": danh sách kiểu list (bộ lọc luôn hiện, tìm kiếm, badge Nháp / Đã gửi rõ ràng).
 * Bấm dòng: nháp → tiếp tục soạn, đã gửi → mở toàn trang. Nút Lọc mở thêm bộ lọc "Liên quan".
 * `views` cho phép gắn thêm chế độ xem (vd. Nhật ký dự án) mà không đổi cấu trúc card. `context` là dự án đang mở, ẩn chip trùng.
 */
export function ReportHub({reports,create,edit,open,views=[],context}:{reports:Report[];create:()=>void;edit:(r:Report)=>void;open:(r:Report)=>void;source?:(id:string)=>void;views?:{key:string;label:string;render:()=>React.ReactNode}[];context?:string}){
 const [view,setView]=useState('reports'),[filterOpen,setFilterOpen]=useState(false),[status,setStatus]=useState('all'),[kind,setKind]=useState('all'),[project,setProject]=useState('all'),[q,setQ]=useState('');
 // Bộ lọc ẩn sau nút "Lọc": Trạng thái · Loại báo cáo · Dự án (Dự án chỉ khi không ở trong một dự án cụ thể). Số filter đang bật hiện trên nút.
 const projectOptions=entities.filter(e=>e.type==='Project'&&reports.some(r=>r.relations.includes(e.id)));
 const activeCount=[status,kind,project].filter(v=>v!=='all').length;
 const clearFilters=()=>{setStatus('all');setKind('all');setProject('all')};
 const list=reports.filter(r=>(status==='all'||(status==='draft'?r.status==='DRAFT':r.status==='PUBLISHED'))&&(kind==='all'||r.kind===kind)&&(project==='all'||r.relations.includes(project))&&r.title.toLowerCase().includes(q.toLowerCase())).sort((a,b)=>b.date.localeCompare(a.date));
 const active=views.find(v=>v.key===view);
 // Chia nhóm theo tuần để quét nhanh: báo cáo tuần này nằm trên cùng, cũ hơn gom vào 'Trước đó'.
 const groups=[...list.reduce((m,r)=>{const g=weekGroup(r.date);m.set(g,[...(m.get(g)??[]),r]);return m},new Map<string,Report[]>())];
 const {data,user}=useStore();
 // Chỉ người viết mới soạn tiếp bản nháp; người có quyền xem luôn mở chi tiết (chỉ xem + bình luận).
 const openRow=(r:Report)=>r.status==='DRAFT'&&accessOf(data,r,user).level==='owner'?edit(r):open(r);
 return <section className="surface report-hub"><header className="card-head"><div className="row"><h3>Tổng hợp báo cáo</h3>{views.length>0&&<div className="inner-tabs compact"><button className={view==='reports'?'active':''} onClick={()=>setView('reports')}>Báo cáo</button>{views.map(v=><button key={v.key} className={view===v.key?'active':''} onClick={()=>setView(v.key)}>{v.label}</button>)}</div>}</div><div className="head-actions">{view==='reports'&&<Button onClick={()=>setFilterOpen(!filterOpen)} className={filterOpen||activeCount?'active-filter':''}><Funnel/> Lọc{activeCount>0&&<span className="count-pill neutral">{activeCount}</span>}</Button>}<Button primary onClick={create}><Plus/> Tạo báo cáo mới</Button></div></header>
  {active?<div className="hub-view">{active.render()}</div>:<>
  <div className="list-toolbar">{filterOpen?<div className="hub-selects"><label>Trạng thái<select value={status} onChange={e=>setStatus(e.target.value)}><option value="all">Tất cả</option><option value="draft">Bản nháp</option><option value="published">Đã gửi</option></select></label><label>Loại báo cáo<select value={kind} onChange={e=>setKind(e.target.value)}><option value="all">Tất cả</option>{(Object.keys(kindLabel) as Report['kind'][]).map(k=><option key={k} value={k}>{kindLabel[k]}</option>)}</select></label>{!context&&<label>Dự án<select value={project} onChange={e=>setProject(e.target.value)}><option value="all">Tất cả</option>{projectOptions.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select></label>}{activeCount>0&&<button className="text-button" onClick={clearFilters}>Xóa lọc</button>}</div>:<span className="hint">{list.length} báo cáo{activeCount>0&&' · đang lọc'}</span>}<div className="search-input compact"><MagnifyingGlass/><input aria-label="Tìm báo cáo" placeholder="Tìm báo cáo…" value={q} onChange={e=>setQ(e.target.value)}/></div></div>
  {list.length?groups.map(([g,items])=><div className="rh-group" key={g} role="group" aria-label={g}><div className="rh-group-head"><span>{g}</span><small>{items.length}</small></div>{items.map(r=>{const Icon=KIND_ICON[r.kind];const excerpt=r.sections.find(s=>s.text)?.text.split(String.fromCharCode(10))[0];const draft=r.status==="DRAFT";return <article className={"report-row slim"+(draft?" is-draft":"")} key={r.id} role="button" tabIndex={0} title={excerpt} onClick={()=>openRow(r)} onKeyDown={onActivate(()=>openRow(r))}><div className={"record-icon "+r.kind}><Icon size={20}/></div><div className="record-content"><div className="row"><span className="record-title">{r.title||"Báo cáo chưa đặt tên"}</span>{draft&&<Badge>Bản nháp</Badge>}{r.slack==="FAILED"&&<Badge tone="warning">Slack chưa gửi</Badge>}</div><div className="record-meta">{r.owner}<i>·</i><time dateTime={r.date} title={dateLabel(r.date)}>{relativeDate(r.date)}</time><i>·</i>{kindLabel[r.kind]}{r.track&&<><i>·</i>{r.track}</>}{r.relations.some(id=>id!==context)&&<><i>·</i><Relations compact ids={r.relations} hide={context?[context]:[]}/></>}</div></div><span className="row-go" aria-hidden="true">{draft?<><PencilSimple/>Tiếp tục soạn</>:<>Xem<CaretRight/></>}</span></article>})}</div>):<Empty title="Chưa có báo cáo phù hợp" text="Tạo báo cáo mới hoặc đổi bộ lọc."><Button onClick={create}><Plus/> Tạo báo cáo mới</Button></Empty>}</>}
 </section>;
}
