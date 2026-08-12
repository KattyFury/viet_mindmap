import { BRANCH_COLORS } from "./constants";
import type { BranchColor, MindNode } from "./types";

/** Pick a random rainbow color, prefer unused among siblings. */
export function pickBranchColor(
  siblings: MindNode[],
  preferUnused = true
): BranchColor {
  if (preferUnused) {
    const used = new Set(siblings.map((s) => s.color));
    const free = BRANCH_COLORS.filter((c) => !used.has(c));
    if (free.length > 0) {
      return free[Math.floor(Math.random() * free.length)];
    }
  }
  return BRANCH_COLORS[Math.floor(Math.random() * BRANCH_COLORS.length)];
}

/** Chữ đen/trắng theo độ sáng nền — đọc được trên bất kỳ màu custom nào. */
export function contrastText(hex: string): "#000000" | "#FFFFFF" {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
}
