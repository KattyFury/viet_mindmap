"use client";

import { useEffect, useRef, useState } from "react";
import { BRANCH_COLORS } from "@/lib/constants";
import { useMindmapStore } from "@/store/mindmap-store";

const RAINBOW_SWATCH = `conic-gradient(${BRANCH_COLORS.join(", ")}, ${
  BRANCH_COLORS[0]
})`;

export function ColorModeMenu() {
  const colorMode = useMindmapStore((s) => s.colorMode);
  const customColor = useMindmapStore((s) => s.customColor);
  const setColorMode = useMindmapStore((s) => s.setColorMode);
  const setCustomColor = useMindmapStore((s) => s.setCustomColor);

  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-[#E9ECEF] bg-white px-3 py-2 text-[12px] font-medium text-[#495057] shadow-sm hover:bg-[#F8F9FA]"
        title="Chế độ màu"
      >
        <span
          className="h-4 w-4 shrink-0 rounded-full border border-black/10"
          style={{
            background: colorMode === "custom" ? customColor : RAINBOW_SWATCH,
          }}
        />
        {colorMode === "custom" ? "Màu riêng" : "Rainbow"}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border border-[#E9ECEF] bg-white p-2 shadow-lg">
          <button
            type="button"
            onClick={() => {
              setColorMode("rainbow");
              setOpen(false);
            }}
            className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium hover:bg-[#F8F9FA] ${
              colorMode === "rainbow" ? "bg-[#F1F3F5] text-[#111]" : "text-[#343A40]"
            }`}
          >
            <span
              className="h-4 w-4 shrink-0 rounded-full border border-black/10"
              style={{ background: RAINBOW_SWATCH }}
            />
            Rainbow — mỗi nhánh 1 màu
          </button>

          <button
            type="button"
            onClick={() => setColorMode("custom")}
            className={`mt-1 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium hover:bg-[#F8F9FA] ${
              colorMode === "custom" ? "bg-[#F1F3F5] text-[#111]" : "text-[#343A40]"
            }`}
          >
            <span
              className="h-4 w-4 shrink-0 rounded-full border border-black/10"
              style={{ background: customColor }}
            />
            Màu riêng — 1 màu cho tất cả
          </button>

          {colorMode === "custom" && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-[#F1F3F5] px-2.5 pt-2.5">
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="h-6 w-6 cursor-pointer rounded border border-[#E9ECEF] bg-transparent p-0"
                title="Chọn màu"
              />
              {BRANCH_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCustomColor(c)}
                  className="h-5 w-5 shrink-0 rounded-full border border-black/10"
                  style={{
                    background: c,
                    outline:
                      c === customColor ? "2px solid #111" : "none",
                    outlineOffset: 1,
                  }}
                  title={c}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
