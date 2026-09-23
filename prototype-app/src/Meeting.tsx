import React,{useEffect,useState} from 'react';
import {ArrowRight,ArrowLeft,UploadSimple,Sparkle,Check,CheckCircle,FileAudio,Plus,Trash,PaperPlaneTilt,FloppyDisk,MagnifyingGlass,ClockCounterClockwise,Microphone} from 'phosphor-react';
import {Report,meetingDraft,transcript,dateLabel} from './model';
import {useStore} from './store';
import {Button,Badge,EntityRelationPicker,ReportBody,LeaveDialog,EditorFrame,EditorPanel,OldReportsPanel,MetaRow,AutoTextarea,SaveState,nowTime} from './ui';
import {TrackSelect} from './Project';
const CLEAR_SUFFIX='Phạm vi áp dụng: Sprint 1 của dự án iGoal.';
export function Meeting({initial,close,done,notify,source}:{initial:Report;close:()=>void;done:(id:string)=>void;notify:(s:string)=>void;source:(id:string)=>void}){
 const {saveReport}=useStore();const [r,setR]=useState(initial),[step,setStep]=useState(initial.sections.length?2:0),[progress,setProgress]=useState(0),[q,setQ]=useState(''),[preview,setPreview]=useState('iGoal'),[fail,setFail]=useState(false),[error,setError]=useState(''),[wording,setWording]=useState(-1),[retrying,setRetrying]=useState(false),[dirty,setDirty]=useState(false),[savedAt,setSavedAt]=useState(''),[leaving,setLeaving]=useState(false);
 const patch=(p:Partial<Report>)=>{setR(x=>({...x,...p,reviewed:false}));setDirty(true)};
 useEffect(()=>{if(step!==1)return;let n=0;const t=setInterval(()=>{n++;setProgress(n);if(n===4){clearInterval(t);setR(x=>meetingDraft(x));setDirty(true);setStep(2)}},650);return()=>clearInterval(t)},[step]);
 const upload=(f?:File)=>{if(!f)return;if(!/\.(mp3|m4a|wav|ogg|webm)$/i.test(f.name)){setError('Chọn file MP3, M4A, WAV, OGG hoặc WEBM.');return}if(f.size>100*1024*1024){setError('File vượt quá 100 MB. Chọn file nhỏ hơn hoặc dùng bản ghi mẫu.');return}patch({audio:f.name});setError('')};
 const save=()=>{saveReport(r);setDirty(false);setSavedAt(nowTime());notify('Đã lưu bản nháp biên bản; có thể mở lại từ danh sách dự án.')};
 // Rời editor khi còn thay đổi chưa lưu thì hỏi trước. Bước Processing không cho lưu nháp giữa chừng.
 const leave=()=>dirty&&step<4?setLeaving(true):close();
 const publish=()=>{if(!r.reviewed)return;const next={...r,status:'PUBLISHED' as const,slack:fail?'FAILED' as const:'SENT' as const};saveReport(next);setR(next);setDirty(false);setStep(4)};
 const retry=async()=>{setRetrying(true);await new Promise(res=>setTimeout(res,650));const next={...r,slack:'SENT' as const};saveReport(next);setR(next);setRetrying(false)};
 // Wording assistant mock. Mode "clear" chỉ nối hậu tố một lần, bấm lại không nhân đôi.
 const rewrite=async(i:number,mode:string)=>{setWording(i);await new Promise(res=>setTimeout(res,500));setR(x=>({...x,reviewed:false,sections:x.sections.map((s,j)=>j===i?{...s,text:mode==='short'?s.text.split('\n').map(t=>t.replace('Người dùng ','').replace('chính thức; ','; ')).join('\n'):mode==='slack'?s.text.split('\n').map(t=>'• '+t.replace(/^• /,'')).join('\n'):s.text.includes(CLEAR_SUFFIX)?s.text:s.text.replace(/\.$/,'')+'.\n'+CLEAR_SUFFIX}:s)}));setDirty(true);setWording(-1)};
 // Hành động chính của từng bước nằm trên bar (như các editor khác); bước 2 đặt ô "Đã kiểm tra" ngay cạnh nút để thấy rõ vì sao nút bị khóa.
 const actionsOk=!r.actions.some(a=>!a.task.trim()||!a.owner.trim()||!a.deadline);
 const saveState=step===0||step===2?<SaveState dirty={dirty} savedAt={savedAt||undefined}/>:null;
 const bar=step===0?<>{saveState}<Button onClick={save} title="Lưu nháp (Ctrl S)"><FloppyDisk/> Lưu nháp</Button><Button primary disabled={!r.audio||!r.title.trim()||!r.date} onClick={()=>{setProgress(0);setStep(1)}}><Sparkle/> Tạo biên bản</Button></>
  :step===2?<>{saveState}<label className="bar-check"><input type="checkbox" checked={r.reviewed} onChange={e=>setR({...r,reviewed:e.target.checked})}/> Đã kiểm tra</label><Button onClick={save} title="Lưu nháp (Ctrl S)">Lưu nháp</Button><Button primary disabled={!r.reviewed||!r.title.trim()||!actionsOk||wording!==-1} onClick={()=>setStep(3)}>Xem trước <ArrowRight/></Button></>
  :step===3?<><Button onClick={()=>setStep(2)}><ArrowLeft/> Sửa</Button><Button primary onClick={publish}><PaperPlaneTilt/> Lưu iGoal & gửi Slack</Button></>
  :step===4?<Badge tone="success">Đã lưu iGoal</Badge>:null;
 const steps=['Thông tin','Tạo nháp','Kiểm tra','Gửi'];
 // Panel phải theo bước (giống các editor khác): Thông tin → Biên bản cũ; Kiểm tra → Transcript (chèn vào mục đang chọn); Gửi → Gửi recap + Transcript.
 const {data}=useStore();
 const [panel,setPanel]=useState<string|null>(null),[activeSec,setActiveSec]=useState(0),[usedSeg,setUsedSeg]=useState<string[]>([]);
 useEffect(()=>{setPanel(step===0?'old':step===2?'transcript':step===3?'publish':null)},[step]);
 const oldIds=data.reports.filter(x=>x.kind==='meeting'&&x.status==='PUBLISHED'&&x.id!==r.id&&x.relations.includes(initial.relations[0])).map(x=>x.id);
 const insertSeg=(time:string,speaker:string,text:string)=>{setR(x=>({...x,reviewed:false,sections:x.sections.map((s,i)=>i===activeSec?{...s,text:(s.text.trim()?s.text.replace(/\s+$/,'')+'\n':'')+text}:s)}));setDirty(true);setUsedSeg(u=>[...u,time])};
 const segs=transcript.filter(t=>(t.text+t.speaker).toLowerCase().includes(q.toLowerCase()));
 const TranscriptPanel=({insertable}:{insertable:boolean})=><div className="sp">
  <div className="sp-head"><h3>Transcript</h3><span className="hint">38 phút</span></div>
  {insertable&&r.sections.length>0&&<label className="sp-ctx">Chèn vào<select value={activeSec} onChange={e=>setActiveSec(+e.target.value)}>{r.sections.map((s,i)=><option key={s.label} value={i}>{s.label}</option>)}</select></label>}
  <div className="sp-search"><MagnifyingGlass/><input aria-label="Tìm trong transcript" placeholder="Tìm trong transcript…" value={q} onChange={e=>setQ(e.target.value)}/></div>
  <div className="tr-list">{segs.map(t=>{const used=usedSeg.includes(t.time);return <div className={'tr-seg'+(used?' used':'')} key={t.time}><div className="tr-meta"><span className="timestamp">{t.time}</span><strong>{t.speaker}</strong></div><p>{t.text}</p>{insertable&&<button className="tr-add" disabled={used} aria-label="Chèn đoạn này" title={used?'Đã chèn':'Chèn vào '+(r.sections[activeSec]?.label??'')} onClick={()=>insertSeg(t.time,t.speaker,t.text)}>{used?<Check/>:<Plus/>}</button>}</div>})}{!segs.length&&<p className="sp-empty">Không tìm thấy</p>}</div>
 </div>;
 const panels:EditorPanel[]=step===0?(oldIds.length?[{key:'old',label:'Biên bản cũ',icon:<ClockCounterClockwise/>,render:()=><OldReportsPanel title="Biên bản cũ" ids={oldIds} open={source}/>}]:[])
  :step===2?[{key:'transcript',label:'Transcript',icon:<Microphone/>,render:()=><TranscriptPanel insertable/>},...(oldIds.length?[{key:'old',label:'Biên bản cũ',icon:<ClockCounterClockwise/>,render:()=><OldReportsPanel title="Biên bản cũ" ids={oldIds} open={source}/>}]:[])]
  :step===3?[{key:'publish',label:'Gửi recap',icon:<PaperPlaneTilt/>,render:()=><div className="sp"><div className="sp-head"><h3>Gửi recap</h3></div><MetaRow label="Kênh Slack"><select className="meta-input" value={r.channel} onChange={e=>setR({...r,channel:e.target.value})}><option>#ikame-igoal-project</option><option>#igoal-game-app</option></select></MetaRow><MetaRow label="Nội dung">Nội dung chính, quyết định, việc cần làm và link iGoal</MetaRow><label className="check-line demo"><input type="checkbox" checked={fail} onChange={e=>setFail(e.target.checked)}/> Demo lỗi gửi Slack</label></div>},{key:'transcript',label:'Transcript',icon:<Microphone/>,render:()=><TranscriptPanel insertable={false}/>}]
  :[];

 return <EditorFrame back={leave} backLabel="Về dự án" actions={bar} panels={panels} panel={panel} onPanel={setPanel} onSave={step===0||step===2?save:undefined}>{leaving&&<LeaveDialog stay={()=>setLeaving(false)} discard={close} save={step!==1?()=>{save();close()}:undefined}/>}
 {step<4&&<ol className="steps-slim">{steps.map((s,i)=><li className={step===i?'current':step>i?'complete':''} key={s}><span>{step>i?<Check/>:i+1}</span>{s}</li>)}</ol>}
 {step===0&&<>
  <input className="title-input" aria-label="Tên cuộc họp" placeholder="Tên cuộc họp" value={r.title} onChange={e=>patch({title:e.target.value})}/>
  <MetaRow label="Ngày họp"><input className="meta-input" aria-label="Ngày họp" type="date" value={r.date} onChange={e=>patch({date:e.target.value})}/></MetaRow>
  <MetaRow label="Thành phần"><input className="meta-input wide" aria-label="Thành phần" placeholder="Ai tham dự?" value={r.participants} onChange={e=>patch({participants:e.target.value})}/></MetaRow>
  <MetaRow label="Loại báo cáo"><TrackSelect value={r.track} onChange={t=>patch({track:t})}/></MetaRow>
  <MetaRow label="Liên kết"><EntityRelationPicker value={r.relations} onChange={v=>patch({relations:v})} locked={[initial.relations[0]]}/></MetaRow>
  <div className="divider"/>
  <div className={'upload-zone '+(r.audio?'has-file':'')} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();upload(e.dataTransfer.files[0])}}>{r.audio?<><FileAudio size={30}/><strong>{r.audio}</strong><Button quiet onClick={()=>patch({audio:''})}>Đổi file</Button></>:<><UploadSimple size={30}/><strong>Kéo thả bản ghi âm vào đây</strong><div className="row"><label className="button file-button">Chọn file<input aria-label="Chọn file ghi âm" type="file" accept="audio/*,.m4a" onChange={e=>upload(e.target.files?.[0])}/></label><button className="text-button" onClick={()=>patch({audio:'igoal-sprint-planning.m4a'})}>Dùng bản ghi mẫu</button></div></>}</div>
  {error&&<p className="error">{error}</p>}
 </>}
 {step===1&&<div className="processing"><div className="processing-orb"><Sparkle size={38}/></div><h2>Đang chuẩn bị biên bản</h2><p>{r.audio}</p><div className="processing-list">{['Tiếp nhận file ghi âm','Chuyển giọng nói thành transcript','Nhận diện nội dung và quyết định','Tạo biên bản nháp'].map((s,i)=><div key={s} className={i<progress?'complete':i===progress?'current':''}><span>{i<progress?<Check/>:i+1}</span>{s}</div>)}</div></div>}
 {step===2&&<>
  <input className="title-input" aria-label="Tên biên bản" value={r.title} onChange={e=>patch({title:e.target.value})}/>
  <MetaRow label="Liên kết"><EntityRelationPicker value={r.relations} onChange={v=>patch({relations:v})} locked={[initial.relations[0]]} suggestions={['kr2','sprint1']}/></MetaRow>
  <div className="divider"/>
  {r.sections.map((s,i)=><div className={'ws'+(panel==='transcript'&&activeSec===i?' target':'')} key={i} onFocusCapture={()=>setActiveSec(i)}><div className="ws-head"><h3>{s.label}</h3><select className="wording" aria-label={'Chỉnh câu chữ '+s.label} value="" disabled={wording===i} onChange={e=>rewrite(i,e.target.value)}><option value="">{wording===i?'Đang viết…':'✨ Chỉnh câu chữ'}</option><option value="short">Viết gọn hơn</option><option value="clear">Làm rõ</option><option value="slack">Giọng recap Slack</option></select></div><AutoTextarea className="block-text" aria-label={s.label} rows={Math.max(2,s.text.split('\n').length+1)} value={s.text} onChange={e=>patch({sections:r.sections.map((s,j)=>i===j?{...s,text:e.target.value}:s)})}/></div>)}
  <div className="ws"><div className="ws-head"><h3>Việc cần làm</h3><button className="rp-add" onClick={()=>patch({actions:[...r.actions,{task:'',owner:'',deadline:'2026-09-25'}]})}><Plus/> Thêm việc</button></div>{r.actions.map((a,i)=><div className="action-edit" key={i}><input aria-label={'Việc '+(i+1)} value={a.task} placeholder="Việc cần làm" onChange={e=>patch({actions:r.actions.map((a,j)=>i===j?{...a,task:e.target.value}:a)})}/><input aria-label={'Người phụ trách '+(i+1)} value={a.owner} placeholder="Ai làm" onChange={e=>patch({actions:r.actions.map((a,j)=>i===j?{...a,owner:e.target.value}:a)})}/><input aria-label={'Hạn '+(i+1)} type="date" value={a.deadline} onChange={e=>patch({actions:r.actions.map((a,j)=>i===j?{...a,deadline:e.target.value}:a)})}/><Button quiet aria-label={'Xóa việc '+(i+1)} onClick={()=>patch({actions:r.actions.filter((_,j)=>i!==j)})}><Trash/></Button></div>)}</div>
 </>}
 {step===3&&<><div className="inner-tabs">{['iGoal','Slack'].map(t=><button className={preview===t?'active':''} onClick={()=>setPreview(t)} key={t}>{t}</button>)}</div><h2 className="preview-h">{r.title}</h2>{preview==='iGoal'?<div className="reading"><ReportBody report={r}/></div>:<div className="slack-message"><div className="row"><div className="app-icon">iG</div><strong>iGoal</strong><Badge>APP</Badge><span className="hint">09:30</span></div><h3>Recap · {r.title}</h3><p>{dateLabel(r.date)} · {r.participants}</p>{r.sections.filter(s=>['Nội dung chính','Quyết định đã chốt'].includes(s.label)).map(s=><section key={s.label}><h4>{s.label}</h4><p className="preserve">{s.text}</p></section>)}<h4>Việc cần làm</h4>{r.actions.map((a,i)=><p key={i}>• {a.task} — {a.owner} · {dateLabel(a.deadline)}</p>)}<span className="link-text">Xem biên bản đầy đủ trên iGoal ↗</span></div>}</>}
 {step===4&&<section className="publish-success"><CheckCircle size={52} className="success-icon"/><h2>Đã lưu biên bản</h2><p>{r.title}</p><div className="delivery-row"><CheckCircle/> iGoal <Badge tone="success">Đã lưu</Badge></div><div className="delivery-row"><PaperPlaneTilt/> {r.channel}<Badge tone={r.slack==='SENT'?'success':'warning'}>{r.slack==='SENT'?'Đã gửi':'Chưa gửi được'}</Badge>{r.slack==='FAILED'&&<Button disabled={retrying} onClick={retry}>{retrying?'Đang gửi…':'Thử lại'}</Button>}</div><div className="form-actions"><Button onClick={close}>Về dự án</Button><Button primary onClick={()=>done(r.id)}>Xem biên bản <ArrowRight/></Button></div></section>}
 </EditorFrame>;
}
