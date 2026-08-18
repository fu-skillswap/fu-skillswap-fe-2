import type { LoginRequest, LoginResponse } from "@/models/dtos";

export const authRepo = {
  async login(input: LoginRequest): Promise<LoginResponse> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      accessToken: "demo-access-token",
      user: { id: "u-1", name: input.email.split("@")[0] || "Student", email: input.email, role: "mentee" },
    };
  },
};
