/**
 * @file ScheduleManageView.tsx
 * @description Màn hình Quản lý Dịch vụ & Lịch dạy dành riêng cho Mentor.
 * Tích hợp API Backend (`/api/me/mentor-services`) và thiết kế chuẩn 100% theo UI mẫu.
 */

'use client';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Tabs } from '@/components/ui/Tabs';
import { ApiClientError } from '@/models/apiClient';
import type {
  AvailabilityTemplateResponse,
  CreateAvailabilityTemplateRequest,
  DeactivateAvailabilitySlotRequest,
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
  CalendarDays,
  CheckCircle2,
  Compass,
  FileText,
  Plus,
  Settings,
  Target,
  X,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { MentorScheduleCalendar } from './MentorScheduleCalendar';
import { toMentorScheduleCalendarData } from './mentorScheduleCalendarData';
import { localDateTimeToUtcIso } from './mentorScheduleDateTime';
import { useMentorSchedulingRead } from './useMentorSchedulingRead';

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
  toast.custom(
    (toastItem) => (
      <div className="mentor-service-status-toast" role="status">
        <span className="mentor-service-status-toast-icon" aria-hidden="true">
          <CheckCircle2 size={19} />
        </span>
        <p>{isActive ? 'Đã bật dịch vụ.' : 'Đã tắt dịch vụ.'}</p>
        <button
          type="button"
          onClick={() => toast.dismiss(toastItem.id)}
          aria-label="Đóng thông báo"
        >
          <X size={16} />
        </button>
      </div>
    ),
    { duration: 3500, position: 'top-right' },
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
  const isAvailabilityResponseEmpty = calendarData.isEmpty;
  const canCreateAvailability = Boolean(bookingPolicy);
  const activeOneToOneServices = services.filter(
    (service) => service.isActive && service.deliveryMode === 'ONE_TO_ONE',
  );

  const selectedSlot = availabilitySlots?.find((slot) => slot.slotId === selectedSlotId);
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
      showSuccess('Đã cập nhật cài đặt lịch.');
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
      showSuccess('Đã tạo lịch hàng tuần.');
      setIsTemplateFormOpen(false);
      await reloadTemplates();
      await reloadScheduling();
    } catch (reason) {
      if (reason instanceof ApiClientError) {
        showError(reason.message);
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
      showSuccess('Đã cập nhật mẫu lịch lặp.');
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
          showError(reason.message);
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
      showSuccess('Đã tạm dừng mẫu lịch lặp.');
      await reloadTemplates();
      await reloadScheduling();
    } catch (reason) {
      if (reason instanceof ApiClientError) {
        if (reason.status === 409) {
          await reloadTemplates();
          showError('Mẫu lịch lặp vừa được thay đổi ở nơi khác. Dữ liệu đã được tải lại.');
        } else {
          showError(reason.message);
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
      showSuccess('Đã tiếp tục mẫu lịch lặp.');
      await reloadTemplates();
      await reloadScheduling();
    } catch (reason) {
      if (reason instanceof ApiClientError) {
        if (reason.status === 409) {
          await reloadTemplates();
          showError('Mẫu lịch lặp vừa được thay đổi ở nơi khác. Dữ liệu đã được tải lại.');
        } else {
          showError(reason.message);
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
      showSuccess('Đã lưu trữ mẫu lịch lặp.');
      await reloadTemplates();
      await reloadScheduling();
    } catch (reason) {
      if (reason instanceof ApiClientError) {
        if (reason.status === 409) {
          await reloadTemplates();
          showError('Mẫu lịch lặp vừa được thay đổi ở nơi khác. Dữ liệu đã được tải lại.');
        } else {
          showError(reason.message);
        }
      } else {
        showError('Không thể lưu trữ mẫu lịch lặp.');
      }
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
      showError(
        reason instanceof ApiClientError
          ? reason.message
          : 'Không thể tải danh sách dịch vụ. Vui lòng thử lại sau.',
      );
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
        showError(
          reason instanceof ApiClientError
            ? reason.message
            : 'Không thể cập nhật trạng thái dịch vụ. Vui lòng thử lại.',
        );
      }
    } finally {
      setTogglingId(null);
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
    } catch (reason) {
      showError(
        reason instanceof ApiClientError
          ? reason.message
          : 'Không thể tạo dịch vụ. Vui lòng thử lại.',
      );
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
    setSelectedSlotId(slotId);
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
      showSuccess('Đã thêm lịch rảnh.');
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
      showSuccess('Đã cập nhật lịch rảnh.');
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

          if (reason.code?.includes('PENDING') || reason.message.toLowerCase().includes('pending')) {
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
      showSuccess('Đã thu hồi lịch rảnh.');
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

          if (reason.code?.includes('PENDING') || reason.message.toLowerCase().includes('pending')) {
            setPendingRejectionConfirm({
              type: 'deactivate',
              token: reason.data?.[0]?.rejectedValue as string | undefined,
            });
            return;
          }

          setSelectedSlotId(freshSlot.slotId);
          showError('Lịch này vừa có thay đổi từ nơi khác. Vui lòng kiểm tra lại thông tin mới nhất.');
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
          showError(reason.message);
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

  const selectedSlotStart = selectedSlot ? getLocalDateTimeParts(selectedSlot.startAt, timezone) : null;
  const selectedSlotEnd = selectedSlot ? getLocalDateTimeParts(selectedSlot.endAt, timezone) : null;

  return (
    <div className="schedule-page-wrapper">
      {/* SECTION 1: Dịch vụ của tôi */}
      <section className="schedule-section" ref={serviceSectionRef}>
        <div className="schedule-section-header">
          <div>
            <h2 className="schedule-section-title">Dịch vụ của tôi</h2>
          </div>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setOpenModal(true)}
          >
            Thêm dịch vụ
          </Button>
        </div>

        {loading ? (
          <div className="schedule-loading-card">
            <div className="mentor-spinner" />
            <p>Đang tải danh sách dịch vụ...</p>
          </div>
        ) : (
          <div className="schedule-services-grid">
            {services.map((service) => {
              const isToggling = togglingId === service.serviceId;
              const priceText = service.isFree
                ? 'Miễn phí'
                : `${new Intl.NumberFormat('vi-VN').format(service.publicPriceScoin ?? 0)} S-coins`;

              return (
                <div
                  key={service.serviceId}
                  className={`schedule-service-card ${service.isActive ? 'card-active' : 'card-inactive'}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/${locale}/mentor/services/${service.serviceId}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      router.push(`/${locale}/mentor/services/${service.serviceId}`);
                    }
                  }}
                >
                  <div className="service-card-top">
                    <div className="service-icon-box">{getServiceIcon(service.title)}</div>
                    <div className="service-info-box">
                      <h3 className="service-card-title">{service.title}</h3>
                      <p className="service-card-meta">
                        {service.durationMinutes} min ·{' '}
                        {service.description?.includes('sessions')
                          ? (service.description.split('·')[1]?.trim() ?? '0 sessions')
                          : '0 sessions'}
                      </p>
                    </div>

                    {/* iOS Style Switch Button */}
                    <button
                      type="button"
                      disabled={isToggling}
                      className={`ios-toggle-switch ${service.isActive ? 'switch-on' : 'switch-off'}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setPendingStatusChange(service);
                      }}
                      aria-label={`Toggle ${service.title}`}
                    >
                      <span className="ios-toggle-thumb" />
                    </button>
                  </div>

                  <div className="service-card-bottom">
                    <span className="service-price-text">{priceText}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: Lịch dạy của tôi */}
      <section className="schedule-section margin-top-32">
        <div className="mentor-schedule-section-heading">
          <div>
            <h2 className="schedule-section-title">Lịch dạy của tôi</h2>
            <p className="schedule-section-subtitle">Quản lý thời gian mentee có thể đặt lịch.</p>
          </div>
          <div className="mentor-schedule-actions">
            <Button
              variant="outline"
              size="md"
              leftIcon={<Settings className="w-4 h-4 text-slate-500" />}
              onClick={() => setIsScheduleSettingsOpen(true)}
            >
              Cài đặt lịch
            </Button>
            {activeScheduleTab === 'calendar' ? (
              <Button
                variant="primary"
                size="md"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={openAvailabilityModal}
              >
                Lịch rảnh
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                leftIcon={<CalendarDays className="w-4 h-4" />}
                onClick={handleOpenCreateTemplate}
              >
                Tạo lịch hàng tuần
              </Button>
            )}
          </div>
        </div>

        <div className="mb-5">
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
            events={calendarData.events}
            isLoading={isSchedulingLoading}
            error={availabilityError ?? calendarData.error}
            isAvailabilityResponseEmpty={isAvailabilityResponseEmpty}
            onPreviousWeek={() => setWeekStart((current) => addDays(current, -7))}
            onNextWeek={() => setWeekStart((current) => addDays(current, 7))}
            onToday={() => setWeekStart(startOfWeek(new Date()))}
            onRetry={() => void reloadScheduling()}
            onUnavailableAction={openAvailabilityModal}
            onSelectSlot={handleSelectSlot}
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
            onOpenEdit={handleOpenEditTemplate}
            onPause={(tpl) => setPendingTemplateActionConfirm({ type: 'pause', template: tpl })}
            onResume={(tpl) => setPendingTemplateActionConfirm({ type: 'resume', template: tpl })}
            onArchive={(tpl) => setPendingTemplateActionConfirm({ type: 'archive', template: tpl })}
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
        title="Cài đặt lịch"
        onClose={() => {
          if (!isSavingPolicy) {
            if (bookingPolicy) {
              setLeadTimeInput(String(bookingPolicy.minimumBookingLeadTimeMinutes));
              setHorizonInput(String(bookingPolicy.maximumBookingHorizonDays));
            }
            setIsScheduleSettingsOpen(false);
          }
        }}
        className="mentor-schedule-settings-drawer"
      >
        <form onSubmit={handleSaveBookingPolicy} noValidate className="space-y-4 -mt-2">
          {policyStaleNotice && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-medium">
              {policyStaleNotice}
            </div>
          )}

          {policyFormErrors.root && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium">
              {policyFormErrors.root}
            </div>
          )}

          {/* Section: Quy tắc đặt lịch */}
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-bold text-sky-800">Quy tắc đặt lịch</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Quản lý cách mentee có thể đặt lịch với bạn.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <div className="form-field-group">
                <label className="form-label text-xs font-semibold text-gray-700" htmlFor="policy-timezone">
                  Múi giờ
                </label>
                <input
                  id="policy-timezone"
                  type="text"
                  readOnly
                  value={timezone}
                  className="form-input bg-gray-100 cursor-not-allowed font-medium text-gray-700 text-sm"
                />
                <small className="text-[11px] text-gray-500">
                  Múi giờ của Booking Policy được dùng làm chuẩn cho tất cả lịch rảnh.
                </small>
              </div>

              <div className="form-field-group">
                <label className="form-label text-xs font-semibold text-gray-700" htmlFor="policy-lead-time">
                  Thời gian đặt trước tối thiểu <span style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '3px' }}>*</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      id="policy-lead-time"
                      type="number"
                      min={0}
                      value={leadTimeInput}
                      onChange={(e) => setLeadTimeInput(e.target.value)}
                      className="form-input"
                      style={{ width: '100%', paddingRight: '48px' }}
                    />
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', fontWeight: 500, color: '#64748b', pointerEvents: 'none' }}>
                      phút
                    </span>
                  </div>
                  {Number(leadTimeInput) >= 60 && (
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#0369a1', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', padding: '6px 10px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                      ≈ {(Number(leadTimeInput) / 60).toFixed(1)} giờ
                    </span>
                  )}
                </div>
                <small className="text-[11px] text-gray-500">
                  Mentee cần đặt lịch trước ít nhất khoảng thời gian này.
                </small>
                {policyFormErrors.leadTime && (
                  <span className="form-error-msg">{policyFormErrors.leadTime}</span>
                )}
              </div>

              <div className="form-field-group">
                <label className="form-label text-xs font-semibold text-gray-700" htmlFor="policy-horizon">
                  Cho phép đặt trước tối đa <span style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '3px' }}>*</span>
                </label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    id="policy-horizon"
                    type="number"
                    min={1}
                    value={horizonInput}
                    onChange={(e) => setHorizonInput(e.target.value)}
                    className="form-input"
                    style={{ width: '100%', paddingRight: '48px' }}
                  />
                  <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', fontWeight: 500, color: '#64748b', pointerEvents: 'none' }}>
                    ngày
                  </span>
                </div>
                <small className="text-[11px] text-gray-500">
                  Mentee chỉ có thể đặt lịch trong khoảng thời gian này.
                </small>
                {policyFormErrors.horizon && (
                  <span className="form-error-msg">{policyFormErrors.horizon}</span>
                )}
              </div>
            </div>
          </div>

          {/* Section: Google Calendar */}
          <div className="pt-3 border-t border-gray-200 space-y-2">
            <h3 className="text-base font-bold text-sky-800">Google Calendar</h3>

            {!googleCalendarStatus ? (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500">
                Đang tải trạng thái Google Calendar...
              </div>
            ) : googleCalendarStatus.connected ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Đã kết nối</span>
                  </div>
                  {googleCalendarStatus.needsReconnect && (
                    <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-[11px] font-medium">
                      Cần kết nối lại
                    </span>
                  )}
                </div>
                {googleCalendarStatus.email && (
                  <p className="text-xs text-emerald-700 font-medium pl-3.5">
                    {googleCalendarStatus.email}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>Chưa kết nối</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Bạn vẫn có thể mở lịch và nhận booking bình thường mà không cần kết nối Google Calendar.
                </p>

                {/* Google Official Button Styling */}
                <button
                  type="button"
                  disabled
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '9px 14px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#475569',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    cursor: 'not-allowed',
                    opacity: 0.85,
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  }}
                  title="Tính năng kết nối Google OAuth sẽ được thiết lập ở bước tiếp theo"
                >
                  <svg
                    width="18"
                    height="18"
                    style={{ width: '18px', height: '18px', minWidth: '18px', minHeight: '18px', flexShrink: 0 }}
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Kết nối Google Calendar (Sẽ thiết lập sau)</span>
                </button>
              </div>
            )}
          </div>

          <div className="form-modal-footer pt-3 border-t border-gray-200 flex justify-end gap-2">
            <button
              type="button"
              className="btn-modal-cancel"
              disabled={isSavingPolicy}
              onClick={() => {
                if (bookingPolicy) {
                  setLeadTimeInput(String(bookingPolicy.minimumBookingLeadTimeMinutes));
                  setHorizonInput(String(bookingPolicy.maximumBookingHorizonDays));
                }
                setIsScheduleSettingsOpen(false);
              }}
            >
              Hủy
            </button>
            <Button
              type="submit"
              className="btn-modal-submit bg-sky-600 hover:bg-sky-700 text-white"
              disabled={!isPolicyDirty || isSavingPolicy || Boolean(policyRetryUntil)}
            >
              {isSavingPolicy ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal "+ Thêm dịch vụ" */}
      <Modal
        open={pendingStatusChange !== null}
        title={pendingStatusChange?.isActive ? 'Tắt dịch vụ' : 'Bật dịch vụ'}
        onClose={() => setPendingStatusChange(null)}
        className="mentor-service-status-modal"
      >
        {pendingStatusChange && (
          <div className="mentor-service-status-modal-content">
            <p>
              {pendingStatusChange.isActive
                ? `Bạn có muốn tắt dịch vụ “${pendingStatusChange.title}” không?`
                : `Bạn có muốn bật dịch vụ “${pendingStatusChange.title}” không?`}
            </p>
            <div className="form-modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setPendingStatusChange(null)}
              >
                Hủy
              </button>
              <Button type="button" className="btn-modal-submit" onClick={confirmStatusChange}>
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

      {/* Modal Chi tiết Lịch rảnh */}
      <Modal
        open={isDetailModalOpen && Boolean(selectedSlot)}
        title="Chi tiết lịch rảnh"
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedSlotId(null);
        }}
        className="mentor-availability-slot-modal"
      >
        {selectedSlot && (
          <div className="mentor-slot-detail-modal-content space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                Lịch rảnh
              </span>
              <span className="text-xs text-gray-500">{selectedSlot.timezone}</span>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500 font-medium">Ngày: </span>
                <strong className="text-gray-900">
                  {selectedSlotStart?.date.split('-').reverse().join('/')}
                </strong>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Thời gian: </span>
                <strong className="text-gray-900">
                  {selectedSlotStart?.time} – {selectedSlotEnd?.time}
                </strong>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Dịch vụ: </span>
                <span className="text-gray-900 font-medium">
                  {selectedSlot.services.map((s) => s.title).join(', ') || 'Chưa gắn dịch vụ'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Ghi chú: </span>
                <span className="text-gray-700 italic">
                  {selectedSlot.note?.trim() ? selectedSlot.note : 'Không có ghi chú'}
                </span>
              </div>
            </div>

            {selectedSlot.pendingBookingCount > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>{selectedSlot.pendingBookingCount} yêu cầu đang chờ</span>
              </div>
            )}

            {selectedSlot.hasLockingBooking && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>Khung giờ đang bị khóa bởi booking</span>
              </div>
            )}

            {selectedSlot.timeMutation?.mode && selectedSlot.timeMutation.mode !== 'ALLOWED' && (
              <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded">
                Hạn chế đổi giờ: {selectedSlot.timeMutation.restrictionCode || 'Khung giờ đang có booking'}
              </p>
            )}

            <div className="form-modal-footer pt-4 border-t border-gray-100 flex gap-2 justify-end">
              <button
                type="button"
                className="btn-modal-cancel text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!canDeactivate}
                title={deactivationReason || undefined}
                onClick={handleOpenDeactivateModal}
              >
                Thu hồi lịch rảnh
              </button>
              <Button type="button" className="btn-modal-submit" onClick={handleOpenEditModal}>
                Chỉnh sửa
              </Button>
            </div>
          </div>
        )}
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
                Khung giờ này đang có yêu cầu đặt lịch chờ xác nhận. Nếu tiếp tục thao tác, các yêu cầu liên quan sẽ bị tự động từ chối.
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
        onClose={() => setSelectedTemplateForDetail(null)}
        onOpenEdit={handleOpenEditTemplate}
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
    </div>
  );
}
