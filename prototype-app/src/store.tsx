import React,{createContext,useContext,useState,useEffect} from 'react';
import {Data,Report,Contribution,Share,Comment,User,seed} from './model';
// Đổi hậu tố khi seed thay đổi để trình duyệt tự nhận dữ liệu mới.
const key='igoal-reporting-v2-demo-2026-r6';
/** Mở drawer "Liên quan" theo entity id từ bất kỳ đâu (chip relation, dòng OKR). Null khi không cung cấp. */
export const RelatedContext=createContext<((id:string)=>void)|null>(null);
/** Mục tiêu đang mở ở panel phải của trang, để tô sáng dòng tương ứng. */
export const ActiveRelatedContext=createContext<string|null>(null);
type Store={data:Data;saveReport:(r:Report)=>void;saveContribution:(c:Contribution)=>void;reset:()=>void;storageError:boolean;
 /** Người dùng đang đăng nhập (đổi trong Thiết lập demo). Không lưu localStorage. */
 user:string;setUser:(id:string)=>void;
 addShares:(s:Share[])=>void;revokeShare:(id:string)=>void;addComment:(c:Comment)=>void;saveUser:(u:User)=>void};
const Context=createContext<Store>(null!);
export function StoreProvider({children}:{children:React.ReactNode}){
 const [data,setData]=useState<Data>(()=>{try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):seed()}catch{return seed()}});
 const [storageError,setStorageError]=useState(false);const [user,setUser]=useState('dung');
 useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(data));setStorageError(false)}catch{setStorageError(true)}},[data]);
 const saveReport=(r:Report)=>setData(d=>({...d,reports:[r,...d.reports.filter(x=>x.id!==r.id)]}));
 const saveContribution=(c:Contribution)=>setData(d=>({...d,contributions:[c,...d.contributions.filter(x=>x.id!==c.id)]}));
 const addShares=(s:Share[])=>setData(d=>({...d,shares:[...s,...d.shares]}));
 const revokeShare=(id:string)=>setData(d=>({...d,shares:d.shares.filter(s=>s.id!==id)}));
 const addComment=(c:Comment)=>setData(d=>({...d,comments:[...d.comments,c]}));
 const saveUser=(u:User)=>setData(d=>({...d,users:d.users.map(x=>x.id===u.id?u:x)}));
 return <Context.Provider value={{data,saveReport,saveContribution,reset:()=>setData(seed()),storageError,user,setUser,addShares,revokeShare,addComment,saveUser}}>{children}</Context.Provider>;
}
export const useStore=()=>useContext(Context);
