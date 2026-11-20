import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import OfflinePage from "@/app/offline/page";

describe("PWA — Academic Glass Offline Fallback Screen", () => {
  it("renders connection lost title and academic glass notification", () => {
    render(<OfflinePage />);

    expect(screen.getByText("Koneksi Internet Terputus")).toBeInTheDocument();
    expect(screen.getByText("Mode Offline Terdeteksi")).toBeInTheDocument();
    expect(screen.getByText(/Data Anda Terlindungi/i)).toBeInTheDocument();
  });

  it("provides retry and back to home navigation buttons", () => {
    render(<OfflinePage />);

    const retryBtn = screen.getByRole("button", {
      name: /Coba Hubungkan Kembali/i,
    });
    expect(retryBtn).toBeInTheDocument();

    const homeLink = screen.getByRole("link", { name: /Kembali ke Beranda/i });
    expect(homeLink).toHaveAttribute("href", "/");
  });

  it("calls window.location.reload when retry button is clicked", () => {
    const reloadMock = vi.fn();
    const existingLocation = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        ...existingLocation,
        origin: "http://localhost:3000",
        href: "http://localhost:3000/offline",
        reload: reloadMock,
      },
    });

    render(<OfflinePage />);
    const retryBtn = screen.getByRole("button", {
      name: /Coba Hubungkan Kembali/i,
    });
    fireEvent.click(retryBtn);

    expect(reloadMock).toHaveBeenCalled();
  });
});
