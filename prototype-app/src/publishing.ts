import {Data,Report,Section,Share,Publication,Destination,projects,entities,reportWriters,projectChannels,managerOf,today,uid} from './model';
import {userOf} from './sharing';

/**
 * Xuất bản đa nơi. Dev bám theo các rule dưới đây:
 * - Nơi viết báo cáo (My EKS hoặc dự án đang mở) là nơi gốc: luôn được lưu, không bỏ chọn được. iGoal là source of truth.
 * - Chỉ hiện nơi user có quyền VIẾT: dự án trong `reportWriters`, kênh Slack của các dự án đó, quản lý trực tiếp (`managerOf`).
 *   Nơi không có quyền thì không hiển thị (không hiện mờ).
 * - Mỗi nơi có nội dung riêng (`variants[destId]`), mặc định = nội dung trong editor. Sửa tay hoặc AI chỉ tác động nơi đó (hoặc mọi nơi đã chọn).
 * - Mỗi nơi (trừ Slack) nhận một bản báo cáo riêng, có `origin` trỏ về bản gốc; bản ở dự án là báo cáo dự án (quyền theo thành viên dự án).
 * - Quản lý trực tiếp: bản riêng + chia sẻ trực tiếp (Người xem) → xuất hiện ở "Được chia sẻ với tôi" của quản lý.
 * - Slack gửi sau khi lưu iGoal; Slack lỗi không ảnh hưởng các nơi khác, Thử lại chỉ gửi lại Slack.
 */

/** Nơi gốc của báo cáo: dự án (báo cáo dự án) hoặc My EKS (báo cáo cá nhân). */
export const originOf=(r:Report)=>r.scope==='project'?'project:'+r.relations[0]:'eks';

/** Mọi nơi `userId` được phép viết báo cáo, nơi gốc luôn có mặt. Thứ tự: Cá nhân → Dự án → Kênh Slack. */
export function destinationsFor(d:Data,r:Report,userId:string):Destination[]{
 const origin=originOf(r);const list:Destination[]=[{id:'eks',kind:'eks',label:'My EKS',hint:'Tổng hợp báo cáo cá nhân',group:'Cá nhân'}];
 const mgr=userOf(d,managerOf[userId]??'');
 if(mgr?.active)list.push({id:'manager',kind:'manager',label:'Quản lý trực tiếp · '+mgr.name,hint:'Chia sẻ riêng, xem & bình luận',group:'Cá nhân',userId:mgr.id});
 const writable=projects.filter(p=>reportWriters[p.id]?.includes(userId)||origin==='project:'+p.id);
 for(const p of writable)list.push({id:'project:'+p.id,kind:'project',label:'Dự án '+p.label,hint:'Tổng hợp báo cáo dự án',group:'Dự án',projectId:p.id});
 for(const p of writable)if(projectChannels[p.id])list.push({id:'slack:'+p.id,kind:'slack',label:projectChannels[p.id],hint:'Slack · recap dự án '+p.label,group:'Kênh Slack',projectId:p.id,channel:projectChannels[p.id]});
 return list;
}

/** Chọn sẵn: nơi gốc + dự án đã gắn trong Liên kết hoặc có khung "Báo cáo dự án" (nếu có quyền viết). */
export const defaultSelection=(r:Report,dests:Destination[])=>dests.filter(x=>x.id===originOf(r)||(x.kind==='project'&&(r.relations.includes(x.projectId!)||r.sections.some(s=>s.project===x.projectId)))).map(x=>x.id);

/**
 * Nội dung mặc định tại một nơi (trước khi user chỉnh riêng):
 * - Dự án / kênh Slack của dự án có khung "Báo cáo dự án" trong báo cáo → chỉ nội dung khung đó (bỏ đánh dấu `project` vì đã ở đúng dự án).
 * - Nơi khác (My EKS, quản lý, dự án không có khung) → toàn bộ báo cáo, gồm báo cáo chung và mọi khung dự án.
 */
export function defaultContent(r:Report,destId:string):Section[]{
 const pid=destId.match(/^(?:project|slack):(.+)$/)?.[1];
 const own=pid?r.sections.filter(s=>s.project===pid):[];
 return own.length?own.map(({project,...s})=>s):r.sections;
}

export const sameSections=(a:Section[],b:Section[])=>JSON.stringify(a.map(s=>s.text))===JSON.stringify(b.map(s=>s.text));

// ---------- AI chỉnh nội dung theo nơi xuất hiện (mock, chạy bằng rule) ----------
export const MASK='[ẩn]';
export type AiResult={sections:Section[];changes:string[]};
/** Từ khóa nhận diện nội dung thuộc dự án (ngoài tên dự án). */
const PROJECT_WORDS:Record<string,string[]>={igoal:['igoal','pilot','sprint','weekly','game/app','reporting','đánh giá hiệu suất','báo cáo tuần'],iwiki:['iwiki'],myikame:['my ikame']};
const splitLines=(t:string)=>t.split('\n').flatMap(l=>{const bullet=/^\s*•\s*/.test(l);return l.replace(/^\s*•\s*/,'').split(/(?<=\.)\s+(?=\p{Lu})/u).map(x=>x.trim()).filter(Boolean).map(x=>(bullet?'• ':'')+x)});

/**
 * Ẩn con số kinh doanh: số lượng / tỷ lệ / phân số (5/6 team) đứng trước đơn vị hoặc %. Giữ nguyên ngày (15/09), khoảng ngày (15–19/09),
 * mã (KR2, Sprint 1, tuần 1) để câu vẫn đọc được.
 */
export function hideNumbers(sections:Section[]):AiResult{
 let n=0;const re=/(?<![\p{L}\d/–.,-])(?<!(?:tuần|Tuần|Sprint|sprint|version|giai đoạn|Pilot) )\d+(?:\/\d+(?=\s+\p{L})|(?:[.,]\d+)?(?:\s?%|(?=\s+\p{L})))(?![\d/–])/gu;
 const out=sections.map(s=>({...s,text:s.text.replace(re,()=>{n++;return MASK})}));
 return {sections:out,changes:n?[`Ẩn ${n} con số`]:['Không có con số cần ẩn']};
}

/** Chỉ giữ ý thuộc dự án: câu nhắc tên / từ khóa dự án, hoặc trùng nội dung báo cáo nguồn của dự án đó. Ý không rõ thuộc dự án nào bị bỏ. */
export function focusProject(sections:Section[],projectId:string,reports:Report[]):AiResult{
 const words=PROJECT_WORDS[projectId]??[projects.find(p=>p.id===projectId)?.label.toLowerCase()??projectId];
 const others=Object.entries(PROJECT_WORDS).filter(([id])=>id!==projectId).flatMap(([,w])=>w);
 let dropped=0;
 const out=sections.map(s=>{
  const srcText=reports.filter(r=>s.sources.includes(r.id)&&r.relations.includes(projectId)).flatMap(r=>r.sections.map(x=>x.text.toLowerCase())).join('\n');
  const kept=splitLines(s.text).filter(l=>{const t=l.replace(/^•\s*/,'').toLowerCase();const mine=words.some(w=>t.includes(w))||(t.length>12&&srcText.includes(t.replace(/\.$/,'')));const other=others.some(w=>t.includes(w));const keep=mine&&!(other&&!words.some(w=>t.includes(w)));if(!keep)dropped++;return keep});
  return {...s,text:kept.join('\n')};
 });
 const label=projects.find(p=>p.id===projectId)?.label??projectId;
 return {sections:out,changes:[dropped?`Bỏ ${dropped} ý không thuộc ${label}`:`Mọi ý đã thuộc ${label}`]};
}

/** Rút gọn: mỗi mục giữ ý đầu tiên. */
export function shorten(sections:Section[]):AiResult{
 let dropped=0;const out=sections.map(s=>{const l=splitLines(s.text);dropped+=Math.max(0,l.length-1);return {...s,text:l.slice(0,1).join('\n')}});
 return {sections:out,changes:[dropped?`Rút gọn, bỏ ${dropped} ý phụ`:'Nội dung đã ngắn gọn']};
}

/** Bỏ trống một mục (mục trống không hiển thị ở nơi đó). */
export function dropSection(sections:Section[],label:string):AiResult{return {sections:sections.map(s=>s.label===label?{...s,text:''}:s),changes:[`Bỏ mục "${label}"`]}}

/** Hiểu yêu cầu tự do (tiếng Việt) thành chuỗi phép biến đổi. Không hiểu → `changes` rỗng, UI báo các yêu cầu demo hỗ trợ. */
export function runAi(prompt:string,sections:Section[],reports:Report[],fallbackProject?:string):AiResult{
 const q=prompt.toLowerCase();let cur=sections;const changes:string[]=[];
 const apply=(r:AiResult)=>{cur=r.sections;changes.push(...r.changes)};
 const proj=projects.find(p=>q.includes(p.label.toLowerCase()))?.id??(/dự án này|dự án đang/.test(q)?fallbackProject:undefined);
 if(proj&&/chỉ|tập trung|riêng|liên quan/.test(q))apply(focusProject(cur,proj,reports));
 // Nhận mục theo 2 từ đầu của tên mục ("bỏ mục khó khăn" → "Khó khăn / vấn đề").
 const sec=sections.find(s=>s.label&&q.includes(s.label.toLowerCase().split(/\s+/).slice(0,2).join(' ')));
 if(sec&&/bỏ|ẩn|xóa/.test(q)&&/mục/.test(q))apply(dropSection(cur,sec.label));
 if(/con số|số liệu|kinh doanh|doanh thu|tỷ lệ|%|số /.test(q)&&/ẩn|bỏ|che|xóa|không/.test(q))apply(hideNumbers(cur));
 if(/ngắn|rút gọn|tóm tắt|súc tích/.test(q))apply(shorten(cur));
 return {sections:cur,changes};
}

/** Relations của bản ở dự án: chỉ dự án đó + mục tiêu / EKS thuộc dự án đó (để quyền theo đúng dự án đích). */
const relationsFor=(r:Report,projectId:string)=>[projectId,...r.relations.filter(id=>{const e=entities.find(x=>x.id===id);return e&&e.type!=='Project'&&e.project===projectId})];

/**
 * Tạo dữ liệu cho một lượt xuất bản: báo cáo gốc (PUBLISHED), bản tại từng nơi, chia sẻ cho quản lý, trạng thái từng nơi.
 * `failSlack` = demo Slack lỗi.
 */
export function buildPublish(d:Data,master:Report,dests:Destination[],variants:Record<string,Section[]>,userId:string,time:string,failSlack:boolean){
 const origin=originOf(master);const content=(id:string)=>variants[id]??defaultContent(master,id);
 // Mục bị làm trống ở một nơi (sửa tay / AI) thì không xuất hiện ở nơi đó.
 const shown=(id:string)=>content(id).filter(s=>s.text.trim());
 const customized=(id:string)=>!sameSections(content(id),defaultContent(master,id));
 const root:Report={...master,sections:content(origin),status:'PUBLISHED',reviewed:true,variants:undefined};
 const reports:Report[]=[root],shares:Share[]=[],publications:Publication[]=[];
 const pub=(x:Destination,extra:Partial<Publication>)=>publications.push({id:uid(),originId:root.id,destId:x.id,kind:x.kind,label:x.label,status:'SENT',at:today,time,customized:customized(x.id),...extra});
 for(const x of dests){
  if(x.id===origin){pub(x,{reportId:root.id});continue}
  if(x.kind==='slack'){pub(x,{status:failSlack?'FAILED':'SENT',sections:shown(x.id),title:root.title});continue}
  const copy:Report={...root,id:uid(),sections:shown(x.id),origin:root.id,destination:x.id,
   ...(x.kind==='project'?{scope:'project' as const,relations:relationsFor(root,x.projectId!)}:{scope:'personal' as const})};
  reports.push(copy);
  if(x.kind==='manager')shares.push({id:uid(),reportId:copy.id,principal:'user',principalId:x.userId!,role:'viewer',by:userId,at:today});
  pub(x,{reportId:copy.id});
 }
 return {reports,shares,publications};
}

/** Các lượt xuất bản của một báo cáo (tính từ bản gốc, kể cả khi đang mở một bản ở nơi khác). */
export const publicationsOf=(d:Data,r:Report)=>d.publications.filter(p=>p.originId===(r.origin??r.id));

