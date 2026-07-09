import {
  CHILD_CHARS_PER_LINE,
  MAX_LINES,
  ROOT_CHARS_PER_LINE,
} from "./constants";

export function contentLength(text: string): number {
  return text.replace(/\n/g, "").length;
}

export function maxContentChars(maxPerLine: number): number {
  return maxPerLine * MAX_LINES;
}

export function isContentFull(text: string, maxPerLine: number): boolean {
  return contentLength(text) >= maxContentChars(maxPerLine);
}

/**
 * 2 dòng × maxPerLine.
 * KHÔNG cắt giữa từ — "chó" không thành "c" + "hó".
 * Chỉ cắt cứng khi 1 từ dài hơn cả 1 dòng.
 */
export function clampNodeText(
  raw: string,
  maxPerLine: number = CHILD_CHARS_PER_LINE
): string {
  const limit = maxPerLine;
  const maxTotal = limit * MAX_LINES;
  const s = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const nl = s.indexOf("\n");

  if (nl !== -1) {
    let line1 = s.slice(0, nl).replace(/\n/g, "");
    let line2 = s.slice(nl + 1).replace(/\n/g, "");

    if (line1.length > limit) {
      const br = breakIndex(line1, limit);
      line2 = line1.slice(br).replace(/^\s+/, "") + line2;
      line1 = line1.slice(0, br).replace(/\s+$/, "");
    }

    line1 = line1.slice(0, limit);
    line2 = line2.slice(0, limit);

    if (line2.length === 0) return `${line1}\n`;
    return `${line1}\n${line2}`;
  }

  return wrapByWords(s.replace(/\n/g, ""), limit, maxTotal);
}

function wrapByWords(flat: string, limit: number, maxTotal: number): string {
  const text = flat.slice(0, maxTotal);
  if (text.length <= limit) return text;

  const br = breakIndex(text, limit);
  let line1 = text.slice(0, br).replace(/\s+$/, "");
  let line2 = text.slice(br).replace(/^\s+/, "").slice(0, limit);

  if (line1.length > limit) {
    line1 = line1.slice(0, limit);
    line2 = text.slice(limit).replace(/^\s+/, "").slice(0, limit);
  }

  if (line2.length === 0) return line1;
  return `${line1}\n${line2}`;
}

/**
 * Chỗ ngắt ≤ limit:
 * 1) Space cuối trong (0..limit] → ngắt sau space
 * 2) Không space nhưng từ đang bị xẻ và bắt đầu sau 0 → ngắt trước từ (cả từ xuống dòng 2)
 * 3) 1 từ dài hơn limit → cắt cứng tại limit
 */
function breakIndex(text: string, limit: number): number {
  if (text.length <= limit) return text.length;

  // 1) space
  for (let i = limit; i >= 1; i--) {
    if (text[i - 1] === " " || text[i - 1] === "\t") return i;
  }

  // 2) đang xẻ từ — lùi về đầu từ
  let start = limit;
  while (start > 0 && text[start - 1] !== " " && text[start - 1] !== "\t") {
    start--;
  }
  if (start > 0) return start;

  // 3) từ dài hơn cả dòng
  return limit;
}

export function acceptInput(
  prev: string,
  next: string,
  maxPerLine: number
): string {
  const max = maxContentChars(maxPerLine);
  const prevLen = contentLength(prev);
  const nextLen = contentLength(next);

  // Đủ 60/40 → không nhận thêm
  if (prevLen >= max && nextLen > prevLen) {
    return prev;
  }

  const result = clampNodeText(next, maxPerLine);

  if (contentLength(result) > max) {
    return wrapByWords(
      next.replace(/\n/g, "").slice(0, max),
      maxPerLine,
      max
    );
  }

  // Full + reflow đổi chuỗi → giữ prev (ổn định)
  if (
    prevLen >= max &&
    contentLength(result) >= max &&
    result !== prev &&
    nextLen >= prevLen
  ) {
    return prev;
  }

  return result;
}

export function canInsertNewline(text: string): boolean {
  return !text.includes("\n");
}

export function logicalLineCount(text: string): 1 | 2 {
  return text.includes("\n") ? 2 : 1;
}

export function charsPerLineForNode(isRoot: boolean): number {
  return isRoot ? ROOT_CHARS_PER_LINE : CHILD_CHARS_PER_LINE;
}
