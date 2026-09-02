/**
 * @file ScheduleManageView.tsx
 * @description Màn hình Quản lý Dịch vụ & Lịch dạy dành riêng cho Mentor.
 * Tích hợp API Backend (`/api/me/mentor-services`) và thiết kế chuẩn 100% theo UI mẫu.
 */

'use client';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { generateCodeVerifier, generateCodeChallenge } from '@/lib/auth/pkce';
import { getGoogleCalendarClientId, getGoogleCalendarRedirectUri } from '@/lib/auth/google';
import { formatDateVi, formatLocalTime } from './mentorTemplateHelpers';
import { ApiClientError } from '@/models/apiClient';
import type {
  AvailabilityTemplateResponse,
  CreateAvailabilityTemplateRequest,
  DeactivateAvailabilitySlotRequest,
  GoogleAuthorizationContextResponse,
  MentorBookingResponse,
  MentorManagedAvailabilitySlotResponse,
  MentorServiceManagementResponse,
  UpdateAvailabilitySlotRequest,
  UpdateAvailabilityTemplateRequest,
  UpdateMentorBookingPolicyRequest,
} from '@/models/auth';
import { AvailabilityTemplateList } from './AvailabilityTemplateList';
import { AvailabilityTemplateFormModal } from './AvailabilityTemplateFormModal';
import { AvailabilityTemplateDetailModal } from './AvailabilityTemplateDetailModal';
import { useAvailabilityTemplates } from './useAvailabilityTemplates';
import {
  availabilitySlotSchema,
  type AvailabilitySlotFormValues,
} from '@/models/schemas/availabilitySlotSchema';
import {
  mentorServiceSchema,
  type MentorServiceFormValues,
} from '@/models/schemas/mentorServiceSchema';
import { mentorSchedulingRepo } from '@/repositories/mentorSchedulingRepo';
import { mentorServiceRepo } from '@/repositories/mentorServiceRepo';
import { showError, showInfo, showSuccess } from '@/utils/toast';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  Compass,
  FileText,
  Globe,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Target,
  UserRound,
  Video,
  X,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { MentorScheduleCalendar } from './MentorScheduleCalendar';
import {
  mergeBookingsIntoCalendar,
  mergeAvailabilityTemplatesIntoCalendar,
  toMentorScheduleCalendarData,
} from './mentorScheduleCalendarData';
import { localDateTimeToUtcIso } from './mentorScheduleDateTime';
import { useMentorSchedulingRead } from './useMentorSchedulingRead';
import { bookingFilterOf } from '../bookings/useMentorBookings';

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function startOfWeek(date: Date) {
  const normalized = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const weekday = normalized.getUTCDay();
  return addDays(normalized, weekday === 0 ? -6 : 1 - weekday);
}

function toDateQuery(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getLocalDateTimeParts(isoString: string, timezone: string) {
  const dateObj = new Date(isoString);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(dateObj);
  const values: Record<string, string> = {};
  for (const p of parts) {
    if (['year', 'month', 'day', 'hour', 'minute'].includes(p.type)) {
      values[p.type] = p.value;
    }
  }
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
  };
}

function formatServicePrice(service: MentorServiceManagementResponse) {
  if (service.isFree) return 'Miễn phí';
  return `${new Intl.NumberFormat('vi-VN').format(service.publicPriceScoin ?? 0)} SCoin`;
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return [hours > 0 ? `${hours} giờ` : '', remainingMinutes > 0 ? `${remainingMinutes} phút` : '']
    .filter(Boolean)
    .join(' ');
}

function formatTimezoneOffset(date: Date, timezone: string) {
  const offset = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'shortOffset',
  })
    .formatToParts(date)
    .find((part) => part.type === 'timeZoneName')?.value;
  return offset || timezone;
}

function menteeInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'MT'
  );
}

function bookingStatusPresentation(booking: MentorBookingResponse) {
  const filter = bookingFilterOf(booking);
  if (filter === 'REQUESTED') return { label: 'Chờ xác nhận', variant: 'warning' as const };
  if (filter === 'WAITING_PAYMENT') return { label: 'Chờ thanh toán', variant: 'warning' as const };
  if (filter === 'CONFIRMED') {
    return {
      label: booking.actualSessionStatus === 'IN_PROGRESS' ? 'Đang diễn ra' : 'Đã xác nhận',
      variant: 'success' as const,
    };
  }
  if (filter === 'UNDER_REVIEW') return { label: 'Đang xem xét', variant: 'warning' as const };
  if (filter === 'COMPLETED') return { label: 'Hoàn thành', variant: 'success' as const };
  return { label: 'Đã hủy', variant: 'danger' as const };
}

function meetingPlatformLabel(platform: MentorBookingResponse['meetingPlatform']) {
  if (platform === 'GOOGLE_MEET') return 'Google Meet';
  if (platform === 'MICROSOFT_TEAMS') return 'Microsoft Teams';
  if (platform === 'ZOOM') return 'Zoom';
  if (platform === 'DISCORD') return 'Discord';
  if (platform === 'OFFLINE') return 'Trực tiếp';
  if (platform === 'OTHER') return 'Khác';
  return 'Chưa thiết lập';
}

function BookingAvailabilityDetail({
  booking,
  timezone,
  canDeactivate,
  canEdit,
  onClose,
  onDeactivate,
  onEdit,
}: {
  booking: MentorBookingResponse;
  timezone: string;
  canDeactivate: boolean;
  canEdit: boolean;
  onClose: () => void;
  onDeactivate: () => void;
  onEdit: () => void;
}) {
  const start = new Date(booking.selectedStartTime);
  const end = new Date(booking.selectedEndTime);
  const startParts = getLocalDateTimeParts(booking.selectedStartTime, timezone);
  const endParts = getLocalDateTimeParts(booking.selectedEndTime, timezone);
  const scheduledMinutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60_000));
  const sessionDuration = booking.serviceDurationSnapshot ?? scheduledMinutes;
  const status = bookingStatusPresentation(booking);
  const weekday = new Intl.DateTimeFormat('vi-VN', {
    timeZone: timezone,
    weekday: 'long',
  }).format(start);

  return (
    <div className="bookingAvailabilityDetailModal">
      <header className="bookingDetailHeader">
        <h2>Chi tiết lịch hẹn</h2>
        <button type="button" aria-label="Đóng" onClick={onClose}>
          <X aria-hidden="true" />
        </button>
      </header>

      <section className="bookingDetailSummary" aria-label="Thông tin lịch hẹn">
        <div className="bookingDetailInfoItem">
          <span className="bookingDetailInfoIcon" aria-hidden="true">
            <CalendarDays />
          </span>
          <div>
            <span>Ngày hẹn</span>
            <strong>{startParts.date.split('-').reverse().join('/')}</strong>
            <small>({weekday})</small>
          </div>
        </div>

        <div className="bookingDetailInfoItem">
          <span className="bookingDetailInfoIcon" aria-hidden="true">
            <Clock />
          </span>
          <div>
            <span>Thời gian</span>
            <strong>
              {startParts.time} – {endParts.time}
            </strong>
            {scheduledMinutes > 0 && <small>{formatDuration(scheduledMinutes)}</small>}
          </div>
        </div>

        <div className="bookingDetailInfoItem bookingDetailStatus">
          <span>Trạng thái</span>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        <div className="bookingDetailInfoItem">
          <span className="bookingDetailInfoIcon" aria-hidden="true">
            <Globe />
          </span>
          <div>
            <span>Múi giờ</span>
            <strong>{timezone}</strong>
            <small>{formatTimezoneOffset(start, timezone)}</small>
          </div>
        </div>

        <div className="bookingDetailInfoItem">
          <span className="bookingDetailInfoIcon" aria-hidden="true">
            <FileText />
          </span>
          <div>
            <span>Ghi chú từ mentee</span>
            <strong>{booking.learningGoalDescription?.trim() || 'Không có ghi chú'}</strong>
          </div>
        </div>

        <div className="bookingDetailInfoItem">
          <span className="bookingDetailInfoIcon" aria-hidden="true">
            <Video />
          </span>
          <div>
            <span>Hình thức</span>
            <strong>{meetingPlatformLabel(booking.meetingPlatform)}</strong>
            {booking.meetingLink && (
              <a href={booking.meetingLink} target="_blank" rel="noreferrer">
                Mở liên kết buổi học
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="bookingDetailSession">
        <h3>Thông tin buổi học</h3>
        <div>
          <article>
            <span>Dịch vụ đã đặt</span>
            <strong>{booking.serviceTitle || 'Chưa có thông tin dịch vụ'}</strong>
          </article>
          <article>
            <span>Thời lượng</span>
            <strong>
              {sessionDuration > 0 ? formatDuration(sessionDuration) : 'Chưa xác định'}
            </strong>
          </article>
        </div>
      </section>

      <section className="bookingDetailMentee" aria-label="Mentee đặt lịch">
        <span className="bookingDetailMenteeAvatar" aria-hidden={!booking.menteeAvatarUrl}>
          {booking.menteeAvatarUrl ? (
            <img src={booking.menteeAvatarUrl} alt="" />
          ) : (
            menteeInitials(booking.menteeDisplayName)
          )}
        </span>
        <div>
          <span>Mentee đặt lịch</span>
          <strong>{booking.menteeDisplayName}</strong>
        </div>
      </section>

      {(!canDeactivate || !canEdit) && (
        <p className="bookingDetailCapabilityNote">
          {!canDeactivate && !canEdit
            ? 'Không thể thu hồi hoặc chỉnh sửa vì lịch đã có booking.'
            : !canDeactivate
              ? 'Không thể thu hồi vì lịch đã có booking.'
              : 'Không thể chỉnh sửa thời gian vì lịch đã có booking.'}
        </p>
      )}

      <footer className="bookingDetailFooter">
        <Button type="button" variant="outline" onClick={onClose}>
          Đóng
        </Button>
        <div>
          <Button
            type="button"
            variant="outline"
            disabled={!canDeactivate}
            title={!canDeactivate ? 'Không thể thu hồi vì đã có booking.' : undefined}
            onClick={onDeactivate}
          >
            Thu hồi lịch hẹn
          </Button>
          <Button
            type="button"
            disabled={!canEdit}
            title={!canEdit ? 'Không thể chỉnh sửa vì đã có booking.' : undefined}
            onClick={onEdit}
          >
            Chỉnh sửa
          </Button>
        </div>
      </footer>
    </div>
  );
}

/** Helper chọn Icon phù hợp với tên dịch vụ */
function getServiceIcon(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes('cv') || lower.includes('resume')) {
    return <FileText className="h-5 w-5 text-primary" />;
  }
  if (lower.includes('interview') || lower.includes('phỏng vấn')) {
    return <Target className="h-5 w-5 text-primary" />;
  }
  if (lower.includes('career') || lower.includes('định hướng') || lower.includes('strategy')) {
    return <Compass className="h-5 w-5 text-primary" />;
  }
  return <BookOpen className="h-5 w-5 text-primary" />;
}

function showServiceStatusSuccess(isActive: boolean) {
  showSuccess({
    title: isActive ? 'Đã bật dịch vụ' : 'Đã tạm ẩn dịch vụ',
    description: isActive
      ? 'Mentee có thể đặt dịch vụ này.'
      : 'Mentee tạm thời không thể đặt dịch vụ này.',
  });
}

const SERVICE_PREVIEW_LIMIT = 4;

type ServiceStatusFilter = 'all' | 'active' | 'inactive';

interface MentorServiceCardProps {
  service: MentorServiceManagementResponse;
  isToggling: boolean;
  compact?: boolean;
  onOpen: (serviceId: string) => void;
  onRequestStatusChange: (service: MentorServiceManagementResponse) => void;
}

function MentorServiceCard({
  service,
  isToggling,
  compact = false,
  onOpen,
  onRequestStatusChange,
}: MentorServiceCardProps) {
  const priceText = service.isFree
    ? 'Miễn phí'
    : `${new Intl.NumberFormat('vi-VN').format(service.publicPriceScoin ?? 0)} S-coins`;

  return (
    <article
      className={`mentor-schedule-card group relative rounded-xl border border-border-color shadow-xs ${
        compact ? 'p-4' : 'min-h-40 p-5'
      } ${service.isActive ? 'bg-white' : 'bg-surface-subtle text-text-muted'}`}
    >
      <button
        type="button"
        className="absolute inset-0 z-0 cursor-pointer rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-label={`Xem chi tiết dịch vụ ${service.title}`}
        onClick={() => onOpen(service.serviceId)}
      />
      <div
        className={`pointer-events-none relative z-[1] flex items-start ${compact ? 'gap-2.5' : 'gap-3'}`}
      >
        <div
          className={`flex shrink-0 items-center justify-center rounded-xl ${
            compact ? 'h-9 w-9' : 'h-12 w-12'
          } ${
            service.isActive ? 'bg-primary-light text-primary' : 'bg-slate-200/70 text-slate-400'
          }`}
          aria-hidden="true"
        >
          {getServiceIcon(service.title)}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <h3
            className={`truncate font-semibold text-text-main ${compact ? 'text-sm' : 'text-base'}`}
          >
            {service.title}
          </h3>
          <p className={`${compact ? 'mt-0.5 text-xs' : 'mt-1 text-sm'} text-text-muted`}>
            {formatDuration(service.durationMinutes)} ·{' '}
            {service.deliveryMode === 'ONE_TO_ONE' ? '1 kèm 1' : service.deliveryMode}
          </p>
        </div>
        <button
          type="button"
          disabled={isToggling}
          role="switch"
          aria-checked={service.isActive}
          aria-label={`${service.isActive ? 'Tắt' : 'Bật'} dịch vụ ${service.title}`}
          className={`pointer-events-auto relative z-10 shrink-0 rounded-full outline-none transition-colors focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-wait disabled:opacity-60 ${
            compact ? 'h-5 w-9' : 'h-6 w-11'
          } ${service.isActive ? 'bg-primary' : 'bg-slate-300'}`}
          onClick={() => onRequestStatusChange(service)}
        >
          <span
            aria-hidden="true"
            className={`absolute left-0.5 top-0.5 rounded-full border border-slate-100 bg-white shadow-sm transition-transform ${
              compact ? 'h-4 w-4' : 'h-5 w-5'
            } ${
              service.isActive ? (compact ? 'translate-x-4' : 'translate-x-5') : 'translate-x-0'
            }`}
          />
        </button>
      </div>
      <p
        className={`pointer-events-none relative z-[1] ${compact ? 'mt-2.5 text-sm' : 'mt-5 text-base'} truncate font-semibold ${
          service.isActive ? 'text-primary' : 'text-slate-400'
        }`}
      >
        {priceText}
      </p>
    </article>
  );
}

export function ScheduleManageView() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const [services, setServices] = useState<MentorServiceManagementResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [pendingStatusChange, setPendingStatusChange] =
    useState<MentorServiceManagementResponse | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [isServicesDrawerOpen, setIsServicesDrawerOpen] = useState(false);
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [serviceStatusFilter, setServiceStatusFilter] = useState<ServiceStatusFilter>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [constraints, setConstraints] = useState<{ allowedDurationMinutes: number[] }>();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [activeScheduleTab, setActiveScheduleTab] = useState<'calendar' | 'recurring'>('calendar');
  const [isScheduleSettingsOpen, setIsScheduleSettingsOpen] = useState(false);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [isCreatingAvailability, setIsCreatingAvailability] = useState(false);
  const [availabilityRetryUntil, setAvailabilityRetryUntil] = useState<number>();

  // Slot Detail, Edit, Deactivate States
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [isUpdatingSlot, setIsUpdatingSlot] = useState(false);
  const [isDeactivatingSlot, setIsDeactivatingSlot] = useState(false);
  const [editStaleNotice, setEditStaleNotice] = useState<string | null>(null);
  const [pendingRejectionConfirm, setPendingRejectionConfirm] = useState<{
    type: 'update' | 'deactivate';
    token?: string;
  } | null>(null);

  // Booking Policy Form States
  const [leadTimeInput, setLeadTimeInput] = useState<string>('');
  const [horizonInput, setHorizonInput] = useState<string>('');
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);
  const [policyStaleNotice, setPolicyStaleNotice] = useState<string | null>(null);
  const [policyFormErrors, setPolicyFormErrors] = useState<{
    leadTime?: string;
    horizon?: string;
    root?: string;
  }>({});
  const [policyRetryUntil, setPolicyRetryUntil] = useState<number>();

  // Availability Templates Hook & States
  const {
    templates,
    isLoading: isTemplatesLoading,
    isLoadingMore: isTemplatesLoadingMore,
    error: templatesError,
    hasNext: hasNextTemplates,
    loadMore: loadMoreTemplates,
    reloadTemplates,
  } = useAvailabilityTemplates();

  const [selectedTemplateForDetail, setSelectedTemplateForDetail] =
    useState<AvailabilityTemplateResponse | null>(null);
  const [selectedTemplateForEdit, setSelectedTemplateForEdit] =
    useState<AvailabilityTemplateResponse | null>(null);
  const [isTemplateFormOpen, setIsTemplateFormOpen] = useState(false);
  const [isSubmittingTemplate, setIsSubmittingTemplate] = useState(false);
  const isCreatingTemplateRef = useRef(false);
  const [templateStaleNotice, setTemplateStaleNotice] = useState<string | null>(null);

  const [pendingTemplateActionConfirm, setPendingTemplateActionConfirm] = useState<{
    type: 'pause' | 'resume' | 'archive';
    template: AvailabilityTemplateResponse;
  } | null>(null);

  const serviceSectionRef = useRef<HTMLElement>(null);
  const weekEnd = addDays(weekStart, 6);
  const {
    availabilityError,
    availabilitySlots,
    bookings,
    bookingPolicy,
    constraints: schedulingConstraints,
    googleCalendarStatus,
    isLoading: isSchedulingLoading,
    load: reloadScheduling,
  } = useMentorSchedulingRead({
    isActive: true,
    fromDate: toDateQuery(weekStart),
    toDate: toDateQuery(weekEnd),
  });
  const timezone =
    bookingPolicy?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
  const calendarData = toMentorScheduleCalendarData(availabilitySlots);
  const calendarEvents = mergeBookingsIntoCalendar(
    mergeAvailabilityTemplatesIntoCalendar(calendarData.events, templates, weekStart),
    bookings,
  );
  const isAvailabilityResponseEmpty = calendarData.isEmpty && calendarEvents.length === 0;
  const canCreateAvailability = Boolean(bookingPolicy);
  const activeOneToOneServices = services.filter(
    (service) => service.isActive && service.deliveryMode === 'ONE_TO_ONE',
  );

  const selectedSlot = availabilitySlots?.find((slot) => slot.slotId === selectedSlotId);
  const selectedBooking = bookings?.find((booking) => booking.bookingId === selectedBookingId);
  const isTimeEditBlocked = Boolean(
    selectedSlot?.timeMutation?.mode && selectedSlot.timeMutation.mode !== 'ALLOWED',
  );
  const timeMutationReason = selectedSlot?.timeMutation?.restrictionCode;
  const canDeactivate =
    !selectedSlot?.deactivation?.mode || selectedSlot.deactivation.mode === 'ALLOWED';
  const deactivationReason = selectedSlot?.deactivation?.restrictionCode;

  // Form tạo dịch vụ mới
  const form = useForm<MentorServiceFormValues>({
    resolver: yupResolver(mentorServiceSchema),
    defaultValues: {
      title: 'Review CV & Career Path',
      description: 'Tư vấn chỉnh sửa CV chuẩn ATS và định hướng phát triển sự nghiệp 1-1',
      expectedOutcome: 'Sở hữu bản CV ấn tượng và rõ định hướng nghề nghiệp',
      durationMinutes: 60,
      isFree: false,
      priceScoin: 150000,
      maintainPostSessionChat: true,
    },
  });

  const isFreeWatched = form.watch('isFree');

  // Form tạo lịch rảnh
  const availabilityForm = useForm<AvailabilitySlotFormValues>({
    resolver: yupResolver(availabilitySlotSchema),
    defaultValues: {
      date: toDateQuery(weekStart),
      startTime: '',
      endTime: '',
      serviceIds: [],
      note: '',
    },
  });
  const selectedAvailabilityServiceIds = availabilityForm.watch('serviceIds') ?? [];
  const selectedAvailabilityServices = activeOneToOneServices.filter((service) =>
    selectedAvailabilityServiceIds.includes(service.serviceId),
  );

  // Form chỉnh sửa lịch rảnh
  const editAvailabilityForm = useForm<AvailabilitySlotFormValues>({
    resolver: yupResolver(availabilitySlotSchema),
    defaultValues: {
      date: '',
      startTime: '',
      endTime: '',
      serviceIds: [],
      note: '',
    },
  });

  useEffect(() => {
    if (bookingPolicy) {
      setLeadTimeInput(String(bookingPolicy.minimumBookingLeadTimeMinutes));
      setHorizonInput(String(bookingPolicy.maximumBookingHorizonDays));
    }
  }, [bookingPolicy]);

  useEffect(() => {
    if (!policyRetryUntil) return;
    const remaining = Math.max(policyRetryUntil - Date.now(), 0);
    const timer = window.setTimeout(() => setPolicyRetryUntil(undefined), remaining);
    return () => window.clearTimeout(timer);
  }, [policyRetryUntil]);

  const isPolicyDirty = Boolean(
    bookingPolicy &&
    (Number(leadTimeInput) !== bookingPolicy.minimumBookingLeadTimeMinutes ||
      Number(horizonInput) !== bookingPolicy.maximumBookingHorizonDays),
  );

  const handleSaveBookingPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingPolicy || !isPolicyDirty || isSavingPolicy || policyRetryUntil) return;

    const leadTime = Number(leadTimeInput);
    const horizon = Number(horizonInput);
    const errors: { leadTime?: string; horizon?: string } = {};

    if (Number.isNaN(leadTime) || leadTime < 0) {
      errors.leadTime = 'Vui lòng nhập số phút hợp lệ (>= 0).';
    }
    if (Number.isNaN(horizon) || horizon < 1) {
      errors.horizon = 'Vui lòng nhập số ngày hợp lệ (>= 1).';
    }

    if (Object.keys(errors).length > 0) {
      setPolicyFormErrors(errors);
      return;
    }

    setIsSavingPolicy(true);
    setPolicyFormErrors({});
    setPolicyStaleNotice(null);

    try {
      const payload: UpdateMentorBookingPolicyRequest = {
        minimumBookingLeadTimeMinutes: leadTime,
        maximumBookingHorizonDays: horizon,
        expectedVersion: bookingPolicy.version,
      };

      await mentorSchedulingRepo.updateBookingPolicy(payload);
      showSuccess({
        title: 'Đã lưu thay đổi',
        description: 'Cài đặt lịch đã được cập nhật.',
      });
      setIsScheduleSettingsOpen(false);
      await reloadScheduling();
    } catch (reason) {
      if (reason instanceof ApiClientError) {
        if (reason.status === 409) {
          await reloadScheduling();
          setPolicyStaleNotice(
            'Cài đặt lịch vừa được thay đổi ở nơi khác. Dữ liệu mới nhất đã được tải lại. Vui lòng kiểm tra trước khi lưu.',
          );
        } else if (reason.status === 400 && reason.data?.length) {
          const fieldMap: Record<string, string> = {
            minimumBookingLeadTimeMinutes: 'leadTime',
            maximumBookingHorizonDays: 'horizon',
          };
          const newErrors: { leadTime?: string; horizon?: string; root?: string } = {};
          reason.data.forEach((err) => {
            const mappedKey = err.field ? fieldMap[err.field] : undefined;
            if (mappedKey === 'leadTime') newErrors.leadTime = err.message;
            else if (mappedKey === 'horizon') newErrors.horizon = err.message;
            else newErrors.root = err.message;
          });
          setPolicyFormErrors(newErrors);
        } else if (reason.status === 429) {
          const retryAfterSeconds = reason.retryAfterSeconds ?? 0;
          if (retryAfterSeconds > 0) {
            setPolicyRetryUntil(Date.now() + retryAfterSeconds * 1000);
          }
          setPolicyFormErrors({
            root:
              retryAfterSeconds > 0
                ? `Bạn thao tác quá nhanh. Vui lòng thử lại sau ${retryAfterSeconds} giây.`
                : reason.message,
          });
        } else {
          setPolicyFormErrors({ root: reason.message });
        }
      } else {
        setPolicyFormErrors({ root: 'Không thể cập nhật cài đặt lịch. Vui lòng thử lại.' });
      }
    } finally {
      setIsSavingPolicy(false);
    }
  };

  useEffect(() => {
    if (!availabilityRetryUntil) return;
    const remaining = Math.max(availabilityRetryUntil - Date.now(), 0);
    const timer = window.setTimeout(() => setAvailabilityRetryUntil(undefined), remaining);
    return () => window.clearTimeout(timer);
  }, [availabilityRetryUntil]);

  const handleOpenCreateTemplate = () => {
    if (!canCreateAvailability) {
      showServicesSection();
      return;
    }
    setSelectedTemplateForEdit(null);
    setTemplateStaleNotice(null);
    setIsTemplateFormOpen(true);
  };

  const handleOpenEditTemplate = (tpl: AvailabilityTemplateResponse) => {
    setSelectedTemplateForEdit(tpl);
    setTemplateStaleNotice(null);
    setIsTemplateFormOpen(true);
  };

  const onSubmitCreateTemplate = async (data: CreateAvailabilityTemplateRequest) => {
    if (isCreatingTemplateRef.current) return;

    const normalizedWeekdays = [...data.weekdays].sort().join(',');
    const duplicateTemplate = templates.find(
      (template) =>
        template.configuredStatus !== 'ARCHIVED' &&
        template.effectiveStatus !== 'ARCHIVED' &&
        [...template.weekdays].sort().join(',') === normalizedWeekdays &&
        formatLocalTime(template.startTime) === data.startTime.slice(0, 5) &&
        formatLocalTime(template.endTime) === data.endTime.slice(0, 5) &&
        template.effectiveFrom === data.effectiveFrom &&
        (template.effectiveTo ?? '') === (data.effectiveTo ?? ''),
    );
    if (duplicateTemplate) {
      showInfo({
        title: 'Lịch lặp đã tồn tại',
        description: 'Hãy chỉnh sửa lịch hiện có thay vì tạo thêm một lịch trùng cấu hình.',
      });
      return;
    }

    isCreatingTemplateRef.current = true;
    setIsSubmittingTemplate(true);
    setTemplateStaleNotice(null);
    try {
      await mentorSchedulingRepo.createAvailabilityTemplate(data);
      showSuccess({
        title: 'Đã tạo lịch lặp',
        description: 'Lịch sẽ tự động mở theo thời gian bạn đã thiết lập.',
      });
      setIsTemplateFormOpen(false);
      await reloadTemplates();
      await reloadScheduling();
    } catch (reason) {
      if (reason instanceof ApiClientError) {
        showError(reason, { title: 'Không thể tạo lịch lặp' });
        console.error('Create template error:', reason);
      } else {
        showError('Không thể tạo mẫu lịch lặp. Vui lòng thử lại.');
      }
    } finally {
      isCreatingTemplateRef.current = false;
      setIsSubmittingTemplate(false);
    }
  };

  const onSubmitUpdateTemplate = async (
    templateId: string,
    data: UpdateAvailabilityTemplateRequest,
  ) => {
    setIsSubmittingTemplate(true);
    setTemplateStaleNotice(null);
    try {
      await mentorSchedulingRepo.updateAvailabilityTemplate(templateId, data);
      showSuccess({
        title: 'Đã cập nhật lịch lặp',
        description: 'Thay đổi đã được lưu.',
      });
      setIsTemplateFormOpen(false);
      setSelectedTemplateForEdit(null);
      await reloadTemplates();
      await reloadScheduling();
    } catch (reason) {
      if (reason instanceof ApiClientError) {
        if (reason.status === 409) {
          await reloadTemplates();
          try {
            const freshTpl = await mentorSchedulingRepo.getAvailabilityTemplate(templateId);
            setSelectedTemplateForEdit(freshTpl);
            setTemplateStaleNotice(
              'Mẫu lịch này vừa được thay đổi ở nơi khác. Dữ liệu mới nhất đã được tải lại. Vui lòng kiểm tra trước khi lưu.',
            );
          } catch {
            setIsTemplateFormOpen(false);
            showError('Mẫu lịch này không còn tồn tại hoặc đã bị lưu trữ.');
          }
        } else {
          showError(reason, { title: 'Không thể cập nhật lịch lặp' });
          console.error('Update template error:', reason);
        }
      } else {
        showError('Không thể cập nhật mẫu lịch lặp. Vui lòng thử lại.');
      }
    } finally {
      setIsSubmittingTemplate(false);
    }
  };

  const handleConfirmPauseTemplate = async (template: AvailabilityTemplateResponse) => {
    try {
      await mentorSchedulingRepo.pauseAvailabilityTemplate(template.templateId, {
        expectedVersion: template.configVersion,
      });
      showSuccess({
        title: 'Đã tạm dừng lịch lặp',
        description: 'Các lịch mới từ mẫu này sẽ tạm thời không được mở.',
      });
      await reloadTemplates();
      await reloadScheduling();
    } catch (reason) {
      if (reason instanceof ApiClientError) {
        if (reason.status === 409) {
          await reloadTemplates();
          showError('Mẫu lịch lặp vừa được thay đổi ở nơi khác. Dữ liệu đã được tải lại.');
        } else {
          showError(reason);
        }
      } else {
        showError('Không thể tạm dừng mẫu lịch lặp.');
      }
    }
  };

  const handleConfirmResumeTemplate = async (template: AvailabilityTemplateResponse) => {
    try {
      await mentorSchedulingRepo.resumeAvailabilityTemplate(template.templateId, {
        expectedVersion: template.configVersion,
      });
      showSuccess({
        title: 'Đã khôi phục lịch lặp',
        description: 'Lịch sẽ tiếp tục được tạo theo thời gian đã thiết lập.',
      });
      await reloadTemplates();
      await reloadScheduling();
    } catch (reason) {
      if (reason instanceof ApiClientError) {
        if (reason.status === 409) {
          await reloadTemplates();
          showError('Mẫu lịch lặp vừa được thay đổi ở nơi khác. Dữ liệu đã được tải lại.');
        } else {
          showError(reason);
        }
      } else {
        showError('Không thể tiếp tục mẫu lịch lặp.');
      }
    }
  };

  const handleConfirmArchiveTemplate = async (template: AvailabilityTemplateResponse) => {
    try {
      await mentorSchedulingRepo.archiveAvailabilityTemplate(template.templateId, {
        expectedVersion: template.configVersion,
      });
      showSuccess({
        title: 'Đã lưu trữ lịch lặp',
        description: 'Mẫu lịch đã được chuyển khỏi danh sách đang hoạt động.',
      });
      await reloadTemplates();
      await reloadScheduling();
    } catch (reason) {
      if (reason instanceof ApiClientError) {
        if (reason.status === 409) {
          await reloadTemplates();
          showError('Mẫu lịch lặp vừa được thay đổi ở nơi khác. Dữ liệu đã được tải lại.');
        } else {
          showError(reason);
        }
      } else {
        showError('Không thể lưu trữ mẫu lịch lặp.');
      }
    }
  };

  const [isSubmittingException, setIsSubmittingException] = useState<boolean>(false);

  const handleSkipTemplateDate = async (
    templateId: string,
    occurrenceDate: string,
    expectedVersion: number,
  ) => {
    setIsSubmittingException(true);
    try {
      const updatedTemplate = await mentorSchedulingRepo.addTemplateException(
        templateId,
        occurrenceDate,
        { expectedVersion },
      );
      showSuccess('Đã bỏ qua ngày đã chọn.');
      setSelectedTemplateForDetail(updatedTemplate);
      await reloadTemplates();
      await reloadScheduling();
    } catch (reason) {
      if (reason instanceof ApiClientError) {
        if (reason.status === 409) {
          try {
            const fresh = await mentorSchedulingRepo.getAvailabilityTemplate(templateId);
            setSelectedTemplateForDetail(fresh);
          } catch {
            // ignore
          }
          await reloadTemplates();
          showError(
            'Lịch lặp này vừa được thay đổi ở nơi khác. Dữ liệu mới nhất đã được tải lại. Vui lòng kiểm tra trước khi thử lại.',
          );
        } else if (reason.status === 404) {
          setSelectedTemplateForDetail(null);
          await reloadTemplates();
          showError('Lịch lặp này không còn tồn tại.');
        } else if (reason.status === 429) {
          const retryAfterSeconds = reason.retryAfterSeconds ?? 0;
          if (retryAfterSeconds > 0) {
            setAvailabilityRetryUntil(Date.now() + retryAfterSeconds * 1000);
          }
          showError(
            retryAfterSeconds > 0
              ? `Bạn thao tác quá nhanh. Vui lòng thử lại sau ${retryAfterSeconds} giây.`
              : reason.message,
          );
        } else {
          showError(reason);
        }
      } else {
        showError('Không thể bỏ qua ngày đã chọn. Vui lòng thử lại.');
      }
      throw reason;
    } finally {
      setIsSubmittingException(false);
    }
  };

  const handleRestoreTemplateDate = async (
    templateId: string,
    occurrenceDate: string,
    expectedVersion: number,
  ) => {
    setIsSubmittingException(true);
    try {
      const updatedTemplate = await mentorSchedulingRepo.restoreTemplateException(
        templateId,
        occurrenceDate,
        { expectedVersion },
      );
      showSuccess('Đã khôi phục ngày.');
      setSelectedTemplateForDetail(updatedTemplate);
      await reloadTemplates();
      await reloadScheduling();
    } catch (reason) {
      if (reason instanceof ApiClientError) {
        if (reason.status === 409) {
          try {
            const fresh = await mentorSchedulingRepo.getAvailabilityTemplate(templateId);
            setSelectedTemplateForDetail(fresh);
          } catch {
            // ignore
          }
          await reloadTemplates();
          showError(
            'Lịch lặp này vừa được thay đổi ở nơi khác. Dữ liệu mới nhất đã được tải lại. Vui lòng kiểm tra trước khi thử lại.',
          );
        } else if (reason.status === 404) {
          setSelectedTemplateForDetail(null);
          await reloadTemplates();
          showError('Lịch lặp này không còn tồn tại.');
        } else if (reason.status === 429) {
          const retryAfterSeconds = reason.retryAfterSeconds ?? 0;
          if (retryAfterSeconds > 0) {
            setAvailabilityRetryUntil(Date.now() + retryAfterSeconds * 1000);
          }
          showError(
            retryAfterSeconds > 0
              ? `Bạn thao tác quá nhanh. Vui lòng thử lại sau ${retryAfterSeconds} giây.`
              : reason.message,
          );
        } else {
          showError(reason);
        }
      } else {
        showError('Không thể khôi phục ngày đã chọn. Vui lòng thử lại.');
      }
      throw reason;
    } finally {
      setIsSubmittingException(false);
    }
  };

  // Fetch danh sách dịch vụ từ API backend
  const loadServices = async () => {
    try {
      setLoading(true);
      const [list, cons] = await Promise.all([
        mentorServiceRepo.list(),
        mentorServiceRepo.getConstraints(),
      ]);
      setServices(list);
      setConstraints(cons);
    } catch (reason) {
      showError(reason, { title: 'Không thể tải danh sách dịch vụ' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadServices();
  }, []);

  // Xử lý Bật/Tắt trạng thái kích hoạt Dịch vụ qua API
  const handleToggleService = async (service: MentorServiceManagementResponse) => {
    const newActiveState = !service.isActive;
    setTogglingId(service.serviceId);

    try {
      const updated = await mentorServiceRepo.setActive(service.serviceId, {
        isActive: newActiveState,
        expectedVersion: service.version,
        rejectPendingBookings: false,
      });
      setServices((prev) =>
        prev.map((item) => (item.serviceId === updated.serviceId ? updated : item)),
      );
      showServiceStatusSuccess(newActiveState);
    } catch (reason) {
      if (reason instanceof ApiClientError && reason.status === 409) {
        await loadServices();
        showError('Dịch vụ đã thay đổi. Danh sách đã được tải lại, vui lòng thử lại.');
      } else {
        showError(reason, { title: 'Không thể cập nhật trạng thái dịch vụ' });
      }
    } finally {
      setTogglingId(null);
    }
  };

  const [isInitiatingGoogleOAuth, setIsInitiatingGoogleOAuth] = useState(false);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [cannotDisconnectNotice, setCannotDisconnectNotice] = useState<string | null>(null);

  const handleInitiateGoogleOAuth = async () => {
    setIsInitiatingGoogleOAuth(true);
    try {
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const redirectUri = getGoogleCalendarRedirectUri(locale);

      const context = await mentorSchedulingRepo.getGoogleCalendarAuthorizationContext(
        redirectUri,
        codeChallenge,
      );

      sessionStorage.setItem('skillswap.googleCalendar.pkceVerifier', codeVerifier);
      sessionStorage.setItem('skillswap.googleCalendar.state', context.state);
      sessionStorage.setItem('skillswap.googleCalendar.redirectUri', redirectUri);

      const clientId = getGoogleCalendarClientId();
      const scope =
        'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly';

      const googleAuthUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(clientId)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scope)}&` +
        `state=${encodeURIComponent(context.state)}&` +
        `code_challenge=${encodeURIComponent(codeChallenge)}&` +
        `code_challenge_method=S256&` +
        `access_type=offline&` +
        `prompt=consent`;

      window.location.href = googleAuthUrl;
    } catch (reason) {
      setIsInitiatingGoogleOAuth(false);
      showError(reason, {
        title: 'Không thể kết nối Google Calendar',
        description: 'Tính năng kết nối lịch hiện chưa sẵn sàng. Vui lòng thử lại sau.',
      });
    }
  };

  const handleConfirmDisconnectGoogleCalendar = async () => {
    setIsDisconnecting(true);
    try {
      await mentorSchedulingRepo.disconnectGoogleCalendar();
      setIsDisconnectModalOpen(false);
      showSuccess({
        title: 'Đã ngắt kết nối Google Calendar',
        description: 'Lịch Google sẽ không còn được đồng bộ với SkillSwap.',
      });
      await reloadScheduling();
    } catch (reason) {
      setIsDisconnectModalOpen(false);
      if (
        reason instanceof ApiClientError &&
        (reason.status === 409 || reason.code === 'CAL_4403')
      ) {
        setCannotDisconnectNotice(
          'Bạn vẫn còn lịch đã thanh toán trong tương lai đang sử dụng Google Calendar.',
        );
      } else if (reason instanceof ApiClientError) {
        showError(reason);
      } else {
        showError('Không thể ngắt kết nối Google Calendar.');
      }
    } finally {
      setIsDisconnecting(false);
    }
  };

  const confirmStatusChange = () => {
    if (!pendingStatusChange) {
      return;
    }

    const service = pendingStatusChange;
    setPendingStatusChange(null);
    void handleToggleService(service);
  };

  // Xử lý Submit Tạo mới Dịch vụ qua API
  const onSubmitCreateService = async (values: MentorServiceFormValues) => {
    setIsSaving(true);
    try {
      await mentorServiceRepo.create({
        ...values,
        priceScoin: values.isFree ? 0 : values.priceScoin,
        deliveryMode: 'ONE_TO_ONE',
      });
      await loadServices();
      form.reset();
      setOpenModal(false);
      showSuccess({
        title: 'Đã tạo dịch vụ',
        description: 'Dịch vụ mới đã được thêm vào hồ sơ của bạn.',
      });
    } catch (reason) {
      showError(reason, { title: 'Không thể tạo dịch vụ' });
    } finally {
      setIsSaving(false);
    }
  };

  const openAvailabilityModal = () => {
    availabilityForm.reset({
      date: toDateQuery(weekStart),
      startTime: '',
      endTime: '',
      serviceIds: [],
      note: '',
    });
    setIsAvailabilityModalOpen(true);
  };

  const showServicesSection = () => {
    setIsAvailabilityModalOpen(false);
    window.requestAnimationFrame(() => {
      serviceSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleSelectSlot = (slotId: string) => {
    const slot = availabilitySlots?.find((s) => s.slotId === slotId);
    if (!slot) {
      showError('Lịch này không còn tồn tại.');
      void reloadScheduling();
      return;
    }
    setSelectedBookingId(null);
    setSelectedSlotId(slotId);
    setIsDetailModalOpen(true);
  };

  const handleSelectBooking = (bookingId: string) => {
    const booking = bookings?.find((item) => item.bookingId === bookingId);
    if (!booking) {
      showError('Lịch hẹn này không còn tồn tại.');
      void reloadScheduling();
      return;
    }

    const bookingStart = new Date(booking.selectedStartTime).getTime();
    const bookingEnd = new Date(booking.selectedEndTime).getTime();
    const parentSlot = availabilitySlots?.find(
      (slot) =>
        new Date(slot.startAt).getTime() <= bookingStart &&
        new Date(slot.endAt).getTime() >= bookingEnd,
    );

    setSelectedBookingId(bookingId);
    setSelectedSlotId(parentSlot?.slotId ?? null);
    setIsDetailModalOpen(true);
  };

  const handleOpenEditModal = () => {
    if (!selectedSlot) return;
    const startParts = getLocalDateTimeParts(selectedSlot.startAt, timezone);
    const endParts = getLocalDateTimeParts(selectedSlot.endAt, timezone);
    editAvailabilityForm.reset({
      date: startParts.date,
      startTime: startParts.time,
      endTime: endParts.time,
      serviceIds: selectedSlot.services.map((s) => s.serviceId),
      note: selectedSlot.note ?? '',
    });
    setEditStaleNotice(null);
    setIsDetailModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleOpenDeactivateModal = () => {
    if (!selectedSlot) return;
    setIsDetailModalOpen(false);
    setIsDeactivateModalOpen(true);
  };

  const onSubmitAvailabilitySlot = async (values: AvailabilitySlotFormValues) => {
    if (isCreatingAvailability || availabilityRetryUntil) return;

    if (!bookingPolicy) {
      const message = 'Chưa tải được múi giờ đặt lịch. Vui lòng thử lại sau.';
      availabilityForm.setError('startTime', {
        type: 'validate',
        message,
      });
      showError(message, { title: 'Chưa thể tạo lịch rảnh' });
      return;
    }

    if (values.startTime >= values.endTime) {
      const message = 'Giờ kết thúc phải sau giờ bắt đầu.';
      availabilityForm.setError('endTime', {
        type: 'validate',
        message,
      });
      showError(message, { title: 'Thời gian chưa hợp lệ' });
      return;
    }

    let startAt: string;
    let endAt: string;
    try {
      startAt = localDateTimeToUtcIso({ date: values.date, time: values.startTime }, timezone);
      endAt = localDateTimeToUtcIso({ date: values.date, time: values.endTime }, timezone);
    } catch (reason) {
      const message =
        reason instanceof Error ? reason.message : 'Không thể xử lý thời gian đã chọn.';
      availabilityForm.setError('startTime', {
        type: 'validate',
        message,
      });
      showError(message, { title: 'Thời gian chưa hợp lệ' });
      return;
    }

    if (new Date(startAt).getTime() <= Date.now()) {
      const message = 'Thời gian bắt đầu phải ở tương lai.';
      availabilityForm.setError('startTime', { type: 'validate', message });
      showError(message, { title: 'Không thể tạo lịch rảnh' });
      return;
    }

    const durationMinutes = (new Date(endAt).getTime() - new Date(startAt).getTime()) / 60_000;
    if (
      schedulingConstraints &&
      durationMinutes > schedulingConstraints.maximumParentSlotDurationMinutes
    ) {
      const message = `Thời lượng tối đa là ${schedulingConstraints.maximumParentSlotDurationMinutes} phút.`;
      availabilityForm.setError('endTime', {
        type: 'validate',
        message,
      });
      showError(message, { title: 'Thời lượng chưa hợp lệ' });
      return;
    }

    setIsCreatingAvailability(true);
    availabilityForm.clearErrors('root');
    try {
      await mentorSchedulingRepo.createAvailabilitySlot({
        startAt,
        endAt,
        serviceIds: values.serviceIds,
        note: values.note.trim() || undefined,
      });
      setIsAvailabilityModalOpen(false);
      showSuccess({
        title: 'Đã thêm lịch rảnh',
        description: 'Mentee có thể đặt lịch trong khung giờ này.',
      });
      await reloadScheduling();
    } catch (reason) {
      if (reason instanceof ApiClientError) {
        const serverErrorText = [
          reason.code,
          reason.message,
          ...(reason.data?.map((error) => error.message) ?? []),
        ].join(' ');
        const isPastTimeError = /past|quá khứ/i.test(serverErrorText);
        if (isPastTimeError) {
          const message = 'Thời gian bắt đầu phải ở tương lai.';
          availabilityForm.setError('startTime', { type: 'server', message });
          showError(message, { title: 'Không thể tạo lịch rảnh' });
        } else if (reason.status === 400 && reason.data?.length) {
          const fieldMap: Partial<Record<string, keyof AvailabilitySlotFormValues>> = {
            startAt: 'startTime',
            endAt: 'endTime',
            note: 'note',
            serviceIds: 'serviceIds',
          };
          reason.data.forEach((error) => {
            const field = error.field ? fieldMap[error.field] : undefined;
            if (field) {
              availabilityForm.setError(field, { type: 'server', message: error.message });
            }
          });
          const firstFieldMessage = reason.data.find((error) => error.message)?.message;
          showError(firstFieldMessage || reason.message, {
            title: 'Thông tin lịch rảnh chưa hợp lệ',
          });
        } else if (reason.status === 429) {
          const retryAfterSeconds = reason.retryAfterSeconds ?? 0;
          if (retryAfterSeconds > 0) {
            setAvailabilityRetryUntil(Date.now() + retryAfterSeconds * 1000);
          }
          const message =
            retryAfterSeconds > 0
              ? `Bạn thao tác quá nhanh. Vui lòng thử lại sau ${retryAfterSeconds} giây.`
              : reason.message;
          showError(message, { title: 'Chưa thể tạo lịch rảnh' });
        } else {
          showError(reason, { title: 'Không thể tạo lịch rảnh' });
        }
      } else {
        showError(reason, {
          title: 'Không thể tạo lịch rảnh',
          description: 'Vui lòng thử lại sau.',
        });
      }
    } finally {
      setIsCreatingAvailability(false);
    }
  };

  // Submit Update Slot API
  const onSubmitUpdateAvailabilitySlot = async (
    values: AvailabilitySlotFormValues,
    confirmRejection = false,
    pendingToken?: string,
  ) => {
    if (!selectedSlot || isUpdatingSlot || availabilityRetryUntil) return;

    let startAt = selectedSlot.startAt;
    let endAt = selectedSlot.endAt;

    if (!isTimeEditBlocked) {
      if (values.startTime >= values.endTime) {
        editAvailabilityForm.setError('endTime', {
          type: 'validate',
          message: 'Giờ kết thúc phải sau giờ bắt đầu.',
        });
        return;
      }

      try {
        startAt = localDateTimeToUtcIso({ date: values.date, time: values.startTime }, timezone);
        endAt = localDateTimeToUtcIso({ date: values.date, time: values.endTime }, timezone);
      } catch (reason) {
        editAvailabilityForm.setError('root', {
          type: 'validate',
          message: reason instanceof Error ? reason.message : 'Không thể xử lý thời gian đã chọn.',
        });
        return;
      }

      const durationMinutes = (new Date(endAt).getTime() - new Date(startAt).getTime()) / 60_000;
      if (
        schedulingConstraints &&
        durationMinutes > schedulingConstraints.maximumParentSlotDurationMinutes
      ) {
        editAvailabilityForm.setError('endTime', {
          type: 'validate',
          message: `Thời lượng tối đa là ${schedulingConstraints.maximumParentSlotDurationMinutes} phút.`,
        });
        return;
      }
    }

    setIsUpdatingSlot(true);
    editAvailabilityForm.clearErrors('root');

    try {
      const updatePayload: UpdateAvailabilitySlotRequest = {
        startAt,
        endAt,
        serviceIds: values.serviceIds,
        expectedVersion: selectedSlot.version,
        note: values.note.trim() || undefined,
        rejectPendingBookings: confirmRejection ? true : undefined,
        pendingRejectionToken: pendingToken,
      };

      await mentorSchedulingRepo.updateAvailabilitySlot(selectedSlot.slotId, updatePayload);
      setIsEditModalOpen(false);
      setSelectedSlotId(null);
      setEditStaleNotice(null);
      setPendingRejectionConfirm(null);
      showSuccess({
        title: 'Đã cập nhật lịch rảnh',
        description: 'Thay đổi đã được lưu.',
      });
      await reloadScheduling();
    } catch (reason) {
      if (reason instanceof ApiClientError) {
        if (reason.status === 409) {
          const latestSlots = await mentorSchedulingRepo.listAvailabilitySlots({
            isActive: true,
            fromDate: toDateQuery(weekStart),
            toDate: toDateQuery(weekEnd),
          });
          const freshSlot = latestSlots.find((s) => s.slotId === selectedSlot.slotId);

          if (!freshSlot) {
            setIsEditModalOpen(false);
            setSelectedSlotId(null);
            showError('Lịch này không còn tồn tại hoặc đã bị thu hồi.');
            await reloadScheduling();
            return;
          }

          setSelectedSlotId(freshSlot.slotId);

          if (
            reason.code?.includes('PENDING') ||
            reason.message.toLowerCase().includes('pending')
          ) {
            setPendingRejectionConfirm({
              type: 'update',
              token: reason.data?.[0]?.rejectedValue as string | undefined,
            });
            return;
          }

          const freshStart = getLocalDateTimeParts(freshSlot.startAt, timezone);
          const freshEnd = getLocalDateTimeParts(freshSlot.endAt, timezone);
          editAvailabilityForm.reset({
            date: freshStart.date,
            startTime: freshStart.time,
            endTime: freshEnd.time,
            serviceIds: freshSlot.services.map((s) => s.serviceId),
            note: freshSlot.note ?? '',
          });
          setEditStaleNotice(
            'Lịch này vừa được thay đổi ở nơi khác. Dữ liệu mới nhất đã được tải lại. Vui lòng kiểm tra trước khi lưu lại.',
          );
          await reloadScheduling();
        } else if (reason.status === 404) {
          setIsEditModalOpen(false);
          setSelectedSlotId(null);
          showError('Lịch này không còn tồn tại.');
          await reloadScheduling();
        } else if (reason.status === 400 && reason.data?.length) {
          const fieldMap: Partial<Record<string, keyof AvailabilitySlotFormValues>> = {
            startAt: 'startTime',
            endAt: 'endTime',
            note: 'note',
            serviceIds: 'serviceIds',
          };
          reason.data.forEach((error) => {
            const field = error.field ? fieldMap[error.field] : undefined;
            if (field) {
              editAvailabilityForm.setError(field, { type: 'server', message: error.message });
            }
          });
          editAvailabilityForm.setError('root', { type: 'server', message: reason.message });
        } else if (reason.status === 429) {
          const retryAfterSeconds = reason.retryAfterSeconds ?? 0;
          if (retryAfterSeconds > 0) {
            setAvailabilityRetryUntil(Date.now() + retryAfterSeconds * 1000);
          }
          editAvailabilityForm.setError('root', {
            type: 'server',
            message:
              retryAfterSeconds > 0
                ? `Bạn thao tác quá nhanh. Vui lòng thử lại sau ${retryAfterSeconds} giây.`
                : reason.message,
          });
        } else {
          editAvailabilityForm.setError('root', { type: 'server', message: reason.message });
        }
      } else {
        editAvailabilityForm.setError('root', {
          type: 'server',
          message: 'Không thể cập nhật lịch rảnh. Vui lòng thử lại.',
        });
      }
    } finally {
      setIsUpdatingSlot(false);
    }
  };

  // Submit Deactivate Slot API
  const handleDeactivateSlot = async (confirmRejection = false, pendingToken?: string) => {
    if (!selectedSlot || isDeactivatingSlot || availabilityRetryUntil) return;

    setIsDeactivatingSlot(true);
    try {
      const deactivatePayload: DeactivateAvailabilitySlotRequest = {
        expectedVersion: selectedSlot.version,
        rejectPendingBookings: confirmRejection ? true : undefined,
        pendingRejectionToken: pendingToken,
      };

      await mentorSchedulingRepo.deactivateAvailabilitySlot(selectedSlot.slotId, deactivatePayload);
      setIsDeactivateModalOpen(false);
      setIsDetailModalOpen(false);
      setSelectedSlotId(null);
      setPendingRejectionConfirm(null);
      showSuccess({
        title: 'Đã thu hồi lịch rảnh',
        description: 'Khung giờ này không còn nhận booking mới.',
      });
      await reloadScheduling();
    } catch (reason) {
      if (reason instanceof ApiClientError) {
        if (reason.status === 409) {
          const latestSlots = await mentorSchedulingRepo.listAvailabilitySlots({
            isActive: true,
            fromDate: toDateQuery(weekStart),
            toDate: toDateQuery(weekEnd),
          });
          const freshSlot = latestSlots.find((s) => s.slotId === selectedSlot.slotId);

          if (!freshSlot) {
            setIsDeactivateModalOpen(false);
            setIsDetailModalOpen(false);
            setSelectedSlotId(null);
            showInfo('Lịch này đã được thay đổi hoặc thu hồi.');
            await reloadScheduling();
            return;
          }

          if (
            reason.code?.includes('PENDING') ||
            reason.message.toLowerCase().includes('pending')
          ) {
            setPendingRejectionConfirm({
              type: 'deactivate',
              token: reason.data?.[0]?.rejectedValue as string | undefined,
            });
            return;
          }

          setSelectedSlotId(freshSlot.slotId);
          showError(
            'Lịch này vừa có thay đổi từ nơi khác. Vui lòng kiểm tra lại thông tin mới nhất.',
          );
          await reloadScheduling();
        } else if (reason.status === 404) {
          setIsDeactivateModalOpen(false);
          setIsDetailModalOpen(false);
          setSelectedSlotId(null);
          showError('Lịch này không còn tồn tại.');
          await reloadScheduling();
        } else if (reason.status === 429) {
          const retryAfterSeconds = reason.retryAfterSeconds ?? 0;
          if (retryAfterSeconds > 0) {
            setAvailabilityRetryUntil(Date.now() + retryAfterSeconds * 1000);
          }
          showError(
            retryAfterSeconds > 0
              ? `Bạn thao tác quá nhanh. Vui lòng thử lại sau ${retryAfterSeconds} giây.`
              : reason.message,
          );
        } else {
          showError(reason);
        }
      } else {
        showError('Không thể thu hồi lịch rảnh. Vui lòng thử lại.');
      }
    } finally {
      setIsDeactivatingSlot(false);
    }
  };

  const handleConfirmPendingRejection = () => {
    if (!pendingRejectionConfirm) return;
    if (pendingRejectionConfirm.type === 'update') {
      void editAvailabilityForm.handleSubmit((values) =>
        onSubmitUpdateAvailabilitySlot(values, true, pendingRejectionConfirm.token),
      )();
    } else if (pendingRejectionConfirm.type === 'deactivate') {
      void handleDeactivateSlot(true, pendingRejectionConfirm.token);
    }
  };

  const selectedSlotStart = selectedSlot
    ? getLocalDateTimeParts(selectedSlot.startAt, timezone)
    : null;
  const selectedSlotEnd = selectedSlot ? getLocalDateTimeParts(selectedSlot.endAt, timezone) : null;
  const selectedSlotDurationMinutes = selectedSlot
    ? Math.max(
        0,
        Math.round(
          (new Date(selectedSlot.endAt).getTime() - new Date(selectedSlot.startAt).getTime()) /
            60000,
        ),
      )
    : 0;
  const activeServiceCount = services.filter((service) => service.isActive).length;
  const previewServices = services.slice(0, SERVICE_PREVIEW_LIMIT);
  const filteredServices = useMemo(() => {
    const normalizedQuery = serviceSearchQuery.trim().toLocaleLowerCase('vi-VN');

    return services.filter((service) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        service.title.toLocaleLowerCase('vi-VN').includes(normalizedQuery);
      const matchesStatus =
        serviceStatusFilter === 'all' ||
        (serviceStatusFilter === 'active' ? service.isActive : !service.isActive);

      return matchesQuery && matchesStatus;
    });
  }, [serviceSearchQuery, serviceStatusFilter, services]);

  useEffect(() => {
    if (!isServicesDrawerOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsServicesDrawerOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isServicesDrawerOpen]);

  return (
    <div className="mentor-schedule-page w-full space-y-10 pb-6">
      <section
        ref={serviceSectionRef}
        className="mentor-schedule-section"
        aria-labelledby="mentor-services-heading"
      >
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2
              id="mentor-services-heading"
              className="text-xl font-bold tracking-tight text-text-main"
            >
              Dịch vụ của tôi
            </h2>
            {!loading && services.length > 0 && (
              <p className="mt-1 text-sm text-text-muted">
                {services.length} dịch vụ · {activeServiceCount} đang hoạt động
              </p>
            )}
          </div>
          <Button
            variant="primary"
            size="md"
            className="h-11 px-5"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setOpenModal(true)}
          >
            Thêm dịch vụ
          </Button>
        </div>

        {loading ? (
          <div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
            aria-label="Đang tải danh sách dịch vụ"
            aria-busy="true"
          >
            {[0, 1].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-xl border border-border-color bg-white p-4"
              >
                <div className="flex gap-2.5">
                  <span className="h-9 w-9 rounded-lg bg-slate-100" />
                  <span className="mt-1 h-4 w-36 rounded bg-slate-100" />
                </div>
                <span className="mt-4 block h-5 w-24 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <p className="text-sm font-semibold text-slate-700">Bạn chưa có dịch vụ nào.</p>
            <Button
              type="button"
              className="mt-4 bg-[var(--schedule-primary)] hover:bg-[#0789dc]"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setOpenModal(true)}
            >
              Thêm dịch vụ
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {previewServices.map((service) => (
                <MentorServiceCard
                  key={service.serviceId}
                  service={service}
                  compact
                  isToggling={togglingId === service.serviceId}
                  onOpen={(serviceId) => router.push(`/${locale}/mentor/services/${serviceId}`)}
                  onRequestStatusChange={setPendingStatusChange}
                />
              ))}
            </div>
            {services.length > SERVICE_PREVIEW_LIMIT && (
              <Button
                type="button"
                variant="ghost"
                className="mt-4 px-0 text-primary hover:bg-transparent hover:text-primary-hover"
                onClick={() => setIsServicesDrawerOpen(true)}
              >
                Xem tất cả {services.length} dịch vụ →
              </Button>
            )}
          </>
        )}
      </section>

      <section className="mentor-schedule-section" aria-labelledby="mentor-schedule-heading">
        <h2
          id="mentor-schedule-heading"
          className="text-xl font-bold tracking-tight text-text-main"
        >
          Lịch dạy của tôi
        </h2>

        <div className="mb-4 mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="overflow-x-auto">
            <Tabs
              tabs={[
                { id: 'calendar', label: 'Lịch' },
                { id: 'recurring', label: 'Lịch lặp' },
              ]}
              activeTab={activeScheduleTab}
              onChange={(tabId) => setActiveScheduleTab(tabId as 'calendar' | 'recurring')}
              ariaLabel="Chế độ lịch dạy"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="md"
              leftIcon={<Settings className="h-4 w-4" />}
              onClick={() => setIsScheduleSettingsOpen(true)}
            >
              Cài đặt lịch
            </Button>
            {activeScheduleTab === 'calendar' ? (
              <Button
                variant="primary"
                size="md"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={openAvailabilityModal}
              >
                Thêm lịch rảnh
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                leftIcon={<CalendarDays className="h-4 w-4" />}
                onClick={handleOpenCreateTemplate}
              >
                Tạo lịch hàng tuần
              </Button>
            )}
          </div>
        </div>

        {activeScheduleTab === 'calendar' ? (
          <MentorScheduleCalendar
            weekStart={weekStart}
            timezone={timezone}
            events={calendarEvents}
            isLoading={isSchedulingLoading || isTemplatesLoading}
            error={availabilityError ?? templatesError ?? calendarData.error}
            isAvailabilityResponseEmpty={isAvailabilityResponseEmpty}
            onPreviousWeek={() => setWeekStart((current) => addDays(current, -7))}
            onNextWeek={() => setWeekStart((current) => addDays(current, 7))}
            onToday={() => setWeekStart(startOfWeek(new Date()))}
            onRetry={() => void Promise.all([reloadScheduling(), reloadTemplates()])}
            onUnavailableAction={openAvailabilityModal}
            onSelectSlot={handleSelectSlot}
            onSelectBooking={handleSelectBooking}
          />
        ) : (
          <AvailabilityTemplateList
            templates={templates}
            isLoading={isTemplatesLoading}
            error={templatesError}
            hasNext={hasNextTemplates}
            isLoadingMore={isTemplatesLoadingMore}
            onLoadMore={loadMoreTemplates}
            onOpenCreate={handleOpenCreateTemplate}
            onOpenDetail={(tpl) => setSelectedTemplateForDetail(tpl)}
            onPause={(tpl) => setPendingTemplateActionConfirm({ type: 'pause', template: tpl })}
            onResume={(tpl) => setPendingTemplateActionConfirm({ type: 'resume', template: tpl })}
          />
        )}
      </section>

      {isServicesDrawerOpen && (
        <div
          className="fixed inset-0 z-[99990] flex justify-end bg-slate-950/45 backdrop-blur-[2px]"
          role="presentation"
          onMouseDown={() => setIsServicesDrawerOpen(false)}
        >
          <aside
            className="flex h-full w-full flex-col bg-white shadow-2xl sm:max-w-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="services-drawer-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6">
              <div>
                <h2
                  id="services-drawer-title"
                  className="text-xl font-bold tracking-tight text-slate-900"
                >
                  Tất cả dịch vụ
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {services.length} dịch vụ · {activeServiceCount} đang hoạt động
                </p>
              </div>
              <button
                type="button"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 outline-none transition hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-4 focus-visible:ring-primary/20"
                aria-label="Đóng danh sách dịch vụ"
                onClick={() => setIsServicesDrawerOpen(false)}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </header>

            <div className="shrink-0 space-y-3 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={serviceSearchQuery}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                  placeholder="Tìm kiếm dịch vụ..."
                  aria-label="Tìm kiếm dịch vụ"
                  autoFocus
                  onChange={(event) => setServiceSearchQuery(event.target.value)}
                />
              </div>
              <div
                className="flex gap-2 overflow-x-auto pb-1"
                role="group"
                aria-label="Lọc trạng thái"
              >
                {(
                  [
                    ['all', `Tất cả (${services.length})`],
                    ['active', `Đang hoạt động (${activeServiceCount})`],
                    ['inactive', `Đã tắt (${services.length - activeServiceCount})`],
                  ] as const
                ).map(([status, label]) => (
                  <button
                    key={status}
                    type="button"
                    className={`h-9 shrink-0 rounded-full border px-3.5 text-xs font-semibold transition ${
                      serviceStatusFilter === status
                        ? 'border-primary bg-primary text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-primary-border hover:text-primary'
                    }`}
                    aria-pressed={serviceStatusFilter === status}
                    onClick={() => setServiceStatusFilter(status)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
              {filteredServices.length > 0 ? (
                <div className="space-y-3">
                  {filteredServices.map((service) => (
                    <MentorServiceCard
                      key={service.serviceId}
                      service={service}
                      compact
                      isToggling={togglingId === service.serviceId}
                      onOpen={(serviceId) => router.push(`/${locale}/mentor/services/${serviceId}`)}
                      onRequestStatusChange={setPendingStatusChange}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
                  <Search className="mb-3 h-8 w-8 text-slate-300" aria-hidden="true" />
                  <p className="font-semibold text-slate-700">Không tìm thấy dịch vụ</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Hãy thử từ khóa hoặc trạng thái khác.
                  </p>
                </div>
              )}
            </div>

            <footer className="shrink-0 border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
              <Button
                type="button"
                className="w-full"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => {
                  setIsServicesDrawerOpen(false);
                  setOpenModal(true);
                }}
              >
                Thêm dịch vụ
              </Button>
            </footer>
          </aside>
        </div>
      )}

      <Modal
        open={isAvailabilityModalOpen}
        title="Thêm lịch rảnh"
        onClose={() => !isCreatingAvailability && setIsAvailabilityModalOpen(false)}
        className="max-h-[95vh] max-w-2xl"
      >
        {loading ? (
          <div className="space-y-4" aria-label="Đang tải dịch vụ" aria-busy="true">
            <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
            </div>
            <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
          </div>
        ) : activeOneToOneServices.length ? (
          <form
            className="space-y-3"
            onSubmit={availabilityForm.handleSubmit(onSubmitAvailabilitySlot, () =>
              showError('Vui lòng kiểm tra các trường được đánh dấu màu đỏ.', {
                title: 'Thông tin chưa hợp lệ',
              }),
            )}
            noValidate
          >
            <div>
              <label
                className="mb-1.5 block text-sm font-semibold text-slate-700"
                htmlFor="availability-date"
              >
                Ngày <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <CalendarDays
                  className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#119CF7]"
                  aria-hidden="true"
                />
                <input
                  id="availability-date"
                  type="date"
                  min={getLocalDateTimeParts(new Date().toISOString(), timezone).date}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-800 outline-none transition hover:border-sky-300 focus:border-[#119CF7] focus:ring-4 focus:ring-[#119CF7]/10"
                  {...availabilityForm.register('date')}
                />
              </div>
              {availabilityForm.formState.errors.date && (
                <span className="mt-1.5 block text-xs font-medium text-red-600" role="alert">
                  {availabilityForm.formState.errors.date.message}
                </span>
              )}
            </div>

            <div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                    htmlFor="availability-start-time"
                  >
                    Bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock
                      className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#119CF7]"
                      aria-hidden="true"
                    />
                    <input
                      id="availability-start-time"
                      type="time"
                      aria-invalid={Boolean(availabilityForm.formState.errors.startTime)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-800 outline-none transition hover:border-sky-300 focus:border-[#119CF7] focus:ring-4 focus:ring-[#119CF7]/10"
                      {...availabilityForm.register('startTime')}
                    />
                  </div>
                  {availabilityForm.formState.errors.startTime && (
                    <span className="mt-1.5 block text-xs font-medium text-red-600" role="alert">
                      {availabilityForm.formState.errors.startTime.message}
                    </span>
                  )}
                </div>
                <div>
                  <label
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                    htmlFor="availability-end-time"
                  >
                    Kết thúc <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock
                      className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#119CF7]"
                      aria-hidden="true"
                    />
                    <input
                      id="availability-end-time"
                      type="time"
                      aria-invalid={Boolean(availabilityForm.formState.errors.endTime)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-800 outline-none transition hover:border-sky-300 focus:border-[#119CF7] focus:ring-4 focus:ring-[#119CF7]/10"
                      {...availabilityForm.register('endTime')}
                    />
                  </div>
                  {availabilityForm.formState.errors.endTime && (
                    <span className="mt-1.5 block text-xs font-medium text-red-600" role="alert">
                      {availabilityForm.formState.errors.endTime.message}
                    </span>
                  )}
                </div>
              </div>
              {schedulingConstraints && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  Thời lượng tối đa: {schedulingConstraints.maximumParentSlotDurationMinutes} phút.
                </p>
              )}
            </div>

            <fieldset>
              <legend className="mb-1.5 text-sm font-semibold text-slate-700">
                Dịch vụ áp dụng <span className="text-red-500">*</span>
              </legend>
              <details className="group relative min-w-0 max-w-full">
                <summary className="flex min-h-11 w-full max-w-full cursor-pointer list-none items-center justify-between gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-left outline-none transition hover:border-sky-300 focus-visible:border-[#119CF7] focus-visible:ring-4 focus-visible:ring-[#119CF7]/10 [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 flex-1 overflow-hidden">
                    <span className="block truncate text-sm font-medium text-slate-800">
                      {selectedAvailabilityServiceIds.length
                        ? `${selectedAvailabilityServiceIds.length} dịch vụ đã chọn`
                        : 'Chọn dịch vụ áp dụng'}
                    </span>
                    {selectedAvailabilityServices.length > 0 && (
                      <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
                        <span className="truncate">{selectedAvailabilityServices[0].title}</span>
                        {selectedAvailabilityServices.length > 1 && (
                          <span className="shrink-0 rounded-full bg-sky-50 px-2 py-0.5 font-semibold text-primary">
                            +{selectedAvailabilityServices.length - 1} khác
                          </span>
                        )}
                      </span>
                    )}
                  </span>
                  <ChevronDown
                    className="h-5 w-5 shrink-0 text-slate-500 transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>

                <div className="absolute inset-x-0 z-20 mt-1.5 max-h-52 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">
                  {activeOneToOneServices.map((service) => (
                    <label
                      key={service.serviceId}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 outline-none transition hover:bg-sky-50 has-[:checked]:bg-sky-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#119CF7]/30"
                    >
                      <input
                        type="checkbox"
                        value={service.serviceId}
                        className="peer sr-only"
                        {...availabilityForm.register('serviceIds')}
                      />
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white transition peer-checked:border-[#119CF7] peer-checked:bg-[#119CF7] peer-checked:[&_svg]:opacity-100"
                        aria-hidden="true"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-white opacity-0 transition-opacity" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <strong className="block truncate text-sm font-semibold text-slate-900">
                          {service.title}
                        </strong>
                        <small className="mt-0.5 block text-xs text-slate-500">
                          {service.durationMinutes} phút · {formatServicePrice(service)}
                        </small>
                      </span>
                    </label>
                  ))}
                </div>
              </details>
              {availabilityForm.formState.errors.serviceIds && (
                <span className="mt-1.5 block text-xs font-medium text-red-600" role="alert">
                  {availabilityForm.formState.errors.serviceIds.message}
                </span>
              )}
            </fieldset>

            <div>
              <label
                className="mb-1.5 block text-sm font-semibold text-slate-700"
                htmlFor="availability-note"
              >
                Ghi chú
              </label>
              <textarea
                id="availability-note"
                className="min-h-16 w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-sky-300 focus:border-[#119CF7] focus:ring-4 focus:ring-[#119CF7]/10"
                rows={2}
                maxLength={200}
                placeholder="Thêm ghi chú cho khung giờ này (không bắt buộc)..."
                {...availabilityForm.register('note')}
              />
              {availabilityForm.formState.errors.note && (
                <span className="mt-1.5 block text-xs font-medium text-red-600" role="alert">
                  {availabilityForm.formState.errors.note.message}
                </span>
              )}
            </div>

            {!canCreateAvailability && (
              <p className="text-xs text-slate-500" role="status">
                Đang tải múi giờ đặt lịch...
              </p>
            )}

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-10 border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50 sm:min-w-24"
                disabled={isCreatingAvailability}
                onClick={() => setIsAvailabilityModalOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                loading={isCreatingAvailability}
                className="h-10 border-[#119CF7] bg-[#119CF7] hover:bg-[#0789dc] sm:min-w-36"
                disabled={
                  !canCreateAvailability ||
                  isCreatingAvailability ||
                  Boolean(availabilityRetryUntil)
                }
              >
                Tạo lịch rảnh
              </Button>
            </div>
          </form>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
            <CalendarDays className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-slate-700">
              Bạn cần có ít nhất một dịch vụ đang hoạt động trước khi mở lịch.
            </p>
            <Button
              type="button"
              className="mt-4 border-[#119CF7] bg-[#119CF7] hover:bg-[#0789dc]"
              onClick={showServicesSection}
            >
              Quản lý dịch vụ
            </Button>
          </div>
        )}
      </Modal>

      <Modal
        open={isScheduleSettingsOpen}
        hideHeader
        onClose={() => {
          if (!isSavingPolicy) {
            if (bookingPolicy) {
              setLeadTimeInput(String(bookingPolicy.minimumBookingLeadTimeMinutes));
              setHorizonInput(String(bookingPolicy.maximumBookingHorizonDays));
            }
            setIsScheduleSettingsOpen(false);
          }
        }}
        className="max-w-4xl lg:ml-64"
      >
        <div style={{ width: '100%', fontFamily: 'inherit' }}>
          {/* Modal Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Cài đặt lịch
            </h2>
            <button
              type="button"
              onClick={() => {
                if (!isSavingPolicy) {
                  if (bookingPolicy) {
                    setLeadTimeInput(String(bookingPolicy.minimumBookingLeadTimeMinutes));
                    setHorizonInput(String(bookingPolicy.maximumBookingHorizonDays));
                  }
                  setIsScheduleSettingsOpen(false);
                }
              }}
              style={{
                border: 'none',
                background: 'transparent',
                padding: '4px',
                cursor: 'pointer',
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                outline: 'none',
              }}
              aria-label="Đóng"
            >
              <X style={{ width: '22px', height: '22px', color: '#0f172a' }} />
            </button>
          </div>

          <form onSubmit={handleSaveBookingPolicy} noValidate>
            {policyStaleNotice && (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  color: '#92400e',
                  borderRadius: '12px',
                  fontSize: '13px',
                  marginBottom: '16px',
                }}
              >
                {policyStaleNotice}
              </div>
            )}

            {policyFormErrors.root && (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  borderRadius: '12px',
                  fontSize: '13px',
                  marginBottom: '16px',
                }}
              >
                {policyFormErrors.root}
              </div>
            )}

            {/* Main Content Grid: Left Column (Rules) & Right Column (Google Calendar Card) */}
            <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
              {/* Left Column: Quy tắc đặt lịch */}
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Quy tắc đặt lịch
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '3px 0 12px' }}>
                  Quản lý cách mentee có thể đặt lịch với bạn.
                </p>

                {/* Field 1: Múi giờ */}
                <div style={{ marginBottom: '14px' }}>
                  <label
                    htmlFor="policy-timezone"
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#334155',
                      marginBottom: '6px',
                      display: 'block',
                    }}
                  >
                    Múi giờ
                  </label>
                  <div
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 14px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#1e293b',
                      }}
                    >
                      <Globe style={{ width: '18px', height: '18px', color: '#475569' }} />
                      <span>{timezone || 'Asia/Ho_Chi_Minh'}</span>
                    </div>
                    <ChevronDown style={{ width: '16px', height: '16px', color: '#64748b' }} />
                  </div>
                  <p
                    style={{
                      fontSize: '12px',
                      color: '#94a3b8',
                      marginTop: '6px',
                      margin: '6px 0 0',
                    }}
                  >
                    Múi giờ của Booking Policy được dùng làm chuẩn cho tất cả lịch rảnh.
                  </p>
                </div>

                <div style={{ borderBottom: '1px solid #f1f5f9', margin: '14px 0' }} />

                {/* Field 2: Thời gian đặt trước tối thiểu */}
                <div style={{ marginBottom: '14px' }}>
                  <label
                    htmlFor="policy-lead-time"
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#334155',
                      marginBottom: '6px',
                      display: 'block',
                    }}
                  >
                    Thời gian đặt trước tối thiểu{' '}
                    <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span>
                  </label>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}
                  >
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        id="policy-lead-time"
                        type="number"
                        min={0}
                        value={leadTimeInput}
                        onChange={(e) => setLeadTimeInput(e.target.value)}
                        style={{
                          width: '100%',
                          height: '40px',
                          paddingLeft: '14px',
                          paddingRight: '48px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '12px',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#0f172a',
                          outline: 'none',
                        }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          right: '14px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: '13px',
                          color: '#94a3b8',
                          pointerEvents: 'none',
                        }}
                      >
                        phút
                      </span>
                    </div>
                    {Number(leadTimeInput) >= 0 && (
                      <span
                        style={{
                          height: '40px',
                          padding: '0 14px',
                          backgroundColor: '#f0f9ff',
                          border: '1px solid #bae6fd',
                          borderRadius: '12px',
                          color: '#119cf7',
                          fontSize: '13px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        ≈ {(Number(leadTimeInput) / 60).toFixed(1)} giờ
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0' }}>
                    Mentee cần đặt lịch trước ít nhất khoảng thời gian này.
                  </p>
                  {policyFormErrors.leadTime && (
                    <p
                      style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#ef4444',
                        margin: '4px 0 0',
                      }}
                    >
                      {policyFormErrors.leadTime}
                    </p>
                  )}
                </div>

                {/* Field 3: Cho phép đặt trước tối đa */}
                <div>
                  <label
                    htmlFor="policy-horizon"
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#334155',
                      marginBottom: '6px',
                      display: 'block',
                    }}
                  >
                    Cho phép đặt trước tối đa{' '}
                    <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span>
                  </label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <input
                      id="policy-horizon"
                      type="number"
                      min={1}
                      value={horizonInput}
                      onChange={(e) => setHorizonInput(e.target.value)}
                      style={{
                        width: '100%',
                        height: '40px',
                        paddingLeft: '14px',
                        paddingRight: '48px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#0f172a',
                        outline: 'none',
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        right: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '13px',
                        color: '#94a3b8',
                        pointerEvents: 'none',
                      }}
                    >
                      ngày
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0' }}>
                    Mentee chỉ có thể đặt lịch trong khoảng thời gian này.
                  </p>
                  {policyFormErrors.horizon && (
                    <p
                      style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#ef4444',
                        margin: '4px 0 0',
                      }}
                    >
                      {policyFormErrors.horizon}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column: Google Calendar Card */}
              <div
                style={{
                  backgroundColor: '#f4f8ff',
                  border: '1px solid #e2edff',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  {/* Google Calendar Header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '15px',
                      fontWeight: 700,
                      color: '#0f172a',
                      marginBottom: '8px',
                    }}
                  >
                    <Calendar style={{ width: '22px', height: '22px', color: '#1a73e8' }} />
                    <span>Google Calendar</span>
                  </div>

                  {/* Calendar Illustration Box */}
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      padding: '8px 0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {/* Sparkle Star 1 */}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      style={{
                        position: 'absolute',
                        left: '32px',
                        top: '8px',
                        width: '14px',
                        height: '14px',
                        color: '#7dd3fc',
                        fill: 'currentColor',
                      }}
                    >
                      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                    </svg>
                    {/* Sparkle Star 2 */}
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      style={{
                        position: 'absolute',
                        right: '28px',
                        top: '24px',
                        width: '12px',
                        height: '12px',
                        color: '#7dd3fc',
                        fill: 'currentColor',
                      }}
                    >
                      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                    </svg>

                    {/* Floating White Calendar Card */}
                    <div
                      style={{
                        position: 'relative',
                        width: '112px',
                        height: '80px',
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        boxShadow: '0 8px 20px rgba(0, 112, 243, 0.12)',
                        border: '1px solid #e2e8f0',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      {/* Binders */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '3px',
                          left: '0',
                          right: '0',
                          display: 'flex',
                          justifyContent: 'space-around',
                          padding: '0 20px',
                          zIndex: 10,
                        }}
                      >
                        <div
                          style={{
                            width: '6px',
                            height: '8px',
                            backgroundColor: '#cbd5e1',
                            borderRadius: '3px',
                          }}
                        />
                        <div
                          style={{
                            width: '6px',
                            height: '8px',
                            backgroundColor: '#cbd5e1',
                            borderRadius: '3px',
                          }}
                        />
                        <div
                          style={{
                            width: '6px',
                            height: '8px',
                            backgroundColor: '#cbd5e1',
                            borderRadius: '3px',
                          }}
                        />
                      </div>
                      {/* Blue Top Banner */}
                      <div style={{ height: '22px', backgroundColor: '#1a73e8', width: '100%' }} />
                      {/* Dots Grid */}
                      <div
                        style={{
                          padding: '7px 10px',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: '6px',
                          alignItems: 'center',
                          justifyItems: 'center',
                          flex: 1,
                        }}
                      >
                        <div
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: '#93c5fd',
                          }}
                        />
                        <div
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: '#93c5fd',
                          }}
                        />
                        <div
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: '#93c5fd',
                          }}
                        />
                        <div
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: '#93c5fd',
                          }}
                        />
                        <div
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: '#93c5fd',
                          }}
                        />
                        <div
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: '#93c5fd',
                          }}
                        />
                      </div>
                      {/* Blue Checkmark Badge */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '6px',
                          right: '6px',
                          width: '26px',
                          height: '26px',
                          backgroundColor: '#1a73e8',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid #ffffff',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ width: '14px', height: '14px' }}
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Status & Connection Button */}
                  {!googleCalendarStatus ? (
                    <div
                      style={{
                        padding: '12px',
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        borderRadius: '12px',
                        textAlign: 'center',
                        fontSize: '13px',
                        color: '#64748b',
                      }}
                    >
                      Đang tải trạng thái...
                    </div>
                  ) : !googleCalendarStatus.connected ? (
                    <div style={{ textAlign: 'center' }}>
                      <h4
                        style={{
                          fontSize: '15px',
                          fontWeight: 700,
                          color: '#0f172a',
                          margin: '6px 0 3px',
                        }}
                      >
                        Chưa kết nối
                      </h4>
                      <p
                        style={{
                          fontSize: '12px',
                          color: '#64748b',
                          lineHeight: 1.5,
                          margin: '0 0 10px',
                        }}
                      >
                        Kết nối để đồng bộ lịch cá nhân và hỗ trợ tránh trùng lịch.
                      </p>
                      <button
                        type="button"
                        disabled={isInitiatingGoogleOAuth}
                        onClick={handleInitiateGoogleOAuth}
                        style={{
                          width: '100%',
                          height: '40px',
                          backgroundColor: '#1a73e8',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '12px',
                          fontWeight: 600,
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '10px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(26,115,232,0.25)',
                        }}
                      >
                        <div
                          style={{
                            width: '22px',
                            height: '22px',
                            backgroundColor: '#ffffff',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            style={{ width: '14px', height: '14px' }}
                          >
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            />
                          </svg>
                        </div>
                        <span>
                          {isInitiatingGoogleOAuth ? 'Đang kết nối...' : 'Kết nối Google Calendar'}
                        </span>
                      </button>
                    </div>
                  ) : googleCalendarStatus.needsReconnect ? (
                    <div style={{ textAlign: 'center' }}>
                      <h4
                        style={{
                          fontSize: '15px',
                          fontWeight: 700,
                          color: '#b45309',
                          margin: '10px 0 4px',
                        }}
                      >
                        Cần kết nối lại
                      </h4>
                      {googleCalendarStatus.email && (
                        <p
                          style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#334155',
                            backgroundColor: '#ffffff',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            margin: '0 0 10px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {googleCalendarStatus.email}
                        </p>
                      )}
                      <button
                        type="button"
                        disabled={isInitiatingGoogleOAuth}
                        onClick={handleInitiateGoogleOAuth}
                        style={{
                          width: '100%',
                          height: '44px',
                          backgroundColor: '#1a73e8',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '12px',
                          fontWeight: 600,
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        {isInitiatingGoogleOAuth ? 'Đang xử lý...' : 'Kết nối lại'}
                      </button>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <h4
                        style={{
                          fontSize: '15px',
                          fontWeight: 700,
                          color: '#047857',
                          margin: '10px 0 4px',
                        }}
                      >
                        Đã kết nối
                      </h4>
                      {googleCalendarStatus.email && (
                        <p
                          style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#334155',
                            backgroundColor: '#ffffff',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            margin: '0 0 10px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {googleCalendarStatus.email}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsDisconnectModalOpen(true)}
                        style={{
                          width: '100%',
                          height: '40px',
                          backgroundColor: '#ffffff',
                          color: '#334155',
                          border: '1px solid #cbd5e1',
                          borderRadius: '12px',
                          fontWeight: 600,
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        Ngắt kết nối
                      </button>
                    </div>
                  )}
                </div>

                {/* Feature List (Bottom) */}
                <div
                  style={{
                    borderTop: '1px solid #dbeafe',
                    paddingTop: '10px',
                    marginTop: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '7px',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: '#334155',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <RefreshCw
                      style={{ width: '16px', height: '16px', color: '#1a73e8', flexShrink: 0 }}
                    />
                    <span>Đồng bộ tự động lịch rảnh</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ShieldCheck
                      style={{ width: '16px', height: '16px', color: '#1a73e8', flexShrink: 0 }}
                    />
                    <span>Tránh trùng lịch hiệu quả</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Lock
                      style={{ width: '16px', height: '16px', color: '#1a73e8', flexShrink: 0 }}
                    />
                    <span>Dữ liệu an toàn và bảo mật</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                borderTop: '1px solid #f1f5f9',
                paddingTop: '12px',
                marginTop: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '12px',
              }}
            >
              <button
                type="button"
                disabled={isSavingPolicy}
                onClick={() => {
                  if (bookingPolicy) {
                    setLeadTimeInput(String(bookingPolicy.minimumBookingLeadTimeMinutes));
                    setHorizonInput(String(bookingPolicy.maximumBookingHorizonDays));
                  }
                  setIsScheduleSettingsOpen(false);
                }}
                style={{
                  height: '38px',
                  padding: '0 18px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '12px',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={!isPolicyDirty || isSavingPolicy || Boolean(policyRetryUntil)}
                style={{
                  height: '38px',
                  padding: '0 18px',
                  backgroundColor: !isPolicyDirty || isSavingPolicy ? '#94a3b8' : '#1a73e8',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: !isPolicyDirty || isSavingPolicy ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 4px rgba(26,115,232,0.2)',
                }}
              >
                {isSavingPolicy ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal "+ Thêm dịch vụ" */}
      <Modal
        open={pendingStatusChange !== null}
        title={pendingStatusChange?.isActive ? 'Tắt dịch vụ' : 'Bật dịch vụ'}
        onClose={() => setPendingStatusChange(null)}
        className="max-w-md"
      >
        {pendingStatusChange && (
          <div>
            <div className="flex items-start gap-4">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                  pendingStatusChange.isActive
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-sky-50 text-[#119CF7]'
                }`}
              >
                {pendingStatusChange.isActive ? (
                  <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm leading-6 text-slate-600">
                  {pendingStatusChange.isActive
                    ? 'Mentee sẽ tạm thời không thể đặt dịch vụ này.'
                    : 'Dịch vụ sẽ xuất hiện để mentee có thể đặt lịch.'}
                </p>
                <p className="mt-2 break-words text-base font-bold text-slate-900">
                  {pendingStatusChange.title}
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-10 border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50 sm:min-w-24"
                onClick={() => setPendingStatusChange(null)}
              >
                Hủy
              </Button>
              <Button
                type="button"
                className={`h-10 sm:min-w-32 ${
                  pendingStatusChange.isActive
                    ? 'border-amber-500 bg-amber-500 hover:bg-amber-600'
                    : 'border-[#119CF7] bg-[#119CF7] hover:bg-[#0789dc]'
                }`}
                onClick={confirmStatusChange}
              >
                {pendingStatusChange.isActive ? 'Tắt dịch vụ' : 'Bật dịch vụ'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={openModal}
        title="Tạo mới Khóa học / Dịch vụ tư vấn"
        onClose={() => !isSaving && setOpenModal(false)}
        className="max-w-xl"
      >
        <form className="space-y-3" onSubmit={form.handleSubmit(onSubmitCreateService)} noValidate>
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-3.5 shadow-sm sm:p-4">
            <div className="space-y-3.5">
              <div>
                <label
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                  htmlFor="new-service-title"
                >
                  Tên dịch vụ / Khóa học <span className="text-red-500">*</span>
                </label>
                <input
                  id="new-service-title"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-sky-300 focus:border-[#119CF7] focus:ring-4 focus:ring-[#119CF7]/10"
                  placeholder="VD: Review CV & định hướng nghề nghiệp"
                  aria-invalid={Boolean(form.formState.errors.title)}
                  {...form.register('title')}
                />
                {form.formState.errors.title && (
                  <span className="mt-1.5 block text-xs font-medium text-red-600" role="alert">
                    {form.formState.errors.title.message}
                  </span>
                )}
              </div>

              <div>
                <label
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                  htmlFor="new-service-desc"
                >
                  Mô tả dịch vụ <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="new-service-desc"
                  className="min-h-20 w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-5 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-sky-300 focus:border-[#119CF7] focus:ring-4 focus:ring-[#119CF7]/10"
                  rows={3}
                  placeholder="Mô tả nội dung mentor sẽ hỗ trợ trong buổi tư vấn..."
                  aria-invalid={Boolean(form.formState.errors.description)}
                  {...form.register('description')}
                />
                {form.formState.errors.description && (
                  <span className="mt-1.5 block text-xs font-medium text-red-600" role="alert">
                    {form.formState.errors.description.message}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                    htmlFor="new-service-duration"
                  >
                    Thời lượng tư vấn <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock
                      className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#119CF7]"
                      aria-hidden="true"
                    />
                    <select
                      id="new-service-duration"
                      className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-11 pr-10 text-sm text-slate-900 outline-none transition hover:border-sky-300 focus:border-[#119CF7] focus:ring-4 focus:ring-[#119CF7]/10"
                      aria-invalid={Boolean(form.formState.errors.durationMinutes)}
                      {...form.register('durationMinutes')}
                    >
                      <option value="">Chọn thời lượng</option>
                      {(constraints?.allowedDurationMinutes ?? []).map((mins) => (
                        <option key={mins} value={mins}>
                          {mins} phút
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                      aria-hidden="true"
                    />
                  </div>
                  {form.formState.errors.durationMinutes && (
                    <span className="mt-1.5 block text-xs font-medium text-red-600" role="alert">
                      {form.formState.errors.durationMinutes.message}
                    </span>
                  )}
                </div>

                <div>
                  <label
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                    htmlFor="new-service-price"
                  >
                    Học phí (S-coins)
                  </label>
                  <div className="relative">
                    <input
                      id="new-service-price"
                      type="number"
                      min={0}
                      disabled={isFreeWatched}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-20 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-sky-300 focus:border-[#119CF7] focus:ring-4 focus:ring-[#119CF7]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                      placeholder="150000"
                      aria-invalid={Boolean(form.formState.errors.priceScoin)}
                      {...form.register('priceScoin')}
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                      S-coins
                    </span>
                  </div>
                  {form.formState.errors.priceScoin && (
                    <span className="mt-1.5 block text-xs font-medium text-red-600" role="alert">
                      {form.formState.errors.priceScoin.message}
                    </span>
                  )}
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-sky-300 hover:bg-sky-50/40 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-[#119CF7]/15">
                <input type="checkbox" className="peer sr-only" {...form.register('isFree')} />
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white transition peer-checked:border-[#119CF7] peer-checked:bg-[#119CF7] peer-checked:[&_svg]:opacity-100"
                  aria-hidden="true"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-white opacity-0 transition-opacity" />
                </span>
                <span>
                  <strong className="block text-sm font-semibold text-slate-800">
                    Cung cấp dịch vụ miễn phí
                  </strong>
                  <small className="mt-0.5 block text-xs leading-4 text-slate-500">
                    Mentee sẽ không bị trừ S-coins khi đặt dịch vụ này.
                  </small>
                </span>
              </label>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-10 border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50 sm:min-w-24"
              disabled={isSaving}
              onClick={() => setOpenModal(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              loading={isSaving}
              className="h-10 border-[#119CF7] bg-[#119CF7] hover:bg-[#0789dc] sm:min-w-40"
            >
              Tạo dịch vụ
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Chi tiết Lịch rảnh / Lịch hẹn */}
      <Modal
        open={isDetailModalOpen && Boolean(selectedSlot || selectedBooking)}
        title={selectedBooking ? 'Chi tiết lịch hẹn' : 'Chi tiết lịch rảnh'}
        hideHeader
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedSlotId(null);
          setSelectedBookingId(null);
        }}
        className={selectedBooking ? 'bookingAvailabilityDetailModalShell' : 'max-w-xl'}
      >
        {selectedBooking ? (
          <BookingAvailabilityDetail
            booking={selectedBooking}
            timezone={timezone}
            canDeactivate={Boolean(selectedSlot && canDeactivate)}
            canEdit={Boolean(selectedSlot && !isTimeEditBlocked)}
            onClose={() => {
              setIsDetailModalOpen(false);
              setSelectedSlotId(null);
              setSelectedBookingId(null);
            }}
            onDeactivate={handleOpenDeactivateModal}
            onEdit={handleOpenEditModal}
          />
        ) : selectedSlot ? (
          <div className="space-y-4">
            <header className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  Chi tiết lịch rảnh
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Thông tin khung giờ mentee có thể đặt lịch.
                </p>
              </div>
              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 outline-none transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-4 focus-visible:ring-[#119CF7]/20"
                aria-label="Đóng"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedSlotId(null);
                  setSelectedBookingId(null);
                }}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </header>

            <section
              className="grid grid-cols-1 gap-3 sm:grid-cols-2"
              aria-label="Thông tin lịch rảnh"
            >
              <div className="flex min-w-0 items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#119CF7]"
                  aria-hidden="true"
                >
                  <Calendar className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Ngày
                  </span>
                  <strong className="mt-1 block truncate text-sm text-slate-900">
                    {selectedSlotStart?.date.split('-').reverse().join('/')}
                  </strong>
                </div>
              </div>

              <div className="flex min-w-0 items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#119CF7]"
                  aria-hidden="true"
                >
                  <Clock className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Thời gian
                  </span>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <strong className="text-sm text-slate-900">
                      {selectedSlotStart?.time} – {selectedSlotEnd?.time}
                    </strong>
                    {selectedSlotDurationMinutes > 0 && (
                      <span className="text-xs text-slate-500">
                        {Math.floor(selectedSlotDurationMinutes / 60) > 0 &&
                          `${Math.floor(selectedSlotDurationMinutes / 60)} giờ `}
                        {selectedSlotDurationMinutes % 60 > 0 &&
                          `${selectedSlotDurationMinutes % 60} phút`}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex min-w-0 items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#119CF7]"
                  aria-hidden="true"
                >
                  <Globe className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Múi giờ
                  </span>
                  <strong className="mt-1 block truncate text-sm text-slate-900">
                    {selectedSlot.timezone}
                  </strong>
                </div>
              </div>

              <div className="flex min-w-0 items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#119CF7]"
                  aria-hidden="true"
                >
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Ghi chú
                  </span>
                  <strong className="mt-1 block line-clamp-2 text-sm text-slate-900">
                    {selectedSlot.note?.trim() || 'Không có ghi chú'}
                  </strong>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Dịch vụ có thể đặt trong khung giờ này
                </h3>
                <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-[#087fc5]">
                  {selectedSlot.services.length} dịch vụ
                </span>
              </div>

              {selectedSlot.services.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {selectedSlot.services.map((service) => (
                    <div
                      className="rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3"
                      key={service.serviceId}
                    >
                      <strong className="block text-sm font-semibold text-slate-900">
                        {service.title}
                      </strong>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{service.durationMinutes} phút</span>
                        {(service.isFree || service.priceScoin != null) && (
                          <span className="h-1 w-1 rounded-full bg-slate-300" aria-hidden="true" />
                        )}
                        {service.isFree ? (
                          <span className="font-semibold text-emerald-600">Miễn phí</span>
                        ) : service.priceScoin != null ? (
                          <span className="font-semibold text-[#119CF7]">
                            {new Intl.NumberFormat('vi-VN').format(service.priceScoin)} S-coins
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">
                  Chưa có dịch vụ nào được áp dụng cho khung giờ này.
                </p>
              )}
            </section>

            {(selectedSlot.pendingBookingCount > 0 ||
              selectedSlot.hasLockingBooking ||
              isTimeEditBlocked) && (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Không thể thay đổi khung giờ rảnh này vì đã có mentee booking.</span>
              </div>
            )}

            <footer className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-10 border-slate-300 text-slate-700 hover:border-red-300 hover:bg-red-50 hover:text-red-600 sm:min-w-36"
                disabled={!canDeactivate}
                title={deactivationReason || undefined}
                onClick={handleOpenDeactivateModal}
              >
                Thu hồi lịch rảnh
              </Button>
              <Button
                type="button"
                className="h-10 border-[#119CF7] bg-[#119CF7] hover:bg-[#0789dc] sm:min-w-28"
                onClick={handleOpenEditModal}
              >
                Chỉnh sửa
              </Button>
            </footer>
          </div>
        ) : null}
      </Modal>

      {/* Modal Chỉnh sửa Lịch rảnh */}
      <Modal
        open={isEditModalOpen && Boolean(selectedSlot)}
        title="Chỉnh sửa lịch rảnh"
        onClose={() => !isUpdatingSlot && setIsEditModalOpen(false)}
        className="mentor-availability-slot-modal"
      >
        {activeOneToOneServices.length ? (
          <form
            className="mentor-availability-slot-form"
            onSubmit={editAvailabilityForm.handleSubmit((values) =>
              onSubmitUpdateAvailabilitySlot(values),
            )}
            noValidate
          >
            {editStaleNotice && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-medium mb-3">
                {editStaleNotice}
              </div>
            )}

            {isTimeEditBlocked && (
              <div className="p-2.5 bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-xs mb-3">
                Thời gian không thể thay đổi do:{' '}
                <strong>{timeMutationReason || 'Lịch đã có booking.'}</strong>
              </div>
            )}

            <div className="form-field-group">
              <label className="form-label" htmlFor="edit-availability-date">
                Ngày <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-availability-date"
                type="date"
                disabled={isTimeEditBlocked}
                className="form-input disabled:bg-gray-100 disabled:cursor-not-allowed"
                {...editAvailabilityForm.register('date')}
              />
              {editAvailabilityForm.formState.errors.date && (
                <span className="form-error-msg">
                  {editAvailabilityForm.formState.errors.date.message}
                </span>
              )}
            </div>

            <div className="mentor-availability-time-fields">
              <div className="form-field-group">
                <label className="form-label" htmlFor="edit-availability-start-time">
                  Bắt đầu <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-availability-start-time"
                  type="time"
                  disabled={isTimeEditBlocked}
                  className="form-input disabled:bg-gray-100 disabled:cursor-not-allowed"
                  {...editAvailabilityForm.register('startTime')}
                />
                {schedulingConstraints && !isTimeEditBlocked && (
                  <small className="mentor-availability-helper">
                    Thời lượng tối đa: {schedulingConstraints.maximumParentSlotDurationMinutes}{' '}
                    phút.
                  </small>
                )}
                {editAvailabilityForm.formState.errors.startTime && (
                  <span className="form-error-msg">
                    {editAvailabilityForm.formState.errors.startTime.message}
                  </span>
                )}
              </div>
              <div className="form-field-group">
                <label className="form-label" htmlFor="edit-availability-end-time">
                  Kết thúc <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-availability-end-time"
                  type="time"
                  disabled={isTimeEditBlocked}
                  className="form-input disabled:bg-gray-100 disabled:cursor-not-allowed"
                  {...editAvailabilityForm.register('endTime')}
                />
                {editAvailabilityForm.formState.errors.endTime && (
                  <span className="form-error-msg">
                    {editAvailabilityForm.formState.errors.endTime.message}
                  </span>
                )}
              </div>
            </div>

            <fieldset className="mentor-availability-service-options">
              <legend>
                Dịch vụ áp dụng <span className="text-red-500">*</span>
              </legend>
              {activeOneToOneServices.map((service) => (
                <label key={service.serviceId}>
                  <input
                    type="checkbox"
                    value={service.serviceId}
                    {...editAvailabilityForm.register('serviceIds')}
                  />
                  <span>
                    <strong>{service.title}</strong>
                    <small>
                      {service.durationMinutes} phút · {formatServicePrice(service)}
                    </small>
                  </span>
                </label>
              ))}
              {editAvailabilityForm.formState.errors.serviceIds && (
                <span className="form-error-msg">
                  {editAvailabilityForm.formState.errors.serviceIds.message}
                </span>
              )}
            </fieldset>

            <div className="form-field-group">
              <label className="form-label" htmlFor="edit-availability-note">
                Ghi chú
              </label>
              <textarea
                id="edit-availability-note"
                className="form-textarea"
                rows={3}
                maxLength={200}
                {...editAvailabilityForm.register('note')}
              />
              {editAvailabilityForm.formState.errors.note && (
                <span className="form-error-msg">
                  {editAvailabilityForm.formState.errors.note.message}
                </span>
              )}
            </div>

            {editAvailabilityForm.formState.errors.root?.message && (
              <p className="mentor-availability-form-error" role="alert">
                {editAvailabilityForm.formState.errors.root.message}
              </p>
            )}

            <div className="form-modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                disabled={isUpdatingSlot}
                onClick={() => setIsEditModalOpen(false)}
              >
                Hủy
              </button>
              <Button
                type="submit"
                className="btn-modal-submit"
                disabled={isUpdatingSlot || Boolean(availabilityRetryUntil)}
              >
                {isUpdatingSlot ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>

      {/* Modal Confirm Thu hồi Lịch rảnh */}
      <Modal
        open={isDeactivateModalOpen && Boolean(selectedSlot)}
        title="Thu hồi lịch rảnh?"
        onClose={() => !isDeactivatingSlot && setIsDeactivateModalOpen(false)}
        className="mentor-availability-slot-modal"
      >
        {selectedSlot && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Bạn có chắc chắn muốn thu hồi khung giờ lịch rảnh này không?
            </p>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs space-y-1">
              <div>
                <strong>Ngày: </strong>
                {selectedSlotStart?.date.split('-').reverse().join('/')}
              </div>
              <div>
                <strong>Thời gian: </strong>
                {selectedSlotStart?.time} – {selectedSlotEnd?.time}
              </div>
              <div>
                <strong>Dịch vụ: </strong>
                {selectedSlot.services.map((s) => s.title).join(', ')}
              </div>
            </div>

            {selectedSlot.pendingBookingCount > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  Khung giờ này đang có {selectedSlot.pendingBookingCount} yêu cầu đặt lịch chờ xác
                  nhận. Thu hồi lịch sẽ từ chối các yêu cầu này.
                </span>
              </div>
            )}

            <div className="form-modal-footer flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="btn-modal-cancel"
                disabled={isDeactivatingSlot}
                onClick={() => setIsDeactivateModalOpen(false)}
              >
                Hủy
              </button>
              <Button
                type="button"
                className="btn-modal-submit bg-red-600 hover:bg-red-700 text-white"
                disabled={isDeactivatingSlot || Boolean(availabilityRetryUntil)}
                onClick={() => handleDeactivateSlot(false)}
              >
                {isDeactivatingSlot ? 'Đang thu hồi...' : 'Thu hồi lịch rảnh'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Confirm Từ chối Pending Booking */}
      <Modal
        open={pendingRejectionConfirm !== null}
        title="Xác nhận từ chối yêu cầu đặt lịch"
        onClose={() => setPendingRejectionConfirm(null)}
        className="mentor-availability-slot-modal"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Cảnh báo yêu cầu đặt lịch đang chờ</p>
              <p className="text-xs">
                Khung giờ này đang có yêu cầu đặt lịch chờ xác nhận. Nếu tiếp tục thao tác, các yêu
                cầu liên quan sẽ bị tự động từ chối.
              </p>
            </div>
          </div>

          <div className="form-modal-footer flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={() => setPendingRejectionConfirm(null)}
            >
              Hủy
            </button>
            <Button
              type="button"
              className="btn-modal-submit bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleConfirmPendingRejection}
            >
              Tiếp tục
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Form Tạo/Sửa Lịch hàng tuần */}
      <AvailabilityTemplateFormModal
        open={isTemplateFormOpen}
        template={selectedTemplateForEdit}
        activeServices={activeOneToOneServices}
        isSubmitting={isSubmittingTemplate}
        staleNotice={templateStaleNotice}
        onClose={() => {
          setIsTemplateFormOpen(false);
          setSelectedTemplateForEdit(null);
        }}
        onSubmitCreate={onSubmitCreateTemplate}
        onSubmitUpdate={onSubmitUpdateTemplate}
      />

      {/* Modal Chi tiết Lịch hàng tuần */}
      <AvailabilityTemplateDetailModal
        open={selectedTemplateForDetail !== null}
        template={selectedTemplateForDetail}
        isSubmittingException={isSubmittingException}
        onClose={() => setSelectedTemplateForDetail(null)}
        onOpenEdit={handleOpenEditTemplate}
        onPause={(template) => {
          setSelectedTemplateForDetail(null);
          setPendingTemplateActionConfirm({ type: 'pause', template });
        }}
        onResume={(template) => {
          setSelectedTemplateForDetail(null);
          setPendingTemplateActionConfirm({ type: 'resume', template });
        }}
        onArchive={(template) => {
          setSelectedTemplateForDetail(null);
          setPendingTemplateActionConfirm({ type: 'archive', template });
        }}
        onSubmitSkipDate={handleSkipTemplateDate}
        onSubmitRestoreDate={handleRestoreTemplateDate}
      />

      {/* Modal Confirm Tạm dừng / Tiếp tục / Lưu trữ Lịch lặp */}
      <Modal
        open={pendingTemplateActionConfirm !== null}
        title={
          pendingTemplateActionConfirm?.type === 'pause'
            ? 'Tạm dừng lịch hàng tuần?'
            : pendingTemplateActionConfirm?.type === 'resume'
              ? 'Tiếp tục lịch hàng tuần?'
              : 'Lưu trữ lịch hàng tuần?'
        }
        onClose={() => setPendingTemplateActionConfirm(null)}
        className="mentor-availability-slot-modal"
      >
        {pendingTemplateActionConfirm && (
          <div className="space-y-4 text-sm text-gray-700">
            <p>
              {pendingTemplateActionConfirm.type === 'pause'
                ? 'Bạn có chắc chắn muốn tạm dừng mẫu lịch lặp này? Hệ thống sẽ tạm thời ngưng tự động mở lịch mới từ mẫu này.'
                : pendingTemplateActionConfirm.type === 'resume'
                  ? 'Bạn có chắc chắn muốn tiếp tục kích hoạt lại mẫu lịch lặp này?'
                  : 'Sau khi lưu trữ, mẫu lịch này sẽ ngừng hoạt động vĩnh viễn và không tạo thêm lịch rảnh mới.'}
            </p>

            <div className="form-modal-footer flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setPendingTemplateActionConfirm(null)}
              >
                Hủy
              </button>
              <Button
                type="button"
                className={`btn-modal-submit ${
                  pendingTemplateActionConfirm.type === 'archive'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-sky-600 hover:bg-sky-700 text-white'
                }`}
                onClick={async () => {
                  const { type, template } = pendingTemplateActionConfirm;
                  setPendingTemplateActionConfirm(null);
                  if (type === 'pause') {
                    await handleConfirmPauseTemplate(template);
                  } else if (type === 'resume') {
                    await handleConfirmResumeTemplate(template);
                  } else if (type === 'archive') {
                    await handleConfirmArchiveTemplate(template);
                  }
                }}
              >
                {pendingTemplateActionConfirm.type === 'pause'
                  ? 'Tạm dừng'
                  : pendingTemplateActionConfirm.type === 'resume'
                    ? 'Tiếp tục'
                    : 'Lưu trữ'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Confirm Ngắt kết nối Google Calendar */}
      <Modal
        open={isDisconnectModalOpen}
        title="Ngắt kết nối Google Calendar?"
        onClose={() => !isDisconnecting && setIsDisconnectModalOpen(false)}
        className="mentor-availability-slot-modal"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            SkillSwap sẽ ngừng đồng bộ Google Calendar cho các lịch mới.
          </p>

          <div className="form-modal-footer pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDisconnecting}
              onClick={() => setIsDisconnectModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={isDisconnecting}
              onClick={handleConfirmDisconnectGoogleCalendar}
            >
              Ngắt kết nối
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Thông báo CAL_4403 (Chưa thể ngắt kết nối) */}
      <Modal
        open={Boolean(cannotDisconnectNotice)}
        title="Chưa thể ngắt Google Calendar"
        onClose={() => setCannotDisconnectNotice(null)}
        className="mentor-availability-slot-modal"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">{cannotDisconnectNotice}</p>

          <div className="form-modal-footer pt-3 border-t border-slate-100 flex justify-end">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setCannotDisconnectNotice(null)}
            >
              Đã hiểu
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
