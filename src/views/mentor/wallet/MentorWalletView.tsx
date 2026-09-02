/**
 * @file MentorWalletView.tsx
 * @description Dashboard ví thu nhập, tài khoản nhận tiền và yêu cầu rút của mentor.
 */

'use client';

import {
  ArrowDownToLine,
  ArrowUpRight,
  Banknote,
  Clock3,
  FileClock,
  Info,
  Landmark,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useMenteeShell } from '@/components/domain/mentee-shell/MenteeShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Modal } from '@/components/ui/Modal';
import { Tabs } from '@/components/ui/Tabs';
import { TextArea } from '@/components/ui/TextArea';
import { TextField } from '@/components/ui/TextField';
import type {
  PayoutRequestResponse,
  PayoutRequestStatus,
  WalletEntryType,
  WalletTransactionResponse,
} from '@/models/auth';
import { useAuth } from '@/providers/AuthProvider';
import { useMentorWallet } from './useMentorWallet';

const WALLET_NOTICE_VERSION = 'v1';

const STATUS_LABELS: Record<PayoutRequestStatus, string> = {
  REQUESTED: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  PAID: 'Đã chuyển',
  CANCELLED: 'Đã hủy',
};

const ENTRY_LABELS: Record<WalletEntryType, string> = {
  ISSUE: 'Ghi nhận thu nhập',
  RESERVE: 'Tạm giữ',
  CONSUME: 'Đã sử dụng',
  RELEASE: 'Hoàn giữ',
  REFUND: 'Hoàn tiền',
  ADJUSTMENT: 'Điều chỉnh',
  HOLD: 'Đang giữ',
  PAID_OUT: 'Đã rút',
  COMMISSION: 'Phí nền tảng',
  VOID: 'Đã hủy',
};

function formatScoin(value: number) {
  return `${new Intl.NumberFormat('vi-VN').format(value)} S-coins`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function MentorWalletView() {
  const { setHeaderTitle } = useMenteeShell();
  const { user } = useAuth();
  const state = useMentorWallet();
  const [activeTab, setActiveTab] = useState<'transactions' | 'payouts'>('transactions');
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const defaultProfile = useMemo(
    () => state.activeProfiles.find((profile) => profile.isDefault) ?? state.activeProfiles[0],
    [state.activeProfiles],
  );
  const pendingRequests = state.requests.filter(
    (request) => request.status === 'REQUESTED' || request.status === 'APPROVED',
  ).length;
  const canWithdraw = Boolean(
    state.activeProfiles.length && (state.wallet?.availableScoin ?? 0) > 0,
  );

  useEffect(() => {
    setHeaderTitle('Ví S-coins');
    return () => setHeaderTitle(undefined);
  }, [setHeaderTitle]);

  useEffect(() => {
    if (!user?.publicId) return;
    const storageKey = `skillswap:wallet-notice:${WALLET_NOTICE_VERSION}:${user.publicId}`;
    setIsNoticeOpen(localStorage.getItem(storageKey) !== 'acknowledged');
  }, [user?.publicId]);

  const acknowledgeNotice = () => {
    if (user?.publicId) {
      localStorage.setItem(
        `skillswap:wallet-notice:${WALLET_NOTICE_VERSION}:${user.publicId}`,
        'acknowledged',
      );
    }
    setIsNoticeOpen(false);
  };

  if (state.isLoading) return <WalletSkeleton />;

  return (
    <section className="mx-auto max-w-7xl space-y-3.5">
      {state.error && (
        <div
          className="flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-danger-soft p-3 text-xs font-medium text-danger"
          role="alert"
        >
          <span>{state.error}</span>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<RefreshCw />}
            onClick={() => void state.refresh()}
          >
            Thử lại
          </Button>
        </div>
      )}

      <header className="relative overflow-hidden rounded-xl border border-primary-border/50 bg-gradient-to-r from-primary to-blue-500 p-4 text-white shadow-lg shadow-primary/15 sm:p-5">
        <div
          className="absolute -right-10 -top-20 h-48 w-48 rounded-full bg-white/10"
          aria-hidden="true"
        />
        <div className="relative flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
              <WalletCards className="h-6 w-6" />
            </span>
            <div>
              <p className="m-0 text-[11px] font-semibold text-blue-100">Số dư khả dụng</p>
              <h1 className="my-0.5 text-2xl font-extrabold tracking-tight sm:text-3xl">
                {formatScoin(state.wallet?.availableScoin ?? 0)}
              </h1>
              <p className="m-0 flex items-center gap-1.5 text-[10px] text-blue-100">
                <ShieldCheck className="h-3.5 w-3.5" /> Cập nhật trực tiếp từ ví settlement
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              className="border-white/60 bg-white/15 text-white hover:bg-white/25"
              leftIcon={<Landmark />}
              onClick={state.openCreateProfile}
            >
              Thêm tài khoản
            </Button>
            <Button
              className={
                canWithdraw
                  ? 'border-white bg-white text-primary hover:bg-blue-50'
                  : 'border-white/30 bg-white/15 text-white'
              }
              leftIcon={<ArrowDownToLine />}
              disabled={!canWithdraw}
              title={
                !state.activeProfiles.length
                  ? 'Cần thêm tài khoản nhận tiền trước khi rút'
                  : !state.wallet?.availableScoin
                    ? 'Chưa có số dư khả dụng'
                    : undefined
              }
              onClick={state.openWithdraw}
            >
              {canWithdraw ? 'Rút S-coins' : 'Chưa thể rút'}
            </Button>
          </div>
        </div>
      </header>

      <section className="grid overflow-hidden rounded-xl border border-border-light bg-white shadow-xs md:grid-cols-3 md:divide-x md:divide-border-light">
        <SummaryCard
          icon={<WalletCards />}
          label="Số dư có thể rút"
          value={formatScoin(state.wallet?.availableScoin ?? 0)}
          tone="blue"
        />
        <SummaryCard
          icon={<Landmark />}
          label="Tài khoản mặc định"
          value={defaultProfile?.bankName ?? 'Chưa thiết lập'}
          detail={defaultProfile?.accountNumberMasked ?? 'Thêm tài khoản để nhận tiền'}
          action={
            <button
              type="button"
              className="cursor-pointer border-none bg-transparent p-0 text-[11px] font-bold text-primary"
              onClick={() =>
                defaultProfile ? state.openEditProfile(defaultProfile) : state.openCreateProfile()
              }
            >
              {defaultProfile ? 'Quản lý' : 'Thêm ngay'}
            </button>
          }
        />
        <SummaryCard
          icon={<FileClock />}
          label="Yêu cầu đang xử lý"
          value={`${pendingRequests} yêu cầu`}
          detail={pendingRequests ? 'Đang chờ hệ thống xử lý' : 'Không có yêu cầu chờ xử lý'}
          tone="emerald"
        />
      </section>

      <div className="overflow-hidden rounded-xl border border-border-light bg-white shadow-xs">
        <div className="flex flex-col justify-between gap-3 border-b border-border-light px-4 py-3 sm:flex-row sm:items-center sm:px-5">
          <Tabs
            activeTab={activeTab}
            onChange={(tab) => setActiveTab(tab === 'payouts' ? 'payouts' : 'transactions')}
            ariaLabel="Nội dung ví"
            tabs={[
              {
                id: 'transactions',
                label: 'Giao dịch gần đây',
                icon: <ReceiptText className="h-4 w-4" />,
              },
              {
                id: 'payouts',
                label: 'Yêu cầu rút',
                icon: <FileClock className="h-4 w-4" />,
                badge: state.requests.length ? (
                  <span className="rounded-full bg-primary-light px-1.5 py-0.5 text-[10px] text-primary">
                    {state.requests.length}
                  </span>
                ) : undefined,
              },
            ]}
          />
          <span className="text-[11px] text-text-muted">
            {activeTab === 'transactions'
              ? '15 biến động mới nhất'
              : 'Theo dõi tiến trình chuyển tiền'}
          </span>
        </div>
        <div className="max-h-[285px] divide-y divide-border-light overflow-y-auto">
          {activeTab === 'transactions' ? (
            state.wallet?.recentTransactions?.length ? (
              state.wallet.recentTransactions.map((transaction) => (
                <TransactionRow key={transaction.id} transaction={transaction} />
              ))
            ) : (
              <EmptyLine
                icon={<ReceiptText />}
                title="Chưa có giao dịch"
                description="Thu nhập và các khoản rút sẽ xuất hiện tại đây."
              />
            )
          ) : state.requests.length ? (
            state.requests.map((request) => (
              <PayoutRow key={request.payoutRequestId} request={request} />
            ))
          ) : (
            <EmptyLine
              icon={<FileClock />}
              title="Chưa có yêu cầu rút"
              description="Yêu cầu mới sẽ được cập nhật trạng thái tại đây."
            />
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsNoticeOpen(true)}
        className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50/90 px-4 py-3 text-left text-xs font-bold text-blue-950 transition-colors hover:border-primary-border hover:bg-blue-100/70"
      >
        <span className="flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" /> Quy định và bảo mật khi sử dụng ví
        </span>
        <span className="text-[11px] font-semibold text-primary">Xem lại</span>
      </button>

      <WalletNoticeModal open={isNoticeOpen} onAcknowledge={acknowledgeNotice} />
      <PayoutProfileModal state={state} />
      <WithdrawModal state={state} />
    </section>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  detail,
  action,
  tone = 'slate',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string;
  action?: React.ReactNode;
  tone?: 'slate' | 'blue' | 'emerald';
}) {
  const toneClass =
    tone === 'blue'
      ? 'bg-blue-50 text-primary'
      : tone === 'emerald'
        ? 'bg-emerald-50 text-emerald-600'
        : 'bg-surface-subtle text-text-secondary';
  return (
    <article className="flex min-h-20 items-center gap-3 border-b border-border-light bg-white p-3.5 last:border-b-0 md:border-b-0">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg [&>svg]:h-5 [&>svg]:w-5 ${toneClass}`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
          {label}
        </p>
        <strong className="mt-0.5 block truncate text-sm text-text-main">{value}</strong>
        {detail && (
          <span className="mt-0.5 block truncate text-[10px] text-text-muted">{detail}</span>
        )}
      </div>
      {action}
    </article>
  );
}

function TransactionRow({ transaction }: { transaction: WalletTransactionResponse }) {
  const positive = transaction.balanceEffectScoin > 0;
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-subtle/60 sm:px-5">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${positive ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-primary'}`}
      >
        {positive ? <ArrowDownToLine className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <strong className="block truncate text-xs">
          {transaction.memo?.trim() || ENTRY_LABELS[transaction.entryType]}
        </strong>
        <span className="text-[10px] text-text-muted">{formatDateTime(transaction.createdAt)}</span>
      </div>
      <strong
        className={`whitespace-nowrap text-xs ${positive ? 'text-emerald-600' : 'text-text-main'}`}
      >
        {positive ? '+' : ''}
        {formatScoin(transaction.balanceEffectScoin)}
      </strong>
    </div>
  );
}

function PayoutRow({ request }: { request: PayoutRequestResponse }) {
  const variant =
    request.status === 'PAID'
      ? 'success'
      : request.status === 'REJECTED'
        ? 'danger'
        : request.status === 'APPROVED'
          ? 'info'
          : 'neutral';
  return (
    <div className="flex flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:px-5">
      <div className="min-w-0 flex-1">
        <strong className="text-xs">{formatScoin(request.amountScoin)}</strong>
        <p className="m-0 mt-0.5 truncate text-[10px] text-text-muted">
          {request.bankNameSnapshot} · {request.bankAccountNumberMaskedSnapshot} ·{' '}
          {formatDateTime(request.requestedAt)}
        </p>
        {request.status === 'REJECTED' && request.adminNote && (
          <p className="mb-0 mt-1 text-[10px] text-danger">Lý do: {request.adminNote}</p>
        )}
      </div>
      <Badge variant={variant}>{STATUS_LABELS[request.status]}</Badge>
    </div>
  );
}

function EmptyLine({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center px-4 py-6 text-center text-text-muted">
      <span className="mb-2 [&>svg]:h-7 [&>svg]:w-7">{icon}</span>
      <strong className="text-xs text-text-main">{title}</strong>
      <span className="mt-1 text-[11px]">{description}</span>
    </div>
  );
}

function WalletNoticeModal({ open, onAcknowledge }: { open: boolean; onAcknowledge: () => void }) {
  return (
    <Modal open={open} onClose={() => undefined} hideHeader className="max-w-2xl !rounded-lg">
      <div className="space-y-4">
        <header className="flex items-center gap-3.5 border-b border-border-light pb-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-white shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0 text-left">
            <p className="m-0 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
              Lưu ý quan trọng
            </p>
            <h2 className="mb-0 mt-1 text-lg font-extrabold tracking-tight text-text-main">
              Trước khi sử dụng Ví S-coins
            </h2>
          </div>
        </header>

        <div className="grid gap-3 text-xs leading-relaxed text-text-secondary sm:grid-cols-2">
          <NoticeItem number="01" title="Bản chất số dư">
            S-coins trong ví mentor là số dư thu nhập nội bộ có thể dùng để tạo yêu cầu rút; không
            phải tài khoản tiền gửi ngân hàng.
          </NoticeItem>
          <NoticeItem number="02" title="Tài khoản nhận tiền">
            Chỉ sử dụng tài khoản ngân hàng chính chủ và kiểm tra kỹ tên chủ tài khoản, ngân hàng,
            số tài khoản trước khi xác nhận.
          </NoticeItem>
          <NoticeItem number="03" title="Quy trình xử lý">
            Yêu cầu rút cần được hệ thống duyệt. Trạng thái và lý do từ chối, nếu có, được lưu trong
            mục Yêu cầu rút.
          </NoticeItem>
          <NoticeItem number="04" title="Bảo mật và đối soát">
            Số tài khoản được che trên giao diện; thông tin tại thời điểm gửi yêu cầu được ghi nhận
            để phục vụ đối soát.
          </NoticeItem>
        </div>

        <div className="border-l-2 border-primary bg-blue-50/70 px-3 py-2.5 text-[11px] leading-relaxed text-blue-950">
          Khi tiếp tục, bạn xác nhận đã đọc và hiểu các lưu ý trên. Nội dung này chỉ tự động hiển
          thị một lần; bạn luôn có thể mở lại từ cuối trang ví.
        </div>

        <div className="flex items-center justify-end border-t border-border-light pt-4">
          <Button className="min-w-52" onClick={onAcknowledge}>
            Tôi đã đọc và hiểu
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function NoticeItem({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-28 grid-cols-[30px_1fr] gap-3 rounded-md border border-border-light bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-[0_4px_14px_rgba(15,23,42,0.09)]">
      <span className="flex h-7 w-7 items-center justify-center rounded bg-blue-50 text-[10px] font-extrabold text-primary">
        {number}
      </span>
      <div>
        <strong className="block text-xs text-text-main">{title}</strong>
        <p className="mb-0 mt-1 text-[11px] leading-relaxed text-text-muted">{children}</p>
      </div>
    </div>
  );
}

function PayoutProfileModal({ state }: { state: ReturnType<typeof useMentorWallet> }) {
  const errors = state.profileForm.formState.errors;
  return (
    <Modal
      open={state.isProfileOpen}
      onClose={state.closeProfile}
      title={state.editingProfile ? 'Cập nhật tài khoản nhận tiền' : 'Thêm tài khoản nhận tiền'}
      className="max-w-xl !rounded-xl"
    >
      <form className="space-y-4" onSubmit={state.saveProfile} noValidate>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900">
          Tài khoản nên thuộc chính chủ mentor. Khi chỉnh sửa, vui lòng nhập lại đầy đủ số tài khoản
          để xác nhận thay đổi.
        </div>
        <TextField
          label="Tên chủ tài khoản"
          required
          placeholder="NGUYEN VAN A"
          autoComplete="name"
          error={errors.accountHolderName?.message}
          {...state.profileForm.register('accountHolderName')}
        />
        <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
          <TextField
            label="Tên ngân hàng"
            required
            placeholder="Ví dụ: Vietcombank"
            error={errors.bankName?.message}
            {...state.profileForm.register('bankName')}
          />
          <TextField
            label="Mã ngân hàng"
            placeholder="VCB"
            error={errors.bankCode?.message}
            {...state.profileForm.register('bankCode')}
          />
        </div>
        <TextField
          label="Số tài khoản"
          required
          inputMode="numeric"
          autoComplete="off"
          placeholder="Nhập số tài khoản"
          error={errors.accountNumber?.message}
          {...state.profileForm.register('accountNumber')}
        />
        <Checkbox
          label="Đặt làm tài khoản nhận tiền mặc định"
          {...state.profileForm.register('isDefault')}
        />
        <footer className="flex justify-end gap-2 border-t border-border-light pt-4">
          <Button type="button" variant="outline" onClick={state.closeProfile}>
            Hủy
          </Button>
          <Button type="submit" loading={state.isSaving}>
            Lưu tài khoản
          </Button>
        </footer>
      </form>
    </Modal>
  );
}

function WithdrawModal({ state }: { state: ReturnType<typeof useMentorWallet> }) {
  const errors = state.withdrawForm.formState.errors;
  const selectedId = state.withdrawForm.watch('payoutProfileId');
  const selected = state.activeProfiles.find((profile) => profile.payoutProfileId === selectedId);
  return (
    <Modal
      open={state.isWithdrawOpen}
      onClose={state.closeWithdraw}
      title="Yêu cầu rút tiền"
      className="max-w-xl !rounded-xl"
    >
      <form className="space-y-4" onSubmit={state.submitWithdraw} noValidate>
        <div className="flex items-center justify-between rounded-2xl bg-blue-50 p-4">
          <span className="text-xs text-text-secondary">Số dư khả dụng</span>
          <strong className="text-base text-primary">
            {formatScoin(state.wallet?.availableScoin ?? 0)}
          </strong>
        </div>
        <TextField
          label="Số S-coins muốn rút"
          required
          type="number"
          min={1}
          max={state.wallet?.availableScoin ?? 0}
          error={errors.amountScoin?.message}
          {...state.withdrawForm.register('amountScoin', { valueAsNumber: true })}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="payout-profile" className="text-xs font-semibold text-text-secondary">
            Tài khoản nhận tiền <span className="text-danger">*</span>
          </label>
          <select
            id="payout-profile"
            className={`h-10 w-full rounded-xl border bg-white px-3.5 text-xs outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 ${errors.payoutProfileId ? 'border-danger' : 'border-border-color'}`}
            {...state.withdrawForm.register('payoutProfileId')}
          >
            <option value="">Chọn tài khoản</option>
            {state.activeProfiles.map((profile) => (
              <option key={profile.payoutProfileId} value={profile.payoutProfileId}>
                {profile.bankName} · {profile.accountNumberMasked}
              </option>
            ))}
          </select>
          {errors.payoutProfileId && (
            <p className="m-0 text-[11px] font-medium text-danger">
              {errors.payoutProfileId.message}
            </p>
          )}
        </div>
        {selected && (
          <div className="flex items-center gap-3 rounded-xl border border-border-light bg-surface-subtle p-3">
            <Landmark className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <strong className="text-xs">{selected.accountHolderName}</strong>
              <p className="m-0 mt-0.5 text-[11px] text-text-muted">
                {selected.bankName} · {selected.accountNumberMasked}
              </p>
            </div>
          </div>
        )}
        <TextArea
          label="Ghi chú"
          rows={2}
          placeholder="Thông tin bổ sung (không bắt buộc)"
          error={errors.note?.message}
          {...state.withdrawForm.register('note')}
        />
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-[11px] leading-relaxed text-blue-900">
          <strong className="flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5" /> Quy trình xử lý
          </strong>
          <p className="mb-0 mt-1">
            Yêu cầu được ghi nhận ở trạng thái Chờ duyệt, sau đó có thể Đã duyệt, Đã chuyển hoặc Từ
            chối. Tài khoản nhận tiền được lưu dạng bản chụp tại thời điểm gửi.
          </p>
        </div>
        <footer className="flex justify-end gap-2 border-t border-border-light pt-4">
          <Button type="button" variant="outline" onClick={state.closeWithdraw}>
            Hủy
          </Button>
          <Button type="submit" leftIcon={<Banknote />} loading={state.isSaving}>
            Xác nhận yêu cầu
          </Button>
        </footer>
      </form>
    </Modal>
  );
}

function WalletSkeleton() {
  return (
    <div className="space-y-3" aria-label="Đang tải ví">
      <div className="h-32 animate-pulse rounded-3xl bg-blue-200/70" />
      <div className="grid gap-3 md:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-20 animate-pulse rounded-2xl bg-white/80" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-3xl bg-white/80" />
    </div>
  );
}
