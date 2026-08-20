/**
 * @file authService.ts
 * @description Re-export authRepo từ tầng repositories theo cấu trúc chuẩn trong README.md.
 */

import { authRepo } from "@/repositories/authRepo";

export const authService = authRepo;
export { authRepo };
