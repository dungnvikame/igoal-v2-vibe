import React,{useState} from 'react';
import {Info,LinkSimple,CheckCircle,CaretRight,Plus,PaperPlaneTilt,ArrowSquareOut} from 'phosphor-react';
import {Report,Contribution,blankContribution,kindLabel,dateLabel,projects} from './model';
import {useStore} from './store';
import {Button,Badge,Relations,ReportBody,EditorFrame,EditorPanel,UserChip,MetaRow} from './ui';

/** Mục nào của báo cáo có thể là đóng góp cá nhân (kết quả, quyết định, việc cần làm). */
const CONTRIB_SECTIONS=/^(Kết quả|Nội dung chính|Quyết định|Kết quả đã làm)/;

/**
 * Chi tiết báo cáo: cùng khung editor (read-only). Nội dung ở giữa, rail phải 3 panel:
 * Thông tin (meta, liên kết, Slack) · Nguồn đã dùng (danh sách → mở báo cáo gốc) · Ghi nhận đóng góp (chọn một dòng → form prefill).
 */
export function ReportDetail({report,close,source,contribute,notify}:{report:Report;close:()=>void;source:(id:string)=>void;contribute:(c:Contribution)=>void;notify:(s:string)=>void}){
 const {data,saveReport}=useStore();const r=data.reports.find(x=>x.id===report.id)||report;
 const [panel,setPanel]=useState<string|null>('info');
 const retry=()=>{saveReport({...r,slack:'SENT'});notify('Đã gửi lại Slack')};
 const sourceIds=[...new Set(r.sections.flatMap(s=>s.sources))].filter(id=>data.reports.some(x=>x.id===id));
 // Dòng có thể ghi nhận: từng dòng của mục kết quả / quyết định, cộng kết quả trong card check-in và việc cần làm.
 const candidates=[
  ...r.sections.filter(s=>CONTRIB_SECTIONS.test(s.label)&&s.text.trim()).map(s=>({label:s.label,items:s.text.split('\n').map(t=>t.replace(/^•\s*/,'').trim()).filter(Boolean)})),
  ...(r.checkins?.length?[{label:'Kết quả check-in',items:r.checkins.flatMap(c=>c.result.split('\n').map(t=>t.replace(/^•\s*/,'').trim()).filter(Boolean))}]:[]),
  ...(r.actions.length?[{label:'Việc cần làm',items:r.actions.map(a=>`${a.task} (${a.owner})`)}]:[]),
 ].filter(g=>g.items.length);
 const recorded=(t:string)=>data.contributions.some(c=>c.title===t&&c.evidence.some(e=>e.value===r.id));
 const record=(t:string)=>contribute({...blankContribution(r),title:t,impact:''});
 const project=projects.find(p=>r.relations.includes(p.id));

 const panels:EditorPanel[]=[
  {key:'info',label:'Thông tin',icon:<Info/>,render:()=><div className="sp">
   <div className="sp-head"><h3>Thông tin</h3></div>
   <MetaRow label="Người viết"><UserChip name={r.owner} removable={false}/></MetaRow>
   <MetaRow label="Ngày">{dateLabel(r.date)}</MetaRow>
   <MetaRow label="Loại">{kindLabel[r.kind]}{r.track?' · '+r.track:''}</MetaRow>
   {r.kind==='meeting'&&<MetaRow label="Thành phần">{r.participants}</MetaRow>}
   <MetaRow label="Liên kết"><Relations ids={r.relations} max={6}/></MetaRow>
   {r.kind==='meeting'&&<div className="aside-card slack"><div className="row between"><strong>{r.channel}</strong><Badge tone={r.slack==='FAILED'?'warning':'success'}>{r.slack==='FAILED'?'Chưa gửi được':'Đã gửi Slack'}</Badge></div>{r.slack==='FAILED'&&<Button onClick={retry}><PaperPlaneTilt/> Gửi lại</Button>}</div>}
  </div>},
  ...(sourceIds.length?[{key:'sources',label:'Nguồn đã dùng',icon:<LinkSimple/>,render:()=><div className="sp">
   <div className="sp-head"><h3>Nguồn đã dùng</h3></div>
   <div className="sp-list">{sourceIds.map(id=>{const s=data.reports.find(x=>x.id===id)!;return <button key={id} className="sp-source" onClick={()=>source(id)}><span className="sp-source-text"><strong>{s.title}</strong><small>{[projects.find(p=>s.relations.includes(p.id))?.label,kindLabel[s.kind],dateLabel(s.date)].filter(Boolean).join(' · ')}</small></span><span/><ArrowSquareOut/></button>})}</div>
  </div>} as EditorPanel]:[]),
  ...(candidates.length?[{key:'contrib',label:'Ghi nhận đóng góp',icon:<CheckCircle/>,render:()=><div className="sp">
   <div className="sp-head"><h3>Ghi nhận đóng góp</h3></div>
   <p className="sp-meta">Chọn một dòng bạn đã đóng góp để ghi nhận.</p>
   {candidates.map(g=><section key={g.label}><div className="sp-group">{g.label}</div>{g.items.map((t,i)=>{const done=recorded(t);return <button key={i} className={'sp-line'+(done?' done':'')} disabled={done} onClick={()=>record(t)}><span>{t}</span>{done?<CheckCircle weight="fill"/>:<Plus weight="bold"/>}</button>})}</section>)}
  </div>} as EditorPanel]:[]),
 ];

 return <EditorFrame back={close} panels={panels} panel={panel} onPanel={setPanel}
  actions={<>{r.status==='DRAFT'&&<Badge>Bản nháp</Badge>}{r.kind==='meeting'&&r.slack==='FAILED'&&<Badge tone="warning">Slack chưa gửi</Badge>}{candidates.length>0&&<Button quiet className={panel==='contrib'?'active-filter':''} onClick={()=>setPanel(panel==='contrib'?'info':'contrib')}><CheckCircle/> Ghi nhận đóng góp</Button>}</>}>
  <h1 className="doc-title">{r.title}</h1>
  <p className="doc-meta">{r.owner}<i>·</i>{dateLabel(r.date)}<i>·</i>{kindLabel[r.kind]}{project&&<><i>·</i>{project.label}</>}</p>
  <div className="divider"/>
  <div className="reading detail"><ReportBody report={r} open={source}/></div>
 </EditorFrame>;
}
