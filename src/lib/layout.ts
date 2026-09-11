import { BASE_GAP, BOX_W, GAP_DECAY, defaultBoxHeight } from "./constants";
import type { Direction, MindNode } from "./types";

/**
 * Khoảng hở mép parent → mép child (không liên quan độ dài line).
 * Dùng chung 1 công thức (× decay theo level) cho MỌI cặp parent-child —
 * mother→child hay child→child (cháu) đều đồng bộ, chỉ khác độ sâu.
 */
export const EDGE_GAP = 80; // bội số 8
export const EDGE_GAP_VERTICAL = 144; // bội số 8, gần nhất với 140 cũ

/** Hở mép giữa 2 sibling / 2 subtree kề nhau (cộng thêm vào size khi xếp) */
export const SIBLING_EDGE_GAP = 32; // bội số 8, gần nhất với 36 cũ

/** Dig tối thiểu trên màn hình (px) — zoom nhỏ vẫn dính */
const MIN_SCREEN_DIG = 3;

export function isRootNode(node: MindNode): boolean {
  return node.parentId === null || node.level === 0;
}

/** Box GROW theo nội dung — root/child cùng size, h lấy từ node.h đo được (fallback default). */
export function nodeBoxSize(node: MindNode): { w: number; h: number } {
  return { w: BOX_W, h: node.h ?? defaultBoxHeight() };
}

/**
 * Khoảng cách TÂM–TÂM giữa siblings cùng hướng (leaf, không tính subtree).
 * - Trên/dưới: xếp ngang → phải ≥ BOX_W + hở (trước dùng BASE_GAP=120 < BOX_W → chồng box)
 * - Trái/phải: xếp dọc → ≥ defaultBoxHeight + hở (hàm này không dùng height thật per-node,
 *   chỉ 1 ước lượng chung — spacing thật giữa sibling nằm ở reflowSiblings/subtreeBounds).
 */
export function siblingCenterGap(
  direction: Direction,
  level: number
): number {
  const decay = Math.pow(GAP_DECAY, Math.max(0, level - 1));
  if (direction === "up" || direction === "down") {
    return (BOX_W + SIBLING_EDGE_GAP) * decay;
  }
  return (defaultBoxHeight() + SIBLING_EDGE_GAP) * decay;
}

/** @deprecated dùng siblingCenterGap */
export function gapForLevel(level: number): number {
  return BASE_GAP * Math.pow(GAP_DECAY, Math.max(0, level - 1));
}

/** Hở mép giữa hai subtree kề nhau (cùng parent + hướng) */
function siblingEdgeGap(level: number): number {
  const decay = Math.pow(GAP_DECAY, Math.max(0, level - 1));
  // Sàn tối thiểu để deep level không bị dính box
  return Math.max(24, SIBLING_EDGE_GAP * decay);
}

/**
 * Độ vươn (trước/sau tâm) của TỪNG absolute level trong 1 subtree, đo theo
 * trục vuông góc với hướng nhánh (Y cho trái/phải, X cho trên/dưới).
 *
 * Vì branchOffset() chỉ phụ thuộc level + hướng (không phụ thuộc node cha cụ
 * thể nào), MỌI node cùng absolute level + cùng hướng đều nằm cùng 1 dải toạ
 * độ dọc trục nhánh — chỉ những level TRÙNG NHAU giữa 2 subtree mới có nguy
 * cơ chồng lấn thật sự. Dùng profile theo level (thay vì gộp cả subtree
 * thành 1 khoảng before/after) để 1 nhánh có nhiều cháu ở level sâu không
 * kéo lệch nhánh anh em không hề có gì ở level đó.
 */
function subtreeLevelProfile(
  nodes: Record<string, MindNode>,
  rootId: string,
  axis: "x" | "y"
): Map<number, { before: number; after: number }> {
  const root = nodes[rootId];
  const profile = new Map<number, { before: number; after: number }>();
  for (const id of collectSubtreeIds(nodes, rootId)) {
    const n = nodes[id];
    const { w, h } = nodeBoxSize(n);
    const half = axis === "y" ? h / 2 : w / 2;
    const center = axis === "y" ? n.y : n.x;
    const rootCenter = axis === "y" ? root.y : root.x;
    const before = rootCenter - (center - half);
    const after = center + half - rootCenter;
    const cur = profile.get(n.level);
    profile.set(n.level, {
      before: Math.max(cur?.before ?? -Infinity, before),
      after: Math.max(cur?.after ?? -Infinity, after),
    });
  }
  return profile;
}

/**
 * Khoảng cách tâm–tâm tối thiểu giữa 2 subtree kề nhau (A trước, B sau) để
 * KHÔNG chồng lấn thật sự — chỉ xét các level TRÙNG NHAU giữa 2 profile
 * (xem subtreeLevelProfile), mỗi level trùng dùng đúng gap đã decay của
 * chính level đó.
 */
function requiredCenterGap(
  profileA: Map<number, { before: number; after: number }>,
  profileB: Map<number, { before: number; after: number }>
): number {
  let gap = 0;
  for (const [level, a] of profileA) {
    const b = profileB.get(level);
    if (!b) continue;
    gap = Math.max(gap, a.after + siblingEdgeGap(level) + b.before);
  }
  return gap;
}

export function branchOffset(
  direction: Direction,
  parent: MindNode,
  level: number
) {
  const p = nodeBoxSize(parent);
  const c = { w: BOX_W, h: defaultBoxHeight() };
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

/** Toàn bộ id trong subtree (gồm root). */
export function collectSubtreeIds(
  nodes: Record<string, MindNode>,
  rootId: string
): string[] {
  const out: string[] = [];
  const stack = [rootId];
  const seen = new Set<string>();
  while (stack.length) {
    const cur = stack.pop()!;
    if (seen.has(cur) || !nodes[cur]) continue;
    seen.add(cur);
    out.push(cur);
    for (const n of Object.values(nodes)) {
      if (n.parentId === cur) stack.push(n.id);
    }
  }
  return out;
}

/** Bounds mép ngoài của cả subtree (world coords). */
export function subtreeBounds(
  nodes: Record<string, MindNode>,
  rootId: string
): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const id of collectSubtreeIds(nodes, rootId)) {
    const n = nodes[id];
    const { w, h } = nodeBoxSize(n);
    minX = Math.min(minX, n.x - w / 2);
    minY = Math.min(minY, n.y - h / 2);
    maxX = Math.max(maxX, n.x + w / 2);
    maxY = Math.max(maxY, n.y + h / 2);
  }
  if (!Number.isFinite(minX)) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  return { minX, minY, maxX, maxY };
}

/** Dời cả subtree (giữ cấu trúc tương đối). */
export function shiftSubtree(
  nodes: Record<string, MindNode>,
  rootId: string,
  dx: number,
  dy: number
): Record<string, MindNode> {
  if (dx === 0 && dy === 0) return nodes;
  const next = { ...nodes };
  for (const id of collectSubtreeIds(nodes, rootId)) {
    const n = next[id];
    next[id] = { ...n, x: n.x + dx, y: n.y + dy };
  }
  return next;
}

function findRootId(nodes: Record<string, MindNode>): string | null {
  for (const n of Object.values(nodes)) {
    if (n.parentId === null) return n.id;
  }
  return null;
}

/**
 * Reflow toàn bộ cây từ root — bottom-up theo chiều cao subtree.
 * Rule: box/subtree **không được chồng lấn**; sibling cách nhau ≥ siblingEdgeGap.
 * Stack canh giữa parent; nhánh phía trên bị đẩy lên, phía dưới đẩy xuống.
 */
export function reflowAll(
  nodes: Record<string, MindNode>,
  rootId?: string
): Record<string, MindNode> {
  const rid = rootId ?? findRootId(nodes);
  if (!rid || !nodes[rid]) return nodes;
  return reflowDescendants(nodes, rid);
}

/**
 * Xếp sibling cùng parent+hướng theo **chiều cao cả subtree** (không chỉ 1 box).
 * Gọi sau khi descendant của từng sibling đã reflow (bottom-up).
 */
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
  const off = branchOffset(direction, parent, level);
  let next = { ...nodes };
  const n = siblings.length;
  const axis: "x" | "y" = direction === "left" || direction === "right" ? "y" : "x";

  // Profile theo level (không phải cả subtree gộp 1 khoảng) — 1 nhánh nhiều
  // cháu ở level sâu không được phép kéo lệch nhánh anh em không có gì ở đó.
  const profiles = siblings.map((sib) =>
    subtreeLevelProfile(next, sib.id, axis)
  );
  // Độ vươn CỦA RIÊNG box sibling (không tính cháu) — dùng để canh giữa cả
  // cụm theo parent, để hàng con trực tiếp luôn đối xứng quanh parent bất kể
  // cháu bên trong bung ra bao xa.
  const ownHalf = siblings.map((sib) => {
    const { w, h } = nodeBoxSize(next[sib.id]);
    return (axis === "y" ? h : w) / 2;
  });

  // Tọa độ tâm tạm (trục xếp), origin = 0 cho sibling đầu
  const centers: number[] = new Array(n);
  centers[0] = 0;
  for (let i = 1; i < n; i++) {
    centers[i] = centers[i - 1] + requiredCenterGap(profiles[i - 1], profiles[i]);
  }

  // Canh giữa cụm theo parent, dựa trên box RIÊNG của sibling đầu/cuối (không
  // phải mép subtree) — nhánh nhiều cháu vẫn tự bung cân đối quanh vị trí nó
  // được xếp, mà không kéo anh em bên cạnh đi xa theo.
  const stackMin = centers[0] - ownHalf[0];
  const stackMax = centers[n - 1] + ownHalf[n - 1];
  const stackMid = (stackMin + stackMax) / 2;

  if (direction === "left" || direction === "right") {
    const origin = parent.y - stackMid;
    for (let i = 0; i < n; i++) {
      const sib = next[siblings[i].id];
      const targetX = parent.x + off.x;
      const targetY = centers[i] + origin;
      next = shiftSubtree(next, sib.id, targetX - sib.x, targetY - sib.y);
      next[sib.id] = { ...next[sib.id], siblingOrder: i };
    }
  } else {
    const origin = parent.x - stackMid;
    for (let i = 0; i < n; i++) {
      const sib = next[siblings[i].id];
      const targetX = centers[i] + origin;
      const targetY = parent.y + off.y;
      next = shiftSubtree(next, sib.id, targetX - sib.x, targetY - sib.y);
      next[sib.id] = { ...next[sib.id], siblingOrder: i };
    }
  }

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
  }

  // Reflow cả cây: subtree spacing + không chồng chéo giữa các nhánh
  next = reflowAll(next);
  return next;
}

/**
 * Bottom-up: reflow descendant trước, rồi xếp sibling theo chiều cao subtree.
 * → nhánh dày (nhiều cháu) đẩy các dự án phía trên lên / phía dưới xuống, không lấn.
 */
function reflowDescendants(
  nodes: Record<string, MindNode>,
  rootId: string
): Record<string, MindNode> {
  let next = nodes;
  for (const dir of BRANCH_DIRECTIONS) {
    const kids = childrenOf(next, rootId, dir);
    if (kids.length === 0) continue;
    for (const k of kids) {
      next = reflowDescendants(next, k.id);
    }
    next = reflowSiblings(next, rootId, dir);
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

  // Cả cây: parent/anh em nhánh khác cũng nhường chỗ theo subtree
  next = reflowAll(next);
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
    const h = defaultBoxHeight();
    return { minX: 0, minY: 0, maxX: BOX_W, maxY: h, width: BOX_W, height: h };
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
