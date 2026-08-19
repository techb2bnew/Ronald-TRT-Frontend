"use client";

import React, { useEffect, useRef, useState } from "react";

type OptionItem = { value: string; label: React.ReactNode };

function parseOptions(children: React.ReactNode): OptionItem[] {
  return React.Children.toArray(children)
    .filter(React.isValidElement)
    .map((child) => {
      const el = child as React.ReactElement<{ value?: string; children?: React.ReactNode }>;
      return {
        value: String(el.props.value ?? ""),
        label: el.props.children,
      };
    });
}

interface AdminSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

const AdminSelect = React.forwardRef<HTMLSelectElement, AdminSelectProps>(
  ({ children, className, value, defaultValue, onChange, disabled, id, name, ...rest }, ref) => {
    const options = parseOptions(children);
    const getInitialValue = () => {
      if (value !== undefined) return String(value);
      if (defaultValue !== undefined) return String(defaultValue);
      return options[0]?.value ?? "";
    };

    const [isMobile, setIsMobile] = useState(false);
    const [open, setOpen] = useState(false);
    const [internalValue, setInternalValue] = useState<string>(getInitialValue);
    const wrapRef = useRef<HTMLDivElement>(null);

    const isControlled = value !== undefined;
    const currentValue = isControlled ? String(value) : internalValue;
    const selectedOption =
      options.find((opt) => opt.value === currentValue) ?? options[0];

    useEffect(() => {
      const check = () => setIsMobile(window.innerWidth <= 991);
      check();
      window.addEventListener("resize", check);
      return () => window.removeEventListener("resize", check);
    }, []);

    useEffect(() => {
      if (!open) return;
      const handleClickOutside = (e: MouseEvent) => {
        if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    const fireChange = (nextValue: string) => {
      if (!isControlled) setInternalValue(nextValue);
      onChange?.({
        target: { value: nextValue, name: name ?? "" },
      } as React.ChangeEvent<HTMLSelectElement>);
    };

    if (!isMobile) {
      return (
        <select
          ref={ref}
          id={id}
          name={name}
          className={className}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          disabled={disabled}
          {...rest}
        >
          {children}
        </select>
      );
    }

    return (
      <div className="admin-select-wrap admin-custom-select" ref={wrapRef}>
        <button
          type="button"
          id={id}
          className={`admin-filter-select ${className ?? ""}`}
          onClick={() => !disabled && setOpen((prev) => !prev)}
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <span className="admin-select-value">{selectedOption?.label}</span>
        </button>
        {open && (
          <ul className="admin-select-dropdown" role="listbox" aria-labelledby={id}>
            {options.map((opt) => (
              <li
                key={`${id ?? "select"}-${opt.value}`}
                role="option"
                aria-selected={opt.value === currentValue}
                className={opt.value === currentValue ? "is-selected" : ""}
                onClick={() => {
                  fireChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
);

AdminSelect.displayName = "AdminSelect";

export default AdminSelect;
