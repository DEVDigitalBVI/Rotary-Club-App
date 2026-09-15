import { beforeEach, expect, it, vi } from "vitest";
import { getMyRotaryActivity } from "../lib/data/my-rotary";

vi.mock("@/lib/data/project-slots", () => ({ getMyProjectSlots: async () => [] }));

const queries = vi.hoisted(() => ({ calls: [] as unknown[][] }));
vi.mock("@/lib/format", () => ({ todayDateString: () => "2026-09-09" }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({
  rpc: async (name: string, args: unknown) => { queries.calls.push([name, args]); return { data: "2.5", error: null }; },
  from: (table: string) => {
    const chain = Object.fromEntries(["select", "eq", "gte", "lt", "lte", "order", "range", "is", "limit"].map((method) => [method, (...args: unknown[]) => {
      queries.calls.push([table, method, ...args]);
      return chain;
    }])) as Record<string, (...args: unknown[]) => unknown>;
    chain.returns = async () => table === "volunteer_hours"
      ? { data: [{ hours: "2.5", approved_at: null }], error: null }
      : { data: [], count: 7, error: null };
    return chain;
  },
}) }));
beforeEach(() => { queries.calls.length = 0; });

it("scopes officer-visible data to the viewer and excludes future or prior-year hours", async () => {
  const result = await getMyRotaryActivity("viewer-id");
  expect(queries.calls).toContainEqual(["notifications", "eq", "recipient_id", "viewer-id"]);
  expect(queries.calls).toContainEqual(["notifications", "eq", "type", "announcement"]);
  expect(queries.calls).toContainEqual(["notifications", "is", "read_at", null]);
  expect(queries.calls).toContainEqual(["personal_service_total", { p_member: "viewer-id", p_start: "2026-07-01", p_end: "2027-07-01", p_today: "2026-09-09" }]);
  expect(result.hours).toEqual({ total: 2.5 });
  expect(result.unreadNoticeCount).toBe(7);
});
