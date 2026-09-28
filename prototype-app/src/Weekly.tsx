import React,{useState} from 'react';
import {Sparkle,FloppyDisk,PaperPlaneTilt,ClockCounterClockwise,CheckCircle} from 'phosphor-react';
import {Report,entities,previousWeekly,carryItems,weeklySuggestions,SuggestCtx,Suggestion,section} from './model';
import {useStore} from './store';
import {TrackSelect} from './Project';
import {Button,SourceButton,EntityRelationPicker,Badge,ReportBody,LeaveDialog,EditorFrame,EditorPanel,OldReportsPanel,UserChip,MetaRow,AutoTextarea,SaveState,nowTime} from './ui';
import {SourcePicker,buildSourceOptions,addedKeys} from "./SourcePicker";

/** Tuần báo cáo hiện tại (mock): gợi ý chỉ quét bản ghi từ ngày này. */
const WEEK_FROM='2026-09-15';
/** Template báo cáo tuần: 3 mục. "Kế hoạch tuần tới" là nguồn carry-over cho tuần sau. */
const SEC_RESULT='Kết quả tuần này',SEC_ISSUE='Khó khăn / vấn đề',SEC_PLAN='Kế hoạch tuần tới';
const TEMPLATE=()=>[section(SEC_RESULT,''),section(SEC_ISSUE,''),section(SEC_PLAN,'')];
const PLACEHOLDER:Record<string,string>={[SEC_RESULT]:'Việc đã làm, kết quả đạt được…',[SEC_ISSUE]:'Đang vướng ở đâu, cần hỗ trợ gì…',[SEC_PLAN]:'Tuần tới sẽ làm gì…'};
/** Mục nào nhận loại gợi ý nào. */
const TARGET:Record<Suggestion['kind'],string>={result:SEC_RESULT,decision:SEC_RESULT,checkin:SEC_RESULT,issue:SEC_ISSUE,plan:SEC_PLAN};

/**
 * Báo cáo tuần: 3 mục để user tự viết như editor iGoal.
 * AI là panel "Lấy từ báo cáo" ở cột phải, 2 bước: chọn báo cáo nguồn → chọn dòng (đã chia sẵn theo mục đích đến) → chèn.
 * Member: nguồn là báo cáo dự án tuần này + báo cáo tuần trước của chính mình. PM: báo cáo tuần của member + check-in.
 */
export function Weekly({initial,close,source,notify,publish}:{initial:Report;close:()=>void;source:(id:string)=>void;notify:(s:string)=>void;publish:(r:Report)=>void}){
 const {data,saveReport}=useStore();
 const isPM=initial.scope==='project';const projectId=isPM?initial.relations[0]:undefined;
 // Member: EKS của chính mình gắn sẵn (gỡ bằng ×). PM: dự án đang mở đã gắn và khóa.
 const [base]=useState<Report>(()=>{const sections=initial.sections.length?initial.sections:TEMPLATE();const relations=isPM||initial.relations.length?initial.relations:entities.filter(e=>e.type==='EKS').map(e=>e.id);return {...initial,sections,relations}});
 const [r,setR]=useState<Report>(base);
 const [saved,setSaved]=useState(false),[savedAt,setSavedAt]=useState(''),[leaving,setLeaving]=useState(false),[panel,setPanel]=useState<string|null>('old'),[added,setAdded]=useState<string[]>([]);
 const ctx:SuggestCtx=isPM?{scope:'project',projectId:projectId!}:{scope:'personal'};
 const prev=previousWeekly(data.reports,r.id,initial.scope,projectId,isPM?undefined:initial.owner);const carry=carryItems(prev);
 const suggestions=weeklySuggestions(data.reports,WEEK_FROM,ctx);
 const oldIds=data.reports.filter(x=>x.kind==='weekly'&&x.scope===initial.scope&&x.status==='PUBLISHED'&&x.id!==r.id&&(isPM?x.relations.includes(projectId!):x.owner===initial.owner)).map(x=>x.id);

 // Danh sách báo cáo nguồn: báo cáo tuần trước (nếu có) đứng đầu, sau đó các báo cáo có gợi ý, mới nhất trước.
 const options=buildSourceOptions(data.reports,suggestions,k=>TARGET[k],[SEC_RESULT,SEC_ISSUE,SEC_PLAN],{byOwner:isPM,prev:prev?{report:prev,items:carry,done:SEC_RESULT,todo:SEC_PLAN}:undefined});
 const total=options.reduce((n,o)=>n+o.groups.reduce((m,g)=>m+g.items.length,0),0);

 // Liên kết gợi ý (viền nét đứt): KR/KS/Mốc của các nguồn đã dùng mà user chưa gắn.
 const usedSources=[...new Set(r.sections.flatMap(s=>s.sources))];
 const relSuggest=[...new Set(usedSources.flatMap(id=>data.reports.find(x=>x.id===id)?.relations??[]))].filter(id=>{const t=entities.find(e=>e.id===id)?.type;return t&&t!=='Project'&&t!=='EKS'});
 const hasText=r.sections.some(s=>s.text.trim());
 const dirty=!saved&&JSON.stringify(r)!==JSON.stringify(base);
 const patch=(p:Partial<Report>)=>{setR(x=>({...x,...p}));setSaved(false)};
 // Chèn vào đúng mục, ghi nguồn; dự án của nguồn được gắn luôn (bấm ＋ đã là đồng ý), gỡ bằng × nếu không muốn.
 // Hai dạng của cùng một việc trong kế hoạch tuần trước (Hoàn thành / Tiếp tục) dùng chung một dấu đã thêm.
 const insert=(sourceId:string,label:string,key:string,text:string)=>{
  const proj=data.reports.find(x=>x.id===sourceId)?.relations.find(id=>entities.find(e=>e.id===id)?.type==='Project');
  setR(x=>({...x,relations:proj&&!isPM&&!x.relations.includes(proj)?[...x.relations,proj]:x.relations,sections:x.sections.map(s=>s.label===label?{...s,text:(s.text.trim()?s.text.replace(/\s+$/,'')+'\n':'')+'• '+text,sources:[...new Set([...s.sources,sourceId])]}:s)}));
  setSaved(false);setAdded(a=>[...a,...addedKeys(key)]);
 };
 const save=()=>{const next={...r,status:'DRAFT' as const};saveReport(next);setR(next);setSaved(true);setSavedAt(nowTime());notify('Đã lưu bản nháp')};
 const leave=()=>dirty?setLeaving(true):close();

 if(r.status==='PUBLISHED')return <EditorFrame back={close} backLabel="Về danh sách" actions={<Badge tone="success">Đã gửi</Badge>}>
  <h1 className="doc-title">{r.title}</h1>
  <article className="reading"><ReportBody report={r} open={source}/></article>
 </EditorFrame>;

 const panels:EditorPanel[]=[
  {key:'suggest',label:'Lấy từ báo cáo',icon:<Sparkle/>,render:()=><SourcePicker title="Lấy từ báo cáo" options={options} added={added} onAdd={insert} openSource={source} empty={isPM?'Kỳ này chưa có báo cáo của team.':'Tuần này chưa có báo cáo dự án.'}/>},
  {key:'old',label:'Báo cáo cũ',icon:<ClockCounterClockwise/>,render:()=><OldReportsPanel ids={oldIds} open={source}/>},
 ];
 return <EditorFrame back={leave} panels={panels} panel={panel} onPanel={setPanel} onSave={()=>save()}
  actions={<><SaveState dirty={dirty} savedAt={saved?savedAt:undefined}/>{total>0&&<Button quiet className={panel==='suggest'?'active-filter':''} onClick={()=>setPanel(panel==='suggest'?'old':'suggest')}><Sparkle/> Lấy từ báo cáo</Button>}<Button onClick={()=>save()} title="Lưu nháp (Ctrl S)"><FloppyDisk/> Lưu nháp</Button><Button primary disabled={!r.title.trim()||!hasText} title={!r.title.trim()?'Đặt tên báo cáo để gửi':!hasText?'Viết ít nhất một mục để gửi':undefined} onClick={()=>publish(r)}><PaperPlaneTilt/> Xuất bản</Button></>}>
  <input className="title-input" aria-label="Tên báo cáo" value={r.title} onChange={e=>patch({title:e.target.value})}/>
  <MetaRow label="Quản lý trực tiếp"><UserChip/></MetaRow>
  <MetaRow label="Loại báo cáo"><TrackSelect value={r.track} onChange={t=>patch({track:t})}/></MetaRow>
  <MetaRow label="Liên kết"><EntityRelationPicker value={r.relations} onChange={v=>patch({relations:v})} locked={isPM?[projectId!]:[]} suggestions={relSuggest}/></MetaRow>
  <div className="divider"/>
  {r.sections.map((s,i)=><div className="ws" key={i}><h3>{s.label}{s.text.trim()&&<CheckCircle weight="fill" className="ws-done" aria-label="Đã viết"/>}</h3><AutoTextarea className="block-text" aria-label={s.label} value={s.text} placeholder={PLACEHOLDER[s.label]??'Nhập nội dung…'} onChange={e=>patch({sections:r.sections.map((x,j)=>j===i?{...x,text:e.target.value,sources:e.target.value.trim()?x.sources:[]}:x)})} rows={Math.max(3,s.text.split('\n').length+1)}/>{s.text.trim()&&s.sources.length>0&&<SourceButton ids={s.sources} open={source}/>}</div>)}
  {leaving&&<LeaveDialog stay={()=>setLeaving(false)} discard={close} save={()=>{save();close()}}/>}
 </EditorFrame>;
}
