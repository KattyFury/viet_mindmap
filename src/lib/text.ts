/**
 * Không còn giới hạn theo số ký tự/dòng — wrap là việc của CSS (width thật
 * của box quyết định chỗ xuống dòng). Ở đây chỉ còn xử lý newline TƯỜNG MINH
 * (Ctrl+Enter) và cap số lượng newline theo maxLines cho phép.
 */

/** Cap số newline tường minh ≤ (maxLines - 1); newline dư bị làm phẳng thành space. */
export function capExplicitBreaks(raw: string, maxLines: number): string {
  const s = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const parts = s.split("\n");
  const keep = maxLines - 1;
  if (parts.length <= keep + 1) return s;

  const head = parts.slice(0, keep);
  const rest = parts.slice(keep).join(" ");
  return [...head, rest].join("\n");
}

export function canInsertNewline(text: string, maxLines: number): boolean {
  const breaks = text.match(/\n/g)?.length ?? 0;
  return breaks < maxLines - 1;
}

/**
 * Ước lượng số dòng ban đầu (trước khi đo DOM thật) từ số newline tường minh.
 * Chỉ dùng cho lần render đầu — sau đó component tự đo scrollHeight để
 * chỉnh chính xác (auto-wrap theo width không thể biết trước nếu chỉ đếm ký tự).
 */
export function estimateLineCount(text: string, maxLines: number): number {
  const breaks = text.match(/\n/g)?.length ?? 0;
  return Math.min(breaks + 1, maxLines);
}
