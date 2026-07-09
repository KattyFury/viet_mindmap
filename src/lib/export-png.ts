import { toPng } from "html-to-image";
import {
  EXPORT_MARGIN_RATIO,
  EXPORT_MIN_LONG_EDGE,
  EXPORT_PIXEL_RATIO,
} from "./constants";
import { boundsOfNodes } from "./layout";
import type { MindNode } from "./types";

function slugify(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "ten-cua-ban"
  );
}

/**
 * @param viewScale scale đang render DOM (toạ độ/size đã * scale)
 */
export async function exportMindmapPng(
  worldEl: HTMLElement,
  nodes: MindNode[],
  mapName: string,
  viewScale = 1
): Promise<void> {
  const b = boundsOfNodes(nodes);
  const s = viewScale || 1;
  const margin = Math.max(b.width, b.height) * EXPORT_MARGIN_RATIO * s;
  const width = b.width * s + margin * 2;
  const height = b.height * s + margin * 2;

  const long = Math.max(width, height);
  const pixelRatio = Math.max(EXPORT_PIXEL_RATIO, EXPORT_MIN_LONG_EDGE / long);

  const prevTransform = worldEl.style.transform;

  // DOM đã ở viewScale — chỉ pan về góc export
  worldEl.style.transform = `translate(${-b.minX * s + margin}px, ${-b.minY * s + margin}px)`;

  try {
    const dataUrl = await toPng(worldEl, {
      backgroundColor: "#FFFFFF",
      width,
      height,
      style: {
        width: `${width}px`,
        height: `${height}px`,
      },
      pixelRatio,
      cacheBust: true,
    });

    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `mindmap-${slugify(mapName)}.png`;
    a.click();
  } finally {
    worldEl.style.transform = prevTransform;
  }
}
