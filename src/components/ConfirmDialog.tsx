"use client";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Xóa",
  cancelLabel = "Hủy",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[15px] font-medium text-[#111]">{title}</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[#555]">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-[#333] hover:bg-[#F1F3F5]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-[#111] px-3.5 py-2 text-[13px] font-medium text-white hover:bg-[#222]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
