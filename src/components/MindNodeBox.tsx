"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  BOX_H,
  BOX_PAD_X,
  BOX_RADIUS,
  BOX_W,
  CHILD_MAX_LINES,
  FONT_SIZE,
  LINE_HEIGHT,
  ROOT_BOX_H,
  ROOT_BOX_W,
  ROOT_COLOR,
  ROOT_FONT_SIZE,
  ROOT_MAX_LINES,
  STROKE_WIDTH,
  STROKE_WIDTH_SELECTED,
} from "@/lib/constants";
import { opposite } from "@/lib/layout";
import {
  canInsertNewline,
  capExplicitBreaks,
  estimateLineCount,
} from "@/lib/text";
import type { Direction, MindNode } from "@/lib/types";
import { IconPlus } from "./icons";

interface MindNodeBoxProps {
  node: MindNode;
  selected: boolean;
  autoEdit: boolean;
  /** Zoom thật (đổi size/font) — KHÔNG CSS scale, chữ nét */
  scale: number;
  onSelect: () => void;
  onAdd: (dir: Direction) => void;
  onTextChange: (text: string) => void;
  onAutoEditConsumed: () => void;
  /** Tab khi đang edit → lưu chữ + tạo child của node này (cùng hướng nhánh) */
  onTabCreateSibling: () => void;
  /** Delete khi đang type (chỉ child) → xóa cả subtree */
  onDelete?: () => void;
  /** Kéo thả child → đổi bên / reorder (world coords) */
  onRelocate?: (worldX: number, worldY: number) => void;
  /** Báo đang kéo — canvas ẩn line (không để line “mồ côi” vị trí cũ) */
  onDragActiveChange?: (dragging: boolean) => void;
}

/** Chỉ trái / phải — không trên / dưới */
const DIRS: Direction[] = ["left", "right"];

/**
 * Đo số dòng thực tế của textarea tại value hiện có.
 * scrollHeight bị sàn bởi height/maxHeight cố định của box (luôn ≥ clientHeight),
 * nên phải tạm bỏ height/maxHeight/paddingTop để lấy đúng chiều cao nội dung.
 */
function measureLinesAtCurrentValue(
  el: HTMLTextAreaElement,
  linePx: number
): number {
  const prevPad = el.style.paddingTop;
  const prevHeight = el.style.height;
  const prevMaxHeight = el.style.maxHeight;
  el.style.paddingTop = "0px";
  el.style.height = "auto";
  el.style.maxHeight = "none";
  const lines = Math.max(1, Math.round(el.scrollHeight / linePx));
  el.style.paddingTop = prevPad;
  el.style.height = prevHeight;
  el.style.maxHeight = prevMaxHeight;
  return lines;
}

export function MindNodeBox({
  node,
  selected,
  autoEdit,
  scale,
  onSelect,
  onAdd,
  onTextChange,
  onAutoEditConsumed,
  onTabCreateSibling,
  onDelete,
  onRelocate,
  onDragActiveChange,
}: MindNodeBoxProps) {
  const isRoot = node.parentId === null;
  const s = scale;
  const w = (isRoot ? ROOT_BOX_W : BOX_W) * s;
  const h = (isRoot ? ROOT_BOX_H : BOX_H) * s;
  const fontSize = (isRoot ? ROOT_FONT_SIZE : FONT_SIZE) * s;
  const padX = BOX_PAD_X * s;
  const maxLines = isRoot ? ROOT_MAX_LINES : CHILD_MAX_LINES;
  const linePx = fontSize * LINE_HEIGHT;
  const textBlockH = linePx * maxLines;
  const clamp = (t: string) => capExplicitBreaks(t, maxLines);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node.text);
  const [visualLines, setVisualLines] = useState(() =>
    estimateLineCount(node.text, maxLines)
  );
  const [dragPreview, setDragPreview] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const composingRef = useRef(false);
  const dragRef = useRef<{
    startClientX: number;
    startClientY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    if (!editing) setDraft(clamp(node.text));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.text, editing, maxLines]);

  useEffect(() => {
    if (editing) {
      taRef.current?.focus();
    }
  }, [editing]);

  useEffect(() => {
    if (autoEdit) {
      setEditing(true);
      onAutoEditConsumed();
    }
  }, [autoEdit, onAutoEditConsumed]);

  /** Đo lại số dòng thực (theo width thật) mỗi khi draft/zoom đổi — chỉnh padding để canh giữa dọc khi edit. */
  useLayoutEffect(() => {
    if (!editing) return;
    const el = taRef.current;
    if (!el) return;
    setVisualLines(measureLinesAtCurrentValue(el, linePx));
  }, [editing, draft, linePx, maxLines]);

  const hidden: Direction | null = node.direction
    ? opposite(node.direction)
    : null;
  const plusDirs = isRoot ? DIRS : DIRS.filter((d) => d !== hidden);

  const bg = isRoot ? ROOT_COLOR : "#FFFFFF";
  const fg = isRoot ? "#FFFFFF" : "#000000";
  const border = isRoot ? ROOT_COLOR : (node.color as string);
  const plusSize = (isRoot ? 26 : 22) * s;

  function plusStyle(dir: Direction): CSSProperties {
    const half = plusSize / 2;
    const base: CSSProperties = {
      position: "absolute",
      width: plusSize,
      height: plusSize,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 999,
      background: "#fff",
      border: `${1.5 * s}px solid ${isRoot ? "#333" : border}`,
      color: isRoot ? "#111" : border,
      cursor: "pointer",
      zIndex: 5,
      boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
    };
    switch (dir) {
      case "up":
        return {
          ...base,
          left: "50%",
          top: -half,
          transform: "translateX(-50%)",
        };
      case "down":
        return {
          ...base,
          left: "50%",
          bottom: -half,
          transform: "translateX(-50%)",
        };
      case "left":
        return {
          ...base,
          top: "50%",
          left: -half,
          transform: "translateY(-50%)",
        };
      case "right":
        return {
          ...base,
          top: "50%",
          right: -half,
          transform: "translateY(-50%)",
        };
    }
  }

  function commit(text: string) {
    setEditing(false);
    onTextChange(clamp(text));
  }

  /** Gõ bình thường (không compose): browser đã tự wrap theo width — chỉ cần chặn khi tràn quá maxLines. */
  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget;
    if (composingRef.current) {
      setDraft(el.value);
      return;
    }
    const next = el.value;
    const lines = measureLinesAtCurrentValue(el, linePx);
    if (lines > maxLines) {
      el.value = draft; // revert DOM trước khi paint — không cho gõ thêm khi box đã đầy
      return;
    }
    setDraft(next);
  }

  const lines = visualLines;
  const padY = Math.max(0, (h - lines * linePx) / 2);
  /** Viền scale theo zoom, sàn 1px khi zoom nhỏ */
  const borderW = Math.max(
    (selected ? STROKE_WIDTH_SELECTED : STROKE_WIDTH) * s,
    1
  );
  /**
   * Bo góc PHẢI scale theo zoom.
   * rounded-xl (12px rem cố định) khi zoom nhỏ > nửa box → méo / "quay".
   */
  const radius = Math.min(BOX_RADIUS * s, Math.min(w, h) / 2);

  const textStyle: CSSProperties = {
    color: fg,
    opacity: 1,
    fontFamily: "inherit",
    fontSize,
    fontWeight: 600,
    lineHeight: LINE_HEIGHT,
    textAlign: "center",
    // break-spaces (không phải pre-wrap): space cuối dòng KHÔNG được "hang" ra
    // ngoài box — nếu không, gõ space liên tục lúc box đầy vẫn lọt qua vô hạn.
    whiteSpace: "break-spaces",
    wordBreak: "keep-all",
    overflowWrap: "break-word",
    WebkitFontSmoothing: "auto",
    MozOsxFontSmoothing: "auto",
    textRendering: "geometricPrecision",
    WebkitTextFillColor: fg,
  };

  const posX = dragPreview?.x ?? node.x;
  const posY = dragPreview?.y ?? node.y;
  // World * scale — không round (tránh lệch line vs mép box)
  const left = posX * s - w / 2;
  const top = posY * s - h / 2;

  /**
   * Viền = inset shadow (KHÔNG dùng border CSS).
   * Border CSS + rounded hay tạo khe anti-alias trắng giữa line và box.
   */
  const faceShadow = [
    `inset 0 0 0 ${borderW}px ${border}`,
    selected ? `0 0 0 ${2 * s}px ${isRoot ? "#111" : border}33` : "",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      data-node-id={node.id}
      className="absolute select-none"
      style={{
        width: w,
        height: h,
        left,
        top,
        zIndex: selected || dragPreview ? 10 : 1,
        overflow: "visible",
        cursor: isRoot ? "default" : dragPreview ? "grabbing" : "grab",
        opacity: dragPreview ? 0.85 : 1,
      }}
      onMouseDown={(e) => {
        if (editing) return;
        if ((e.target as HTMLElement).closest("[data-plus]")) return;
        e.stopPropagation();
        onSelect();

        // Root không kéo; child kéo = đổi bên / reorder
        if (isRoot || !onRelocate || e.button !== 0) return;

        dragRef.current = {
          startClientX: e.clientX,
          startClientY: e.clientY,
          originX: node.x,
          originY: node.y,
          moved: false,
        };

        const onMove = (ev: MouseEvent) => {
          const d = dragRef.current;
          if (!d) return;
          const dx = (ev.clientX - d.startClientX) / s;
          const dy = (ev.clientY - d.startClientY) / s;
          if (Math.hypot(dx, dy) > 4) {
            if (!d.moved) {
              d.moved = true;
              onDragActiveChange?.(true);
            }
            setDragPreview({ x: d.originX + dx, y: d.originY + dy });
          }
        };
        const onUp = (ev: MouseEvent) => {
          const d = dragRef.current;
          dragRef.current = null;
          window.removeEventListener("mousemove", onMove);
          window.removeEventListener("mouseup", onUp);
          if (!d?.moved) {
            setDragPreview(null);
            return;
          }
          const dx = (ev.clientX - d.startClientX) / s;
          const dy = (ev.clientY - d.startClientY) / s;
          setDragPreview(null);
          onDragActiveChange?.(false);
          onRelocate(d.originX + dx, d.originY + dy);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
      }}
    >
      <div
        className="relative z-[1] box-border h-full w-full overflow-hidden"
        style={{
          background: bg,
          color: fg,
          border: "none",
          borderRadius: radius,
          boxSizing: "border-box",
          boxShadow: faceShadow,
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setEditing(true);
          requestAnimationFrame(() => taRef.current?.select());
        }}
      >
        {editing ? (
          <textarea
            ref={taRef}
            value={draft}
            rows={maxLines}
            spellCheck={false}
            onChange={handleChange}
            onCompositionStart={() => {
              composingRef.current = true;
            }}
            onCompositionEnd={(e) => {
              composingRef.current = false;
              const el = e.currentTarget;
              let next = el.value;
              el.value = next;
              let lines2 = measureLinesAtCurrentValue(el, linePx);
              // IME xong mới clamp theo chiều cao thật — không xáo giữa chừng
              while (lines2 > maxLines && next.length > 0) {
                next = next.slice(0, -1);
                el.value = next;
                lines2 = measureLinesAtCurrentValue(el, linePx);
              }
              setDraft(next);
            }}
            onBlur={() => commit(draft)}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                e.stopPropagation();
                onTextChange(clamp(draft));
                setEditing(false);
                onTabCreateSibling();
                return;
              }
              // Delete khi đang type child → xóa node (không xóa root)
              if (e.key === "Delete" && !isRoot && onDelete) {
                e.preventDefault();
                e.stopPropagation();
                setEditing(false);
                onDelete();
                return;
              }
              if (e.key === "Enter") {
                e.preventDefault();
                // Ctrl/Cmd+Enter = xuống dòng; Enter = xong type
                if (e.ctrlKey || e.metaKey) {
                  if (canInsertNewline(draft, maxLines)) {
                    const el = taRef.current;
                    if (el) {
                      const pos = el.selectionStart ?? draft.length;
                      const next =
                        draft.slice(0, pos) + "\n" + draft.slice(pos);
                      const prevVal = el.value;
                      el.value = next;
                      const nl = measureLinesAtCurrentValue(el, linePx);
                      el.value = prevVal;
                      if (nl <= maxLines) setDraft(next);
                    }
                  }
                  return;
                }
                commit(draft);
                return;
              }
              if (e.key === "Escape") {
                setEditing(false);
                setDraft(clamp(node.text));
                e.stopPropagation();
                return;
              }
              e.stopPropagation();
            }}
            onPaste={(e) => {
              e.preventDefault();
              if (composingRef.current) return;
              const el = taRef.current;
              if (!el) return;
              const paste = e.clipboardData
                .getData("text")
                .replace(/\r\n/g, "\n")
                .replace(/\r/g, "\n");
              const start = el.selectionStart ?? draft.length;
              const end = el.selectionEnd ?? draft.length;

              const outsideSelection =
                draft.slice(0, start) + draft.slice(end);
              const existingBreaks =
                outsideSelection.match(/\n/g)?.length ?? 0;
              const breakBudget = Math.max(
                0,
                maxLines - 1 - existingBreaks
              );
              let breaksUsed = 0;
              let clipped = "";
              for (const ch of paste) {
                if (ch === "\n") {
                  if (breaksUsed >= breakBudget) continue;
                  clipped += "\n";
                  breaksUsed++;
                  continue;
                }
                clipped += ch;
              }

              let candidate = draft.slice(0, start) + clipped + draft.slice(end);
              const prevVal = el.value;
              el.value = candidate;
              let lines3 = measureLinesAtCurrentValue(el, linePx);
              // Tràn theo chiều cao (không theo ký tự) → cắt dần từ cuối đoạn dán
              while (lines3 > maxLines && clipped.length > 0) {
                clipped = clipped.slice(0, -1);
                candidate = draft.slice(0, start) + clipped + draft.slice(end);
                el.value = candidate;
                lines3 = measureLinesAtCurrentValue(el, linePx);
              }
              el.value = prevVal;
              setDraft(candidate);
            }}
            className="box-border w-full resize-none overflow-hidden bg-transparent outline-none"
            style={{
              ...textStyle,
              paddingLeft: padX,
              paddingRight: padX,
              paddingTop: padY,
              paddingBottom: 0,
              height: h,
              maxHeight: h,
              overflowX: "hidden",
              overflowY: "hidden",
            }}
          />
        ) : (
          <div
            className="box-border flex h-full w-full items-center justify-center overflow-hidden"
            style={{
              ...textStyle,
              paddingLeft: padX,
              paddingRight: padX,
            }}
          >
            {node.text ? (
              <span
                className="block w-full overflow-hidden"
                style={{
                  whiteSpace: "break-spaces",
                  maxHeight: textBlockH,
                  lineHeight: LINE_HEIGHT,
                  fontSize,
                  fontWeight: 600,
                  color: fg,
                  WebkitTextFillColor: fg,
                  textAlign: "center",
                }}
              >
                {clamp(node.text)}
              </span>
            ) : null}
          </div>
        )}
      </div>

      {selected &&
        plusDirs.map((dir) => (
          <button
            key={dir}
            type="button"
            data-plus
            title={`Thêm nhánh ${dir}`}
            style={plusStyle(dir)}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onAdd(dir);
            }}
          >
            <IconPlus size={Math.max(12, (isRoot ? 16 : 14) * s)} />
          </button>
        ))}
    </div>
  );
}
