import {entities,projects,projectMeta,projectMembers,reportWriters,projectChannels,entityAdmins,teams,people,Track,uid} from './model';

/**
 * Cấu hình dự án (luồng Tạo dự án). Bám các nhu cầu đã ghi nhận:
 * - Loại dự án + phân loại, nền tảng, BU/team phụ trách, các role chính (PM, UA, Creative, Dev, QA).
 * - Start/End date, không gắn với kỳ: dự án chạy xuyên H1/H2, mỗi kỳ chỉ cập nhật OKR (không tạo lại dự án).
 * - Liên kết thẳng tới OKR/KR của BU/Team; milestone không bắt buộc.
 * - Giai đoạn dự án quyết định luồng báo cáo: mỗi giai đoạn bật mảng báo cáo (Sản phẩm / Kinh doanh / Creative) + tần suất.
 * - Kênh Slack nhận recap sau khi xuất bản (luồng xuất bản đã có).
 * - Quyền xem báo cáo theo nhóm: mảng báo cáo × nhóm người (role dự án, BU Head, Vận hành).
 * Cấu hình được đồng bộ vào các bảng dùng chung trong model (projects, projectMeta, thành viên, người viết, kênh Slack) qua `syncProjects`.
 */
export const projectTypes=[
 {id:'BUSINESS',label:'Kinh doanh',subs:['Game','App']},
 {id:'TECHNOLOGY',label:'Công nghệ',subs:['Sản phẩm riêng','Hạ tầng']},
 {id:'PLATFORM',label:'Nền tảng',subs:['Nền tảng dùng chung']},
 {id:'OTHER',label:'Khác',subs:['Khác']},
] as const;
export type ProjectType=typeof projectTypes[number]['id'];
export const platforms=['iOS','Android','Web','PC','Console'] as const;
export const units=['Technology','BU Game','BU App','P&OD','Marketing'] as const;
/** BU / Center / Team thuộc từng đơn vị (chọn sau khi chọn đơn vị phụ trách). */
export const unitTeams:Record<string,string[]>={Technology:['Platform Development','Product Management','QA Center'],'BU Game':['Game Studio 1','Game Studio 2','UA Game'],'BU App':['App Studio','UA App'],'P&OD':['People Operations'],Marketing:['Brand','Creative Center']};
/** Kỳ OKR hiện tại: OKR tạo trong luồng Tạo dự án thuộc kỳ này; kỳ sau cập nhật OKR mới, dự án giữ nguyên. */
export const currentPeriod='H2 2026';
/** OKR dự án tạo ngay trong luồng Tạo dự án: mục tiêu + các KR/KS con. */
export type OkrItem={id:string;type:'KR'|'KS';title:string};
export type ProjectOkr={id:string;title:string;items:OkrItem[]};
/** Role chính của dự án. `writes` = mảng báo cáo role đó viết (người có role viết được báo cáo dự án). */
export const roles=[
 {id:'PM',label:'PM',writes:'Sản phẩm' as Track,required:true},
 {id:'UA',label:'UA',writes:'Kinh doanh' as Track},
 {id:'Creative',label:'Creative',writes:'Creative' as Track},
 {id:'Dev',label:'Dev'},
 {id:'QA',label:'QA'},
] as const;
export type RoleId=typeof roles[number]['id'];
/** Nhóm được cấp quyền xem theo mảng báo cáo: các role dự án + nhóm ngoài dự án. */
export const viewerGroups=[...roles.map(r=>({id:r.id as string,label:r.label})),{id:'BUHEAD',label:'BU Head'},{id:'OPS',label:'Vận hành'}];
export const cadences=['1 tuần/lần','2 tuần/lần','1 tháng/lần'] as const;
export type Stage={id:string;name:string;start:string;tracks:Track[];cadence:string};
export type Milestone={id:string;label:string;date:string};
export type ProjectConfig={id:string;name:string;description:string;type:ProjectType;subType:string;platforms:string[];/** `team` = BU/Center/Team phụ trách (thuộc `unit`); `partners` = đơn vị phối hợp. */
 unit:string;team:string;partners:string[];
 /** `end` rỗng = dài hạn, chạy xuyên nhiều kỳ. */
 start:string;end:string;
 roles:Record<RoleId,string[]>;stages:Stage[];currentStage:string;
 /** KR của BU/Team mà dự án đóng góp (TeamGoal id). */
 teamGoals:string[];milestones:Milestone[];channel:string;
 /** OKR dự án kỳ hiện tại tạo trong luồng này (dự án có sẵn giữ OKR cũ ngoài cấu hình). */
 okrs:ProjectOkr[];
 /** visibility[track] = id nhóm được xem báo cáo mảng đó (viewerGroups). */
 visibility:Record<Track,string[]>};

const stage=(name:string,tracks:Track[],cadence='1 tuần/lần',start=''):Stage=>({id:uid(),name,start,tracks,cadence});
/** Giai đoạn mẫu theo phân loại: Game/App đi từ build (Sản phẩm là chính) sang release (Kinh doanh/UA là chính). */
export function stageTemplate(subType:string):Stage[]{
 if(subType==='Game'||subType==='App')return [stage('Build',['Sản phẩm','Creative']),stage('Soft launch',['Sản phẩm','Kinh doanh','Creative']),stage('Global launch',['Kinh doanh','Sản phẩm','Creative']),stage('Live ops',['Kinh doanh','Sản phẩm'],'2 tuần/lần')];
 return [stage('Triển khai',['Sản phẩm']),stage('Vận hành',['Sản phẩm'],'2 tuần/lần')];
}
/** Mặc định: báo cáo Kinh doanh/UA nhạy cảm chỉ PM, UA, BU Head, Vận hành xem; mảng khác mọi nhóm xem. */
export const defaultVisibility=():Record<Track,string[]>=>({'Sản phẩm':viewerGroups.map(g=>g.id),'Kinh doanh':['PM','UA','BUHEAD','OPS'],'Creative':viewerGroups.map(g=>g.id)});
export const blankProject=():ProjectConfig=>({id:uid(),name:'',description:'',type:'BUSINESS',subType:'Game',platforms:[],unit:'BU Game',team:'Game Studio 1',partners:[],okrs:[],start:'',end:'',
 roles:{PM:[],UA:[],Creative:[],Dev:[],QA:[]},stages:stageTemplate('Game'),currentStage:'',teamGoals:[],milestones:[],channel:'',visibility:defaultVisibility()});
export const typeLabel=(t:ProjectType)=>projectTypes.find(x=>x.id===t)?.label??t;
export const stageOf=(p:ProjectConfig)=>p.stages.find(s=>s.id===p.currentStage)??p.stages[0];

/** Cấu hình cho 3 dự án có sẵn trong mock (giữ id, OKR, mốc đã có). */
export function seedProjects():ProjectConfig[]{
 const igoalStages=[stage('Thiết lập',['Sản phẩm'],'1 tuần/lần','2026-01-05'),stage('Pilot',['Sản phẩm','Creative'],'1 tuần/lần','2026-09-08'),stage('Global Launch',['Sản phẩm','Kinh doanh','Creative'],'1 tuần/lần','2026-09-21')];
 const wikiStages=[stage('Triển khai',['Sản phẩm'],'1 tuần/lần','2026-03-02'),stage('Vận hành',['Sản phẩm'],'2 tuần/lần','2026-09-11')];
 const myStages=[stage('Triển khai',['Sản phẩm'],'1 tuần/lần','2026-08-20'),stage('Vận hành',['Sản phẩm'],'2 tuần/lần')];
 const base={type:'TECHNOLOGY' as const,subType:'Sản phẩm riêng',platforms:['Web'],unit:'Technology',team:'Platform Development',partners:[],okrs:[],end:'',visibility:defaultVisibility()};
 return [
  {...base,id:'igoal',name:'iGoal',description:'Nền tảng quản trị mục tiêu và ghi nhận kết quả công việc',start:'2026-01-05',roles:{PM:['dung'],UA:['nguyet'],Creative:['quy'],Dev:[],QA:['quynh']},stages:igoalStages,currentStage:igoalStages[2].id,teamGoals:['tkr1','tkr3'],milestones:[{id:'pilot',label:'Pilot tuần 1',date:'2026-09-08'},{id:'sprint1',label:'Sprint 1',date:'2026-09-21'}],channel:'#ikame-igoal-project'},
  {...base,id:'iwiki',name:'iWiki',description:'Nền tảng tri thức nội bộ',start:'2026-03-02',roles:{PM:['dung'],UA:[],Creative:[],Dev:[],QA:['quynh']},stages:wikiStages,currentStage:wikiStages[1].id,teamGoals:['tkr2'],milestones:[{id:'wiki-launch',label:'Launch iWiki 4.0',date:'2026-09-11'}],channel:'#iwiki-van-hanh'},
  {...base,id:'myikame',name:'My iKame',description:'Cổng thông tin nhân sự',platforms:['Web','iOS','Android'],start:'2026-08-20',roles:{PM:['long'],UA:[],Creative:[],Dev:[],QA:['quynh']},stages:myStages,currentStage:myStages[0].id,teamGoals:[],milestones:[],channel:'#my-ikame'},
 ];
}

const name=(id:string)=>people.find(p=>p.id===id)?.name??id;
/** Thành viên / người viết khai báo tay trong mock (ngoài role), giữ lại khi sync. */
const baseMembers=Object.fromEntries(Object.entries(projectMembers).map(([k,v])=>[k,[...v]])),baseWriters=Object.fromEntries(Object.entries(reportWriters).map(([k,v])=>[k,[...v]]));
/** Id entity (mốc, OKR) do cấu hình tạo ra ở lần sync trước (để gỡ trước khi thêm lại). */
let syncedIds:string[]=[];
/**
 * Đẩy cấu hình dự án vào các bảng dùng chung. Idempotent, gọi mỗi lần render store.
 * - Người viết báo cáo = người có role PM / UA / Creative; thành viên = mọi role; quản trị = PM.
 * - Mốc của dự án mới trở thành entity Milestone (gắn được vào báo cáo); dự án có sẵn giữ mốc cũ.
 */
export function syncProjects(list:ProjectConfig[]){
 for(let i=entities.length-1;i>=0;i--)if(syncedIds.includes(entities[i].id))entities.splice(i,1);
 syncedIds=[];
 for(const p of list){
  let e=entities.find(x=>x.id===p.id&&x.type==='Project');
  if(!e){e={id:p.id,type:'Project',label:p.name,project:p.id};entities.push(e);projects.push(e)}else e.label=p.name;
  const all=[...new Set(Object.values(p.roles).flat())];
  projectMeta[p.id]={owner:p.roles.PM.map(name).join(', ')||'—',unit:p.unit,team:p.team,tags:[typeLabel(p.type),p.subType],description:p.description};
  projectMembers[p.id]=[...new Set([...(baseMembers[p.id]??[]),...all])];entityAdmins[p.id]=[...new Set([...(entityAdmins[p.id]??[]),...p.roles.PM])];
  reportWriters[p.id]=[...new Set([...(baseWriters[p.id]??[]),...p.roles.PM,...p.roles.UA,...p.roles.Creative])];
  if(p.channel)projectChannels[p.id]=p.channel;else delete projectChannels[p.id];
  // OKR tạo trong luồng: Objective + KR/KS (đánh số theo loại) thành entity của dự án, gắn được vào báo cáo / check-in.
  for(const o of p.okrs??[]){entities.push({id:o.id,type:"Objective",label:o.title,project:p.id,progress:0});syncedIds.push(o.id);const n={KR:0,KS:0};for(const k of o.items){n[k.type]++;entities.push({id:k.id,type:k.type,label:`${k.type}${n[k.type]} · ${k.title}`,project:p.id,progress:0});syncedIds.push(k.id)}}
  for(const m of p.milestones)if(!entities.some(x=>x.id===m.id)){entities.push({id:m.id,type:'Milestone',label:m.label+' · '+m.date.slice(8,10)+'/'+m.date.slice(5,7),project:p.id});syncedIds.push(m.id)}
 }
}
export const newMilestone=():Milestone=>({id:uid(),label:'',date:''});
export const newOkr=():ProjectOkr=>({id:uid(),title:"",items:[{id:uid(),type:"KR",title:""}]});
