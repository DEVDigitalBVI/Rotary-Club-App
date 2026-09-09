import {beforeEach,expect,it,vi} from 'vitest';
const mock=vi.hoisted(()=>({calls:[] as unknown[][],fail:false}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({from:(table:string)=>{
 mock.calls.push(['from',table]);
 const query=Object.fromEntries(['select','is','order','limit'].map(method=>[method,(...args:unknown[])=>{mock.calls.push([method,...args]);return query;}])) as Record<string,(...args:unknown[])=>unknown>;
 query.returns=async()=>({data:[{id:'m',sender_id:'s',body:'Hello',created_at:'2026-09-09',chat_channels:{name:'Clubhouse'}}],error:mock.fail?{message:'denied'}:null});return query;
}})}));
import {getLatestChatPreview} from '../lib/data/chat';
beforeEach(()=>{mock.calls=[];mock.fail=false;});
it('loads a bounded dashboard preview in one query without rosters or reactions',async()=>{
 expect(await getLatestChatPreview()).toEqual([{id:'m',senderId:'s',body:'Hello',createdAt:'2026-09-09',channel:'Clubhouse'}]);
 expect(mock.calls.filter(call=>call[0]==='from')).toEqual([['from','chat_messages']]);
 expect(mock.calls).toContainEqual(['limit',2]);expect(mock.calls).toContainEqual(['is','deleted_at',null]);
});
it('does not turn a failed chat query into a misleading empty preview',async()=>{mock.fail=true;await expect(getLatestChatPreview()).rejects.toThrow('Unable to load recent conversations');});
