import {createClient} from "@/lib/supabase/server";
import {throwOnSupabaseError} from "@/lib/supabase/errors";
import type {Feedback} from "@/lib/feedback";
export async function getFeedback(memberId:string,review:boolean,page:number) {
 const db=await createClient();
 let query=db.from("member_feedback").select("id,member_id,category,subject,body,status,response,revision,created_at,updated_at",{count:"exact"});
 if(!review) query=query.eq("member_id",memberId);
 const {data,error,count}=await query.order("created_at",{ascending:false}).order("id").range((page-1)*20,page*20-1).returns<Feedback[]>();
 if(error && ["42P01","PGRST205"].includes(error.code)) return {ready:false,rows:[],total:0};
 throwOnSupabaseError(error,"Unable to load feedback");
 return {ready:true,rows:data??[],total:count??0};
}
