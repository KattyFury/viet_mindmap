"use client";

import { useState } from "react";

interface ImportDialogProps {
  open: boolean;
  onCancel: () => void;
  onImport: (text: string) => void;
}

export function ImportDialog({ open, onCancel, onImport }: ImportDialogProps) {
  const [text, setText] = useState("");

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[15px] font-medium text-[#111]">
          Tạo mindmap từ text
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[#555]">
          Dán 1 đoạn outline — mỗi dòng = 1 nhánh, thụt lề (dấu cách) = con của
          dòng phía trên. Dòng đầu bắt đầu bằng “#” sẽ thành tên map.
        </p>
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"# Tên map\n- Nhánh 1\n  - Nhánh con\n- Nhánh 2"}
          rows={10}
          className="mt-3 w-full resize-none rounded-lg border border-[#E9ECEF] bg-[#F8F9FA] px-3 py-2 font-mono text-[13px] text-[#111] outline-none focus:border-[#ADB5BD]"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-[#333] hover:bg-[#F1F3F5]"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={!text.trim()}
            onClick={() => {
              onImport(text);
              setText("");
            }}
            className="rounded-lg bg-[#111] px-3.5 py-2 text-[13px] font-medium text-white hover:bg-[#222] disabled:opacity-40"
          >
            Tạo mindmap
          </button>
        </div>
      </div>
    </div>
  );
}
