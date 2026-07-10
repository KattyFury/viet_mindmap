"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  BOX_H,
  BOX_PAD_X,
  BOX_RADIUS,
  BOX_W,
  FONT_SIZE,
  LINE_HEIGHT,
  MAX_LINES,
  ROOT_BOX_H,
  ROOT_BOX_W,
  ROOT_COLOR,
  ROOT_FONT_SIZE,
  STROKE_WIDTH,
  STROKE_WIDTH_SELECTED,
} from "@/lib/constants";
import { opposite } from "@/lib/layout";
import {
  acceptInput,
  canInsertNewline,
  charsPerLineForNode,
  clampNodeText,
  contentLength,
  isContentFull,
  logicalLineCount,
  maxContentChars,
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
  const maxChars = charsPerLineForNode(isRoot);
  const linePx = fontSize * LINE_HEIGHT;
  const textBlockH = linePx * MAX_LINES;
  const clamp = (t: string) => clampNodeText(t, maxChars);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node.text);
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
  const maxTotal = maxContentChars(maxChars);

  useEffect(() => {
    if (!editing) setDraft(clamp(node.text));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.text, editing, maxChars]);

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

  function applyDraft(raw: string) {
    if (composingRef.current) {
      setDraft(raw);
      return;
    }
    setDraft((prev) => acceptInput(prev, raw, maxChars));
  }

  function commit(text: string) {
    setEditing(false);
    onTextChange(clamp(text));
  }

  function blockIfFull(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (composingRef.current) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key.length !== 1) return;
    const el = taRef.current;
    if (!el) return;
    if (el.selectionEnd - el.selectionStart > 0) return;
    if (isContentFull(draft, maxChars)) e.preventDefault();
  }

  const lines = logicalLineCount(editing ? draft : node.text);
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
    whiteSpace: "pre",
    wordBreak: "keep-all",
    overflowWrap: "normal",
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
            rows={MAX_LINES}
            // +1 cho 1 ký tự \n; chặn gõ khi full
            maxLength={maxTotal + 1}
            spellCheck={false}
            onChange={(e) => applyDraft(e.target.value)}
            onCompositionStart={() => {
              composingRef.current = true;
            }}
            onCompositionEnd={(e) => {
              composingRef.current = false;
              // IME xong → clamp 1 lần, không xáo giữa chừng
              setDraft((prev) =>
                acceptInput(prev, e.currentTarget.value, maxChars)
              );
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
                  if (
                    canInsertNewline(draft) &&
                    !isContentFull(draft, maxChars)
                  ) {
                    const el = taRef.current;
                    const pos = el?.selectionStart ?? draft.length;
                    applyDraft(draft.slice(0, pos) + "\n" + draft.slice(pos));
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
              blockIfFull(e);
              e.stopPropagation();
            }}
            onBeforeInput={(e) => {
              if (composingRef.current) return;
              const ne = e.nativeEvent as InputEvent;
              if (ne.inputType?.startsWith("delete")) return;
              const el = taRef.current;
              if (!el) return;
              if (el.selectionEnd !== el.selectionStart) return;
              if (isContentFull(draft, maxChars)) e.preventDefault();
            }}
            onPaste={(e) => {
              e.preventDefault();
              if (composingRef.current) return;
              const paste = e.clipboardData.getData("text");
              const start = taRef.current?.selectionStart ?? draft.length;
              const end = taRef.current?.selectionEnd ?? draft.length;
              const room =
                maxTotal -
                (contentLength(draft) - contentLength(draft.slice(start, end)));
              if (room <= 0) return;
              const clipped = paste.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
              let taken = "";
              let n = 0;
              for (const ch of clipped) {
                if (ch === "\n") {
                  if (taken.includes("\n")) continue;
                  if (n >= room) break;
                  taken += "\n";
                  continue;
                }
                if (n >= room) break;
                taken += ch;
                n++;
              }
              applyDraft(draft.slice(0, start) + taken + draft.slice(end));
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
                className="block w-full overflow-hidden text-center"
                style={{
                  whiteSpace: "pre",
                  maxHeight: textBlockH,
                  lineHeight: LINE_HEIGHT,
                  fontSize,
                  fontWeight: 600,
                  color: fg,
                  WebkitTextFillColor: fg,
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
