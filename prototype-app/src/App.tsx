import React,{useState,useEffect,useRef} from 'react';
import {Target,Flag,FileText,ChatsCircle,CalendarBlank,Clock,CheckCircle,CaretRight,X,CaretDown,CaretDoubleLeft,MagnifyingGlass,Buildings,Users,UsersThree,BookOpen,Gear,Question,Bell,ShareNetwork,Bug} from 'phosphor-react';
import {Report,Contribution,blankReport,blankContribution,currentWeekly,people,projects,kindLabel} from './model';
import {useStore,RelatedContext,ActiveRelatedContext} from './store';
import {Button,Modal,SourceDrawer} from './ui';
import {RelatedDrawer,GoalHistory} from './Related';
import {Weekly} from './Weekly';
import {Meeting} from './Meeting';
import {CheckinReport} from './Checkin';
import {ContributionList,ContributionForm} from './Contributions';
import {ProjectList,Project} from './Project';
import {ReportDetail} from './ReportDetail';
import {SimpleReport} from './Instant';
import {MyEks} from './MyEks';
import {GlobalSearch} from './GlobalSearch';
type Page='eks'|'project';
type EksTab='Mục tiêu & báo cáo'|'Contribution Log'|'Góp ý'|'Lịch sử thay đổi';

/** Mô tả loại báo cáo lấy đúng wording modal "Tạo báo cáo mới" của iGoal hiện tại. */
const REPORT_TYPES:{kind:Report['kind'];Icon:React.ElementType;text:string}[]=[
 {kind:'weekly',Icon:CalendarBlank,text:'Báo cáo tiến độ và kết quả thực hiện công việc theo tuần'},
 {kind:'instant',Icon:Clock,text:'Báo cáo nhanh về tình hình công việc và tiến độ hiện tại'},
 {kind:'meeting',Icon:ChatsCircle,text:'Báo cáo tóm tắt nội dung, quyết định và hành động từ các cuộc họp'},
];

export default function App(){
 const {data,reset,storageError}=useStore();
 const [page,setPage]=useState<Page>('project'),[projectId,setProjectId]=useState<string|null>(null),[eksTab,setEksTab]=useState<EksTab>('Mục tiêu & báo cáo'),[editor,setEditor]=useState<Report|null>(null),[detail,setDetail]=useState<Report|null>(null),[create,setCreate]=useState(false),[contribution,setContribution]=useState<Contribution|null>(null),[source,setSource]=useState<string|null>(null),[user,setUser]=useState('dung'),[settings,setSettings]=useState(false),[resetConfirm,setResetConfirm]=useState(false),[toast,setToast]=useState(''),[related,setRelated]=useState<string|null>(null);
 const notify=(s:string)=>setToast(s);useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),4000);return()=>clearTimeout(timer)},[toast]);
 // Ctrl K / ⌘K đưa con trỏ vào ô tìm kiếm trên topbar (đúng gợi ý phím tắt đang hiển thị).
 const searchRef=useRef<HTMLInputElement>(null);
 useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'&&searchRef.current){e.preventDefault();searchRef.current.focus();searchRef.current.select()}};document.addEventListener('keydown',onKey);return()=>document.removeEventListener('keydown',onKey)},[]);
 const go=(p:Page,pid:string|null=null)=>{setPage(p);setRelated(null);setProjectId(pid);setEditor(null);setDetail(null);window.scrollTo(0,0)};
 const edit=(r:Report)=>{setEditor(r);setDetail(null);window.scrollTo(0,0)};
 const show=(r:Report)=>{setDetail(r);setEditor(null);window.scrollTo(0,0)};
 // Báo cáo trong dự án: gắn sẵn dự án đang mở. Báo cáo tuần cá nhân: mở lại nháp đang có thay vì tạo trùng.
 const inProject=page==='project'&&!!projectId;
 const choose=(kind:Report['kind'])=>{setCreate(false);edit(inProject?blankReport(kind,'project',projectId!):kind==='weekly'?currentWeekly(data.reports):blankReport(kind,'personal'))};
 const me=people.find(p=>p.id===user);const initial=me?.name.trim().split(/\s+/).pop()?.[0];
 const projectName=projects.find(p=>p.id===projectId)?.label;

 // Editor và chi tiết báo cáo là trang full-screen (ẩn sidebar/topbar) giống iGoal thật.
 const fullPage=editor?(editor.kind==='weekly'?<Weekly key={editor.id} initial={editor} close={()=>setEditor(null)} source={setSource} contribute={setContribution} notify={notify}/>
  :editor.kind==='meeting'?<Meeting key={editor.id} initial={editor} source={setSource} close={()=>setEditor(null)} done={id=>{setEditor(null);const r=data.reports.find(r=>r.id===id);if(r)setDetail(r)}} notify={notify}/>
  :editor.kind==='checkin'?<CheckinReport key={editor.id} initial={editor} close={()=>setEditor(null)} source={setSource} notify={notify}/>
  :<SimpleReport key={editor.id} initial={editor} close={()=>setEditor(null)} source={setSource} notify={notify}/>)
  :detail?<ReportDetail report={detail} close={()=>setDetail(null)} source={setSource} contribute={setContribution} notify={notify}/>:null;

 const overlays=<>
  {create&&<Modal title="Tạo báo cáo mới" close={()=>setCreate(false)} footer={<Button onClick={()=>setCreate(false)}>Hủy</Button>}>
   {REPORT_TYPES.filter(t=>inProject||t.kind!=='meeting').map(({kind,Icon,text})=><button className="report-type" key={kind} onClick={()=>choose(kind)}><span className={'type-icon '+kind}><Icon size={22}/></span><span><strong>{kindLabel[kind]}</strong><small>{text}</small></span><CaretRight/></button>)}
   <p className="group-note">Báo cáo check-in dùng để cập nhật tiến độ của KR/KS.</p>
   <button className="report-type" onClick={()=>choose('checkin')}><span className="type-icon checkin"><UsersThree size={22}/></span><span><strong>{kindLabel.checkin}</strong><small>Báo cáo check-in định kỳ về trạng thái công việc</small></span><CaretRight/></button>
   <p className="group-note">Contribution Log dùng để ghi nhận đóng góp có bằng chứng, chờ người phụ trách xác nhận.</p>
   <button className="report-type" onClick={()=>{setCreate(false);const c=blankContribution();if(inProject)c.relations=[projectId!];setContribution(c)}}><span className="type-icon contribution"><CheckCircle size={22}/></span><span><strong>Contribution Log</strong><small>Ghi nhận đóng góp, kết quả và bằng chứng để xác nhận</small></span><CaretRight/></button>
  </Modal>}
  {contribution&&<ContributionForm key={contribution.id} initial={contribution} close={()=>setContribution(null)} source={setSource} notify={notify}/>}

  {settings&&<Modal title="Thiết lập demo" subtitle="Đổi người dùng để kiểm tra luồng gửi và xác nhận." close={()=>setSettings(false)}><label className="field">Vai trò đang sử dụng<select value={user} onChange={e=>{setUser(e.target.value);setEksTab('Contribution Log');go('eks')}}>{people.map(p=><option value={p.id} key={p.id}>{p.name} · {p.role}</option>)}</select></label><p className="hint">Người xác nhận được cấu hình trên từng Contribution. Dữ liệu giữ nguyên khi đổi vai trò.</p><div className="notice">Các thay đổi được lưu trên trình duyệt này. AI, transcript và Slack là mô phỏng.</div><div className="divider"/><Button onClick={()=>setResetConfirm(true)}>Khôi phục dữ liệu demo ban đầu</Button><div className="form-actions"><Button primary onClick={()=>setSettings(false)}>Tiếp tục demo</Button></div></Modal>}
  {resetConfirm&&<Modal title="Khôi phục dữ liệu demo?" subtitle="Các báo cáo và đóng góp bạn đã tạo trên trình duyệt này sẽ bị xóa." close={()=>setResetConfirm(false)}><div className="form-actions"><Button onClick={()=>setResetConfirm(false)}>Giữ dữ liệu</Button><Button primary onClick={()=>{reset();setResetConfirm(false);setSettings(false);setUser('dung');go('project');notify('Đã khôi phục dữ liệu mẫu')}}>Khôi phục</Button></div></Modal>}
  {related&&fullPage&&<RelatedDrawer id={related} close={()=>setRelated(null)} open={setSource}/>}
  {source&&<SourceDrawer id={source} close={()=>setSource(null)} open={setSource}/>}
  {toast&&<div role="status" className="toast"><CheckCircle size={20} weight="fill"/><span>{toast}</span><button className="toast-x" aria-label="Đóng thông báo" onClick={()=>setToast('')}><X size={16}/></button></div>}
 </>;

 if(fullPage)return <RelatedContext.Provider value={setRelated}><div className="editor-shell">{storageError&&<div className="notice warning">Trình duyệt không lưu được dữ liệu. Hãy giữ trang mở để tránh mất thay đổi.</div>}{fullPage}{overlays}</div></RelatedContext.Provider>;

 return <RelatedContext.Provider value={setRelated}><div className="app-shell">
  <aside className="sidebar">
   <div className="brand"><span className="brand-mark"><Target weight="fill"/></span><strong>iGoal</strong><button className="collapse" aria-label="Thu gọn" disabled><CaretDoubleLeft/></button></div>
   <div className="nav-label">OKR CHUNG</div>
   <div className="nav-item muted-nav"><Buildings/> iKame</div>
   <div className="nav-item muted-nav sub"><Buildings/> Technology</div>
   <div className="nav-item muted-nav"><Users/> Team OKR</div>
   <button className={'nav-item '+(page==='project'?'active':'')} onClick={()=>go('project')}><Flag/> Dự án</button>
   <div className="nav-label">CÁ NHÂN</div>
   <button className={'nav-item '+(page==='eks'?'active':'')} onClick={()=>{setEksTab('Mục tiêu & báo cáo');go('eks')}}><Target/> My EKS</button>
   <div className="nav-item muted-nav"><BookOpen/> Checkpoint</div>
   <div className="nav-item muted-nav"><ChatsCircle/> Feedback 360</div>
   <div className="sidebar-bottom">
    <div className="demo-label"><span/> PROTOTYPE · {me?.name} · {me?.role}</div>
    <div className="icon-row"><button aria-label="Đổi vai trò demo" title={me?.name} onClick={()=>setSettings(true)}><span className="avatar tiny">{initial}</span></button><button aria-label="Trợ giúp" disabled><Question/></button><button aria-label="Thiết lập demo" title="Thiết lập demo" onClick={()=>setSettings(true)}><Gear/></button><button aria-label="Báo lỗi" disabled><Bug/></button></div>
   </div>
  </aside>
  <main className="main-shell">
   <header className="topbar">
    <div className="breadcrumb">{page==='project'?<>{projectId?<button className="crumb-link" onClick={()=>go('project')}>Dự án</button>:'Dự án'}{projectId&&<><span>/</span><strong>{projectName}</strong></>}</>:<strong>My EKS</strong>}</div>
    <div className="top-controls">
     {inProject&&<button className="icon-button" aria-label="Chia sẻ" disabled><ShareNetwork/></button>}
     <button className="period" type="button">H2 2026 <CaretDown size={12}/></button>
     <GlobalSearch inputRef={searchRef} openSource={setSource} openProject={id=>go('project',id)}/>
     <button className="icon-button" aria-label="Thông báo" disabled><Bell/></button>
    </div>
   </header>
   <ActiveRelatedContext.Provider value={related}><div className={"page-body"+(related?" with-panel":"")}><div className="content">
    {storageError&&<div className="notice warning">Trình duyệt không lưu được dữ liệu. Hãy giữ trang mở để tránh mất thay đổi.</div>}
    {page==='project'?(projectId?<Project key={projectId} projectId={projectId} create={()=>setCreate(true)} edit={edit} open={show} source={setSource}/>:<ProjectList open={id=>go('project',id)}/>)
     :<><div className="project-tabs">{(['Mục tiêu & báo cáo','Contribution Log','Góp ý','Lịch sử thay đổi'] as EksTab[]).map(t=><button key={t} className={eksTab===t?'active':''} onClick={()=>setEksTab(t)}>{t==='Contribution Log'&&me?.canConfirm?'Xác nhận đóng góp':t}</button>)}</div>
      {eksTab==='Mục tiêu & báo cáo'?<MyEks user={user} create={()=>setCreate(true)} edit={edit} open={show} source={setSource}/>
      :eksTab==='Contribution Log'?<ContributionList user={user} edit={setContribution} source={setSource}/>
      :<section className="surface document"><h2>{eksTab}</h2><p className="hint">Màn hình của iGoal hiện tại, không thuộc phạm vi prototype.</p></section>}</>}
   </div>{related&&<aside className="page-panel"><GoalHistory key={related} id={related} close={()=>setRelated(null)} open={setSource}/></aside>}</div></ActiveRelatedContext.Provider>
  </main>
  {overlays}
 </div></RelatedContext.Provider>;
}
