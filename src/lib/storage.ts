import { STORAGE_KEY } from "./constants";
import type { MindMapDoc } from "./types";

export interface PersistedState {
  maps: MindMapDoc[];
  activeMapId: string | null;
  userKey: string;
}

export function loadState(userKey: string): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}:${userKey}`);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

export function saveState(state: PersistedState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `${STORAGE_KEY}:${state.userKey}`,
      JSON.stringify(state)
    );
  } catch {
    // quota / private mode — ignore
  }
}
