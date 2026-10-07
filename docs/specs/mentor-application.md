You are a senior frontend engineer on the SkillSwap codebase (skillswap.asia), a platform matching FPT University students (mentees) with mentors. Task: redesign the "Đăng ký trở thành Mentor" flow (application form + evidence upload) to match the 2 attached design images (right-hand "Mẫu cải thiện" panels). Fix the listed UX problems without breaking anything else.

All UI copy stays in Vietnamese exactly as quoted below.

## STEP 0 – Explore before editing (required)
Report briefly, then list the files you will create or modify before coding:
1. Framework, router, and where the current mentor-application page and its form component(s) live.
2. The form approach used (react-hook-form / Formik / custom), validation (zod / yup / …), and the submit API with its payload shape. List every existing field and whether it is required.
3. The current upload implementation: endpoint, limits (types, size, count), and whether progress or delete is supported.
4. Shared layout (sidebar + header), design tokens, and existing components: Button, Input, Textarea, Checkbox, Stepper, Card, Chip, Toast, Modal, Dropzone, icon library.
5. Whether a draft-save API exists, and how application status is stored or read (pending / approved / rejected).

## DO-NOT-BREAK RULES
- Keep the submit API contract and field names unchanged. This is a UI/UX restructure, not a data-model change. If the design needs a field the backend lacks, do NOT add it; list it in the report.
- Do NOT change backend, DB, auth or other pages. Do NOT add sidebar items; note it in the report if the design implies one.
- Reuse existing components and tokens. Add no dependency when an equivalent exists. Do not touch build/lint configs or package versions.
- Existing validation rules (required fields, file limits) must still be enforced, client- and server-side as today.
- Follow project conventions. No unrelated refactors.
- When done, run lint, type-check, tests and build; all must pass.

## UX PROBLEMS TO FIX
| # | Problem | Fix |
|---|---|---|
| 1 | One long, intimidating form; no sense of progress | Multi-step wizard with stepper and an estimated time |
| 2 | Generic placeholders ("Chia sẻ kinh nghiệm…") | Concrete FPT-student examples |
| 3 | Benefits of becoming a mentor not shown | Benefits card |
| 4 | No helper text, length limits or format guidance | Helper text + character counters under fields |
| 5 | No draft saving; leaving loses everything | "Lưu nháp" + auto-save |
| 6 | Too many fields at once | Required fields first, optional later |
| 7 | Privacy of uploaded evidence unexplained | Privacy banner |
| 8 | No example or checklist of valid files | Example thumbnails + checklist |
| 9 | No upload progress or status; only "Đã có 0/3 tệp" | File list with status and counter |
| 10 | "Điều khoản vận hành" unclear | Summarized consent bullets + links |
| 11 | Submit button faded and unconvincing; no info on review time or next steps | Clear submit area + review-time info + done screen |

## 1. Wizard structure
Single page with a stepper. State is kept in the URL (`?step=1..5`) so refresh and Back work. Steps:

1. **Thông tin cơ bản** — title/specialty, short intro, phone, GitHub (optional).
2. **Kinh nghiệm & thế mạnh** — the existing experience/skills fields.
3. **Thời gian tư vấn** — the existing availability fields.
4. **Minh chứng** — evidence uploads (design image 2).
5. **Xem lại & gửi** — read-only summary + consent + submit.

Map every existing field into these steps; required fields go early, optional ones later. If a step would end up empty because the field doesn't exist, merge or skip it and report.

Page header:
- H1 "Đăng ký trở thành Mentor", with the subtitle "Chia sẻ kinh nghiệm – Truyền cảm hứng – Cùng phát triển cộng đồng sinh viên FPT".
- Top-right: a clock icon with "Thời gian hoàn thành: ~5 phút".

Stepper:
- Numbered circles with labels and connecting lines.
- Current step: filled primary blue. Done: check icon, and the step is clickable to go back. Upcoming: gray outline, not clickable.
- Mobile: compact "Bước 2/5 · Kinh nghiệm & thế mạnh" with a progress bar.

Step card:
- Small label "Bước 1/5", then H2 (e.g. "Thông tin cơ bản") and a one-line purpose ("Giúp mentee hiểu bạn là ai và bạn có thể hỗ trợ điều gì.").

Footer of each step:
- Left: "Lưu nháp" (outlined, save icon). Right: primary "Tiếp tục →". From step 2 on, also show "← Quay lại".
- "Tiếp tục" validates the current step only: show inline errors, scroll and focus the first invalid field.
- Never block with a disabled button without saying why.

## 2. Fields: helper text and examples
Each field gets: a label (red * when required), the input, then one gray helper line and a counter on the right where a length limit exists.

| Field | Placeholder | Helper | Counter |
|---|---|---|---|
| Tiêu đề mentor | "VD: Sinh viên năm 3 \| Web Developer \| React & Node.js" | "Hãy viết ngắn gọn về vai trò, công nghệ hoặc lĩnh vực bạn có thể tư vấn." | `0/100` |
| Giới thiệu ngắn về bản thân | "Chia sẻ hành trình học tập, dự án, kinh nghiệm hoặc những chủ đề bạn muốn hỗ trợ cho các bạn mentee." | — | `0/500` |
| Số điện thoại liên hệ | "0912 345 678" | "Dùng để mentee liên hệ đặt lịch tư vấn." | — |
| GitHub (không bắt buộc) | "https://github.com/your-username" | — | — |

- Use the real backend limits if they differ from the counters above.
- Under "Tiêu đề mentor", add a dismissible light-blue tip box "Ví dụ cho sinh viên FPT:" with clickable chips: "Sinh viên năm 4 \| AI/ML", "UI/UX Designer \| Figma", "Học bổng & trao đổi quốc tế". Clicking a chip fills the field, and the user can still edit it.
- Give experience fields similar concrete examples (dự án học tập, CLB, công nghệ, học bổng, thực tập).
- Validate on blur and on Tiếp tục, with Vietnamese messages, e.g. "Vui lòng nhập tiêu đề mentor", "Số điện thoại chưa đúng định dạng".

## 3. Right column (steps 1–3)
Card "Khi trở thành Mentor, bạn sẽ:", with 4 rows (colored icon tile + text):
- "Chia sẻ kinh nghiệm, giúp đỡ các bạn sinh viên FPT khác"
- "Xây dựng thương hiệu cá nhân và mở rộng mạng lưới"
- "Rèn luyện kỹ năng giao tiếp, mentoring và lãnh đạo"
- "Nhận huy hiệu Mentor trên SkillSwap"

Optional testimonial card: render it only from real data (API or constants filled by the team). Do NOT invent a person's name or quote. Leave a TODO with an empty constant, and hide the card when it is empty.

The illustration is optional and must use an existing project asset only. Do not use third-party logos (e.g. the FPT logo) unless the project already includes them.

Below 1024px, this column moves under the form.

## 4. Step "Minh chứng" (design image 2)
At the top, a privacy banner: light-blue box with a shield icon and a lock icon.
- Title: "Thông tin của bạn được bảo mật tuyệt đối"
- Text: "Minh chứng chỉ được sử dụng để xác thực tư cách sinh viên/cựu sinh viên và năng lực mentor. Không hiển thị công khai với người dùng khác."

Each evidence group is a collapsible section card. Its header has:
- A number badge, the title with a red *, and a gray description.
- A status on the right: green "✓ Đã hoàn thành" when the requirement is met, otherwise a counter pill such as "Đã tải 2/3 tệp".
- A chevron to collapse or expand.

Groups (use the real limits from the codebase):
1. **"Minh chứng sinh viên / Cựu sinh viên FPTU"**
   - Description: "Tải lên thẻ sinh viên, bảng điểm, bằng tốt nghiệp do Đại học FPT cấp để xác thực."
   - Requirement: exactly 1 file.
2. **"Chứng chỉ / Minh chứng chuyên môn"**
   - Description: "Tải lên chứng chỉ, dự án, chứng nhận khóa học… thể hiện năng lực chuyên môn của bạn. Cần ít nhất 1 và tối đa 3 tệp."

Inside each group, three columns (stacked on mobile):
- **Dropzone:** drag & drop + click, upload icon, "Kéo thả hoặc nhấn để tải lên", sub-text "JPG, PNG, PDF • Tối đa 15 MB". Keyboard-accessible (Enter/Space opens the picker).
- **"Ví dụ file hợp lệ:"** 3–4 small thumbnails with captions.
  - Group 1: "Thẻ sinh viên (FPTU)", "Bảng điểm có logo FPT", "Bằng tốt nghiệp (FPTU)".
  - Group 2: "Chứng chỉ IELTS", "Chứng chỉ AWS", "Chứng nhận Coursera", "Dự án cá nhân (PDF)".
  - Use placeholder images with TODO(asset) if none exist. Never use real personal documents.
- **Checklist box:** green checks.
  - Group 1, "Lưu ý:": "File rõ nét, đầy đủ thông tin", "Chấp nhận JPG, PNG, PDF", "Tối đa 15 MB mỗi tệp".
  - Group 2, "Gợi ý loại minh chứng:": "Chứng chỉ quốc tế (IELTS, AWS, …)", "Chứng nhận khóa học (Coursera, …)", "Sản phẩm/dự án cá nhân", "Giải thưởng, hoạt động chuyên môn".

Uploaded file rows, under the group:
- File-type icon, file name, size, and "Đã tải lên lúc HH:mm DD/MM/YYYY".
- Status pill: uploading shows a progress bar + %; success shows green "Đã tải lên"; error shows a red message such as "Tệp vượt quá 15 MB" or "Định dạng không hỗ trợ", with "Thử lại".
- A delete icon button with `aria-label="Xóa tệp <name>"`.

Validate type, size and count client-side before uploading. Hide the dropzone (or show the limit message) when the max count is reached.

## 5. Step "Xem lại & gửi"
Read-only summary card per step, each with a "Sửa" link that jumps back to that step. Below the summaries:

**Consent block**
- Required checkbox: "Tôi đồng ý với Điều khoản vận hành của SkillSwap" (the terms are a link that opens in a new tab or a modal).
- Under it, plain-language bullets:
  - "Tôi cam kết các thông tin và minh chứng cung cấp là chính xác."
  - "Tôi hiểu rằng hồ sơ sẽ được đội ngũ SkillSwap xét duyệt."
  - "Tôi đồng ý với chính sách bảo mật thông tin." (link)

**Submit area**
- Left: info box with a clock icon. Title "Thời gian xét duyệt dự kiến", text "Hồ sơ sẽ được xét duyệt trong [2–3] ngày làm việc. Bạn sẽ nhận thông báo qua email và trong ứng dụng khi có kết quả." Keep the duration in a config constant with a TODO.
- Right: "Lưu nháp" (outlined) and primary "Nộp hồ sơ" (send icon), full-contrast primary color.
- Below the buttons: "✓ Đã hoàn thành X/Y mục bắt buộc". If anything is missing, clicking "Nộp hồ sơ" lists what is missing and links to it, instead of using a faded disabled button.

**Done screen** (stepper step "Hoàn tất")
- Success state "Đã nộp hồ sơ!" with a status timeline: "Đã nộp" ✓ → "Đang xét duyệt" (current) → "Kết quả".
- The expected review time, a link to "Trợ giúp & hỗ trợ", and a button "Về Bảng tin".
- If the user already has a pending application, opening the flow shows this status screen instead of an empty form.

## 6. Draft saving
- "Lưu nháp": save via the API if one exists; otherwise save to localStorage, keyed by user id. Uploaded file references are included only if the backend keeps the uploaded files.
- Auto-save, debounced (~2s) after changes. Show a small "Đã lưu nháp lúc HH:mm" near the footer.
- On return, restore the draft and the step.
- Leaving with unsaved changes triggers a confirm (beforeunload / router guard).
- Clear the draft after a successful submit.

## 7. Style – match the current site
- Use the existing tokens of the Bảng tin page: font, primary blue, page background, cards (~20px radius, soft blue shadow), inputs/buttons (~12px radius).
- Icon tiles use the same light-background/dark-icon pairs as elsewhere (blue, green, orange, yellow, purple).
- Required asterisk is red. Error text is red with ≥4.5:1 contrast.
- Gray helper text must still reach ≥4.5:1 on white. Avoid very light gray.
- Targets ≥44px, with visible hover and focus-visible states.
- Use the existing icon library. No emoji in the UI.

## 8. Accessibility & quality
- Labels are tied to inputs. Errors use `aria-describedby` and `aria-invalid`.
- The stepper uses `aria-current="step"`.
- Upload progress and results are announced through an `aria-live` region.
- Full keyboard flow is possible, with no console errors.
- If tests exist, add tests for:
  - step validation blocking "Tiếp tục";
  - chip-fill of the example title;
  - character counters;
  - file validation (type / size / count);
  - draft save + restore;
  - "Nộp hồ sơ" listing missing items;
  - the pending-application status screen.

## 9. Report back
1. Files created/modified, one line each on why.
2. How each existing field was mapped to the steps, and any design field the backend lacks.
3. TODOs: assets, constants (review time, testimonial), APIs (draft, upload progress).
4. Lint / type-check / test / build results.
5. Manual test steps: fill step 1 using a chip → leave and come back (draft restored) → upload an oversized file (error) and valid files → submit with a missing item (guided) → submit successfully → status screen.

The attached images are the visual target. Where they conflict with existing components, tokens or the backend contract, stay consistent with the project and note the difference.
