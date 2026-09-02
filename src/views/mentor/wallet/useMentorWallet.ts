'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ApiClientError } from '@/models/apiClient';
import type {
  MentorPayoutProfileResponse,
  MentorPayoutProfileUpsertRequest,
  MentorWalletResponse,
  PayoutRequestCreateRequest,
  PayoutRequestResponse,
} from '@/models/auth';
import {
  payoutProfileSchema,
  payoutRequestSchema,
  type PayoutProfileFormValues,
  type PayoutRequestFormValues,
} from '@/models/schemas/mentorWalletSchema';
import { useAuth } from '@/providers/AuthProvider';
import { walletRepo } from '@/repositories/walletRepo';
import { showError, showSuccess } from '@/utils/toast';

const EMPTY_PROFILE: PayoutProfileFormValues = {
  accountHolderName: '',
  bankName: '',
  bankCode: '',
  accountNumber: '',
  isDefault: true,
};

export function useMentorWallet() {
  const { isBootstrapping } = useAuth();
  const [wallet, setWallet] = useState<MentorWalletResponse>();
  const [profiles, setProfiles] = useState<MentorPayoutProfileResponse[]>([]);
  const [requests, setRequests] = useState<PayoutRequestResponse[]>([]);
  const [editingProfile, setEditingProfile] = useState<MentorPayoutProfileResponse>();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();

  const profileForm = useForm<PayoutProfileFormValues>({
    resolver: yupResolver(payoutProfileSchema),
    defaultValues: EMPTY_PROFILE,
  });
  const withdrawForm = useForm<PayoutRequestFormValues>({
    resolver: yupResolver(payoutRequestSchema),
    defaultValues: { amountScoin: 1, payoutProfileId: '', note: '' },
  });

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      const [walletData, profileData, requestData] = await Promise.all([
        walletRepo.getMentorWallet(),
        walletRepo.listPayoutProfiles(),
        walletRepo.listPayoutRequests(),
      ]);
      setWallet(walletData);
      setProfiles(profileData);
      setRequests(requestData);
    } catch (reason) {
      setError(
        reason instanceof ApiClientError
          ? reason.message
          : 'Không thể tải thông tin ví. Vui lòng thử lại.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isBootstrapping) void refresh();
  }, [isBootstrapping, refresh]);

  const activeProfiles = useMemo(() => profiles.filter((profile) => profile.isActive), [profiles]);

  const openCreateProfile = () => {
    setEditingProfile(undefined);
    profileForm.reset({ ...EMPTY_PROFILE, isDefault: activeProfiles.length === 0 });
    setIsProfileOpen(true);
  };

  const openEditProfile = (profile: MentorPayoutProfileResponse) => {
    setEditingProfile(profile);
    profileForm.reset({
      accountHolderName: profile.accountHolderName,
      bankName: profile.bankName,
      bankCode: profile.bankCode ?? '',
      accountNumber: '',
      isDefault: profile.isDefault,
    });
    setIsProfileOpen(true);
  };

  const saveProfile = profileForm.handleSubmit(async (values) => {
    setIsSaving(true);
    const payload: MentorPayoutProfileUpsertRequest = {
      accountHolderName: values.accountHolderName.trim(),
      bankName: values.bankName.trim(),
      bankCode: values.bankCode?.trim() || undefined,
      accountNumber: values.accountNumber.trim(),
      isDefault: values.isDefault,
      isActive: editingProfile?.isActive ?? true,
    };
    try {
      if (editingProfile) {
        await walletRepo.updatePayoutProfile(editingProfile.payoutProfileId, payload);
      } else {
        await walletRepo.createPayoutProfile(payload);
      }
      showSuccess({
        title: editingProfile ? 'Đã cập nhật tài khoản' : 'Đã thêm tài khoản',
        description: 'Thông tin nhận tiền của bạn đã được lưu an toàn.',
      });
      setIsProfileOpen(false);
      await refresh();
    } catch (reason) {
      showError(reason, { title: 'Không thể lưu tài khoản nhận tiền' });
    } finally {
      setIsSaving(false);
    }
  });

  const openWithdraw = () => {
    const defaultProfile = activeProfiles.find((profile) => profile.isDefault) ?? activeProfiles[0];
    withdrawForm.reset({
      amountScoin: Math.max(1, wallet?.availableScoin ?? 1),
      payoutProfileId: defaultProfile?.payoutProfileId ?? '',
      note: '',
    });
    setIsWithdrawOpen(true);
  };

  const submitWithdraw = withdrawForm.handleSubmit(async (values) => {
    if (values.amountScoin > (wallet?.availableScoin ?? 0)) {
      withdrawForm.setError('amountScoin', { message: 'Số tiền rút vượt quá số dư khả dụng.' });
      return;
    }
    setIsSaving(true);
    const payload: PayoutRequestCreateRequest = {
      amountScoin: values.amountScoin,
      payoutProfileId: values.payoutProfileId,
      note: values.note?.trim() || undefined,
    };
    try {
      await walletRepo.createPayoutRequest(payload);
      showSuccess({
        title: 'Đã gửi yêu cầu rút tiền',
        description: 'Bạn có thể theo dõi trạng thái xử lý ngay trong ví.',
      });
      setIsWithdrawOpen(false);
      await refresh();
    } catch (reason) {
      showError(reason, { title: 'Không thể tạo yêu cầu rút tiền' });
    } finally {
      setIsSaving(false);
    }
  });

  return {
    activeProfiles,
    closeProfile: () => !isSaving && setIsProfileOpen(false),
    closeWithdraw: () => !isSaving && setIsWithdrawOpen(false),
    error,
    editingProfile,
    isLoading: isLoading || isBootstrapping,
    isProfileOpen,
    isSaving,
    isWithdrawOpen,
    openCreateProfile,
    openEditProfile,
    openWithdraw,
    profileForm,
    profiles,
    refresh,
    requests,
    saveProfile,
    submitWithdraw,
    wallet,
    withdrawForm,
  };
}
