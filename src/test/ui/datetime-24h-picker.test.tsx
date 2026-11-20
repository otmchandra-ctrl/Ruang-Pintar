import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DateTimePicker24H } from "@/shared/components/ui/datetime-24h-picker";

describe("DateTimePicker24H (24-Hour Time Picker)", () => {
  it("renders with label and helper text", () => {
    render(
      <DateTimePicker24H
        label="Waktu Mulai Ujian"
        helperText="Format 24 Jam WIB"
        value=""
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText("Waktu Mulai Ujian")).toBeDefined();
    expect(screen.getByText("Format 24 Jam WIB")).toBeDefined();
    expect(screen.getByText("WIB")).toBeDefined();
  });

  it("provides 24 hours (00 to 23) and 60 minutes (00 to 59) in dropdown options", () => {
    render(<DateTimePicker24H value="2026-10-10T08:00" onChange={vi.fn()} />);

    const hourSelect = screen.getByLabelText("Pilih Jam") as HTMLSelectElement;
    const minuteSelect = screen.getByLabelText("Pilih Menit") as HTMLSelectElement;

    expect(hourSelect.options.length).toBe(24);
    expect(hourSelect.options[0].value).toBe("00");
    expect(hourSelect.options[12].value).toBe("12");
    expect(hourSelect.options[13].value).toBe("13");
    expect(hourSelect.options[23].value).toBe("23");

    expect(minuteSelect.options.length).toBe(60);
    expect(minuteSelect.options[0].value).toBe("00");
    expect(minuteSelect.options[30].value).toBe("30");
    expect(minuteSelect.options[59].value).toBe("59");
  });

  it("correctly parses initial ISO date and 24-hour time", () => {
    render(<DateTimePicker24H value="2026-10-10T14:45" onChange={vi.fn()} />);

    const dateInput = screen.getByDisplayValue("2026-10-10") as HTMLInputElement;
    expect(dateInput).toBeDefined();
    expect(dateInput.value).toBe("2026-10-10");

    const hourSelect = screen.getByLabelText("Pilih Jam") as HTMLSelectElement;
    const minuteSelect = screen.getByLabelText("Pilih Menit") as HTMLSelectElement;

    expect(hourSelect.value).toBe("14");
    expect(minuteSelect.value).toBe("45");
  });

  it("calls onChange when date is changed", () => {
    const handleChange = vi.fn();
    render(<DateTimePicker24H value="2026-10-10T09:15" onChange={handleChange} />);

    const dateInput = screen.getByDisplayValue("2026-10-10");
    fireEvent.change(dateInput, { target: { value: "2026-10-15" } });

    expect(handleChange).toHaveBeenCalledWith("2026-10-15T09:15");
  });

  it("calls onChange when hour is changed in 24-hour format", () => {
    const handleChange = vi.fn();
    render(<DateTimePicker24H value="2026-10-10T09:15" onChange={handleChange} />);

    const hourSelect = screen.getByLabelText("Pilih Jam");
    fireEvent.change(hourSelect, { target: { value: "15" } });

    expect(handleChange).toHaveBeenCalledWith("2026-10-10T15:15");
  });

  it("calls onChange with empty string when clear button is clicked", () => {
    const handleChange = vi.fn();
    render(<DateTimePicker24H value="2026-10-10T09:15" onChange={handleChange} />);

    const clearButton = screen.getByTitle("Kosongkan Waktu");
    fireEvent.click(clearButton);

    expect(handleChange).toHaveBeenCalledWith("");
  });

  it("renders a hidden input when name prop is provided", () => {
    const { container } = render(
      <DateTimePicker24H name="batas_waktu" value="2026-10-10T13:00" onChange={vi.fn()} />
    );

    const hiddenInput = container.querySelector('input[name="batas_waktu"]') as HTMLInputElement;
    expect(hiddenInput).toBeDefined();
    expect(hiddenInput.value).toBe("2026-10-10T13:00");
    expect(hiddenInput.type).toBe("hidden");
  });
});
