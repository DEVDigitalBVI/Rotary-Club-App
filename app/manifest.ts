import type { MetadataRoute } from "next";
export default function manifest():MetadataRoute.Manifest {
 return {id:"/",name:"Rotary Club of Road Town",short_name:"Road Town",description:"Your club, events, service and conversations.",lang:"en",start_url:"/dashboard",scope:"/",display:"standalone",background_color:"#0D315B",theme_color:"#0D315B",icons:[
 {src:"/icons/rotary-192.png",sizes:"192x192",type:"image/png",purpose:"any"},
 {src:"/icons/rotary-512.png",sizes:"512x512",type:"image/png",purpose:"any"},
 {src:"/icons/rotary-maskable-512.png",sizes:"512x512",type:"image/png",purpose:"maskable"}],
 shortcuts:[{name:"Events",url:"/events"},{name:"Service record",url:"/service-record"},{name:"Club chat",url:"/chat"}]};
}
