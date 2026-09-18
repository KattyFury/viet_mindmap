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
  color: BranchColor | "#FACC15";
  parentId: string | null;
  /** Direction from parent to this node */
  direction: Direction | null;
  level: number;
  /**
   * Thứ tự trong cùng parent + hướng (0,1,2…).
   * Reflow theo field này — KHÔNG sort theo x/y (tránh nhánh mới chen giữa).
   */
  siblingOrder: number;
  /**
   * Chiều cao box đo được (world px, không nhân scale) — box GROW theo nội
   * dung, không giới hạn số dòng. undefined → dùng default (defaultBoxHeight).
   */
  h?: number;
  /**
   * Gấp nhánh: true = ẩn TẤT CẢ con (và cháu) của node này. Chỉ áp dụng cho
   * non-root (root luôn hiện đủ, không có nút gấp). Con vẫn còn trong data
   * (không xóa) — chỉ ẩn khỏi canvas + không tính chỗ trong layout.
   */
  collapsed?: boolean;
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
