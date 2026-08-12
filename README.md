# VietMindmap

Mindmap chuẩn từng khoảng cách — tối ưu tiếng Việt.

**Folder:** `D:\Files\Claude\build_for_me\vietmindmap`
**Handoff:** xem `HANDOFF.md` (trạng thái cuối) + `CLAUDE.md` §5 (rule khóa)
**Slogan / brand:** VietMindmap · Local-first (Google auth optional)

### Dùng trên web (không cần đăng nhập)

https://kattyfury.github.io/viet_mindmap/

- Ai mở link cũng dùng được ngay (guest)
- Map lưu trên **trình duyệt** của từng người (`localStorage`)
- Deploy tự động từ `master` → GitHub Pages

---

## Chạy 1 nút (nhanh nhất)

### Desktop shortcut
Double-click icon **`VietMindmap`** trên Desktop.

- Tự `npm run dev` (nếu chưa chạy)
- Mở Chrome dạng app window → `http://localhost:3000`

Nếu mất shortcut, tạo lại:

```powershell
cd D:\Files\Claude\build_for_me\vietmindmap
powershell -ExecutionPolicy Bypass -File .\scripts\install-desktop-shortcut.ps1
```

### Hoặc double-click file trong project
| File | Việc |
|------|------|
| `launch-silent.vbs` | Chạy êm (không hiện console) |
| `launch.bat` | Chạy + có cửa sổ log |

### Hoặc tay
```powershell
cd D:\Files\Claude\build_for_me\vietmindmap
npm run dev
```
Mở http://localhost:3000

---

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind v4
- **Zustand** — state, undo/redo (10 bước), auto-save `localStorage`
- Canvas **HTML + SVG** (không Konva)
- Font **Be Vietnam Pro** 400/500/600
- NextAuth Google — chỉ khi có env; không có → **local@vietmindmap**

---

## Tính năng đã chốt (v1)

### Layout UI
- Sidebar **225px** (3/4 của 300px cũ) · main phần còn lại
- List map: box trắng viền màu (6 màu), tên + nút **X xóa** (confirm dialog), kéo-thả để reorder; nút **+** cuối list để tạo map mới
- Không có ô tài khoản/sign-in hay thùng rác kéo-thả trong sidebar (đã bỏ, user chê rối)
- Mobile: chỉ xem

### Mindmap core
- Root và child **cùng kích thước/font hệt nhau** — chỉ khác màu: root nền solid (đen, hoặc custom) + chữ trắng · child nền trắng + viền cùng màu line + chữ đen
- **Chỉ nhánh trái / phải** (không trên/dưới)
- [+] 2 hướng (root) / 1 hướng còn lại (child)
- Line **thẳng**, dưới box, dig vào mép
- Zoom (wheel, scale size/font — không CSS scale chữ mờ) + pan
- Kéo child: đổi trái↔phải / reorder sibling; **ẩn line khi kéo**
- Download PNG full map + margin

### Spacing / không chồng lấn
- Reflow **bottom-up theo chiều cao cả subtree** (`reflowAll`) — box không được đè nhau
- Hở sibling (mép subtree): `SIBLING_EDGE_GAP = 36` (đã giảm ½ so với 72 vì map loãng), sàn 24
- Parent→child: `EDGE_GAP = 100`
- Hydrate / add / xóa / kéo → luôn reflow cả cây từ root

### Phím tắt
| Phím | Việc |
|------|------|
| **Tab** | Tạo **con của node đang chọn** (đi sâu), cùng hướng; root → phải |
| **Enter** | Xong type (commit) |
| **Ctrl+Enter** | Xuống dòng |
| **Delete** | Xóa child + subtree **kể cả đang type** (không xóa root) |
| **Backspace** | Ngoài type: xóa text · Trong type: xóa ký tự |
| **Ctrl+Z / Y** | Undo / redo |
| Cuộn | Zoom |

### Text — box GROW theo nội dung, không có trần
- **Không giới hạn số dòng lẫn ký tự.** Box chỉ có size mặc định lúc rỗng/ngắn: **2 dòng, rộng 324px** — root và child giống hệt nhau về kích thước, gõ dài hơn thì box cao ra tự do
- Root và child đều căn giữa
- Wrap theo width thật của box (CSS) · wrap theo **từ** (không cắt giữa “chó”) · IME VN an toàn
- Box khác không đè lên nhau — mỗi lần gõ xong (Enter/blur) tự đo lại chiều cao rồi xếp lại cả cây

### Màu — 2 chế độ (nút góc trên-phải canvas)
- **Rainbow** (mặc định): 6 màu luân phiên theo nhánh — Đỏ · Cam · Vàng · Lục · Lam · Tím
- **Custom color**: đúng 1 màu cho mọi box + line, kể cả nền root. Setting chung toàn app (không theo từng mindmap)

---

## Rule khóa (đọc trước khi sửa)

Xem **`CLAUDE.md` §5** và **`AGENTS.md`**.  
Agent: sửa xong **commit + push ngay** (user dùng web app).

---

## Cấu trúc chính

```
src/
  app/           # layout, page, auth API
  components/    # Sidebar, MindMapCanvas, MindNodeBox, ColorModeMenu, icons
  store/         # mindmap-store (Zustand)
  lib/           # layout, text, colors, color-settings, export-png, auth, storage
launch.bat / launch-silent.vbs / scripts/install-desktop-shortcut.ps1
```

Data mindmap: `localStorage` key `vietmindmap:v1:<userKey>`.
Chế độ màu (rainbow/custom): `localStorage` key `vietmindmap:colormode:v1` — chung toàn app, không theo userKey.

---

## Auth Google (sau này)

1. Copy `.env.example` → `.env.local`
2. OAuth Web client, redirect `http://localhost:3000/api/auth/callback/google`
3. `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
4. Restart dev

Supabase: chưa gắn — schema JSON tree sẵn để sync sau.

---

## Ghi chú dev

- `npm run build` — kiểm tra TypeScript
- Dev indicator Next “N” đã tắt (`devIndicators: false`)
- Map cũ có up/down: hydrate tự đổi sang left/right + **reflowAll**
- Repo: https://github.com/KattyFury/viet_mindmap · branch deploy: `master`
