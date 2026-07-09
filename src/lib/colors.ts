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
