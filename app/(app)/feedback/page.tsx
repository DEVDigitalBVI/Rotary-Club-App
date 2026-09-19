import Link from "next/link";
import {redirect} from "next/navigation";
import {PageHeader} from "@/components/page-header";
import {PageContainer} from "@/components/page-container";
import {FeedbackForm,FeedbackReview} from "@/components/feedback/feedback-forms";
import {getCurrentMember,getMemberSummaries} from "@/lib/data/members";
import {getFeedback} from "@/lib/data/feedback";
import {canAssignRoles} from "@/lib/club";
import {feedbackCategories,feedbackStatuses} from "@/lib/feedback";
import {formatDate,toClubDateString} from "@/lib/format";
export default async function FeedbackPage({searchParams}:{searchParams:Promise<{view?:string;page?:string;status?:string;category?:string;unanswered?:string}>}){
 const member=await getCurrentMember();if(!member) redirect("/login");
 const params=await searchParams;const officer=canAssignRoles(member);const review=officer&&params.view==="review";
 const requested=Number(params.page??1);const page=Number.isSafeInteger(requested)&&requested>0?Math.min(requested,100000):1;
 const [feedback,members]=await Promise.all([getFeedback(member.id,review,page,{status:params.status,category:params.category,unanswered:params.unanswered==="1"}),review?getMemberSummaries():Promise.resolve([])]);
 const names=new Map(members.map(row=>[row.id,row.name]));const paging = new URLSearchParams();
 if(review)paging.set("view","review"); if(params.status)paging.set("status",params.status); if(params.category)paging.set("category",params.category); if(params.unanswered==="1")paging.set("unanswered","1");
 const base=`/feedback?${paging.toString()}&`;
 return <div><PageHeader title="Ideas for a better club." description="Quick feedback. Practical suggestions. A place to be heard." /><PageContainer className="max-w-5xl space-y-7">
 <Link href="/dashboard" className="text-sm font-semibold text-primary hover:underline">← My Rotary</Link>
 {!review&&<FeedbackForm ready={feedback.ready} />}
 <section><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="font-heading text-2xl font-semibold">{review?"Officer review inbox":"Your submissions"}</h2>{officer&&<Link href={review?"/feedback":"/feedback?view=review"} className="text-sm font-semibold text-primary hover:underline">{review?"My feedback":"Review member feedback"} →</Link>}</div>
 <form className="mb-5 grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2 lg:grid-cols-[minmax(8rem,1fr)_minmax(10rem,1fr)_auto_auto] lg:items-end">
 {review&&<input type="hidden" name="view" value="review"/>}
 <label className="flex min-w-0 flex-col gap-1.5 text-sm">Status<select name="status" defaultValue={params.status??""} className="h-10 w-full rounded border bg-background px-3"><option value="">All</option>{Object.entries(feedbackStatuses).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
 <label className="flex min-w-0 flex-col gap-1.5 text-sm">Category<select name="category" defaultValue={params.category??""} className="h-10 w-full rounded border bg-background px-3"><option value="">All</option>{Object.entries(feedbackCategories).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
 <label className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" name="unanswered" value="1" defaultChecked={params.unanswered==="1"}/> Unanswered only</label><button className="min-h-10 w-full rounded bg-primary px-3 py-2 text-sm text-primary-foreground sm:w-auto">Apply filters</button>
 </form>
 {!feedback.ready?<p className="rounded-xl border border-border p-5 text-sm text-muted-foreground">The feedback inbox is being set up.</p>:!feedback.rows.length?<p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{review?"No submissions on this page.":"Your suggestions and their updates will appear here."}</p>:<ul className="space-y-4">{feedback.rows.map(row=><li key={row.id} className="rounded-2xl border border-border bg-card p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-muted-foreground">{feedbackCategories[row.category]} · {formatDate(toClubDateString(row.created_at))}{review&&` · ${names.get(row.member_id)??"Member"}`}</p><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{feedbackStatuses[row.status]}</span></div><h3 className="font-heading mt-3 break-words text-xl font-semibold">{row.subject}</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground">{row.body}</p>{row.response&&!review&&<div className="mt-4 rounded-xl bg-muted/50 p-4"><h4 className="text-xs font-semibold text-primary">Response from the club</h4><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{row.response}</p></div>}{review&&<FeedbackReview key={`${row.id}-${row.revision}`} feedback={row} />}</li>)}</ul>}
 <nav aria-label="Feedback pages" className="mt-5 flex items-center justify-between text-sm">{page>1?<Link href={`${base}page=${page-1}`} className="font-semibold text-primary">← Previous</Link>:<span/>}{page*20<feedback.total&&<Link href={`${base}page=${page+1}`} className="font-semibold text-primary">Next →</Link>}</nav>
 </section><p className="text-xs leading-6 text-muted-foreground">Feedback updates appear here and in your notifications. Notification delivery follows your administration preference.</p>
 </PageContainer></div>;
}
