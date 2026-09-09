import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {describe,it,expect,vi} from 'vitest';
import manifest from '../app/manifest';
import {config} from '../proxy';
const code=readFileSync('public/sw.js','utf8');
function worker(){
 const handlers:Record<string,(event:Record<string,unknown>)=>void>={};
 const add=vi.fn().mockResolvedValue(undefined),remove=vi.fn().mockResolvedValue(true);
 const caches={open:vi.fn().mockResolvedValue({add}),keys:vi.fn().mockResolvedValue(['rotary-offline-v0','other-app-cache']),delete:remove,match:vi.fn().mockResolvedValue(new Response('offline screen'))};
 const fetch=vi.fn().mockResolvedValue(new Response('private member page'));
 vm.runInNewContext(code,{self:{location:{origin:'https://club.test'},addEventListener:(name:string,fn:typeof handlers[string])=>{handlers[name]=fn;},clients:{claim:vi.fn()},skipWaiting:vi.fn()},caches,fetch,URL,Response});
 return {handlers,caches,fetch,add,remove};
}
describe('mobile app offline boundaries',()=>{
 it('caches only the public offline document and preserves unrelated caches',async()=>{const w=worker();let done:Promise<unknown>=Promise.resolve();w.handlers.install({waitUntil:(p:Promise<unknown>)=>{done=p;}});await done;expect(w.add).toHaveBeenCalledExactlyOnceWith('/offline.html');w.handlers.activate({waitUntil:(p:Promise<unknown>)=>{done=p;}});await done;expect(w.remove).toHaveBeenCalledExactlyOnceWith('rotary-offline-v0');});
 it('returns fresh private pages without caching them, and falls back on network failure',async()=>{const w=worker();let response:Promise<Response>=Promise.resolve(new Response());const event={request:{method:'GET',mode:'navigate',url:'https://club.test/directory'},respondWith:(p:Promise<Response>)=>{response=p;}};w.handlers.fetch(event);expect(await (await response).text()).toBe('private member page');expect(w.caches.open).not.toHaveBeenCalled();w.fetch.mockRejectedValueOnce(new Error('offline'));w.handlers.fetch(event);expect(await (await response).text()).toBe('offline screen');});
 it('does not intercept form writes, API calls or external requests',()=>{const w=worker();const respondWith=vi.fn();for(const request of [{method:'POST',mode:'navigate',url:'https://club.test/feedback'},{method:'GET',mode:'cors',url:'https://club.test/api/data'},{method:'GET',mode:'navigate',url:'https://other.test/'}])w.handlers.fetch({request,respondWith});expect(respondWith).not.toHaveBeenCalled();});
 it('keeps installation resources outside the auth proxy and protects member routes',()=>{const matcher=new RegExp('^'+config.matcher[0]+'$');for(const path of ['/sw.js','/offline.html','/manifest.webmanifest','/icons/rotary-192.png'])expect(matcher.test(path)).toBe(false);expect(matcher.test('/dashboard')).toBe(true);expect(matcher.test('/service-record')).toBe(true);expect(manifest().display).toBe('standalone');});
});
