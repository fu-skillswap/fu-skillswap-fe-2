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
- Row: "Đang được tìm nhiều:" + chip links "PRF192", "MAE101", "OJT", "EXE101", "Chọn chuyên ngành"
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
- Filter chips (role="tablist", aria-selected): "Tất cả", "PRN211", "SWP391", "MAE101", "CV & phỏng vấn OJT", "Phân tích dữ liệu", "UI/UX".
  Selected = #2563eb fill, white text. Map each chip to the filter the find-mentor API supports; if it can't filter
  by these, filter client-side by tags and leave TODO(api).
- Grid (auto-fill, min 300px) of REAL mentors from the existing list hook, rendered with the existing mentor card
  component (avatar + verified badge, name, subtitle, "Hợp với bạn nếu: …" box with tiny KooKoo icon, 2-line
  description, status row "Mentor mới" / "Trống gần nhất: …", buttons "Xem hồ sơ" + "Xem lịch trống").
  All button labels must stay on one line (white-space: nowrap) – the mockup had a wrapping bug, don't repeat it.
  Show max 5 cards. If the API needs login, show the sample data from the mockup script behind a clearly named
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

6. "Vẫn hỏi trong group được mà?" (bg #f0f6fc or white – alternate with neighbours)
- H2 "Vẫn hỏi trong group" + highlighted "được mà?". kookoo-peek.png (mirrored) above the table's right side with bubble "Khỏi ngồi chờ comment nha!" (hide < 900px).
- 3-column comparison table (real <table> or role="table"), header cells "", "Group Facebook", "SkillSwap" (SkillSwap header #2563eb, white):
  Tìm người | Đăng bài, chờ comment | Gõ mã môn, KooKoo AI gợi ý người hợp
  Biết người đó có hợp | Đoán qua avatar | Hồ sơ ghi rõ khóa, ngành, lý do phù hợp
  Giá | Inbox hỏi từng người | Hiện sẵn trên từng dịch vụ
  Hẹn lịch | Nhắn qua lại nhiều lần | Chọn giờ trống, theo dõi tới lúc vào Meet
  Must stay readable at 375px (horizontal scroll inside a rounded box).

7. Two final CTA cards (#lam-mentor), side by side, stack on mobile, radius 32:
- Blue card (#2563eb, white text, cyan ring decoration, KooKoo bottom-right): "Sắp thi rồi? Đặt buổi đầu ngay hôm nay." /
  "Đăng nhập bằng Gmail, chọn mentor, chọn giờ. Xong." / white pill "Tìm mentor ngay".
- Light card (#e0effc): badge "0% hoa hồng năm học này" (#1e3a8a), "Bạn qua môn đó rồi?" + highlighted "Chia sẻ lại cho bạn khác." /
  "Tự đặt giá, tự mở giờ rảnh. Nhận lịch khi bạn sẵn sàng." / pill "Đăng ký làm mentor" (#1e3a8a) → existing mentor registration route.

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
