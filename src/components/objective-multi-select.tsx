"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Renders real checkboxes (not just a visual popover) so the enclosing
 * `<form method="GET">` submits them natively as repeated `objective=`
 * query params — no hidden-input syncing needed.
 */
export function ObjectiveMultiSelect({
  name,
  options,
  defaultValues,
}: {
  name: string;
  options: { value: string; label: string }[];
  defaultValues: string[];
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(defaultValues);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggle = (value: string) => {
    setSelected((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  const buttonLabel =
    selected.length === 0 || selected.length === options.length
      ? "Semua"
      : selected.length === 1
        ? options.find((o) => o.value === selected[0])?.label
        : `${selected.length} dipilih`;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="select-field flex min-w-[10rem] items-center justify-between gap-2 py-1.5 text-left"
      >
        <span>{buttonLabel}</span>
        <span className="text-slate-400">▾</span>
      </button>
      {/* Always mounted (never conditionally rendered) so the checkboxes
          stay part of the form's DOM through the outside-click-to-close
          handler below — unmounting them on close would drop them from
          the GET submission if a click landed on the submit button. */}
      <div
        className={`absolute z-10 mt-1 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-lg ${
          open ? "" : "hidden"
        }`}
      >
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <input
              type="checkbox"
              name={name}
              value={option.value}
              checked={selected.includes(option.value)}
              onChange={() => toggle(option.value)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}
