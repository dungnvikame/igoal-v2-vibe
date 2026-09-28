import React,{useState} from 'react';
import {Plus,X,Check,CheckCircle,ArrowLeft,Hash,Info,Flag,Target} from 'phosphor-react';
import {tracks,Track,teams,teamGoals,entities} from './model';
import {useStore} from './store';
import {Button,Modal,AutoTextarea} from './ui';
import {ProjectConfig,RoleId,ProjectOkr,projectTypes,platforms,units,unitTeams,roles,viewerGroups,cadences,stageTemplate,blankProject,newMilestone,newOkr,currentPeriod} from './project-config';
import {teamName} from './Alignment';
import {MemberSearch} from './MemberSearch';
import {uid} from './model';

const STEPS=['Thông tin chung','Thành viên','OKR dự án','Giai đoạn & báo cáo','Liên kết & quyền xem'] as const;
/** Nhãn "Mới" đánh dấu phần iGoal hiện tại chưa có, để review biết chỗ nào là bổ sung. */
const New=()=><span className="pf-new" title="Chưa có trên iGoal hiện tại">Mới</span>;
function Field({label,children,isNew,hint,required}:{label:string;children:React.ReactNode;isNew?:boolean;hint?:string;required?:boolean}){return <div className="pf-field"><span className="pf-label">{label}{required&&<i className="req">*</i>}{isNew&&<New/>}</span><div>{children}{hint&&<small className="hint pf-hint">{hint}</small>}</div></div>}
function Pills<T extends string>({options,value,onChange,multi}:{options:readonly {id:T;label:string}[];value:T[];onChange:(v:T[])=>void;multi?:boolean}){
 return <div className="eks-pills" role={multi?'group':'radiogroup'}>{options.map(o=>{const on=value.includes(o.id);return <button key={o.id} role={multi?undefined:'radio'} aria-checked={multi?undefined:on} aria-pressed={multi?on:undefined} className={on?'on':''} onClick={()=>onChange(multi?(on?value.filter(x=>x!==o.id):[...value,o.id]):[o.id])}>{multi&&on&&<Check size={12}/>}{o.label}</button>})}</div>;
}

/**
 * Tạo / sửa dự án. 5 bước, mỗi bước ứng với nhóm nhu cầu đã ghi nhận:
 * 1) Thông tin chung: tên, loại + phân loại, nền tảng, Product Manager, đơn vị phụ trách, BU/Cen/Team phụ trách (2 dòng riêng),
 *    đơn vị phối hợp, UA phụ trách, thời gian (Start / End hoặc Dài hạn — không gắn kỳ H1/H2).
 * 2) Thành viên: tìm & chọn người theo từng vai trò Creative, Dev, QA (PM, UA đã chọn ở bước 1). PM/UA/Creative = người viết báo cáo.
 * 3) OKR dự án: tạo mục tiêu + KR/KS cho kỳ hiện tại (không bắt buộc, có thể tạo sau). Kỳ sau chỉ tạo OKR mới, dự án giữ nguyên.
 * 4) Giai đoạn & báo cáo: giai đoạn mẫu theo phân loại (Game/App: Build → Soft launch → Global launch → Live ops),
 *    mỗi giai đoạn bật mảng báo cáo + tần suất; chọn giai đoạn hiện tại.
 * 5) Liên kết & quyền xem: KR của BU/Team dự án đóng góp, milestone (không bắt buộc), kênh Slack nhận recap,
 *    ma trận quyền xem báo cáo theo mảng × nhóm.
 */
export function ProjectForm({initial,close,done,notify}:{initial?:ProjectConfig;close:()=>void;done:(id:string)=>void;notify:(s:string)=>void}){
 const {data,saveProject}=useStore();const editing=!!initial;
 const [p,setP]=useState<ProjectConfig>(()=>initial?{...initial,partners:initial.partners??[],okrs:initial.okrs??[]}:blankProject());
 const [step,setStep]=useState(0);
 const set=(x:Partial<ProjectConfig>)=>setP(v=>({...v,...x}));
 // Cập nhật theo giá trị mới nhất (bấm nhanh nhiều lần không mất thay đổi).
 const upd=(f:(v:ProjectConfig)=>Partial<ProjectConfig>)=>setP(v=>({...v,...f(v)}));
 const subs=projectTypes.find(t=>t.id===p.type)!.subs;
 const users=data.users.filter(u=>u.active);
 const valid=[!!p.name.trim()&&!!p.start&&(!p.end||p.end>=p.start)&&p.roles.PM.length>0&&!!p.unit,true,true,p.stages.length>0&&p.stages.every(s=>s.name.trim()),true];
 const firstInvalid=valid.findIndex(v=>!v);
 // Đổi phân loại khi tạo mới → thay giai đoạn mẫu cho khớp (Game/App khác Sản phẩm nội bộ).
 const setSub=(subType:string)=>set({subType,...(!editing?{stages:stageTemplate(subType),currentStage:''}:{})});
 const setType=(type:ProjectConfig['type'])=>{const sub=projectTypes.find(t=>t.id===type)!.subs[0];set({type});setSub(sub)};
 const setRole=(r:RoleId,ids:string[])=>upd(v=>({roles:{...v.roles,[r]:ids}}));
 const setUnit=(unit:string)=>upd(v=>({unit,team:unitTeams[unit]?.[0]??'',partners:v.partners.filter(x=>x!==unit)}));
 const patchStage=(id:string,x:Partial<ProjectConfig["stages"][number]>)=>upd(v=>({stages:v.stages.map(s=>s.id===id?{...s,...x}:s)}));
 const toggleVis=(t:Track,g:string)=>upd(v=>({visibility:{...v.visibility,[t]:v.visibility[t].includes(g)?v.visibility[t].filter(x=>x!==g):[...v.visibility[t],g]}}));
 const patchOkr=(id:string,f:(o:ProjectOkr)=>ProjectOkr)=>upd(v=>({okrs:v.okrs.map(o=>o.id===id?f(o):o)}));
 // Lưu: bỏ mốc / OKR / KR trống, chuẩn hóa kênh Slack.
 const save=()=>{const okrs=p.okrs.filter(o=>o.title.trim()).map(o=>({...o,title:o.title.trim(),items:o.items.filter(k=>k.title.trim())}));
  const final={...p,name:p.name.trim(),okrs,currentStage:p.currentStage||p.stages[0]?.id||'',milestones:p.milestones.filter(m=>m.label.trim()&&m.date),channel:p.channel.trim()?('#'+p.channel.trim().replace(/^#/,'')):''};
  saveProject(final);notify(editing?'Đã lưu dự án':'Đã tạo dự án '+final.name);done(final.id)};
 const current=p.currentStage||p.stages[0]?.id;
 const okrCount=p.okrs.filter(o=>o.title.trim()).length;

 const info=<section className="eks-card">
  <input className="eks-title" aria-label="Tên dự án" placeholder="Tên dự án" value={p.name} onChange={e=>set({name:e.target.value})}/>
  <Field label="Mô tả"><AutoTextarea className="eks-input" rows={2} placeholder="Dự án làm gì, cho ai" value={p.description} onChange={e=>set({description:e.target.value})}/></Field>
  <Field label="Loại dự án"><Pills options={projectTypes} value={[p.type]} onChange={v=>setType(v[0])}/></Field>
  <Field label="Phân loại"><Pills options={subs.map(s=>({id:s,label:s}))} value={[p.subType]} onChange={v=>setSub(v[0])}/></Field>
  <Field label="Nền tảng" isNew><Pills multi options={platforms.map(x=>({id:x,label:x}))} value={p.platforms} onChange={v=>set({platforms:v})}/></Field>
  <Field label="Product Manager" required><MemberSearch single label="Product Manager" placeholder="Tìm Product Manager" users={users} value={p.roles.PM} onChange={v=>setRole('PM',v)}/></Field>
  <Field label="Đơn vị phụ trách" required><select className="eks-select wide" aria-label="Đơn vị phụ trách" value={p.unit} onChange={e=>setUnit(e.target.value)}>{units.map(u=><option key={u}>{u}</option>)}</select></Field>
  <Field label="BU / Cen / Team phụ trách"><select className="eks-select wide" aria-label="BU / Cen / Team phụ trách" value={p.team} onChange={e=>set({team:e.target.value})}>{(unitTeams[p.unit]??[]).map(t=><option key={t}>{t}</option>)}</select></Field>
  <Field label="Đơn vị phối hợp" hint="Không bắt buộc"><Pills multi options={units.filter(u=>u!==p.unit).map(u=>({id:u as string,label:u}))} value={p.partners} onChange={v=>set({partners:v})}/></Field>
  <Field label="UA phụ trách"><MemberSearch label="UA phụ trách" placeholder="Tìm thành viên UA" users={users} value={p.roles.UA} onChange={v=>setRole('UA',v)}/></Field>
  <Field label="Thời gian" required isNew hint="Dự án không gắn với kỳ: chạy xuyên H1/H2, mỗi kỳ chỉ cập nhật OKR của dự án, không cần tạo lại dự án.">
   <div className="row pf-dates"><label>Bắt đầu<input type="date" className="eks-select" value={p.start} onChange={e=>set({start:e.target.value})}/></label>
    <label>Kết thúc<input type="date" className="eks-select" value={p.end} disabled={!p.end} min={p.start} onChange={e=>set({end:e.target.value})}/></label>
    <label className="check-line"><input type="checkbox" checked={!p.end} onChange={e=>set({end:e.target.checked?'':p.start})}/>Dài hạn · chưa có ngày kết thúc</label></div>
   {p.end&&p.start&&p.end<p.start&&<small className="warn">Ngày kết thúc phải sau ngày bắt đầu</small>}</Field>
 </section>;

 const who=(ids:string[])=>ids.map(id=>users.find(u=>u.id===id)?.name).filter(Boolean).join(', ')||'chưa chọn';
 const people=<section className="eks-card flush">
  <p className="hint pf-intro">Tìm và chọn thành viên theo từng vai trò. PM: <b>{who(p.roles.PM)}</b> · UA: <b>{who(p.roles.UA)}</b> (chọn ở Thông tin chung). Creative viết báo cáo mảng Creative; mọi vai trò là thành viên dự án.</p>
  {roles.filter(r=>r.id!=='PM'&&r.id!=='UA').map(r=><div className="pf-role" key={r.id}><div className="pf-role-head"><strong>{r.label}</strong>{'writes' in r?<small>Viết báo cáo {r.writes}</small>:<small>Thành viên</small>}<New/></div>
   <MemberSearch label={'Thành viên '+r.label} placeholder={`Tìm thành viên ${r.label}`} users={users} value={p.roles[r.id]} onChange={v=>setRole(r.id,v)}/></div>)}
 </section>;

 // OKR đã có của dự án (ngoài cấu hình, vd. dự án mẫu) chỉ hiện để tham chiếu khi sửa.
 const existing=editing?entities.filter(e=>e.type==='Objective'&&e.project===p.id&&!p.okrs.some(o=>o.id===e.id)):[];
 const okr=<>
  <p className="hint pf-intro-top"><Target/> OKR dự án kỳ <b>{currentPeriod}</b>. Không bắt buộc, có thể tạo sau ở tab Mục tiêu &amp; báo cáo. Sang kỳ mới chỉ tạo OKR mới, dự án giữ nguyên.</p>
  {existing.length>0&&<section className="eks-card pf-okr-existing"><small>Đã có</small>{existing.map(o=><div key={o.id}><strong>{o.label}</strong></div>)}</section>}
  {p.okrs.map((o,oi)=><section className="eks-card pf-okr" key={o.id}>
   <header className="pf-okr-head"><span className="okr-code circle">O{existing.length+oi+1}</span><AutoTextarea className="pf-okr-title" aria-label={'Mục tiêu '+(oi+1)} rows={1} placeholder="Tên mục tiêu (Objective)" value={o.title} onChange={e=>patchOkr(o.id,x=>({...x,title:e.target.value}))}/><button className="pf-x" aria-label={'Xóa mục tiêu '+(oi+1)} onClick={()=>upd(v=>({okrs:v.okrs.filter(x=>x.id!==o.id)}))}><X size={14}/></button></header>
   {o.items.map((k,ki)=><div className="pf-okr-item" key={k.id}><select className="eks-select small" aria-label={'Loại kết quả '+(ki+1)} value={k.type} onChange={e=>patchOkr(o.id,x=>({...x,items:x.items.map(y=>y.id===k.id?{...y,type:e.target.value as 'KR'|'KS'}:y)}))}><option value="KR">KR</option><option value="KS">KS</option></select>
    <input className="eks-input one" aria-label={'Kết quả '+(ki+1)} placeholder={k.type==='KR'?'Key Result đo được, vd. D1 retention ≥ 40%':'Key Success, vd. Soft launch 2 thị trường'} value={k.title} onChange={e=>patchOkr(o.id,x=>({...x,items:x.items.map(y=>y.id===k.id?{...y,title:e.target.value}:y)}))}/>
    <button className="pf-x" aria-label={'Xóa kết quả '+(ki+1)} onClick={()=>patchOkr(o.id,x=>({...x,items:x.items.filter(y=>y.id!==k.id)}))}><X size={14}/></button></div>)}
   <Button quiet onClick={()=>patchOkr(o.id,x=>({...x,items:[...x.items,{id:uid(),type:'KR',title:''}]}))}><Plus/> Thêm KR / KS</Button>
  </section>)}
  <Button onClick={()=>upd(v=>({okrs:[...v.okrs,newOkr()]}))}><Plus/> Thêm mục tiêu</Button>
 </>;

 const stages=<>
  <p className="hint pf-intro-top"><Info/> Mỗi giai đoạn quyết định mảng báo cáo cần viết và tần suất. {p.subType==='Game'||p.subType==='App'?'Game/App: giai đoạn build chủ yếu báo cáo Sản phẩm, sau release chuyển sang Kinh doanh/UA.':'Có thể đổi tên, thêm hoặc bớt giai đoạn.'}</p>
  <section className="eks-card flush">{p.stages.map((s,i)=><div className={'pf-stage'+(current===s.id?' current':'')} key={s.id}>
   <div className="pf-stage-head"><label className="pf-now" title="Giai đoạn hiện tại"><input type="radio" name="current-stage" checked={current===s.id} onChange={()=>set({currentStage:s.id})}/>{current===s.id?'Hiện tại':''}</label>
    <input className="pf-stage-name" aria-label={'Tên giai đoạn '+(i+1)} value={s.name} placeholder="Tên giai đoạn" onChange={e=>patchStage(s.id,{name:e.target.value})}/>
    <input type="date" className="eks-select" aria-label={'Bắt đầu giai đoạn '+(s.name||i+1)} value={s.start} onChange={e=>patchStage(s.id,{start:e.target.value})}/>
    {p.stages.length>1&&<button className="pf-x" aria-label={'Xóa giai đoạn '+s.name} onClick={()=>upd(v=>({stages:v.stages.filter(x=>x.id!==s.id),currentStage:current===s.id?'':v.currentStage}))}><X size={14}/></button>}</div>
   <div className="pf-stage-body"><span className="pf-sub">Báo cáo</span><Pills multi options={tracks.map(t=>({id:t,label:t}))} value={s.tracks} onChange={v=>patchStage(s.id,{tracks:v})}/>
    <select className="eks-select small" aria-label={'Tần suất '+s.name} value={s.cadence} onChange={e=>patchStage(s.id,{cadence:e.target.value})}>{cadences.map(c=><option key={c}>{c}</option>)}</select></div>
   {!s.tracks.length&&<small className="hint">Giai đoạn này không yêu cầu báo cáo dự án</small>}</div>)}</section>
  <Button onClick={()=>upd(v=>({stages:[...v.stages,{id:uid(),name:'',start:'',tracks:['Sản phẩm'],cadence:'1 tuần/lần'}]}))}><Plus/> Thêm giai đoạn</Button>
 </>;

 const krs=teamGoals.filter(g=>g.parent);
 const goals=<>
  <section className="eks-card"><h4 className="pf-h">Liên kết OKR BU / Team<New/></h4><p className="hint">Dự án đóng góp trực tiếp vào KR nào của BU/Team.</p>
   <div className="eks-kr-list">{krs.map(g=>{const on=p.teamGoals.includes(g.id);return <button key={g.id} aria-pressed={on} className={'eks-kr'+(on?' on':'')} onClick={()=>upd(v=>({teamGoals:on?v.teamGoals.filter(x=>x!==g.id):[...v.teamGoals,g.id]}))}>{on?<Check size={14}/>:<Plus size={14}/>}<b>{g.code}</b><span>{g.label} <small className="hint">· Team {teamName(g.team)}</small></span></button>})}</div></section>
  <section className="eks-card"><h4 className="pf-h"><Flag/> Milestone <small className="hint">không bắt buộc</small></h4><p className="hint">Chỉ thêm khi cần chia nhỏ các mốc quan trọng. Mốc gắn được vào báo cáo.</p>
   {p.milestones.map(m=><div className="row pf-ms" key={m.id}><input className="eks-input one" aria-label="Tên mốc" placeholder="Tên mốc, vd. Soft launch VN" value={m.label} onChange={e=>upd(v=>({milestones:v.milestones.map(x=>x.id===m.id?{...x,label:e.target.value}:x)}))}/><input type="date" className="eks-select" aria-label="Ngày" value={m.date} onChange={e=>upd(v=>({milestones:v.milestones.map(x=>x.id===m.id?{...x,date:e.target.value}:x)}))}/><button className="pf-x" aria-label="Xóa mốc" onClick={()=>upd(v=>({milestones:v.milestones.filter(x=>x.id!==m.id)}))}><X size={14}/></button></div>)}
   <Button quiet onClick={()=>upd(v=>({milestones:[...v.milestones,newMilestone()]}))}><Plus/> Thêm mốc</Button></section>
  <section className="eks-card"><h4 className="pf-h"><Hash/> Kênh Slack nhận recap<New/></h4><p className="hint">Sau khi xuất bản báo cáo dự án, iGoal gửi recap + link về kênh này. Để trống nếu không dùng.</p>
   <div className="pf-slack"><Hash/><input aria-label="Kênh Slack" placeholder="ten-kenh-du-an" value={p.channel.replace(/^#/,'')} onChange={e=>set({channel:e.target.value})}/></div></section>
  <section className="eks-card flush"><h4 className="pf-h pad">Quyền xem báo cáo theo nhóm<New/></h4><p className="hint pad">Ai được xem báo cáo của từng mảng. Mặc định báo cáo Kinh doanh/UA chỉ PM, UA, BU Head và Vận hành xem được.</p>
   <div className="pf-matrix-wrap"><table className="pf-matrix"><thead><tr><th>Mảng báo cáo</th>{viewerGroups.map(g=><th key={g.id}>{g.label}</th>)}</tr></thead>
    <tbody>{tracks.map(t=><tr key={t}><th>{t}</th>{viewerGroups.map(g=>{const on=p.visibility[t].includes(g.id);return <td key={g.id}><input type="checkbox" aria-label={`${g.label} xem báo cáo ${t}`} checked={on} onChange={()=>toggleVis(t,g.id)}/></td>})}</tr>)}</tbody></table></div></section>
 </>;

 const body=[info,people,okr,stages,goals][step];const last=STEPS.length-1;
 const hintOf=(i:number)=>i===0?'Cần tên dự án, Product Manager, đơn vị phụ trách và ngày bắt đầu':i===3?'Mỗi giai đoạn cần có tên':undefined;
 const footer=editing?<><Button primary disabled={firstInvalid>=0} title={firstInvalid>=0?'Còn thiếu thông tin ở '+STEPS[firstInvalid]:undefined} onClick={save}>Lưu</Button><Button onClick={close}>Hủy</Button></>
  :<>{step<last?<Button primary disabled={!valid[step]} title={!valid[step]?hintOf(step):undefined} onClick={()=>setStep(step+1)}>Tiếp theo: {STEPS[step+1]}</Button>:<Button primary onClick={save}><CheckCircle/> Tạo dự án</Button>}
   {step>0?<Button onClick={()=>setStep(step-1)}><ArrowLeft/> Quay lại</Button>:<Button onClick={close}>Hủy</Button>}
   {step===2&&<small className="hint">{okrCount?`${okrCount} mục tiêu`:'Có thể bỏ qua, tạo OKR sau'}</small>}{step===last&&<small className="hint">Bước này có thể để mặc định</small>}</>;

 return <Modal drawer title={editing?'Chỉnh sửa dự án':'Tạo dự án mới'} close={close} footer={<div className="eks-footer">{footer}</div>}>
  <div className="pf-shell">
  {editing?<div className="inner-tabs eks-tabs pf-tabs">{STEPS.map((s,i)=><button key={s} className={step===i?'active':''} onClick={()=>setStep(i)}>{s}{!valid[i]&&<i className="req"> !</i>}</button>)}</div>
   :<ol className="eks-steps">{STEPS.map((s,i)=><li key={s} className={step===i?'current':step>i?'done':''}><span>{step>i?<CheckCircle weight="fill"/>:i+1}</span>{s}</li>)}</ol>}
  {body}</div>
 </Modal>;
}

const fmt=(s:string)=>s?s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4):'';
/** Dòng tóm tắt trên đầu trang dự án: loại · nền tảng · thời gian · giai đoạn hiện tại + mảng báo cáo đang yêu cầu. */
export function ProjectStrip({cfg}:{cfg:ProjectConfig}){
 const s=cfg.stages.find(x=>x.id===cfg.currentStage)??cfg.stages[0];
 return <div className="pf-strip"><span>{projectTypes.find(t=>t.id===cfg.type)?.label} · {cfg.subType}</span>{cfg.platforms.length>0&&<><i>·</i><span>{cfg.platforms.join(', ')}</span></>}<i>·</i><span>{fmt(cfg.start)} – {cfg.end?fmt(cfg.end):'Dài hạn'}</span>
  {s&&<span className="pf-stage-chip" title={'Giai đoạn hiện tại · '+s.cadence}>Giai đoạn: <b>{s.name}</b>{s.tracks.length?<> · Báo cáo {s.tracks.join(', ')} · {s.cadence}</>:' · Không yêu cầu báo cáo'}</span>}</div>;
}
/** Tab "Quản lý dự án": xem cấu hình (nhân sự, giai đoạn, OKR team, Slack, quyền xem) + nút Chỉnh sửa mở lại ProjectForm. */
export function ProjectSettings({cfg,edit}:{cfg:ProjectConfig;edit:()=>void}){
 const {data}=useStore();const who=(ids:string[])=>ids.map(id=>data.users.find(u=>u.id===id)?.name??id).join(', ')||'—';
 const cur=cfg.currentStage||cfg.stages[0]?.id;
 return <section className="surface document pf-settings"><div className="row between"><h2>Quản lý dự án</h2><Button onClick={edit}>Chỉnh sửa</Button></div>
  <div className="pf-grid">
   <div><h3>Nhân sự & vai trò</h3><dl>{roles.map(r=><React.Fragment key={r.id}><dt>{r.label}</dt><dd>{who(cfg.roles[r.id])}</dd></React.Fragment>)}</dl></div>
   <div><h3>Thông tin</h3><dl><dt>Đơn vị</dt><dd>{cfg.unit}</dd><dt>Team</dt><dd>{cfg.team||"—"}</dd><dt>Phối hợp</dt><dd>{cfg.partners?.join(", ")||"—"}</dd><dt>Thời gian</dt><dd>{fmt(cfg.start)} – {cfg.end?fmt(cfg.end):'Dài hạn, xuyên kỳ'}</dd><dt>Nền tảng</dt><dd>{cfg.platforms.join(', ')||'—'}</dd><dt>Slack</dt><dd>{cfg.channel||'Không gửi recap'}</dd></dl></div>
  </div>
  <h3>Giai đoạn & báo cáo</h3><ol className="pf-timeline">{cfg.stages.map(s=><li key={s.id} className={s.id===cur?'current':''}><strong>{s.name}</strong>{s.start&&<small>{fmt(s.start)}</small>}<span>{s.tracks.length?s.tracks.join(', ')+' · '+s.cadence:'Không yêu cầu báo cáo'}</span></li>)}</ol>
  <h3>Đóng góp OKR BU / Team</h3><p>{cfg.teamGoals.length?teamGoals.filter(g=>cfg.teamGoals.includes(g.id)).map(g=><span className="pf-kr" key={g.id} title={g.label}><b>{g.code}</b> {g.label}</span>):<span className="hint">Chưa liên kết</span>}</p>
  <h3>Quyền xem báo cáo</h3><div className="pf-matrix-wrap"><table className="pf-matrix readonly"><thead><tr><th>Mảng</th>{viewerGroups.map(g=><th key={g.id}>{g.label}</th>)}</tr></thead><tbody>{tracks.map(t=><tr key={t}><th>{t}</th>{viewerGroups.map(g=><td key={g.id}>{cfg.visibility[t].includes(g.id)?<Check size={14} aria-label="Được xem"/>:<span className="hint" aria-label="Không">—</span>}</td>)}</tr>)}</tbody></table></div>
 </section>;
}
