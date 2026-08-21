/**
 * @file walletRepo.ts
 * @description Repository quản lý Ví điểm thưởng / S-Coins (Wallet Repository) giả lập.
 */

export const walletRepo = {
  /**
   * Truy xuất số dư điểm thưởng tín chỉ (credits/S-Coins) hiện tại của người dùng.
   * @returns Promise chứa số lượng tín chỉ và thời điểm cập nhật mới nhất
   */
  async getBalance() {
    return { credits: 120, updatedAt: new Date().toISOString() };
  },
};
