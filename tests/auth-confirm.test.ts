import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../app/auth/confirm/route";

const mocks = vi.hoisted(() => ({
  exchange: vi.fn(),
  verifyOtp: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      exchangeCodeForSession: mocks.exchange,
      verifyOtp: mocks.verifyOtp,
    },
    rpc: mocks.rpc,
  }),
}));

beforeEach(() => {
  mocks.exchange.mockReset().mockResolvedValue({ error: null });
  mocks.verifyOtp.mockReset().mockResolvedValue({ error: null });
  mocks.rpc.mockReset().mockResolvedValue({ error: null });
});

describe("auth confirmation callback", () => {
  it("exchanges PKCE recovery codes before opening the password form", async () => {
    const response = await GET(new NextRequest(
      "https://www.rotaryclubroadtown.com/auth/confirm?code=recovery-code&next=/update-password"
    ));

    expect(mocks.exchange).toHaveBeenCalledWith("recovery-code", undefined);
    expect(mocks.verifyOtp).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://www.rotaryclubroadtown.com/update-password"
    );
  });

  it("opens the password form when Supabase drops next from a recovery code", async () => {
    const response = await GET(new NextRequest(
      "https://www.rotaryclubroadtown.com/auth/confirm?code=recovery-code"
    ));

    expect(response.headers.get("location")).toBe(
      "https://www.rotaryclubroadtown.com/update-password"
    );
  });

  it("continues to support token-hash email templates", async () => {
    const response = await GET(new NextRequest(
      "https://www.rotaryclubroadtown.com/auth/confirm?token_hash=hash&type=recovery&next=/update-password"
    ));

    expect(mocks.verifyOtp).toHaveBeenCalledWith({
      token_hash: "hash",
      type: "recovery",
    });
    expect(response.headers.get("location")).toBe(
      "https://www.rotaryclubroadtown.com/update-password"
    );
  });

  it("opens the password form for recovery token hashes without next", async () => {
    const response = await GET(new NextRequest(
      "https://www.rotaryclubroadtown.com/auth/confirm?token_hash=hash&type=recovery"
    ));

    expect(response.headers.get("location")).toBe(
      "https://www.rotaryclubroadtown.com/update-password"
    );
  });

  it("rejects unsafe destinations", async () => {
    const response = await GET(new NextRequest(
      "https://www.rotaryclubroadtown.com/auth/confirm?code=recovery-code&next=https://evil.example"
    ));

    expect(response.headers.get("location")).toBe(
      "https://www.rotaryclubroadtown.com/dashboard"
    );
  });

  it("returns to login when the exchange fails", async () => {
    mocks.exchange.mockResolvedValue({ error: new Error("expired") });
    const response = await GET(new NextRequest(
      "https://www.rotaryclubroadtown.com/auth/confirm?code=expired&next=/update-password"
    ));

    expect(response.headers.get("location")).toBe(
      "https://www.rotaryclubroadtown.com/login?error=link-expired"
    );
  });
});
