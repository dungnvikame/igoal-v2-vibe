import React,{useState} from 'react';
import {X,Plus,Check,Paperclip,PaperPlaneTilt,FloppyDisk,Sparkle,ClockCounterClockwise,Target} from 'phosphor-react';
import {Report,Checkin as CheckinCard,Suggestion,blankCheckin,entities,section,lines} from './model';
import {useStore} from './store';
import {Button,EditorFrame,EditorPanel,UserChip,MetaRow,EntityRelationPicker,LeaveDialog,SourceButton,AutoTextarea,SaveState} from './ui';
import {GoalHistory} from './Related';
import {SourcePicker,buildSourceOptions} from './SourcePicker';
import {codeOf,nameOf} from './RelationPicker';

type Field='result'|'next'|'issue';
const FIELD_LABEL:Record<Field,string>={result:'Kết quả đã làm',next:'Bước tiếp theo',issue:'Khó khăn'};
const LABEL_FIELD:Record<string,Field>={[FIELD_LABEL.result]:'result',[FIELD_LABEL.next]:'next',[FIELD_LABEL.issue]:'issue'};
const PLACEHOLDER:Record<Field,string>={result:'Đã hoàn thành những gì?',next:'Sẽ làm gì tiếp theo?',issue:'Đang vướng ở đâu?'};
const TARGET=(k:Suggestion['kind'])=>k==='plan'?FIELD_LABEL.next:k==='issue'?FIELD_LABEL.issue:FIELD_LABEL.result;
/** Không có check-in trước thì lấy nguồn 30 ngày gần nhất (mock "hôm nay" 22/09). */
const FALLBACK_FROM='2026-08-23';

/**
 * Báo cáo check-in: mỗi KS một card (tiến độ + Kết quả đã làm + Bước tiếp theo + Khó khăn + file). Tiến độ chỉ lưu trong báo cáo, không mutation KS.
 * Panel phải "Lấy từ báo cáo" theo card đang làm: nguồn là báo cáo đã tag KS đó kể từ lần check-in trước, dòng chèn vào đúng ô của card.
 */
export function CheckinReport({initial,close,source,notify}:{initial:Report;close:()=>void;source:(id:string)=>void;notify:(s:string)=>void}){
 const {data,saveReport}=useStore();
 const [base]=useState<Report>(()=>({...initial,checkins:initial.checkins??[],sections:initial.sections.length?initial.sections:[section('Ghi chú thêm','')]}));
 const [r,setR]=useState<Report>(base),[saved,setSaved]=useState(false),[leaving,setLeaving]=useState(false),[panel,setPanel]=useState<string|null>(initial.checkins?.length?'suggest':'ks'),[added,setAdded]=useState<string[]>([]),[active,setActive]=useState<string|null>(initial.checkins?.[0]?.ksId??null);
 const cards=r.checkins??[];
 const dirty=!saved&&JSON.stringify(r)!==JSON.stringify(base);
 const patch=(p:Partial<Report>)=>{setR(x=>({...x,...p}));setSaved(false)};
 const patchCard=(ksId:string,p:Partial<CheckinCard>)=>setR(x=>({...x,checkins:(x.checkins??[]).map(c=>c.ksId===ksId?{...c,...p}:c)}));
 // Card mới lấy tiến độ hiện tại của KS làm điểm xuất phát.
 const addKs=(id:string)=>{patch({checkins:[...cards,{...blankCheckin(id),progress:entities.find(e=>e.id===id)?.progress??0}]});setActive(id)};
 const valid=cards.length>0&&cards.every(c=>c.result.trim()&&c.next.trim());
 const save=(status:Report['status'])=>{saveReport({...r,status,relations:[...new Set([...r.relations,...cards.map(c=>c.ksId)])]});setSaved(true);notify(status==='DRAFT'?'Đã lưu nháp':'Đã gửi báo cáo check-in');close()};


 // Nguồn cho KS đang chọn: báo cáo đã gửi, tag KS này, sau lần check-in gần nhất của KS.
 const activeKs=entities.find(e=>e.id===active);
 const lastCheckin=data.reports.filter(x=>x.kind==='checkin'&&x.status==='PUBLISHED'&&x.id!==r.id&&x.checkins?.some(c=>c.ksId===active)).sort((a,b)=>b.date.localeCompare(a.date))[0];
 const from=lastCheckin?.date??FALLBACK_FROM;
 const sugg=active?data.reports.filter(x=>x.status==='PUBLISHED'&&x.kind!=='checkin'&&x.relations.includes(active)&&x.date>=from).flatMap(x=>lines(x,active)).map(s=>({...s,id:active+'·'+s.id})):[];
 const options=buildSourceOptions(data.reports,sugg,TARGET,[FIELD_LABEL.result,FIELD_LABEL.next,FIELD_LABEL.issue]);
 const insert=(sourceId:string,label:string,key:string,text:string)=>{if(!active)return;const f=LABEL_FIELD[label];const c=cards.find(x=>x.ksId===active);if(!c)return;patchCard(active,{[f]:(c[f].trim()?c[f].replace(/\s+$/,'')+'\n':'')+'• '+text});setR(x=>({...x,sections:x.sections.map((s,i)=>i===0?{...s,sources:[...new Set([...s.sources,sourceId])]}:s)}));setSaved(false);setAdded(a=>[...a,key])};
 const ctxSelect=cards.length>1?<label className="sp-ctx">Chèn vào<select value={active??''} onChange={e=>setActive(e.target.value)}>{cards.map(c=>{const k=entities.find(e=>e.id===c.ksId);return <option key={c.ksId} value={c.ksId}>{k?codeOf(k)+' · '+nameOf(k):c.ksId}</option>})}</select></label>:activeKs?<p className="sp-ctx">Chèn vào <b>{codeOf(activeKs)}</b> · {nameOf(activeKs)}</p>:null;
 const objectives=entities.filter(e=>e.type==='Objective');
 // Panel theo việc đang làm: chưa có KS → "Chọn KS"; đã có → "Lấy từ báo cáo" cho KS đang chọn; "Lịch sử KS" để đối chiếu các lần check-in trước.
 const KsPanel=()=><div className="sp">
  <div className="sp-head"><h3>Chọn KS</h3></div>
  <p className="sp-meta">Bấm để thêm card cập nhật tiến độ.</p>
  <div className="rp-list plain">{objectives.map(o=>{const ks=entities.filter(e=>e.type==='KS'&&e.project===o.project);return ks.length?<div key={o.id}><div className="rp-group">{nameOf(o)}</div>{ks.map(k=>{const used=cards.some(c=>c.ksId===k.id);return <button key={k.id} className={'rp-row'+(used?' on':'')} onClick={()=>used?setActive(k.id):addKs(k.id)} title={used?'Đã có card – bấm để chọn':'Thêm card'}><span className="rp-code">{codeOf(k)}</span><span className="rp-name">{nameOf(k)}</span>{used?<Check size={16}/>:<small className="hint">{k.progress??0}%</small>}</button>})}</div>:null})}</div>
 </div>;
 const panels:EditorPanel[]=[
  {key:'ks',label:'Chọn KS',icon:<Target/>,render:()=><KsPanel/>},
  ...(cards.length?[
   {key:'suggest',label:'Lấy từ báo cáo',icon:<Sparkle/>,render:()=><SourcePicker title="Lấy từ báo cáo" options={options} added={added} onAdd={insert} openSource={source} context={ctxSelect} empty="Chưa có báo cáo nào tag KS này kể từ lần check-in trước."/>},
   ...(active?[{key:'history',label:'Lịch sử KS',icon:<ClockCounterClockwise/>,render:()=><GoalHistory key={active} id={active} close={()=>setPanel(null)} open={source}/>}]:[]),
  ] as EditorPanel[]:[]),
 ];
 const usedSources=r.sections[0]?.sources??[];

 return <EditorFrame back={()=>dirty?setLeaving(true):close()} panels={panels} panel={panel} onPanel={setPanel}
  actions={<><SaveState dirty={dirty}/>{cards.length>0&&<Button quiet className={panel==='suggest'?'active-filter':''} onClick={()=>setPanel(panel==='suggest'?'ks':'suggest')}><Sparkle/> Lấy từ báo cáo</Button>}<Button onClick={()=>save('DRAFT')}><FloppyDisk/> Lưu nháp</Button><Button primary disabled={!valid} onClick={()=>save('PUBLISHED')}><PaperPlaneTilt/> Gửi báo cáo</Button></>}>
  <input className="title-input" aria-label="Tên báo cáo" value={r.title} onChange={e=>patch({title:e.target.value})}/>
  <MetaRow label="Quản lý trực tiếp"><UserChip/></MetaRow>
  <MetaRow label="Liên kết"><EntityRelationPicker value={r.relations} locked={initial.scope==='project'?[initial.relations[0]]:[]} onChange={v=>patch({relations:v})}/></MetaRow>
  <div className="divider"/>
  {cards.map(c=>{const ks=entities.find(e=>e.id===c.ksId);const was=ks?.progress??0;return <section className={'ks-card2'+(active===c.ksId?' active':'')+(active===c.ksId&&panel==='suggest'?' target':'')} key={c.ksId} onFocusCapture={()=>setActive(c.ksId)} onClick={()=>setActive(c.ksId)}>
   <header><span className="ks-code">{ks?codeOf(ks):''}</span><h3>{ks?nameOf(ks):c.ksId}</h3><button className="icon-x" aria-label="Bỏ KS này" onClick={e=>{e.stopPropagation();patch({checkins:cards.filter(x=>x.ksId!==c.ksId)});if(active===c.ksId)setActive(cards.find(x=>x.ksId!==c.ksId)?.ksId??null)}}><X/></button></header>
   <div className="ks-progress"><input type="range" min={0} max={100} value={c.progress} aria-label="Tiến độ" onChange={e=>patchCard(c.ksId,{progress:+e.target.value})}/><strong>{c.progress}%</strong>{c.progress!==was&&<span className="hint">từ {was}%</span>}</div>
   {(['result','next','issue'] as Field[]).map(f=><div className="ks-field" key={f}><label>{FIELD_LABEL[f]}{f!=='issue'&&<em>*</em>}</label><AutoTextarea className="block-text" aria-label={FIELD_LABEL[f]} rows={Math.max(2,c[f].split('\n').length+1)} value={c[f]} placeholder={PLACEHOLDER[f]} onChange={e=>patchCard(c.ksId,{[f]:e.target.value})}/></div>)}
   <label className="attach">{c.file?<><Paperclip/> {c.file}</>:<><Paperclip/> Đính file</>}<input type="file" aria-label="Đính file" onChange={e=>patchCard(c.ksId,{file:e.target.files?.[0]?.name||''})}/></label>
  </section>})}
  <button className="add-ks" onClick={()=>setPanel('ks')}><Plus/> {cards.length?'Thêm KS':'Chọn KS cần cập nhật tiến độ'}</button>
  {r.sections.map((s,i)=><div className="ws" key={i}><h3>{s.label}</h3><AutoTextarea className="block-text" aria-label={s.label} value={s.text} placeholder="Thông tin khác (không bắt buộc)…" rows={Math.max(2,s.text.split('\n').length+1)} onChange={e=>patch({sections:r.sections.map((x,j)=>i===j?{...x,text:e.target.value}:x)})}/></div>)}
  {usedSources.length>0&&<div className="row wrap"><span className="hint">Nguồn:</span><SourceButton ids={usedSources} open={source}/></div>}
  {leaving&&<LeaveDialog stay={()=>setLeaving(false)} discard={close} save={()=>save('DRAFT')}/>}
 </EditorFrame>;
}
