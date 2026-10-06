You are a senior frontend engineer on the SkillSwap codebase (skillswap.asia), a platform matching students (mentees) with mentors. Task: build the "Cài đặt & hỗ trợ" page opened from the avatar dropdown menu (top-right header), matching the attached design image. Change only what this feature needs; do not break anything else.

All UI copy stays in Vietnamese exactly as quoted below.

## STEP 0 – Explore before editing (required)
Read the codebase and report briefly:
1. Framework, router, folder structure for pages/routes and components.
2. The component rendering the avatar dropdown (items: "Hồ sơ của tôi", "Lịch sử booking", "Trở thành mentor", "Trợ giúp & hỗ trợ", "Đăng xuất").
3. The shared layout with the sidebar (Bảng tin, Tìm Mentor, Booking của tôi) and the header (page title, bell, messages, avatar).
4. The styling system (Tailwind / CSS modules / styled-components / UI lib…), where colors, font, radius and shadows live, and the existing components: Button, Card, Switch, Select, Input, Tabs, Accordion, Modal, Toast, icon library.
5. How the logged-in user is read (Gmail, name, role Mentee/Mentor, school) and which APIs exist for user settings, notifications and support/reports.
6. Whether i18n exists.

Then list the files you will create or modify, and only then start coding.

## DO-NOT-BREAK RULES
- Do NOT change other pages (Bảng tin, Tìm Mentor, Booking, Hồ sơ…), the sidebar or the header. The only exception is the dropdown change in §1.
- Do NOT add dependencies when an equivalent exists. Do NOT touch build/lint/tsconfig configs or package versions.
- Do NOT change backend, DB, schema or auth. If an API is missing, build the UI with local state and leave a clear `// TODO(api): ...`.
- Reuse the existing layout, components, tokens and icons. No hard-coded colors when a token exists; add a token only if truly missing.
- Follow project conventions (naming, code style, exports). No unrelated refactors.
- When done, run the existing lint, type-check, tests and build. All must pass.

## 1. Avatar dropdown
In the group "CÀI ĐẶT & HỖ TRỢ", replace the single item "Trợ giúp & hỗ trợ" with two items:
- "Cài đặt" (sliders/gear icon) → opens the page on the Settings section.
- "Trợ giúp & hỗ trợ" (question-circle icon) → opens the page on the Help section.

Remove the faint, unreadable description line under the item. Keep all other items and the menu styling unchanged.

## 2. Route
- One page, following the project's route convention (e.g. `/settings`).
- State lives in the query string so links are shareable and Back works: `?section=settings|help&tab=account|notifications|privacy|language|booking`. Defaults: `section=settings`, `tab=account`.
- The page is auth-protected using the existing guard.
- It uses the shared layout. Header title: "Cài đặt & hỗ trợ". No sidebar item is active.

## 3. Layout (desktop)
- Content area: padding ~28–32px, same light page background as the other pages.
- Two columns: a flexible main column, and a right column 300–380px wide.
- Below 1024px, the right column stacks under the main column.
- Below 640px, tabs and buttons wrap. There must be no horizontal scroll.

### 3.1 Main column header
- **Left side:** H1 ~32px bold, with a gray subtitle under it.
  - Settings section: H1 "Cài đặt", subtitle "Quản lý tài khoản, thông báo và quyền riêng tư của bạn."
  - Help section: H1 "Trợ giúp & hỗ trợ", subtitle "Tìm câu trả lời nhanh hoặc gửi yêu cầu cho đội ngũ SkillSwap."
- **Right side** (same row; wraps on mobile): a segmented control on a light-gray rounded track.
  - Two buttons with icons: "Cài đặt" and "Trợ giúp & hỗ trợ".
  - Active button: white background, primary-blue text, soft shadow.
  - Switching updates `section` in the query.
- NO large hero banner on this page.

### 3.2 SETTINGS section
**Tab row.** Rounded pill buttons, same style as the "Tất cả / Câu hỏi / …" filters on Bảng tin:
- Tabs: Tài khoản · Thông báo · Quyền riêng tư · Ngôn ngữ & múi giờ · Booking & thanh toán.
- Active tab: primary-blue background with white text. Inactive: white background with a light border.
- Show only the active tab's content.
- Use `role="tablist"`, `role="tab"` and `aria-selected`. Changing tab updates `tab` in the query.

**Group card.** Every settings group is a white Card:
- Container: radius ~20px, very light border, soft shadow, padding ~24px.
- Card header: a 50×50 rounded icon tile (light background, darker icon), with a title (~19px, semibold) and a gray description beside it.
- Rows: separated by thin dividers. Left side shows the row title (~16px, medium) and a description (~14px, gray). Right side holds the control.
- Navigation rows: the whole row is a link, with a blue `>` chevron on the right.

**Tab "Tài khoản"**
Card "Tài khoản & đăng nhập" — description "Bạn đăng nhập bằng tài khoản Google", person icon on a blue tile.

1. **"Gmail đăng nhập"**
   - Description: `<user email> · Được quản lý bởi Google`.
   - Right side: a green badge "✓ Đã xác minh".
   - NO email change, NO password, NO 2FA: users sign in with Gmail only.
2. **"Hồ sơ của tôi"**
   - Description: "Tên hiển thị, ảnh đại diện, trường học, kỹ năng".
   - Links to the existing profile page.
3. **"Số điện thoại"**
   - Description: "Chưa thêm · để mentor liên hệ khi buổi học thay đổi", or the saved number.
   - Button: "Thêm số" (no number yet) or "Sửa" (number saved).
4. **"Vai trò"**
   - Mentee description: `Mentee · Khi trở thành mentor, mục "Lịch nhận booking" sẽ xuất hiện tại đây`, plus a button "Trở thành mentor" linking to the existing mentor sign-up flow.
   - If the user is already a mentor, show "Mentor" and hide the button.
5. **"Thiết bị đang đăng nhập"**
   - Description: the current device.
   - Button: "Đăng xuất thiết bị khác" (TODO(api) if missing).

Separate card "Xóa tài khoản":
- Light red border and a warning icon on a red tile.
- Description: "Xóa vĩnh viễn hồ sơ, bài viết và lịch sử booking. Không thể hoàn tác."
- An outlined red button "Xóa tài khoản".
- Clicking the button reveals an inline confirmation (or the existing Modal) with `role="alert"`:
  - Text: "Bạn chắc chắn muốn xóa? Các buổi booking sắp tới sẽ bị hủy và mentor sẽ được thông báo."
  - Button "Giữ tài khoản": the default, and it receives focus.
  - Button "Xóa vĩnh viễn": filled red.
- Do NOT call a delete API unless one already exists (TODO(api)).

**Tab "Thông báo"**
Card with a bell icon on an orange tile, description "Thay đổi được lưu tự động". Switch rows:
| Row | Extra control | Default |
|---|---|---|
| Nhắc lịch booking | Select: Trước 30 phút / Trước 1 giờ / Trước 1 ngày | on |
| Tin nhắn mới | — | on |
| Phản hồi bài viết | — | on |
| Gợi ý mentor phù hợp | — | off |
| Gửi bản sao qua Gmail | — | off |

**Tab "Quyền riêng tư"**
Card with a shield icon on a green tile:
- Select "Ai có thể xem hồ sơ": Mọi người dùng SkillSwap / Chỉ mentor tôi đã booking.
- Switch "Hiển thị trường học" (description: the user's school).
- Switch "Cho phép mentor nhắn tin trước khi booking".
- Switch "Đăng câu hỏi ẩn danh mặc định".
- Link row "Người dùng đã chặn", showing the count.

**Tab "Ngôn ngữ & múi giờ"**
Card with a globe icon, description "Múi giờ quyết định giờ hiển thị của mọi buổi booking":
- Select "Ngôn ngữ": Tiếng Việt / English.
- Select "Múi giờ": default "(GMT+7) Hà Nội, TP. HCM", row description "Tự nhận theo thiết bị".

**Tab "Booking & thanh toán"**
Card with a card icon on a yellow tile. Three chevron link rows: Phương thức thanh toán · Lịch sử booking & giao dịch · Chính sách hủy & hoàn tiền.

**Switch behavior**
- Clickable, with `role="switch"` + `aria-checked` (or `aria-pressed`). `aria-label` = the row title.
- On = primary blue, off = gray.
- Saving: auto-save via the API if one exists; otherwise local state + TODO(api).
- On success, show a small "Đã lưu" toast (existing toast component).
- On error, revert the switch and show an error.

### 3.3 HELP section
**1. Search block**
- Container: light-blue background, light-blue border, radius ~24px.
- Label: "Bạn đang gặp vấn đề gì?"
- Search input: ~60px tall, magnifier icon, placeholder "Ví dụ: hủy booking, đăng nhập Gmail, hoàn tiền…".
- Topic chips below: Tất cả · Booking · Tài khoản · Mentor · Thanh toán (same style as the tabs).

**2. Card "Câu hỏi thường gặp"**
- Title on the left, "{n} kết quả" on the right.
- Each item is an accordion:
  - The trigger is a button with `aria-expanded`.
  - A light-blue topic tag appears before the question; an up/down chevron sits on the right.
  - The first item is open by default.
- The open answer shows "Câu trả lời có hữu ích không? [Có] [Không]". Send the feedback if an API exists, otherwise TODO.
- Filtering: typing filters live on question + answer, combined with the active chip.
- Empty state: "Chưa có câu trả lời phù hợp. Gửi yêu cầu hỗ trợ để đội ngũ SkillSwap giúp bạn." The link scrolls to the form below.
- FAQ data lives in a separate constants file (or comes from an existing CMS/API). Seed it with the questions below; use the placeholder "[Nội dung trả lời]" + TODO for missing answers.

| Topic | Question |
|---|---|
| Booking | Làm sao để hủy hoặc đổi lịch một buổi booking? |
| Booking | Mentor không vào buổi học thì sao? |
| Tài khoản | Tôi không đăng nhập được bằng Gmail? |
| Tài khoản | Làm sao để đổi tên hiển thị hoặc ảnh đại diện? |
| Mentor | Làm thế nào để trở thành mentor? |
| Thanh toán | Bao lâu thì tôi nhận được tiền hoàn? |

**3. Card "Gửi yêu cầu / báo cáo sự cố"** (`id="bao-cao"`), with a flag icon on an orange tile.
- Two selects side by side (stacked on mobile):
  - "Loại vấn đề": Vấn đề với buổi booking / Báo cáo người dùng / mentor / Thanh toán & hoàn tiền / Lỗi kỹ thuật trên website.
  - "Buổi booking liên quan (nếu có)": the user's bookings, if an API exists.
- Required textarea "Mô tả", with validation.
- Buttons: "Đính kèm ảnh chụp màn hình" and the primary "Gửi yêu cầu".
- After a successful submit, replace the form with a green box (`role="status"`):
  - Text: "Đã gửi yêu cầu #<id>. Chúng tôi sẽ phản hồi qua thông báo và Gmail trong [thời gian]."
  - Button: "Gửi yêu cầu khác".
- Without an API: TODO(api), and simulate success.

**4. One-line card "Điều khoản & chính sách:"**
Links: Điều khoản sử dụng · Chính sách bảo mật · Quy tắc cộng đồng · Hủy & hoàn tiền. Use the existing pages if they exist.

### 3.4 Right column (both sections)
Card "Cần hỗ trợ ngay?", top to bottom:
1. The SkillSwap owl mascot (existing asset), ~84px tall.
2. Title, ~22px.
3. Text: "Chat với đội ngũ SkillSwap, phản hồi trong [thời gian]."
4. Full-width primary button "Chat với hỗ trợ". It must open the same chat/assistant as the floating owl button.
5. Full-width outlined button "Gửi email hỗ trợ" (mailto).
6. Small line: "Giờ hỗ trợ: [giờ làm việc]".

In the Settings section only, add a card-button below this card:
- Question icon on a green tile, label "Câu hỏi thường gặp", chevron on the right.
- Clicking it switches to the Help section.

Do NOT repeat profile info or the avatar-menu items in this column.

Put [thời gian], [giờ làm việc], the support email and the refund cut-off hours into one config constants file, each with a TODO for the team.

## 4. Style – match the current site
- Font, primary blue, page background, sidebar/header: use the exact tokens from the Bảng tin page.
- Radius: cards ~20px; buttons, tabs and inputs ~12px; search block ~24px. Very soft, blue-tinted shadows.
- Icon tiles, same as the "Tìm mentor phù hợp / Đặt lịch buổi đầu" cards. Prefer existing tokens if they match.

| Tile | Background | Icon |
|---|---|---|
| Blue | #e8f2ff | #1677e5 |
| Green | #e6f7ee | #16a34a |
| Orange | #fff3e2 | #c76a00 |
| Yellow | #fff6d9 | #b98500 |
| Red | #fdecec | #c62828 |

- Gray description text must reach ≥4.5:1 contrast on white.
- Clickable targets are ≥44px, with clear hover and focus-visible states.
- Use the existing icon library. No emoji.

## 5. Accessibility & quality
- Every input, select and textarea has a `<label>` (sr-only is fine).
- Icon-only buttons have an `aria-label`.
- Everything works by keyboard: tabs, accordion, switches, the delete confirmation.
- No console errors or warnings. No dead code.
- If the project has tests, add tests for:
  - section/tab driven by the query string;
  - FAQ filtering (keyword + chip + empty state);
  - switch toggling;
  - the delete confirmation ("Giữ tài khoản" deletes nothing).

## 6. Report back
1. Files created/modified, one line each on why.
2. All TODO(api) spots and the constants the team must fill in.
3. Results of lint / type-check / tests / build.
4. Manual test steps:
   1. Open the avatar menu → "Cài đặt", then try each tab.
   2. Open the menu again → "Trợ giúp & hỗ trợ".
   3. Search "hủy", then pick the chip "Thanh toán".
   4. Submit a request.

The attached image is the visual target. Where it conflicts with existing project components or tokens, stay consistent with the project and note the difference.
