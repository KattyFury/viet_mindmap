import { ROOT_COLOR } from "./constants";
import { pickBranchColor } from "./colors";
import { slugify } from "./export-png";
import { uid } from "./id";
import { childrenOf, reflowAll } from "./layout";
import type { Direction, MindMapDoc, MindNode } from "./types";

/**
 * Xuất/nhập mindmap dạng outline text (markdown list thụt lề) — để backup,
 * chia sẻ, hoặc dựng nhanh cả cây từ 1 đoạn text dán vào.
 *
 * Format:
 *   # Tên map
 *   - Nhánh 1
 *     - Nhánh con
 *   - Nhánh 2
 *
 * 1 dòng = 1 node. Newline thủ công (Ctrl+Enter) trong 1 node KHÔNG round-trip
 * qua text — export gộp thành khoảng trắng để giữ outline 1-dòng-1-node.
 */

function toLine(text: string): string {
  return text.replace(/\s*\n\s*/g, " ").trim();
}

export function exportMindmapMarkdown(map: MindMapDoc): string {
  const root = map.nodes[map.rootId];
  const lines: string[] = [`# ${toLine(root?.text ?? "") || "Mindmap"}`];

  function walk(parentId: string, level: number) {
    for (const dir of ["right", "left"] as Direction[]) {
      for (const child of childrenOf(map.nodes, parentId, dir)) {
        const indent = "  ".repeat(level - 1);
        lines.push(`${indent}- ${toLine(child.text)}`);
        walk(child.id, level + 1);
      }
    }
  }
  walk(map.rootId, 1);
  return lines.join("\n") + "\n";
}

export function downloadMarkdown(map: MindMapDoc): void {
  const md = exportMindmapMarkdown(map);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mindmap-${slugify(map.name || "ten-cua-ban")}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

interface OutlineLine {
  indent: number;
  text: string;
}

function parseOutline(raw: string): { rootText: string; lines: OutlineLine[] } {
  const rawLines = raw.replace(/\r\n/g, "\n").split("\n");
  let rootText = "";
  let sawHeading = false;
  const lines: OutlineLine[] = [];

  for (const rl of rawLines) {
    if (!rl.trim()) continue;
    if (!sawHeading && lines.length === 0) {
      const heading = rl.match(/^#{1,6}\s+(.*)$/);
      if (heading) {
        rootText = heading[1].trim();
        sawHeading = true;
        continue;
      }
    }
    const ws = rl.match(/^[ \t]*/)?.[0] ?? "";
    const indent = ws.replace(/\t/g, "  ").length;
    const text = rl
      .slice(ws.length)
      .replace(/^[-*+]\s+/, "")
      .replace(/^\d+[.)]\s+/, "")
      .trim();
    if (!text) continue;
    lines.push({ indent, text });
  }
  return { rootText, lines };
}

/**
 * Dựng cây node từ outline text. Con trực tiếp của root xen kẽ trái/phải
 * (giống thứ tự thêm nhánh thủ công); cháu kế thừa hướng của tổ tiên gần
 * nhất thuộc root (đúng ràng buộc hiện có: 1 node non-root chỉ có con CÙNG
 * hướng với chính nó).
 */
export function outlineToNodes(raw: string): {
  nodes: Record<string, MindNode>;
  rootId: string;
} {
  const { rootText, lines } = parseOutline(raw);
  const rootId = uid("root");
  const root: MindNode = {
    id: rootId,
    text: rootText,
    x: 0,
    y: 0,
    color: ROOT_COLOR,
    parentId: null,
    direction: null,
    level: 0,
    siblingOrder: 0,
  };
  let nodes: Record<string, MindNode> = { [rootId]: root };

  const stack: { indent: number; id: string; level: number }[] = [
    { indent: -1, id: rootId, level: 0 },
  ];
  let topCount = 0;

  for (const line of lines) {
    while (
      stack.length > 1 &&
      stack[stack.length - 1].indent >= line.indent
    ) {
      stack.pop();
    }
    const parent = stack[stack.length - 1];
    const parentNode = nodes[parent.id];
    const direction: Direction =
      parent.id === rootId
        ? topCount++ % 2 === 0
          ? "right"
          : "left"
        : parentNode.direction ?? "right";

    const siblings = childrenOf(nodes, parent.id, direction);
    const color = pickBranchColor(siblings);
    const id = uid("n");
    const node: MindNode = {
      id,
      text: line.text,
      x: parentNode.x,
      y: parentNode.y,
      color,
      parentId: parent.id,
      direction,
      level: parent.level + 1,
      siblingOrder: siblings.length,
    };
    nodes = { ...nodes, [id]: node };
    stack.push({ indent: line.indent, id, level: parent.level + 1 });
  }

  nodes = reflowAll(nodes, rootId);
  return { nodes, rootId };
}
