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

/**
 * Sibling kế trước/sau (cùng parent + hướng), theo `siblingOrder` — dùng cho
 * điều hướng phím mũi tên lên/xuống. null nếu ở đầu/cuối danh sách hoặc
 * node không có parent (root).
 */
export function siblingNeighbor(
  nodes: Record<string, MindNode>,
  id: string,
  delta: 1 | -1
): string | null {
  const node = nodes[id];
  if (!node?.parentId || !node.direction) return null;
  const sibs = childrenOf(nodes, node.parentId, node.direction);
  const i = sibs.findIndex((s) => s.id === id);
  if (i === -1) return null;
  return sibs[i + delta]?.id ?? null;
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

/**
 * Giống `collectSubtreeIds` nhưng DỪNG xuống con của 1 node đang `collapsed`
 * (vẫn gồm chính node đó, chỉ không xuống con/cháu nó). Dùng cho layout (tính
 * chỗ) và canvas (chọn node để render) — subtree đang ẩn thì không cần tính
 * chỗ cho nó, và không được phép chọn/hiện.
 */
export function visibleSubtreeIds(
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
    if (nodes[cur].collapsed) continue;
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
 * Reflow — fork thuật toán mindmap layout của simple-mind-map
 * (wanglin2/mind-map, MIT, `src/layouts/MindMap.js` — computedBaseValue /
 * computedTopValue / adjustTopValue), viết lại cho model toạ độ world x/y
 * (record bất biến) thay vì đo DOM. Thay hẳn cách tiếp cận "contour" cũ (so
 * độ vươn TOÀN subtree, gây lệch nặng khi 1 sibling to đứng cạnh sibling nhỏ
 * — xem CLAUDE.md §5 / feedback 2026-09-18).
 *
 * 3 bước:
 * 1. `computeAreaHeights` (bottom-up): với mỗi node, tổng chiều cao "vùng con"
 *    mỗi hướng = tổng chiều cao RIÊNG (không tính cháu) của các con trực tiếp
 *    + gap giữa chúng.
 * 2. `positionChildrenNaive` (top-down): xếp con quanh tâm Y của cha, dùng
 *    ĐÚNG areaHeight ở bước 1 (chỉ biết con trực tiếp, chưa biết cháu) — cho
 *    ra vị trí "ngây thơ" đối xứng quanh cha, giống hệt cách người dùng kỳ
 *    vọng (VD 3 con: 1 trên tâm cha, 1 tại tâm, 1 dưới tâm — không lệch).
 * 3. `fixOverflow` (top-down): với mỗi node, nếu vùng con nó cần (bước 1)
 *    RỘNG hơn "chỗ" nó có giữa các anh em của chính nó (tức box riêng + gap),
 *    đẩy CÁC ANH EM của nó ra xa thêm (nửa phần dư mỗi bên: anh trước lùi
 *    lên, em sau lùi xuống) — rồi lan truyền tiếp lên đúng 1 nấc (đẩy anh em
 *    của CHA nó bằng đúng lượng đó). Đây là điểm khác biệt cốt lõi so với
 *    thuật toán cũ: CHỈ node nào thực sự "quá tải" mới kéo hàng xóm ra xa —
 *    KHÔNG dồn tích luỹ một chiều qua toàn bộ chuỗi sibling.
 */

type AreaMap = Map<string, { left: number; right: number }>;

/** BRANCH_DIRECTIONS chỉ chứa "left"/"right" nhưng khai báo kiểu Direction
 *  (rộng hơn, còn "up"/"down" legacy) — helper này thu hẹp lại để index AreaMap. */
function areaFor(areas: AreaMap, id: string, dir: Direction): number {
  const key = dir === "left" ? "left" : "right";
  return areas.get(id)?.[key] ?? 0;
}

/** Bước 1: tổng chiều cao con trực tiếp (không tính cháu) mỗi hướng, + gap. */
function computeAreaHeights(
  nodes: Record<string, MindNode>,
  rootId: string
): AreaMap {
  const areas: AreaMap = new Map();
  // reverse(visibleSubtreeIds) = post-order hợp lệ (con luôn tính trước cha)
  // — xem chứng minh trong PR: đảo ngược pre-order của 1 cây cho post-order.
  const order = [...visibleSubtreeIds(nodes, rootId)].reverse();
  for (const id of order) {
    const node = nodes[id];
    const level = node.level + 1;
    const gap = siblingEdgeGap(level);
    let left = 0;
    let right = 0;
    if (!node.collapsed) {
      const leftKids = childrenOf(nodes, id, "left");
      const rightKids = childrenOf(nodes, id, "right");
      if (leftKids.length) {
        left =
          leftKids.reduce((sum, k) => sum + nodeBoxSize(k).h, 0) +
          (leftKids.length + 1) * gap;
      }
      if (rightKids.length) {
        right =
          rightKids.reduce((sum, k) => sum + nodeBoxSize(k).h, 0) +
          (rightKids.length + 1) * gap;
      }
    }
    areas.set(id, { left, right });
  }
  return areas;
}

/** Bước 2: xếp con quanh tâm Y của cha, chỉ dựa trên chiều cao RIÊNG của con. */
function positionChildrenNaive(
  nodes: Record<string, MindNode>,
  rootId: string,
  areas: AreaMap
): Record<string, MindNode> {
  const next: Record<string, MindNode> = { ...nodes };
  for (const id of visibleSubtreeIds(next, rootId)) {
    const node = next[id];
    if (node.collapsed) continue;
    for (const dir of BRANCH_DIRECTIONS) {
      const kids = childrenOf(next, id, dir);
      if (kids.length === 0) continue;
      const level = node.level + 1;
      const gap = siblingEdgeGap(level);
      const off = branchOffset(dir, node, level);
      const total = areaFor(areas, id, dir);
      let runningTop = node.y - total / 2 + gap;
      for (const kid of kids) {
        const h = nodeBoxSize(next[kid.id]).h;
        next[kid.id] = {
          ...next[kid.id],
          x: node.x + off.x,
          y: runningTop + h / 2,
        };
        runningTop += h + gap;
      }
    }
  }
  return next;
}

/**
 * Đẩy các anh em CÙNG hướng của `id` (dưới cùng 1 cha) ra xa thêm
 * `halfExcess` mỗi bên (trước lùi lên, sau lùi xuống — cả subtree dời theo
 * cứng, giữ cấu trúc trong), rồi lan truyền đúng lượng đó lên 1 nấc (anh em
 * của CHA `id`). Dừng khi tới root (không còn parent).
 */
function pushSiblingsAndAncestors(
  nodes: Record<string, MindNode>,
  id: string,
  halfExcess: number
): Record<string, MindNode> {
  const node = nodes[id];
  if (!node?.parentId || !node.direction) return nodes;
  const siblings = childrenOf(nodes, node.parentId, node.direction);
  const idx = siblings.findIndex((s) => s.id === id);
  let next = nodes;
  siblings.forEach((sib, i) => {
    if (i === idx) return;
    const offset = i < idx ? -halfExcess : halfExcess;
    next = shiftSubtree(next, sib.id, 0, offset);
  });
  return pushSiblingsAndAncestors(next, node.parentId, halfExcess);
}

/** Bước 3: node nào có vùng con vượt quá "chỗ" nó có giữa các anh em → đẩy hàng xóm ra xa. */
function fixOverflow(
  nodes: Record<string, MindNode>,
  rootId: string,
  areas: AreaMap
): Record<string, MindNode> {
  let next = nodes;
  for (const id of visibleSubtreeIds(next, rootId)) {
    const node = next[id];
    const level = node.level + 1;
    const gap = siblingEdgeGap(level);
    const ownH = nodeBoxSize(node).h;
    const slot = ownH + 2 * gap;
    for (const dir of BRANCH_DIRECTIONS) {
      if (childrenOf(next, id, dir).length === 0) continue;
      const need = areaFor(areas, id, dir);
      const excess = need - slot;
      if (excess > 0) {
        next = pushSiblingsAndAncestors(next, id, excess / 2);
      }
    }
  }
  return next;
}

/**
 * Reflow toàn bộ cây từ root. Rule: box/subtree **không được chồng lấn**;
 * sibling cách nhau ≥ siblingEdgeGap. Xem block comment phía trên cho 3 bước.
 */
export function reflowAll(
  nodes: Record<string, MindNode>,
  rootId?: string
): Record<string, MindNode> {
  const rid = rootId ?? findRootId(nodes);
  if (!rid || !nodes[rid]) return nodes;
  const areas = computeAreaHeights(nodes, rid);
  let next = positionChildrenNaive(nodes, rid, areas);
  next = fixOverflow(next, rid, areas);
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
 * Line thẳng (không chữ L) — nối TÂM box mother/child (không phải biên).
 * Đoạn nằm trong box tự bị box (z-index cao hơn, nền đặc) che khuất, nên
 * hiệu ứng nhìn vẫn là "cắm vào cạnh", chỉ khác điểm neo TOÁN HỌC là tâm.
 */
export function lineEndpoints(
  parent: MindNode,
  child: MindNode
): { x1: number; y1: number; x2: number; y2: number } {
  // up/down đã tắt UI — map cũ: treat như left/right theo vị trí
  let dir = child.direction ?? "right";
  if (dir === "up" || dir === "down") {
    dir = child.x >= parent.x ? "right" : "left";
  }

  const chW = nodeBoxSize(child).w / 2;

  // Line xuất phát từ TÂM mother (parent.x/y nguyên, không lùi ra mép), kết
  // thúc ở BIÊN child (đúng mép ngoài chW) — không phải ngược lại.
  if (dir === "left") {
    return { x1: parent.x, y1: parent.y, x2: child.x + chW, y2: child.y };
  }
  return { x1: parent.x, y1: parent.y, x2: child.x - chW, y2: child.y };
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
