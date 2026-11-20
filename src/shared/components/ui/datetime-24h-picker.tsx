"use client";

import React, { useId } from "react";
import { Calendar, Clock, X } from "lucide-react";

export interface DateTimePicker24HProps {
  id?: string;
  name?: string;
  label?: string;
  value?: string; // Format: "YYYY-MM-DDTHH:mm" atau ""
  onChange?: (val: string) => void;
  required?: boolean;
  disabled?: boolean;
  minDate?: string;
  className?: string;
  helperText?: string;
}

const HOURS_24 = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES_60 = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

export function DateTimePicker24H({
  id,
  name,
  label,
  value = "",
  onChange,
  required = false,
  disabled = false,
  minDate,
  className = "",
  helperText,
}: DateTimePicker24HProps) {
  const generatedId = useId();
  const inputId = id || generatedId;

  // Parsing value "YYYY-MM-DDTHH:mm"
  const [datePart, timePart] = (value || "").split("T");
  const [currentHour = "07", currentMinute = "00"] = (timePart || "07:00").split(":");

  const handleDateChange = (newDate: string) => {
    if (!newDate) {
      onChange?.("");
      return;
    }
    const safeHour = currentHour || "07";
    const safeMinute = currentMinute || "00";
    onChange?.(`${newDate}T${safeHour}:${safeMinute}`);
  };

  const handleHourChange = (newHour: string) => {
    const today = new Date().toISOString().split("T")[0];
    const safeDate = datePart || today;
    const safeMinute = currentMinute || "00";
    onChange?.(`${safeDate}T${newHour}:${safeMinute}`);
  };

  const handleMinuteChange = (newMinute: string) => {
    const today = new Date().toISOString().split("T")[0];
    const safeDate = datePart || today;
    const safeHour = currentHour || "07";
    onChange?.(`${safeDate}T${safeHour}:${newMinute}`);
  };

  const handleClear = () => {
    onChange?.("");
  };

  const hasValue = Boolean(datePart);

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Hidden input for standard HTML Form Data / Server Action compatibility */}
      {name && <input type="hidden" name={name} value={value || ""} />}

      <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 p-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xs focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-600 transition min-w-0">
        {/* 1. Pemilih Tanggal */}
        <div className="relative flex-1 min-w-[120px] flex items-center">
          <Calendar className="h-3.5 w-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
          <input
            id={inputId}
            type="date"
            value={datePart || ""}
            min={minDate}
            disabled={disabled}
            required={required}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full text-xs pl-8 pr-2 py-1.5 rounded-lg bg-transparent border-0 text-slate-800 dark:text-slate-100 focus:outline-hidden cursor-pointer"
          />
        </div>

        {/* Separator */}
        <div className="hidden sm:block h-5 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />

        {/* 2. Pemilih Waktu 24 Jam (Jam : Menit) */}
        <div className="flex items-center gap-1 px-1.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/80 shrink-0">
          <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400 shrink-0" />

          {/* Dropdown Jam (00 - 23) */}
          <select
            value={hasValue ? currentHour : "07"}
            disabled={disabled}
            onChange={(e) => handleHourChange(e.target.value)}
            title="Pilih Jam (Format 24 Jam: 00 - 23)"
            aria-label="Pilih Jam"
            className="text-xs font-bold font-mono px-1 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-hidden cursor-pointer"
          >
            {HOURS_24.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>

          <span className="text-xs font-bold text-slate-400 select-none">:</span>

          {/* Dropdown Menit (00 - 59) */}
          <select
            value={hasValue ? currentMinute : "00"}
            disabled={disabled}
            onChange={(e) => handleMinuteChange(e.target.value)}
            title="Pilih Menit (00 - 59)"
            aria-label="Pilih Menit"
            className="text-xs font-bold font-mono px-1 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-hidden cursor-pointer"
          >
            {MINUTES_60.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Badge Penegas 24 Jam */}
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 pl-0.5 select-none">
            WIB
          </span>
        </div>

        {/* 3. Tombol Reset / Kosongkan jika ada isi */}
        {hasValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            title="Kosongkan Waktu"
            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {helperText && <p className="text-[10px] text-slate-500 dark:text-slate-400">{helperText}</p>}
    </div>
  );
}
