# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## 5. VietMindmap — LOCKED RULES (do not “reinterpret”)

These were decided after repeated user corrections. **Do not change without explicit new instruction.**

### Git / deploy (user dùng web app)
- **Mỗi lần sửa xong** → `git commit` + **`git push` ngay** lên `origin` (đừng để commit chỉ nằm local).
- Không hỏi “có push không?” — mặc định **luôn push** sau khi xong task (trừ khi user bảo giữ local).
- Lý do: user xem qua web/GitHub Pages; local-only = họ không thấy fix.

### Lưới bội số 8 (8pt grid — chốt 2026-09-11)
Mọi font size / box size / spacing trong `constants.ts` + `layout.ts` theo **bội số của 8** (đã round các số cũ về gần nhất): `FONT_SIZE=16`, `LINE_HEIGHT=1.5` (16×1.5=24, unitless nên tự scale theo zoom — KHÔNG đổi sang px cố định), `BOX_W=256` (từ 259), `SIDEBAR_W=224` (từ 225), `EDGE_GAP=80`, `EDGE_GAP_VERTICAL=144` (từ 140), `SIBLING_EDGE_GAP=32` (từ 36), sàn `siblingEdgeGap`=24. `BOX_PAD_X=8`/`BOX_PAD_Y=16` đã sẵn bội số 8. `STROKE_WIDTH`/`BOX_RADIUS` KHÔNG theo lưới này (chi tiết viền/bo góc, không phải spacing). Đổi số mới cũng phải giữ bội số 8, trừ khi user bảo khác.

### Box size — GROW theo nội dung, không còn max (đại tu 2026-08-12, xem `HANDOFF.md` mục 2+3)
- **KHÔNG giới hạn số dòng lẫn ký tự.** Box chỉ có kích thước MẶC ĐỊNH lúc rỗng/ngắn (`defaultBoxHeight()` trong `constants.ts`), gõ dài hơn thì box **cao ra tự do**, không trần.
  - **Root (Mother) và Child GIỐNG HỆT nhau** về size/font/config (đã hợp nhất 2026-08-12, sau khi từng tách riêng 200px/1 dòng cho root — user đổi ý, xem `HANDOFF.md` mục 3f): rộng cố định **256px** (`BOX_W`, bội số 8, gần nhất với 259 cũ), mặc định **2 dòng** (`DEFAULT_LINES`).
  - Bề rộng LUÔN cố định — chỉ chiều cao grow. `defaultBoxHeight()` không còn tham số `isRoot`.
  - **Khác biệt DUY NHẤT giữa root/child là MÀU:** root = nền SOLID (đen mặc định, hoặc customColor ở chế độ custom) + chữ trắng/tự-contrast; child = nền trắng + viền cùng màu với line (branch color hoặc customColor) + chữ đen. Đừng thêm bất kỳ khác biệt size/config nào khác giữa root và child.
- **Không đè nhau (LOCKED, mở rộng từ rule cũ):** vì box cao động, mỗi lần `updateText` (commit — blur/Enter) đo chiều cao thật rồi `reflowAll` lại toàn cây — nhánh khác tự nhường chỗ theo chiều cao mới. Trong lúc đang gõ (chưa commit), box tự nó lớn lên live (không reflow cây, chỉ node đang edit — chấp nhận đè tạm lúc edit, ổn định lại khi commit).
- Đo chiều cao = đo DOM thật (`scrollHeight`), KHÔNG suy ra từ số ký tự — vì `scrollHeight` bị "sàn" ở height/padding hiện tại của element (không bao giờ báo NHỎ hơn), nên đo xong phải **tạm bỏ height + padding** (set `auto`/`0`) rồi mới đọc, để box CO LẠI được khi xóa chữ. Xem `measureAndApplyTextareaBox()` trong `MindNodeBox.tsx`.
- `<textarea>` PHẢI có `rows={1}` tường minh — thiếu `rows` thì browser tự áp height mặc định (2 dòng) TRƯỚC khi JS kịp đo/set, làm sai `scrollHeight` (từng gây caret lệch lên trên khi root/child còn khác default lines; giờ vẫn giữ `rows={1}` cho chắc dù cả 2 đã cùng 2 dòng mặc định).
- Canh giữa dọc: vì box có thể cao hơn nội dung thật (đang ở mức sàn default), phần dư phải **chia đều top/bottom**, không dồn hết lên trên/dưới — đây chính là bug đã gặp (caret lệch lên) và đã sửa 2026-08-12.
- Wrap là việc của **CSS** (`whiteSpace: break-spaces`, `wordBreak: keep-all`, `overflowWrap: break-word`) theo width thật của box — KHÔNG tự chèn `\n` theo char-count.
- Dùng `break-spaces` (không phải `pre-wrap`) — nếu không, space cuối dòng bị CSS coi là "hanging" (không tính vào scrollHeight) → đo chiều cao sẽ sai/lọt.
- Text align: **cả Root và Child đều center** (đã thử left cho child 2026-08-12, user đổi ý lại center cùng ngày — đừng tự ý đổi lại left).
- Wrap **chỉ tại khoảng trắng** — never split a word mid-way (`chó` không thành `c` + `hó`); hard-cut mid-word chỉ khi 1 từ dài hơn cả 1 dòng (qua `overflowWrap: break-word`).
- Ctrl+Enter (ngắt dòng thủ công): **không giới hạn số lần** — box grow theo nếu cần.
- IME (Vietnamese): don’t clamp mid-composition (không còn giới hạn nào để clamp nữa, nhưng vẫn giữ nguyên tắc không xáo giữa chừng composition).
- **Enter** = xong type (commit). **Ctrl+Enter** (Cmd+Enter) = xuống dòng.
- `src/lib/text.ts` giờ chỉ còn `capExplicitBreaks`/`canInsertNewline`/`estimateLineCount` cho an toàn data cũ — KHÔNG còn xử lý char-wrap gì cả.

### Màu (2 chế độ — thêm 2026-08-12)
- **Rainbow (mặc định):** mỗi nhánh 1 màu trong `BRANCH_COLORS` (6 màu, đã bỏ chàm từ trước — **đừng thêm lại thành 7**, user xác nhận giữ 6 khi được hỏi).
- **Custom color:** đúng 1 màu cho MỌI box (viền), MỌI line, và **cả nền root** (root không còn luôn luôn đen ở chế độ này). Chữ trong root tự đổi đen/trắng theo độ sáng màu (`contrastText()` trong `colors.ts`) — không hardcode trắng.
- Setting này **CHUNG TOÀN APP** (không theo từng mindmap), lưu ở `localStorage` key riêng (`color-settings.ts`), KHÔNG nằm trong `MindMapDoc`.
- UI: nút "Rainbow"/"Màu riêng" góc trên-phải canvas (`ColorModeMenu.tsx`), cạnh Center/Download.

### Sidebar (tối giản 2026-08-12)
- **Không còn** ô tài khoản (email/sign-in), ô "Kéo map vào để xóa", nhãn "Các mindmap" — user chê rối, yêu cầu xóa hết.
- Mỗi mindmap trong list = tên + nút X (bấm ra `ConfirmDialog`, không cần kéo-thả vào thùng rác nữa). Nút "+" (icon, không chữ) ở cuối list để tạo map mới.
- `SIDEBAR_W = 225` (3/4 của 300px cũ) — user yêu cầu bớt rộng.
- Kéo-thả để REORDER map trong list vẫn giữ nguyên (chỉ đổi cách XÓA, không đụng reorder).

### Lines (`src/lib/layout.ts` → `lineEndpoints`)
- **Nối TÂM box → TÂM box (sửa 2026-09-18, thay bản "dig vào mép" cũ).** `lineEndpoints()` trả thẳng `{x1:parent.x, y1:parent.y, x2:child.x, y2:child.y}` — không còn tính mép/dig gì cả. Lines render **under** boxes (z-index thấp hơn) nên đoạn nằm trong box tự bị box (nền đặc) che khuất — nhìn vẫn như "cắm vào cạnh", chỉ khác điểm neo toán học.
- **Only LEFT / RIGHT branches** — no up/down create (UI + addChild).
- Straight lines (not L-paths): tâm parent → tâm child, 1 đoạn thẳng.
- While dragging a child, **hide** its line (do not leave line at old position).
- Drag relocate only chooses left vs right.

### Layout / zoom
- Sibling order = creation order (`siblingOrder`), not sort-by-x/y.
- No CSS `transform: scale` on text; scale size/font in layout.
- Border-radius **scales with zoom** (not fixed `rem`).
- **No overlap (LOCKED):** boxes / subtrees must never overlap.
- **Thuật toán sibling-spacing — FORK từ simple-mind-map (2026-09-18, THAY HẲN bản contour cũ 2026-09-11).** User feedback (kèm ảnh): 3 sibling cùng cấp (0 con / 6 con / 1 con) bị lệch nặng — sibling to kéo lệch cả cụm thay vì cân đối quanh mother, dù không hề chồng lấn thật. Nguyên nhân: thuật toán cũ (`subtreeLevelProfile` + `minCenterAgainstContour`, kiểu Reingold-Tilford/Walker "running contour") dịch RIGID cả subtree dựa trên MAX qua TẤT CẢ level sâu — 1 sibling nhỏ đứng cạnh sibling to bị kéo theo y hệt độ sâu của sibling to, dù bản thân box của nó không cần xa vậy. User yêu cầu thẳng: "fork thuật toán của người khác thay vì tự bịa" → đã fork `wanglin2/mind-map` (simple-mind-map, MIT, 12k★, `src/layouts/MindMap.js` — hàm `computedBaseValue`/`computedTopValue`/`adjustTopValue`), viết lại cho model toạ độ world x/y bất biến của repo này (bản gốc dùng DOM đo trực tiếp). 3 bước (`layout.ts`):
  1. `computeAreaHeights` (bottom-up): mỗi node, "vùng con" mỗi hướng = tổng chiều cao RIÊNG (không tính cháu) của các con trực tiếp + gap.
  2. `positionChildrenNaive` (top-down): xếp con quanh tâm Y của cha, CHỈ dùng vùng-con ở bước 1 (không biết cháu) → ra vị trí "ngây thơ" đối xứng đúng như kỳ vọng trực giác (VD 3 con: 1 trên tâm mother, 1 tại tâm, 1 dưới tâm — cân đối tuyệt đối, không lệch).
  3. `fixOverflow` (top-down, hàm `pushSiblingsAndAncestors`): CHỈ node nào có cháu thật sự "quá tải" (vùng con > chỗ nó có giữa các anh em của chính nó) mới đẩy các ANH EM của nó ra xa thêm (nửa phần dư mỗi bên — trước lùi lên, sau lùi xuống), rồi lan truyền ĐÚNG lượng đó lên 1 nấc (anh em của CHA nó). Khác biệt cốt lõi so với bản cũ: không dồn tích luỹ 1 chiều qua toàn chuỗi sibling — sibling không liên quan không bị kéo theo.
  Đã stress-test 50 cây ngẫu nhiên (30 node/cây, có gấp/mở ngẫu nhiên) — 0 overlap trong node đang hiển thị. Nếu nghi ngờ lệch/chồng lấn lần sau: viết lại script tương tự (build cây thủ công qua `reflowAll`, check AABB pairwise trên `visibleSubtreeIds`) TRƯỚC khi sửa mù.
- **Spacing (bội số 8, GIỮ NGUYÊN qua lần fork trên — chỉ đổi CÁCH xếp, không đổi khoảng cách):** `SIBLING_EDGE_GAP = 32`, sàn `siblingEdgeGap` = **24**. Parent→child: `EDGE_GAP = 80` (công thức `EDGE_GAP × decay^level`), `EDGE_GAP_VERTICAL = 144`. Đừng nới gap trừ khi user bảo.

### Phím tắt (LOCKED — đã sửa theo feedback user)
| Phím | Hành vi |
|------|---------|
| **Tab** | Tạo **child của node đang chọn** (đi sâu), cùng hướng nhánh; root/không hướng → phải. **Không** tạo sibling từ mother. |
| **Enter** (khi type) | Commit text, xong type |
| **Ctrl/Cmd+Enter** | Xuống dòng trong box |
| **Delete** | Xóa **child** (+ subtree), **kể cả khi đang type**. **Không** xóa root. |
| **Backspace** (không type) | Xóa text node; khi type = xóa ký tự bình thường |
| **Ctrl/Cmd+Z / Y** | Undo / redo (không khi focus field) |
| Kéo child | Đổi trái↔phải + reorder sibling; ẩn line khi kéo |
| **↑ / ↓** | Chọn sibling trước/sau (cùng parent + hướng), theo `siblingOrder` |
| **→ / ←** | "Sâu hơn" (vào con đầu tiên) nếu trùng hướng nhánh của node đang chọn, ngược lại = "nông hơn" (về parent). Root: cả 2 hướng đều là "sâu hơn" (vào con bên đó). Node đang **gấp**: bấm hướng "sâu hơn" = **mở ra** trước (không nhảy chọn luôn) |
| **Space** (không type) | Gấp/mở nhánh của node đang chọn (không tác dụng nếu không có con hoặc là root) |

Implement: canvas `addChildOfSelected` + `arrowNavigate` + `MindNodeBox` Tab/Delete khi edit.

### Gấp/mở nhánh — collapse/expand (thêm 2026-09-18)
- `MindNode.collapsed?: boolean` — true = ẩn TẤT CẢ con/cháu (subtree con vẫn còn nguyên trong data, không xóa). **Chỉ áp dụng non-root** — root luôn hiện đủ, không có nút gấp (tránh case 2 hướng trái/phải cần 2 state riêng, chưa cần thiết).
- Layout: `layout.ts` có `visibleSubtreeIds()` (giống `collectSubtreeIds` nhưng DỪNG xuống con của node `collapsed`) — dùng trong `subtreeLevelProfile` (tính chỗ) và `reflowDescendants` (dừng xuống layout con) để subtree đang ẩn KHÔNG chiếm chỗ trong reflow. `collectSubtreeIds` (bản đầy đủ, không quan tâm collapse) vẫn giữ nguyên — dùng cho `shiftSubtree`/xóa (phải dời/xóa CẢ subtree ẩn theo cha).
- Canvas: `nodes`/`lines` render filter theo `visibleSubtreeIds(map.nodes, map.rootId)` — con của node đang gấp không render, không tính line.
- UI: nút tròn nhỏ (chevron) ở góc trên cạnh-hướng-nhánh của box, LUÔN hiện khi node có con (không cần chọn trước) — cố tình lệch vị trí so với nút "+" (giữa cạnh) để không đè nhau khi vừa chọn vừa có con.
- Không đổi tọa độ/kích thước con khi gấp — chỉ ẩn render + không tính chỗ; mở lại thì vị trí cũ (trước khi gấp) được dùng làm điểm khởi đầu rồi reflow lại bình thường.

### Xuất/nhập text (markdown outline, thêm 2026-09-18)
- `src/lib/markdown.ts`: `exportMindmapMarkdown(map)` → text (`# root` + bullet `-` thụt lề 2 space/level, right rồi left); `outlineToNodes(text)` → dựng cây node (parser stack-based theo indent, con trực tiếp root xen kẽ phải/trái, cháu kế thừa hướng tổ tiên — đúng ràng buộc sẵn có: non-root chỉ có con CÙNG hướng với chính nó).
- Newline thủ công (Ctrl+Enter) trong 1 node **KHÔNG round-trip** qua text — export gộp thành khoảng trắng để giữ outline 1-dòng-1-node. Chấp nhận lossy, ưu tiên đơn giản (mục đích chính = backup/chia sẻ nhanh, không phải format lưu trữ chính — localStorage vẫn giữ đầy đủ).
- Import luôn tạo **map mới** (không merge vào map đang mở) — an toàn, không đè dữ liệu cũ. UI: nút upload cạnh nút "+" ở Sidebar → `ImportDialog.tsx`.
- Export UI: nút ".md" cạnh nút "Download" (PNG) trên canvas.

### Before changing text, lines, layout, or shortcuts
1. Re-read this section.
2. State which locked rule is affected.
3. Prefer a minimal fix; do not flip to the opposite extreme of the last bug.
