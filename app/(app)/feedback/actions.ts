"use server";
import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";
import type {FeedbackResult} from "@/lib/feedback";
async function run(name:string,args:Record<string,unknown>):Promise<FeedbackResult>{
 const db=await createClient();const {error}=await db.rpc(name,args);
 if(error) return {error:error.code==="P0001"?error.message:"Unable to save feedback. Please try again."};
 revalidatePath("/feedback");return {success:true};
}
export async function submitFeedback(id:string,form:FormData){return run("submit_member_feedback",{p_id:id,p_category:String(form.get("category")??""),p_subject:String(form.get("subject")??""),p_body:String(form.get("body")??"")});}
export async function reviewFeedback(id:string,revision:number,form:FormData){return run("review_member_feedback",{p_id:id,p_revision:revision,p_status:String(form.get("status")??""),p_response:String(form.get("response")??"")});}
