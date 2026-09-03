/**
 * @file walletRepo.ts
 * @description Repository ví thu nhập, tài khoản nhận tiền và yêu cầu rút tiền của mentor.
 */

import { apiClient } from '@/models/apiClient';
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
  createPayoutRequest: (data: PayoutRequestCreateRequest): Promise<PayoutRequestResponse> =>
    apiClient<PayoutRequestResponse>('/api/mentor/payout-requests', {
      method: 'POST',
      data,
    }),
};
