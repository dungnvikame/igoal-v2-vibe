import React,{useEffect,useState} from 'react';
import {ArrowLeft,PaperPlaneTilt,Target,UserCircle,Flag,Hash,LockSimple,Eye,PencilSimple,Sparkle,ArrowCounterClockwise,CheckCircle,WarningCircle,CircleNotch,ArrowSquareOut,CaretRight,ShareNetwork} from 'phosphor-react';
import {Report,Section,Destination,Publication,DestKind,kindLabel} from './model';
import {useStore} from './store';
import {Button,Badge,Modal,AutoTextarea,nowTime,onActivate} from './ui';
import {KIND_ICON} from './ReportHub';
import {ShareInput,ShareOption,sharesFrom,shareNames} from './Share';
import {destinationsFor,defaultSelection,originOf,sameSections,runAi,buildPublish,publicationsOf,MASK} from './publishing';

const DEST_ICON:Record<DestKind,React.ElementType>={eks:Target,project:Flag,manager:UserCircle,slack:Hash};
/** Đường dẫn nơi báo cáo sẽ nằm, hiện trên đầu khung xem trước. */
const crumb=(x:Destination)=>x.kind==='eks'?'My EKS › Tổng hợp báo cáo':x.kind==='project'?x.label+' › Tổng hợp báo cáo':x.kind==='manager'?x.label.replace('Quản lý trực tiếp · ','')+' › Được chia sẻ với tôi':'Slack › '+x.channel;

/** Văn bản có đánh dấu phần AI đã ẩn. */
function Masked({text}:{text:string}){const parts=text.split(MASK);return <>{parts.map((p,i)=><React.Fragment key={i}>{i>0&&<mark className="pub-mask" title="Đã ẩn theo yêu cầu">ẩn</mark>}{p}</React.Fragment>)}</>}

/** Tin nhắn Slack mô phỏng: bot iGoal, tiêu đề đậm, từng mục, nút mở trên iGoal. */
export function SlackPreview({channel,title,sections,owner}:{channel:string;title:string;sections:Section[];owner:string}){
 const shown=sections.filter(s=>s.text.trim());
 return <div className="slack-mock"><div className="slack-channel"><Hash/> {channel.replace('#','')}</div><div className="slack-msg"><span className="slack-bot">iG</span><div><div className="slack-name"><strong>iGoal</strong><small>APP · {nowTime()}</small></div><p className="slack-lead">{owner} vừa xuất bản báo cáo</p><div className="slack-card"><strong>{title}</strong>{shown.map(s=><div key={s.label}><b>{s.label}</b><p className="preserve"><Masked text={s.text}/></p></div>)}{!shown.length&&<p className="hint">Không còn nội dung nào để gửi.</p>}<span className="slack-link">Xem trên iGoal ↗</span></div></div></div></div>;
}

/** Khung xem trước tại một nơi: dòng báo cáo trong danh sách của nơi đó + nội dung đầy đủ. Slack dùng SlackPreview. */
function DestPreview({dest,report,sections}:{dest:Destination;report:Report;sections:Section[]}){
 if(dest.kind==='slack')return <SlackPreview channel={dest.channel!} title={report.title} sections={sections} owner={report.owner}/>;
 const Icon=KIND_ICON[report.kind];const shown=sections.filter(s=>s.text.trim());
 return <div className="pub-page"><div className="pub-row"><span className={'record-icon '+report.kind}><Icon size={18}/></span><span className="pub-row-text"><strong>{report.title}</strong><small>{report.owner} · Hôm nay · {kindLabel[report.kind]}{report.track?' · '+report.track:''}</small></span>{dest.kind==='manager'&&<Badge><Eye size={12}/> Người xem</Badge>}</div>
  <article className="pub-doc"><h2>{report.title}</h2>{shown.map(s=><section className="reading-section" key={s.label}><h3>{s.label}</h3><p className="preserve"><Masked text={s.text}/></p></section>)}{!shown.length&&<p className="hint">Không còn nội dung nào ở nơi này.</p>}</article></div>;
}

/** Danh sách trạng thái gửi từng nơi + nút điều hướng. `revealed` < số dòng → các dòng sau hiện "Đang gửi…" (hiệu ứng gửi lần lượt). */
export function PublicationList({pubs,revealed=Infinity,open,retry,origin}:{pubs:Publication[];revealed?:number;open:(p:Publication)=>void;retry:(p:Publication)=>void;origin?:string}){
 return <ul className="pub-status">{pubs.map((p,i)=>{const Icon=DEST_ICON[p.kind];const sending=i>=revealed;const failed=!sending&&p.status==='FAILED';
  return <li key={p.id} className={'pub-status-row'+(failed?' failed':'')}><span className="pub-dest-icon"><Icon/></span><span className="pub-status-text"><strong>{p.label}</strong><small>{sending?<><CircleNotch className="spin"/> Đang gửi…</>:failed?<><WarningCircle weight="fill"/> Gửi không thành công · {p.time}</>:<><CheckCircle weight="fill"/> Đã gửi · {p.time}</>}{p.destId===origin&&<i>· Nơi viết</i>}{p.customized&&<i>· Nội dung riêng</i>}</small></span>
   {!sending&&<span className="row">{failed&&<Button onClick={()=>retry(p)}><PaperPlaneTilt/> Thử lại</Button>}<Button quiet onClick={()=>open(p)}>{p.kind==='slack'?'Xem tin nhắn':'Mở báo cáo'}<CaretRight/></Button></span>}</li>})}</ul>;
}

/** Mở một nơi đã xuất bản: báo cáo → trang chi tiết, Slack → tin nhắn mô phỏng. Dùng chung cho màn trạng thái và chi tiết báo cáo. */
export function usePublicationActions(openReport:(r:Report)=>void,notify:(s:string)=>void){
 const {data,savePublication}=useStore();const [slack,setSlack]=useState<Publication|null>(null);
 const open=(p:Publication)=>{if(p.kind==='slack'){setSlack(p);return}const r=data.reports.find(x=>x.id===p.reportId);if(r)openReport(r)};
 const retry=(p:Publication)=>{savePublication({...p,status:'SENT',time:nowTime()});notify('Đã gửi lại '+p.label)};
 const owner=data.reports.find(r=>r.id===slack?.originId)?.owner??'';
 const modal=slack&&<Modal title={'Tin nhắn trên '+slack.label} subtitle={slack.status==='FAILED'?'Chưa gửi được · nội dung sẽ gửi khi Thử lại':'Mô phỏng · không gửi Slack thật'} close={()=>setSlack(null)}><SlackPreview channel={slack.label} title={slack.title??''} sections={slack.sections??[]} owner={owner}/></Modal>;
 return {open,retry,modal};
}

/**
 * Màn Xuất bản (sau khi bấm "Xuất bản" trong editor):
 * trái = nơi xuất hiện (chỉ nơi có quyền viết, nơi viết khóa chọn) · giữa = xem trước / chỉnh nội dung theo nơi đang chọn · phải = AI chỉnh theo yêu cầu.
 * Cấu hình chia sẻ (người / team, vai trò Người xem) ngay trên màn này, áp cho bản ở nơi viết; chỉ khi bấm Xuất bản mới tạo chia sẻ.
 * Xuất bản xong → trạng thái gửi từng nơi, nút mở báo cáo tương ứng. Không còn gợi ý Contribution sau khi gửi.
 */
export function PublishFlow({report,back,close,openReport,notify}:{report:Report;back:(r:Report)=>void;close:()=>void;openReport:(r:Report)=>void;notify:(s:string)=>void}){
 const {data,user,publish}=useStore();
 const dests=destinationsFor(data,report,user);const origin=originOf(report);
 const [selected,setSelected]=useState<string[]>(()=>defaultSelection(report,dests));
 const [active,setActive]=useState(origin),[mode,setMode]=useState<'preview'|'edit'>('preview');
 const [variants,setVariants]=useState<Record<string,Section[]>>(report.variants??{});
 const [prompt,setPrompt]=useState(''),[scope,setScope]=useState<'active'|'all'>('active'),[ai,setAi]=useState<{changes:string[];targets:string[];prev:Record<string,Section[]|undefined>}|null>(null),[aiError,setAiError]=useState(false);
 const [sharePending,setSharePending]=useState<ShareOption[]>([]),[shared,setShared]=useState<ShareOption[]>([]);
 const [failSlack,setFailSlack]=useState(false),[doneId,setDoneId]=useState<string|null>(null),[revealed,setRevealed]=useState(0);
 const actions=usePublicationActions(openReport,notify);

 const content=(id:string)=>variants[id]??report.sections;
 const customized=(id:string)=>!!variants[id]&&!sameSections(variants[id],report.sections);
 const cur=dests.find(x=>x.id===active)??dests[0];
 const chosen=dests.filter(x=>selected.includes(x.id));
 const pubs=doneId?data.publications.filter(p=>p.originId===doneId):[];
 // Hiệu ứng gửi lần lượt từng nơi.
 useEffect(()=>{if(!doneId||revealed>=pubs.length)return;const t=setTimeout(()=>setRevealed(n=>n+1),450);return()=>clearTimeout(t)},[doneId,revealed,pubs.length]);

 const toggle=(id:string)=>{if(id===origin)return;setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);setActive(id)};
 const setSection=(i:number,text:string)=>setVariants(v=>({...v,[active]:content(active).map((s,j)=>j===i?{...s,text}:s)}));
 const resetActive=()=>setVariants(v=>{const n={...v};delete n[active];return n});
 const runPrompt=(q:string)=>{
  const targets=scope==='all'?selected:[active];let any=false;const next={...variants};const changes:string[]=[];
  for(const id of targets){const x=dests.find(d=>d.id===id)!;const r=runAi(q,content(id),data.reports,x.projectId);if(r.changes.length){any=true;next[id]=r.sections;if(!changes.length||targets.length===1)changes.push(...r.changes)}}
  if(!any){setAiError(true);return}
  setAi({changes,targets,prev:Object.fromEntries(targets.map(id=>[id,variants[id]]))});setAiError(false);setVariants(next);setMode('preview');setPrompt(q);
 };
 const undo=()=>{if(!ai)return;setVariants(v=>{const n={...v};for(const id of ai.targets){const p=ai.prev[id];if(p)n[id]=p;else delete n[id]}return n});setAi(null);notify('Đã hoàn tác chỉnh sửa AI')};
 const submit=()=>{const b=buildPublish(data,report,chosen,variants,user,nowTime(),failSlack);publish({...b,shares:[...b.shares,...sharesFrom(sharePending,report.id,user)]});setShared(sharePending);setDoneId(report.id);setRevealed(0);notify('Đang xuất bản tới '+chosen.length+' nơi')};

 // Gợi ý nhanh theo ngữ cảnh: dự án đang xem (hoặc dự án đầu tiên đã chọn).
 const focusProj=cur.projectId?dests.find(d=>d.kind==='project'&&d.projectId===cur.projectId):chosen.find(d=>d.kind==='project');
 const issue=report.sections.find(s=>/^(Khó khăn|Vấn đề)/.test(s.label)&&s.text.trim());
 const quick=['Ẩn các con số kinh doanh',...(focusProj?['Chỉ tập trung vào báo cáo của '+focusProj.label.replace('Dự án ','dự án ')]:[]),'Rút gọn còn ý chính',...(issue?['Bỏ mục '+issue.label]:[])];

 // ---------- Sau khi xuất bản: trạng thái gửi từng nơi ----------
 if(doneId){const root=data.reports.find(r=>r.id===doneId)!;const sending=revealed<pubs.length;const failed=pubs.filter(p=>p.status==='FAILED').length;
  return <div className="pub-shell done"><header className="editor-bar"><Button quiet onClick={close}><ArrowLeft/> Về danh sách</Button><div className="head-actions"><Button primary disabled={sending} onClick={close}>Xong</Button></div></header>
   <main className="pub-done"><div className="pub-done-head">{sending?<CircleNotch className="spin big"/>:failed?<WarningCircle weight="fill" className="big warn"/>:<CheckCircle weight="fill" className="big ok"/>}<div><h1>{sending?'Đang xuất bản…':failed?`Đã xuất bản · ${failed} nơi chưa gửi được`:`Đã xuất bản tới ${pubs.length} nơi`}</h1><p>{root.title}</p></div></div>
    <section className="surface"><div className="card-head"><h3>Trạng thái gửi</h3><small className="hint">{Math.min(revealed,pubs.length)}/{pubs.length} nơi</small></div><PublicationList pubs={pubs} revealed={revealed} open={actions.open} retry={actions.retry} origin={origin}/></section>
    {shared.length>0&&<p className="pub-shared"><ShareNetwork/> Đã chia sẻ bản tại nơi viết với {shareNames(shared)} · Người xem</p>}
   </main>{actions.modal}</div>;
 }

 // ---------- Chọn nơi xuất hiện ----------
 const groups=(['Cá nhân','Dự án','Kênh Slack'] as const).map(g=>({g,items:dests.filter(x=>x.group===g)})).filter(x=>x.items.length);
 const sections=content(active);
 return <div className="pub-shell"><header className="editor-bar"><Button quiet onClick={()=>back({...report,variants})}><ArrowLeft/> Quay lại soạn</Button><div className="head-actions"><span className="hint">{chosen.length} nơi đã chọn</span><Button primary disabled={!chosen.length} onClick={submit}><PaperPlaneTilt/> Xuất bản{chosen.length>1?` tới ${chosen.length} nơi`:''}</Button></div></header>
  <aside className="pub-dests" aria-label="Nơi xuất hiện"><h2>Nơi xuất hiện</h2><p className="hint">Chỉ hiện nơi bạn được phép viết báo cáo.</p>
   {groups.map(({g,items})=><div key={g} role="group" aria-label={g}><div className="sp-group">{g}</div>{items.map(x=>{const Icon=DEST_ICON[x.kind];const on=selected.includes(x.id);const locked=x.id===origin;
    return <div key={x.id} className={'pub-dest'+(active===x.id?' active':'')+(on?'':' off')} role="button" tabIndex={0} aria-label={'Xem trước tại '+x.label} aria-pressed={active===x.id} onClick={()=>setActive(x.id)} onKeyDown={onActivate(()=>setActive(x.id))}>
     <input type="checkbox" aria-label={(on?'Bỏ chọn ':'Chọn ')+x.label} checked={on} disabled={locked} onClick={e=>e.stopPropagation()} onChange={()=>toggle(x.id)}/>
     <span className="pub-dest-icon"><Icon/></span><span className="pub-dest-text"><strong>{x.label}</strong><small>{locked?<><LockSimple size={11}/> Nơi viết · luôn lưu</>:x.hint}</small></span>
     {customized(x.id)&&<span className="pub-tag" title="Nội dung ở nơi này khác bản gốc">Riêng</span>}</div>})}</div>)}
   <div className="pub-share" role="group" aria-label="Chia sẻ"><div className="sp-group">Chia sẻ</div><ShareInput report={report} pending={sharePending} onChange={setSharePending}/><small className="hint">{sharePending.length?'Chia sẻ khi bấm Xuất bản · xem & bình luận bản tại nơi viết':'Không bắt buộc · người nhận xem & bình luận bản tại nơi viết'}</small></div>
   {chosen.some(x=>x.kind==='slack')&&<label className="check-line pub-demo"><input type="checkbox" checked={failSlack} onChange={e=>setFailSlack(e.target.checked)}/>Demo lỗi gửi Slack</label>}
  </aside>
  <main className="pub-main">
   <div className="pub-main-head"><div><small className="pub-crumb">{crumb(cur)}</small><h2>{cur.label}{!selected.includes(cur.id)&&<Badge>Chưa chọn</Badge>}</h2></div>
    <div className="row"><div className="inner-tabs compact"><button className={mode==='preview'?'active':''} onClick={()=>setMode('preview')}><Eye/> Xem trước</button><button className={mode==='edit'?'active':''} onClick={()=>setMode('edit')}><PencilSimple/> Chỉnh nội dung</button></div></div></div>
   {customized(active)&&<div className="pub-custom"><span>Nội dung ở nơi này đã chỉnh riêng, khác bản gốc.</span><button className="text-button" onClick={resetActive}><ArrowCounterClockwise/> Dùng lại bản gốc</button></div>}
   {mode==='preview'?<DestPreview dest={cur} report={report} sections={sections}/>
    :<div className="pub-edit">{sections.map((s,i)=><div className="ws" key={s.label}><h3>{s.label}</h3><AutoTextarea className="block-text" aria-label={s.label+' · '+cur.label} value={s.text} placeholder="Để trống nếu không muốn mục này xuất hiện ở đây" rows={Math.max(2,s.text.split('\n').length+1)} onChange={e=>setSection(i,e.target.value)}/></div>)}<p className="hint">Chỉ thay đổi nội dung ở {cur.label}. Các nơi khác giữ nguyên.</p></div>}
  </main>
  <aside className="pub-ai" aria-label="Chỉnh bằng AI"><h2><Sparkle weight="fill"/> Chỉnh bằng AI</h2><p className="hint">Mô tả cách chỉnh nội dung cho nơi xuất hiện.</p>
   <div className="pub-quick">{quick.map(q=><button key={q} onClick={()=>runPrompt(q)}>{q}</button>)}</div>
   <AutoTextarea className="pub-prompt" aria-label="Yêu cầu chỉnh sửa" placeholder="Ví dụ: ẩn các con số kinh doanh, chỉ tập trung vào dự án iWiki…" value={prompt} rows={3} onChange={e=>{setPrompt(e.target.value);setAiError(false)}} onKeyDown={e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)&&prompt.trim())runPrompt(prompt)}}/>
   <div className="pub-scope" role="radiogroup" aria-label="Áp dụng cho"><label><input type="radio" checked={scope==='active'} onChange={()=>setScope('active')}/>Chỉ {cur.label}</label><label><input type="radio" checked={scope==='all'} onChange={()=>setScope('all')}/>Tất cả {selected.length} nơi đã chọn</label></div>
   <Button primary disabled={!prompt.trim()} onClick={()=>runPrompt(prompt)}><Sparkle/> Chỉnh nội dung</Button>
   {aiError&&<div className="notice warning">Bản demo hiểu các yêu cầu: ẩn con số / số liệu kinh doanh, chỉ tập trung vào một dự án, rút gọn, bỏ một mục.</div>}
   {ai&&<div className="pub-ai-result"><strong><CheckCircle weight="fill"/> Đã chỉnh {ai.targets.length>1?ai.targets.length+' nơi':dests.find(d=>d.id===ai.targets[0])?.label}</strong><ul>{ai.changes.map(c=><li key={c}>{c}</li>)}</ul><div className="row"><Button quiet onClick={undo}><ArrowCounterClockwise/> Hoàn tác</Button>{mode!=='edit'&&<Button quiet onClick={()=>setMode('edit')}><PencilSimple/> Sửa tiếp</Button>}</div></div>}
  </aside>
 </div>;
}

/** Panel "Nơi xuất hiện" trong chi tiết báo cáo: trạng thái gửi từng nơi, mở bản tương ứng, Thử lại Slack. */
export function PublicationsPanel({report,openReport,notify}:{report:Report;openReport:(r:Report)=>void;notify:(s:string)=>void}){
 const {data}=useStore();const pubs=publicationsOf(data,report);const actions=usePublicationActions(openReport,notify);
 const root=data.reports.find(r=>r.id===(report.origin??report.id));
 return <div className="sp"><div className="sp-head"><h3>Nơi xuất hiện</h3></div>{report.origin&&root&&<p className="sp-meta">Bản tại {pubs.find(p=>p.reportId===report.id)?.label} · <button className="text-button" onClick={()=>openReport(root)}>Mở bản gốc <ArrowSquareOut size={12}/></button></p>}
  <PublicationList pubs={pubs} open={actions.open} retry={actions.retry} origin={root?originOf(root):undefined}/>{actions.modal}</div>;
}
