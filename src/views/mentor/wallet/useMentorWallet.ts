'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { newIdempotencyKey } from '@/repositories/bookingRepo';
import { walletRepo } from '@/repositories/walletRepo';
import { getUserFriendlyErrorMessage, showError, showSuccess } from '@/utils/toast';

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
  /** Last request created in this visit; the view opens the "Yêu cầu rút" tab on it. */
  const [lastPayoutRequest, setLastPayoutRequest] = useState<PayoutRequestResponse>();
  /** One key per withdrawal attempt: kept across retries of that attempt, renewed on open. */
  const withdrawKeyRef = useRef<string>('');

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
        getUserFriendlyErrorMessage(reason, 'Không thể tải thông tin ví. Vui lòng thử lại.'),
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
    withdrawKeyRef.current = newIdempotencyKey();
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
    const profile = activeProfiles.find((item) => item.payoutProfileId === values.payoutProfileId);
    if (!withdrawKeyRef.current) withdrawKeyRef.current = newIdempotencyKey();
    try {
      const created = await walletRepo.createPayoutRequest(payload, withdrawKeyRef.current);
      withdrawKeyRef.current = '';
      const amount = new Intl.NumberFormat('vi-VN').format(values.amountScoin);
      const bank = created?.bankNameSnapshot ?? profile?.bankName;
      const account = created?.bankAccountNumberMaskedSnapshot ?? profile?.accountNumberMasked;
      showSuccess({
        title: `Đã gửi yêu cầu rút ${amount} S-coins`,
        description: `Tiền sẽ chuyển về ${[bank, account].filter(Boolean).join(' · ')} sau khi SkillSwap duyệt. Theo dõi trong tab "Yêu cầu rút".`,
      });
      if (created?.payoutRequestId) setLastPayoutRequest(created);
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
    lastPayoutRequest,
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
