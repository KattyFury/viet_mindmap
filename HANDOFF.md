# HANDOFF – VietMindmap

**Cập nhật:** 2026-08-12 · **Local:** `D:\Files\Claude\build_for_me\vietmindmap`

### 🔗 LINK CHÍNH

| | |
|---|---|
| **Demo (guest, không cần đăng nhập)** | https://kattyfury.github.io/viet_mindmap/ |
| **GitHub** | https://github.com/KattyFury/viet_mindmap |
| **Branch deploy** | `master` (push → tự deploy GitHub Pages) |

> ĐẦU MỖI PHIÊN đọc CẢ `HANDOFF.md` (file này) + `CLAUDE.md` §5 (rule khóa: text/lines/layout/phím tắt) + `AGENTS.md` (snapshot hành vi nhanh cho agent).
> Lịch sử chi tiết từng commit: `git log` (mô tả commit ghi đủ) — file này chỉ giữ TRẠNG THÁI CUỐI + bài học không hiển nhiên.
> Data: **local-first**, `localStorage` key `vietmindmap:v1:<userKey>` — KHÔNG có server DB, KHÔNG sync đa máy (Supabase để dành, chưa gắn).

---

## 0. Dự án là gì

Mindmap 1 trang, tối ưu cho tiếng Việt (wrap không cắt giữa từ), chạy hoàn toàn phía client. User dùng qua web app đã deploy — **agent sửa xong PHẢI commit + push ngay**, không hỏi lại (xem `CLAUDE.md` §5 mục Git/deploy).

**Stack:** Next.js 16 (App Router) + TypeScript + Tailwind v4 · Zustand (state, undo/redo 10 bước, auto-save localStorage) · canvas HTML+SVG thuần (không lib diagram) · NextAuth Google optional (không có env → fallback `local@vietmindmap`).

---

## 1. Trạng thái tính năng (v1, đã chốt)

- **Layout:** root đen giữa, child trắng viền màu (6 màu, bỏ chàm); chỉ nhánh **trái/phải** (không trên/dưới); line thẳng dưới box, dig vào mép; ẩn line khi kéo child.
- **Không chồng lấn:** `reflowAll` bottom-up theo chiều cao cả subtree (`src/lib/layout.ts`); mọi add/xóa/kéo/hydrate đều reflow lại từ root.
- **Phím tắt:** Tab = tạo child của node đang chọn (không phải sibling từ mother) · Enter = commit · Ctrl+Enter = xuống dòng · Delete = xóa child+subtree kể cả đang type (không xóa root) · Ctrl+Z/Y = undo/redo · cuộn = zoom.
- **Export:** PNG full map qua `html-to-image` (`src/lib/export-png.ts`) — render thẳng từ DOM đang hiển thị, không có pipeline canvas riêng.
- **Text trong box (đại tu 2026-08-12 — xem mục 2):** không giới hạn ký tự, chỉ giới hạn số dòng (root 2, child 3), root center/child left, chặn gõ khi box đầy theo chiều cao thật.

---

## 2. Phiên 2026-08-12 — đại tu cơ chế text (đáng đọc kỹ trước khi đụng `MindNodeBox.tsx`/`text.ts`)

**Yêu cầu ban đầu:** child left-align (trước đó center làm chữ xuống dòng lệch trái-phải nhìn như hình tam giác) + bỏ giới hạn ký tự cứng, thay bằng "box hết chỗ thì hết gõ" + root chỉ 2 dòng (trước đó root/child đều chung 1 số).

**Kiến trúc cũ (đã bỏ hẳn):** đếm ký tự, tự chèn `\n` vào đúng chỗ theo giả định độ rộng ký tự cố định (`CHILD_CHARS_PER_LINE=30`, `ROOT_CHARS_PER_LINE=20`) — đây chính là nguồn gốc hình tam giác (độ rộng ký tự thật không đều nhau).

**Kiến trúc mới:**
- **Wrap = CSS**, không phải JS đếm ký tự. `whiteSpace: break-spaces` (⚠️ KHÔNG phải `pre-wrap` — xem gotcha bên dưới) + `wordBreak: keep-all` + `overflowWrap: break-word` → browser tự xuống dòng theo width thật của box, chỉ hard-cut khi 1 từ dài hơn cả dòng.
- **"Đầy" = đo `scrollHeight` thật** của textarea, so với `maxLines * linePx`. Vượt → revert DOM value ngay trong `onChange` (trước khi paint, không giật hình), không cho gõ thêm. Hàm đo: `measureLinesAtCurrentValue()` trong `MindNodeBox.tsx`.
- `ROOT_MAX_LINES=2`, `CHILD_MAX_LINES=3` (`src/lib/constants.ts`) — tách riêng thay vì 1 `MAX_LINES` chung.
- `src/lib/text.ts` rút gọn còn 3 hàm: `capExplicitBreaks` (an toàn cho data cũ có thể dư newline), `canInsertNewline`, `estimateLineCount` (ước lượng lần render đầu, trước khi đo DOM thật).
- Text align: **root = center, child = left** (`textAlign` theo `isRoot`).

**2 bug tự bắt được trong lúc làm (đáng nhớ nếu sửa lại):**
1. **`scrollHeight` bị "sàn" bởi height cố định của box.** Đo thẳng `el.scrollHeight` khi box có `height: h` (CSS cố định) luôn ≥ `h` bất kể nội dung ít hay nhiều → tưởng lúc nào cũng đầy. Fix: tạm set `height/maxHeight: auto/none` + `paddingTop: 0` ngay trước khi đo, đo xong restore lại — đúng kỹ thuật autosize-textarea chuẩn.
2. **`white-space: pre-wrap` cho space cuối dòng "hang" ra ngoài** (không tính vào `scrollHeight`) → gõ dấu cách liên tục lúc box đã đầy vẫn lọt qua **vô hạn** (test thực tế ra tới 18 space thừa). Fix: đổi sang `white-space: break-spaces` — spec này KHÔNG cho phép space cuối dòng "hang", nó chiếm chỗ và force wrap như ký tự thường.

**Verify đã làm** (không có browser-automation tool sẵn trong môi trường → tự cài Playwright vào scratchpad, không đụng project): tạo mindmap thật, gõ text dài (EN + VN), Ctrl+Enter 2 lần rồi thử lần 3 (phải bị chặn vì child max 3 dòng = tối đa 2 lần ngắt), paste đoạn dài (phải tự trim theo chiều cao), root gõ tràn (phải dừng ở 2 dòng) — tất cả đúng, 0 lỗi console. `tsc --noEmit` / `next build` / `eslint` đều sạch (lint giữ nguyên baseline lỗi có sẵn từ trước khi đụng vào, không phát sinh thêm).

**Nếu cần sửa tiếp text/wrap sau này:** đọc `CLAUDE.md` §5 mục "Text in boxes" trước (đã cập nhật khớp code), đừng quay lại kiểu đếm ký tự.

---

## 3. File chính

| Path | Vai trò |
|------|---------|
| `src/lib/layout.ts` | reflow, line endpoints, gap, subtree height |
| `src/lib/text.ts` | cap newline tường minh (data cũ), canInsertNewline, estimateLineCount |
| `src/lib/constants.ts` | mọi số đo (box size, gap, max lines, màu…) |
| `src/store/mindmap-store.ts` | maps, add/delete/updateText, hydrate+reflowAll |
| `src/components/MindMapCanvas.tsx` | phím tắt global, pan/zoom, canvas |
| `src/components/MindNodeBox.tsx` | edit box, đo scrollHeight để chặn gõ khi đầy, Tab/Delete khi type, [+] |
| `src/lib/export-png.ts` | export PNG qua `html-to-image` |

---

## 4. Việc chưa làm / để dành

- Auth Google + sync đa máy qua Supabase — hạ tầng có sẵn (schema JSON tree), **chưa gắn** (xem README mục "Auth Google").
- Chưa có test tự động (không có thư mục test) — verify UI hiện tại là tay/Playwright ad-hoc ngoài repo.
