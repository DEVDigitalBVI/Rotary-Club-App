import { beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ confirmed: false, cancelled: true }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ from(table: string) {
  const filters: [string, unknown][] = [];
  const chain = {
    select: () => chain, eq: (key: string, value: unknown) => { filters.push([key,value]); return chain; }, limit: () => chain,
    returns: () => chain, maybeSingle: () => chain,
    then(resolve: (value: unknown) => unknown) {
      let data: unknown = [];
      if (table === "member_onboarding") data = [{task_key:"first-event"},{task_key:"first-project"},{task_key:"directory"}];
      if (table === "members") data = {phone:"555",classification:"Teacher",bio:"Hello"};
      if (table === "event_rsvps") { const row: Record<string, unknown> = {member_id:"m",status:state.confirmed?"yes":"no",registration_status:"registered"}; data = filters.every(([key,value])=>row[key]===value)?[row]:[]; }
      if (table === "project_slot_signups") { const row: Record<string, unknown> = {member_id:"m",status:"registered","project_slots.cancelled":state.cancelled}; data = filters.every(([key,value])=>row[key]===value)?[row]:[]; }
      return Promise.resolve({ data, error: null }).then(resolve);
    },
  }; return chain;
} }) }));
import { getCompletedOnboarding } from "../lib/data/onboarding";
beforeEach(()=>{state.confirmed=false;state.cancelled=true;});
it("does not let old recorded steps, declined RSVPs or cancelled slots imply participation",async()=>{
  expect(await getCompletedOnboarding("m")).toEqual(["directory","profile"]);
});
it("counts confirmed registrations and active project slots",async()=>{
  state.confirmed=true;state.cancelled=false;
  expect(await getCompletedOnboarding("m")).toEqual(["directory","profile","first-event","first-project"]);
});
