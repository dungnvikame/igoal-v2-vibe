import React,{useState} from 'react';
import {Sparkle,FloppyDisk,PaperPlaneTilt,ClockCounterClockwise} from 'phosphor-react';
import {Report,Suggestion,entities,section,weeklySuggestions} from './model';
import {useStore} from './store';
import {TrackSelect} from './Project';
import {Button,SourceButton,EntityRelationPicker,LeaveDialog,EditorFrame,EditorPanel,OldReportsPanel,UserChip,MetaRow,AutoTextarea,SaveState} from './ui';
import {SourcePicker,buildSourceOptions,addedKeys} from './SourcePicker';

/** Báo cáo tức thời: cập nhật nhanh 3 mục. Nguồn gợi ý lấy trong 7 ngày gần nhất, cùng cách với báo cáo tuần. */
const FROM='2026-09-15';
const SEC_RESULT='Kết quả / cập nhật',SEC_ISSUE='Vấn đề / hỗ trợ',SEC_PLAN='Kế hoạch tiếp theo';
const PLACEHOLDER:Record<string,string>={[SEC_RESULT]:'Có gì mới cần mọi người biết…',[SEC_ISSUE]:'Đang vướng ở đâu, cần ai hỗ trợ…',[SEC_PLAN]:'Bước tiếp theo…'};
const TARGET=(k:Suggestion['kind'])=>k==='plan'?SEC_PLAN:k==='issue'?SEC_ISSUE:SEC_RESULT;

/** Editor báo cáo tức thời: meta trên cùng, 3 mục, panel phải "Lấy từ báo cáo" (2 bước) và "Báo cáo cũ". */
export function SimpleReport({initial,close,source,notify,publish}:{initial:Report;close:()=>void;source:(id:string)=>void;notify:(s:string)=>void;publish:(r:Report)=>void}){
 const {data,saveReport}=useStore();
 const isProject=initial.scope==='project';const projectId=isProject?initial.relations[0]:undefined;
 const [base]=useState<Report>(()=>({...initial,sections:initial.sections.length?initial.sections:[section(SEC_RESULT,''),section(SEC_ISSUE,''),section(SEC_PLAN,'')]}));
 const [r,setR]=useState<Report>(base),[saved,setSaved]=useState(false),[leaving,setLeaving]=useState(false),[panel,setPanel]=useState<string|null>('old'),[added,setAdded]=useState<string[]>([]);
 const suggestions=weeklySuggestions(data.reports,FROM,isProject?{scope:'project',projectId:projectId!}:{scope:'personal'}).filter(s=>s.source!==r.id);
 const options=buildSourceOptions(data.reports,suggestions,TARGET,[SEC_RESULT,SEC_ISSUE,SEC_PLAN],{byOwner:isProject});
 const oldIds=data.reports.filter(x=>x.kind==='instant'&&x.status==='PUBLISHED'&&x.scope===initial.scope&&x.id!==r.id&&(!isProject||x.relations.includes(projectId!))).map(x=>x.id);
 const usedSources=[...new Set(r.sections.flatMap(s=>s.sources))];
 const relSuggest=[...new Set(usedSources.flatMap(id=>data.reports.find(x=>x.id===id)?.relations??[]))].filter(id=>{const t=entities.find(e=>e.id===id)?.type;return t&&t!=='Project'&&t!=='EKS'});
 const dirty=!saved&&JSON.stringify(r)!==JSON.stringify(base);
 const patch=(p:Partial<Report>)=>{setR(x=>({...x,...p}));setSaved(false)};
 const insert=(sourceId:string,label:string,key:string,text:string)=>{
  const proj=data.reports.find(x=>x.id===sourceId)?.relations.find(id=>entities.find(e=>e.id===id)?.type==='Project');
  setR(x=>({...x,relations:proj&&!isProject&&!x.relations.includes(proj)?[...x.relations,proj]:x.relations,sections:x.sections.map(s=>s.label===label?{...s,text:(s.text.trim()?s.text.replace(/\s+$/,'')+'\n':'')+'• '+text,sources:[...new Set([...s.sources,sourceId])]}:s)}));
  setSaved(false);setAdded(a=>[...a,...addedKeys(key)]);
 };
 const save=(status:Report['status'])=>{saveReport({...r,status});setSaved(true);notify(status==='DRAFT'?'Đã lưu nháp':'Đã gửi báo cáo');close()};
 const panels:EditorPanel[]=[
  {key:'suggest',label:'Lấy từ báo cáo',icon:<Sparkle/>,render:()=><SourcePicker title="Lấy từ báo cáo" options={options} added={added} onAdd={insert} openSource={source} empty="Chưa có báo cáo gần đây."/>},
  {key:'old',label:'Báo cáo cũ',icon:<ClockCounterClockwise/>,render:()=><OldReportsPanel ids={oldIds} open={source}/>},
 ];
 return <EditorFrame back={()=>dirty?setLeaving(true):close()} panels={panels} panel={panel} onPanel={setPanel}
  actions={<><SaveState dirty={dirty}/>{options.length>0&&<Button quiet className={panel==='suggest'?'active-filter':''} onClick={()=>setPanel(panel==='suggest'?'old':'suggest')}><Sparkle/> Lấy từ báo cáo</Button>}<Button onClick={()=>save('DRAFT')}><FloppyDisk/> Lưu nháp</Button><Button primary disabled={!r.title.trim()||!r.sections.some(s=>s.text.trim())} onClick={()=>publish(r)}><PaperPlaneTilt/> Xuất bản</Button></>}>
  <input className="title-input" aria-label="Tên báo cáo" value={r.title} onChange={e=>patch({title:e.target.value})}/>
  <MetaRow label="Quản lý trực tiếp"><UserChip/></MetaRow>
  <MetaRow label="Loại báo cáo"><TrackSelect value={r.track} onChange={t=>patch({track:t})}/></MetaRow>
  <MetaRow label="Liên kết"><EntityRelationPicker value={r.relations} onChange={v=>patch({relations:v})} locked={isProject?[projectId!]:[]} suggestions={relSuggest}/></MetaRow>
  <div className="divider"/>
  {r.sections.map((s,i)=><div className="ws" key={i}><h3>{s.label}</h3><AutoTextarea className="block-text" aria-label={s.label} rows={Math.max(3,s.text.split('\n').length+1)} value={s.text} placeholder={PLACEHOLDER[s.label]??'Nhập nội dung…'} onChange={e=>patch({sections:r.sections.map((x,j)=>i===j?{...x,text:e.target.value,sources:e.target.value.trim()?x.sources:[]}:x)})}/>{s.sources.length>0&&<SourceButton ids={s.sources} open={source}/>}</div>)}
  {leaving&&<LeaveDialog stay={()=>setLeaving(false)} discard={close} save={()=>save('DRAFT')}/>}
 </EditorFrame>;
}
