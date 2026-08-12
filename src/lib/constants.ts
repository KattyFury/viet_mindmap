import type { BranchColor } from "./types";

/**
 * KHÔNG giới hạn số dòng/ký tự — box GROW theo nội dung, tùy ý bao nhiêu dòng.
 * *_DEFAULT_LINES chỉ là kích thước lúc box rỗng/ngắn (chưa cần grow).
 */
export const ROOT_DEFAULT_LINES = 1;
export const CHILD_DEFAULT_LINES = 2;

export const FONT_SIZE = 14;
export const LINE_HEIGHT = 1.35;
export const ROOT_FONT_SIZE = Math.round(FONT_SIZE * 1.2); // 17 — trước 1.5x (21) nhìn quá to

/** Padding ngang trong box (px) — sát chữ, không dư 2 bên */
export const BOX_PAD_X = 8;
/** Padding dọc trong box (px, top+bottom cộng lại) */
export const BOX_PAD_Y = 16;

/** Bề rộng box — CỐ ĐỊNH, chỉ chiều CAO mới grow theo nội dung */
export const BOX_W = 324;
export const ROOT_BOX_W = 200;

/** Chiều cao box lúc rỗng/ngắn (world px) — grow thêm khi nội dung dài hơn. */
export function defaultBoxHeight(isRoot: boolean): number {
  const font = isRoot ? ROOT_FONT_SIZE : FONT_SIZE;
  const lines = isRoot ? ROOT_DEFAULT_LINES : CHILD_DEFAULT_LINES;
  return Math.ceil(font * LINE_HEIGHT * lines + BOX_PAD_Y);
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
