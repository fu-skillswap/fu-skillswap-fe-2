/**
 * @file authRepo.ts
 * @description Repository giả lập (Mock Repository) phục vụ cho đăng nhập môi trường demo/development.
 */

import type { LoginRequest, LoginResponse } from "@/models/dtos";

export const authRepo = {
  /**
   * Giả lập xử lý đăng nhập bằng email/mật khẩu với độ trễ 300ms.
   * @param input - Thông tin đăng nhập truyền vào
   * @returns Promise chứa thông tin user demo và access token mẫu
   */
  async login(input: LoginRequest): Promise<LoginResponse> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      accessToken: "demo-access-token",
      user: {
        id: "u-1",
        name: input.email.split("@")[0] || "Student",
        email: input.email,
        role: "mentee",
      },
    };
  },
};
