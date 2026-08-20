/**
 * @file studentProfileService.ts
 * @description Re-export studentProfileRepo từ tầng repositories theo cấu trúc chuẩn trong README.md.
 */

import { studentProfileRepo } from "@/repositories/studentProfileRepo";

export const studentProfileService = studentProfileRepo;
export { studentProfileRepo };
