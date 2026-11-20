import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { PwaRegister } from "@/shared/components/pwa/pwa-register";

describe("PWA — Registration & Connectivity Monitor Component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("registers service worker on mount if supported", () => {
    const registerMock = vi.fn().mockResolvedValue({ scope: "/" });
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: { register: registerMock },
    });

    render(<PwaRegister />);
    expect(registerMock).toHaveBeenCalledWith("/sw.js", { scope: "/" });
  });

  it("displays offline status pill when window triggers offline event", () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });

    render(<PwaRegister />);

    act(() => {
      Object.defineProperty(navigator, "onLine", {
        configurable: true,
        value: false,
      });
      window.dispatchEvent(new Event("offline"));
    });

    expect(screen.getByText(/Koneksi offline • Mode cadangan aktif/i)).toBeInTheDocument();
  });

  it("displays back online notice when connection is restored", () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });

    render(<PwaRegister />);

    act(() => {
      Object.defineProperty(navigator, "onLine", {
        configurable: true,
        value: false,
      });
      window.dispatchEvent(new Event("offline"));
    });
    expect(screen.getByText(/Koneksi offline • Mode cadangan aktif/i)).toBeInTheDocument();

    act(() => {
      Object.defineProperty(navigator, "onLine", {
        configurable: true,
        value: true,
      });
      window.dispatchEvent(new Event("online"));
    });
    expect(screen.getByText(/Koneksi internet terhubung kembali/i)).toBeInTheDocument();

    // After 3500ms timeout it should fade out
    act(() => {
      vi.advanceTimersByTime(3600);
    });
    expect(screen.queryByText(/Koneksi internet terhubung kembali/i)).not.toBeInTheDocument();
  });
});
