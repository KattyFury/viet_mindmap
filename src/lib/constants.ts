import type { BranchColor } from "./types";

export const MAX_LINES = 2;

/** Nhánh: 30 ký tự/hàng · Gốc: 20 ký tự/hàng */
export const CHILD_CHARS_PER_LINE = 30;
export const ROOT_CHARS_PER_LINE = 20;

/** @deprecated dùng CHILD_CHARS_PER_LINE */
export const MAX_CHARS_PER_LINE = CHILD_CHARS_PER_LINE;

export const FONT_SIZE = 14;
export const LINE_HEIGHT = 1.35;
export const ROOT_FONT_SIZE = Math.round(FONT_SIZE * 1.5); // 21

/** Padding ngang trong box (px) — sát chữ, không dư 2 bên */
export const BOX_PAD_X = 8;

/** Child: 30 ký tự · Root: 20 ký tự — rộng vừa khít nội dung */
export const BOX_W = CHILD_CHARS_PER_LINE * 9 + BOX_PAD_X * 2; // ~286
export const BOX_H = Math.ceil(FONT_SIZE * LINE_HEIGHT * 2 + 16);
/** Root: 20 ký tự @ font lớn */
export const ROOT_BOX_W = ROOT_CHARS_PER_LINE * 11 + BOX_PAD_X * 2; // ~236
export const ROOT_BOX_H = Math.ceil(ROOT_FONT_SIZE * LINE_HEIGHT * 2 + 18);

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

export const SIDEBAR_W = 300;

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
