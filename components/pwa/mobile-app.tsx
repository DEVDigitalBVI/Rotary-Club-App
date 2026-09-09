"use client";
import {useEffect,useState} from "react";
import {rememberInstallPrompt,type InstallPrompt} from "@/lib/pwa-install";
import {Button} from "@/components/ui/button";
export function MobileAppRuntime(){
 const [offline,setOffline]=useState(false);const [waiting,setWaiting]=useState<ServiceWorker|null>(null);
 useEffect(()=>{
  const online=()=>setOffline(false),offline=()=>setOffline(true);
  window.addEventListener("online",online);window.addEventListener("offline",offline);
  if(!navigator.onLine) queueMicrotask(offline);
  const available=(event:Event)=>{event.preventDefault();rememberInstallPrompt(event as InstallPrompt);};
  const installed=()=>rememberInstallPrompt(null);
  window.addEventListener("beforeinstallprompt",available);window.addEventListener("appinstalled",installed);
  let disposed=false;
  if(process.env.NODE_ENV==="production"&&"serviceWorker" in navigator&&window.isSecureContext){
   navigator.serviceWorker.register("/sw.js",{scope:"/",updateViaCache:"none"}).then(reg=>{
    if(disposed)return;
    if(reg.waiting)setWaiting(reg.waiting);
    reg.addEventListener("updatefound",()=>{const worker=reg.installing;worker?.addEventListener("statechange",()=>{if(!disposed&&worker.state==="installed"&&navigator.serviceWorker.controller)setWaiting(worker);});});
   }).catch(error=>console.error("Unable to register the offline screen",error));
  }
  return()=>{disposed=true;window.removeEventListener("beforeinstallprompt",available);window.removeEventListener("appinstalled",installed);window.removeEventListener("online",online);window.removeEventListener("offline",offline);};
 },[]);
 return <>{offline&&<div role="status" className="fixed inset-x-0 top-0 z-[100] bg-amber-100 px-4 py-2 text-center text-sm text-amber-950">You’re offline. Reconnect before saving changes.</div>}{waiting&&<div role="status" className="fixed inset-x-4 bottom-24 z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-lg"><span className="text-sm">An app update is ready. Save your work first.</span><Button size="sm" onClick={()=>{navigator.serviceWorker.addEventListener("controllerchange",()=>window.location.reload(),{once:true});waiting.postMessage({type:"ACTIVATE_UPDATE"});}}>Update</Button></div>}</>;
}
