"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  BOX_PAD_X,
  BOX_PAD_Y,
  BOX_RADIUS,
  BOX_W,
  FONT_SIZE,
  LINE_HEIGHT,
  ROOT_BOX_W,
  ROOT_COLOR,
  ROOT_FONT_SIZE,
  STROKE_WIDTH,
  STROKE_WIDTH_SELECTED,
  defaultBoxHeight,
} from "@/lib/constants";
import { contrastText } from "@/lib/colors";
import { opposite } from "@/lib/layout";
import { useMindmapStore } from "@/store/mindmap-store";
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
  /** h = chiều cao box đo được (world px) — box grow theo nội dung */
  onTextChange: (text: string, h: number) => void;
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
 * Đo chiều cao NỘI DUNG THẬT (không tính padding, world px) của textarea đang
 * edit, rồi set lại height + padding-top/bottom để canh giữa dọc.
 * scrollHeight bị "sàn" ở height/padding hiện tại của element (không bao giờ
 * báo NHỎ hơn) — nên phải tạm bỏ height + padding trước khi đo.
 *
 * Box luôn ≥ floorWorldH (default lines) → khi nội dung NGẮN hơn default
 * (rỗng, 1 dòng trong box mặc định 2 dòng…) sẽ dư khoảng trống — dư đó phải
 * chia đều top/bottom để caret/chữ nằm GIỮA box, không dồn hết lên trên.
 */
function measureAndApplyTextareaBox(
  el: HTMLTextAreaElement,
  scale: number,
  floorWorldH: number,
  padWorldTotal: number
): { worldH: number; padWorld: number } {
  el.style.paddingTop = "0px";
  el.style.paddingBottom = "0px";
  el.style.height = "auto";
  const contentWorldH = el.scrollHeight / scale;
  const worldH = Math.max(floorWorldH, contentWorldH + padWorldTotal);
  const padWorld = (worldH - contentWorldH) / 2;
  el.style.paddingTop = `${padWorld * scale}px`;
  el.style.paddingBottom = `${padWorld * scale}px`;
  el.style.height = `${worldH * scale}px`;
  return { worldH, padWorld };
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
  const fontSize = (isRoot ? ROOT_FONT_SIZE : FONT_SIZE) * s;
  const padX = BOX_PAD_X * s;
  const padY = (BOX_PAD_Y / 2) * s;
  const defaultH = defaultBoxHeight(isRoot);
  /** Box grow theo nội dung, không giới hạn số dòng. */
  const committedH = node.h ?? defaultH;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node.text);
  const [liveH, setLiveH] = useState(committedH);
  /** Padding dọc THẬT của textarea đang edit — canh giữa khi nội dung ngắn hơn default. */
  const [taPadY, setTaPadY] = useState(BOX_PAD_Y / 2);
  const [dragPreview, setDragPreview] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const dragRef = useRef<{
    startClientX: number;
    startClientY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    if (!editing) setDraft(node.text);
  }, [node.text, editing]);

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

  /** Đang edit: đo lại chiều cao thật (theo width thật, browser tự wrap) mỗi khi draft/zoom đổi → box grow/co live, canh giữa dọc. */
  useLayoutEffect(() => {
    if (!editing) return;
    const el = taRef.current;
    if (!el) return;
    const { worldH, padWorld } = measureAndApplyTextareaBox(
      el,
      s,
      defaultH,
      BOX_PAD_Y
    );
    setLiveH(worldH);
    setTaPadY(padWorld);
  }, [editing, draft, s, defaultH]);

  /**
   * Không edit: tự chữa dữ liệu cũ/lệch (map cũ trước khi có field `h`, hoặc
   * font/host khác làm lệch vài px) — đo span thật, khác node.h thì ghi lại.
   */
  useLayoutEffect(() => {
    if (editing) return;
    if (!node.text) return;
    const span = spanRef.current;
    if (!span) return;
    const worldH = Math.max(defaultH, span.offsetHeight / s + BOX_PAD_Y);
    if (Math.abs(worldH - committedH) > 1) {
      onTextChange(node.text, worldH);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, node.text, s, defaultH, committedH]);

  const hidden: Direction | null = node.direction
    ? opposite(node.direction)
    : null;
  const plusDirs = isRoot ? DIRS : DIRS.filter((d) => d !== hidden);

  const colorMode = useMindmapStore((st) => st.colorMode);
  const customColor = useMindmapStore((st) => st.customColor);
  const custom = colorMode === "custom";
  // Root: bg+border luôn 1 màu (đen mặc định, hoặc customColor ở chế độ custom).
  // Child: bg luôn trắng; border = màu nhánh riêng, hoặc customColor ở chế độ custom.
  const rootColor = custom ? customColor : ROOT_COLOR;
  const bg = isRoot ? rootColor : "#FFFFFF";
  const fg = isRoot ? contrastText(rootColor) : "#000000";
  const border = isRoot ? rootColor : custom ? customColor : (node.color as string);
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
      border: `${1.5 * s}px solid ${border}`,
      color: border,
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
    onTextChange(text, liveH);
  }

  const h = (editing ? liveH : committedH) * s;
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
    // ngoài box — nếu không, đo chiều cao thật sẽ bị lệch.
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
    selected ? `0 0 0 ${2 * s}px ${border}33` : "",
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
            rows={1}
            spellCheck={false}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => commit(draft)}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                e.stopPropagation();
                onTextChange(draft, liveH);
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
                  const el = taRef.current;
                  const pos = el?.selectionStart ?? draft.length;
                  setDraft(draft.slice(0, pos) + "\n" + draft.slice(pos));
                  return;
                }
                commit(draft);
                return;
              }
              if (e.key === "Escape") {
                setEditing(false);
                setDraft(node.text);
                e.stopPropagation();
                return;
              }
              e.stopPropagation();
            }}
            className="box-border w-full resize-none overflow-hidden bg-transparent outline-none"
            style={{
              ...textStyle,
              paddingLeft: padX,
              paddingRight: padX,
              paddingTop: taPadY * s,
              paddingBottom: taPadY * s,
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
              paddingTop: padY,
              paddingBottom: padY,
            }}
          >
            {node.text ? (
              <span
                ref={spanRef}
                className="block w-full"
                style={{
                  whiteSpace: "break-spaces",
                  lineHeight: LINE_HEIGHT,
                  fontSize,
                  fontWeight: 600,
                  color: fg,
                  WebkitTextFillColor: fg,
                  textAlign: "center",
                }}
              >
                {node.text}
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
