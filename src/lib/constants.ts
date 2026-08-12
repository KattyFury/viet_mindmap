import type { BranchColor } from "./types";

/**
 * KHÔNG giới hạn số dòng/ký tự — box GROW theo nội dung, tùy ý bao nhiêu dòng.
 * DEFAULT_LINES chỉ là kích thước lúc box rỗng/ngắn (chưa cần grow).
 * Root (Mother) và Child GIỐNG HỆT nhau về size/font/config — chỉ khác màu
 * (root nền solid chữ trắng, child nền trắng viền màu chữ đen).
 */
export const DEFAULT_LINES = 2;

export const FONT_SIZE = 14;
export const LINE_HEIGHT = 1.35;

/** Padding ngang trong box (px) — sát chữ, không dư 2 bên */
export const BOX_PAD_X = 8;
/** Padding dọc trong box (px, top+bottom cộng lại) */
export const BOX_PAD_Y = 16;

/** Bề rộng box — CỐ ĐỊNH (root = child), chỉ chiều CAO mới grow theo nội dung */
export const BOX_W = 259; // 4/5 của 324 cũ

/** Chiều cao box lúc rỗng/ngắn (world px) — grow thêm khi nội dung dài hơn. */
export function defaultBoxHeight(): number {
  return Math.ceil(FONT_SIZE * LINE_HEIGHT * DEFAULT_LINES + BOX_PAD_Y);
}

/** Horizontal/vertical gap between siblings at level 1 */
export const BASE_GAP = 120;

/** Gap shrinks ~18% each deeper level */
export const GAP_DECAY = 0.82;

/** 6 màu (bỏ chàm #6366F1) */
export const BRANCH_COLORS: BranchColor[] = [
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#3B82F6",
  "#A855F7",
];

export const ROOT_COLOR = "#111111" as const;

export const SIDEBAR_W = 225; // 3/4 của 300 cũ

export const MAX_UNDO = 10;

export const STORAGE_KEY = "vietmindmap:v1";

/** Viền box + line nhánh — cùng một độ dày (world @ zoom 100%) */
export const STROKE_WIDTH = 3;
export const STROKE_WIDTH_SELECTED = 4;
/** @deprecated dùng STROKE_WIDTH */
export const LINE_WIDTH = STROKE_WIDTH;

/** Bo góc box @ zoom 100% — phải scale theo zoom, không dùng rem cố định */
export const BOX_RADIUS = 12;

/** Export margin = 1/7 of mindmap bounds */
export const EXPORT_MARGIN_RATIO = 1 / 7;
export const EXPORT_MIN_LONG_EDGE = 2048;
export const EXPORT_PIXEL_RATIO = 3;
