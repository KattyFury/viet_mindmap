/**
 * Chế độ màu — CHUNG TOÀN APP (không theo từng mindmap, không theo user).
 * rainbow: mỗi nhánh 1 màu trong BRANCH_COLORS (mặc định, như cũ).
 * custom: đúng 1 màu cho mọi box/line, kể cả nền + viền root.
 */
export type ColorMode = "rainbow" | "custom";

export interface ColorSettings {
  mode: ColorMode;
  customColor: string;
}

const KEY = "vietmindmap:colormode:v1";
export const DEFAULT_CUSTOM_COLOR = "#3B82F6";

const DEFAULTS: ColorSettings = {
  mode: "rainbow",
  customColor: DEFAULT_CUSTOM_COLOR,
};

export function loadColorSettings(): ColorSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<ColorSettings>;
    return {
      mode: parsed.mode === "custom" ? "custom" : "rainbow",
      customColor:
        typeof parsed.customColor === "string"
          ? parsed.customColor
          : DEFAULT_CUSTOM_COLOR,
    };
  } catch {
    return DEFAULTS;
  }
}

export function saveColorSettings(s: ColorSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // quota / private mode — ignore
  }
}
