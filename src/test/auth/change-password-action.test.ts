import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  headers: vi.fn(),
  identityService: {
    changePassword: vi.fn(),
  },
}));

vi.mock("next/headers", () => ({
  headers: mocks.headers,
}));

vi.mock("@/shared/infrastructure/auth/auth-guard", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("@/shared/infrastructure/auth/identity-service", () => ({
  identityService: mocks.identityService,
}));

import { changePasswordAction } from "@/app/actions/auth-actions";

describe("changePasswordAction (Server Action)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(
      new Headers({
        "x-forwarded-for": "192.168.1.100",
        "user-agent": "Vitest/1.0",
      })
    );
  });

  it("returns error when user has no active session", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const formData = new FormData();
    formData.append("newPassword", "PasswordBaru123#");
    formData.append("confirmPassword", "PasswordBaru123#");

    const result = await changePasswordAction(null, formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Sesi telah berakhir");
  });

  describe("Voluntary Password Change (harus_ganti_password === false)", () => {
    beforeEach(() => {
      mocks.getCurrentUser.mockResolvedValue({
        id: "01USER00000000000000000001",
        harus_ganti_password: false,
      });
    });

    it("rejects when oldPassword is missing", async () => {
      const formData = new FormData();
      formData.append("newPassword", "PasswordBaru123#");
      formData.append("confirmPassword", "PasswordBaru123#");

      const result = await changePasswordAction(null, formData);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Semua kolom kata sandi wajib diisi.");
      expect(mocks.identityService.changePassword).not.toHaveBeenCalled();
    });

    it("rejects when passwords do not match", async () => {
      const formData = new FormData();
      formData.append("oldPassword", "OldPassword123#");
      formData.append("newPassword", "PasswordBaru123#");
      formData.append("confirmPassword", "DifferentPassword123#");

      const result = await changePasswordAction(null, formData);
      expect(result.success).toBe(false);
      expect(result.error).toContain("tidak cocok");
    });

    it("requires oldPassword verification and succeeds when valid", async () => {
      mocks.identityService.changePassword.mockResolvedValue({ success: true });

      const formData = new FormData();
      formData.append("oldPassword", "OldPassword123#");
      formData.append("newPassword", "PasswordBaru123#");
      formData.append("confirmPassword", "PasswordBaru123#");

      const result = await changePasswordAction(null, formData);
      expect(result.success).toBe(true);
      expect(result.redirectUrl).toBe("/dashboard");
      expect(mocks.identityService.changePassword).toHaveBeenCalledWith(
        "01USER00000000000000000001",
        "OldPassword123#",
        "PasswordBaru123#",
        "192.168.1.100",
        "Vitest/1.0",
        { requireOldPassword: true }
      );
    });
  });

  describe("Mandatory Password Change (harus_ganti_password === true)", () => {
    beforeEach(() => {
      mocks.getCurrentUser.mockResolvedValue({
        id: "01USER00000000000000000002",
        harus_ganti_password: true,
      });
    });

    it("successfully allows password change WITHOUT oldPassword", async () => {
      mocks.identityService.changePassword.mockResolvedValue({ success: true });

      const formData = new FormData();
      formData.append("newPassword", "Password123#");
      formData.append("confirmPassword", "Password123#");

      const result = await changePasswordAction(null, formData);
      expect(result.success).toBe(true);
      expect(result.redirectUrl).toBe("/dashboard");
      expect(mocks.identityService.changePassword).toHaveBeenCalledWith(
        "01USER00000000000000000002",
        "",
        "Password123#",
        "192.168.1.100",
        "Vitest/1.0",
        { requireOldPassword: false }
      );
    });

    it("rejects when newPassword or confirmPassword is empty", async () => {
      const formData = new FormData();
      formData.append("newPassword", "");
      formData.append("confirmPassword", "Password123#");

      const result = await changePasswordAction(null, formData);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Semua kolom kata sandi wajib diisi.");
    });

    it("rejects when newPassword and confirmPassword do not match", async () => {
      const formData = new FormData();
      formData.append("newPassword", "Password123#");
      formData.append("confirmPassword", "Password456#");

      const result = await changePasswordAction(null, formData);
      expect(result.success).toBe(false);
      expect(result.error).toContain("tidak cocok");
    });
  });
});
