import {
  BASE_GAP,
  BOX_H,
  BOX_W,
  GAP_DECAY,
  ROOT_BOX_H,
  ROOT_BOX_W,
} from "./constants";
import type { Direction, MindNode } from "./types";

/**
 * Khoảng hở mép parent → mép child (không liên quan độ dài line).
 */
export const EDGE_GAP = 100;
export const EDGE_GAP_VERTICAL = 140;

/** Hở mép giữa 2 sibling (cộng thêm vào size box khi xếp) */
export const SIBLING_EDGE_GAP = 72;

/** Dig tối thiểu trên màn hình (px) — zoom nhỏ vẫn dính */
const MIN_SCREEN_DIG = 3;

export function isRootNode(node: MindNode): boolean {
  return node.parentId === null || node.level === 0;
}

export function nodeBoxSize(node: MindNode): { w: number; h: number } {
  if (isRootNode(node)) return { w: ROOT_BOX_W, h: ROOT_BOX_H };
  return { w: BOX_W, h: BOX_H };
}

/**
 * Khoảng cách TÂM–TÂM giữa siblings cùng hướng.
 * - Trên/dưới: xếp ngang → phải ≥ BOX_W + hở (trước dùng BASE_GAP=120 < BOX_W → chồng box)
 * - Trái/phải: xếp dọc → ≥ BOX_H + hở
 */
export function siblingCenterGap(
  direction: Direction,
  level: number
): number {
  const decay = Math.pow(GAP_DECAY, Math.max(0, level - 1));
  if (direction === "up" || direction === "down") {
    return (BOX_W + SIBLING_EDGE_GAP) * decay;
  }
  return (BOX_H + SIBLING_EDGE_GAP) * decay;
}

/** @deprecated dùng siblingCenterGap */
export function gapForLevel(level: number): number {
  return BASE_GAP * Math.pow(GAP_DECAY, Math.max(0, level - 1));
}

export function branchOffset(
  direction: Direction,
  parent: MindNode,
  level: number
) {
  const p = nodeBoxSize(parent);
  const c = { w: BOX_W, h: BOX_H };
  const decay = Math.pow(GAP_DECAY, Math.max(0, level - 1));
  const gapH = EDGE_GAP * decay;
  const gapV = EDGE_GAP_VERTICAL * decay;
  const dx = p.w / 2 + c.w / 2 + gapH;
  const dy = p.h / 2 + c.h / 2 + gapV;

  switch (direction) {
    case "up":
      return { x: 0, y: -dy };
    case "down":
      return { x: 0, y: dy };
    case "left":
      return { x: -dx, y: 0 };
    case "right":
      return { x: dx, y: 0 };
  }
}

export function opposite(dir: Direction): Direction {
  switch (dir) {
    case "up":
      return "down";
    case "down":
      return "up";
    case "left":
      return "right";
    case "right":
      return "left";
  }
}

export function childrenOf(
  nodes: Record<string, MindNode>,
  parentId: string,
  direction?: Direction
): MindNode[] {
  return Object.values(nodes)
    .filter(
      (n) =>
        n.parentId === parentId &&
        (direction === undefined || n.direction === direction)
    )
    .sort((a, b) => {
      const ao = a.siblingOrder ?? 0;
      const bo = b.siblingOrder ?? 0;
      if (ao !== bo) return ao - bo;
      if (direction === "left" || direction === "right") return a.y - b.y;
      return a.x - b.x;
    });
}

export function reflowSiblings(
  nodes: Record<string, MindNode>,
  parentId: string,
  direction: Direction
): Record<string, MindNode> {
  const parent = nodes[parentId];
  if (!parent) return nodes;

  const siblings = childrenOf(nodes, parentId, direction);
  if (siblings.length === 0) return nodes;

  const level = siblings[0].level;
  const gap = siblingCenterGap(direction, level);
  const off = branchOffset(direction, parent, level);
  const next = { ...nodes };
  const n = siblings.length;

  siblings.forEach((sib, i) => {
    const t = i - (n - 1) / 2;
    let x = parent.x + off.x;
    let y = parent.y + off.y;

    if (direction === "left" || direction === "right") {
      // Xếp dọc
      y = parent.y + t * gap;
    } else {
      // up/down: xếp ngang — gap ≥ bề ngang box
      x = parent.x + t * gap;
    }

    next[sib.id] = { ...sib, x, y, siblingOrder: i };
  });

  return next;
}

/** Chỉ trái/phải (đã bỏ trên/dưới). */
export function directionFromDelta(dx: number, _dy: number): Direction {
  return dx >= 0 ? "right" : "left";
}

/** Hướng được phép tạo nhánh */
export const BRANCH_DIRECTIONS: Direction[] = ["left", "right"];

/**
 * Kéo child tới (worldX, worldY): đổi bên (trái↔phải…) + reorder sibling, reflow.
 */
export function relocateChild(
  nodes: Record<string, MindNode>,
  id: string,
  worldX: number,
  worldY: number
): Record<string, MindNode> {
  const node = nodes[id];
  if (!node?.parentId) return nodes;
  const parent = nodes[node.parentId];
  if (!parent) return nodes;

  const oldDir = node.direction;
  const newDir = directionFromDelta(worldX - parent.x, worldY - parent.y);

  let next: Record<string, MindNode> = {
    ...nodes,
    [id]: { ...node, direction: newDir, x: worldX, y: worldY },
  };

  // Sắp siblingOrder theo trục vuông góc (kéo qua sibling = đổi thứ tự)
  const side = Object.values(next).filter(
    (n) => n.parentId === parent.id && n.direction === newDir
  );
  side.sort((a, b) => {
    if (newDir === "left" || newDir === "right") return a.y - b.y;
    return a.x - b.x;
  });
  side.forEach((sib, i) => {
    next[sib.id] = { ...next[sib.id], siblingOrder: i };
  });

  if (oldDir && oldDir !== newDir) {
    const oldSide = Object.values(next)
      .filter((n) => n.parentId === parent.id && n.direction === oldDir)
      .sort((a, b) => (a.siblingOrder ?? 0) - (b.siblingOrder ?? 0));
    oldSide.forEach((sib, i) => {
      next[sib.id] = { ...next[sib.id], siblingOrder: i };
    });
    next = reflowSiblings(next, parent.id, oldDir);
  }

  next = reflowSiblings(next, parent.id, newDir);
  next = reflowDescendants(next, id);
  return next;
}

function reflowDescendants(
  nodes: Record<string, MindNode>,
  rootId: string
): Record<string, MindNode> {
  let next = nodes;
  for (const dir of BRANCH_DIRECTIONS) {
    const kids = childrenOf(next, rootId, dir);
    if (kids.length === 0) continue;
    next = reflowSiblings(next, rootId, dir);
    for (const k of kids) {
      next = reflowDescendants(next, k.id);
    }
  }
  return next;
}

export function placeNewChild(
  nodes: Record<string, MindNode>,
  parentId: string,
  direction: Direction,
  childId: string,
  color: MindNode["color"],
  text = ""
): Record<string, MindNode> {
  const parent = nodes[parentId];
  if (!parent) return nodes;

  const level = parent.level + 1;
  const off = branchOffset(direction, parent, level);
  const existing = childrenOf(nodes, parentId, direction);
  const siblingOrder = existing.length;

  const child: MindNode = {
    id: childId,
    text,
    x: parent.x + off.x,
    y: parent.y + off.y,
    color,
    parentId,
    direction,
    level,
    siblingOrder,
  };

  let next: Record<string, MindNode> = {
    ...nodes,
    [childId]: child,
  };

  next = reflowSiblings(next, parentId, direction);
  return next;
}

/**
 * Line thẳng (không chữ L).
 * Chỉ còn trái/phải — neo giữa mép parent → giữa cạnh gần child + dig.
 */
export function lineEndpoints(
  parent: MindNode,
  child: MindNode,
  viewScale = 1,
  _nodes?: Record<string, MindNode>
): { x1: number; y1: number; x2: number; y2: number } {
  // up/down đã tắt UI — map cũ: treat như left/right theo vị trí
  let dir = child.direction ?? "right";
  if (dir === "up" || dir === "down") {
    dir = child.x >= parent.x ? "right" : "left";
  }

  const p = nodeBoxSize(parent);
  const c = nodeBoxSize(child);
  const phW = p.w / 2;
  const chW = c.w / 2;
  const s = Math.max(viewScale, 0.01);

  const dig = Math.min(
    Math.max(3, MIN_SCREEN_DIG / s),
    Math.min(phW, chW) * 0.25
  );

  if (dir === "left") {
    return {
      x1: parent.x - phW + dig,
      y1: parent.y,
      x2: child.x + chW - dig,
      y2: child.y,
    };
  }
  return {
    x1: parent.x + phW - dig,
    y1: parent.y,
    x2: child.x - chW + dig,
    y2: child.y,
  };
}

export function boundsOfNodes(nodes: MindNode[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (nodes.length === 0) {
    return {
      minX: 0,
      minY: 0,
      maxX: BOX_W,
      maxY: BOX_H,
      width: BOX_W,
      height: BOX_H,
    };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of nodes) {
    const { w, h } = nodeBoxSize(n);
    minX = Math.min(minX, n.x - w / 2);
    minY = Math.min(minY, n.y - h / 2);
    maxX = Math.max(maxX, n.x + w / 2);
    maxY = Math.max(maxY, n.y + h / 2);
  }
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
