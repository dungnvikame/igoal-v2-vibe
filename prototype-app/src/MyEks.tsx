import React from 'react';
import {Report,entities,people,blankReport} from './model';
import {useStore} from './store';
import {OkrCard,ReportHub} from './ReportHub';

/** Trang My EKS bám iGoal thật: card "Mục tiêu (EKS)" + card hồ sơ bên phải, dưới là "Tổng hợp báo cáo" cá nhân. */
export function MyEks({user,create,edit,open,source}:{user:string;create:()=>void;edit:(r:Report)=>void;open:(r:Report)=>void;source:(id:string)=>void}){
 const {data}=useStore();const me=people.find(p=>p.id===user);
 const eks=entities.filter(e=>e.type==='EKS');
 // Chỉ báo cáo cá nhân của chính user (member khác cũng có báo cáo tuần cá nhân trong mock).
 const reports=data.reports.filter(r=>r.scope==='personal'&&r.owner===me?.name);
 return <><div className="eks-layout"><OkrCard title="Mục tiêu (EKS)" objectives={eks} children={()=>[]} onCheckin={()=>edit(blankReport('checkin','personal'))}/>
  <aside className="surface profile-card"><span className="avatar large">{me?.name.trim().split(/\s+/).pop()?.[0]}</span><strong>{me?.name}</strong><span>{me?.role}</span><span>Technology</span></aside></div>
  <ReportHub reports={reports} create={create} edit={edit} open={open} source={source}/></>;
}
