/**
 * @file walletRepo.ts
 * @description Repository ví thu nhập, tài khoản nhận tiền và yêu cầu rút tiền của mentor.
 */

import { apiClient } from '@/models/apiClient';
import { newIdempotencyKey } from '@/repositories/bookingRepo';
import type {
  MentorPayoutProfileResponse,
  MentorPayoutProfileUpsertRequest,
  MentorWalletResponse,
  PayoutRequestCreateRequest,
  PayoutRequestResponse,
} from '@/models/auth';

export const walletRepo = {
  getMentorWallet: (): Promise<MentorWalletResponse> =>
    apiClient<MentorWalletResponse>('/api/me/mentor-wallet'),
  listPayoutProfiles: (): Promise<MentorPayoutProfileResponse[]> =>
    apiClient<MentorPayoutProfileResponse[]>('/api/mentor/payout-profiles'),
  createPayoutProfile: (
    data: MentorPayoutProfileUpsertRequest,
  ): Promise<MentorPayoutProfileResponse> =>
    apiClient<MentorPayoutProfileResponse>('/api/mentor/payout-profiles', {
      method: 'POST',
      data,
    }),
  updatePayoutProfile: (
    payoutProfileId: string,
    data: MentorPayoutProfileUpsertRequest,
  ): Promise<MentorPayoutProfileResponse> =>
    apiClient<MentorPayoutProfileResponse>(`/api/mentor/payout-profiles/${payoutProfileId}`, {
      method: 'PUT',
      data,
    }),
  listPayoutRequests: (): Promise<PayoutRequestResponse[]> =>
    apiClient<PayoutRequestResponse[]>('/api/mentor/payout-requests'),
  /**
   * The BE rejects this call without an `Idempotency-Key` (400 IDEMPOTENCY_KEY_REQUIRED). Reuse the
   * same key when retrying the same request so a slow network never creates two withdrawals.
   */
  createPayoutRequest: (
    data: PayoutRequestCreateRequest,
    idempotencyKey: string = newIdempotencyKey(),
  ): Promise<PayoutRequestResponse> =>
    apiClient<PayoutRequestResponse>('/api/mentor/payout-requests', {
      method: 'POST',
      data,
      headers: { 'Idempotency-Key': idempotencyKey },
    }),
};
