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
import { formatDateVi } from './mentorTemplateHelpers';
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
  Settings,
  ShieldCheck,
  Target,
  UserRound,
  Video,
  X,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
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
  if (filter === 'WAITING') return { label: 'Đang chờ', variant: 'warning' as const };
  if (filter === 'IN_PROGRESS') return { label: 'Đang diễn ra', variant: 'info' as const };
  if (filter === 'COMPLETED') return { label: 'Đã hoàn thành', variant: 'success' as const };
  if (filter === 'NO_SHOW') return { label: 'Vắng mặt', variant: 'danger' as const };
  if (filter === 'REJECTED') return { label: 'Bị từ chối', variant: 'danger' as const };
  if (filter === 'EXPIRED') return { label: 'Quá hạn', variant: 'danger' as const };
  if (filter === 'CANCELLED_BY_MENTEE') return { label: 'Mentee hủy', variant: 'danger' as const };
  if (filter === 'CANCELLED_BY_MENTOR') return { label: 'Mentor hủy', variant: 'danger' as const };
  return { label: 'Đã đóng', variant: 'danger' as const };
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
    return <FileText className="w-5 h-5 text-blue-600" />;
  }
  if (lower.includes('interview') || lower.includes('phỏng vấn')) {
    return <Target className="w-5 h-5 text-blue-600" />;
  }
  if (lower.includes('career') || lower.includes('định hướng') || lower.includes('strategy')) {
    return <Compass className="w-5 h-5 text-blue-600" />;
  }
  return <BookOpen className="w-5 h-5 text-blue-600" />;
}

function showServiceStatusSuccess(isActive: boolean) {
  showSuccess({
    title: isActive ? 'Đã bật dịch vụ' : 'Đã tạm ẩn dịch vụ',
    description: isActive
      ? 'Mentee có thể đặt dịch vụ này.'
      : 'Mentee tạm thời không thể đặt dịch vụ này.',
  });
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
      availabilityForm.setError('root', {
        type: 'validate',
        message: 'Chưa tải được múi giờ đặt lịch. Vui lòng thử lại sau.',
      });
      return;
    }

    if (values.startTime >= values.endTime) {
      availabilityForm.setError('endTime', {
        type: 'validate',
        message: 'Giờ kết thúc phải sau giờ bắt đầu.',
      });
      return;
    }

    let startAt: string;
    let endAt: string;
    try {
      startAt = localDateTimeToUtcIso({ date: values.date, time: values.startTime }, timezone);
      endAt = localDateTimeToUtcIso({ date: values.date, time: values.endTime }, timezone);
    } catch (reason) {
      availabilityForm.setError('root', {
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
      availabilityForm.setError('endTime', {
        type: 'validate',
        message: `Thời lượng tối đa là ${schedulingConstraints.maximumParentSlotDurationMinutes} phút.`,
      });
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
        if (reason.status === 400 && reason.data?.length) {
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
          availabilityForm.setError('root', {
            type: 'server',
            message: reason.message,
          });
        } else if (reason.status === 429) {
          const retryAfterSeconds = reason.retryAfterSeconds ?? 0;
          if (retryAfterSeconds > 0) {
            setAvailabilityRetryUntil(Date.now() + retryAfterSeconds * 1000);
          }
          availabilityForm.setError('root', {
            type: 'server',
            message:
              retryAfterSeconds > 0
                ? `Bạn thao tác quá nhanh. Vui lòng thử lại sau ${retryAfterSeconds} giây.`
                : reason.message,
          });
        } else {
          availabilityForm.setError('root', { type: 'server', message: reason.message });
        }
      } else {
        availabilityForm.setError('root', {
          type: 'server',
          message: 'Không thể tạo lịch rảnh. Vui lòng thử lại.',
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

  return (
    <div className="mx-auto w-full max-w-[1480px] space-y-8 pb-8 [--schedule-primary:#119CF7]">
      <section ref={serviceSectionRef} aria-labelledby="mentor-services-heading">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              id="mentor-services-heading"
              className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl"
            >
              Dịch vụ của tôi
            </h2>
            <p className="mt-1 text-sm text-slate-500">Bật/tắt dịch vụ và quản lý giá.</p>
          </div>
          <Button
            variant="primary"
            size="md"
            className="h-11 bg-[var(--schedule-primary)] px-5 hover:bg-[#0789dc] focus-visible:ring-[#119CF7]/25"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setOpenModal(true)}
          >
            Thêm dịch vụ
          </Button>
        </div>

        {loading ? (
          <div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
            aria-label="Đang tải danh sách dịch vụ"
            aria-busy="true"
          >
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="flex gap-3">
                  <span className="h-11 w-11 rounded-xl bg-slate-100" />
                  <span className="mt-1 h-4 w-36 rounded bg-slate-100" />
                </div>
                <span className="mt-7 block h-6 w-32 rounded bg-slate-100" />
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => {
              const isToggling = togglingId === service.serviceId;
              const priceText = service.isFree
                ? 'Miễn phí'
                : `${new Intl.NumberFormat('vi-VN').format(service.publicPriceScoin ?? 0)} S-coins`;

              return (
                <article
                  key={service.serviceId}
                  className={`min-h-36 rounded-2xl border bg-white p-5 shadow-sm transition duration-200 hover:shadow-md ${
                    service.isActive
                      ? 'border-[#119CF7]'
                      : 'border-slate-200 bg-slate-50/80 text-slate-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        service.isActive
                          ? 'bg-sky-50 text-[var(--schedule-primary)]'
                          : 'bg-slate-200/70 text-slate-400'
                      }`}
                      aria-hidden="true"
                    >
                      {getServiceIcon(service.title)}
                    </div>
                    <button
                      type="button"
                      className="min-w-0 flex-1 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-[#119CF7] focus-visible:ring-offset-2"
                      onClick={() => router.push(`/${locale}/mentor/services/${service.serviceId}`)}
                    >
                      <h3 className="truncate text-base font-bold text-slate-900">
                        {service.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatDuration(service.durationMinutes)} ·{' '}
                        {service.deliveryMode === 'ONE_TO_ONE' ? '1 kèm 1' : service.deliveryMode}
                      </p>
                    </button>
                    <button
                      type="button"
                      disabled={isToggling}
                      role="switch"
                      aria-checked={service.isActive}
                      aria-label={`${service.isActive ? 'Tắt' : 'Bật'} dịch vụ ${service.title}`}
                      className={`relative h-7 w-12 shrink-0 rounded-full outline-none transition-colors focus-visible:ring-4 focus-visible:ring-[#119CF7]/25 disabled:cursor-wait disabled:opacity-60 ${
                        service.isActive ? 'bg-[var(--schedule-primary)]' : 'bg-slate-300'
                      }`}
                      onClick={() => setPendingStatusChange(service)}
                    >
                      <span
                        aria-hidden="true"
                        className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full border border-slate-100 bg-white shadow-md transition-transform ${
                          service.isActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <p
                    className={`mt-6 text-xl font-extrabold tracking-tight ${
                      service.isActive ? 'text-[var(--schedule-primary)]' : 'text-slate-400'
                    }`}
                  >
                    {priceText}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section aria-labelledby="mentor-schedule-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              id="mentor-schedule-heading"
              className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl"
            >
              Lịch dạy của tôi
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Quản lý các khung giờ mentee có thể đặt lịch với bạn.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="md"
              className="h-11 border-[#119CF7]/40 text-[var(--schedule-primary)] hover:border-[#119CF7] hover:bg-sky-50"
              leftIcon={<Settings className="h-4 w-4" />}
              onClick={() => setIsScheduleSettingsOpen(true)}
            >
              Cài đặt lịch
            </Button>
            {activeScheduleTab === 'calendar' ? (
              <Button
                variant="primary"
                size="md"
                className="h-11 bg-[var(--schedule-primary)] hover:bg-[#0789dc]"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={openAvailabilityModal}
              >
                Thêm lịch rảnh
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                className="h-11 bg-[var(--schedule-primary)] hover:bg-[#0789dc]"
                leftIcon={<CalendarDays className="h-4 w-4" />}
                onClick={handleOpenCreateTemplate}
              >
                Tạo lịch hàng tuần
              </Button>
            )}
          </div>
        </div>

        <div className="mb-4 overflow-x-auto pb-1">
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

      <Modal
        open={isAvailabilityModalOpen}
        title="Thêm lịch rảnh"
        onClose={() => !isCreatingAvailability && setIsAvailabilityModalOpen(false)}
        className="mentor-availability-slot-modal"
      >
        {loading ? (
          <div className="mentor-availability-no-services">Đang tải dịch vụ...</div>
        ) : activeOneToOneServices.length ? (
          <form
            className="mentor-availability-slot-form"
            onSubmit={availabilityForm.handleSubmit(onSubmitAvailabilitySlot)}
            noValidate
          >
            <div className="form-field-group">
              <label className="form-label" htmlFor="availability-date">
                Ngày <span className="text-red-500">*</span>
              </label>
              <input
                id="availability-date"
                type="date"
                className="form-input"
                {...availabilityForm.register('date')}
              />
              {availabilityForm.formState.errors.date && (
                <span className="form-error-msg">
                  {availabilityForm.formState.errors.date.message}
                </span>
              )}
            </div>

            <div className="mentor-availability-time-fields">
              <div className="form-field-group">
                <label className="form-label" htmlFor="availability-start-time">
                  Bắt đầu <span className="text-red-500">*</span>
                </label>
                <input
                  id="availability-start-time"
                  type="time"
                  className="form-input"
                  {...availabilityForm.register('startTime')}
                />
                {schedulingConstraints && (
                  <small className="mentor-availability-helper">
                    Thời lượng tối đa: {schedulingConstraints.maximumParentSlotDurationMinutes}{' '}
                    phút.
                  </small>
                )}
                {availabilityForm.formState.errors.startTime && (
                  <span className="form-error-msg">
                    {availabilityForm.formState.errors.startTime.message}
                  </span>
                )}
              </div>
              <div className="form-field-group">
                <label className="form-label" htmlFor="availability-end-time">
                  Kết thúc <span className="text-red-500">*</span>
                </label>
                <input
                  id="availability-end-time"
                  type="time"
                  className="form-input"
                  {...availabilityForm.register('endTime')}
                />
                {availabilityForm.formState.errors.endTime && (
                  <span className="form-error-msg">
                    {availabilityForm.formState.errors.endTime.message}
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
                    {...availabilityForm.register('serviceIds')}
                  />
                  <span>
                    <strong>{service.title}</strong>
                    <small>
                      {service.durationMinutes} phút · {formatServicePrice(service)}
                    </small>
                  </span>
                </label>
              ))}
              {availabilityForm.formState.errors.serviceIds && (
                <span className="form-error-msg">
                  {availabilityForm.formState.errors.serviceIds.message}
                </span>
              )}
            </fieldset>

            <div className="form-field-group">
              <label className="form-label" htmlFor="availability-note">
                Ghi chú
              </label>
              <textarea
                id="availability-note"
                className="form-textarea"
                rows={3}
                maxLength={200}
                {...availabilityForm.register('note')}
              />
              {availabilityForm.formState.errors.note && (
                <span className="form-error-msg">
                  {availabilityForm.formState.errors.note.message}
                </span>
              )}
            </div>

            {availabilityForm.formState.errors.root?.message && (
              <p className="mentor-availability-form-error" role="alert">
                {availabilityForm.formState.errors.root.message}
              </p>
            )}
            {!canCreateAvailability && (
              <p className="mentor-availability-helper" role="status">
                Đang tải múi giờ đặt lịch...
              </p>
            )}

            <div className="form-modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                disabled={isCreatingAvailability}
                onClick={() => setIsAvailabilityModalOpen(false)}
              >
                Hủy
              </button>
              <Button
                type="submit"
                className="btn-modal-submit"
                disabled={
                  !canCreateAvailability ||
                  isCreatingAvailability ||
                  Boolean(availabilityRetryUntil)
                }
              >
                {isCreatingAvailability ? 'Đang tạo...' : 'Tạo lịch rảnh'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="mentor-availability-no-services">
            <p>Bạn cần có ít nhất một dịch vụ đang hoạt động trước khi mở lịch.</p>
            <Button type="button" className="btn-modal-submit" onClick={showServicesSection}>
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
        className="mentor-schedule-settings-modal"
      >
        <div style={{ width: '100%', fontFamily: 'inherit' }}>
          {/* Modal Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
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
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 340px',
                gap: '28px',
                alignItems: 'stretch',
              }}
            >
              {/* Left Column: Quy tắc đặt lịch */}
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Quy tắc đặt lịch
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 20px' }}>
                  Quản lý cách mentee có thể đặt lịch với bạn.
                </p>

                {/* Field 1: Múi giờ */}
                <div style={{ marginBottom: '20px' }}>
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
                      height: '44px',
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
                        fontSize: '14px',
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

                <div style={{ borderBottom: '1px solid #f1f5f9', margin: '20px 0' }} />

                {/* Field 2: Thời gian đặt trước tối thiểu */}
                <div style={{ marginBottom: '20px' }}>
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
                          height: '44px',
                          paddingLeft: '14px',
                          paddingRight: '48px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '12px',
                          fontSize: '14px',
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
                          height: '44px',
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
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '6px 0 0' }}>
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
                <div style={{ marginBottom: '10px' }}>
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
                        height: '44px',
                        paddingLeft: '14px',
                        paddingRight: '48px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '12px',
                        fontSize: '14px',
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
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '6px 0 0' }}>
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
                  borderRadius: '18px',
                  padding: '22px',
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
                      fontSize: '16px',
                      fontWeight: 700,
                      color: '#0f172a',
                      marginBottom: '12px',
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
                      padding: '16px 0',
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
                        width: '130px',
                        height: '96px',
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
                      <div style={{ height: '26px', backgroundColor: '#1a73e8', width: '100%' }} />
                      {/* Dots Grid */}
                      <div
                        style={{
                          padding: '10px 12px',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: '8px',
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
                          margin: '10px 0 4px',
                        }}
                      >
                        Chưa kết nối
                      </h4>
                      <p
                        style={{
                          fontSize: '12px',
                          color: '#64748b',
                          lineHeight: 1.5,
                          margin: '0 0 16px',
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
                          height: '44px',
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
                    paddingTop: '14px',
                    marginTop: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    fontSize: '12px',
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
                paddingTop: '16px',
                marginTop: '20px',
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
                  height: '40px',
                  padding: '0 22px',
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
                  height: '40px',
                  padding: '0 22px',
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
        onClose={() => setOpenModal(false)}
        className="mentor-service-modal-custom"
      >
        <form
          className="mentor-modal-form"
          onSubmit={form.handleSubmit(onSubmitCreateService)}
          noValidate
        >
          <div className="form-field-group">
            <label className="form-label" htmlFor="new-service-title">
              Tên dịch vụ / Khóa học <span className="text-red-500">*</span>
            </label>
            <input
              id="new-service-title"
              className="form-input"
              placeholder="VD: CV Review & Career Strategy"
              {...form.register('title')}
            />
            {form.formState.errors.title && (
              <span className="form-error-msg">{form.formState.errors.title.message}</span>
            )}
          </div>

          <div className="form-field-group">
            <label className="form-label" htmlFor="new-service-desc">
              Mô tả dịch vụ <span className="text-red-500">*</span>
            </label>
            <textarea
              id="new-service-desc"
              className="form-textarea"
              rows={3}
              placeholder="Mô tả nội dung các phần bạn sẽ tư vấn trực tiếp cho mentee..."
              {...form.register('description')}
            />
            {form.formState.errors.description && (
              <span className="form-error-msg">{form.formState.errors.description.message}</span>
            )}
          </div>

          <div className="form-grid-2">
            <div className="form-field-group">
              <label className="form-label" htmlFor="new-service-duration">
                Thời lượng tư vấn <span className="text-red-500">*</span>
              </label>
              <select
                id="new-service-duration"
                className="form-select"
                {...form.register('durationMinutes')}
              >
                <option value="">Chọn thời lượng</option>
                {(constraints?.allowedDurationMinutes ?? []).map((mins) => (
                  <option key={mins} value={mins}>
                    {mins} phút
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field-group">
              <label className="form-label" htmlFor="new-service-price">
                Học phí (S-coins)
              </label>
              <input
                id="new-service-price"
                type="number"
                disabled={isFreeWatched}
                className="form-input"
                placeholder="VD: 150000"
                {...form.register('priceScoin')}
              />
            </div>
          </div>

          <div className="form-checkbox-row">
            <label className="form-checkbox-label">
              <input type="checkbox" className="form-checkbox" {...form.register('isFree')} />
              <span>Miễn phí dịch vụ này cho mentee</span>
            </label>
          </div>

          <div className="form-modal-footer">
            <button type="button" className="btn-modal-cancel" onClick={() => setOpenModal(false)}>
              Hủy bỏ
            </button>
            <Button type="submit" disabled={isSaving} className="btn-modal-submit">
              {isSaving ? 'Đang tạo...' : 'Xác nhận tạo dịch vụ'}
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
        className={`availability-detail-modal ${selectedBooking ? 'bookingAvailabilityDetailModalShell' : ''}`}
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
          <div className="availability-detail-content">
            <header className="availability-detail-header">
              <h2>Chi tiết lịch rảnh</h2>
              <button
                type="button"
                className="availability-detail-close"
                aria-label="Đóng"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedSlotId(null);
                  setSelectedBookingId(null);
                }}
              >
                <X aria-hidden="true" />
              </button>
            </header>

            <section className="availability-detail-summary" aria-label="Thông tin lịch rảnh">
              <div className="availability-detail-info-item">
                <span className="availability-detail-info-icon" aria-hidden="true">
                  <Calendar />
                </span>
                <div>
                  <span className="availability-detail-info-label">Ngày</span>
                  <strong>{selectedSlotStart?.date.split('-').reverse().join('/')}</strong>
                </div>
              </div>

              <div className="availability-detail-info-item">
                <span className="availability-detail-info-icon" aria-hidden="true">
                  <Clock />
                </span>
                <div>
                  <span className="availability-detail-info-label">Thời gian</span>
                  <div className="availability-detail-time-value">
                    <strong>
                      {selectedSlotStart?.time} – {selectedSlotEnd?.time}
                    </strong>
                    {selectedSlotDurationMinutes > 0 && (
                      <span className="availability-detail-duration">
                        {Math.floor(selectedSlotDurationMinutes / 60) > 0 &&
                          `${Math.floor(selectedSlotDurationMinutes / 60)} giờ `}
                        {selectedSlotDurationMinutes % 60 > 0 &&
                          `${selectedSlotDurationMinutes % 60} phút`}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="availability-detail-info-item">
                <span className="availability-detail-info-icon" aria-hidden="true">
                  <Globe />
                </span>
                <div>
                  <span className="availability-detail-info-label">Múi giờ</span>
                  <strong>{selectedSlot.timezone}</strong>
                </div>
              </div>

              <div className="availability-detail-info-item">
                <span className="availability-detail-info-icon" aria-hidden="true">
                  <FileText />
                </span>
                <div>
                  <span className="availability-detail-info-label">Ghi chú</span>
                  <strong>{selectedSlot.note?.trim() || 'Không có ghi chú'}</strong>
                </div>
              </div>
            </section>

            <section className="availability-detail-services">
              <div className="availability-detail-services-heading">
                <h3>Dịch vụ có thể đặt trong khung giờ này</h3>
                <span>{selectedSlot.services.length} dịch vụ</span>
              </div>

              {selectedSlot.services.length > 0 ? (
                <div className="availability-detail-service-list">
                  {selectedSlot.services.map((service) => (
                    <div className="availability-detail-service-row" key={service.serviceId}>
                      <strong>{service.title}</strong>
                      <div className="availability-detail-service-meta">
                        <span>{service.durationMinutes} phút</span>
                        {(service.isFree || service.priceScoin != null) && <i aria-hidden="true" />}
                        {service.isFree ? (
                          <span>Miễn phí</span>
                        ) : service.priceScoin != null ? (
                          <span>
                            {new Intl.NumberFormat('vi-VN').format(service.priceScoin)} S-coins
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="availability-detail-empty">
                  Chưa có dịch vụ nào được áp dụng cho khung giờ này.
                </p>
              )}
            </section>

            {(selectedSlot.pendingBookingCount > 0 ||
              selectedSlot.hasLockingBooking ||
              isTimeEditBlocked) && (
              <div className="availability-detail-notice is-info">
                <AlertTriangle aria-hidden="true" />
                <span>Không thể thay đổi khung giờ rảnh này vì đã có mentee booking.</span>
              </div>
            )}

            <footer className="availability-detail-footer">
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={!canDeactivate}
                title={deactivationReason || undefined}
                onClick={handleOpenDeactivateModal}
              >
                Thu hồi lịch rảnh
              </Button>
              <Button type="button" size="lg" onClick={handleOpenEditModal}>
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
