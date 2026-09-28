import React,{useState} from 'react';
import {FileText,Sparkle,Target,MagnifyingGlass,CaretDown,CaretRight,ChatsCircle,Lightbulb,Flag,CheckCircle,Plus} from 'phosphor-react';
import {Report,Contribution,blankContribution,blankReport,kindLabel,section,entities,projects,projectMeta,projectCadence,dateLabel,relativeDate,daysAgo,today,tracks,Track} from './model';
import {useStore} from './store';
import {canView} from './sharing';
import {Button,Badge,Relations,Empty,Modal,AIBox,ProgressBar} from './ui';
import {OkrCard,ReportHub} from './ReportHub';
import {ProjectForm,ProjectStrip,ProjectSettings} from './ProjectForm';

/** Trang danh sách Dự án bám iGoal thật: tìm kiếm, lọc Đơn vị/Team, grid card dự án. Bấm card mới vào chi tiết. */
export function ProjectList({open,notify}:{open:(id:string)=>void;notify:(s:string)=>void}){
 const {data}=useStore();
 const [q,setQ]=useState(''),[unit,setUnit]=useState('all'),[team,setTeam]=useState('all'),[creating,setCreating]=useState(false);
 const units=[...new Set(Object.values(projectMeta).map(m=>m.unit))],teams=[...new Set(Object.values(projectMeta).map(m=>m.team))];
 const list=projects.filter(p=>{const m=projectMeta[p.id];return p.label.toLowerCase().includes(q.toLowerCase())&&(unit==='all'||m.unit===unit)&&(team==='all'||m.team===team)});
 const filtered=unit!=='all'||team!=='all'||!!q.trim();
 return <>
  <div className="project-toolbar"><div className="search-input compact"><MagnifyingGlass/><input aria-label="Tìm kiếm dự án" placeholder="Tìm kiếm dự án" value={q} onChange={e=>setQ(e.target.value)}/></div>
   <div className="hub-selects"><select className="meta-input" aria-label="Đơn vị" value={unit} onChange={e=>setUnit(e.target.value)}><option value="all">Tất cả đơn vị</option>{units.map(u=><option key={u}>{u}</option>)}</select><select className="meta-input" aria-label="Team" value={team} onChange={e=>setTeam(e.target.value)}><option value="all">Tất cả team</option>{teams.map(t=><option key={t}>{t}</option>)}</select>{filtered&&<button className="text-button" onClick={()=>{setQ('');setUnit('all');setTeam('all')}}>Xóa lọc</button>}<Button primary onClick={()=>setCreating(true)}><Plus/> Tạo dự án</Button></div></div>
  {creating&&<ProjectForm close={()=>setCreating(false)} done={id=>{setCreating(false);open(id)}} notify={notify}/>}
  {list.length?<div className="project-grid">{list.map(p=>{const m=projectMeta[p.id];const o=entities.find(e=>e.type==='Objective'&&e.project===p.id);
   // Hoạt động gần nhất: báo cáo dự án đã gửi mới nhất, để biết dự án có đang được cập nhật không.
   const reps=data.reports.filter(r=>r.scope==='project'&&r.status==='PUBLISHED'&&r.relations.includes(p.id)).sort((a,b)=>b.date.localeCompare(a.date));
   return <button className="surface project-card" key={p.id} onClick={()=>open(p.id)}>
    <div className="pc-head"><h3>{p.label}</h3><CaretRight/></div>
    <p className="pc-meta">{m.owner}<i>·</i>{m.unit}{m.team!==m.unit&&<><i>·</i>{m.team}</>}<i>·</i>{m.tags.join(', ')}</p>
    {o?<div className="pc-goal"><span title={o.label}>{o.label}</span><ProgressBar value={o.progress??0}/></div>:<div className="pc-goal empty"><Target/> Chưa có mục tiêu</div>}
    <p className="pc-activity"><span className={'fresh-dot'+(reps.length&&daysAgo(reps[0].date)<=7?' on':'')} aria-hidden="true"/>{reps.length?<>Cập nhật <time dateTime={reps[0].date} title={dateLabel(reps[0].date)}>{relativeDate(reps[0].date).toLowerCase()}</time><i>·</i>{reps.length} báo cáo</>:'Chưa có báo cáo'}</p>
   </button>})}</div>:<Empty title="Không tìm thấy dự án" text="Thử đổi từ khóa hoặc bộ lọc."/>}
 </>;
}

/** Chi tiết dự án: tabs iGoal thật, card OKR dự án, card Tổng hợp báo cáo (kèm chế độ xem Nhật ký từ Relation layer). */
export function Project({projectId,create,edit,open,source,notify}:{projectId:string;create:()=>void;edit:(r:Report)=>void;open:(r:Report)=>void;source:(id:string)=>void;notify:(s:string)=>void}){
 const {data,user}=useStore();const [tab,setTab]=useState('Mục tiêu & báo cáo');const p=projects.find(x=>x.id===projectId)!;
 const cfg=data.projects?.find(x=>x.id===projectId);const [editing,setEditing]=useState(false);
 const objectives=entities.filter(e=>e.type==='Objective'&&e.project===projectId);
 // Chỉ báo cáo user có quyền xem (thành viên / quản trị dự án, người viết, hoặc được chia sẻ).
 const reports=data.reports.filter(r=>r.scope==='project'&&r.relations.includes(projectId)&&canView(data,r,user));
 return <>{cfg&&<ProjectStrip cfg={cfg}/>}<div className="project-tabs">{['Mục tiêu & báo cáo','Tài liệu','Quản lý dự án','Góp ý','Lịch sử chỉnh sửa'].map(t=><button key={t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{t}</button>)}</div>
  {tab==='Mục tiêu & báo cáo'?<div className="stack wide-gap">
   <OkrCard title={p.label+' OKR'} objectives={objectives} children={o=>entities.filter(e=>['KR','KS'].includes(e.type)&&e.project===o.project)} onCheckin={()=>edit(blankReport('checkin','project',projectId))}/>
   
   <ReportHub reports={reports} create={create} edit={edit} open={open} context={projectId} views={[{key:'timeline',label:'Nhật ký',render:()=><Timeline source={source} projectId={projectId}/>}]}/>
  </div>
  :tab==="Quản lý dự án"&&cfg?<ProjectSettings cfg={cfg} edit={()=>setEditing(true)}/>
  :<section className="surface document"><h2>{tab}</h2>{tab==="Tài liệu"?<><p>Tài liệu tham khảo của dự án trong bản demo.</p><Button onClick={()=>source('game')}><FileText/> Yêu cầu báo cáo từ Game/App ↗</Button><Button onClick={()=>source('sprint')}><FileText/> Phạm vi Sprint 1 ↗</Button></>:tab==='Quản lý dự án'?<><h3>Nhóm dự án</h3><p>Dũng · Product Manager<br/>Nguyệt · Phối hợp Game/App<br/>Quỳnh · Phối hợp vận hành</p><Relations ids={[projectId,'sprint1']}/></>:tab==='Góp ý'?<><h3>Nội dung cần stakeholder phản hồi</h3><p>Mẫu báo cáo phù hợp với Game/App; người xác nhận Contribution; nội dung recap gửi Slack.</p><Button onClick={()=>source('game')}>Xem cuộc họp làm rõ yêu cầu ↗</Button></>:<><p>21/09/2026 · Chốt phạm vi Sprint 1.</p><p>17/09/2026 · Bổ sung yêu cầu từ Game/App.</p></>}</section>}
  {editing&&cfg&&<ProjectForm initial={cfg} close={()=>setEditing(false)} done={()=>setEditing(false)} notify={notify}/>}</>;
}

type Event={id:string;key:string;type:string;title:string;text:string;date:string;relations:string[]};
/** Icon theo loại mốc trên Nhật ký dự án. */
const TL_ICON:Record<string,React.ElementType>={'Cuộc họp':ChatsCircle,'Báo cáo':FileText,'Quyết định':Lightbulb,'Contribution':CheckCircle,'Milestone':Flag};
/** Nhật ký dự án sinh từ Relation layer: report, quyết định, contribution, milestone có relation tới dự án. Không copy nội dung vào Project. */
export function Timeline({source,projectId}:{source:(id:string)=>void;projectId:string}){const {data,user}=useStore();const [filter,setFilter]=useState('Tất cả'),[summary,setSummary]=useState(false),[from,setFrom]=useState('2026-07-01'),[to,setTo]=useState(today),[generated,setGenerated]=useState(false);// Báo cáo cá nhân đã xuất bản thành bản riêng ở dự án này thì chỉ hiện bản ở dự án, tránh trùng.
const reports=data.reports.filter(r=>r.status==='PUBLISHED'&&r.relations.includes(projectId)&&canView(data,r,user)&&r.destination!=='manager'&&!(r.scope==='personal'&&data.publications.some(p=>p.originId===r.id&&p.destId==='project:'+projectId)));const events:Event[]=[...reports.map(r=>({id:r.id,key:r.id,type:r.kind==='meeting'?'Cuộc họp':'Báo cáo',title:r.title,text:r.sections.find(s=>s.text)?.text||'',date:r.date,relations:r.relations})),...reports.flatMap(r=>r.sections.filter(s=>s.label==='Quyết định đã chốt'&&s.text).map(s=>({id:r.id,key:r.id+'-decision',type:'Quyết định',title:'Quyết định · '+r.title,text:s.text,date:r.date,relations:r.relations}))),...data.contributions.filter(c=>c.recordStatus==='SUBMITTED'&&c.relations.includes(projectId)).map(c=>({id:c.id,key:c.id,type:'Contribution',title:c.title,text:c.impact+' · '+(c.confirmationStatus==='CONFIRMED'?'Đã xác nhận':'Chờ xác nhận / bổ sung'),date:c.date,relations:c.relations})),...(projectId==='igoal'?[{id:'sprint',key:'milestone',type:'Milestone',title:'Sprint 1 · 21/09–02/10',text:'Bắt đầu Sprint 1. Ưu tiên prototype báo cáo tuần và biên bản họp.',date:'2026-09-21',relations:['igoal','sprint1']}]:[])].sort((a,b)=>b.date.localeCompare(a.date));const filtered=events.filter(e=>filter==='Tất cả'||e.type===filter);const summaryEvents=events.filter(e=>e.date>=from&&e.date<=to);
 const narrative=(()=>{const by=(t:string)=>summaryEvents.filter(e=>e.type===t);const decision=by('Quyết định')[0];const contrib=by('Contribution');return [`Trong khoảng này dự án có ${by('Cuộc họp').length} cuộc họp, ${by('Báo cáo').length} báo cáo và ${by('Quyết định').length} nhóm quyết định được ghi lại.`,decision?`Quyết định gần nhất (${dateLabel(decision.date)}): ${decision.text.split('\n')[0]}`:'',contrib.length?`${contrib.length} contribution đã được ghi nhận, trong đó ${contrib.filter(c=>c.text.includes('Đã xác nhận')).length} đã xác nhận.`:'',by('Milestone').length?`Mốc đang theo dõi: ${by('Milestone').map(m=>m.title).join(', ')}.`:''].filter(Boolean).join(' ')})();
 return <><div className="timeline-toolbar"><select className="meta-input" aria-label="Loại" value={filter} onChange={e=>setFilter(e.target.value)}>{["Tất cả","Cuộc họp","Báo cáo","Quyết định","Contribution","Milestone"].map(t=><option key={t} value={t}>{t==="Tất cả"?"Tất cả loại":t}</option>)}</select><Button onClick={()=>{setSummary(true);setGenerated(false)}}><Sparkle/> Tóm tắt lịch sử dự án</Button></div><div className="tl-list">{filtered.length?filtered.map(e=>{const Icon=TL_ICON[e.type]??FileText;return <button className={"tl-row "+(e.type==="Quyết định"?"decision":"")} key={e.key} title={e.text} onClick={()=>source(e.id)}><span className="tl-date">{e.date.slice(8,10)}/{e.date.slice(5,7)}</span><Icon className="tl-icon"/><span className="tl-main"><strong>{e.title}</strong><small>{e.type==="Quyết định"?e.text.split(String.fromCharCode(10))[0]:e.type}{e.relations.some(id=>id!==projectId)&&<><i>·</i><Relations compact ids={e.relations} hide={[projectId]}/></>}</small></span></button>}):<Empty title="Chưa có nội dung thuộc nhóm này" text="Báo cáo và đóng góp liên kết với dự án sẽ xuất hiện tại đây."/>}</div>{summary&&<Modal drawer title="Tóm tắt lịch sử dự án" subtitle="AI tổng hợp từ bản ghi trong khoảng thời gian bạn chọn." close={()=>setSummary(false)}><div className="form-grid"><label className="field">Từ ngày<input type="date" value={from} onChange={e=>{setFrom(e.target.value);setGenerated(false)}}/></label><label className="field">Đến ngày<input type="date" value={to} onChange={e=>{setTo(e.target.value);setGenerated(false)}}/></label></div><Button primary disabled={!from||!to||from>to} onClick={()=>setGenerated(true)}><Sparkle/> Tạo tóm tắt</Button>{generated&&<><p className="hint">{summaryEvents.length} cập nhật · {dateLabel(from)} – {dateLabel(to)}</p>{summaryEvents.length>0&&<AIBox title="Tóm tắt">{narrative}</AIBox>}{summaryEvents.length>0&&<h3>Nguồn tham chiếu</h3>}{summaryEvents.length?summaryEvents.map(e=><section className="reading-section" key={e.key}><h3>{e.type}: {e.title}</h3><p>{e.text.split('\n')[0]}</p><Button quiet onClick={()=>source(e.id)}>Nguồn: {e.title} ↗</Button></section>):<Empty title="Chưa có dữ liệu trong khoảng này" text="Chọn khoảng thời gian khác để tổng hợp."/>}</>}</Modal>}</>}

/** Chọn "Loại báo cáo" (mảng) kiểu pill xanh như iGoal thật. */
export function TrackSelect({value,onChange}:{value?:Track;onChange:(t:Track)=>void}){return <label className="select-pill"><select aria-label="Loại báo cáo" value={value??tracks[0]} onChange={e=>onChange(e.target.value as Track)}>{tracks.map(t=><option key={t}>{t}</option>)}</select><CaretDown size={12}/></label>}

