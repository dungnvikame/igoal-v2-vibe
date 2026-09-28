import React,{useState} from 'react';
import {ChatsCircle,CalendarBlank,Clock,Flag,CheckCircle,X} from 'phosphor-react';
import {Report,Contribution,Data,entities,kindLabel,dateLabel} from './model';
import {useStore} from './store';
import {Modal,Badge,Empty,ProgressBar} from './ui';

const KIND_ICON={weekly:CalendarBlank,instant:Clock,meeting:ChatsCircle,checkin:Flag} as const;
const TYPE_LABEL:Record<string,string>={Project:'Dự án',Objective:'Mục tiêu',KR:'KR',KS:'KS',EKS:'EKS',EKSKS:'KS',Milestone:'Mốc'};

/** Mọi bản ghi có relation tới entity. Với Objective, gom thêm bản ghi tag KR/KS con để nhìn được cả nhánh. */
export function relatedOf(data:Data,id:string){
 const e=entities.find(x=>x.id===id);
 const childIds=e?.type==='Objective'?entities.filter(x=>['KR','KS'].includes(x.type)&&x.project===e.project).map(x=>x.id):e?.type==='EKS'?entities.filter(x=>x.parent===e.id).map(x=>x.id):[];
 const direct=<T extends {relations:string[]}>(list:T[])=>list.filter(x=>x.relations.includes(id));
 const viaChild=<T extends {relations:string[]}>(list:T[])=>list.filter(x=>!x.relations.includes(id)&&x.relations.some(r=>childIds.includes(r)));
 return {entity:e,reports:direct(data.reports),contributions:direct(data.contributions),childReports:viaChild(data.reports),childContributions:viaChild(data.contributions)};
}
/** Số đếm ngắn cho dòng OKR. */
export function relatedCount(data:Data,id:string){const r=relatedOf(data,id);return {reports:r.reports.length,contributions:r.contributions.length}}

type Kind='checkin'|'report'|'contribution';
type Ev={key:string;kind:Kind;date:string;title:string;meta:string;progress?:number;note?:string;badge?:{text:string;tone:string};open:string;via?:string};
const KIND_LABEL:Record<Kind,string>={checkin:'Check-in',report:'Báo cáo',contribution:'Đóng góp'};

/** Chuyển bản ghi thành mốc trên dòng thời gian mục tiêu. % chỉ xuất hiện ở check-in có card cho đúng KS này. */
function toEvents(id:string,reports:Report[],contributions:Contribution[],via?:string):Ev[]{
 const rep=reports.filter(r=>r.status==='PUBLISHED'||via===undefined).map<Ev>(r=>{
  const card=r.checkins?.find(c=>c.ksId===id);
  if(r.kind==='checkin')return {key:r.id,kind:'checkin',date:r.date,title:card?`Check-in · ${card.progress}%`:'Check-in',meta:`${r.owner} · ${dateLabel(r.date)}`,progress:card?.progress,note:card?.result||r.sections.find(s=>s.text)?.text,open:r.id,via};
  return {key:r.id,kind:'report',date:r.date,title:r.title,meta:`${kindLabel[r.kind]}${r.track?' · '+r.track:''} · ${r.owner} · ${dateLabel(r.date)}`,badge:r.status==='DRAFT'?{text:'Bản nháp',tone:'neutral'}:undefined,open:r.id,via};
 });
 const con=contributions.filter(c=>c.recordStatus==='SUBMITTED').map<Ev>(c=>({key:c.id,kind:'contribution',date:c.date,title:c.title,meta:`${c.owner} · ${c.role} · ${dateLabel(c.date)}`,badge:c.confirmationStatus==='CONFIRMED'?{text:'Đã xác nhận',tone:'success'}:c.confirmationStatus==='NEED_MORE_INFO'?{text:'Cần bổ sung',tone:'warning'}:{text:'Chờ xác nhận',tone:'warning'},open:c.id,via}));
 return [...rep,...con];
}

/**
 * "Lịch sử mục tiêu": một dòng thời gian cho KR / KS / EKS / Mốc, gồm check-in (nơi duy nhất có %),
 * báo cáo (hành động, kết quả) và đóng góp (ghi nhận). Cùng một view cho member, PM, manager.
 * Trên trang (My EKS, Dự án) hiện ở panel phải; trong editor / chi tiết hiện dạng drawer. Chỉ tra cứu qua Relation layer.
 */
export function GoalHistory({id,close,open}:{id:string;close:()=>void;open:(id:string)=>void}){
 const {data}=useStore();const {entity,reports,contributions,childReports,childContributions}=relatedOf(data,id);
 const [filter,setFilter]=useState<'all'|Kind>('all');
 if(!entity)return <Empty title="Không tìm thấy mục tiêu" text=""/>;
 const project=entities.find(x=>x.id===entity.project);
 const events=[...toEvents(id,reports,contributions),...toEvents(id,childReports,childContributions,'qua KR / KS con')].sort((a,b)=>b.date.localeCompare(a.date));
 const count=(k:Kind)=>events.filter(e=>e.kind===k).length;
 const shown=events.filter(e=>filter==='all'||e.kind===filter);
 const lastCheckin=events.find(e=>e.kind==='checkin'&&e.progress!==undefined);
 const meta=[TYPE_LABEL[entity.type]??entity.type,project&&project.id!==entity.id?project.label:''].filter(Boolean).join(' · ');
 return <div className="goal-history">
  <div className="gh-head"><div><small>{meta}</small><h3>{entity.label}</h3></div><button className="icon-x" aria-label="Đóng" onClick={close}><X/></button></div>
  {entity.progress!==undefined&&<div className="goal-progress"><ProgressBar value={entity.progress}/><span className="hint">{lastCheckin?`Check-in gần nhất ${lastCheckin.meta.split(' · ').pop()}`:'Chưa có check-in'}</span></div>}
  {events.length===0?<p className="sp-empty">Chưa có báo cáo hay đóng góp nào gắn mục tiêu này.</p>:<>
  <div className="segmented">{([['all','Tất cả',events.length],['checkin','Check-in',count('checkin')],['report','Báo cáo',count('report')],['contribution','Đóng góp',count('contribution')]] as const).filter(([k,,n])=>k==='all'||n>0).map(([k,l,n])=><button key={k} className={filter===k?'active':''} onClick={()=>setFilter(k)}>{l}<span>{n}</span></button>)}</div>
  <ol className="goal-timeline">{shown.map(e=>{const Icon=e.kind==='contribution'?CheckCircle:e.kind==='checkin'?Flag:KIND_ICON[(data.reports.find(r=>r.id===e.open)?.kind)??'instant'];return <li key={e.key} className={e.kind}><span className="gt-date">{e.date.slice(8,10)}/{e.date.slice(5,7)}</span><span className="gt-dot"><Icon/></span><button className="gt-body" onClick={()=>open(e.open)}><span className="gt-title">{e.title}{e.badge&&<Badge tone={e.badge.tone}>{e.badge.text}</Badge>}</span>{e.note&&<span className="gt-note">{e.note.split('\n')[0]}</span>}<small>{e.meta}{e.via?' · '+e.via:''}</small></button></li>})}</ol></>}
 </div>;
}
/** Drawer bọc GoalHistory, dùng trong editor / chi tiết báo cáo (không có panel trang). */
export function RelatedDrawer({id,close,open}:{id:string;close:()=>void;open:(id:string)=>void}){
 return <Modal drawer title="Lịch sử mục tiêu" close={close}><GoalHistory id={id} close={close} open={open}/></Modal>;
}
