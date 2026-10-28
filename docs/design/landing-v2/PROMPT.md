# Claude Code prompt – Landing page v2 + shared footer (SkillSwap)

Paste everything inside the code block into Claude Code, opened at the root of the `fe-skillswap` repo.
Before running: unzip `skillswap-landing-v2.zip` at the repo root (it adds `public/images/landing/*`, `public/images/mascot/*` and `docs/design/landing-v2/*`).

```
Repo: fe-skillswap (Next.js 15 App Router, React 19, Tailwind v4, tokens in src/styles/globals.css).
Read CLAUDE.md first and follow it:
- UI copy Vietnamese (exactly as written below), code/comments English. NO new dependencies.
- Do not edit .env*, next.config.ts, wrangler.jsonc, open-next.config.*, tsconfig, CI or package versions.
- Never log axios errors or headers.
- Branch from origin/main: feat/landing-v2. Never push to main.
- Before "done": typecheck, lint, `npm run build`. Final message: changed files + remaining TODOs.

GOAL
Rebuild the public landing page (the logged-out home route, today: hero with a logo video, two CTAs, 3 trust icons,
4 feature cards) to match the approved design, and add a shared colored footer used on all public pages.
UI only. Do NOT change auth, booking, mentor search, KooKoo chat logic, API clients or models.

DESIGN SOURCE (read these first)
- docs/design/landing-v2/Landing-v2.dc.html  – approved landing mockup
- docs/design/landing-v2/SiteFooter.dc.html  – approved footer
Open Landing-v2.dc.html's inline styles as the layout reference; it renders the full page at 1440px.
These are mockup files in a custom format: ignore <x-dc>, <helmet>, <sc-for>, <sc-if>, <dc-import>, {{holes}}.
Read the inline styles as the visual spec (sizes, colors, radius, spacing) and the <script> block as sample data.
"[EXISTING_LOGO]" = the logo file the repo already uses in the header. Do not copy this markup verbatim: rebuild it
as clean React + Tailwind components that follow the repo's conventions.

ASSETS (already in public/ after unzipping)
- /images/landing/service-card.png, /images/landing/booking-slots.png, /images/landing/my-booking.png
  (real product screenshots, names already anonymised). Use the image component/pattern the repo already uses
  (check whether next/image optimisation works on this Cloudflare build; if not, follow the existing pattern).
  Give every screenshot the alt text from the mockup. Lazy-load everything below the first screen.
- /images/mascot/kookoo.png (full KooKoo), /images/mascot/kookoo-peek.png (top half, "peeking").
  If the repo already has a KooKoo asset (the chat widget avatar), reuse that file for small sizes and only add
  these two for the large illustrations. Mascot images are decorative: alt="" aria-hidden.

SECTION ORDER AND BACKGROUNDS (top to bottom)
 Header (white) → Hero #top (white) → Cách hoạt động #cach-hoat-dong (#f0f6fc) → Mentor list #mentor (white)
 → KooKoo AI #koukou (#f0f6fc) → So sánh với group (#f0f6fc) → Dành cho mentor #lam-mentor (white) → Mentee CTA banner (white)
 → FAQ #faq (#f0f6fc) → Footer (#2563eb, wave fill #f0f6fc) → mobile sticky bar.

0. Locate first – do not guess. Report what you found before editing.
- The landing route + its section components, the current public header and footer.
- Design tokens in globals.css (primary, text, tints). The site primary today is light blue #0095F6.
- The find-mentor route and which query params it reads (?q, ?subject, ?tag …).
- The existing mentor card component used on the "Tìm mentor" page and the hook/API that lists mentors.
  Can it be called while logged out?
- The Google login handler/button.
- How the KooKoo chat widget is opened (store, context, event, ref).
- Existing public routes for policies (e.g. /vi/chinh-sach-bao-mat) and any terms / help / mentor-register routes.

COLORS
Landing uses these values (they match the brand kit and the mockup): headline ink #001c64, action blue #2563eb,
cyan #22d3ee (decoration only, never text on white), body #1f2a3c, secondary #4b5a86, tint #f0f6fc,
chip #e0effc, chip border #bcd7f2, card border #e3edf6 / #d0e0ee. Add them as landing-scoped CSS variables or
Tailwind theme tokens, not as hard-coded hex in many places.
If CLAUDE.md forbids #001c64 or any of these, use the closest existing token instead and list the swap in your report.
Fonts: Montserrat 900 uppercase for section headlines, Be Vietnam Pro 600/700 for buttons, chips, card titles,
Inter 400 for body. Reuse the fonts the repo already loads; if Montserrat is not loaded, load it the same way the
others are loaded (next/font or existing <link>), no new package.
Radius: cards 24px, inner boxes 16px, buttons/chips pill. Shadows: soft blue, e.g. 0 8px 24px rgba(30,58,138,.08).
One highlighted phrase per headline in #2563eb; everything else #001c64.

1. Header (public pages)
- Logo left. Links: "Tìm mentor" (#mentor), "Cách hoạt động" (#cach-hoat-dong), "KooKoo AI" (#koukou),
  "Làm mentor" (#lam-mentor), "Hỏi đáp" (#faq) – smooth scroll on the landing; hide links below 900px
  (keep the existing mobile menu if there is one).
- Right: outlined pill button with the Google "G" icon: "Đăng nhập bằng Gmail" → existing login handler.

2. Hero (white, big light-blue S-swoosh shape behind on the right, decorative SVG)
Left column:
- Pill: dot + "Mentor 1:1 cho sinh viên FPTU HCM" (bg #e0effc, text #1e3a8a).
- H1 (Montserrat 900, uppercase, clamp(44px,6vw,80px), line-height .98): "Môn này khó?" <br> "Có người vừa qua rồi." (2nd line #2563eb).
- Paragraph (18/28, #4b5a86, max 540px): "Đặt lịch 1:1 với sinh viên FPT đã qua đúng môn, đã trải nghiệm, để nghe chia sẻ kinh nghiệm thực tế. Giá cả, thời gian đều minh bạch rõ ràng từ đầu, bạn không cần phải inbox hỏi thêm."
- Search form (role="search", white pill, border #bcd7f2, shadow): search icon, visually-hidden label
  "Bạn cần mentor cho môn hay việc gì?", input placeholder "Nhập mã môn, OJT, đồ án EXE…",
  submit button "Tìm mentor" → navigate to the find-mentor route with the query param it supports (?q=…).
- Row: "Đang được tìm nhiều:" + chip links "DBI201", "ACC203", "PRF192", "MAE101", "OJT", "Chọn chuyên ngành"
  → same route with that query.
- Remove: the old logo video, the "Khám phá khóa học" button, the 3 trust icons.
Right column (min-height ~560px, relative):
- service-card.png in a light browser frame (30px top bar #f0f6fc with 3 grey dots, radius 20, border #d0e0ee).
- booking-slots.png overlapping bottom-left (≈58% width, white 4px border, radius 18, stronger shadow).
- KooKoo (kookoo.png, ~170px) bottom-right with a speech bubble: "Giờ trống mentor mở sẵn, bấm là đặt được liền nè!"
  Gentle 3s up-down bob animation ONLY when prefers-reduced-motion is not "reduce".
- Mobile: columns stack, right column becomes a simple stacked pair of screenshots (no overlap), mascot smaller.

3. "Cách hoạt động" (#cach-hoat-dong, bg #f0f6fc)
- H2: "Từ lúc bí đến lúc có" + highlighted "người chia sẻ".
- Ordered list of 3 steps, zigzag rows (text 1fr / visual 1.6fr; stack on mobile), big blue numbers 1–3:
  1. "KooKoo AI gợi ý người hợp với bạn" – "Cho biết mục tiêu môn học, KooKoo AI xếp mentor theo kỹ năng và ngành, kèm lý do vì sao người đó hợp với bạn."
     Visual: NOT a screenshot – a small panel rendered with the real mentor-card component (or a faithful mini version):
     caption with tiny KooKoo icon "KooKoo AI sắp xếp theo mục tiêu học của bạn, cập nhật mỗi ngày", 2 cards with
     "Vì sao phù hợp: …" box, tags and "Xem lịch trống". kookoo-peek.png (~124px) sits on the panel's top edge
     (slightly overlapped by the panel) with bubble "Mình là KooKoo AI, mình chọn mentor theo mục tiêu của bạn."
  2. "Chọn giờ mentor đã mở sẵn" – "Lịch rảnh hiện theo tuần. Bấm một khung giờ, xem tóm tắt dịch vụ, thời gian và chi phí rồi đặt."
     Visual: booking-slots.png in a white rounded frame.
  3. "Theo dõi đến lúc vào học" – "Biết buổi học đang ở bước nào, nhắn mentor khi cần. Mentor sẽ để sẵn link meeting cho bạn."
     Visual: my-booking.png in a white rounded frame + small mirrored KooKoo at the bottom-left corner (hide < 900px).
- Centered primary pill CTA "Tìm mentor cho bạn" → find-mentor route.

4. Mentor list (#mentor, white)
- Header row: kookoo.png (~84px) + H2 "Người thật, môn thật," <br> highlighted "kinh nghiệm thật."; right link "Xem tất cả mentor".
  Give the H2 a max-width (~720px), never a fixed width/height (the mockup has a fixed 705×145 box from manual resizing –
  do not copy it); it may wrap to 3 lines on desktop as in the PNG.
- Filter chips (role="tablist", aria-selected): "Tất cả", "DBI201", "ACC203", "PRF192", "MAE101", "SWP391", "CV & phỏng vấn OJT", "UI/UX".
  Selected = #2563eb fill, white text. Map each chip to the filter the find-mentor API supports; if it can't filter
  by these, filter client-side by tags and leave TODO(api).
- Grid (auto-fill, min 300px) of REAL mentors from the existing list hook, rendered with the existing mentor card
  component (avatar + verified badge, name, subtitle, "Hợp với bạn nếu: …" box with tiny KooKoo icon, 2-line
  description, status row "Mentor mới" / "Trống gần nhất: …", buttons "Xem hồ sơ" + "Xem lịch trống").
  All button labels must stay on one line (white-space: nowrap) – the mockup had a wrapping bug, don't repeat it.
  Each card also shows a price row next to the status: "{price} S-coins / {duration}" (lowest-priced active service of that mentor; hide the price row if the API has none). Show max 8 cards + the "Chưa thấy người hợp?" card (3×3 on desktop). If the API needs login, show the sample data from the mockup script behind a clearly named
  constant LANDING_SAMPLE_MENTORS + TODO(api); never use real people's names or photos without permission.
- Last grid cell: dashed card (#a8d8fc) "Chưa thấy người hợp?" + "Kể cho KooKoo bạn cần gì: môn đang học, đồ án hay chuẩn bị OJT. KooKoo sẽ tìm trong danh sách mentor giúp bạn."
  + outline button "Hỏi KooKoo" (scrolls to #koukou) + link "Đăng câu hỏi lên Bảng tin" (→ community/forum route, or login if required).

5. KooKoo AI (#koukou, bg #f0f6fc)
- Left: pill with tiny KooKoo "KooKoo AI · trợ lý của SkillSwap"; H2 "Chưa biết hỏi ai?" + highlighted "Hỏi KooKoo trước.";
  text "KooKoo hiểu ngành và học kỳ của bạn, gợi ý mentor hợp, chỉ cách đặt lịch và giải thích S-coin. Bấm thử một câu bên khung chat.";
  2 check items "Đánh dấu mentor hợp với hồ sơ của bạn ngay trên từng thẻ", "Luôn ở góc màn hình, hỏi lúc nào cũng được".
- Right: a DEMO chat card that looks like the real KooKoo widget (header "KooKoo AI" + BETA + "Trợ lý AI của SkillSwap",
  greeting "Xin chào! 👋\nMình là KooKoo, trợ lý AI của SkillSwap. Mình có thể giúp gì cho bạn hôm nay?",
  4 suggestion buttons, input, footnote "KooKoo có thể sai, hãy kiểm tra lại với nguồn được dẫn.").
  Clicking a suggestion appends the question + a canned answer (local state only, aria-live="polite"), plus "Hỏi lại từ đầu".
  Canned answers: copy them from the mockup script. The S-coin answer is a placeholder – keep it as a TODO(copy) constant.
  Typing in the input and pressing send OPENS THE REAL KooKoo widget (existing open handler) with the text if the widget
  supports a prefill; otherwise just opens it. Do NOT call the AI API from the landing.
  Big kookoo.png next to the card (hide < 900px).

6. "Vẫn hỏi trong group được mà?" (bg #f0f6fc, directly after the KooKoo section)
- H2 "Vẫn hỏi trong group" + highlighted "được mà?". kookoo-peek.png (mirrored) above the table's right side with bubble "Khỏi ngồi chờ comment nha!" (hide < 900px).
- 3-column comparison table (real <table> or role="table"), header cells "", "Group Facebook", "SkillSwap" (SkillSwap header #2563eb, white):
  Tìm người | Đăng bài, chờ comment | Gõ mã môn, KooKoo AI gợi ý người hợp
  Biết người đó có hợp | Đoán qua avatar | Hồ sơ ghi rõ khóa, ngành, lý do phù hợp
  Giá | Inbox hỏi từng người | Hiện sẵn trên từng dịch vụ
  Hẹn lịch | Nhắn qua lại nhiều lần | Chọn giờ trống, theo dõi tới lúc vào Meet
  Must stay readable at 375px (horizontal scroll inside a rounded box).

7. "Dành cho mentor" (#lam-mentor, white, pale sky swoosh decoration top-right) – replaces the old 2-card CTA row.
 a. Header: badge "0% hoa hồng năm học này" (#1e3a8a, white); H2 "Bạn qua môn đó rồi?" <br> highlighted "Chia sẻ lại cho bạn khác.";
    text "Môn bạn từng học tốt, kỳ OJT bạn từng qua, đều là kinh nghiệm thực tế người khác đang cần. Tự đặt giá, tự mở giờ rảnh, nhận S-coin sau mỗi buổi.";
    right: mirrored kookoo.png + bubble "Đăng ký khoảng 5 phút thôi, KooKoo chỉ từng bước nè!" (hide < 900px).
 b. Benefits – 4 cards in a responsive grid (min 250px), icon tile + title + one line:
    "Thu nhập từ môn mình giỏi" – "Bạn tự đặt giá từng dịch vụ. Mentee trả bằng S-coin, bạn rút về tài khoản ngân hàng của mình."
    "Lịch do bạn quyết" – "Chỉ mở những giờ bạn rảnh, lặp lại hàng tuần. Mentee chỉ đặt được vào đúng các giờ đó, không bị làm phiền ngoài giờ."
    "Hồ sơ đẹp để ghi vào CV" – "Huy hiệu mentor đã xác minh, số buổi đã chia sẻ và đánh giá từ mentee, dùng được khi ứng tuyển OJT hay đi làm."
    "Nhận đủ 100% năm học này" (this card blue #2563eb, white text, "0%" tile) – "SkillSwap chưa thu phí nền tảng 15% trong năm học này. Mọi thay đổi được báo trước ít nhất 7 ngày."
 c. "Trở thành mentor trong 6 bước" – interactive stepper: left = vertical tablist of 6 step buttons (number + title + one-line
    description; selected = white card, #2563eb border, filled number), right = tabpanel on #f0f6fc showing a MINI MOCK of the real
    product screen for that step. Build the mocks as static JSX that reuses the in-app look (light blue #0ea5e9 buttons, toggles,
    chips) – NOT screenshots, NOT live components, no API calls, sample data only, all non-interactive inside (use <span>/<div>,
    aria-hidden on decorative parts so screen readers don't hear fake buttons).
    1 "Đăng nhập Gmail, điền hồ sơ mentor" – registration form: 5-step stepper (Thông tin ✓, Kinh nghiệm ✓, Môn chia sẻ ✓, Minh chứng (current), Gửi),
      privacy note "Minh chứng chỉ dùng để xác minh, không hiển thị công khai.", 2 uploaded file rows (Bảng điểm FPTU.pdf, Chứng chỉ SQL.jpg) with "Đã tải lên", buttons Lưu nháp / Tiếp tục.
    2 "Chờ quản trị viên duyệt" – status card "Đang xem xét" + 3-step timeline (gửi hồ sơ / quản trị viên nhận xử lý / kết quả kèm lý do) + note that a human reviews, AI doesn't decide.
    3 "Tạo dịch vụ và đặt giá" – "Dịch vụ của tôi" with 3 service cards (name, "60 phút · 1:1", toggle on, price): Ôn PE DBI201 59.000 S-coins / Chữa đề SQL cấp tốc 30 phút 29.000 S-coins /
      Hỏi nhanh về chọn chuyên ngành 15 phút Miễn phí; hint "Gợi ý giá: buổi 30 phút 25.000–39.000 S-coins, buổi 60 phút 49.000–89.000 S-coins. Bạn có thể giữ 1 dịch vụ miễn phí ngắn để mentee làm quen."
    4 "Mở lịch rảnh" – week grid (Lịch / Lịch lặp toggle, "+ Thêm lịch rảnh"), repeating dashed slots, one solid "Đã đặt" slot; horizontal scroll inside the panel on mobile.
    5 "Nhận lịch và chia sẻ" – "Chi tiết lịch đặt": Ôn PE DBI201 với Mai Linh, "Sắp diễn ra", start/end, Google Meet, "Bạn nhận 59.000 S-coins", goal, button "Mở liên kết buổi mentoring".
    6 "Nhận S-coin, rút về ngân hàng" – balance card 413.000 S-coins + link "Xem ví S-coin mẫu" → #vi-scoin.
    Exact step titles/descriptions and mock copy: see the mockup script (stepData, services) and markup.
 d. "Tiền về ví S-coin thế nào?" (#vi-scoin) – sub "Ví mẫu của một mentor sau 2 tuần chia sẻ. Bấm thử hai tab."
    Left: simulated wallet (sample constants, clearly named LANDING_SAMPLE_WALLET): gradient balance card "Số dư khả dụng 413.000 S-coins",
    chip "Vietcombank •••• 4821", button "Rút tiền"; 3 stat tiles Có thể rút 354.000 / Chờ xác nhận 59.000 / Yêu cầu đang xử lý 1;
    tabs "Giao dịch gần đây" | "Yêu cầu rút" (real tablist, local state) listing the transactions from the mockup script with
    status pills (Chờ xác nhận amber, Đã cộng green, Đang xử lý blue, Đã chuyển grey). Numbers must stay consistent:
    available 413.000 = withdrawable 354.000 + pending 59.000.
    Right: 3 numbered how-to steps "Thêm tài khoản nhận tiền" / "Hoàn thành buổi học" / "Bấm Rút tiền" + dashed KooKoo help card.
    Business rule (confirmed by the team): S-coin from a completed session sits in "Chờ xác nhận" for 24 hours, then moves to
    "Có thể rút". Step 2 copy: "S-coin của buổi học vào mục Chờ xác nhận. Sau 24 giờ được xác nhận, số S-coin này chuyển sang Có thể rút."
    Read the 24h value from the wallet/backend config if the repo has it; otherwise a constant WITHDRAW_HOLD_HOURS = 24.
    The [50.000] minimum and [1–3] ngày làm việc values are still placeholders → constants with TODO(copy).
 e. Bottom CTAs: pill "Đăng ký làm mentor" (#1e3a8a) → existing mentor registration route; link "Đọc quy định dành cho mentor" → PUBLIC_ROUTES.mentorRules (TODO(route)).

7b. Mentee CTA banner (white section, one full-width blue card #2563eb, radius 32, cyan ring, KooKoo bottom-right hidden < 900px):
    "Sắp thi rồi? Đặt buổi đầu ngay hôm nay." / "Đăng nhập bằng Gmail, chọn mentor, chọn giờ. Xong." / white pill "Tìm mentor ngay".

8. FAQ (#faq, bg #f0f6fc)
- Left: "Hỏi nhanh" + bubble "Còn thắc mắc? Hỏi KooKoo AI ở góc màn hình, mình trả lời liền." + kookoo.png.
- Right: accordion, one open at a time, real <button aria-expanded>:
  "Mentor trên SkillSwap là ai?" – "Sinh viên và cựu sinh viên FPTU HCM, có thể cùng khóa với bạn, đã qua đúng môn hay kỳ OJT bạn đang cần. Hồ sơ mỗi người ghi rõ khóa, ngành và những môn, mảng họ chia sẻ."
  "S-coins là gì?" – TODO(copy) placeholder constant.
  "Học ở đâu?" – "Buổi học diễn ra qua Google Meet. Phòng mở trước giờ học, nút vào phòng nằm ngay trong Booking của tôi."
  "Có cần tạo tài khoản không?" – "Bạn chỉ cần đăng nhập bằng Gmail, không cần tạo mật khẩu riêng."
  If the repo already has an FAQ data source, reuse it and only add missing items.

9. Shared footer – new component (e.g. src/components/layout/SiteFooter.tsx), used on ALL public pages
(landing, policy pages, help); do not show it inside the logged-in app shell unless the current footer is there.
Spec = docs/design/landing-v2/SiteFooter.dc.html:
- bg #2563eb, white text; white wave on the top edge whose fill = the background of the section above
  (prop `topColor`, default #ffffff; landing passes #f0f6fc); decorative cyan ring + blue circle.
- White CTA card inside the footer with KooKoo: "Sẵn sàng tìm" + highlighted "người chia sẻ?" /
  "Đăng nhập bằng Gmail, chọn mentor, chọn giờ trống." / buttons "Tìm mentor" (blue) + "Hỏi KooKoo" (outline, opens widget).
- Columns: brand (logo on a white pill, "Nền tảng kết nối Mentor – Mentee cho sinh viên Đại học FPT TP.HCM. Học để chia sẻ, kết nối để phát triển.",
  Facebook + email icon links); "Sản phẩm" (Tìm mentor, Đăng ký làm mentor, KooKoo AI, Bảng tin cộng đồng, Blog);
  "Hỗ trợ" (Trung tâm hỗ trợ, Hướng dẫn đặt lịch, S-coin là gì?, Liên hệ hỗ trợ); "Chính sách" (Chính sách bảo mật,
  Điều khoản sử dụng, Chính sách đặt và hủy lịch, Quy định dành cho mentor, Yêu cầu xóa tài khoản);
  "Liên hệ" (skillswapvn.contact@gmail.com, "Phản hồi trong 3 ngày làm việc", "Nhóm dự án SkillSwap – Trường Đại học FPT TP.HCM").
- Bottom bar: "© 2026 SkillSwap. Dự án khởi nghiệp EXE của sinh viên Trường Đại học FPT TP.HCM." and
  "Dành cho người dùng từ 18 tuổi · Dữ liệu lưu trữ tại Việt Nam".
- Links: use the real routes you found in step 0. "Chính sách bảo mật" → the existing privacy route.
  "Yêu cầu xóa tài khoản" → privacy page section for account deletion if no dedicated page exists.
  Facebook URL → constant FANPAGE_URL with TODO(link). Routes that don't exist yet (terms, booking policy, mentor rules,
  help): keep the link text but point to a constant map PUBLIC_ROUTES with TODO(route) entries, and render those links
  as plain text (not clickable) until a route is set – never ship a link that 404s.
- Focus ring on blue: 3px solid white, offset 3px.

10. Mobile sticky bar (< 900px only): white bar at the bottom with small KooKoo, "Có mentor mở lịch tuần này" and
pill "Tìm mentor". Don't cover the footer's last line (add bottom padding equal to the bar height).

QUALITY
- Responsive at 375 / 768 / 1280 / 1440. No horizontal page scroll.
- Real <button>/<a>; visible focus (3px solid #001c64, offset 3px on light grounds); touch targets ≥ 44px;
  aria-label on icon-only buttons; text contrast ≥ 4.5:1.
- Only one orchestrated motion (mascot bob); respect prefers-reduced-motion. No fade-in on every section.
- No emoji in the layout except the 👋 in KooKoo's greeting. No fake statistics or counters.
- Keep SEO metadata of the landing route; update title/description only if they still mention the old copy.

DONE = landing matches the mockup section by section; search + chips route to find-mentor; mentor grid uses the real card
component (or the named sample constant with TODO); demo chat works locally and opens the real widget; shared footer
is on all public pages with no dead links; mobile layout and keyboard navigation work; typecheck + lint + build pass.
Report changed files, every TODO, and any token you had to swap.
```
