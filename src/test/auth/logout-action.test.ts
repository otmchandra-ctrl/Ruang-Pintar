import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn(),
  cookieStore: {
    get: vi.fn(),
    set: vi.fn(),
  },
  authService: {
    revokeSession: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockImplementation(() => Promise.resolve(mocks.cookieStore)),
  headers: vi.fn(),
}));

vi.mock("@/shared/infrastructure/auth/auth-service", () => ({
  authService: mocks.authService,
}));

import { logoutAction } from "@/app/actions/auth-actions";

describe("logoutAction (Server Action)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("revokes active session, expires session cookie, and redirects to landing page ('/')", async () => {
    const mockToken = "token_abc123";
    mocks.cookieStore.get.mockReturnValue({ value: mockToken });

    await logoutAction();

    // 1. Session must be revoked in authService
    expect(mocks.authService.revokeSession).toHaveBeenCalledWith(mockToken);

    // 2. Cookie must be expired
    expect(mocks.cookieStore.set).toHaveBeenCalledWith(
      expect.stringContaining("session"),
      "",
      expect.objectContaining({
        maxAge: 0,
      })
    );

    // 3. User must be redirected to landing page ("/") instead of "/login"
    expect(mocks.redirect).toHaveBeenCalledWith("/");
  });

  it("clears cookie and redirects to landing page ('/') even if no session token was present", async () => {
    mocks.cookieStore.get.mockReturnValue(undefined);

    await logoutAction();

    expect(mocks.authService.revokeSession).not.toHaveBeenCalled();
    expect(mocks.cookieStore.set).toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith("/");
  });
});
