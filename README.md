# SkillSwap - Univeristy-base exchanging experience platform 📚✍️

*_SkillSwap_
---

## 📋 Table of Contents

1. [👥 User Roles & Portals](#-user-roles--portals)
2. [🚀 Tech Stack](#-tech-stack)
3. [📂 Project Structure](#-project-structure)
4. [🌐 Deployment Configuration](#-deployment-configuration)

---

## 👥 User Roles & Portals

The system enforces access control using `ProtectedRoute` wrappers. Below are the primary user roles and their corresponding permissions.

| Role | Portals & Key Features |
| :--- | :--------------------- |

---

## 🚀 Tech Stack

- **Core Framework:** [Next.js 15](https://nextjs.org/) và [React 19](https://react.dev/), dùng App Router.
- **Language:** TypeScript với `strict` type checking.
- **Styling:** CSS thuần trong `src/styles/globals.css`.
- **Routing & Navigation:** Dynamic locale routes (`/vi`, `/en`) và Next.js Middleware để điều hướng locale.
- **Client state / server state:** React Context cho Auth và TanStack React Query cho query state.
- **Data access:** Repository pattern. Hiện có dữ liệu mock để chạy độc lập; có thể thay bằng backend qua `NEXT_PUBLIC_API_URL`.

## ▶️ Run locally

```bash
npm install
npm run dev
```

Mở [http://localhost:3000/vi/dashboard](http://localhost:3000/vi/dashboard). Để kiểm tra production build, chạy `npm run build`.

> Các repository hiện trả về dữ liệu demo. Khi backend sẵn sàng, cập nhật các hàm trong `src/repositories/` để dùng `apiClient` và tạo `.env.local` từ `.env.example`.

---

## 📂 Project Structure

The source code inside the `src/` directory follows a modular architecture:

```text
FOLDER STRUCTURE:

src/
├── middleware.ts                  #  Gác cổng: Check token, bẻ lái URL
├── app/                           #  TẦNG ROUTER (Nhận URL -> Gọi tới View)
│   └── [locale]/
│       ├── layout.tsx             # Bọc Providers (Auth, Theme, Query)
│       ├── (auth)/login/page.tsx  # Trỏ tới <LoginView />
│       ├── (mentee)/...           # Các route của Mentee
│       ├── mentor/...             # Các route của Mentor
│       ├── admin/...              # Các route của Admin
│       └── sysadmin/...           # Các route của Sysadmin
│
├── views/                         # TẦNG PRESENTATION (Giao diện cấp Màn hình)
│   ├── auth/
│   │   ├── LoginView.tsx          # Chỉ chứa HTML, Form UI, nhúng useLoginLogic vào
│   │   └── useLoginLogic.ts       # Khởi tạo useForm, handle submit, gọi authRepo
│   │
│   ├── mentee/
│   │   ├── post-detail/
│   │   │   ├── PostDetailView.tsx
│   │   │   └── usePostDetail.ts   # Quản lý state comment, lấy ID bài viết gọi postRepo
│   │   ├── mentor-booking/
│   │   │   ├── MentorBookingView.tsx
│   │   │   └── useMentorBooking.ts
│   │   └── ...
│   │
│   ├── mentor/
│   │   ├── schedule-manage/
│   │   │   ├── ScheduleManageView.tsx
│   │   │   └── useScheduleManage.ts
│   │   └── ...
│   └── ...
│
├── components/                    # TẦNG UI COMPONENTS (Tái sử dụng)
│   ├── ui/                        # CẤP ĐỘ 1: Dumb Components (Chỉ nhận props, hiển thị UI)
│   │   ├── Button.tsx
│   │   ├── TextField.tsx
│   │   └── Modal.tsx
│   │
│   └── domain/                    # CẤP ĐỘ 2: Component gắn nghiệp vụ (Dùng lại ở nhiều Role)
│       ├── post-card/
│       │   ├── PostCard.tsx       # Giao diện 1 thẻ bài viết
│       │   └── usePostCard.ts     # Logic riêng của thẻ (vd: bấm tim, bấm report)
│       └── booking-calendar/
│           ├── BookingCalendar.tsx
│           └── useBookingCalendar.ts
│
├── repositories/                  # TẦNG DATA ACCESS (Không chứa UI, chỉ gọi API)
│   ├── authRepo.ts                # Dùng apiClient gọi /login, /logout
│   ├── postRepo.ts
│   ├── mentorRepo.ts
│   └── walletRepo.ts
│
├── models/                        # TẦNG DOMAIN & CONFIG
│   ├── apiClient.ts               # Setup Axios, tự đính Token, bắt lỗi 401
│   ├── schemas/                   # (MỚI THÊM) Nơi chứa bộ quy tắc form của Yup/Zod
│   │   ├── authSchema.ts          # loginSchema, registerSchema
│   │   ├── postSchema.ts          # createPostSchema, commentSchema
│   │   └── ...
│   ├── entities.ts                # Định nghĩa Interface cốt lõi (User, Post, Booking)
│   └── dtos.ts                    # Cấu trúc Request/Response từ Backend
│
├── providers/                     # GLOBAL CONTEXT
│   ├── AuthProvider.tsx           # Lưu thông tin User & Role toàn cục
│   └── QueryProvider.tsx          # Setup React Query
│
└── styles/                        # TOKENS & CSS
    └── globals.cs

```
