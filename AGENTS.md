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
- Text: KHÔNG giới hạn số dòng/ký tự — box GROW theo nội dung (root mặc định 1 dòng/200px, child 2 dòng/324px, bề rộng cố định); cả root và child đều căn giữa; mỗi commit đo chiều cao thật (`scrollHeight`, phải tạm bỏ height/padding trước khi đo) rồi `reflowAll`; wrap theo từ; Enter = xong; Ctrl+Enter = xuống dòng (không giới hạn số lần); `<textarea>` PHẢI có `rows={1}` (thiếu → browser mặc định 2 dòng, sai phép đo root).
- Line thẳng, dưới box, dig vào mép; ẩn line khi kéo child.
- Màu: 2 chế độ CHUNG TOÀN APP (không theo mindmap) — rainbow (6 màu/nhánh, mặc định) hoặc custom (1 màu cho mọi box+line+nền root). State ở `useMindmapStore` (`colorMode`/`customColor`), persist `localStorage` riêng (`color-settings.ts`), UI ở `ColorModeMenu.tsx`.
- Sidebar: không có ô tài khoản/thùng rác kéo-thả nữa — mỗi map = tên + nút X (confirm dialog xóa), nút + cuối list tạo map mới, rộng `SIDEBAR_W=225`.

## File chính
| Path | Vai trò |
|------|---------|
| `src/lib/layout.ts` | reflow, line, gap, subtree, `nodeBoxSize` đọc `node.h` thật |
| `src/lib/text.ts` | cap số newline tường minh (an toàn data cũ) — KHÔNG còn xử lý char-wrap |
| `src/lib/color-settings.ts` | load/save chế độ màu (localStorage, chung toàn app) |
| `src/store/mindmap-store.ts` | maps, add/delete, hydrate+reflowAll, `updateText(id,text,h)` |
| `src/components/MindMapCanvas.tsx` | phím tắt global, canvas, toolbar (Center/Download/ColorModeMenu) |
| `src/components/MindNodeBox.tsx` | edit, Tab/Delete khi type, [+], đo `scrollHeight` để box grow + canh giữa dọc |
| `src/components/ColorModeMenu.tsx` | UI chọn rainbow/custom + color picker |
| `src/components/Sidebar.tsx` | list map tối giản (tên + X + reorder kéo-thả), nút + tạo map |
