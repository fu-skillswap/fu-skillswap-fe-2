/**
 * @file SettingsSupportView.tsx
 * @description Màn hình cài đặt tài khoản và trung tâm trợ giúp dành cho Mentee.
 */

'use client';

import { Button } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/SelectField';
import { useMenteeShell } from '@/components/domain/mentee-shell/MenteeShell';
import { bookingRepo } from '@/repositories/bookingRepo';
import { studentProfileRepo } from '@/repositories/studentProfileRepo';
import { useAuth } from '@/providers/AuthProvider';
import { showInfo, showSuccess } from '@/utils/toast';
import type { MentorBookingResponse, StudentProfileResponse } from '@/models/auth';
import {
  AlertTriangle,
  Bell,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  CreditCard,
  Flag,
  Globe2,
  HelpCircle,
  ImagePlus,
  Mail,
  MessageCircle,
  Search,
  Settings2,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  FAQ_CATEGORIES,
  SETTINGS_FAQS,
  SUPPORT_CONFIG,
  type SettingsSection,
  type SettingsTab,
} from './settingsSupport.constants';

const SETTINGS_TABS: Array<{ value: SettingsTab; label: string }> = [
  { value: 'account', label: 'Tài khoản' },
  { value: 'notifications', label: 'Thông báo' },
  { value: 'privacy', label: 'Quyền riêng tư' },
  { value: 'language', label: 'Ngôn ngữ & múi giờ' },
  { value: 'booking', label: 'Booking & thanh toán' },
];

const validSections = new Set<SettingsSection>(['settings', 'help']);
const validTabs = new Set<SettingsTab>(SETTINGS_TABS.map(({ value }) => value));

function SwitchControl({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 min-w-12 shrink-0 cursor-pointer items-center overflow-hidden rounded-full border border-solid border-transparent p-0 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${checked ? 'bg-primary' : 'bg-slate-300'}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[68px] flex-col justify-between gap-3 border-t border-solid border-border-light py-3.5 first:border-t-0 sm:flex-row sm:items-center">
      <div className="min-w-0">
        <p className="m-0 text-sm font-bold text-text-main">{title}</p>
        {description && (
          <p className="mb-0 mt-1 text-xs leading-5 text-text-secondary">{description}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2 self-end sm:self-auto">
        {children}
      </div>
    </div>
  );
}

function SettingsCard({
  icon: Icon,
  tone,
  title,
  description,
  children,
}: {
  icon: typeof UserRound;
  tone: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[20px] border border-solid border-border-light bg-white p-5 shadow-[0_4px_18px_rgba(16,50,90,0.045)] sm:p-6">
      <header className="mb-4 flex items-center gap-3">
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-[14px] ${tone}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="m-0 text-base font-extrabold text-text-main sm:text-lg">{title}</h2>
          <p className="mb-0 mt-1 text-xs text-text-secondary">{description}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

export function SettingsSupportView() {
  const params = useParams();
  const locale = (params?.locale as string) || 'vi';
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setHeaderTitle } = useMenteeShell();
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfileResponse | null>(null);
  const [bookings, setBookings] = useState<MentorBookingResponse[]>([]);

  const sectionParam = searchParams.get('section') as SettingsSection | null;
  const tabParam = searchParams.get('tab') as SettingsTab | null;
  const section = sectionParam && validSections.has(sectionParam) ? sectionParam : 'settings';
  const tab = tabParam && validTabs.has(tabParam) ? tabParam : 'account';

  useEffect(() => {
    setHeaderTitle('Cài đặt & hỗ trợ');
    return () => setHeaderTitle(undefined);
  }, [setHeaderTitle]);

  useEffect(() => {
    void studentProfileRepo
      .get()
      .then(setProfile)
      .catch(() => setProfile(null));
    void bookingRepo
      .listForMentee()
      .then((result) => setBookings(result.content ?? []))
      .catch(() => setBookings([]));
  }, []);

  const updateQuery = (nextSection: SettingsSection, nextTab = tab) => {
    const query = new URLSearchParams(searchParams.toString());
    query.set('section', nextSection);
    if (nextSection === 'settings') query.set('tab', nextTab);
    else query.delete('tab');
    router.push(`/${locale}/settings?${query.toString()}`);
  };

  return (
    <section className="mx-auto w-full max-w-[1240px] pb-20">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <main className="min-w-0">
          <header className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <h1 className="m-0 text-2xl font-extrabold tracking-tight text-text-main sm:text-[30px]">
                {section === 'settings' ? 'Cài đặt' : 'Trợ giúp & hỗ trợ'}
              </h1>
              <p className="mb-0 mt-1.5 text-sm text-text-secondary">
                {section === 'settings'
                  ? 'Quản lý tài khoản, thông báo và quyền riêng tư của bạn.'
                  : 'Tìm câu trả lời nhanh hoặc gửi yêu cầu cho đội ngũ SkillSwap.'}
              </p>
            </div>
            <div
              className="inline-flex w-fit rounded-xl bg-surface-subtle p-1"
              aria-label="Khu vực cài đặt"
            >
              <button
                type="button"
                onClick={() => updateQuery('settings', tab)}
                className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border-none px-3 text-xs font-bold transition ${section === 'settings' ? 'bg-white text-primary shadow-xs' : 'bg-transparent text-text-secondary'}`}
              >
                <Settings2 className="h-4 w-4" aria-hidden="true" /> Cài đặt
              </button>
              <button
                type="button"
                onClick={() => updateQuery('help')}
                className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border-none px-3 text-xs font-bold transition ${section === 'help' ? 'bg-white text-primary shadow-xs' : 'bg-transparent text-text-secondary'}`}
              >
                <CircleHelp className="h-4 w-4" aria-hidden="true" /> Trợ giúp & hỗ trợ
              </button>
            </div>
          </header>

          {section === 'settings' ? (
            <SettingsArea
              tab={tab}
              locale={locale}
              profile={profile}
              isMentor={Boolean(user?.roles.includes('MENTOR'))}
              onTabChange={(nextTab) => updateQuery('settings', nextTab)}
            />
          ) : (
            <HelpArea bookings={bookings} />
          )}
        </main>

        <SupportRail section={section} onOpenHelp={() => updateQuery('help')} />
      </div>
    </section>
  );
}

function SettingsArea({
  tab,
  locale,
  profile,
  isMentor,
  onTabChange,
}: {
  tab: SettingsTab;
  locale: string;
  profile: StudentProfileResponse | null;
  isMentor: boolean;
  onTabChange: (tab: SettingsTab) => void;
}) {
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Nhóm cài đặt">
        {SETTINGS_TABS.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={tab === item.value}
            onClick={() => onTabChange(item.value)}
            className={`min-h-10 cursor-pointer rounded-xl border border-solid px-3.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${tab === item.value ? 'border-primary bg-primary text-white' : 'border-border-light bg-white text-text-secondary hover:border-primary-border hover:text-primary'}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === 'account' && (
        <AccountSettings locale={locale} profile={profile} isMentor={isMentor} />
      )}
      {tab === 'notifications' && <NotificationSettings />}
      {tab === 'privacy' && <PrivacySettings profile={profile} />}
      {tab === 'language' && <LanguageSettings />}
      {tab === 'booking' && <BookingSettings locale={locale} />}
    </>
  );
}

function AccountSettings({
  locale,
  profile,
  isMentor,
}: {
  locale: string;
  profile: StudentProfileResponse | null;
  isMentor: boolean;
}) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="space-y-4">
      <SettingsCard
        icon={UserRound}
        tone="bg-primary-light text-primary"
        title="Tài khoản & đăng nhập"
        description="Bạn đăng nhập bằng tài khoản Google"
      >
        <SettingRow
          title="Gmail đăng nhập"
          description={`${profile?.email || 'Đang cập nhật email'} · Được quản lý bởi Google`}
        >
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700">
            ✓ Đã xác minh
          </span>
        </SettingRow>
        <SettingRow
          title="Hồ sơ của tôi"
          description="Tên hiển thị, ảnh đại diện, trường học, kỹ năng"
        >
          <button
            type="button"
            aria-label="Mở hồ sơ của tôi"
            onClick={() => router.push(`/${locale}/profile`)}
            className="grid h-11 w-11 cursor-pointer place-items-center rounded-xl border-none bg-transparent text-primary hover:bg-primary-light"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </SettingRow>
        <SettingRow
          title="Số điện thoại"
          description="Chưa thêm · để mentor liên hệ khi buổi học thay đổi"
        >
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              // TODO(api): Bổ sung số điện thoại khi API hồ sơ Mentee hỗ trợ field này.
              showInfo('Tính năng số điện thoại đang được hoàn thiện.');
            }}
          >
            Thêm số
          </Button>
        </SettingRow>
        <SettingRow
          title="Vai trò"
          description={
            isMentor
              ? 'Mentor'
              : 'Mentee · Khi trở thành mentor, mục Lịch nhận booking sẽ xuất hiện tại đây'
          }
        >
          {!isMentor && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/${locale}/mentor-registration`)}
            >
              Trở thành mentor
            </Button>
          )}
        </SettingRow>
        <SettingRow
          title="Thiết bị đang đăng nhập"
          description="Trình duyệt hiện tại · Đang hoạt động"
        >
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              // TODO(api): Thu hồi các phiên khác khi backend hỗ trợ quản lý session.
              showInfo('Chưa thể đăng xuất thiết bị khác trong phiên bản hiện tại.');
            }}
          >
            Đăng xuất thiết bị khác
          </Button>
        </SettingRow>
      </SettingsCard>

      <section className="rounded-[20px] border border-solid border-red-200 bg-white p-5 shadow-[0_4px_18px_rgba(16,50,90,0.035)] sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-red-50 text-red-700">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="m-0 text-base font-extrabold text-text-main">Xóa tài khoản</h2>
            <p className="mb-0 mt-1 text-xs leading-5 text-text-secondary">
              Xóa vĩnh viễn hồ sơ, bài viết và lịch sử booking. Không thể hoàn tác.
            </p>
          </div>
        </div>
        {!confirmDelete ? (
          <Button
            className="mt-4"
            size="sm"
            variant="outline"
            onClick={() => setConfirmDelete(true)}
          >
            Xóa tài khoản
          </Button>
        ) : (
          <div className="mt-4 rounded-xl bg-red-50 p-4" role="alert">
            <p className="m-0 text-sm font-semibold leading-6 text-red-900">
              Bạn chắc chắn muốn xóa? Các buổi booking sắp tới sẽ bị hủy và mentor sẽ được thông
              báo.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                autoFocus
                onClick={() => setConfirmDelete(false)}
                className="h-9 cursor-pointer rounded-xl border border-solid border-primary-border bg-white px-3.5 text-xs font-bold text-primary outline-none hover:bg-primary-light focus-visible:ring-4 focus-visible:ring-primary/20"
              >
                Giữ tài khoản
              </button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  // TODO(api): Xóa tài khoản sau khi backend hỗ trợ kiểm tra booking liên quan.
                  showInfo('Yêu cầu xóa tài khoản chưa được gửi vì API chưa hỗ trợ.');
                }}
              >
                Xóa vĩnh viễn
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function NotificationSettings() {
  const [settings, setSettings] = useState({
    bookingReminder: true,
    newMessage: true,
    postReply: true,
    mentorSuggestion: false,
    gmailCopy: false,
  });
  const [reminder, setReminder] = useState('60');
  const toggle = (key: keyof typeof settings, value: boolean) => {
    // TODO(api): Lưu notification preferences khi backend cung cấp endpoint.
    setSettings((current) => ({ ...current, [key]: value }));
    showSuccess({ title: 'Đã lưu' });
  };
  return (
    <SettingsCard
      icon={Bell}
      tone="bg-orange-50 text-orange-600"
      title="Thông báo"
      description="Thay đổi được lưu tự động"
    >
      <SettingRow title="Nhắc lịch booking" description="Nhắc trước buổi học với mentor">
        <SelectField
          value={reminder}
          onValueChange={setReminder}
          options={[
            { value: '30', label: 'Trước 30 phút' },
            { value: '60', label: 'Trước 1 giờ' },
            { value: '1440', label: 'Trước 1 ngày' },
          ]}
          triggerClassName="w-36"
        />
        <SwitchControl
          label="Nhắc lịch booking"
          checked={settings.bookingReminder}
          onChange={(v) => toggle('bookingReminder', v)}
        />
      </SettingRow>
      <SettingRow title="Tin nhắn mới" description="Khi mentor hoặc mentee nhắn cho bạn">
        <SwitchControl
          label="Tin nhắn mới"
          checked={settings.newMessage}
          onChange={(v) => toggle('newMessage', v)}
        />
      </SettingRow>
      <SettingRow title="Phản hồi bài viết" description="Khi có người trả lời câu hỏi của bạn">
        <SwitchControl
          label="Phản hồi bài viết"
          checked={settings.postReply}
          onChange={(v) => toggle('postReply', v)}
        />
      </SettingRow>
      <SettingRow title="Gợi ý mentor phù hợp" description="Mentor mới theo kỹ năng bạn quan tâm">
        <SwitchControl
          label="Gợi ý mentor phù hợp"
          checked={settings.mentorSuggestion}
          onChange={(v) => toggle('mentorSuggestion', v)}
        />
      </SettingRow>
      <SettingRow
        title="Gửi bản sao qua Gmail"
        description="Nhận thông báo quan trọng trong hộp thư"
      >
        <SwitchControl
          label="Gửi bản sao qua Gmail"
          checked={settings.gmailCopy}
          onChange={(v) => toggle('gmailCopy', v)}
        />
      </SettingRow>
    </SettingsCard>
  );
}

function PrivacySettings({ profile }: { profile: StudentProfileResponse | null }) {
  const [visibility, setVisibility] = useState('everyone');
  const [values, setValues] = useState({ school: true, preBookingMessage: true, anonymous: false });
  const toggle = (key: keyof typeof values, value: boolean) => {
    // TODO(api): Lưu privacy preferences khi backend cung cấp endpoint.
    setValues((current) => ({ ...current, [key]: value }));
    showSuccess({ title: 'Đã lưu' });
  };
  return (
    <SettingsCard
      icon={ShieldCheck}
      tone="bg-emerald-50 text-emerald-600"
      title="Quyền riêng tư"
      description="Kiểm soát ai nhìn thấy thông tin của bạn"
    >
      <SettingRow title="Ai có thể xem hồ sơ">
        <SelectField
          value={visibility}
          onValueChange={setVisibility}
          options={[
            { value: 'everyone', label: 'Mọi người dùng SkillSwap' },
            { value: 'booked', label: 'Chỉ mentor tôi đã booking' },
          ]}
          triggerClassName="w-56"
        />
      </SettingRow>
      <SettingRow
        title="Hiển thị trường học"
        description={profile?.campus?.name || 'Trường học trong hồ sơ'}
      >
        <SwitchControl
          label="Hiển thị trường học"
          checked={values.school}
          onChange={(v) => toggle('school', v)}
        />
      </SettingRow>
      <SettingRow
        title="Cho phép mentor nhắn tin trước khi booking"
        description="Tắt nếu bạn chỉ muốn nhận tin sau khi đặt lịch"
      >
        <SwitchControl
          label="Cho phép mentor nhắn tin trước khi booking"
          checked={values.preBookingMessage}
          onChange={(v) => toggle('preBookingMessage', v)}
        />
      </SettingRow>
      <SettingRow
        title="Đăng câu hỏi ẩn danh mặc định"
        description="Bạn vẫn có thể đổi khi đăng từng bài"
      >
        <SwitchControl
          label="Đăng câu hỏi ẩn danh mặc định"
          checked={values.anonymous}
          onChange={(v) => toggle('anonymous', v)}
        />
      </SettingRow>
      <SettingRow title="Người dùng đã chặn" description="0 người">
        <ChevronRight className="h-5 w-5 text-primary" aria-hidden="true" />
      </SettingRow>
    </SettingsCard>
  );
}

function LanguageSettings() {
  // TODO(api): Lưu language/timezone preferences khi backend cung cấp endpoint.
  const [language, setLanguage] = useState('vi');
  const [timezone, setTimezone] = useState('Asia/Ho_Chi_Minh');
  return (
    <SettingsCard
      icon={Globe2}
      tone="bg-primary-light text-primary"
      title="Ngôn ngữ & múi giờ"
      description="Múi giờ quyết định giờ hiển thị của mọi buổi booking"
    >
      <SettingRow title="Ngôn ngữ">
        <SelectField
          value={language}
          onValueChange={setLanguage}
          options={[
            { value: 'vi', label: 'Tiếng Việt' },
            { value: 'en', label: 'English' },
          ]}
          triggerClassName="w-48"
        />
      </SettingRow>
      <SettingRow title="Múi giờ" description="Tự nhận theo thiết bị">
        <SelectField
          value={timezone}
          onValueChange={setTimezone}
          options={[
            { value: 'Asia/Ho_Chi_Minh', label: '(GMT+7) Hà Nội, TP. HCM' },
            { value: 'Asia/Bangkok', label: '(GMT+7) Bangkok' },
          ]}
          triggerClassName="w-60"
        />
      </SettingRow>
    </SettingsCard>
  );
}

function BookingSettings({ locale }: { locale: string }) {
  const router = useRouter();
  const items = [
    { title: 'Lịch sử booking & giao dịch', action: () => router.push(`/${locale}/my-bookings`) },
    { title: 'Chính sách hủy & hoàn tiền', action: () => router.push(`/${locale}#faq`) },
  ];
  return (
    <SettingsCard
      icon={CreditCard}
      tone="bg-amber-50 text-amber-700"
      title="Booking & thanh toán"
      description="Quản lý lịch sử và thông tin thanh toán"
    >
      {items.map((item) => (
        <button
          key={item.title}
          type="button"
          onClick={item.action}
          className="flex min-h-14 w-full cursor-pointer items-center justify-between border-x-0 border-b-0 border-t border-solid border-border-light bg-transparent py-3 text-left first:border-t-0 hover:text-primary"
        >
          <span className="text-sm font-bold">{item.title}</span>
          <ChevronRight className="h-5 w-5 text-primary" aria-hidden="true" />
        </button>
      ))}
    </SettingsCard>
  );
}

function HelpArea({ bookings }: { bookings: MentorBookingResponse[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<(typeof FAQ_CATEGORIES)[number]>('Tất cả');
  const [expandedId, setExpandedId] = useState<string | null>(SETTINGS_FAQS[0].id);
  const [issueType, setIssueType] = useState('booking');
  const [bookingId, setBookingId] = useState('none');
  const [description, setDescription] = useState('');
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);

  const filteredFaqs = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi-VN');
    return SETTINGS_FAQS.filter((faq) => {
      const categoryMatches = category === 'Tất cả' || faq.category === category;
      const queryMatches =
        !normalized ||
        faq.question.toLocaleLowerCase('vi-VN').includes(normalized) ||
        faq.answer.toLocaleLowerCase('vi-VN').includes(normalized);
      return categoryMatches && queryMatches;
    });
  }, [category, query]);

  const bookingOptions = [
    { value: 'none', label: 'Không liên quan booking' },
    ...bookings.map((booking) => ({
      value: booking.bookingId,
      label: `${booking.serviceTitle || 'Buổi mentoring'} · ${new Date(booking.selectedStartTime).toLocaleDateString('vi-VN')}`,
    })),
  ];

  const submitSupport = (event: React.FormEvent) => {
    event.preventDefault();
    if (!description.trim()) return;
    // TODO(api): Gửi support ticket và attachment khi backend cung cấp endpoint tổng quát.
    setSubmittedCode(`SS-${Date.now().toString().slice(-6)}`);
  };

  return (
    <div className="space-y-4">
      <section className="rounded-[24px] border border-solid border-primary-border bg-primary-light/60 p-5">
        <label htmlFor="help-search" className="text-sm font-extrabold text-text-main">
          Bạn đang gặp vấn đề gì?
        </label>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-text-muted" />
          <input
            id="help-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ví dụ: hủy booking, đăng nhập Gmail, hoàn tiền…"
            className="h-14 w-full rounded-xl border border-solid border-border-light bg-white pr-4 pl-12 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Chủ đề trợ giúp">
          {FAQ_CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`min-h-10 cursor-pointer rounded-xl border border-solid px-3 text-xs font-bold ${category === item ? 'border-primary bg-primary text-white' : 'border-border-light bg-white text-text-secondary'}`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[20px] border border-solid border-border-light bg-white p-5 shadow-[0_4px_18px_rgba(16,50,90,0.045)]">
        <header className="mb-3 flex items-center justify-between gap-3">
          <h2 className="m-0 text-base font-extrabold text-text-main">Câu hỏi thường gặp</h2>
          <span className="text-xs text-text-muted">{filteredFaqs.length} kết quả</span>
        </header>
        {filteredFaqs.length ? (
          <div className="space-y-2">
            {filteredFaqs.map((faq) => {
              const expanded = expandedId === faq.id;
              return (
                <article
                  key={faq.id}
                  className="rounded-xl border border-solid border-border-light"
                >
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setExpandedId(expanded ? null : faq.id)}
                    className="flex min-h-12 w-full cursor-pointer items-center gap-2 border-none bg-transparent px-3 py-2.5 text-left"
                  >
                    <span className="shrink-0 rounded-lg bg-primary-light px-2 py-1 text-[10px] font-bold text-primary">
                      {faq.category}
                    </span>
                    <span className="flex-1 text-xs font-bold text-text-main sm:text-sm">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-primary transition-transform ${expanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {expanded && (
                    <div className="border-t border-solid border-border-light px-3 py-3 text-xs leading-5 text-text-secondary">
                      <p className="m-0">{faq.answer}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span>Câu trả lời có hữu ích không?</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => showSuccess({ title: 'Cảm ơn phản hồi của bạn' })}
                        >
                          Có
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => showSuccess({ title: 'Cảm ơn phản hồi của bạn' })}
                        >
                          Không
                        </Button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl bg-surface-subtle p-4 text-sm text-text-secondary">
            Chưa có câu trả lời phù hợp.{' '}
            <a href="#bao-cao" className="font-bold text-primary">
              Gửi yêu cầu hỗ trợ
            </a>{' '}
            để đội ngũ SkillSwap giúp bạn.
          </div>
        )}
      </section>

      <section
        id="bao-cao"
        className="scroll-mt-24 rounded-[20px] border border-solid border-border-light bg-white p-5 shadow-[0_4px_18px_rgba(16,50,90,0.045)]"
      >
        <header className="mb-4 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-orange-50 text-orange-600">
            <Flag className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="m-0 text-base font-extrabold text-text-main">
              Gửi yêu cầu / báo cáo sự cố
            </h2>
            <p className="mb-0 mt-1 text-xs text-text-secondary">
              Lỗi website, vấn đề booking, hành vi không phù hợp hoặc thanh toán
            </p>
          </div>
        </header>
        {submittedCode ? (
          <div className="rounded-xl bg-emerald-50 p-4" role="status">
            <p className="m-0 text-sm font-bold text-emerald-800">
              Đã gửi yêu cầu #{submittedCode}. Chúng tôi sẽ phản hồi qua thông báo và Gmail{' '}
              {SUPPORT_CONFIG.responseTime}.
            </p>
            <Button
              className="mt-3"
              size="sm"
              variant="outline"
              onClick={() => setSubmittedCode(null)}
            >
              Gửi yêu cầu khác
            </Button>
          </div>
        ) : (
          <form onSubmit={submitSupport}>
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField
                id="issue-type"
                label="Loại vấn đề"
                value={issueType}
                onValueChange={setIssueType}
                options={[
                  { value: 'booking', label: 'Vấn đề với buổi booking' },
                  { value: 'user', label: 'Báo cáo người dùng / mentor' },
                  { value: 'payment', label: 'Thanh toán & hoàn tiền' },
                  { value: 'technical', label: 'Lỗi kỹ thuật trên website' },
                ]}
              />
              <SelectField
                id="related-booking"
                label="Buổi booking liên quan (nếu có)"
                value={bookingId}
                onValueChange={setBookingId}
                options={bookingOptions}
              />
            </div>
            <label
              htmlFor="support-description"
              className="mt-4 block text-xs font-semibold text-text-secondary"
            >
              Mô tả <span className="text-danger">*</span>
            </label>
            <textarea
              id="support-description"
              required
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Chuyện gì đã xảy ra?"
              className="mt-2 min-h-28 w-full resize-y rounded-xl border border-solid border-border-light p-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
            <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                leftIcon={<ImagePlus />}
                onClick={() => showInfo('Đính kèm ảnh đang được hoàn thiện.')}
              >
                Đính kèm ảnh chụp màn hình
              </Button>
              <Button type="submit" disabled={!description.trim()}>
                Gửi yêu cầu
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

function SupportRail({
  section,
  onOpenHelp,
}: {
  section: SettingsSection;
  onOpenHelp: () => void;
}) {
  const openChat = () => window.dispatchEvent(new CustomEvent('skillswap:open-koukou'));
  return (
    <aside className="space-y-4 lg:sticky lg:top-24">
      <section className="rounded-[20px] border border-solid border-border-light bg-white p-5 shadow-[0_4px_18px_rgba(16,50,90,0.05)]">
        <img
          src="/images/Koko.png"
          alt="Linh vật KouKou của SkillSwap"
          className="mx-auto h-20 w-20 object-contain"
        />
        <h2 className="mb-0 mt-3 text-center text-xl font-extrabold text-text-main">
          Cần hỗ trợ ngay?
        </h2>
        <p className="mb-0 mt-2 text-center text-xs leading-5 text-text-secondary">
          Chat với đội ngũ SkillSwap, phản hồi {SUPPORT_CONFIG.responseTime}.
        </p>
        <Button className="mt-4 w-full" onClick={openChat} leftIcon={<MessageCircle />}>
          Chat với hỗ trợ
        </Button>
        <a
          href={`mailto:${SUPPORT_CONFIG.email}`}
          className="mt-2 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-solid border-primary-border bg-white text-xs font-bold text-primary no-underline hover:bg-primary-light"
        >
          <Mail className="h-4 w-4" aria-hidden="true" /> Gửi email hỗ trợ
        </a>
        <p className="mb-0 mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-text-muted">
          <Clock3 className="h-3.5 w-3.5" aria-hidden="true" /> Giờ hỗ trợ:{' '}
          {SUPPORT_CONFIG.workingHours}
        </p>
      </section>
      {section === 'settings' && (
        <button
          type="button"
          onClick={onOpenHelp}
          className="flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-[16px] border border-solid border-border-light bg-white px-4 text-left shadow-xs hover:border-primary-border"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
            <HelpCircle className="h-4 w-4" />
          </span>
          <span className="flex-1 text-sm font-bold text-text-main">Câu hỏi thường gặp</span>
          <ChevronRight className="h-4 w-4 text-primary" />
        </button>
      )}
    </aside>
  );
}
