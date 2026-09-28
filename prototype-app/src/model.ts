export type Relation = {id:string;type:string;label:string;project:string;progress?:number};
export const entities:Relation[] = [
 {id:'igoal',type:'Project',label:'iGoal',project:'igoal'}, {id:'iwiki',type:'Project',label:'iWiki',project:'iwiki'}, {id:'myikame',type:'Project',label:'My iKame',project:'myikame'},
 // iGoal
 {id:'o1',type:'Objective',label:'Nâng cấp iGoal thành nền tảng vận hành mục tiêu và hiệu suất dùng thường xuyên tại iKame',project:'igoal',progress:20},
 {id:'kr1',type:'KR',label:'KR1 · Thiết lập mục tiêu: hoàn thiện P0/P1 luồng OKR tổ chức / Project / EKS',project:'igoal',progress:30},
 {id:'kr2',type:'KR',label:'KR2 · Bám sát mục tiêu: Weekly Report, Reminder, cảnh báo mục tiêu chậm',project:'igoal',progress:35},
 {id:'kr3',type:'KR',label:'KR3 · Đánh giá hiệu suất: Self-assessment, Feedback 360, Manager Review',project:'igoal',progress:5},
 {id:'ks1',type:'KS',label:'KS1 · Hoàn thiện trải nghiệm báo cáo',project:'igoal',progress:40},
 {id:'ks2',type:'KS',label:'KS2 · Xây dựng iGoal theo 3 giai đoạn Thiết lập – Bám sát – Đánh giá',project:'igoal',progress:10},
 {id:'pilot',type:'Milestone',label:'Pilot tuần 1 · 08–12/09',project:'igoal'},
 {id:'sprint1',type:'Milestone',label:'Sprint 1 · 21/09–02/10',project:'igoal'},
 {id:'eks1',type:'EKS',label:'Hoàn thiện prototype Reporting để demo stakeholder',project:'igoal',progress:45},
 // iWiki
 {id:'o2',type:'Objective',label:'Xây dựng iWiki trở thành nền tảng tri thức chính thống, được tin dùng',project:'iwiki',progress:55},
 {id:'ks3',type:'KS',label:'KS1 · Launch iWiki 4.0 toàn công ty trong tháng 08/2026',project:'iwiki',progress:80},
 {id:'wiki-launch',type:'Milestone',label:'Launch iWiki 4.0 · 11/09',project:'iwiki'},
 {id:'eks2',type:'EKS',label:'Theo dõi vận hành iWiki sau phát hành',project:'iwiki',progress:60},
 // My iKame
 {id:'o3',type:'Objective',label:'Đưa My iKame thành cổng thông tin nhân sự dùng hàng ngày',project:'myikame'},
 {id:'ks4',type:'KS',label:'KS1 · Launch và vận hành My iKame toàn công ty trước 30/09; WAU ≥ 80%',project:'myikame'},
];
export const projects = entities.filter(e=>e.type==='Project');
/** Meta hiển thị trên card dự án (bám trang danh sách Dự án của iGoal). */
export const projectMeta:Record<string,{owner:string;unit:string;team:string;tags:string[];description:string}>={
 igoal:{owner:'Nguyễn Việt Dũng',unit:'Technology',team:'Technology',tags:['Công nghệ','Sản phẩm riêng'],description:'Nền tảng quản trị mục tiêu và ghi nhận kết quả công việc'},
 iwiki:{owner:'Nguyễn Việt Dũng',unit:'Technology',team:'Technology',tags:['Công nghệ','Sản phẩm riêng'],description:'Nền tảng tri thức nội bộ'},
 myikame:{owner:'Nguyễn Việt Dũng',unit:'Technology',team:'Technology',tags:['Công nghệ','Sản phẩm riêng'],description:'Cổng thông tin nhân sự'},
};
/** Mã hiển thị kiểu iGoal: O1/E1 cho mục tiêu, KR2/KS1 lấy từ tiền tố label. */
export const entityCode=(e:Relation,index:number)=>{const m=e.label.match(/^(KR|KS)\d+/);if(m)return m[0];return e.type==='Objective'?'O'+(index+1):e.type==='EKS'?'E'+(index+1):e.type};
export const entityText=(e:Relation)=>e.label.replace(/^(KR|KS)\d+\s*·\s*/,'');
export type Section = {label:string;text:string;sources:string[]};
export type ActionItem = {task:string;owner:string;deadline:string};
/** Một card "Cập nhật tiến độ KS" trong Báo cáo check-in (bám UI iGoal hiện tại). Tiến độ chỉ lưu trong báo cáo, prototype không mutation KS. */
export type Checkin = {ksId:string;progress:number;result:string;next:string;issue:string;file:string};
/** Mảng báo cáo ("Loại báo cáo" trên iGoal thật): PM → Sản phẩm, UA → Kinh doanh, Creative Lead → Creative (requirement 1). */
export const tracks=['Sản phẩm','Kinh doanh','Creative'] as const;
export type Track=typeof tracks[number];
export type Report = {id:string;title:string;kind:'weekly'|'meeting'|'instant'|'checkin';scope:'personal'|'project';track?:Track;date:string;owner:string;status:'DRAFT'|'PUBLISHED';relations:string[];sections:Section[];actions:ActionItem[];checkins?:Checkin[];attachments?:Attachment[];slack:'NOT_SENT'|'SENT'|'FAILED';channel:string;participants:string;audio:string;carry:string[];reviewed:boolean};
/** Tệp đính kèm của báo cáo: không có quyền riêng, kế thừa 100% quyền xem của báo cáo chứa nó. */
export type Attachment={name:string;size:string};
/** Quản lý trực tiếp mock, hiển thị ở meta của mọi editor giống iGoal thật. */
export const manager={id:'long',name:'Nguyễn Đức Long'};
export const blankCheckin=(ksId:string):Checkin=>({ksId,progress:0,result:'',next:'',issue:'',file:''});
export type Evidence = {type:'Report'|'URL'|'File';label:string;value:string};
export type Contribution = {id:string;title:string;impact:string;role:string;owner:string;date:string;evidence:Evidence[];relations:string[];collaborators:string[];recordStatus:'DRAFT'|'SUBMITTED';confirmationStatus:'PENDING'|'CONFIRMED'|'NEED_MORE_INFO';confirmerId:string;note:string};
// ---------- Chia sẻ báo cáo (Report Sharing) ----------
export type Team={id:string;label:string};
export const teams:Team[]=[{id:'tech',label:'Technology'},{id:'ua',label:'UA · Kinh doanh'},{id:'creative',label:'Creative'},{id:'game',label:'BU Game'}];
/** Người dùng. `team`, `active` đổi được trong Thiết lập demo (chuyển team / nghỉ việc) nên bản đang dùng nằm trong `Data.users`. */
export type User={id:string;name:string;role:string;team:string;active:boolean;canConfirm:boolean};
export const people:User[]=[
 {id:'dung',name:'Nguyễn Việt Dũng',role:'Product Manager',team:'tech',active:true,canConfirm:false},
 {id:'luc',name:'Lục',role:'BU Head · Game',team:'game',active:true,canConfirm:true},
 {id:'long',name:'Nguyễn Đức Long',role:'Head of Technology',team:'tech',active:true,canConfirm:false},
 {id:'nguyet',name:'Nguyệt',role:'UA Lead',team:'ua',active:true,canConfirm:false},
 {id:'quy',name:'Quý',role:'Creative Lead',team:'creative',active:true,canConfirm:false},
 {id:'quynh',name:'Quỳnh',role:'Vận hành',team:'tech',active:true,canConfirm:false},
];
/** ADMIN theo entity (dự án hoặc team). Admin của entity chứa báo cáo được xem + chia sẻ báo cáo đó. Manager không tự có quyền này. */
export const entityAdmins:Record<string,string[]>={igoal:['dung'],iwiki:['dung'],myikame:['long'],tech:['long']};
/** Thành viên dự án: được xem báo cáo dự án (đã gửi) của dự án đó. Tag dự án vào báo cáo KHÔNG mở quyền. */
export const projectMembers:Record<string,string[]>={igoal:['dung','nguyet','quy','quynh'],iwiki:['dung','quynh'],myikame:['long','dung']};
/**
 * Một lượt chia sẻ báo cáo cho cá nhân hoặc team. Chỉ có một vai trò: Người xem (xem + bình luận + tải tệp đính kèm, không sửa).
 * Chia sẻ team tính theo team HIỆN TẠI của user: chuyển team là mất quyền từ team cũ; chia sẻ trực tiếp vẫn giữ.
 */
export type Share={id:string;reportId:string;principal:'user'|'team';principalId:string;role:'viewer';by:string;at:string};
/** Bình luận trên báo cáo. Ai xem được báo cáo thì bình luận được. */
export type Comment={id:string;reportId:string;userId:string;text:string;at:string;time:string};
export type Data = {reports:Report[];contributions:Contribution[];users:User[];shares:Share[];comments:Comment[]};
export const kindLabel = {weekly:'Báo cáo tuần',meeting:'Báo cáo cuộc họp',instant:'Báo cáo tức thời',checkin:'Báo cáo check-in'};
export const today='2026-09-22';
export const uid=()=>crypto.randomUUID();
export const dateLabel=(s:string)=>new Date(s+'T12:00:00').toLocaleDateString('vi-VN');
const DAY=864e5,at=(s:string)=>new Date(s+'T12:00:00');
/** Số ngày từ `s` tới `today` (mock). */
export const daysAgo=(s:string)=>Math.round((at(today).getTime()-at(s).getTime())/DAY);
/** Ngày tương đối để quét danh sách nhanh: Hôm nay / Hôm qua / n ngày trước (dưới 1 tuần), còn lại dd/mm/yyyy. */
export const relativeDate=(s:string)=>{const d=daysAgo(s);return d===0?'Hôm nay':d===1?'Hôm qua':d>1&&d<7?d+' ngày trước':dateLabel(s)};
/** Nhóm theo tuần (tuần bắt đầu thứ Hai) so với `today`: Tuần này / Tuần trước / Trước đó. */
export const weekGroup=(s:string)=>{const t=at(today);const monday=new Date(t.getTime()-((t.getDay()+6)%7)*DAY).toISOString().slice(0,10);const prev=new Date(at(monday).getTime()-7*DAY).toISOString().slice(0,10);return s>=monday?'Tuần này':s>=prev?'Tuần trước':'Trước đó'};
export const section=(label:string,text:string,sources:string[]=[]):Section=>({label,text,sources});
const shortDate=(s:string)=>s.slice(8,10)+'/'+s.slice(5,7);
export function blankReport(kind:Report['kind'],scope:Report['scope'],project='igoal'):Report{return {id:uid(),title:kind==='weekly'?'Báo cáo tuần, ngày '+shortDate(today):kind==='meeting'?'Recap iGoal Sprint 1 Meeting':kind==='checkin'?'Báo cáo check-in, ngày '+shortDate(today):'Báo cáo tức thời, ngày '+shortDate(today),kind,scope,track:'Sản phẩm',date:today,owner:'Nguyễn Việt Dũng',status:'DRAFT',relations:scope==='project'?[project]:[],sections:[],actions:[],slack:'NOT_SENT',channel:'#ikame-igoal-project',participants:'Dũng, Lục, Nguyệt, Quỳnh',audio:'',carry:['Hoàn thành','Hoàn thành','Chưa hoàn thành'],reviewed:false};}
type SeedOpts=Partial<Pick<Report,'scope'|'track'|'owner'|'status'|'slack'|'actions'|'checkins'|'attachments'>>;
const seedReport=(id:string,title:string,kind:Report['kind'],date:string,relations:string[],sections:Section[],opts:SeedOpts={}):Report=>({...blankReport(kind,opts.scope??'project',relations[0]),id,title,date,relations,sections,track:'Sản phẩm',status:'PUBLISHED',reviewed:true,...opts});
const contrib=(c:Partial<Contribution>&Pick<Contribution,'id'|'title'|'impact'|'date'|'relations'>):Contribution=>({role:'Chủ trì',owner:'Nguyễn Việt Dũng',evidence:[],collaborators:[],recordStatus:'SUBMITTED',confirmationStatus:'PENDING',confirmerId:'luc',note:'',...c});
/** Dữ liệu mẫu trải Jul–Sep 2026, nhiều người viết, đủ 3 mảng và 4 loại báo cáo, để thấy relation nối report ↔ OKR/KR/KS/Milestone/EKS ↔ contribution. */
export function seed():Data{return {reports:[
 // ----- Dự án iGoal -----
 seedReport('kickoff','Kick-off iGoal H2/2026','meeting','2026-07-15',['igoal','o1','kr1'],[section('Mục tiêu cuộc họp','Thống nhất mục tiêu H2 của iGoal và cách chia giai đoạn.'),section('Nội dung chính','Rà soát kết quả H1: OKR tổ chức đã có, EKS và Project OKR chưa được dùng đều.\nĐề xuất tập trung 3 giai đoạn: Thiết lập – Bám sát – Đánh giá.'),section('Quyết định đã chốt','Chốt 3 giai đoạn Thiết lập – Bám sát – Đánh giá làm khung KR của H2.\nPilot với Game/App trước khi mở toàn công ty.'),section('Vấn đề còn mở','Nguồn lực Creative cho onboarding chưa xác nhận.')],{actions:[{task:'Soạn Requirement Checklist giai đoạn Thiết lập',owner:'Dũng',deadline:'2026-07-31'},{task:'Xác nhận nhân sự Creative',owner:'Quý',deadline:'2026-07-25'}]}),
 seedReport('req','Chốt Requirement Checklist giai đoạn Bám sát mục tiêu','meeting','2026-08-05',['igoal','kr2','ks1'],[section('Mục tiêu cuộc họp','Chốt danh sách tính năng P0/P1 cho giai đoạn Bám sát mục tiêu.'),section('Nội dung chính','Weekly Report, Reminder/Notification và cảnh báo mục tiêu chậm là P0.\nBáo cáo cuộc họp và Contribution Log là P1, làm sau Pilot.'),section('Quyết định đã chốt','Weekly Report có bản nháp AI là P0 của KR2.\nManager xem được báo cáo của member theo dự án.'),section('Vấn đề còn mở','Tần suất báo cáo theo loại dự án chưa chốt.')],{actions:[{task:'Hoàn thiện wireframe Weekly Report',owner:'Dũng',deadline:'2026-08-15'}]}),
 seedReport('perf','Rà soát yêu cầu giai đoạn Đánh giá hiệu suất','instant','2026-09-08',['igoal','kr3'],[section('Kết quả / cập nhật','Đã gom yêu cầu Self-assessment, Feedback 360 và Manager Review từ P&OD.'),section('Vấn đề / hỗ trợ','Cần P&OD chốt thang điểm trước 30/09.'),section('Kế hoạch tiếp theo','Dựng luồng Checkpoint evidence từ Contribution Log.')]),
 seedReport('pilot-w1','Tổng kết Pilot iGoal tuần 1','instant','2026-09-12',['igoal','kr2','ks1','pilot'],[section('Kết quả / cập nhật','Hoàn thành tuần pilot đầu tiên với 6 team. Ghi nhận 33 feedback: 14 lỗi dữ liệu (đã xử lý hết), 10 góp ý UI/UX (đã lên version mới), 9 đề xuất tính năng (đang phân loại).'),section('Vấn đề / hỗ trợ','Team UA cần mẫu báo cáo Kinh doanh riêng.'),section('Kế hoạch tiếp theo','Pilot tuần 2 tập trung Weekly Report và Reminder.')],{attachments:[{name:'feedback-pilot-tuan-1.xlsx',size:'48 KB'}]}),
 seedReport('checkin-0915','Báo cáo check-in KS, ngày 15/09','checkin','2026-09-15',['igoal','ks1','ks2'],[section('Ghi chú thêm','Tiến độ KS1 tăng nhờ xử lý xong lỗi dữ liệu pilot.')],{checkins:[{ksId:'ks1',progress:40,result:'Xử lý 14 lỗi dữ liệu, lên version UI mới.',next:'Hoàn thiện Weekly Report có bản nháp AI.',issue:'',file:''},{ksId:'ks2',progress:10,result:'Chốt khung 3 giai đoạn, xong giai đoạn Thiết lập.',next:'Bắt đầu giai đoạn Bám sát.',issue:'Thiếu nhân sự Creative.',file:''}]}),
 seedReport('game','Làm rõ yêu cầu Module Dự án · Game/App','meeting','2026-09-17',['igoal','kr2','ks1'],[section('Mục tiêu cuộc họp','Làm rõ cách quản lý dự án và ghi nhận đóng góp của Game/App.'),section('Nội dung chính','PM cần theo dõi kế hoạch tuần trước, kết quả thực tế và kế hoạch tuần tới.\nBáo cáo dự án do 3 đầu mối PM / UA / Creative thực hiện, không bắt buộc mọi thành viên.'),section('Quyết định đã chốt','Giữ dự án xuyên H1/H2, cập nhật mục tiêu theo kỳ.\niGoal lưu biên bản chính thức; Slack nhận nội dung sau khi người dùng duyệt.'),section('Vấn đề còn mở','Thống nhất người xác nhận Contribution theo phạm vi dự án.')]),
 seedReport('creative-w38','Báo cáo tuần Creative · 15–19/09','weekly','2026-09-18',['igoal','ks2'],[section('Kết quả tuần','Hoàn thành bộ visual onboarding iGoal (12 màn) và video hướng dẫn 90 giây.'),section('Kế hoạch tuần tới','Làm banner nhắc báo cáo tuần cho Reminder.')],{owner:'Quý',track:'Creative'}),
 seedReport('ua-w38','Báo cáo tuần Kinh doanh · 15–19/09','weekly','2026-09-19',['igoal','kr2'],[section('Kết quả tuần','Onboarding 6 team Game/App lên iGoal, 4 team đã gửi báo cáo tuần đầu. MAU pilot 48%.'),section('Kế hoạch tuần tới','Onboarding tiếp 3 team UA; thu mẫu báo cáo Kinh doanh.')],{owner:'Nguyệt',track:'Kinh doanh'}),
 seedReport('sprint','Sprint Planning iGoal · Sprint 1','meeting','2026-09-21',['igoal','kr2','sprint1'],[section('Mục tiêu cuộc họp','Chốt phạm vi Sprint 1 · 21/09–02/10 và kế hoạch demo với Game/App.'),section('Nội dung chính','Ưu tiên báo cáo tuần có bản nháp AI.\nĐưa biên bản họp, quyết định và việc cần làm về iGoal.'),section('Quyết định đã chốt','Demo luồng Weekly Report và Meeting Report trong tuần đầu Sprint 1.\nContribution được ghi nhận riêng, sau khi người dùng kiểm tra nội dung.'),section('Vấn đề còn mở','Cần Game/App xác nhận mẫu báo cáo trước khi triển khai.')],{actions:[{task:'Hoàn thiện prototype Reporting để demo',owner:'Dũng',deadline:'2026-09-25'},{task:'Tổng hợp phản hồi Game/App',owner:'Nguyệt',deadline:'2026-09-28'}],attachments:[{name:'pham-vi-sprint-1.pdf',size:'1,2 MB'},{name:'ban-ghi-sprint-planning.m4a',size:'18 MB'}]}),
 seedReport('draft-ua','Cập nhật MAU pilot tuần 39','instant','2026-09-22',['igoal','kr2'],[section('Kết quả / cập nhật','MAU pilot đạt 52%…')],{owner:'Nguyệt',track:'Kinh doanh',status:'DRAFT'}),
 // ----- Dự án iWiki -----
 seedReport('wiki-launch','Recap Launch iWiki 4.0','meeting','2026-09-11',['iwiki','o2','ks3','wiki-launch'],[section('Mục tiêu cuộc họp','Tổng kết launch iWiki 4.0 toàn công ty.'),section('Nội dung chính','Launch đúng 11/09, 3 BU đã có không gian riêng.\nTìm kiếm và phân quyền là 2 điểm được khen.'),section('Quyết định đã chốt','Giữ nhịp cập nhật nội dung 2 tuần/lần theo BU.\nGiao Dũng theo dõi vận hành sau phát hành 4 tuần.'),section('Vấn đề còn mở','Hướng dẫn sử dụng cho nhân sự mới chưa có.')]),
 seedReport('wiki','iWiki · Theo dõi sau phát hành','instant','2026-09-18',['iwiki','eks2','ks3'],[section('Kết quả / cập nhật','iWiki vận hành ổn định sau launch 11/09. Chưa ghi nhận lỗi nghiêm trọng từ nhóm pilot.'),section('Kế hoạch tiếp theo','Thu thập phản hồi người dùng và bổ sung hướng dẫn sử dụng.')]),
 // ----- Dự án My iKame -----
 seedReport('my-kickoff','Họp khởi động My iKame với P&OD','meeting','2026-08-20',['myikame','o3','ks4'],[section('Mục tiêu cuộc họp','Thống nhất phạm vi My iKame giai đoạn 1.'),section('Nội dung chính','Tập trung hồ sơ nhân sự, lịch nghỉ và onboarding.'),section('Quyết định đã chốt','Launch nội bộ trước 30/09, đo WAU từ tuần đầu.'),section('Vấn đề còn mở','Dữ liệu nhân sự đồng bộ từ hệ thống nào.')],{owner:'Nguyễn Đức Long'}),
 seedReport('my','My iKame · Rà soát nhu cầu báo cáo','instant','2026-09-19',['myikame','ks4'],[section('Kết quả / cập nhật','Tổng hợp nhu cầu theo dõi công việc từ nhóm pilot My iKame.'),section('Kế hoạch tiếp theo','Xác nhận các trường thông tin cần hiển thị với P&OD.')]),
 // ----- Báo cáo tuần cá nhân (Dũng) -----
 seedReport('w35','Báo cáo tuần · 26/08–01/09/2026','weekly','2026-09-01',['igoal','kr2','eks1'],[section('Kết quả tuần','Hoàn thiện wireframe Weekly Report; chuẩn bị kịch bản Pilot tuần 1.'),section('Kế hoạch tuần tới','Chạy Pilot iGoal tuần 1 với 6 team.\nGom yêu cầu Đánh giá hiệu suất từ P&OD.')],{scope:'personal'}),
 seedReport('w36','Báo cáo tuần · 02–08/09/2026','weekly','2026-09-08',['igoal','iwiki','eks1','eks2','kr3'],[section('Kết quả tuần','Pilot iGoal tuần 1 bắt đầu, xử lý lỗi dữ liệu ngay trong tuần.\nRà soát yêu cầu Đánh giá hiệu suất với P&OD.'),section('Kế hoạch tuần tới','Tổng kết Pilot tuần 1.\nTheo dõi launch iWiki 4.0.')],{scope:'personal'}),
 seedReport('previous','Báo cáo tuần · 09–15/09/2026','weekly','2026-09-15',['igoal','iwiki','myikame','kr2','eks1'],[section('Kết quả tuần','Tổng kết Pilot tuần 1 (33 feedback). Chuẩn bị nội dung làm việc với Game/App. Theo dõi iWiki sau phát hành.'),section('Kế hoạch tuần tới','Chốt phạm vi Sprint 1 iGoal.\nLàm rõ yêu cầu Module Dự án với Game/App.\nHoàn thiện prototype Reporting để demo stakeholder.')],{scope:'personal',attachments:[{name:'kich-ban-demo-prototype.docx',size:'86 KB'}]}),
 // ----- Báo cáo tuần cá nhân của member khác đã tag iGoal (nguồn cho PM tổng hợp) -----
 seedReport('nguyet-w38','Báo cáo tuần · 15–19/09 · Nguyệt','weekly','2026-09-19',['igoal','kr2'],[section('Kết quả tuần này','Onboarding 6 team Game/App lên iGoal; 4 team đã gửi báo cáo tuần đầu.\nThu 12 phản hồi về mẫu báo cáo Kinh doanh.'),section('Khó khăn / vấn đề','Team UA chưa có mẫu báo cáo riêng, đang dùng tạm mẫu Sản phẩm.'),section('Kế hoạch tuần tới','Onboarding tiếp 3 team UA.\nChốt mẫu báo cáo Kinh doanh với P&OD.')],{scope:'personal',owner:'Nguyệt',track:'Kinh doanh'}),
 seedReport('quy-w38','Báo cáo tuần · 15–19/09 · Quý','weekly','2026-09-18',['igoal','ks2'],[section('Kết quả tuần này','Hoàn thành bộ visual onboarding iGoal (12 màn).\nVideo hướng dẫn 90 giây đã duyệt nội bộ.'),section('Kế hoạch tuần tới','Banner nhắc báo cáo tuần cho Reminder.')],{scope:'personal',owner:'Quý',track:'Creative'}),
 ],contributions:[
 contrib({id:'c-req',title:'Chốt Requirement Checklist giai đoạn Bám sát mục tiêu',impact:'Team dev có danh sách P0/P1 rõ ràng; Weekly Report có bản nháp AI được đưa vào Sprint 1.',date:'2026-08-06',relations:['igoal','kr2','ks1'],evidence:[{type:'Report',label:'Chốt Requirement Checklist giai đoạn Bám sát mục tiêu',value:'req'}],collaborators:['Nguyệt'],confirmationStatus:'CONFIRMED',note:'Đã đối chiếu với biên bản 05/08.'}),
 contrib({id:'c-pilot',title:'Tổ chức Pilot iGoal tuần 1 và xử lý 14 lỗi dữ liệu',impact:'6 team dùng iGoal trên dữ liệu chính xác; 33 feedback được phân loại làm đầu vào Sprint 1.',date:'2026-09-12',relations:['igoal','kr2','ks1','pilot'],evidence:[{type:'Report',label:'Tổng kết Pilot iGoal tuần 1',value:'pilot-w1'},{type:'URL',label:'Asana · Board lỗi Pilot',value:'https://app.asana.com/igoal-pilot'}],collaborators:['Quỳnh','Nguyệt']}),
 contrib({id:'c-wiki',title:'Theo dõi iWiki và xử lý phản hồi sau phát hành',impact:'Nhóm pilot sử dụng ổn định; phản hồi được tổng hợp để ưu tiên cải tiến.',role:'Đóng góp chính',date:'2026-09-18',relations:['iwiki','eks2','ks3'],evidence:[{type:'Report',label:'iWiki · Theo dõi sau phát hành',value:'wiki'}],collaborators:['Quỳnh'],confirmationStatus:'CONFIRMED',note:'Đã kiểm tra kết quả và báo cáo sau phát hành.'}),
 contrib({id:'c-onboard',title:'Onboarding 6 team Game/App lên iGoal trong Pilot',impact:'4/6 team gửi báo cáo tuần đầu; MAU pilot 48%.',role:'Đóng góp chính',owner:'Nguyệt',date:'2026-09-19',relations:['igoal','kr2'],evidence:[{type:'Report',label:'Báo cáo tuần Kinh doanh · 15–19/09',value:'ua-w38'}],collaborators:['Dũng'],confirmationStatus:'NEED_MORE_INFO',note:'Bổ sung danh sách team đã gửi báo cáo và link recap Slack.'}),
 contrib({id:'c-visual',title:'Bộ visual onboarding iGoal và video hướng dẫn',impact:'Người dùng mới hiểu luồng báo cáo trong 2 phút; giảm câu hỏi lặp lại trên Slack.',role:'Chủ trì',owner:'Quý',date:'2026-09-18',relations:['igoal','ks2'],evidence:[{type:'Report',label:'Báo cáo tuần Creative · 15–19/09',value:'creative-w38'},{type:'File',label:'onboarding-visual-v3.fig',value:'onboarding-visual-v3.fig'}]}),
 contrib({id:'c-draft',title:'Chuẩn hóa mẫu biên bản họp cho dự án',impact:'',date:'2026-09-22',relations:['igoal','sprint1'],recordStatus:'DRAFT'}),
 ],users:people.map(u=>({...u})),shares:[
 // Lục (manager, không phải admin) được chia sẻ trực tiếp báo cáo tuần của Dũng và Pilot. Sprint Planning vừa trực tiếp vừa qua team BU Game → gỡ trực tiếp vẫn xem được.
 share('sh-prev-luc','previous','user','luc','dung','2026-09-16'),
 share('sh-pilot-luc','pilot-w1','user','luc','dung','2026-09-13'),
 share('sh-sprint-luc','sprint','user','luc','dung','2026-09-21'),
 share('sh-sprint-game','sprint','team','game','dung','2026-09-21'),
 share('sh-wiki-game','wiki-launch','team','game','dung','2026-09-12'),
 // Dũng nhận: trực tiếp từ Nguyệt, qua team Technology từ Quý.
 share('sh-nguyet-dung','nguyet-w38','user','dung','nguyet','2026-09-19'),
 share('sh-quy-tech','quy-w38','team','tech','quy','2026-09-18'),
 // Nguyệt: qua team UA (mất khi chuyển team) + trực tiếp (vẫn giữ khi chuyển team).
 share('sh-my-ua','my-kickoff','team','ua','long','2026-09-20'),
 share('sh-prev-nguyet','previous','user','nguyet','dung','2026-09-17'),
 ],comments:[
 {id:'cm-1',reportId:'sprint',userId:'luc',text:'Đồng ý phạm vi Sprint 1. Cần chốt thêm ngày demo cụ thể với Game/App.',at:'2026-09-21',time:'16:20'},
 {id:'cm-2',reportId:'sprint',userId:'dung',text:'Dự kiến demo thứ Năm 24/09, em sẽ gửi lịch.',at:'2026-09-21',time:'17:05'},
 {id:'cm-3',reportId:'nguyet-w38',userId:'dung',text:'Mẫu báo cáo Kinh doanh chị gửi em bản nháp trước thứ Tư nhé.',at:'2026-09-20',time:'09:12'},
 ]};}
function share(id:string,reportId:string,principal:Share['principal'],principalId:string,by:string,at:string):Share{return {id,reportId,principal,principalId,role:'viewer',by,at}}
export const transcript=[
 {time:'00:02',speaker:'Dũng',text:'Mục tiêu hôm nay là chốt Sprint 1 và luồng báo cáo để demo Game/App trong tuần này.'},
 {time:'02:14',speaker:'Lục',text:'Dự án cần giữ xuyên H1/H2. Sang kỳ mới thì cập nhật mục tiêu, không tạo lại dự án.'},
 {time:'08:41',speaker:'Dũng',text:'iGoal là nơi lưu biên bản chính thức. Slack chỉ nhận bản recap sau khi người dùng kiểm tra và duyệt.'},
 {time:'16:07',speaker:'Nguyệt',text:'Báo cáo tuần cần kế hoạch tuần trước, kết quả tuần này và kế hoạch tuần tới. Cần xem được nguồn AI đã dùng.'},
 {time:'27:33',speaker:'Dũng',text:'Contribution được tạo riêng từ nội dung người dùng chọn. Gửi báo cáo tuần không cập nhật KR và không tự tạo Contribution.'},
 {time:'32:10',speaker:'Quỳnh',text:'Dũng hoàn thiện prototype trước 25/09. Nguyệt tổng hợp phản hồi Game/App trước 28/09. Mẫu báo cáo và người xác nhận Contribution cần chốt thêm.'},
];
export function meetingDraft(r:Report):Report{return {...r,sections:[section('Mục tiêu cuộc họp','Chốt phạm vi Sprint 1 và luồng báo cáo để demo Game/App trong tuần đầu.'),section('Nội dung chính','Báo cáo tuần gồm kế hoạch tuần trước, kết quả và kế hoạch tuần tới.\nNgười dùng xem được nguồn của nội dung AI gợi ý.\niGoal lưu biên bản chính thức; Slack nhận bản recap sau khi duyệt.'),section('Quyết định đã chốt','Giữ dự án xuyên H1/H2, cập nhật mục tiêu theo kỳ.\nTạo Contribution riêng từ nội dung người dùng lựa chọn.\nGửi báo cáo tuần không tự cập nhật KR.'),section('Vấn đề còn mở','Cần thống nhất mẫu báo cáo với Game/App và người xác nhận Contribution theo dự án.')],actions:[{task:'Hoàn thiện prototype Reporting để demo',owner:'Dũng',deadline:'2026-09-25'},{task:'Tổng hợp phản hồi Game/App',owner:'Nguyệt',deadline:'2026-09-28'}]};}
// ---------- Weekly Report helpers ----------
/** Cadence báo cáo dự án mock theo giai đoạn (requirement 1). Prototype chỉ hiển thị, chưa nhắc/khóa. */
export const projectCadence={phase:'Global Launch',every:'1 tuần/lần',next:'2026-09-29',owners:[{track:'Product',name:'Nguyễn Việt Dũng · PM'},{track:'Kinh doanh',name:'Nguyệt · UA'},{track:'Creative',name:'Quý · Creative Lead'}]};
/** Báo cáo tuần cá nhân đã gửi gần nhất, dùng làm nguồn carry-over. */
/** Báo cáo tuần đã gửi gần nhất cùng ngữ cảnh: cùng người viết (cá nhân) hoặc cùng dự án (PM). */
export const previousWeekly=(reports:Report[],exceptId?:string,scope:Report['scope']='personal',projectId?:string,owner?:string)=>reports.filter(r=>r.kind==='weekly'&&r.scope===scope&&r.status==='PUBLISHED'&&(!projectId||r.relations.includes(projectId))&&(!owner||r.owner===owner)&&r.id!==exceptId).sort((a,b)=>b.date.localeCompare(a.date))[0];
/** Từng dòng trong "Kế hoạch tuần tới" của báo cáo trước trở thành một item carry-over. */
export const carryItems=(prev?:Report)=>prev?.sections.find(s=>s.label==='Kế hoạch tuần tới')?.text.split('\n').map(t=>t.trim()).filter(Boolean)??[];
/** Mở lại nháp tuần hiện tại nếu đã có, tránh tạo trùng khi bấm "Viết báo cáo tuần này" nhiều lần. */
export const currentWeekly=(reports:Report[])=>reports.find(r=>r.kind==='weekly'&&r.scope==='personal'&&r.status==='DRAFT')||blankReport('weekly','personal');
/** Ngữ cảnh gợi ý: báo cáo tuần cá nhân (nguồn = báo cáo dự án) hay báo cáo tuần dự án do PM viết (nguồn = báo cáo tuần của member + check-in). */
export type SuggestCtx={scope:'personal'}|{scope:'project';projectId:string};
/** Một gợi ý AI cho báo cáo tuần: một dòng nội dung + nguồn. `group` là dự án (member) hoặc người viết (PM). User chọn "Thêm", không tự chèn. */
export type Suggestion={id:string;group:string;text:string;source:string;kind:'result'|'decision'|'plan'|'issue'|'checkin'};
const SUGGEST_SECTIONS=['Kết quả / cập nhật','Kết quả tuần','Kết quả tuần này','Nội dung chính','Quyết định đã chốt','Kế hoạch tiếp theo','Kế hoạch tuần tới','Vấn đề còn mở','Vấn đề / hỗ trợ','Khó khăn / vấn đề'];
const kindOf=(label:string):Suggestion['kind']=>label.startsWith('Quyết định')?'decision':label.startsWith('Kế hoạch')?'plan':/^(Vấn đề|Khó khăn)/.test(label)?'issue':'result';
/** Các dòng gợi ý lấy từ một báo cáo (tối đa 2 dòng mỗi mục có ý nghĩa). */
export const lines=(r:Report,group:string):Suggestion[]=>r.sections.filter(s=>SUGGEST_SECTIONS.includes(s.label)&&s.text.trim()).flatMap(s=>s.text.split('\n').map(t=>t.trim()).filter(Boolean).slice(0,2).map((t,i)=>({id:`${r.id}·${s.label}·${i}`,group,text:t,source:r.id,kind:kindOf(s.label)})));
/**
 * Quét bản ghi đã gửi từ `from` (7 ngày gần nhất) mà user có quyền xem, tối đa 2 dòng mỗi mục.
 * Member: báo cáo dự án của các dự án tham gia, gom theo dự án. PM: báo cáo tuần cá nhân của member đã tag dự án + check-in KS của dự án, gom theo người.
 */
export function weeklySuggestions(reports:Report[],from:string,ctx:SuggestCtx):Suggestion[]{
 const recent=reports.filter(r=>r.status==='PUBLISHED'&&r.date>=from).sort((a,b)=>b.date.localeCompare(a.date));
 if(ctx.scope==='personal')return recent.filter(r=>r.scope==='project'&&r.kind!=='checkin').flatMap(r=>lines(r,r.relations[0]));
 const members=recent.filter(r=>r.scope==='personal'&&r.kind==='weekly'&&r.relations.includes(ctx.projectId)).flatMap(r=>lines(r,r.owner));
 const checkins=recent.filter(r=>r.kind==='checkin'&&r.relations.includes(ctx.projectId)).flatMap(r=>(r.checkins??[]).filter(c=>c.result.trim()).map(c=>({id:`${r.id}·${c.ksId}`,group:r.owner,text:`${entities.find(e=>e.id===c.ksId)?.label.split(':')[0]??c.ksId} · ${c.progress}% · ${c.result}`,source:r.id,kind:'checkin' as const})));
 return [...members,...checkins];
}
/** Gợi ý Contribution từ một report. Cả 2 variant đều bám nội dung có thật trong Weekly draft để "Xem nguồn" đối chiếu được. */
const contributionSuggestions=[
 {title:'Làm rõ hướng Weekly Report và Contribution với Game/App',impact:'Thống nhất cách ghi nhận báo cáo và đóng góp riêng, có nguồn để người dùng kiểm tra.'},
 {title:'Chốt phạm vi Sprint 1 iGoal và kế hoạch demo với Game/App',impact:'Sprint 1 có phạm vi rõ; ưu tiên báo cáo tuần và biên bản họp để demo trong tuần đầu.'},
];
export function blankContribution(r?:Report,variant=0):Contribution{const s=contributionSuggestions[variant]??contributionSuggestions[0];return {id:uid(),title:r?s.title:'',impact:r?s.impact:'',role:'Chủ trì',owner:'Nguyễn Việt Dũng',date:today,evidence:r?[{type:'Report',label:r.title,value:r.id}]:[],relations:r?r.relations.filter(id=>entities.find(e=>e.id===id)?.project==='igoal'):[],collaborators:[],recordStatus:'DRAFT',confirmationStatus:'PENDING',confirmerId:'luc',note:''};}
export const shortLabel=(e:Relation)=>e.label.split(':')[0];
