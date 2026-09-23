import React,{createContext,useContext,useState,useEffect} from 'react';
import {Data,Report,Contribution,seed} from './model';
// Đổi hậu tố khi seed thay đổi để trình duyệt tự nhận dữ liệu mới.
const key='igoal-reporting-v2-demo-2026-r5';
/** Mở drawer "Liên quan" theo entity id từ bất kỳ đâu (chip relation, dòng OKR). Null khi không cung cấp. */
export const RelatedContext=createContext<((id:string)=>void)|null>(null);
/** Mục tiêu đang mở ở panel phải của trang, để tô sáng dòng tương ứng. */
export const ActiveRelatedContext=createContext<string|null>(null);
type Store={data:Data;saveReport:(r:Report)=>void;saveContribution:(c:Contribution)=>void;reset:()=>void;storageError:boolean};
const Context=createContext<Store>(null!);
export function StoreProvider({children}:{children:React.ReactNode}){
 const [data,setData]=useState<Data>(()=>{try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):seed()}catch{return seed()}});
 const [storageError,setStorageError]=useState(false);
 useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(data));setStorageError(false)}catch{setStorageError(true)}},[data]);
 const saveReport=(r:Report)=>setData(d=>({...d,reports:[r,...d.reports.filter(x=>x.id!==r.id)]}));
 const saveContribution=(c:Contribution)=>setData(d=>({...d,contributions:[c,...d.contributions.filter(x=>x.id!==c.id)]}));
 return <Context.Provider value={{data,saveReport,saveContribution,reset:()=>setData(seed()),storageError}}>{children}</Context.Provider>;
}
export const useStore=()=>useContext(Context);
