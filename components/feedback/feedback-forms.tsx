"use client";
import {useRef,useState,useTransition} from "react";
import {Lightbulb,Send,Check} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {feedbackCategories,feedbackStatuses,type Feedback,type FeedbackResult} from "@/lib/feedback";
import {submitFeedback,reviewFeedback} from "@/app/(app)/feedback/actions";
const selectClass="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm";
export function FeedbackForm({ready}:{ready:boolean}){
 const [pending,start]=useTransition();const [result,setResult]=useState<FeedbackResult>({});const request=useRef<string|null>(null);
 return <section className="rounded-3xl border border-border bg-card p-5 sm:p-7"><h2 className="font-heading flex items-center gap-2 text-2xl font-semibold"><Lightbulb className="size-5 text-primary" />What’s on your mind?</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Share an idea, flag an issue, or suggest a better way to do things. Your name and message are visible to club officers.</p>
 {!ready && <p role="status" className="mt-4 rounded-lg bg-muted p-3 text-sm">Feedback submissions will open once setup is complete.</p>}
 <form className="mt-6 space-y-4" onSubmit={event=>{event.preventDefault();const form=event.currentTarget;const data=new FormData(form);request.current??=crypto.randomUUID();setResult({});start(async()=>{try{const saved=await submitFeedback(request.current!,data);setResult(saved);if(saved.success){form.reset();request.current=null;}}catch{setResult({error:"Couldn’t confirm submission. Retry to check without sending a duplicate."});}});}}>
 <fieldset disabled={pending||!ready} className="space-y-4 disabled:opacity-60"><label className="block text-sm font-medium">Category<select name="category" className={selectClass}>{Object.entries(feedbackCategories).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label><label className="block text-sm font-medium">Subject<Input name="subject" required minLength={3} maxLength={120} placeholder="A short summary" className="mt-2" /></label><label className="block text-sm font-medium">Message<Textarea name="body" required minLength={10} maxLength={3000} rows={5} placeholder="What would help, or what could we improve?" className="mt-2 min-h-32" /><span className="mt-1 block text-xs font-normal text-muted-foreground">10–3,000 characters</span></label><Button type="submit"><Send className="size-4" />{pending?"Sending…":"Send feedback"}</Button></fieldset>
 {result.error && <p role="alert" className="text-sm text-destructive">{result.error}</p>}{result.success && <p role="status" className="flex items-center gap-2 text-sm text-primary"><Check className="size-4" />Received. You can follow updates below.</p>}
 </form></section>;
}
export function FeedbackReview({feedback}:{feedback:Feedback}){
 const [pending,start]=useTransition();const [result,setResult]=useState<FeedbackResult>({});
 return <form className="mt-4 space-y-3 border-t border-border pt-4" onSubmit={event=>{event.preventDefault();const form=new FormData(event.currentTarget);setResult({});start(async()=>{try{setResult(await reviewFeedback(feedback.id,feedback.revision,form));}catch{setResult({error:"Unable to save. Refresh and try again."});}});}}><fieldset disabled={pending} className="space-y-3"><label className="block text-xs font-semibold">Status<select name="status" defaultValue={feedback.status} className={selectClass}>{Object.entries(feedbackStatuses).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label><label className="block text-xs font-semibold">Response to member<Textarea name="response" defaultValue={feedback.response} maxLength={3000} rows={3} className="mt-2" /></label><Button type="submit" size="sm" variant="outline">{pending?"Saving…":"Save update"}</Button></fieldset>{result.error && <p role="alert" className="text-sm text-destructive">{result.error}</p>}{result.success && <p role="status" className="text-sm text-primary">Update saved.</p>}</form>;
}
