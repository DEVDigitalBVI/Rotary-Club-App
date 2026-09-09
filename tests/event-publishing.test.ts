import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEventAction } from "../app/(app)/events/actions";

const mocks = vi.hoisted(() => ({
  insert: vi.fn(), upload: vi.fn(), remove: vi.fn(), revalidate: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/data/members", () => ({ getCurrentMember: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: () => ({ insert: mocks.insert }),
    storage: { from: () => ({
      upload: mocks.upload, remove: mocks.remove,
      getPublicUrl: (path: string) => ({ data: { publicUrl: `https://storage.example/${path}` } }),
    }) },
  }),
}));

function form(agendaType = "application/pdf") {
  const data = new FormData();
  data.set("title", "Club meeting");
  data.set("date", "2026-09-09");
  data.set("time", "18:00");
  data.set("flyer", new File(["image"], "flyer.png", { type: "image/png" }));
  data.set("agenda", new File(["agenda"], "agenda.pdf", { type: agendaType }));
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.insert.mockResolvedValue({ error: null });
  mocks.upload.mockResolvedValue({ error: null });
  mocks.remove.mockResolvedValue({ error: null });
});

describe("event publication", () => {
  it("rejects an invalid second attachment before any upload or insert", async () => {
    expect(await createEventAction(undefined, form("text/html"))).toHaveProperty("error");
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("does not publish when the second upload fails, and cleans staged files", async () => {
    mocks.upload.mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({ error: { message: "offline" } });
    expect(await createEventAction(undefined, form())).toHaveProperty("error");
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.remove.mock.calls[0][0]).toHaveLength(2);
    // A retry publishes exactly one event, with both attachments.
    expect(await createEventAction(undefined, form())).toEqual({ success: true });
    expect(mocks.insert).toHaveBeenCalledTimes(1);
  });

  it("cleans staged files when the database rejects publication", async () => {
    mocks.insert.mockResolvedValue({ error: { message: "permission denied" } });
    expect(await createEventAction(undefined, form())).toHaveProperty("error");
    expect(mocks.remove.mock.calls[0][0]).toHaveLength(2);
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it("inserts both attachment URLs together only after uploading", async () => {
    mocks.insert.mockImplementation(async (row) => {
      expect(mocks.upload).toHaveBeenCalledTimes(2);
      expect(row).toMatchObject({
        starts_at: "2026-09-09T22:00:00.000Z",
        flyer_url: expect.stringContaining("/flyer.png"),
        agenda_url: expect.stringContaining("/agenda.pdf"),
      });
      return { error: null };
    });
    expect(await createEventAction(undefined, form())).toEqual({ success: true });
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.revalidate).toHaveBeenCalledWith("/dashboard");
  });
});
