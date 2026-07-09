"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { STROKE_WIDTH } from "@/lib/constants";
import { exportMindmapPng } from "@/lib/export-png";
import { lineEndpoints } from "@/lib/layout";
import { useMindmapStore } from "@/store/mindmap-store";
import type { Direction, MindMapDoc } from "@/lib/types";
import { IconDownload } from "./icons";
import { MindNodeBox } from "./MindNodeBox";

function panToCenterRoot(
  viewport: HTMLElement,
  map: MindMapDoc,
  scale: number
): { x: number; y: number } | null {
  const root = map.nodes[map.rootId];
  if (!root) return null;
  const rect = viewport.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return null;
  return {
    x: Math.round(rect.width / 2 - root.x * scale),
    y: Math.round(rect.height / 2 - root.y * scale),
  };
}

export function MindMapCanvas() {
  const map = useMindmapStore((s) => s.getActiveMap());
  const selectedId = useMindmapStore((s) => s.selectedId);
  const setSelected = useMindmapStore((s) => s.setSelected);
  const pendingEditId = useMindmapStore((s) => s.pendingEditId);
  const clearPendingEdit = useMindmapStore((s) => s.clearPendingEdit);
  const addChild = useMindmapStore((s) => s.addChild);
  const updateText = useMindmapStore((s) => s.updateText);
  const relocateChildDrag = useMindmapStore((s) => s.relocateChildDrag);
  const deleteSubtree = useMindmapStore((s) => s.deleteSubtree);
  const clearText = useMindmapStore((s) => s.clearText);
  const undo = useMindmapStore((s) => s.undo);
  const redo = useMindmapStore((s) => s.redo);

  const viewportRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [exporting, setExporting] = useState(false);
  /** Đang kéo child này → ẩn line gắn với nó (không để line cũ treo) */
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const panning = useRef<{
    x: number;
    y: number;
    px: number;
    py: number;
  } | null>(null);
  const scaleRef = useRef(scale);
  const panRef = useRef(pan);
  scaleRef.current = scale;
  panRef.current = pan;

  useEffect(() => {
    if (!map) return;

    setScale(1);

    let cancelled = false;
    const run = () => {
      if (cancelled || !viewportRef.current) return;
      const next = panToCenterRoot(viewportRef.current, map, 1);
      if (next) setPan(next);
    };

    const a = requestAnimationFrame(() => {
      run();
      requestAnimationFrame(run);
    });
    const t = window.setTimeout(run, 50);

    return () => {
      cancelled = true;
      cancelAnimationFrame(a);
      clearTimeout(t);
    };
  }, [map?.id]);

  /** Tab = nhánh mới cùng hướng (trái/phải/…); root → phải */
  const addSiblingSameDir = useCallback(() => {
    if (!map || !selectedId) return;
    const node = map.nodes[selectedId];
    if (!node) return;
    if (node.parentId && node.direction) {
      addChild(node.parentId, node.direction);
    } else {
      addChild(node.id, "right");
    }
  }, [map, selectedId, addChild]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const inField = tag === "TEXTAREA" || tag === "INPUT";

      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        if (inField) return;
        e.preventDefault();
        undo();
        return;
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        if (inField) return;
        e.preventDefault();
        redo();
        return;
      }

      if (!selectedId || !map) return;

      // Tab khi không focus textarea (đang edit → MindNodeBox xử lý)
      if (
        e.key === "Tab" &&
        !inField &&
        !e.altKey &&
        !e.ctrlKey &&
        !e.metaKey
      ) {
        e.preventDefault();
        addSiblingSameDir();
        return;
      }

      if (inField) return;

      if (e.key === "Delete") {
        e.preventDefault();
        if (selectedId !== map.rootId) deleteSubtree(selectedId);
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        clearText(selectedId);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    selectedId,
    map,
    undo,
    redo,
    deleteSubtree,
    clearText,
    addChild,
    addSiblingSameDir,
  ]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const vp = viewportRef.current;
    if (!vp) return;

    const rect = vp.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const s0 = scaleRef.current;
    const p0 = panRef.current;
    const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
    const s1 = Math.min(2.5, Math.max(0.35, s0 * factor));
    if (Math.abs(s1 - s0) < 0.001) return;

    const wx = (mx - p0.x) / s0;
    const wy = (my - p0.y) / s0;
    setScale(s1);
    setPan({
      x: Math.round(mx - wx * s1),
      y: Math.round(my - wy * s1),
    });
  }, []);

  const nodes = map ? Object.values(map.nodes) : [];
  const lines =
    map &&
    nodes
      .filter((n) => {
        if (!n.parentId || !map.nodes[n.parentId]) return false;
        // Ẩn line gắn node đang kéo (vào node / ra từ node) — không treo vị trí cũ
        if (draggingId && (n.id === draggingId || n.parentId === draggingId)) {
          return false;
        }
        return true;
      })
      .map((n) => {
        const parent = map.nodes[n.parentId!];
        const ep = lineEndpoints(parent, n, scale, map.nodes);
        return { id: n.id, color: n.color, ...ep };
      });

  async function handleDownload() {
    if (!worldRef.current || !map) return;
    setExporting(true);
    try {
      // Export luôn ở scale 1 (chữ nét + đủ pixel)
      await exportMindmapPng(worldRef.current, nodes, map.name, scale);
    } finally {
      setExporting(false);
    }
  }

  function recenter() {
    if (!viewportRef.current || !map) return;
    const next = panToCenterRoot(
      viewportRef.current,
      map,
      scaleRef.current
    );
    if (next) setPan(next);
  }

  if (!map) {
    return (
      <div className="relative flex h-full min-w-0 flex-1 items-center justify-center bg-white">
        <p className="text-[13px] text-[#868E96]">
          Chưa có mindmap — bấm “Tạo mindmap mới” bên trái
        </p>
      </div>
    );
  }

  const panX = Math.round(pan.x);
  const panY = Math.round(pan.y);

  return (
    <div className="relative h-full min-w-0 flex-1 bg-white">
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={recenter}
          className="rounded-xl border border-[#E9ECEF] bg-white px-3 py-2 text-[12px] font-medium text-[#495057] shadow-sm hover:bg-[#F8F9FA]"
          title="Căn giữa root"
        >
          Center
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={exporting || !map}
          className="flex items-center gap-2 rounded-xl border border-[#E9ECEF] bg-white px-3.5 py-2 text-[13px] font-medium text-[#212529] shadow-sm hover:bg-[#F8F9FA] disabled:opacity-50"
        >
          <IconDownload size={18} />
          {exporting ? "Đang xuất…" : "Download"}
        </button>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-4">
        <div className="flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full border border-[#E9ECEF] bg-white/90 px-4 py-1.5 text-center text-[11px] leading-none text-[#868E96] shadow-sm backdrop-blur-sm">
          <span>Cuộn = zoom</span>
          <span className="hidden text-[#DEE2E6] sm:inline" aria-hidden>
            |
          </span>
          <span>Tab = nhánh cùng hướng</span>
          <span className="hidden text-[#DEE2E6] sm:inline" aria-hidden>
            |
          </span>
          <span>Enter = xong · Ctrl+Enter = xuống dòng</span>
          <span className="hidden text-[#DEE2E6] sm:inline" aria-hidden>
            |
          </span>
          <span>Delete = xóa</span>
          <span className="hidden text-[#DEE2E6] sm:inline" aria-hidden>
            |
          </span>
          <span>Ctrl+Z = hoàn tác</span>
        </div>
      </div>

      <div
        ref={viewportRef}
        data-mmap-scale={scale}
        className="h-full w-full cursor-grab overflow-hidden active:cursor-grabbing"
        onWheel={onWheel}
        onMouseDown={(e) => {
          if (e.button !== 0) return;
          if ((e.target as HTMLElement).closest("[data-node-id]")) return;
          setSelected(null);
          panning.current = {
            x: e.clientX,
            y: e.clientY,
            px: pan.x,
            py: pan.y,
          };
          const onMove = (ev: MouseEvent) => {
            if (!panning.current) return;
            setPan({
              x: Math.round(
                panning.current.px + (ev.clientX - panning.current.x)
              ),
              y: Math.round(
                panning.current.py + (ev.clientY - panning.current.y)
              ),
            });
          };
          const onUp = () => {
            panning.current = null;
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
          };
          window.addEventListener("mousemove", onMove);
          window.addEventListener("mouseup", onUp);
        }}
      >
        {/*
          CHỈ translate (integer px) — KHÔNG scale CSS.
          Zoom = đổi size/font/toạ độ thật → chữ luôn nét.
        */}
        <div
          ref={worldRef}
          className="relative"
          style={{
            transform: `translate(${panX}px, ${panY}px)`,
            width: 1,
            height: 1,
          }}
          data-export-scale={scale}
        >
          {/* Line DƯỚI box — 2 đầu dig 3px vào trong box */}
          <svg
            className="pointer-events-none absolute overflow-visible"
            style={{ left: 0, top: 0, width: 1, height: 1, zIndex: 0 }}
          >
            {lines &&
              lines.map((l) => (
                <line
                  key={l.id}
                  x1={l.x1 * scale}
                  y1={l.y1 * scale}
                  x2={l.x2 * scale}
                  y2={l.y2 * scale}
                  stroke={l.color}
                  strokeWidth={Math.max(STROKE_WIDTH * scale, 1.25)}
                  strokeLinecap="butt"
                />
              ))}
          </svg>

          {map &&
            nodes.map((node) => (
              <MindNodeBox
                key={node.id}
                node={node}
                scale={scale}
                selected={selectedId === node.id}
                autoEdit={pendingEditId === node.id}
                onSelect={() => setSelected(node.id)}
                onAdd={(dir: Direction) => addChild(node.id, dir)}
                onTextChange={(text) => updateText(node.id, text)}
                onAutoEditConsumed={clearPendingEdit}
                onTabCreateSibling={addSiblingSameDir}
                onRelocate={
                  node.parentId
                    ? (x, y) => relocateChildDrag(node.id, x, y)
                    : undefined
                }
                onDragActiveChange={
                  node.parentId
                    ? (active) =>
                        setDraggingId(active ? node.id : null)
                    : undefined
                }
              />
            ))}
        </div>
      </div>
    </div>
  );
}
