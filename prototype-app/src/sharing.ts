import {Data,Report,Share,User,teams,projects,entityAdmins,projectMembers} from './model';

/**
 * Quyền trên báo cáo (Report Sharing). Dev bám theo các rule dưới đây:
 * - Quyền hiệu lực = quyền CAO NHẤT từ mọi nguồn: Chủ sở hữu > Quản trị entity > Người xem.
 * - Nguồn quyền: người viết (owner) · ADMIN của entity chứa báo cáo · thành viên dự án (báo cáo dự án) · chia sẻ trực tiếp · chia sẻ qua team.
 * - Entity chứa báo cáo: dự án (báo cáo dự án) hoặc team của người viết (báo cáo cá nhân). Tag relation KHÔNG mở quyền.
 * - Chỉ owner và ADMIN entity được chia sẻ. Manager không mặc định được chia sẻ.
 * - Người được chia sẻ chỉ xem + bình luận (+ tải tệp đính kèm), không sửa.
 * - Gỡ chia sẻ trực tiếp chỉ bỏ nguồn đó; còn nguồn khác (team / entity) thì vẫn xem được.
 * - Chia sẻ team tính theo team hiện tại → chuyển team mất quyền từ team cũ, chia sẻ trực tiếp vẫn giữ.
 * - Tài khoản inactive (nghỉ việc) → mất toàn bộ quyền ngay, kể cả báo cáo của chính mình.
 * - Bản nháp chỉ người viết thấy. Tệp đính kèm kế thừa 100% quyền xem của báo cáo.
 */
export type AccessSource={kind:'owner'|'admin'|'member'|'direct'|'team';label:string;shareId?:string};
export type AccessLevel='owner'|'admin'|'viewer';
export type Access={level:AccessLevel|null;sources:AccessSource[];canShare:boolean;canView:boolean};

export const levelLabel:Record<AccessLevel,string>={owner:'Chủ sở hữu',admin:'Quản trị',viewer:'Người xem'};
export const teamLabel=(id:string)=>teams.find(t=>t.id===id)?.label??id;
export const userOf=(d:Data,id:string)=>d.users.find(u=>u.id===id);
export const userByName=(d:Data,name:string)=>d.users.find(u=>u.name===name);
/** Tên ngắn để hiển thị (tên gọi cuối). */
export const shortName=(name:string)=>name.trim().split(/\s+/).pop()??name;

/** Entity chứa báo cáo: dự án với báo cáo dự án, team của người viết với báo cáo cá nhân. */
export function containerOf(d:Data,r:Report):{id:string;label:string;kind:'project'|'team'}|null{
 if(r.scope==='project'){const p=projects.find(p=>r.relations.includes(p.id));return p?{id:p.id,label:p.label,kind:'project'}:null}
 const owner=userByName(d,r.owner);return owner?{id:owner.team,label:teamLabel(owner.team),kind:'team'}:null;
}

/** Mọi nguồn quyền của `userId` trên báo cáo `r`, và quyền hiệu lực (cao nhất). `shares` cho phép tính thử khi bỏ một lượt chia sẻ. */
export function accessOf(d:Data,r:Report,userId:string,shares:Share[]=d.shares):Access{
 const u=userOf(d,userId);const none:Access={level:null,sources:[],canShare:false,canView:false};
 if(!u||!u.active)return none;
 const sources:AccessSource[]=[];
 if(r.owner===u.name)sources.push({kind:'owner',label:'Người viết'});
 else if(r.status==='DRAFT')return none;
 const c=containerOf(d,r);
 if(c&&entityAdmins[c.id]?.includes(u.id))sources.push({kind:'admin',label:'Quản trị '+c.label});
 if(c?.kind==='project'&&projectMembers[c.id]?.includes(u.id))sources.push({kind:'member',label:'Thành viên dự án '+c.label});
 for(const s of shares.filter(s=>s.reportId===r.id)){
  if(s.principal==='user'&&s.principalId===u.id)sources.push({kind:'direct',label:'Chia sẻ trực tiếp',shareId:s.id});
  if(s.principal==='team'&&s.principalId===u.team)sources.push({kind:'team',label:'Qua team '+teamLabel(s.principalId),shareId:s.id});
 }
 const level:AccessLevel|null=sources.some(s=>s.kind==='owner')?'owner':sources.some(s=>s.kind==='admin')?'admin':sources.length?'viewer':null;
 return {level,sources,canShare:level==='owner'||level==='admin',canView:!!level};
}
export const canView=(d:Data,r:Report,userId:string)=>accessOf(d,r,userId).canView;

/** Thành viên hiện tại (active) của một team. */
export const teamMembers=(d:Data,teamId:string)=>d.users.filter(u=>u.team===teamId&&u.active);

/** Một báo cáo trong màn "Được chia sẻ với tôi": các lượt chia sẻ còn hiệu lực với user, lượt mới nhất quyết định ngày chia sẻ. */
export type SharedItem={report:Report;shares:Share[];at:string;by:User[];direct:boolean;viaTeam:string|null};
/** Báo cáo người khác chia sẻ với `userId` (trực tiếp hoặc qua team hiện tại), không gồm báo cáo của chính mình. Inactive → rỗng. */
export function sharedWithMe(d:Data,userId:string):SharedItem[]{
 const u=userOf(d,userId);if(!u||!u.active)return [];
 const mine=d.shares.filter(s=>(s.principal==='user'&&s.principalId===u.id)||(s.principal==='team'&&s.principalId===u.team));
 return [...new Set(mine.map(s=>s.reportId))].flatMap(id=>{
  const report=d.reports.find(r=>r.id===id);if(!report||report.owner===u.name||!canView(d,report,userId))return [];
  const shares=mine.filter(s=>s.reportId===id).sort((a,b)=>b.at.localeCompare(a.at));
  const by=[...new Set(shares.map(s=>s.by))].map(id=>userOf(d,id)).filter((x):x is User=>!!x);
  return [{report,shares,at:shares[0].at,by,direct:shares.some(s=>s.principal==='user'),viaTeam:shares.find(s=>s.principal==='team')?.principalId??null}];
 });
}
