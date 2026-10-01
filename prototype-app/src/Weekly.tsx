import React,{useState} from 'react';
import {Sparkle,FloppyDisk,PaperPlaneTilt,ClockCounterClockwise,CheckCircle,Flag,TextAlignLeft,X} from 'phosphor-react';
import {Report,Section,entities,projects,reportWriters,weeklySuggestions,SuggestCtx,Suggestion,section,blocksOf} from './model';
import {useStore} from './store';
import {TrackSelect} from './Project';
import {Button,SourceButton,EntityRelationPicker,Badge,ReportBody,LeaveDialog,EditorFrame,EditorPanel,OldReportsPanel,UserChip,MetaRow,SaveState,Modal,AutoTextarea,nowTime} from './ui';
import {SourcePicker,buildSourceOptions,addedKeys} from "./SourcePicker";
import {SlashTextarea,SlashItem} from './SlashMenu';
import {TeamContribution} from './Alignment';

/** Tuần báo cáo hiện tại (mock): gợi ý chỉ quét bản ghi từ ngày này. */
const WEEK_FROM='2026-09-15';
/** Mẫu 3 mục của khung "Báo cáo dự án". "Kế hoạch tuần tới" là nguồn rà soát cho tuần sau. "Khó khăn" không bắt buộc. */
const SEC_RESULT='Kết quả tuần này',SEC_ISSUE='Khó khăn / vấn đề',SEC_PLAN='Kế hoạch tuần tới';
const TEMPLATE=(project:string):Section[]=>[SEC_RESULT,SEC_ISSUE,SEC_PLAN].map(l=>({...section(l,''),project}));
const OPTIONAL=[SEC_ISSUE];
const PLACEHOLDER:Record<string,string>={[SEC_RESULT]:'Việc đã làm, kết quả đạt được…',[SEC_ISSUE]:'Đang vướng ở đâu, cần hỗ trợ gì…',[SEC_PLAN]:'Tuần tới sẽ làm gì…'};
/** Loại gợi ý → mục trong khung dự án (báo cáo chung viết tự do nên không chia mục). */
const TARGET:Record<Suggestion['kind'],string>={result:SEC_RESULT,decision:SEC_RESULT,checkin:SEC_RESULT,issue:SEC_ISSUE,plan:SEC_PLAN};
/** Tên nhóm dòng trong panel "Lấy từ báo cáo": nói nội dung là gì, không phải mục đích đến. */
const GROUP_NAME:Record<string,string>={[SEC_RESULT]:'Kết quả',[SEC_ISSUE]:'Khó khăn / vấn đề',[SEC_PLAN]:'Kế hoạch'};
const projectLabel=(id:string)=>projects.find(p=>p.id===id)?.label??id;
/** Phần viết tự do của báo cáo chung: một mục không tiêu đề, không thuộc dự án. */
const isFree=(s:Section)=>!s.project&&!s.label;
const withFree=(sections:Section[])=>sections.some(isFree)?sections:[section('',''),...sections];

/**
 * Báo cáo tuần.
 * - Báo cáo chung: viết tự do ngay trên trang (không cần "/", không chia mục).
 * - Gõ "/" trong phần viết tự do: lệnh editor (Style, Insert) như cũ + nhóm "Báo cáo dự án" ở dưới cùng để thêm khung riêng cho một dự án
 *   (chỉ dự án user có quyền viết). Trong khung dự án không dùng "/". Khi xuất bản, bản ở dự án chỉ lấy nội dung khung đó (publishing.ts).
 * - Liên kết để trống mặc định; hệ thống không tự gắn EKS / dự án, chỉ gợi ý (người dùng bấm mới thêm).
 * - Panel "Lấy từ báo cáo": dòng từ báo cáo dự án → khung của dự án đó nếu đã có, không thì vào phần viết tự do.
 * Member: nguồn là báo cáo dự án tuần này. PM: báo cáo tuần của member + check-in (không có khung dự án).
 */
export function Weekly({initial,close,source,notify,publish}:{initial:Report;close:()=>void;source:(id:string)=>void;notify:(s:string)=>void;publish:(r:Report)=>void}){
 const {data,user,saveReport}=useStore();
 const isPM=initial.scope==='project';const projectId=isPM?initial.relations[0]:undefined;
 // Liên kết giữ nguyên như bản nháp (báo cáo mới: trống; PM: dự án đang mở, khóa).
 // Nháp đã gắn dự án nhưng chưa có khung (dữ liệu cũ) → tạo khung để giữ quy tắc chip Dự án ⇔ khung báo cáo dự án.
 const [base]=useState<Report>(()=>{let sections=withFree(initial.sections);if(!isPM)for(const id of initial.relations)if(entities.find(e=>e.id===id)?.type==='Project'&&!sections.some(s=>s.project===id))sections=[...sections,...TEMPLATE(id)];return {...initial,sections}});
 const [r,setR]=useState<Report>(base);
 const [saved,setSaved]=useState(false),[savedAt,setSavedAt]=useState(''),[leaving,setLeaving]=useState(false),[panel,setPanel]=useState<string|null>('old'),[added,setAdded]=useState<string[]>([]);
 const [focus,setFocus]=useState<string|null>(null),[removing,setRemoving]=useState<string|null>(null);
 const ctx:SuggestCtx=isPM?{scope:'project',projectId:projectId!}:{scope:'personal'};
 // Chỉ báo cáo của các dự án (member) / của team (PM). Bỏ bản sao báo cáo của chính mình đã xuất bản sang dự án.
 const suggestions=weeklySuggestions(data.reports,WEEK_FROM,ctx).filter(s=>{const src=data.reports.find(x=>x.id===s.source);return src&&!src.origin&&src.id!==r.id&&(isPM||src.owner!==initial.owner||src.kind!=="weekly")});
 const oldIds=data.reports.filter(x=>x.kind==='weekly'&&x.scope===initial.scope&&x.status==='PUBLISHED'&&x.id!==r.id&&(isPM?x.relations.includes(projectId!):x.owner===initial.owner)).map(x=>x.id);
 // Nguồn "Lấy từ báo cáo": không có báo cáo tuần trước của chính mình (xem ở panel "Báo cáo cũ").
 const options=buildSourceOptions(data.reports,suggestions,k=>TARGET[k],[SEC_RESULT,SEC_ISSUE,SEC_PLAN],{byOwner:isPM});
 const total=options.reduce((n,o)=>n+o.groups.reduce((m,g)=>m+g.items.length,0),0);

 const blocks=blocksOf(r.sections);const has=(p:string)=>r.sections.some(s=>s.project===p);
 const writable=isPM?[]:projects.filter(p=>reportWriters[p.id]?.includes(user));
 const slashItems:SlashItem[]=writable.filter(p=>!has(p.id)).map(p=>({id:p.id,label:p.label,hint:'Khung riêng · xuất hiện ở báo cáo dự án '+p.label,group:'Báo cáo dự án',icon:<Flag/>}));

 // Liên kết gợi ý (viền nét đứt): KR/KS/Mốc của các nguồn đã dùng mà user chưa gắn. Không tự gắn.
 const usedSources=[...new Set(r.sections.flatMap(s=>s.sources))];
 const relSuggest=[...new Set(usedSources.flatMap(id=>data.reports.find(x=>x.id===id)?.relations??[]))].filter(id=>{const t=entities.find(e=>e.id===id)?.type;return t&&t!=='Project'&&t!=='EKS'&&(isPM||t!=='Milestone')});
 const hasText=r.sections.some(s=>s.text.trim());
 const dirty=!saved&&JSON.stringify(r)!==JSON.stringify(base);
 const patch=(p:Partial<Report>)=>{setR(x=>({...x,...p}));setSaved(false)};
 // Mọi thay đổi nội dung đi qua đây (đánh dấu chưa lưu).
 const edit=(f:(x:Report)=>Report)=>{setR(f);setSaved(false)};
 // Chip "Dự án" trong Liên kết ⇔ khung Báo cáo dự án (1:1): thêm khung = gắn dự án, bỏ khung = gỡ dự án. Nhờ vậy luôn biết nội dung nào thuộc dự án nào.
 const addBlock=(project:string)=>{edit(x=>({...x,relations:x.relations.includes(project)?x.relations:[...x.relations,project],sections:x.sections.some(s=>s.project===project)?x.sections:[...x.sections,...TEMPLATE(project)]}));setFocus(project)};
 const removeBlock=(project:string)=>{edit(x=>({...x,relations:x.relations.filter(id=>id!==project),sections:x.sections.filter(s=>s.project!==project)}));setRemoving(null)};
 const isProject=(id:string)=>entities.find(e=>e.id===id)?.type==='Project';
 // Đổi Liên kết: dự án thêm → thêm khung; dự án gỡ → bỏ khung (hỏi nếu đã viết); loại khác cập nhật bình thường.
 const changeRelations=(v:string[])=>{if(isPM){patch({relations:v});return}
  const addP=v.filter(id=>isProject(id)&&!r.relations.includes(id)),delP=r.relations.filter(id=>isProject(id)&&!v.includes(id));
  patch({relations:[...v.filter(id=>!isProject(id)),...r.relations.filter(isProject)]});
  addP.forEach(addBlock);delP.forEach(p=>r.sections.some(s=>s.project===p&&s.text.trim())?setRemoving(p):removeBlock(p))};
 const setText=(i:number,text:string)=>edit(x=>({...x,sections:x.sections.map((s,j)=>j===i?{...s,text,sources:text.trim()?s.sources:[]}:s)}));
 // Chèn từ panel: dòng của báo cáo dự án → mục tương ứng trong khung dự án đó (nếu đã có), còn lại → cuối phần viết tự do.
 const destProject=(sourceId:string)=>{const src=data.reports.find(x=>x.id===sourceId);const proj=src?.scope==='project'?src.relations.find(id=>entities.find(e=>e.id===id)?.type==='Project'):undefined;return proj&&has(proj)?proj:undefined};
 const insert=(sourceId:string,label:string,key:string,text:string)=>{const dest=destProject(sourceId);
  const append=(s:Section)=>({...s,text:(s.text.trim()?s.text.replace(/\s+$/,'')+'\n':'')+'• '+text,sources:[...new Set([...s.sources,sourceId])]});
  edit(x=>({...x,sections:x.sections.map(s=>dest?(s.project===dest&&s.label===label?append(s):s):(isFree(s)?append(s):s))}));
  setAdded(a=>[...a,...addedKeys(key)]);
 };
 const save=()=>{const next={...r,status:'DRAFT' as const};saveReport(next);setR(next);setSaved(true);setSavedAt(nowTime());notify('Đã lưu bản nháp')};
 const leave=()=>dirty?setLeaving(true):close();

 if(r.status==='PUBLISHED')return <EditorFrame back={close} backLabel="Về danh sách" actions={<Badge tone="success">Đã gửi</Badge>}>
  <h1 className="doc-title">{r.title}</h1>
  <article className="reading"><ReportBody report={r} open={source}/></article>
 </EditorFrame>;

 const panels:EditorPanel[]=[
  {key:'suggest',label:'Lấy từ báo cáo',icon:<Sparkle/>,render:()=><SourcePicker title="Lấy từ báo cáo" options={options} added={added} onAdd={insert} openSource={source} groupLabel={l=>GROUP_NAME[l]??l}
   destOf={id=>{const d=destProject(id);return d?<>Chèn vào: khung <b>Báo cáo dự án · {projectLabel(d)}</b></>:<>Chèn vào: <b>báo cáo chung</b>{slashItems.length?' · gõ / để thêm khung dự án':''}</>}} empty={isPM?'Kỳ này chưa có báo cáo của team.':'Tuần này chưa có báo cáo dự án.'}/>},
  {key:'old',label:'Báo cáo cũ',icon:<ClockCounterClockwise/>,render:()=><OldReportsPanel ids={oldIds} open={source}/>},
 ];
 const projectBlocks=blocks.filter(b=>b.project);
 const removingLabel=removing?projectLabel(removing):'';
 return <EditorFrame back={leave} panels={panels} panel={panel} onPanel={setPanel} onSave={()=>save()}
  actions={<><SaveState dirty={dirty} savedAt={saved?savedAt:undefined}/>{total>0&&<Button quiet className={panel==='suggest'?'active-filter':''} onClick={()=>setPanel(panel==='suggest'?'old':'suggest')}><Sparkle/> Lấy từ báo cáo</Button>}<Button onClick={()=>save()} title="Lưu nháp (Ctrl S)"><FloppyDisk/> Lưu nháp</Button><Button primary disabled={!r.title.trim()||!hasText} title={!r.title.trim()?'Đặt tên báo cáo để gửi':!hasText?'Viết nội dung báo cáo để gửi':undefined} onClick={()=>publish(r)}><PaperPlaneTilt/> Xuất bản</Button></>}>
  <input className="title-input" aria-label="Tên báo cáo" value={r.title} onChange={e=>patch({title:e.target.value})}/>
  <MetaRow label="Quản lý trực tiếp"><UserChip/></MetaRow>
  <MetaRow label="Loại báo cáo"><TrackSelect value={r.track} onChange={t=>patch({track:t})}/></MetaRow>
  <MetaRow label="Liên kết"><EntityRelationPicker value={r.relations} onChange={changeRelations} locked={isPM?[projectId!]:[]} suggestions={relSuggest} personal={!isPM} onlyProject={projectId} projectIds={isPM?undefined:writable.map(p=>p.id)} projectHint={isPM?"Báo cáo viết trong dự án này chỉ gắn mục tiêu của dự án. Báo cáo cho dự án khác: viết ở My EKS và thêm khung dự án.":"Chọn một dự án = thêm khung Báo cáo dự án riêng bên dưới để viết nội dung cho dự án đó."} footer={!isPM&&<TeamContribution relations={r.relations}/>}/></MetaRow>
  <div className="divider"/>
  {blocks.map(b=>{
   // Báo cáo chung: phần viết tự do (có "/").
   if(!b.project){const free=b.items.find(({s})=>isFree(s));return free&&<section key="general" className="wblock free" aria-label="Báo cáo chung">
    {projectBlocks.length>0&&<header className="wblock-head"><span className="wblock-tag"><TextAlignLeft/> Báo cáo chung</span><small>Xuất hiện ở My EKS và nơi bạn chọn khi xuất bản</small></header>}
    <SlashTextarea className="block-text free-text" aria-label="Báo cáo chung" value={free.s.text} items={slashItems} onPick={addBlock} rows={Math.max(8,free.s.text.split('\n').length+2)}
     placeholder={'Viết báo cáo tuần: đã làm gì, vướng gì, tuần tới làm gì…\nGõ / để chèn định dạng'+(slashItems.length?' hoặc thêm khung Báo cáo dự án':'')} onChange={v=>setText(free.i,v)}/>
    {free.s.text.trim()&&free.s.sources.length>0&&<SourceButton ids={free.s.sources} open={source}/>}
   </section>}
   const p=b.project;
   return <section key={p} className="wblock project" aria-label={'Báo cáo dự án '+projectLabel(p)}>
    <header className="wblock-head"><span className="wblock-tag"><Flag weight="fill"/> Báo cáo dự án</span><strong>{projectLabel(p)}</strong><small>Xuất hiện ở Tổng hợp báo cáo dự án {projectLabel(p)} khi xuất bản</small>
     <button className="wblock-x" aria-label={'Bỏ khung '+projectLabel(p)} title="Bỏ khung" onClick={()=>b.items.some(({s})=>s.text.trim())?setRemoving(p):removeBlock(p)}><X size={14}/></button></header>
    {b.items.map(({s,i},j)=><div className="ws" key={i}><h3>{s.label}{OPTIONAL.includes(s.label)&&<small className="ws-optional">(không bắt buộc)</small>}{s.text.trim()&&<CheckCircle weight="fill" className="ws-done" aria-label="Đã viết"/>}</h3>
     {/* Trong khung dự án không có lệnh "/" (không lồng khung). */}
     <AutoTextarea className="block-text" aria-label={s.label+' · '+projectLabel(p)} value={s.text} autoFocus={j===0&&focus===p} placeholder={PLACEHOLDER[s.label]??'Nhập nội dung…'} onChange={e=>setText(i,e.target.value)} rows={Math.max(3,s.text.split('\n').length+1)}/>
     {s.text.trim()&&s.sources.length>0&&<SourceButton ids={s.sources} open={source}/>}</div>)}
   </section>})}
  {removing&&<Modal title={'Bỏ khung báo cáo dự án '+removingLabel+'?'} subtitle="Nội dung đã viết trong khung này sẽ bị xóa khỏi bản nháp." close={()=>setRemoving(null)}><div className="form-actions"><Button onClick={()=>setRemoving(null)}>Giữ lại</Button><Button primary onClick={()=>removeBlock(removing)}>Bỏ khung</Button></div></Modal>}
  {leaving&&<LeaveDialog stay={()=>setLeaving(false)} discard={close} save={()=>{save();close()}}/>}
 </EditorFrame>;
}
