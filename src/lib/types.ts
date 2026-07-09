export type Direction = "up" | "down" | "left" | "right";

export type BranchColor =
  | "#EF4444"
  | "#F97316"
  | "#EAB308"
  | "#22C55E"
  | "#3B82F6"
  | "#A855F7"
  | "#6366F1"; // legacy only — không còn pick

export interface MindNode {
  id: string;
  text: string;
  x: number;
  y: number;
  color: BranchColor | "#111111";
  parentId: string | null;
  /** Direction from parent to this node */
  direction: Direction | null;
  level: number;
  /**
   * Thứ tự trong cùng parent + hướng (0,1,2…).
   * Reflow theo field này — KHÔNG sort theo x/y (tránh nhánh mới chen giữa).
   */
  siblingOrder: number;
}

export interface MindMapDoc {
  id: string;
  /** Display name = root box text */
  name: string;
  nodes: Record<string, MindNode>;
  rootId: string;
  order: number;
  updatedAt: number;
  createdAt: number;
}

export interface UserMindmaps {
  maps: MindMapDoc[];
  activeMapId: string | null;
}
