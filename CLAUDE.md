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

### Box size — GROW theo nội dung, không còn max (đại tu 2026-08-12, xem `HANDOFF.md` mục 2+3)
- **KHÔNG giới hạn số dòng lẫn ký tự.** Box chỉ có kích thước MẶC ĐỊNH lúc rỗng/ngắn (`defaultBoxHeight()` trong `constants.ts`), gõ dài hơn thì box **cao ra tự do**, không trần.
  - Root: rộng cố định **200px**, mặc định **1 dòng** (`ROOT_DEFAULT_LINES`).
  - Child: rộng cố định **324px**, mặc định **2 dòng** (`CHILD_DEFAULT_LINES`).
  - Bề rộng LUÔN cố định theo loại node — chỉ chiều cao grow.
- **Không đè nhau (LOCKED, mở rộng từ rule cũ):** vì box cao động, mỗi lần `updateText` (commit — blur/Enter) đo chiều cao thật rồi `reflowAll` lại toàn cây — nhánh khác tự nhường chỗ theo chiều cao mới. Trong lúc đang gõ (chưa commit), box tự nó lớn lên live (không reflow cây, chỉ node đang edit — chấp nhận đè tạm lúc edit, ổn định lại khi commit).
- Đo chiều cao = đo DOM thật (`scrollHeight`), KHÔNG suy ra từ số ký tự — vì `scrollHeight` bị "sàn" ở height/padding hiện tại của element (không bao giờ báo NHỎ hơn), nên đo xong phải **tạm bỏ height + padding** (set `auto`/`0`) rồi mới đọc, để box CO LẠI được khi xóa chữ. Xem `measureAndApplyTextareaBox()` trong `MindNodeBox.tsx`.
- `<textarea>` PHẢI có `rows={1}` tường minh — thiếu `rows` thì browser mặc định cao tối thiểu 2 dòng, làm sai phép đo cho root (mặc định chỉ 1 dòng) → caret bị đẩy lệch lên trên thay vì canh giữa.
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
- Lines render **under** boxes; both ends dig **into** the box.
- Same direction → **one fixed anchor** on the parent edge (mid-right for right branches, etc.).
- Box corners:
  ```
  A ---- B
  |      |
  C ---- D
  ```
- **Only LEFT / RIGHT branches** — no up/down create (UI + addChild).
- Straight lines (not L-paths): parent mid-edge → child near-edge mid + dig.
- While dragging a child, **hide** its line (do not leave line at old position).
- Drag relocate only chooses left vs right.

### Layout / zoom
- Sibling order = creation order (`siblingOrder`), not sort-by-x/y.
- No CSS `transform: scale` on text; scale size/font in layout.
- Border-radius **scales with zoom** (not fixed `rem`).
- **No overlap (LOCKED):** boxes / subtrees must never overlap. Reflow is bottom-up by **full subtree height** (`reflowAll` / `reflowSiblings` in `layout.ts`), not single-box gap only. Adjacent sibling subtrees keep ≥ `SIBLING_EDGE_GAP` (with decay floor). Stack is centered on parent → upper branches are pushed **up**, lower ones **down**. After add / delete / relocate / migrate / hydrate, always `reflowAll` from root.
- **Spacing (đã chỉnh):** `SIBLING_EDGE_GAP = 36` (từng 72, giảm ½ vì map loãng), sàn `siblingEdgeGap` = **24**. Parent→child: `EDGE_GAP = 100`, `EDGE_GAP_VERTICAL = 140`. Đừng nới gap trừ khi user bảo.

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

Implement: canvas `addChildOfSelected` + `MindNodeBox` Tab/Delete khi edit.

### Before changing text, lines, layout, or shortcuts
1. Re-read this section.
2. State which locked rule is affected.
3. Prefer a minimal fix; do not flip to the opposite extreme of the last bug.
