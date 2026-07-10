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

### Text in boxes (`src/lib/text.ts`)
- Max **2 lines**. Root: **20** chars/line (40 total). Child: **30** chars/line (60 total).
- When full → **hard stop typing** (no more insert).
- Wrap **only at spaces** — never split a word mid-way (`chó` must not become `c` + `hó`).
- Hard-cut mid-word **only** if a single word is longer than one line.
- Preserve type order; no word-reflow that reshuffles or drops characters.
- IME (Vietnamese): don’t clamp mid-composition.
- **Enter** = xong type (commit). **Ctrl+Enter** (Cmd+Enter) = xuống dòng.

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
- **No overlap (LOCKED):** boxes / subtrees must never overlap. Reflow is bottom-up by **full subtree height** (`reflowAll` / `reflowSiblings` in `layout.ts`), not single-box gap only. Adjacent sibling subtrees keep ≥ `SIBLING_EDGE_GAP` (with decay floor). Stack is centered on parent → upper branches are pushed **up**, lower ones **down**. After add / delete / relocate / migrate, always `reflowAll` from root.

### Before changing text or lines
1. Re-read this section.
2. State which locked rule is affected.
3. Prefer a minimal fix; do not flip to the opposite extreme of the last bug.
