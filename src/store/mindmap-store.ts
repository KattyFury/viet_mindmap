"use client";

import { create } from "zustand";
import { pickBranchColor } from "@/lib/colors";
import {
  CHILD_CHARS_PER_LINE,
  MAX_UNDO,
  ROOT_CHARS_PER_LINE,
  ROOT_COLOR,
} from "@/lib/constants";
import { uid } from "@/lib/id";
import {
  childrenOf,
  placeNewChild,
  reflowSiblings,
  relocateChild,
} from "@/lib/layout";
import { loadState, saveState } from "@/lib/storage";
import { clampNodeText } from "@/lib/text";
import type { Direction, MindMapDoc, MindNode } from "@/lib/types";

type Snapshot = {
  maps: MindMapDoc[];
  activeMapId: string | null;
};

interface MindmapState {
  userKey: string | null;
  maps: MindMapDoc[];
  activeMapId: string | null;
  selectedId: string | null;
  /** Node id cần auto-open edit (sau create map / add nhánh) */
  pendingEditId: string | null;
  past: Snapshot[];
  future: Snapshot[];
  hydrated: boolean;

  hydrate: (userKey: string) => void;
  setSelected: (id: string | null) => void;
  clearPendingEdit: () => void;

  createMap: () => void;
  selectMap: (id: string) => void;
  reorderMaps: (fromIndex: number, toIndex: number) => void;
  deleteMap: (id: string) => void;

  addChild: (parentId: string, direction: Direction) => void;
  updateText: (id: string, text: string) => void;
  /** Kéo child: đổi bên / reorder, rồi snap reflow */
  relocateChildDrag: (id: string, worldX: number, worldY: number) => void;
  deleteSubtree: (id: string) => void;
  clearText: (id: string) => void;

  undo: () => void;
  redo: () => void;

  getActiveMap: () => MindMapDoc | null;
}

function emptyRootMap(order: number): MindMapDoc {
  const rootId = uid("root");
  const now = Date.now();
  const root: MindNode = {
    id: rootId,
    text: "",
    x: 0,
    y: 0,
    color: ROOT_COLOR,
    parentId: null,
    direction: null,
    level: 0,
    siblingOrder: 0,
  };
  return {
    id: uid("map"),
    name: "",
    nodes: { [rootId]: root },
    rootId,
    order,
    createdAt: now,
    updatedAt: now,
  };
}

function cloneMaps(maps: MindMapDoc[]): MindMapDoc[] {
  return JSON.parse(JSON.stringify(maps)) as MindMapDoc[];
}

function collectSubtree(
  nodes: Record<string, MindNode>,
  id: string
): Set<string> {
  const out = new Set<string>();
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop()!;
    if (out.has(cur)) continue;
    out.add(cur);
    for (const n of Object.values(nodes)) {
      if (n.parentId === cur) stack.push(n.id);
    }
  }
  return out;
}

function persist(get: () => MindmapState) {
  const s = get();
  if (!s.userKey) return;
  saveState({
    userKey: s.userKey,
    maps: s.maps,
    activeMapId: s.activeMapId,
  });
}

function pushHistory(set: (fn: (s: MindmapState) => Partial<MindmapState>) => void, get: () => MindmapState) {
  const s = get();
  const snap: Snapshot = {
    maps: cloneMaps(s.maps),
    activeMapId: s.activeMapId,
  };
  set(() => ({
    past: [...s.past.slice(-(MAX_UNDO - 1)), snap],
    future: [],
  }));
}

function updateActiveMap(
  maps: MindMapDoc[],
  activeMapId: string | null,
  fn: (map: MindMapDoc) => MindMapDoc
): MindMapDoc[] {
  if (!activeMapId) return maps;
  return maps.map((m) => (m.id === activeMapId ? fn(m) : m));
}

export const useMindmapStore = create<MindmapState>((set, get) => ({
  userKey: null,
  maps: [],
  activeMapId: null,
  selectedId: null,
  pendingEditId: null,
  past: [],
  future: [],
  hydrated: false,

  hydrate: (userKey) => {
    const saved = loadState(userKey);
    if (saved) {
      // Map cũ có up/down → chuyển sang left/right + reflow
      const maps = (saved.maps ?? []).map((map) => {
        let nodes = { ...map.nodes };
        let dirty = false;
        for (const n of Object.values(nodes)) {
          if (n.direction !== "up" && n.direction !== "down") continue;
          const parent = n.parentId ? nodes[n.parentId] : null;
          const dir =
            parent && n.x < parent.x ? ("left" as const) : ("right" as const);
          nodes[n.id] = { ...n, direction: dir };
          dirty = true;
        }
        if (!dirty) return map;
        const parents = new Set(
          Object.values(nodes)
            .map((n) => n.parentId)
            .filter(Boolean) as string[]
        );
        for (const pid of parents) {
          nodes = reflowSiblings(nodes, pid, "left");
          nodes = reflowSiblings(nodes, pid, "right");
        }
        return { ...map, nodes, updatedAt: Date.now() };
      });
      const activeMapId =
        maps.find((m) => m.id === saved.activeMapId)?.id ??
        maps[0]?.id ??
        null;
      set({
        userKey,
        maps,
        activeMapId,
        selectedId: null,
        pendingEditId: null,
        past: [],
        future: [],
        hydrated: true,
      });
      persist(get);
      return;
    }
    // Lần đầu: list rỗng — chỉ hiện nút "Tạo mindmap mới"
    set({
      userKey,
      maps: [],
      activeMapId: null,
      selectedId: null,
      pendingEditId: null,
      past: [],
      future: [],
      hydrated: true,
    });
    persist(get);
  },

  setSelected: (id) => set({ selectedId: id }),

  clearPendingEdit: () => set({ pendingEditId: null }),

  createMap: () => {
    pushHistory(set, get);
    const maps = get().maps;
    const map = emptyRootMap(maps.length);
    set({
      maps: [...maps, map],
      activeMapId: map.id,
      selectedId: map.rootId,
      pendingEditId: map.rootId,
    });
    persist(get);
  },

  selectMap: (id) => {
    const map = get().maps.find((m) => m.id === id);
    if (!map) return;
    set({ activeMapId: id, selectedId: map.rootId });
  },

  reorderMaps: (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    pushHistory(set, get);
    const maps = [...get().maps].sort((a, b) => a.order - b.order);
    const [item] = maps.splice(fromIndex, 1);
    maps.splice(toIndex, 0, item);
    const reordered = maps.map((m, i) => ({ ...m, order: i }));
    set({ maps: reordered });
    persist(get);
  },

  deleteMap: (id) => {
    pushHistory(set, get);
    const maps = get()
      .maps.filter((m) => m.id !== id)
      .map((m, i) => ({ ...m, order: i }));
    const wasActive = get().activeMapId === id;
    const activeMapId = wasActive ? maps[0]?.id ?? null : get().activeMapId;
    set({
      maps,
      activeMapId,
      selectedId: null,
    });
    persist(get);
  },

  addChild: (parentId, direction) => {
    const map = get().getActiveMap();
    if (!map) return;
    // Chỉ trái/phải
    const dir =
      direction === "left" || direction === "right" ? direction : "right";
    pushHistory(set, get);
    const siblings = childrenOf(map.nodes, parentId, dir);
    const color = pickBranchColor(siblings);
    const childId = uid("n");
    const nodes = placeNewChild(map.nodes, parentId, dir, childId, color);
    set({
      maps: updateActiveMap(get().maps, get().activeMapId, (m) => ({
        ...m,
        nodes,
        updatedAt: Date.now(),
      })),
      selectedId: childId,
      pendingEditId: childId,
    });
    persist(get);
  },

  updateText: (id, text) => {
    const map = get().getActiveMap();
    if (!map || !map.nodes[id]) return;
    const isRootNode = id === map.rootId;
    const safe = clampNodeText(
      text,
      isRootNode ? ROOT_CHARS_PER_LINE : CHILD_CHARS_PER_LINE
    );
    const nodes = {
      ...map.nodes,
      [id]: { ...map.nodes[id], text: safe },
    };
    set({
      maps: updateActiveMap(get().maps, get().activeMapId, (m) => ({
        ...m,
        nodes,
        name: isRootNode ? safe.trim() : m.name,
        updatedAt: Date.now(),
      })),
    });
    persist(get);
  },

  relocateChildDrag: (id, worldX, worldY) => {
    const map = get().getActiveMap();
    if (!map || !map.nodes[id] || id === map.rootId) return;
    pushHistory(set, get);
    const nodes = relocateChild(map.nodes, id, worldX, worldY);
    set({
      maps: updateActiveMap(get().maps, get().activeMapId, (m) => ({
        ...m,
        nodes,
        updatedAt: Date.now(),
      })),
      selectedId: id,
    });
    persist(get);
  },

  deleteSubtree: (id) => {
    const map = get().getActiveMap();
    if (!map || id === map.rootId) return;
    pushHistory(set, get);
    const target = map.nodes[id];
    const parentId = target?.parentId;
    const direction = target?.direction;
    const kill = collectSubtree(map.nodes, id);
    let nodes = { ...map.nodes };
    for (const k of kill) delete nodes[k];
    if (parentId && direction) {
      nodes = reflowSiblings(nodes, parentId, direction);
    }
    set({
      maps: updateActiveMap(get().maps, get().activeMapId, (m) => ({
        ...m,
        nodes,
        updatedAt: Date.now(),
      })),
      selectedId: null,
    });
    persist(get);
  },

  clearText: (id) => {
    const map = get().getActiveMap();
    if (!map || !map.nodes[id]) return;
    pushHistory(set, get);
    get().updateText(id, "");
  },

  undo: () => {
    const { past, maps, activeMapId, future } = get();
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    set({
      past: past.slice(0, -1),
      future: [{ maps: cloneMaps(maps), activeMapId }, ...future].slice(
        0,
        MAX_UNDO
      ),
      maps: prev.maps,
      activeMapId: prev.activeMapId,
      selectedId: null,
    });
    persist(get);
  },

  redo: () => {
    const { past, maps, activeMapId, future } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({
      future: future.slice(1),
      past: [...past, { maps: cloneMaps(maps), activeMapId }].slice(-MAX_UNDO),
      maps: next.maps,
      activeMapId: next.activeMapId,
      selectedId: null,
    });
    persist(get);
  },

  getActiveMap: () => {
    const { maps, activeMapId } = get();
    return maps.find((m) => m.id === activeMapId) ?? null;
  },
}));
