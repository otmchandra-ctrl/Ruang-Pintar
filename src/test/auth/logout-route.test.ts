import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookieStore: {
    get: vi.fn(),
    set: vi.fn(),
  },
  authService: {
    revokeSession: vi.fn(),
  },
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockImplementation(() => Promise.resolve(mocks.cookieStore)),
}));

vi.mock("@/shared/infrastructure/auth/auth-service", () => ({
  authService: mocks.authService,
}));

import { GET, POST } from "@/app/api/auth/logout/route";

describe("/api/auth/logout (Route Handler)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POST revokes session, expires session cookie, and returns redirect Response to '/'", async () => {
    const mockToken = "token_xyz789";
    mocks.cookieStore.get.mockReturnValue({ value: mockToken });

    const req = new Request("http://localhost:3000/api/auth/logout", { method: "POST" });
    const response = await POST(req);

    expect(mocks.authService.revokeSession).toHaveBeenCalledWith(mockToken);
    expect(mocks.cookieStore.set).toHaveBeenCalledWith(
      expect.stringContaining("session"),
      "",
      expect.objectContaining({ maxAge: 0 })
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("GET also revokes session and redirects to '/'", async () => {
    mocks.cookieStore.get.mockReturnValue(undefined);

    const req = new Request("http://localhost:3000/api/auth/logout", { method: "GET" });
    const response = await GET(req);

    expect(mocks.authService.revokeSession).not.toHaveBeenCalled();
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost:3000/");
  });
});
