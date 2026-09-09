import { beforeEach, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({calls:[] as {table:string;filters:unknown[][];range:number[]}[],fail:false}));
vi.mock("@/lib/supabase/server",()=>({createClient:async()=>({from:(table:string)=>{
 const call={table,filters:[] as unknown[][],range:[] as number[]}; mocks.calls.push(call);
 const chain={select:()=>chain,eq:(...args:unknown[])=>{call.filters.push(args);return chain;},lte:()=>chain,not:()=>chain,order:()=>chain,range:(a:number,b:number)=>{call.range=[a,b];return chain;},returns:()=>chain,then:(resolve:(value:unknown)=>unknown)=>Promise.resolve({data:[],error:mocks.fail?{message:'unavailable'}:null}).then(resolve)};return chain;
}})}));
import {getPersonalServiceRecord, getMemberServiceHistory} from '../lib/data/service-record';
beforeEach(()=>{mocks.calls=[];mocks.fail=false;});
it('explicitly scopes every source to the signed-in member including officers',async()=>{
 const result=await getPersonalServiceRecord('member-id');
 expect(result.entries).toEqual([]);expect(result.makeups).toEqual([]);
 expect(mocks.calls).toHaveLength(3);
 for(const call of mocks.calls){expect(call.filters).toContainEqual(['member_id','member-id']);expect(call.range).toEqual([0,499]);}
});
it('does not show missing data as zero activity when a query fails',async()=>{mocks.fail=true;await expect(getPersonalServiceRecord('member-id')).rejects.toThrow('Unable to load your service record');});

it('loads the viewed member contribution history without querying private attendance or makeups',async()=>{
 const result=await getMemberServiceHistory('profile-member');
 expect(result.entries).toEqual([]);
 expect(mocks.calls).toHaveLength(1);
 expect(mocks.calls[0].table).toBe('volunteer_hours');
 expect(mocks.calls[0].filters).toContainEqual(['member_id','profile-member']);
});
