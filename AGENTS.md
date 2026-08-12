<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# VietMindmap — agent notes

## Deploy / workflow
- User dùng **web app**: https://kattyfury.github.io/viet_mindmap/
- Sau **mỗi** task sửa code: **`git commit` + `git push` ngay** — không để chỉ local, không hỏi “có push không?”.
- Data user: `localStorage` (`vietmindmap:v1:<userKey>`) — map guest, không server DB.

## Rule khóa
Đọc **`CLAUDE.md` §5** trước khi đụng text / line / layout / phím tắt.

## Snapshot hành vi (đừng “đoán lại”)
- Nhánh chỉ **trái / phải**.
- Layout: **không chồng lấn** — `reflowAll` theo **chiều cao subtree**; sibling gap `SIBLING_EDGE_GAP=36`, sàn 24.
- **Tab** = child của node đang chọn (cùng hướng), **không** sibling từ mother.
- **Delete** = xóa child + subtree **cả khi đang type**; root không xóa.
- Text: KHÔNG giới hạn ký tự/dòng — chỉ giới hạn số dòng (root 2, child 3); root center, child left; chặn gõ khi đo chiều cao thật (scrollHeight) vượt giới hạn, không đếm ký tự; wrap theo từ; Enter = xong; Ctrl+Enter = xuống dòng.
- Line thẳng, dưới box, dig vào mép; ẩn line khi kéo child.

## File chính
| Path | Vai trò |
|------|---------|
| `src/lib/layout.ts` | reflow, line, gap, subtree |
| `src/lib/text.ts` | cap số newline tường minh (an toàn data cũ), canInsertNewline |
| `src/store/mindmap-store.ts` | maps, add/delete, hydrate+reflowAll |
| `src/components/MindMapCanvas.tsx` | phím tắt global, canvas |
| `src/components/MindNodeBox.tsx` | edit, Tab/Delete khi type, [+], đo scrollHeight để chặn gõ khi đầy |
