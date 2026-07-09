"use client";

import { useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { ConfirmDialog } from "./ConfirmDialog";
import { useMindmapStore } from "@/store/mindmap-store";
import { BRANCH_COLORS, SIDEBAR_W } from "@/lib/constants";

interface SidebarProps {
  email: string | null;
  name: string | null;
  authEnabled: boolean;
}

/** n hàng / 30 — theo chiều cao sidebar */
const R = (n: number) => `calc(100cqh * ${n} / 30)`;

/** Box = 4/5 chiều cao 2 hàng */
const BOX_H = "calc(100cqh * 2 / 30 * 4 / 5)";

/** Lề ngoài + border box 1px + padding trong — mọi chữ cùng 1 cột trái */
const OUTER_X = 12;
const INNER_X = 12;
const BOX_BORDER = 1;
const TEXT_X = OUTER_X + BOX_BORDER + INNER_X;

export function Sidebar({ email, name: _name, authEnabled }: SidebarProps) {
  const maps = useMindmapStore((s) => s.maps);
  const activeMapId = useMindmapStore((s) => s.activeMapId);
  const createMap = useMindmapStore((s) => s.createMap);
  const selectMap = useMindmapStore((s) => s.selectMap);
  const deleteMap = useMindmapStore((s) => s.deleteMap);
  const reorderMaps = useMindmapStore((s) => s.reorderMaps);

  const [dragId, setDragId] = useState<string | null>(null);
  const [trashHover, setTrashHover] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const sorted = [...maps].sort((a, b) => a.order - b.order);
  const shortEmail = email ?? "Chưa đăng nhập";

  return (
    <aside
      className="flex h-full shrink-0 flex-col border-r border-[#E9ECEF] bg-[#F8F9FA]"
      style={{ width: SIDEBAR_W, containerType: "size" }}
    >
      {/* Hàng 1–2: VietMindmap */}
      <div
        className="flex shrink-0 items-center justify-center"
        style={{ height: R(2), paddingLeft: OUTER_X, paddingRight: OUTER_X }}
      >
        <h1 className="text-center text-[22px] font-medium tracking-tight text-[#111]">
          VietMindmap
        </h1>
      </div>

      {/* Hàng 3–4: user — chỉ email, căn giữa, font vừa */}
      <div
        className="flex shrink-0 items-center justify-center"
        style={{ height: R(2), paddingLeft: OUTER_X, paddingRight: OUTER_X }}
      >
        <div
          className="flex w-full items-center justify-center rounded-xl border border-[#E9ECEF] bg-white px-3"
          style={{ height: BOX_H }}
          onClick={() => {
            if (!authEnabled) return;
            if (email) signOut();
            else signIn("google");
          }}
          role={authEnabled ? "button" : undefined}
        >
          <div className="truncate text-center text-[13px] font-medium text-[#212529]">
            {shortEmail}
          </div>
        </div>
      </div>

      {/* Hàng 5–6: thùng rác — chỉ dòng gợi ý, căn giữa */}
      <div
        className="flex shrink-0 items-center justify-center"
        style={{ height: R(2), paddingLeft: OUTER_X, paddingRight: OUTER_X }}
        onDragOver={(e) => {
          e.preventDefault();
          setTrashHover(true);
        }}
        onDragLeave={() => setTrashHover(false)}
        onDrop={(e) => {
          e.preventDefault();
          setTrashHover(false);
          const id = e.dataTransfer.getData("text/map-id") || dragId;
          if (id) setConfirmDeleteId(id);
          setDragId(null);
        }}
      >
        <div
          className={`flex w-full items-center justify-center rounded-xl border border-dashed px-3 ${
            trashHover
              ? "border-[#EF4444] bg-[#FEF2F2]"
              : "border-[#CED4DA] bg-white"
          }`}
          style={{ height: BOX_H }}
        >
          <div className="truncate text-center text-[13px] font-medium text-[#343A40]">
            Kéo map vào để xóa
          </div>
        </div>
      </div>

      {/* Hàng 7: Các mindmap — cùng cột chữ (TEXT_X), không box */}
      <div
        className="flex shrink-0 items-center"
        style={{
          height: R(1),
          paddingLeft: TEXT_X,
          paddingRight: OUTER_X,
        }}
      >
        <span className="text-[12px] font-medium text-[#868E96]">
          Các mindmap
        </span>
      </div>

      {/* Hàng 8+: map + tạo — chữ trong box cùng TEXT_X */}
      <div
        className="min-h-0 flex-1 overflow-y-auto pb-2"
        style={{ paddingLeft: OUTER_X, paddingRight: OUTER_X }}
      >
        <ul className="flex flex-col">
          {sorted.map((map, index) => {
            const active = map.id === activeMapId;
            const color = BRANCH_COLORS[index % BRANCH_COLORS.length];
            return (
              <li
                key={map.id}
                className="flex shrink-0 items-center"
                style={{ height: R(2) }}
              >
                <button
                  type="button"
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
                  onClick={() => selectMap(map.id)}
                  className={`flex w-full items-center justify-center rounded-xl bg-white text-center text-[13px] font-medium text-[#111] transition-opacity ${
                    dragId === map.id ? "opacity-50" : ""
                  }`}
                  style={{
                    height: BOX_H,
                    paddingLeft: INNER_X,
                    paddingRight: INNER_X,
                    border: `${active ? 3 : 2}px solid ${color}`,
                  }}
                >
                  <span className="truncate">
                    {map.name.trim() || "\u00A0"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex shrink-0 items-center" style={{ height: R(2) }}>
          <button
            type="button"
            onClick={() => createMap()}
            className="flex w-full items-center justify-center rounded-xl bg-[#111] text-[13px] font-medium text-white hover:bg-[#222]"
            style={{ height: BOX_H }}
          >
            Tạo mindmap mới
          </button>
        </div>
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
