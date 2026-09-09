import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { updateSession } from "../lib/supabase/proxy";

const mocks = vi.hoisted(() => ({ claims: vi.fn(), refresh: false }));
vi.mock("@supabase/ssr", () => ({
  createServerClient: (_url: string, _key: string, options: { cookies: { setAll: (cookies: unknown[], headers: Record<string, string>) => void } }) => ({
    auth: { getClaims: async () => {
      if (mocks.refresh) options.cookies.setAll([{ name: "sb-test", value: "refreshed", options: { path: "/", httpOnly: true } }], { "Cache-Control": "private, no-store" });
      return mocks.claims();
    } },
  }),
}));

beforeEach(() => {
  mocks.refresh = false;
  mocks.claims.mockResolvedValue({ data: { claims: { sub: "member", iat: 1 } }, error: null });
});

describe("authentication routing", () => {
  it.each([true, false])("lets confirmation links through with signed-in=%s", async (signedIn) => {
    if (!signedIn) mocks.claims.mockResolvedValue({ data: null, error: null });
    const result = await updateSession(new NextRequest("http://localhost/auth/confirm?token_hash=test&type=recovery&next=/update-password"));
    expect(result.headers.get("location")).toBeNull();
    expect(result.headers.get("x-middleware-next")).toBe("1");
  });

  it("keeps password updates and prefix lookalikes protected", async () => {
    mocks.claims.mockResolvedValue({ data: null, error: null });
    for (const path of ["/update-password", "/login-extra", "/auth/other"]) {
      const result = await updateSession(new NextRequest(`http://localhost${path}`));
      expect(result.headers.get("location")).toBe("http://localhost/login");
    }
  });

  it("retains refreshed session cookies when redirecting a signed-in login visit", async () => {
    mocks.refresh = true;
    const result = await updateSession(new NextRequest("http://localhost/login"));
    expect(result.headers.get("location")).toBe("http://localhost/dashboard");
    expect(result.cookies.get("sb-test")?.value).toBe("refreshed");
    expect(result.headers.get("cache-control")).toBe("private, no-store");
  });
});
