"use client";

import { useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";
import { IconClose, IconPlus } from "./icons";
import { useMindmapStore } from "@/store/mindmap-store";
import { BRANCH_COLORS, SIDEBAR_W } from "@/lib/constants";

interface SidebarProps {
  email: string | null;
  name: string | null;
  authEnabled: boolean;
}

export function Sidebar({ email: _email, name: _name, authEnabled: _authEnabled }: SidebarProps) {
  const maps = useMindmapStore((s) => s.maps);
  const activeMapId = useMindmapStore((s) => s.activeMapId);
  const createMap = useMindmapStore((s) => s.createMap);
  const selectMap = useMindmapStore((s) => s.selectMap);
  const deleteMap = useMindmapStore((s) => s.deleteMap);
  const reorderMaps = useMindmapStore((s) => s.reorderMaps);

  const [dragId, setDragId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const sorted = [...maps].sort((a, b) => a.order - b.order);

  return (
    <aside
      className="flex h-full shrink-0 flex-col border-r border-[#E9ECEF] bg-[#F8F9FA]"
      style={{ width: SIDEBAR_W }}
    >
      <div className="flex shrink-0 items-center justify-center px-3 py-4">
        <h1 className="text-center text-[20px] font-medium tracking-tight text-[#111]">
          VietMindmap
        </h1>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        <ul className="flex flex-col gap-2">
          {sorted.map((map, index) => {
            const active = map.id === activeMapId;
            const color = BRANCH_COLORS[index % BRANCH_COLORS.length];
            return (
              <li
                key={map.id}
                draggable
                onDragStart={(e) => {
                  setDragId(map.id);
                  e.dataTransfer.setData("text/map-id", map.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragEnd={() => setDragId(null)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!dragId || dragId === map.id) return;
                  const from = sorted.findIndex((m) => m.id === dragId);
                  if (from !== -1 && from !== index) {
                    reorderMaps(from, index);
                  }
                }}
                className={`flex items-center gap-1.5 rounded-xl bg-white pl-3 pr-1.5 transition-opacity ${
                  dragId === map.id ? "opacity-50" : ""
                }`}
                style={{ border: `${active ? 3 : 2}px solid ${color}` }}
              >
                <button
                  type="button"
                  onClick={() => selectMap(map.id)}
                  className="min-w-0 flex-1 truncate py-2.5 text-left text-[13px] font-medium text-[#111]"
                >
                  {map.name.trim() || " "}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(map.id)}
                  aria-label="Xóa mindmap"
                  title="Xóa mindmap"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#ADB5BD] hover:bg-[#F1F3F5] hover:text-[#EF4444]"
                >
                  <IconClose size={14} />
                </button>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={() => createMap()}
          aria-label="Tạo mindmap mới"
          title="Tạo mindmap mới"
          className="mt-2 flex w-full items-center justify-center rounded-xl bg-[#111] py-2.5 text-white hover:bg-[#222]"
        >
          <IconPlus size={18} />
        </button>
      </div>

      <ConfirmDialog
        open={!!confirmDeleteId}
        title="Xóa mindmap?"
        message="Xóa mindmap này? Không thể hoàn tác."
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) deleteMap(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
      />
    </aside>
  );
}
