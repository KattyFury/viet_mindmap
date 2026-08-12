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

## 1. Trạng thái tính năng (đã chốt, cập nhật 2026-08-12 cuối ngày)

- **Layout:** root đen giữa (hoặc màu custom — mục 3b), child trắng viền màu, chỉ nhánh **trái/phải** (không trên/dưới); line thẳng dưới box, dig vào mép; ẩn line khi kéo child.
- **Không chồng lấn:** `reflowAll` bottom-up theo chiều cao cả subtree (`src/lib/layout.ts`); mọi commit text/add/xóa/kéo/hydrate đều reflow lại từ root.
- **Phím tắt:** Tab = tạo child của node đang chọn (không phải sibling từ mother) · Enter = commit · Ctrl+Enter = xuống dòng (không giới hạn số lần) · Delete = xóa child+subtree kể cả đang type (không xóa root) · Ctrl+Z/Y = undo/redo · cuộn = zoom.
- **Export:** PNG full map qua `html-to-image` (`src/lib/export-png.ts`) — render thẳng từ DOM đang hiển thị, không có pipeline canvas riêng.
- **Text trong box (BẢN CUỐI — xem mục 3):** KHÔNG giới hạn số dòng lẫn ký tự — box GROW theo nội dung. Mặc định lúc rỗng/ngắn: root 1 dòng/200px, child 2 dòng/324px (bề rộng cố định, chỉ cao grow). Cả root và child đều **center** (left-align đã bị thử và bác bỏ — đừng đề xuất lại).
- **Màu (mục 3b):** 2 chế độ CHUNG TOÀN APP — rainbow (6 màu/nhánh, mặc định) hoặc custom (1 màu cho mọi box+line+nền root).
- **Sidebar (mục 3c):** tối giản — mỗi map = tên + nút X (confirm xóa) + kéo-thả reorder; nút + cuối list tạo map mới; rộng 225px. Không còn ô tài khoản/thùng rác kéo-thả.

---

## 2. Phiên 2026-08-12 (đầu ngày) — đại tu cơ chế text lần 1: char-count → CSS wrap + max-lines

> ⚠️ **Mục này đã bị THAY THẾ bởi mục 3 (cùng ngày, sau đó)** — `ROOT_MAX_LINES`/`CHILD_MAX_LINES` không còn tồn tại, box giờ KHÔNG có trần, chỉ có size mặc định. Giữ lại mục này vì 2 gotcha kỹ thuật bên dưới (scrollHeight bị sàn, break-spaces vs pre-wrap) **vẫn còn áp dụng nguyên trong kiến trúc mới**. Đọc mục 3 để biết trạng thái CUỐI.

**Yêu cầu ban đầu:** child left-align (trước đó center làm chữ xuống dòng lệch trái-phải nhìn như hình tam giác) + bỏ giới hạn ký tự cứng, thay bằng "box hết chỗ thì hết gõ" + root chỉ 2 dòng (trước đó root/child đều chung 1 số).

**Kiến trúc cũ (đã bỏ hẳn):** đếm ký tự, tự chèn `\n` vào đúng chỗ theo giả định độ rộng ký tự cố định (`CHILD_CHARS_PER_LINE=30`, `ROOT_CHARS_PER_LINE=20`) — đây chính là nguồn gốc hình tam giác (độ rộng ký tự thật không đều nhau).

**Kiến trúc mới:**
- **Wrap = CSS**, không phải JS đếm ký tự. `whiteSpace: break-spaces` (⚠️ KHÔNG phải `pre-wrap` — xem gotcha bên dưới) + `wordBreak: keep-all` + `overflowWrap: break-word` → browser tự xuống dòng theo width thật của box, chỉ hard-cut khi 1 từ dài hơn cả dòng.
- **"Đầy" = đo `scrollHeight` thật** của textarea, so với `maxLines * linePx`. Vượt → revert DOM value ngay trong `onChange` (trước khi paint, không giật hình), không cho gõ thêm. Hàm đo: `measureLinesAtCurrentValue()` trong `MindNodeBox.tsx`.
- `ROOT_MAX_LINES=2`, `CHILD_MAX_LINES=3` (`src/lib/constants.ts`) — tách riêng thay vì 1 `MAX_LINES` chung.
- `src/lib/text.ts` rút gọn còn 3 hàm: `capExplicitBreaks` (an toàn cho data cũ có thể dư newline), `canInsertNewline`, `estimateLineCount` (ước lượng lần render đầu, trước khi đo DOM thật).
- Text align: ban đầu làm **root = center, child = left** (`textAlign` theo `isRoot`) — nhưng user không thích, đổi lại **cả 2 đều center** ngay trong cùng phiên (xem mục 2b).

**2 bug tự bắt được trong lúc làm (đáng nhớ nếu sửa lại):**
1. **`scrollHeight` bị "sàn" bởi height cố định của box.** Đo thẳng `el.scrollHeight` khi box có `height: h` (CSS cố định) luôn ≥ `h` bất kể nội dung ít hay nhiều → tưởng lúc nào cũng đầy. Fix: tạm set `height/maxHeight: auto/none` + `paddingTop: 0` ngay trước khi đo, đo xong restore lại — đúng kỹ thuật autosize-textarea chuẩn.
2. **`white-space: pre-wrap` cho space cuối dòng "hang" ra ngoài** (không tính vào `scrollHeight`) → gõ dấu cách liên tục lúc box đã đầy vẫn lọt qua **vô hạn** (test thực tế ra tới 18 space thừa). Fix: đổi sang `white-space: break-spaces` — spec này KHÔNG cho phép space cuối dòng "hang", nó chiếm chỗ và force wrap như ký tự thường.

**Verify đã làm** (không có browser-automation tool sẵn trong môi trường → tự cài Playwright vào scratchpad, không đụng project): tạo mindmap thật, gõ text dài (EN + VN), Ctrl+Enter 2 lần rồi thử lần 3 (phải bị chặn vì child max 3 dòng = tối đa 2 lần ngắt), paste đoạn dài (phải tự trim theo chiều cao), root gõ tràn (phải dừng ở 2 dòng) — tất cả đúng, 0 lỗi console. `tsc --noEmit` / `next build` / `eslint` đều sạch (lint giữ nguyên baseline lỗi có sẵn từ trước khi đụng vào, không phát sinh thêm).

**Nếu cần sửa tiếp text/wrap sau này:** đọc `CLAUDE.md` §5 mục "Text in boxes" trước (đã cập nhật khớp code), đừng quay lại kiểu đếm ký tự.

### 2b. Revert cùng ngày: child left-align → center lại

User dùng thử xong không thích left-align child ("tao ko thích căn trái child nữa, căn giữa đi") → đổi `textAlign` của child từ `"left"` về `"center"` (2 chỗ trong `MindNodeBox.tsx`: style edit + style hiển thị). Đây là bài học nhỏ: **left-align đã bị thử và bác bỏ** — đừng đề xuất lại trừ khi user chủ động yêu cầu. (Phần còn lại của mục 2 sau đó bị mục 3 thay thế toàn bộ.)

---

## 3. Phiên 2026-08-12 (cuối ngày) — đại tu lần 2: bỏ HẲN max-lines, box GROW tự do + sidebar/màu

User phản hồi max-lines vẫn chưa đúng ý ("khoan, tôi sai rồi... một child box có kích thước mặc định chứa được 2 line chữ NHƯNG có thể mở rộng ra bao nhiêu line tùy thích, các child box không nằm đè nên nhau được"). Sau vài câu hỏi làm rõ: root cũng auto-grow (không riêng child), custom color đổi cả nền root, rainbow giữ 6 màu (không phải 7), setting màu chung toàn app.

### 3a. Kiến trúc box GROW (thay thế hoàn toàn mục 2)

- **Không còn `MAX_LINES` nào** (`ROOT_MAX_LINES`/`CHILD_MAX_LINES` đã xoá). Thay bằng `ROOT_DEFAULT_LINES=1`, `CHILD_DEFAULT_LINES=2` (`constants.ts`, hàm `defaultBoxHeight(isRoot)`) — chỉ là size SÀN lúc rỗng/ngắn.
- **Bề rộng cố định theo loại node** (user cho số cụ thể): Root `ROOT_BOX_W=200`, Child `BOX_W=324`. Chiều CAO mới là thứ grow.
- **`MindNode` có field mới `h?: number`** (world px, không nhân scale) — chiều cao đo được lần commit gần nhất. `undefined` → dùng `defaultBoxHeight()`. `layout.ts`'s `nodeBoxSize()` đọc field này thay vì hằng số cố định — nên MỌI hàm layout (subtreeBounds, reflow, lineEndpoints, boundsOfNodes) tự động support chiều cao động, không cần sửa gì thêm ngoài `nodeBoxSize`.
- **Không đè nhau khi box grow:** `updateText(id, text, h)` giờ LUÔN `reflowAll` sau khi set `h` mới (trước đây `updateText` không đụng layout, vì box size cố định nên không cần). Trong lúc đang GÕ (chưa commit — blur/Enter), box tự lớn lên "live" tại chỗ (không reflow cả cây, chấp nhận tạm đè lên hàng xóm lúc đang gõ — ổn định lại ngay khi commit). Đây là quyết định pragmatic, không phải bug.
- **Đo chiều cao = đo DOM thật**, không suy ra từ ký tự. Editing: `measureAndApplyTextareaBox()` trong `MindNodeBox.tsx` — tạm bỏ `height`/`padding` (set `auto`/`0`) trước khi đọc `scrollHeight`, vì có set sẵn thì `scrollHeight` bị "sàn" ở giá trị đó, không bao giờ báo NHỎ hơn (đúng gotcha đã ghi ở mục 2, vẫn còn nguyên trong kiến trúc mới). Không-edit (hiển thị): đo `span.offsetHeight` để "tự chữa" data cũ/lệch (map cũ chưa có field `h` → tự đo & ghi lại lần đầu render).
- **Canh giữa dọc = chia đều phần dư top/bottom**, KHÔNG cố định `BOX_PAD_Y/2` mỗi bên — vì box có thể đang ở mức SÀN default (rỗng/ngắn) trong khi content thật ngắn hơn, dư ra bao nhiêu phải chia đều 2 bên chứ không dồn hết lên trên.
- ⚠️ **Bug đã gặp + fix (đáng nhớ):** `<textarea>` KHÔNG có `rows` tường minh → browser mặc định cao tối thiểu **2 dòng**, làm `scrollHeight` đo sai ngay cả khi ĐÃ tạm bỏ height/padding (vì đó là intrinsic sizing của thẻ, không phải CSS height) → root (default 1 dòng) bị đo ra ~2 dòng → caret bị đẩy lệch hẳn lên trên thay vì nằm giữa box. Fix: luôn set `rows={1}` trên `<textarea>`, để JS tự quyết định height hoàn toàn.
- **Ctrl+Enter không còn giới hạn số lần** (trước đây cap ở `maxLines-1`). `text.ts` giờ chỉ còn 3 hàm nhỏ an toàn cho data cũ (`capExplicitBreaks`, `canInsertNewline`, `estimateLineCount`) — không xử lý wrap gì cả.

### 3b. Màu — 2 chế độ, chung toàn app

- **Rainbow** (mặc định, không đổi so với trước): 6 màu `BRANCH_COLORS` luân phiên theo nhánh — **đã hỏi lại user có muốn 7 màu (thêm chàm) không, câu trả lời là "nhầm, 6 màu"** — đừng tự ý thêm màu thứ 7 sau này.
- **Custom color:** đúng 1 màu cho MỌI box (viền), MỌI line, VÀ **nền root** (đã hỏi rõ — user xác nhận root cũng đổi nền, không giữ đen cố định ở chế độ này). Chữ trong root tự chọn đen/trắng theo độ sáng (`contrastText()` — công thức relative luminance chuẩn WCAG — trong `colors.ts`), tránh chữ trắng-trên-vàng không đọc được.
- State: `useMindmapStore` (`colorMode`, `customColor`, `setColorMode`, `setCustomColor`) — **KHÔNG nằm trong `MindMapDoc`**, load/save riêng qua `color-settings.ts` (`localStorage` key `vietmindmap:colormode:v1`, không theo `userKey`) vì user xác nhận muốn **chung toàn app**, không theo từng mindmap.
- UI: `ColorModeMenu.tsx` — nút swatch góc trên-phải canvas (cạnh Center/Download), popover 2 lựa chọn + color picker (`<input type="color">`) + 6 swatch preset khi ở custom mode.

### 3c. Sidebar tối giản

User gửi ảnh chê rối: ô tài khoản (email/sign-in), ô "Kéo map vào để xóa", nhãn "Các mindmap" — **"xóa hết các yếu tố này đi"**. Yêu cầu cụ thể: mỗi mindmap chỉ cần nút X để xóa (không cần kéo-thả vào thùng rác), layout `[tên — X]` nhiều hàng + `[+]` cuối cùng. Sidebar giảm còn **3/4 bề rộng cũ** (`SIDEBAR_W`: 300 → 225).

- Đã bỏ hẳn: ô email/sign-in (props `email`/`authEnabled` của `Sidebar` vẫn giữ nguyên chữ ký — cần cho `userKey` ở `AppShell.tsx` — nhưng không còn render UI, đổi tên `_email`/`_authEnabled` theo convention prop-giữ-cho-sau đã có sẵn với `_name`), ô trash-drop kéo-thả, nhãn "Các mindmap".
- Xóa map giờ qua nút X (icon mới `IconClose` trong `icons.tsx`) → mở `ConfirmDialog` có sẵn (không đổi component đó). Kéo-thả để REORDER map trong list vẫn giữ nguyên — chỉ đổi cách XÓA.
- Nút tạo map mới = icon `+` (không chữ), thay cho nút text "Tạo mindmap mới" dài trước đây.

### 3d. Nghiên cứu tham khảo

User trỏ `github.com/topics/mindmap` bảo "tìm tòi rồi làm 1 cái mindmap chất lượng". Đã ghé nhanh (WebFetch, không clone code): Mermaid/Markmap (text→diagram, khác kiến trúc), SimpleMindMap/Mind Elixir/Drawnix (interactive editor, gần giống app này hơn). Xác nhận qua Mind Elixir: pattern "palette màu cho rainbow + CSS-variable/1-màu cho theme custom" là chuẩn phổ biến trong nhóm mindmap tool — khớp hướng đã tự thiết kế ở mục 3b, không có gì phải đổi hướng.

### 3e. Verify đã làm

Không có browser-automation tool sẵn trong môi trường → tự cài Playwright vào scratchpad (`npm i playwright` ngoài project, không đụng `package.json`). Test thực tế: tạo map → gõ dài → box grow, xóa chữ → box co lại; 3 child cạnh nhau độ dài khác nhau → không đè (đo `getBoundingClientRect` từng cặp, verify không giao nhau); Ctrl+Enter 4-5 lần liên tiếp không bị chặn; kéo-thả relocate child vẫn hoạt động với box cao động; đổi rainbow↔custom, chọn màu vàng cho root → chữ tự đổi đen; xóa map qua X → confirm dialog → xóa đúng map; caret canh giữa đúng cho cả root rỗng (1 dòng) và child rỗng (2 dòng mặc định). Tất cả pass, 0 lỗi console. `tsc --noEmit` / `next build` / `eslint` sạch — lint giữ nguyên baseline 5 lỗi có sẵn từ trước (đã verify bằng `git stash` so sánh), warnings +2 (do 2 prop `_email`/`_authEnabled` mới không dùng, theo đúng convention `_name` có sẵn).

---

## 4. File chính

| Path | Vai trò |
|------|---------|
| `src/lib/layout.ts` | reflow, line endpoints, gap, subtree height — `nodeBoxSize()` đọc `node.h` thật |
| `src/lib/text.ts` | cap newline tường minh (data cũ) — KHÔNG còn xử lý wrap |
| `src/lib/constants.ts` | mọi số đo (box size, default lines, gap, màu…), `defaultBoxHeight()` |
| `src/lib/colors.ts` | `pickBranchColor`, `contrastText` (auto đen/trắng theo độ sáng nền) |
| `src/lib/color-settings.ts` | load/save chế độ màu — `localStorage`, chung toàn app |
| `src/store/mindmap-store.ts` | maps, add/delete/`updateText(id,text,h)`, hydrate+reflowAll, `colorMode`/`customColor` |
| `src/components/MindMapCanvas.tsx` | phím tắt global, pan/zoom, canvas, toolbar (Center/Download/ColorModeMenu) |
| `src/components/MindNodeBox.tsx` | edit box, đo `scrollHeight` để box grow + canh giữa dọc, Tab/Delete khi type, [+] |
| `src/components/ColorModeMenu.tsx` | UI chọn rainbow/custom + color picker |
| `src/components/Sidebar.tsx` | list map tối giản (tên + X + reorder kéo-thả), nút + tạo map |
| `src/lib/export-png.ts` | export PNG qua `html-to-image` |

---

## 5. Việc chưa làm / để dành

- Auth Google + sync đa máy qua Supabase — hạ tầng có sẵn (schema JSON tree), **chưa gắn** (xem README mục "Auth Google").
- Chưa có test tự động (không có thư mục test) — verify UI hiện tại là tay/Playwright ad-hoc ngoài repo.
