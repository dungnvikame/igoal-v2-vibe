import React,{useState} from 'react';
import {Plus,Minus,X,ArrowsClockwise,Check,CheckCircle,WarningCircle,ArrowLeft} from 'phosphor-react';
import {Eks,EksKs,devTypes,metrics,teamGoals,uid} from './model';
import {useStore} from './store';
import {Button,Modal,AutoTextarea} from './ui';
import {teamName} from './Alignment';

/** Màu từng KS trên thanh trọng số (lặp lại khi quá 6 KS). */
const COLORS=['var(--blue)','var(--green)','var(--amber)','var(--purple)','var(--red)','#14b8a6'];
const STEPS=['Thông tin','Trọng số','Liên kết OKR team'] as const;
const EDIT_TABS=['Chỉnh sửa thông tin','Chỉnh sửa trọng số','Liên kết OKR team'] as const;
const blankKs=():EksKs=>({id:uid(),title:'',metric:'PERCENT',weight:0,progress:0});
/** Chia đều 100 cho n KS, phần dư dồn cho các KS đầu. */
const even=(ks:EksKs[])=>{const n=ks.length,base=Math.floor(100/n),rest=100-base*n;return ks.map((k,i)=>({...k,weight:base+(i<rest?1:0)}))};

/**
 * Tạo / sửa EKS, bám luồng iGoal thật + thêm bước 3:
 * 1) Thông tin: tên, loại phát triển (Team / Công ty / Bản thân), mô tả, danh sách KS (tên + đơn vị đo lường).
 * 2) Trọng số: tổng 100, Chia đều, − / + từng KS.
 * 3) Liên kết OKR team (mới): mỗi KS chọn KR của team mà nó đóng góp. Không bắt buộc.
 *    Báo cáo gắn EKS sẽ hiện "Đóng góp vào OKR team: KR…" từ các liên kết này.
 * Tạo mới = đi lần lượt 3 bước. Sửa = 3 tab như iGoal ("Chỉnh sửa thông tin" / "Chỉnh sửa trọng số" / "Liên kết OKR team") + Lưu, Xóa EKS.
 */
export function EksForm({initial,close,notify}:{initial?:Eks;close:()=>void;notify:(s:string)=>void}){
 const {data,user,saveEks,deleteEks}=useStore();const editing=!!initial;
 const [e,setE]=useState<Eks>(()=>initial??{id:uid(),title:'',devType:'TEAM',description:'',ks:[blankKs()]});
 const [links,setLinks]=useState<Record<string,string[]>>(()=>Object.fromEntries((initial?.ks??[]).map(k=>[k.id,data.alignments?.[k.id]??[]])));
 const [step,setStep]=useState(0),[confirmDelete,setConfirmDelete]=useState(false);
 const team=data.users.find(u=>u.id===user)?.team??'tech';
 const goals=teamGoals.filter(g=>g.team===team);const krs=goals.filter(g=>g.parent);
 const ks=e.ks.filter(k=>k.title.trim());const total=e.ks.reduce((n,k)=>n+k.weight,0);
 const infoOk=!!e.title.trim()&&ks.length>0,weightOk=total===100;
 const patchKs=(id:string,p:Partial<EksKs>)=>setE(x=>({...x,ks:x.ks.map(k=>k.id===id?{...k,...p}:k)}));
 const toggleLink=(ksId:string,g:string)=>setLinks(l=>{const cur=l[ksId]??[];return {...l,[ksId]:cur.includes(g)?cur.filter(x=>x!==g):[...cur,g]}});
 // Sang bước trọng số: bỏ KS trống; nếu chưa có trọng số nào thì chia đều sẵn.
 const toWeights=()=>{setE(x=>{const list=x.ks.filter(k=>k.title.trim());return {...x,ks:list.reduce((n,k)=>n+k.weight,0)?list:even(list)}});setStep(1)};
 const save=()=>{const final={...e,title:e.title.trim(),ks:e.ks.filter(k=>k.title.trim())};const ids=final.ks.map(k=>k.id);
  saveEks(final,Object.fromEntries(ids.map(id=>[id,links[id]??[]])));notify(editing?'Đã lưu EKS':'Đã tạo EKS · '+final.title);close()};
 const linkedCount=e.ks.filter(k=>(links[k.id]??[]).length).length;

 const info=<>
  <input className="eks-title" aria-label="Tên mục tiêu" placeholder="Viết tên mục tiêu" value={e.title} onChange={ev=>setE({...e,title:ev.target.value})}/>
  <section className="eks-card"><div className="eks-field"><span>Loại phát triển</span><div className="eks-pills" role="radiogroup" aria-label="Loại phát triển">{devTypes.map(t=><button key={t.id} role="radio" aria-checked={e.devType===t.id} className={e.devType===t.id?'on':''} onClick={()=>setE({...e,devType:t.id})}>{t.label}</button>)}</div></div>
   <div className="eks-field"><span>Mô tả mục tiêu</span><AutoTextarea aria-label="Mô tả mục tiêu" placeholder="Nhập mô tả mục tiêu" rows={1} value={e.description} onChange={ev=>setE({...e,description:ev.target.value})}/></div></section>
  {e.ks.map((k,i)=><section className="eks-card" key={k.id}><header className="eks-ks-head"><strong>Key Success {i+1}</strong>{e.ks.length>1&&<button aria-label={'Xóa Key Success '+(i+1)} onClick={()=>setE({...e,ks:e.ks.filter(x=>x.id!==k.id)})}><X size={14}/></button>}</header>
   <label className="eks-label">Tên KS<AutoTextarea className="eks-input" placeholder="Nhập tên KS" rows={3} value={k.title} onChange={ev=>patchKs(k.id,{title:ev.target.value})}/></label>
   <label className="eks-label">Đơn vị đo lường<select className="eks-select" value={k.metric} onChange={ev=>patchKs(k.id,{metric:ev.target.value as EksKs['metric']})}>{metrics.map(m=><option key={m.id} value={m.id}>{m.label}</option>)}</select></label></section>)}
  <Button onClick={()=>setE({...e,ks:[...e.ks,blankKs()]})}><Plus/> Thêm KS mới</Button>
 </>;

 const weights=<section className="eks-card flush"><header className="eks-w-head"><strong>Trọng số của KS trong mục tiêu</strong><Button quiet onClick={()=>setE({...e,ks:even(e.ks)})}><ArrowsClockwise/> Chia đều</Button></header>
  <div className="eks-w-total"><div className="row"><span>Tổng trọng số</span><strong className={weightOk?'ok':'warn'}>{total} / 100</strong></div>
   <div className="eks-w-bar">{e.ks.map((k,i)=><span key={k.id} style={{width:Math.min(k.weight,100)+'%',background:COLORS[i%COLORS.length]}}/>)}</div>
   <small className={weightOk?'ok':'warn'}>{weightOk?'Đã đủ 100':total<100?`Còn thiếu ${100-total}`:`Vượt ${total-100}`}</small></div>
  {e.ks.map((k,i)=><div className="eks-w-row" key={k.id}><i style={{background:COLORS[i%COLORS.length]}}/><b>KS{i+1}</b><span>{k.title}</span>
   <div className="eks-stepper"><button aria-label={'Giảm trọng số KS'+(i+1)} onClick={()=>patchKs(k.id,{weight:Math.max(0,k.weight-5)})}><Minus size={14}/></button><input aria-label={'Trọng số KS'+(i+1)} inputMode="numeric" value={k.weight} onChange={ev=>patchKs(k.id,{weight:Math.min(100,Math.max(0,+ev.target.value.replace(/\D/g,'')||0))})}/><button aria-label={'Tăng trọng số KS'+(i+1)} onClick={()=>patchKs(k.id,{weight:Math.min(100,k.weight+5)})}><Plus size={14}/></button></div></div>)}
 </section>;

 const align=<>
  <p className="hint eks-align-hint">Chọn KR của team mà mỗi KS đóng góp vào. Không bắt buộc. Báo cáo gắn EKS này sẽ tự hiển thị phần đóng góp cho OKR team, nên không cần gắn OKR team vào từng báo cáo.</p>
  <section className="eks-card eks-team"><small>OKR team {teamName(team)} · H2 2026</small>{goals.filter(g=>!g.parent).map(o=><strong key={o.id}><b>{o.code}</b> {o.label}</strong>)}</section>
  {e.ks.map((k,i)=>{const on=links[k.id]??[];return <section className="eks-card eks-link" key={k.id}><header><b>KS{i+1}</b><span>{k.title}</span><small>{k.weight}%</small></header>
   <div className="eks-kr-list" role="group" aria-label={'KR team cho KS'+(i+1)}>{krs.map(g=>{const sel=on.includes(g.id);return <button key={g.id} aria-pressed={sel} className={'eks-kr'+(sel?' on':'')} onClick={()=>toggleLink(k.id,g.id)}>{sel?<Check size={14}/>:<Plus size={14}/>}<b>{g.code}</b><span>{g.label}</span></button>})}</div>
   {!on.length&&<small className="hint">Chưa đóng góp KR nào của team</small>}</section>})}
 </>;

 const body=[info,weights,align][step];
 const footer=editing?<><Button primary disabled={!infoOk||!weightOk} title={!infoOk?'Cần tên mục tiêu và ít nhất 1 KS':!weightOk?'Tổng trọng số phải bằng 100':undefined} onClick={save}>Lưu</Button><Button onClick={close}>Hủy</Button><span className="eks-foot-gap"/><Button className="danger-text" onClick={()=>setConfirmDelete(true)}>Xóa EKS</Button></>
  :step===0?<><Button primary disabled={!infoOk} title={infoOk?undefined:'Cần tên mục tiêu và ít nhất 1 KS'} onClick={toWeights}>Tiếp theo: Thiết lập trọng số</Button><Button onClick={close}>Hủy</Button></>
  :step===1?<><Button primary disabled={!weightOk} title={weightOk?undefined:'Tổng trọng số phải bằng 100'} onClick={()=>setStep(2)}>Tiếp theo: Liên kết OKR team</Button><Button onClick={()=>setStep(0)}><ArrowLeft/> Quay lại</Button></>
  :<><Button primary onClick={save}>Tạo EKS</Button><Button onClick={()=>setStep(1)}><ArrowLeft/> Quay lại</Button><small className="hint">{linkedCount?`${linkedCount}/${e.ks.length} KS đã liên kết OKR team`:'Có thể bỏ qua, liên kết sau khi sửa EKS'}</small></>;

 return <Modal drawer title={editing?'Chỉnh sửa EKS':'Tạo EKS'} close={close} footer={<div className="eks-footer">{footer}</div>}>
  {editing?<div className="inner-tabs eks-tabs">{EDIT_TABS.map((t,i)=><button key={t} className={step===i?'active':''} onClick={()=>(i===0||infoOk)&&setStep(i)} disabled={i>0&&!infoOk}>{t}{i===1&&!weightOk&&<WarningCircle weight="fill" className="warn"/>}</button>)}</div>
   :<ol className="eks-steps">{STEPS.map((s,i)=><li key={s} className={step===i?'current':step>i?'done':''}><span>{step>i?<CheckCircle weight="fill"/>:i+1}</span>{s}</li>)}</ol>}
  {body}
  {confirmDelete&&<Modal title="Xóa EKS này?" subtitle="EKS và các KS sẽ bị xóa. Báo cáo đã gắn EKS này giữ nguyên nội dung nhưng mất liên kết." close={()=>setConfirmDelete(false)}><div className="form-actions"><Button onClick={()=>setConfirmDelete(false)}>Giữ lại</Button><Button primary onClick={()=>{deleteEks(e.id);notify('Đã xóa EKS');close()}}>Xóa EKS</Button></div></Modal>}
 </Modal>;
}
