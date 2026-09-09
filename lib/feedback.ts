export const feedbackCategories = {idea:"Suggestion",app:"App issue",event:"Events",service:"Service projects",other:"Other"};
export const feedbackStatuses = {new:"Received",reviewing:"Under review",planned:"Planned",done:"Completed",declined:"Not proceeding"};
export type Feedback = {id:string;member_id:string;category:keyof typeof feedbackCategories;subject:string;body:string;status:keyof typeof feedbackStatuses;response:string;revision:number;created_at:string;updated_at:string};
export type FeedbackResult = {error?:string;success?:boolean};
