import React,{useState} from 'react';
import {Report,Eks,entities,people,blankReport} from './model';
import {useStore} from './store';
import {OkrCard,ReportHub} from './ReportHub';
import {KsAlignment} from './Alignment';
import {EksForm} from './EksForm';

/**
 * Trang My EKS bám iGoal thật: card "Mục tiêu (EKS)" (EKS + các KS con) + card hồ sơ bên phải, dưới là "Tổng hợp báo cáo" cá nhân.
 * "Tạo mới" / bút sửa trên dòng EKS mở luồng EksForm. Dưới mỗi KS hiện KR team mà KS đóng góp (nếu có).
 */
export function MyEks({user,create,edit,open,source,notify}:{user:string;create:()=>void;edit:(r:Report)=>void;open:(r:Report)=>void;source:(id:string)=>void;notify:(s:string)=>void}){
 const {data}=useStore();const me=people.find(p=>p.id===user);
 // null = đóng, 'new' = tạo mới, Eks = đang sửa.
 const [form,setForm]=useState<Eks|'new'|null>(null);
 const eks=entities.filter(e=>e.type==='EKS');
 // Chỉ báo cáo cá nhân của chính user (member khác cũng có báo cáo tuần cá nhân trong mock).
 // Bản gửi riêng cho quản lý không nằm trong EKS (xem ở panel Nơi xuất hiện của bản gốc).
 const reports=data.reports.filter(r=>r.scope==='personal'&&r.owner===me?.name&&r.destination!=='manager');
 return <><div className="eks-layout"><OkrCard title="Mục tiêu (EKS)" objectives={eks} children={o=>entities.filter(e=>e.parent===o.id)} onCheckin={()=>edit(blankReport('checkin','personal'))}
   onCreate={()=>setForm('new')} onEdit={o=>setForm(data.eks.find(x=>x.id===o.id)??null)} sub={e=>e.type==='EKSKS'?<KsAlignment ksId={e.id}/>:null}/>
  <aside className="surface profile-card"><span className="avatar large">{me?.name.trim().split(/\s+/).pop()?.[0]}</span><strong>{me?.name}</strong><span>{me?.role}</span><span>Technology</span></aside></div>
  <ReportHub reports={reports} create={create} edit={edit} open={open} source={source}/>
  {form&&<EksForm key={form==='new'?'new':form.id} initial={form==='new'?undefined:form} close={()=>setForm(null)} notify={notify}/>}</>;
}
