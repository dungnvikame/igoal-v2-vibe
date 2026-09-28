import React from 'react';
import {ArrowElbowDownRight} from 'phosphor-react';
import {Data,entities,teamGoals,teams,TeamGoal} from './model';
import {useStore} from './store';
import {codeOf,nameOf} from './RelationPicker';

/**
 * Liên kết KS của EKS → KR của team.
 * Rule: báo cáo chỉ gắn EKS cá nhân / mục tiêu dự án; đóng góp cho OKR team đi qua KS của EKS.
 * Gắn ở bước 3 "Liên kết OKR team" của luồng tạo / sửa EKS (EksForm.tsx). My EKS và editor báo cáo chỉ đọc lại.
 */
const direct=(d:Data,id:string)=>d.alignments?.[id]??[];
/** KR team của một KS, hoặc của một EKS (= hợp các KS con), theo thứ tự Team OKR. */
export const alignedGoals=(d:Data,id:string)=>{const isEks=entities.some(e=>e.id===id&&e.type==='EKS');const ids=isEks?entities.filter(e=>e.parent===id).flatMap(k=>direct(d,k.id)):direct(d,id);return teamGoals.filter(g=>ids.includes(g.id))};
export const teamName=(id:string)=>teams.find(t=>t.id===id)?.label??id;

/** Mã KR dạng chữ, hover xem tên. */
function Codes({goals}:{goals:TeamGoal[]}){return <span className="al-codes">{goals.map((g,i)=><React.Fragment key={g.id}>{i>0&&<i>·</i>}<span className="al-code" tabIndex={0} title={`${g.code} · ${g.label}`}>{g.code}</span></React.Fragment>)}</span>}

/** Dòng nhỏ dưới một KS trên card My EKS: "Đóng góp OKR team: KR1 · KR3". Không có liên kết thì không hiện gì. */
export function KsAlignment({ksId}:{ksId:string}){
 const {data}=useStore();const goals=alignedGoals(data,ksId);if(!goals.length)return null;
 return <div className="al-line"><ArrowElbowDownRight className="al-icon"/><span title={'Đóng góp cho OKR team '+teamName(goals[0].team)}>Đóng góp OKR team:</span><Codes goals={goals}/></div>;
}

/**
 * Trong editor báo cáo, ngay dưới Liên kết: MỘT dòng chữ tóm tắt "Đóng góp vào OKR team X: KR1 · KR2 · KR3".
 * Gộp trùng giữa các EKS, hover mã để xem tên KR và EKS nào đóng góp. Không lặp lại chip EKS.
 */
export function TeamContribution({relations}:{relations:string[]}){
 const {data}=useStore();const eks=entities.filter(e=>e.type==='EKS'&&relations.includes(e.id));
 if(!eks.length)return null;
 const goals=teamGoals.map(g=>({g,via:eks.filter(e=>alignedGoals(data,e.id).some(x=>x.id===g.id))})).filter(x=>x.via.length);
 const missing=eks.filter(e=>!alignedGoals(data,e.id).length);
 return <p className="al-contrib"><ArrowElbowDownRight className="al-icon"/>
  {goals.length?<>Đóng góp vào OKR team {teamName(goals[0].g.team)}:<span className="al-codes">{goals.map(({g,via},i)=><React.Fragment key={g.id}>{i>0&&<i>·</i>}<span className="al-code" tabIndex={0} title={`${g.code} · ${g.label}\nQua ${via.map(e=>codeOf(e)+' '+nameOf(e)).join(', ')}`}>{g.code}</span></React.Fragment>)}</span></>:<>Chưa đóng góp vào OKR team nào</>}
  {missing.length>0&&<small> · {missing.map(e=>codeOf(e)).join(', ')} chưa liên kết OKR team</small>}
  <small className="al-where" title="Gắn KS với KR team khi tạo / sửa EKS ở My EKS">· qua KS của EKS, thiết lập ở My EKS</small>
 </p>;
}

/** Nhãn ngắn cho dòng EKS trong popover Liên kết: "→ KR1, KR3 · Team Technology". */
export const alignmentHint=(d:Data,eksId:string)=>{const g=alignedGoals(d,eksId);return g.length?`→ ${g.map(x=>x.code).join(', ')} · Team ${teamName(g[0].team)}`:'Chưa liên kết mục tiêu team'};
