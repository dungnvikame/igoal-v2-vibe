import React,{useState} from 'react';
import {Plus,X,Check,CheckCircle,ArrowLeft,Hash,Info,Flag,Target,WarningCircle} from 'phosphor-react';
import {tracks,Track,teams,teamGoals,entities,entityAdmins,daysAgo,dateLabel,relativeDate} from './model';
import {useStore} from './store';
import {Button,Modal,AutoTextarea} from './ui';
import {ProjectConfig,RoleId,ProjectOkr,roleLabel,Stage,Phase,Req,projectTypes,platforms,units,unitTeams,roles,viewerGroups,cadences,cadenceDays,stageTemplate,applyFlagship,blankProject,newMilestone,newOkr,currentPeriod,reporters,reqLabel,phases,activeTracks} from './project-config';
import {teamName} from './Alignment';
import {MemberSearch} from './MemberSearch';
import {MemberRoles} from './MemberRoles';
import {uid} from './model';

const STEPS=['Thông tin chung','Thành viên','OKR dự án','Giai đoạn & báo cáo','Slack & quyền xem'] as const;
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
 const [step,setStep]=useState(0),[pending,setPending]=useState<string[]>([]);
 const set=(x:Partial<ProjectConfig>)=>setP(v=>({...v,...x}));
 // Cập nhật theo giá trị mới nhất (bấm nhanh nhiều lần không mất thay đổi).
 const upd=(f:(v:ProjectConfig)=>Partial<ProjectConfig>)=>setP(v=>({...v,...f(v)}));
 const subs=projectTypes.find(t=>t.id===p.type)!.subs;
 const users=data.users.filter(u=>u.active);
 const valid=[!!p.name.trim()&&!!p.start&&(!p.end||p.end>=p.start)&&(p.roles.PM??[]).length>0&&!!p.unit,pending.length===0,true,p.stages.length>0&&p.stages.every(s=>s.name.trim()),true];
 const firstInvalid=valid.findIndex(v=>!v);
 // Đổi phân loại khi tạo mới → thay giai đoạn mẫu cho khớp (Game/App khác Sản phẩm nội bộ).
 const setSub=(subType:string)=>upd(v=>({subType,...(!editing?{stages:stageTemplate(subType,v.flagship),currentStage:''}:{})}));
 const setFlagship=(flagship:boolean)=>upd(v=>({flagship,stages:applyFlagship(v.stages,flagship)}));
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
  <Field label="Dự án chủ lực" isNew hint={p.flagship?"Đủ nguồn lực mọi đầu: ở giai đoạn Maturity, Product / UA / Creative vẫn báo cáo hằng tuần.":"Không chủ lực: ở giai đoạn Maturity chỉ còn UA vận hành, báo cáo khi có cập nhật."}><label className="pf-switch"><input type="checkbox" checked={p.flagship} onChange={e=>setFlagship(e.target.checked)}/><span/>{p.flagship?"Có":"Không"}</label></Field>
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

 const people=<section className="eks-card">
  <p className="hint pf-intro-plain">Thêm thành viên, sau đó chọn vai trò. Có thể tạo vai trò mới. Creative viết báo cáo mảng Creative.</p>
  <MemberRoles users={users} value={p.roles} onChange={roles=>set({roles})} pending={pending} setPending={setPending}/>
 </section>;

 // OKR đã có của dự án (ngoài cấu hình, vd. dự án mẫu) chỉ hiện để tham chiếu khi sửa.
 const existing=editing?entities.filter(e=>e.type==='Objective'&&e.project===p.id&&!p.okrs.some(o=>o.id===e.id)):[];
 const krs=teamGoals.filter(g=>g.parent);const chosenKrs=krs.filter(g=>p.teamGoals.includes(g.id));
 const okrOptions=[...existing.map(o=>({id:o.id,label:o.label})),...p.okrs.filter(o=>o.title.trim()).map(o=>({id:o.id,label:o.title}))];
 const okr=<>
  <p className="hint pf-intro-top"><Target/><span>Đi từ trên xuống: dự án đóng góp cho KR nào của BU/Team → OKR dự án kỳ <b>{currentPeriod}</b> → mốc cần đạt. Không bắt buộc, có thể làm sau.</span></p>
  {/* 1. OKR của BU / Team mà dự án đóng góp (chuyển từ bước cuối về đây cho đúng thứ tự mục tiêu). */}
  <section className="eks-card"><h4 className="pf-h">Đóng góp cho OKR BU / Team<New/></h4>
   <div className="eks-kr-list">{krs.map(g=>{const on=p.teamGoals.includes(g.id);return <button key={g.id} aria-pressed={on} className={'eks-kr'+(on?' on':'')} onClick={()=>upd(v=>({teamGoals:on?v.teamGoals.filter(x=>x!==g.id):[...v.teamGoals,g.id],okrs:on?v.okrs.map(o=>o.teamGoal===g.id?{...o,teamGoal:undefined}:o):v.okrs}))}>{on?<Check size={14}/>:<Plus size={14}/>}<b>{g.code}</b><span>{g.label} <small className="hint">· Team {teamName(g.team)}</small></span></button>})}</div></section>
  {/* 2. OKR dự án: mỗi mục tiêu chọn được KR team mà nó phục vụ. */}
  <h4 className="pf-h pf-sec">OKR dự án · {currentPeriod}</h4>
  {existing.length>0&&<section className="eks-card pf-okr-existing"><small>Đã có</small>{existing.map(o=><div key={o.id}><strong>{o.label}</strong></div>)}</section>}
  {p.okrs.map((o,oi)=><section className="eks-card pf-okr" key={o.id}>
   <header className="pf-okr-head"><span className="okr-code circle">O{existing.length+oi+1}</span><AutoTextarea className="pf-okr-title" aria-label={'Mục tiêu '+(oi+1)} rows={1} placeholder="Tên mục tiêu (Objective)" value={o.title} onChange={e=>patchOkr(o.id,x=>({...x,title:e.target.value}))}/><button className="pf-x" aria-label={'Xóa mục tiêu '+(oi+1)} onClick={()=>upd(v=>({okrs:v.okrs.filter(x=>x.id!==o.id),milestones:v.milestones.map(m=>m.okr===o.id?{...m,okr:undefined}:m)}))}><X size={14}/></button></header>
   {chosenKrs.length>0&&<label className="pf-okr-link">Đóng góp cho<select className="eks-select small" aria-label={'KR team cho mục tiêu '+(oi+1)} value={o.teamGoal??''} onChange={e=>patchOkr(o.id,x=>({...x,teamGoal:e.target.value||undefined}))}><option value="">— Chưa chọn —</option>{chosenKrs.map(g=><option key={g.id} value={g.id}>{g.code} · {g.label}</option>)}</select></label>}
   {o.items.map((k,ki)=><div className="pf-okr-item" key={k.id}><select className="eks-select small" aria-label={'Loại kết quả '+(ki+1)} value={k.type} onChange={e=>patchOkr(o.id,x=>({...x,items:x.items.map(y=>y.id===k.id?{...y,type:e.target.value as 'KR'|'KS'}:y)}))}><option value="KR">KR</option><option value="KS">KS</option></select>
    <input className="eks-input one" aria-label={'Kết quả '+(ki+1)} placeholder={k.type==='KR'?'Key Result đo được, vd. D1 retention ≥ 40%':'Key Success, vd. Soft launch 2 thị trường'} value={k.title} onChange={e=>patchOkr(o.id,x=>({...x,items:x.items.map(y=>y.id===k.id?{...y,title:e.target.value}:y)}))}/>
    <button className="pf-x" aria-label={'Xóa kết quả '+(ki+1)} onClick={()=>patchOkr(o.id,x=>({...x,items:x.items.filter(y=>y.id!==k.id)}))}><X size={14}/></button></div>)}
   <Button quiet onClick={()=>patchOkr(o.id,x=>({...x,items:[...x.items,{id:uid(),type:'KR',title:''}]}))}><Plus/> Thêm KR / KS</Button>
  </section>)}
  <Button onClick={()=>upd(v=>({okrs:[...v.okrs,newOkr()]}))}><Plus/> Thêm mục tiêu</Button>
  {/* 3. Mốc: ngày cụ thể cần đạt một kết quả, gắn với mục tiêu. Khác giai đoạn (giai đoạn = ai báo cáo, bao lâu một lần). */}
  <section className="eks-card pf-ms-card"><h4 className="pf-h"><Flag/> Mốc quan trọng <small className="hint">không bắt buộc</small></h4>
   <p className="hint">Ngày cụ thể cần đạt một kết quả của mục tiêu, vd. "Soft launch VN · 15/10". Khác <b>giai đoạn</b> (giai đoạn chỉ quy định ai báo cáo, bao lâu một lần). Mốc gắn được vào báo cáo để theo dõi tiến độ.</p>
   {p.milestones.map(m=><div className="pf-ms" key={m.id}><input className="eks-input one" aria-label="Tên mốc" placeholder="Tên mốc" value={m.label} onChange={e=>upd(v=>({milestones:v.milestones.map(x=>x.id===m.id?{...x,label:e.target.value}:x)}))}/><input type="date" className="eks-select" aria-label="Ngày" value={m.date} onChange={e=>upd(v=>({milestones:v.milestones.map(x=>x.id===m.id?{...x,date:e.target.value}:x)}))}/>
    {okrOptions.length>0&&<select className="eks-select small" aria-label="Thuộc mục tiêu" value={m.okr??''} onChange={e=>upd(v=>({milestones:v.milestones.map(x=>x.id===m.id?{...x,okr:e.target.value||undefined}:x)}))}><option value="">Mục tiêu…</option>{okrOptions.map((o,i)=><option key={o.id} value={o.id}>O{i+1} · {o.label.slice(0,40)}</option>)}</select>}
    <button className="pf-x" aria-label="Xóa mốc" onClick={()=>upd(v=>({milestones:v.milestones.filter(x=>x.id!==m.id)}))}><X size={14}/></button></div>)}
   <Button quiet onClick={()=>upd(v=>({milestones:[...v.milestones,newMilestone()]}))}><Plus/> Thêm mốc</Button></section>
 </>;

 // Ma trận Giai đoạn × Đầu báo cáo (Product / UA / Creative) + tần suất, gom theo pha: Phát triển sản phẩm → Vận hành → Tạm dừng.
 const addStage=(phase:Phase)=>upd(v=>{const s:Stage={id:uid(),name:'',phase,start:'',req:{'Sản phẩm':phase==='dev'?'required':'optional','Kinh doanh':phase==='ops'?'required':'none','Creative':'optional'},cadence:'1 tuần/lần'};const i=v.stages.map(x=>x.phase).lastIndexOf(phase);return {stages:i<0?[...v.stages,s]:[...v.stages.slice(0,i+1),s,...v.stages.slice(i+1)]}});
 const isApp=p.subType==='Game'||p.subType==='App';
 const stages=<>
  <p className="hint pf-intro-top"><Info/><span>Mỗi giai đoạn quy định <b>ai phải báo cáo</b> và <b>bao lâu một lần</b>. {isApp?'Mẫu cho Game/App: Prototype → Soft Launch (Product báo cáo chính) → Global Launch → Maturity (UA báo cáo chính) → Pend.':'Có thể đổi tên, thêm hoặc bớt giai đoạn.'}</span></p>
  <div className="pf-legend"><span className="rq required">Bắt buộc</span> phải gửi theo tần suất, quá hạn bị tính thiếu <span className="rq optional">Tùy chọn</span> gửi khi cần <span className="rq none">Không cần</span></div>
  <section className="eks-card flush"><table className="pf-stages"><thead><tr className="pf-head-top"><th className="c-now" rowSpan={2}>Đang ở</th><th rowSpan={2}>Giai đoạn</th><th colSpan={reporters.length} className="pf-head-group">Ai phải báo cáo</th><th rowSpan={2}>Tần suất</th><th rowSpan={2}/></tr><tr className="pf-head-sub">{reporters.map(r=><th key={r.track}>{r.label}</th>)}</tr></thead>
   {phases.map(ph=>{const list=p.stages.filter(s=>s.phase===ph.id);if(!list.length&&ph.id==='pause')return null;return <tbody key={ph.id}>
    <tr className="pf-phase"><td colSpan={reporters.length+4}><strong>{ph.label}</strong><small>{ph.hint}</small><button className="text-button" onClick={()=>addStage(ph.id)}><Plus size={12}/> Thêm</button></td></tr>
    {list.map(s=><tr key={s.id} className={current===s.id?'current':''}>
     <td className="c-now"><input type="radio" name="current-stage" aria-label={'Giai đoạn hiện tại: '+s.name} checked={current===s.id} onChange={()=>set({currentStage:s.id})}/></td>
     <td className="c-name"><input className="pf-stage-name" aria-label="Tên giai đoạn" value={s.name} placeholder="Tên giai đoạn" onChange={e=>patchStage(s.id,{name:e.target.value})}/><input type="date" className="pf-stage-date" aria-label={'Bắt đầu '+s.name} value={s.start} onChange={e=>patchStage(s.id,{start:e.target.value})}/></td>
     {reporters.map(r=><td key={r.track}><select className={'rq-select rq '+s.req[r.track]} aria-label={`${r.label} báo cáo ở ${s.name}`} value={s.req[r.track]} onChange={e=>patchStage(s.id,{req:{...s.req,[r.track]:e.target.value as Req}})}>{(Object.keys(reqLabel) as Req[]).map(k=><option key={k} value={k}>{reqLabel[k]}</option>)}</select></td>)}
     <td><select className="eks-select small" aria-label={'Tần suất '+s.name} value={s.cadence} disabled={!activeTracks(s).length} onChange={e=>patchStage(s.id,{cadence:e.target.value})}>{cadences.map(c=><option key={c}>{c}</option>)}</select></td>
     <td>{p.stages.length>1&&<button className="pf-x" aria-label={'Xóa giai đoạn '+s.name} onClick={()=>upd(v=>({stages:v.stages.filter(x=>x.id!==s.id),currentStage:current===s.id?'':v.currentStage}))}><X size={14}/></button>}</td>
    </tr>)}</tbody>})}
  </table></section>
  {isApp&&p.stages.some(s=>s.key==='maturity')&&<p className="hint">Maturity đang theo mẫu <b>{p.flagship?'dự án chủ lực':'dự án không chủ lực'}</b>: {p.flagship?'mọi đầu báo cáo hằng tuần.':'chỉ UA vận hành, báo cáo khi có cập nhật để dự án không bị thả trôi.'} Đổi ở "Dự án chủ lực" (bước 1).</p>}
 </>;

 const goals=<>
  <section className="eks-card"><h4 className="pf-h"><Hash/> Kênh Slack nhận recap<New/></h4><p className="hint">Sau khi xuất bản báo cáo dự án, iGoal gửi recap + link về kênh này. Để trống nếu không dùng.</p>
   <div className="pf-slack"><Hash/><input aria-label="Kênh Slack" placeholder="ten-kenh-du-an" value={p.channel.replace(/^#/,'')} onChange={e=>set({channel:e.target.value})}/></div></section>
  <section className="eks-card flush"><h4 className="pf-h pad">Quyền xem báo cáo theo nhóm<New/></h4><p className="hint pad">Ai được xem báo cáo của từng mảng. Mặc định báo cáo Kinh doanh/UA chỉ PM, UA, BU Head và Vận hành xem được.</p>
   <div className="pf-matrix-wrap"><table className="pf-matrix"><thead><tr><th>Mảng báo cáo</th>{viewerGroups.map(g=><th key={g.id}>{g.label}</th>)}</tr></thead>
    <tbody>{tracks.map(t=><tr key={t}><th>{t}</th>{viewerGroups.map(g=>{const on=p.visibility[t].includes(g.id);return <td key={g.id}><input type="checkbox" aria-label={`${g.label} xem báo cáo ${t}`} checked={on} onChange={()=>toggleVis(t,g.id)}/></td>})}</tr>)}</tbody></table></div></section>
 </>;

 const body=[info,people,okr,stages,goals][step];const last=STEPS.length-1;
 const hintOf=(i:number)=>i===0?'Cần tên dự án, Product Manager, đơn vị phụ trách và ngày bắt đầu':i===1?'Chọn vai trò cho thành viên vừa thêm':i===3?'Mỗi giai đoạn cần có tên':undefined;
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
const reqText=(s:Stage)=>{const a=activeTracks(s);return a.length?a.map(r=>r.label+(s.req[r.track]==='optional'?' (tùy chọn)':'')).join(', ')+' · '+s.cadence:'Không yêu cầu báo cáo'};
/**
 * Tình trạng báo cáo của từng đầu trong giai đoạn hiện tại: dựa vào báo cáo dự án đã gửi gần nhất theo "Loại báo cáo" (mảng).
 * Bắt buộc + quá một kỳ (theo tần suất) → "Thiếu"; tùy chọn → chỉ hiện lần gửi gần nhất. Giúp PM / BU Head thấy đầu nào đang thiếu báo cáo.
 */
function ReportStatus({cfg,stage}:{cfg:ProjectConfig;stage:Stage}){
 const {data}=useStore();const days=cadenceDays(stage.cadence);
 const last=(t:Track)=>data.reports.filter(r=>r.scope==='project'&&r.status==='PUBLISHED'&&r.relations.includes(cfg.id)&&(r.track??'Sản phẩm')===t).sort((a,b)=>b.date.localeCompare(a.date))[0];
 const list=activeTracks(stage);if(!list.length)return <span className="pf-rs muted">Giai đoạn tạm dừng · không yêu cầu báo cáo</span>;
 return <>{list.map(r=>{const l=last(r.track);const req=stage.req[r.track];const late=req==='required'&&days!==null&&(!l||daysAgo(l.date)>=days);
  return <span key={r.track} className={'pf-rs '+(late?'late':req==='required'?'ok':'muted')} title={l?`${l.title} · ${dateLabel(l.date)}`:'Chưa có báo cáo'}>{late?<WarningCircle weight="fill"/>:req==='required'?<CheckCircle weight="fill"/>:null}<b>{r.label}</b>{l?relativeDate(l.date).toLowerCase():'chưa có báo cáo'}{late&&' · thiếu'}{req==='optional'&&' · tùy chọn'}</span>})}</>;
}
/** Dòng tóm tắt trên đầu trang dự án: loại · chủ lực · nền tảng · thời gian; giai đoạn hiện tại (PM đổi nhanh) + ai phải báo cáo, tình trạng báo cáo. */
export function ProjectStrip({cfg}:{cfg:ProjectConfig}){
 const {user,saveProject}=useStore();const s=cfg.stages.find(x=>x.id===cfg.currentStage)??cfg.stages[0];
 const canEdit=entityAdmins[cfg.id]?.includes(user);
 return <div className="pf-strip-wrap"><div className="pf-strip"><span>{projectTypes.find(t=>t.id===cfg.type)?.label} · {cfg.subType}</span>{cfg.flagship&&<span className="pf-flag">Chủ lực</span>}{cfg.platforms.length>0&&<><i>·</i><span>{cfg.platforms.join(', ')}</span></>}<i>·</i><span>{fmt(cfg.start)} – {cfg.end?fmt(cfg.end):'Dài hạn'}</span></div>
  {s&&<div className="pf-stage-bar"><span className="pf-stage-label">Giai đoạn</span>
   {canEdit?<select className="pf-stage-pick" aria-label="Giai đoạn hiện tại" value={s.id} onChange={e=>saveProject({...cfg,currentStage:e.target.value})}>{phases.map(ph=>{const l=cfg.stages.filter(x=>x.phase===ph.id);return l.length?<optgroup key={ph.id} label={ph.label}>{l.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</optgroup>:null})}</select>:<b>{s.name}</b>}
   <small>{phases.find(p=>p.id===s.phase)?.label} · {reqText(s)}</small><span className="pf-rs-list"><ReportStatus cfg={cfg} stage={s}/></span></div>}
 </div>;
}
/** Tab "Quản lý dự án": xem cấu hình (nhân sự, giai đoạn, OKR team, Slack, quyền xem) + nút Chỉnh sửa mở lại ProjectForm. */
export function ProjectSettings({cfg,edit}:{cfg:ProjectConfig;edit:()=>void}){
 const {data}=useStore();const who=(ids:string[])=>ids.map(id=>data.users.find(u=>u.id===id)?.name??id).join(', ')||'—';
 const cur=cfg.currentStage||cfg.stages[0]?.id;
 return <section className="surface document pf-settings"><div className="row between"><h2>Quản lý dự án</h2><Button onClick={edit}>Chỉnh sửa</Button></div>
  <div className="pf-grid">
   <div><h3>Nhân sự & vai trò</h3><dl>{Object.entries(cfg.roles).filter(([,ids])=>ids.length).map(([r,ids])=><React.Fragment key={r}><dt>{roleLabel(r)}</dt><dd>{who(ids)}</dd></React.Fragment>)}</dl></div>
   <div><h3>Thông tin</h3><dl><dt>Loại</dt><dd>{projectTypes.find(t=>t.id===cfg.type)?.label} · {cfg.subType}{cfg.flagship?' · Chủ lực':''}</dd><dt>Đơn vị</dt><dd>{cfg.unit}</dd><dt>Team</dt><dd>{cfg.team||"—"}</dd><dt>Phối hợp</dt><dd>{cfg.partners?.join(", ")||"—"}</dd><dt>Thời gian</dt><dd>{fmt(cfg.start)} – {cfg.end?fmt(cfg.end):'Dài hạn, xuyên kỳ'}</dd><dt>Nền tảng</dt><dd>{cfg.platforms.join(', ')||'—'}</dd><dt>Slack</dt><dd>{cfg.channel||'Không gửi recap'}</dd></dl></div>
  </div>
  <h3>Giai đoạn & báo cáo</h3>
  <div className="pf-matrix-wrap flush"><table className="pf-stages readonly"><thead><tr><th>Giai đoạn</th>{reporters.map(r=><th key={r.track}>{r.label}</th>)}<th>Tần suất</th></tr></thead>
   {phases.map(ph=>{const l=cfg.stages.filter(s=>s.phase===ph.id);return l.length?<tbody key={ph.id}><tr className="pf-phase"><td colSpan={reporters.length+2}><strong>{ph.label}</strong><small>{ph.hint}</small></td></tr>
    {l.map(s=><tr key={s.id} className={s.id===cur?'current':''}><td className="c-name"><strong>{s.name}</strong>{s.id===cur&&<span className="pf-now-tag">Hiện tại</span>}{s.start&&<small>{fmt(s.start)}</small>}</td>{reporters.map(r=><td key={r.track}><span className={'rq '+s.req[r.track]}>{reqLabel[s.req[r.track]]}</span></td>)}<td>{activeTracks(s).length?s.cadence:'—'}</td></tr>)}</tbody>:null})}
  </table></div>
  <h3>Đóng góp OKR BU / Team</h3><p>{cfg.teamGoals.length?teamGoals.filter(g=>cfg.teamGoals.includes(g.id)).map(g=><span className="pf-kr" key={g.id} title={g.label}><b>{g.code}</b> {g.label}</span>):<span className="hint">Chưa liên kết</span>}</p>
  <h3>Quyền xem báo cáo</h3><div className="pf-matrix-wrap"><table className="pf-matrix readonly"><thead><tr><th>Mảng</th>{viewerGroups.map(g=><th key={g.id}>{g.label}</th>)}</tr></thead><tbody>{tracks.map(t=><tr key={t}><th>{t}</th>{viewerGroups.map(g=><td key={g.id}>{cfg.visibility[t].includes(g.id)?<Check size={14} aria-label="Được xem"/>:<span className="hint" aria-label="Không">—</span>}</td>)}</tr>)}</tbody></table></div>
 </section>;
}
