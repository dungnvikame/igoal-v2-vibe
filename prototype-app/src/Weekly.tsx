import React,{useState} from 'react';
import {Sparkle,FloppyDisk,PaperPlaneTilt,ClockCounterClockwise,CheckCircle,Flag,TextAlignLeft,X} from 'phosphor-react';
import {Report,Section,entities,projects,reportWriters,previousWeekly,carryItems,weeklySuggestions,SuggestCtx,Suggestion,section,blocksOf} from './model';
import {useStore} from './store';
import {TrackSelect} from './Project';
import {Button,SourceButton,EntityRelationPicker,Badge,ReportBody,LeaveDialog,EditorFrame,EditorPanel,OldReportsPanel,UserChip,MetaRow,SaveState,Modal,nowTime} from './ui';
import {SourcePicker,buildSourceOptions,addedKeys} from "./SourcePicker";
import {SlashTextarea,SlashItem} from './SlashMenu';
import {EksAlignmentSummary} from './Alignment';

/** Tuần báo cáo hiện tại (mock): gợi ý chỉ quét bản ghi từ ngày này. */
const WEEK_FROM='2026-09-15';
/** Mẫu 3 mục của một khung (chung hoặc dự án). "Kế hoạch tuần tới" là nguồn carry-over cho tuần sau. "Khó khăn" không bắt buộc. */
const SEC_RESULT='Kết quả tuần này',SEC_ISSUE='Khó khăn / vấn đề',SEC_PLAN='Kế hoạch tuần tới';
const TEMPLATE=(project?:string):Section[]=>[SEC_RESULT,SEC_ISSUE,SEC_PLAN].map(l=>project?{...section(l,''),project}:section(l,''));
const OPTIONAL=[SEC_ISSUE];
const PLACEHOLDER:Record<string,string>={[SEC_RESULT]:'Việc đã làm, kết quả đạt được…',[SEC_ISSUE]:'Đang vướng ở đâu, cần hỗ trợ gì…',[SEC_PLAN]:'Tuần tới sẽ làm gì…'};
/** Mục nào nhận loại gợi ý nào. */
const TARGET:Record<Suggestion['kind'],string>={result:SEC_RESULT,decision:SEC_RESULT,checkin:SEC_RESULT,issue:SEC_ISSUE,plan:SEC_PLAN};
const GENERAL='general';
const blockKey=(project?:string)=>project??GENERAL;
const projectLabel=(id:string)=>projects.find(p=>p.id===id)?.label??id;

/**
 * Báo cáo tuần: mở ra là trang trắng. Gõ "/" để chèn khung:
 * - "Báo cáo chung": 3 mục cho mọi công việc (gõ chữ thường vào trang trắng cũng tạo khung này).
 * - "Báo cáo dự án › <dự án>": khung riêng, mỗi mục có `project`. Khi xuất bản, bản ở dự án đó chỉ lấy nội dung khung này (publishing.ts),
 *   nên người dùng viết một lần ở My EKS mà nội dung vẫn đi đúng về báo cáo dự án. Chỉ hiện dự án user có quyền viết báo cáo.
 * AI là panel "Lấy từ báo cáo" ở cột phải: dòng lấy từ báo cáo dự án đi vào khung của dự án đó (nếu có), còn lại vào báo cáo chung.
 * Member: nguồn là báo cáo dự án tuần này + báo cáo tuần trước của chính mình. PM: báo cáo tuần của member + check-in (không có khung dự án).
 */
export function Weekly({initial,close,source,notify,publish}:{initial:Report;close:()=>void;source:(id:string)=>void;notify:(s:string)=>void;publish:(r:Report)=>void}){
 const {data,user,saveReport}=useStore();
 const isPM=initial.scope==='project';const projectId=isPM?initial.relations[0]:undefined;
 // Member: EKS của chính mình gắn sẵn (gỡ bằng ×). PM: dự án đang mở đã gắn và khóa.
 const [base]=useState<Report>(()=>{const relations=isPM||initial.relations.length?initial.relations:entities.filter(e=>e.type==='EKS').map(e=>e.id);return {...initial,relations}});
 const [r,setR]=useState<Report>(base);
 const [saved,setSaved]=useState(false),[savedAt,setSavedAt]=useState(''),[leaving,setLeaving]=useState(false),[panel,setPanel]=useState<string|null>('old'),[added,setAdded]=useState<string[]>([]);
 const [starter,setStarter]=useState(''),[focus,setFocus]=useState<string|null>(null),[removing,setRemoving]=useState<string|null>(null);
 const ctx:SuggestCtx=isPM?{scope:'project',projectId:projectId!}:{scope:'personal'};
 const prev=previousWeekly(data.reports,r.id,initial.scope,projectId,isPM?undefined:initial.owner);const carry=carryItems(prev);
 const suggestions=weeklySuggestions(data.reports,WEEK_FROM,ctx);
 const oldIds=data.reports.filter(x=>x.kind==='weekly'&&x.scope===initial.scope&&x.status==='PUBLISHED'&&x.id!==r.id&&(isPM?x.relations.includes(projectId!):x.owner===initial.owner)).map(x=>x.id);

 // Danh sách báo cáo nguồn: báo cáo tuần trước (nếu có) đứng đầu, sau đó các báo cáo có gợi ý, mới nhất trước.
 const options=buildSourceOptions(data.reports,suggestions,k=>TARGET[k],[SEC_RESULT,SEC_ISSUE,SEC_PLAN],{byOwner:isPM,prev:prev?{report:prev,items:carry,done:SEC_RESULT,todo:SEC_PLAN}:undefined});
 const total=options.reduce((n,o)=>n+o.groups.reduce((m,g)=>m+g.items.length,0),0);

 // Khung đang có + các khung còn chèn được bằng "/".
 const blocks=blocksOf(r.sections);const has=(project?:string)=>r.sections.some(s=>s.project===project);
 const writable=isPM?[]:projects.filter(p=>reportWriters[p.id]?.includes(user));
 const slashItems:SlashItem[]=[
  ...(!has(undefined)?[{id:GENERAL,label:'Báo cáo chung',hint:'Kết quả · Khó khăn · Kế hoạch cho mọi công việc',group:'Báo cáo',icon:<TextAlignLeft/>}]:[]),
  ...writable.filter(p=>!has(p.id)).map(p=>({id:p.id,label:p.label,hint:'Khung riêng · xuất hiện ở báo cáo dự án '+p.label,group:'Báo cáo dự án',icon:<Flag/>})),
 ];

 // Liên kết gợi ý (viền nét đứt): KR/KS/Mốc của các nguồn đã dùng mà user chưa gắn.
 const usedSources=[...new Set(r.sections.flatMap(s=>s.sources))];
 const relSuggest=[...new Set(usedSources.flatMap(id=>data.reports.find(x=>x.id===id)?.relations??[]))].filter(id=>{const t=entities.find(e=>e.id===id)?.type;return t&&t!=='Project'&&t!=='EKS'&&(isPM||t!=='Milestone')});
 const hasText=r.sections.some(s=>s.text.trim());
 const dirty=!saved&&JSON.stringify(r)!==JSON.stringify(base);
 const patch=(p:Partial<Report>)=>{setR(x=>({...x,...p}));setSaved(false)};
 // Khung chung luôn đứng đầu; khung dự án thêm vào cuối và tự gắn dự án vào Liên kết.
 const withBlock=(x:Report,project?:string):Report=>x.sections.some(s=>s.project===project)?x:{...x,sections:project?[...x.sections,...TEMPLATE(project)]:[...TEMPLATE(),...x.sections],relations:project&&!x.relations.includes(project)?[...x.relations,project]:x.relations};
 const addBlock=(id:string,firstText=''):void=>{const project=id===GENERAL?undefined:id;setR(x=>{const n=withBlock(x,project);if(!firstText)return n;const i=n.sections.findIndex(s=>s.project===project);return {...n,sections:n.sections.map((s,j)=>j===i?{...s,text:firstText}:s)}});setSaved(false);setFocus(blockKey(project))};
 const removeBlock=(key:string)=>{const project=key===GENERAL?undefined:key;setR(x=>({...x,sections:x.sections.filter(s=>s.project!==project)}));setSaved(false);setRemoving(null)};
 // Chèn vào đúng mục, ghi nguồn. Dòng từ báo cáo dự án → khung của dự án đó nếu đã có; không thì vào báo cáo chung; trang còn trắng → tạo khung dự án.
 // Dự án của nguồn được gắn luôn (bấm ＋ đã là đồng ý), gỡ bằng × nếu không muốn. Hai dạng của cùng một việc kế hoạch tuần trước dùng chung một dấu đã thêm.
 const insert=(sourceId:string,label:string,key:string,text:string)=>{
  const src=data.reports.find(x=>x.id===sourceId);const proj=src?.relations.find(id=>entities.find(e=>e.id===id)?.type==='Project');
  const own=src?.scope==='project'&&proj&&writable.some(p=>p.id===proj)?proj:undefined;
  setR(x0=>{const exists=(p?:string)=>x0.sections.some(s=>s.project===p);const dest=own&&exists(own)?own:exists(undefined)?undefined:own;const x=withBlock(x0,dest);
   return {...x,relations:proj&&!isPM&&!x.relations.includes(proj)?[...x.relations,proj]:x.relations,sections:x.sections.map(s=>s.label===label&&s.project===dest?{...s,text:(s.text.trim()?s.text.replace(/\s+$/,'')+'\n':'')+'• '+text,sources:[...new Set([...s.sources,sourceId])]}:s)}});
  setSaved(false);setAdded(a=>[...a,...addedKeys(key)]);
 };
 const setText=(i:number,text:string)=>setR(x=>({...x,sections:x.sections.map((s,j)=>j===i?{...s,text,sources:text.trim()?s.sources:[]}:s)}));
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
 const slashHint=slashItems.length?' · gõ / để thêm khung':'';
 const removingBlock=removing?blocks.find(b=>blockKey(b.project)===removing):undefined;
 return <EditorFrame back={leave} panels={panels} panel={panel} onPanel={setPanel} onSave={()=>save()}
  actions={<><SaveState dirty={dirty} savedAt={saved?savedAt:undefined}/>{total>0&&<Button quiet className={panel==='suggest'?'active-filter':''} onClick={()=>setPanel(panel==='suggest'?'old':'suggest')}><Sparkle/> Lấy từ báo cáo</Button>}<Button onClick={()=>save()} title="Lưu nháp (Ctrl S)"><FloppyDisk/> Lưu nháp</Button><Button primary disabled={!r.title.trim()||!hasText} title={!r.title.trim()?'Đặt tên báo cáo để gửi':!hasText?'Viết ít nhất một mục để gửi':undefined} onClick={()=>publish(r)}><PaperPlaneTilt/> Xuất bản</Button></>}>
  <input className="title-input" aria-label="Tên báo cáo" value={r.title} onChange={e=>patch({title:e.target.value})}/>
  <MetaRow label="Quản lý trực tiếp"><UserChip/></MetaRow>
  <MetaRow label="Loại báo cáo"><TrackSelect value={r.track} onChange={t=>patch({track:t})}/></MetaRow>
  <MetaRow label="Liên kết"><EntityRelationPicker value={r.relations} onChange={v=>patch({relations:v})} locked={isPM?[projectId!]:[]} suggestions={relSuggest} personal={!isPM}/></MetaRow>
  {!isPM&&<MetaRow label="Đóng góp cho"><EksAlignmentSummary relations={r.relations}/></MetaRow>}
  <div className="divider"/>
  {blocks.map(b=>{const key=blockKey(b.project);const isProject=!!b.project;
   return <section key={key} className={'wblock'+(isProject?' project':'')} aria-label={isProject?'Báo cáo dự án '+projectLabel(b.project!):'Báo cáo chung'}>
    <header className="wblock-head">{isProject?<><span className="wblock-tag"><Flag weight="fill"/> Báo cáo dự án</span><strong>{projectLabel(b.project!)}</strong><small>Xuất hiện ở Tổng hợp báo cáo dự án {projectLabel(b.project!)} khi xuất bản</small></>:<><span className="wblock-tag"><TextAlignLeft/> Báo cáo chung</span>{blocks.length>1&&<small>Xuất hiện ở My EKS và nơi bạn chọn khi xuất bản</small>}</>}
     <button className="wblock-x" aria-label={'Bỏ khung '+(isProject?projectLabel(b.project!):'báo cáo chung')} title="Bỏ khung" onClick={()=>b.items.some(({s})=>s.text.trim())?setRemoving(key):removeBlock(key)}><X size={14}/></button></header>
    {b.items.map(({s,i},j)=><div className="ws" key={i}><h3>{s.label}{OPTIONAL.includes(s.label)&&<small className="ws-optional">(không bắt buộc)</small>}{s.text.trim()&&<CheckCircle weight="fill" className="ws-done" aria-label="Đã viết"/>}</h3>
     <SlashTextarea className="block-text" aria-label={isProject?s.label+' · '+projectLabel(b.project!):s.label} value={s.text} items={slashItems} onPick={id=>addBlock(id)} focusNow={j===0&&focus===key}
      placeholder={(PLACEHOLDER[s.label]??'Nhập nội dung…')+(j===0?slashHint:'')} onChange={v=>{setText(i,v);setSaved(false)}} rows={Math.max(3,s.text.split('\n').length+1)}/>
     {s.text.trim()&&s.sources.length>0&&<SourceButton ids={s.sources} open={source}/>}</div>)}
   </section>})}
  {/* Dòng lệnh cuối trang: trang trắng thì gõ chữ = bắt đầu báo cáo chung; đã có khung thì chỉ nhận "/". */}
  {(slashItems.length>0||!blocks.length)&&<div className={'wstarter'+(blocks.length?' tail':'')}>
   <SlashTextarea className="block-text" aria-label="Thêm khung báo cáo" value={starter} items={slashItems} onPick={id=>addBlock(id)} rows={blocks.length?1:3}
    placeholder={blocks.length?'Gõ / để thêm khung báo cáo dự án…':'Bắt đầu viết báo cáo chung, hoặc gõ / để chọn Báo cáo chung / Báo cáo dự án…'}
    onChange={v=>{if(v&&!v.startsWith('/')){if(!has(undefined)){setStarter('');addBlock(GENERAL,v)}return}setStarter(v)}}/>
  </div>}
  {removingBlock&&<Modal title={'Bỏ khung '+(removingBlock.project?'báo cáo dự án '+projectLabel(removingBlock.project):'báo cáo chung')+'?'} subtitle="Nội dung đã viết trong khung này sẽ bị xóa khỏi bản nháp." close={()=>setRemoving(null)}><div className="form-actions"><Button onClick={()=>setRemoving(null)}>Giữ lại</Button><Button primary onClick={()=>removeBlock(removing!)}>Bỏ khung</Button></div></Modal>}
  {leaving&&<LeaveDialog stay={()=>setLeaving(false)} discard={close} save={()=>{save();close()}}/>}
 </EditorFrame>;
}
