import React,{useState} from 'react';
import {X,UsersThree,Users,LinkSimple,Paperclip,DownloadSimple,LockSimple,PaperPlaneRight} from 'phosphor-react';
import {Report,Share,teams,entityAdmins,projectMembers,today,uid,relativeDate,dateLabel} from './model';
import {useStore} from './store';
import {accessOf,containerOf,teamLabel,teamMembers,userOf,userByName,shortName,levelLabel} from './sharing';
import {Button,Modal,AutoTextarea,nowTime} from './ui';

type Principal={principal:Share['principal'];id:string};
type Option=Principal&{name:string;sub:string;note?:string};
const initial=(name:string)=>shortName(name)[0];

/** Một dòng trong danh sách "Người có quyền truy cập" (kiểu Google Drive): avatar/icon · tên · mô tả · quyền bên phải. */
function AccessRow({icon,title,sub,right,muted=false}:{icon:React.ReactNode;title:React.ReactNode;sub?:React.ReactNode;right:React.ReactNode;muted?:boolean}){
 return <li className={'share-row'+(muted?' muted':'')}>{icon}<div className="share-row-text"><strong>{title}</strong>{sub&&<small>{sub}</small>}</div><div className="share-row-right">{right}</div></li>;
}

/**
 * Dialog "Chia sẻ" kiểu Google Drive. Chỉ mở được khi user là owner hoặc ADMIN entity chứa báo cáo.
 * Thêm người / team → vai trò duy nhất "Người xem" → Chia sẻ. Danh sách dưới liệt kê mọi nguồn quyền: owner, quản trị,
 * thành viên dự án (không gỡ được ở đây), chia sẻ team & trực tiếp (gỡ được). Gỡ trực tiếp báo lại nếu người đó vẫn xem được qua nguồn khác.
 */
export function ShareDialog({report,close,notify}:{report:Report;close:()=>void;notify:(s:string)=>void}){
 const {data,user,addShares,revokeShare}=useStore();
 const [q,setQ]=useState(''),[focus,setFocus]=useState(false),[pending,setPending]=useState<Option[]>([]);
 const shares=data.shares.filter(s=>s.reportId===report.id).sort((a,b)=>b.at.localeCompare(a.at));
 const owner=userByName(data,report.owner);const c=containerOf(data,report);
 const admins=(c?entityAdmins[c.id]??[]:[]).filter(id=>id!==owner?.id).map(id=>userOf(data,id)).filter(u=>!!u&&u.active);
 const members=c?.kind==='project'?(projectMembers[c.id]??[]).map(id=>userOf(data,id)).filter(u=>!!u&&u.active):[];
 const taken=(p:Principal)=>pending.some(x=>x.principal===p.principal&&x.id===p.id)||shares.some(s=>s.principal===p.principal&&s.principalId===p.id);
 const term=q.trim().toLowerCase();
 // Gợi ý: user active (trừ người viết) và team. Người đã xem được qua nguồn khác vẫn chia sẻ được, chỉ hiện ghi chú.
 const options:Option[]=[
  ...data.users.filter(u=>u.active&&u.id!==owner?.id).map(u=>{const a=accessOf(data,report,u.id);return {principal:'user' as const,id:u.id,name:u.name,sub:u.role+' · '+teamLabel(u.team),note:a.canView?'Đang xem được · '+a.sources[0].label:undefined}}),
  ...teams.map(t=>({principal:'team' as const,id:t.id,name:'Team '+t.label,sub:teamMembers(data,t.id).length+' thành viên'})),
 ].filter(o=>!taken(o)&&(!term||o.name.toLowerCase().includes(term)));
 const pick=(o:Option)=>{setPending(p=>[...p,o]);setQ('')};
 const submit=()=>{addShares(pending.map(p=>({id:uid(),reportId:report.id,principal:p.principal,principalId:p.id,role:'viewer',by:user,at:today})));notify('Đã chia sẻ với '+pending.map(p=>p.principal==='user'?shortName(p.name):p.name).join(', '));close()};
 const revoke=(s:Share)=>{
  revokeShare(s.id);
  if(s.principal==='team'){notify('Đã gỡ chia sẻ với team '+teamLabel(s.principalId));return}
  const name=shortName(userOf(data,s.principalId)?.name??'');const rest=accessOf(data,report,s.principalId,data.shares.filter(x=>x.id!==s.id));
  notify(rest.canView?`Đã gỡ chia sẻ trực tiếp với ${name} · vẫn xem được: ${rest.sources.map(x=>x.label).join(', ')}`:`Đã gỡ quyền xem của ${name}`);
 };
 const copy=()=>{navigator.clipboard?.writeText(`${location.origin}/#report/${report.id}`).catch(()=>{});notify('Đã sao chép liên kết')};
 const byLine=(s:Share)=>`Chia sẻ bởi ${shortName(userOf(data,s.by)?.name??'')} · ${relativeDate(s.at).toLowerCase()}`;
 const remove=(s:Share,label:string)=><><span className="share-role">Người xem</span><button className="icon-x" aria-label={'Gỡ quyền của '+label} title="Gỡ quyền" onClick={()=>revoke(s)}><X size={14}/></button></>;

 return <Modal title={`Chia sẻ “${report.title}”`} close={close} footer={<><Button className="share-copy" onClick={copy}><LinkSimple/> Sao chép liên kết</Button>{pending.length?<><Button onClick={()=>setPending([])}>Hủy</Button><Button primary onClick={submit}><PaperPlaneRight/> Chia sẻ</Button></>:<Button primary onClick={close}>Xong</Button>}</>}>
  <div className="share-add">
   <div className="share-input">
    {pending.map(p=><span className="share-chip" key={p.principal+p.id}>{p.principal==='team'?<Users size={14}/>:<span className="avatar tiny">{initial(p.name)}</span>}{p.name}<button aria-label={'Bỏ '+p.name} onClick={()=>setPending(x=>x.filter(y=>y!==p))}><X size={12}/></button></span>)}
    <input aria-label="Thêm người hoặc team" placeholder={pending.length?'Thêm nữa…':'Thêm người hoặc team'} value={q} onChange={e=>setQ(e.target.value)} onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)} onKeyDown={e=>{if(e.key==='Enter'&&options[0]){e.preventDefault();pick(options[0])}if(e.key==='Backspace'&&!q&&pending.length)setPending(p=>p.slice(0,-1))}}/>
   </div>
   {pending.length>0&&<select className="meta-input share-role-select" aria-label="Vai trò" value="viewer" disabled><option value="viewer">Người xem · xem & bình luận</option></select>}
   {focus&&<div className="share-options" role="listbox">{options.length?options.map(o=><button key={o.principal+o.id} role="option" aria-selected="false" onMouseDown={e=>{e.preventDefault();pick(o)}}>{o.principal==='team'?<span className="share-team-icon"><Users size={16}/></span>:<span className="avatar tiny">{initial(o.name)}</span>}<span className="share-row-text"><strong>{o.name}</strong><small>{o.sub}{o.note&&<> · <em>{o.note}</em></>}</small></span></button>):<p className="hint">Không tìm thấy người hoặc team phù hợp.</p>}</div>}
  </div>

  <h4 className="share-title">Người có quyền truy cập</h4>
  <ul className="share-list">
   {owner&&<AccessRow icon={<span className="avatar tiny">{initial(owner.name)}</span>} title={<>{owner.name}{owner.id===user&&' (bạn)'}</>} sub={owner.active?owner.role+' · '+teamLabel(owner.team):'Tài khoản ngừng hoạt động'} muted={!owner.active} right={<span className="share-role">{levelLabel.owner}</span>}/>}
   {admins.map(u=>u&&<AccessRow key={u.id} icon={<span className="avatar tiny">{initial(u.name)}</span>} title={<>{u.name}{u.id===user&&' (bạn)'}</>} sub={'Quản trị '+c?.label} right={<span className="share-role">{levelLabel.admin}</span>}/>)}
   {members.length>0&&<AccessRow icon={<span className="share-team-icon"><UsersThree size={16}/></span>} title={'Thành viên dự án '+c?.label} sub={members.map(u=>shortName(u!.name)).join(', ')} right={<span className="share-role">Người xem</span>}/>}
   {shares.filter(s=>s.principal==='team').map(s=>{const n=teamMembers(data,s.principalId);return <AccessRow key={s.id} icon={<span className="share-team-icon"><Users size={16}/></span>} title={'Team '+teamLabel(s.principalId)} sub={`${n.length} thành viên · ${byLine(s)}`} right={remove(s,'team '+teamLabel(s.principalId))}/>})}
   {shares.filter(s=>s.principal==='user').map(s=>{const u=userOf(data,s.principalId);if(!u)return null;
    const other=accessOf(data,report,u.id).sources.filter(x=>x.shareId!==s.id);
    return <AccessRow key={s.id} muted={!u.active} icon={<span className="avatar tiny">{initial(u.name)}</span>} title={<>{u.name}{u.id===user&&' (bạn)'}</>}
     sub={!u.active?'Tài khoản ngừng hoạt động · không còn quyền':<>{byLine(s)}{other.length>0&&<> · Cũng xem được: {other.map(x=>x.label).join(', ')}</>}</>} right={remove(s,u.name)}/>})}
  </ul>
  <p className="hint share-foot"><LockSimple size={13}/> Người xem được xem, bình luận và tải tệp đính kèm; không sửa được báo cáo.</p>
 </Modal>;
}

/** Tệp đính kèm của báo cáo. Không có quyền riêng: xem được báo cáo mới thấy / tải được tệp. */
export function Attachments({report,notify}:{report:Report;notify:(s:string)=>void}){
 const {data,user}=useStore();if(!report.attachments?.length)return null;
 const ok=accessOf(data,report,user).canView;
 return <section className="reading-section"><h3>Tệp đính kèm</h3><div className="attach-list">{report.attachments.map(a=><div className="attach-row" key={a.name}><Paperclip/><span><strong>{a.name}</strong><small>{a.size}</small></span><Button quiet aria-label={'Tải '+a.name} onClick={()=>notify(ok?`Đang tải ${a.name} (mô phỏng)`:'Bạn không có quyền tải tệp này')}><DownloadSimple/> Tải xuống</Button></div>)}</div></section>;
}

/** Panel "Bình luận" ở rail phải chi tiết báo cáo: ai xem được báo cáo thì bình luận được. Ctrl Enter để gửi. */
export function CommentsPanel({report}:{report:Report}){
 const {data,user,addComment}=useStore();const [text,setText]=useState('');
 const list=data.comments.filter(c=>c.reportId===report.id);
 const send=()=>{if(!text.trim())return;addComment({id:uid(),reportId:report.id,userId:user,text:text.trim(),at:today,time:nowTime()});setText('')};
 return <div className="sp">
  <div className="sp-head"><h3>Bình luận</h3></div>
  {list.length?<div className="cmt-list">{list.map(c=>{const u=userOf(data,c.userId);return <div className="cmt" key={c.id}><span className="avatar tiny">{initial(u?.name??'?')}</span><div><div className="cmt-head"><strong>{u?.name}</strong><small title={dateLabel(c.at)}>{relativeDate(c.at)} · {c.time}</small></div><p className="preserve">{c.text}</p></div></div>})}</div>:<p className="sp-meta">Chưa có bình luận.</p>}
  <div className="cmt-form"><AutoTextarea rows={2} aria-label="Viết bình luận" placeholder="Viết bình luận…" value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();send()}}}/><Button primary disabled={!text.trim()} onClick={send}>Gửi</Button></div>
 </div>;
}

/** Trạng thái chặn khi user không có quyền xem báo cáo (chưa được chia sẻ, bị gỡ, hoặc tài khoản ngừng hoạt động). */
export function NoAccess(){return <div className="empty"><LockSimple size={32}/><h3>Bạn không có quyền xem báo cáo này</h3><p>Báo cáo chưa được chia sẻ với bạn hoặc quyền đã bị gỡ. Liên hệ người viết để được chia sẻ.</p></div>}
