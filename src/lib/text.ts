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
 * MAX_LINES dòng × maxPerLine.
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

  if (s.includes("\n")) {
    return clampWithBreaks(s, limit);
  }

  return wrapByWords(s, limit, maxTotal);
}

/** Giữ nguyên các dòng do user tự ngắt (Ctrl+Enter), reflow overflow xuống dòng sau. */
function clampWithBreaks(s: string, limit: number): string {
  const segments = splitSegments(s, MAX_LINES);

  for (let i = 0; i < segments.length - 1; i++) {
    if (segments[i].length > limit) {
      const br = breakIndex(segments[i], limit);
      const overflow = segments[i].slice(br).replace(/^\s+/, "");
      segments[i] = segments[i].slice(0, br).replace(/\s+$/, "");
      segments[i + 1] = overflow + segments[i + 1];
    }
  }

  return segments.map((seg) => seg.slice(0, limit)).join("\n");
}

/** Cắt tại ≤ (maxLines - 1) dấu \n đầu tiên; \n dư ra bị làm phẳng vào dòng cuối. */
function splitSegments(s: string, maxLines: number): string[] {
  const breaks: number[] = [];
  for (let i = 0; i < s.length && breaks.length < maxLines - 1; i++) {
    if (s[i] === "\n") breaks.push(i);
  }

  const segments: string[] = [];
  let start = 0;
  for (const i of breaks) {
    segments.push(s.slice(start, i));
    start = i + 1;
  }
  segments.push(s.slice(start).replace(/\n/g, ""));
  return segments;
}

function wrapByWords(flat: string, limit: number, maxTotal: number): string {
  const text = flat.slice(0, maxTotal);
  const segments: string[] = [];
  let remaining = text;

  for (let i = 0; i < MAX_LINES; i++) {
    const isLast = i === MAX_LINES - 1;

    if (remaining.length <= limit) {
      segments.push(remaining);
      remaining = "";
      break;
    }

    if (isLast) {
      segments.push(remaining.slice(0, limit));
      remaining = "";
      break;
    }

    const br = breakIndex(remaining, limit);
    let line = remaining.slice(0, br).replace(/\s+$/, "");
    let rest = remaining.slice(br).replace(/^\s+/, "");

    if (line.length > limit) {
      line = remaining.slice(0, limit);
      rest = remaining.slice(limit).replace(/^\s+/, "");
    }

    segments.push(line);
    remaining = rest;
  }

  while (segments.length > 1 && segments[segments.length - 1] === "") {
    segments.pop();
  }

  return segments.join("\n");
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
  const breaks = text.match(/\n/g)?.length ?? 0;
  return breaks < MAX_LINES - 1;
}

export function logicalLineCount(text: string): number {
  const breaks = text.match(/\n/g)?.length ?? 0;
  return Math.min(breaks + 1, MAX_LINES);
}

export function charsPerLineForNode(isRoot: boolean): number {
  return isRoot ? ROOT_CHARS_PER_LINE : CHILD_CHARS_PER_LINE;
}
