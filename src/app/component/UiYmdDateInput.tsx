"use client";

import React from "react";
import dayjs, { type Dayjs } from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { MUI_DATE_PICKER_DISPLAY_FORMAT } from "@/lib/dateUtils";

type UiYmdDateInputProps = {
  /** API / state value in yyyy-MM-dd — unchanged from original type="date" */
  value: string;
  onChange: (ymd: string) => void;
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
  color?: "warning" | "primary" | "secondary" | "error" | "info" | "success";
  size?: "small" | "medium";
  /** Fixed width like previous native date input (tech detail). */
  minWidth?: number | string;
};

function ymdToDayjs(ymd: string): Dayjs | null {
  const s = String(ymd ?? "").trim();
  if (!s) return null;
  const isoDay = /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : s;
  const d = dayjs(isoDay);
  return d.isValid() ? d : null;
}

/**
 * Drop-in for previous TextField/input type="date".
 * Same value/onChange contract (yyyy-MM-dd); only the visible format is MM/dd/yy.
 */
export default function UiYmdDateInput({
  value,
  onChange,
  disabled = false,
  className = "",
  fullWidth = true,
  color = "warning",
  size = "small",
  minWidth,
}: UiYmdDateInputProps) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        format={MUI_DATE_PICKER_DISPLAY_FORMAT}
        value={ymdToDayjs(value)}
        disabled={disabled}
        onChange={(newValue) => {
          if (!newValue || !newValue.isValid()) {
            onChange("");
            return;
          }
          onChange(newValue.format("YYYY-MM-DD"));
        }}
        slotProps={{
          textField: {
            size,
            fullWidth: minWidth ? false : fullWidth,
            color,
            className,
            placeholder: "MM/dd/yy",
            InputLabelProps: { shrink: true },
            sx: minWidth
              ? {
                  minWidth,
                  width: minWidth,
                  "& .MuiInputBase-root": { minWidth, width: minWidth },
                }
              : undefined,
          },
          field: {
            clearable: true,
            onClear: () => onChange(""),
          },
          // Clear button inside calendar popup (like native clear / unpaid flow)
          actionBar: {
            actions: ["clear", "today"],
          },
        }}
      />
    </LocalizationProvider>
  );
}
