export const walletRepo = {
  async getBalance() { return { credits: 120, updatedAt: new Date().toISOString() }; },
};
