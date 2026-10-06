/**
 * @file StudentOnboardingView.tsx
 * @description Màn hình hoàn thiện hồ sơ sinh viên sau đăng nhập.
 */

'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { SelectField } from '@/components/ui/SelectField';
import { TextArea } from '@/components/ui/TextArea';
import { TextField } from '@/components/ui/TextField';
import type {
  AcademicProgramResponse,
  CampusResponse,
  SpecializationResponse,
} from '@/models/auth';
import {
  studentOnboardingSchema,
  type StudentOnboardingFormValues,
} from '@/models/schemas/studentProfileSchema';
import { useAuth } from '@/providers/AuthProvider';
import { studentProfileRepo } from '@/repositories/studentProfileRepo';
import { getUserFriendlyErrorMessage, showSuccess } from '@/utils/toast';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  ClipboardCheck,
  GraduationCap,
  Hand,
  HelpCircle,
  Lightbulb,
  MessageCircle,
  UserRound,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import styles from './StudentOnboardingView.module.css';

const BIO_MAX_LENGTH = 500;

const semesterOptions = Array.from({ length: 10 }, (_, semester) => ({
  value: String(semester),
  label: semester === 0 ? '0 — Tiếng Anh dự bị' : `Học kỳ ${semester}`,
}));

const supportItems = [
  {
    question: 'Tại sao cần cung cấp mã số sinh viên?',
    answer:
      'Mã số sinh viên giúp SkillSwap xác thực hồ sơ và kết nối bạn với đúng cộng đồng học tập.',
  },
  {
    question: 'Không tìm thấy ngành học của mình?',
    answer:
      'Hãy kiểm tra lại cơ sở đã chọn. Nếu danh sách vẫn chưa có ngành phù hợp, bạn có thể liên hệ đội ngũ hỗ trợ.',
  },
  {
    question: 'Tôi có thể thay đổi thông tin sau không?',
    answer: 'Có. Sau khi hoàn tất onboarding, bạn vẫn có thể cập nhật thông tin trong trang Hồ sơ.',
  },
  {
    question: 'Làm thế nào để viết phần giới thiệu ấn tượng?',
    answer:
      'Hãy viết ngắn gọn về mục tiêu, kỹ năng muốn cải thiện và chủ đề bạn mong mentor hỗ trợ.',
  },
] as const;

interface ChecklistItem {
  id: string;
  label: string;
  targetId: string;
  completed: boolean;
}

function isFilled(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value);
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
}

function SectionHeading({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
        {icon}
      </span>
      <div className="min-w-0 pt-0.5">
        <h2 className="m-0 text-sm font-extrabold text-text-main sm:text-base">{title}</h2>
        {description && (
          <p className="mb-0 mt-1 text-xs leading-relaxed text-text-muted">{description}</p>
        )}
      </div>
    </div>
  );
}

function SupportFaq() {
  const [openQuestion, setOpenQuestion] = useState<number>();

  return (
    <section className="rounded-2xl border border-solid border-[#e5edf7] bg-white p-3.5 shadow-xs">
      <header className="mb-1 flex items-center gap-2.5 rounded-xl bg-[#f5faff] px-3 py-2.5 text-primary">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
          <HelpCircle size={18} aria-hidden="true" />
        </span>
        <h2 className="m-0 flex-1 text-sm font-extrabold">Bạn cần hỗ trợ?</h2>
        <ChevronDown size={17} aria-hidden="true" />
      </header>
      <div>
        {supportItems.map((item, index) => {
          const isOpen = openQuestion === index;
          return (
            <div
              key={item.question}
              className="border-b border-solid border-[#edf2f7] last:border-0"
            >
              <button
                type="button"
                className="flex w-full cursor-pointer items-center gap-3 border-0 bg-transparent px-2 py-3 text-left text-xs font-semibold text-text-secondary outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                aria-expanded={isOpen}
                onClick={() => setOpenQuestion(isOpen ? undefined : index)}
              >
                <span className="flex-1">{item.question}</span>
                <ChevronRight
                  size={15}
                  className={`shrink-0 transition-transform ${isOpen ? 'rotate-90 text-primary' : ''}`}
                  aria-hidden="true"
                />
              </button>
              {isOpen && (
                <p className="mb-3 mt-0 px-2 pr-7 text-[11px] leading-relaxed text-text-muted">
                  {item.answer}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function StudentOnboardingView({ locale }: { locale: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [isLoadingSpecializations, setIsLoadingSpecializations] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [campuses, setCampuses] = useState<CampusResponse[]>([]);
  const [programs, setPrograms] = useState<AcademicProgramResponse[]>([]);
  const [specializations, setSpecializations] = useState<SpecializationResponse[]>([]);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, touchedFields },
  } = useForm<StudentOnboardingFormValues>({
    resolver: yupResolver(studentOnboardingSchema) as never,
    mode: 'onBlur',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    defaultValues: {
      studentCode: '',
      displayName: user?.fullName ?? '',
      campusId: '',
      programId: '',
      specializationId: '',
      semester: 1,
      intakeYear: new Date().getFullYear(),
      isAlumni: false,
      graduationYear: undefined,
      bio: '',
    },
  });

  const [studentCode, displayName, campusId, programId, semester, intakeYear, isAlumni, bio] =
    watch([
      'studentCode',
      'displayName',
      'campusId',
      'programId',
      'semester',
      'intakeYear',
      'isAlumni',
      'bio',
    ]);
  const graduationYear = watch('graduationYear');

  const requiredValues: unknown[] = [
    studentCode,
    displayName,
    campusId,
    programId,
    semester,
    intakeYear,
  ];
  if (isAlumni) requiredValues.push(graduationYear);
  const requiredCompleted = requiredValues.filter(isFilled).length;
  const progress = Math.round((requiredCompleted / requiredValues.length) * 100);

  const checklistItems = useMemo<ChecklistItem[]>(
    () => [
      {
        id: 'student-code',
        label: 'Mã số sinh viên',
        targetId: 'studentCode',
        completed: isFilled(studentCode),
      },
      {
        id: 'display-name',
        label: 'Tên hiển thị',
        targetId: 'displayName',
        completed: isFilled(displayName),
      },
      {
        id: 'academic-information',
        label: 'Thông tin học tập (Cơ sở, Ngành học)',
        targetId: 'academic-section',
        completed: isFilled(campusId) && isFilled(programId),
      },
      {
        id: 'semester',
        label: 'Học kỳ hiện tại',
        targetId: 'semester',
        completed: isFilled(semester),
      },
      {
        id: 'intake-year',
        label: 'Năm bắt đầu học tại FPT',
        targetId: 'intakeYear',
        completed: isFilled(intakeYear),
      },
      {
        id: 'bio',
        label: 'Giới thiệu bản thân',
        targetId: 'bio',
        completed: isFilled(bio),
      },
      {
        id: 'alumni-status',
        label: 'Xác nhận tình trạng tốt nghiệp',
        targetId: 'isAlumni',
        completed: Boolean(touchedFields.isAlumni || isAlumni),
      },
    ],
    [
      bio,
      campusId,
      displayName,
      intakeYear,
      isAlumni,
      programId,
      semester,
      studentCode,
      touchedFields.isAlumni,
    ],
  );
  const checklistCompleted = checklistItems.filter((item) => item.completed).length;
  const currentChecklistId = checklistItems.find((item) => !item.completed)?.id;

  useEffect(() => {
    if (user?.fullName) setValue('displayName', user.fullName);
    let isActive = true;
    const loadCatalog = async () => {
      setIsLoadingCatalog(true);
      setError(undefined);
      try {
        const [campusData, programData] = await Promise.all([
          studentProfileRepo.getCampuses(),
          studentProfileRepo.getPrograms(),
        ]);
        if (isActive) {
          setCampuses(campusData);
          setPrograms(programData);
        }
      } catch (reason) {
        if (isActive)
          setError(
            getUserFriendlyErrorMessage(
              reason,
              'Không thể tải danh mục học thuật. Vui lòng thử lại.',
            ),
          );
      } finally {
        if (isActive) setIsLoadingCatalog(false);
      }
    };
    void loadCatalog();
    return () => {
      isActive = false;
    };
  }, [user?.fullName, setValue]);

  const selectCampus = (nextCampusId: string) => {
    setValue('campusId', nextCampusId, { shouldDirty: true, shouldValidate: true });
    setValue('programId', '', { shouldDirty: true, shouldValidate: true });
    setValue('specializationId', '', { shouldDirty: true });
    setSpecializations([]);
  };

  const selectProgram = async (nextProgramId: string) => {
    setValue('programId', nextProgramId, { shouldDirty: true, shouldValidate: true });
    setValue('specializationId', '', { shouldDirty: true });
    setSpecializations([]);
    setError(undefined);
    if (!nextProgramId) return;
    setIsLoadingSpecializations(true);
    try {
      setSpecializations(await studentProfileRepo.getSpecializations(nextProgramId));
    } catch (reason) {
      setError(getUserFriendlyErrorMessage(reason, 'Không thể tải danh sách chuyên ngành.'));
    } finally {
      setIsLoadingSpecializations(false);
    }
  };

  const focusChecklistTarget = (targetId: string) => {
    const target = document.getElementById(targetId);
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (target instanceof HTMLElement && target.matches('input, textarea, button')) {
      window.setTimeout(() => target.focus(), 350);
    }
  };

  const submit = async (values: StudentOnboardingFormValues) => {
    setError(undefined);
    setIsSubmitting(true);
    try {
      await studentProfileRepo.save({
        studentCode: values.studentCode.trim(),
        displayName: values.displayName.trim(),
        campusId: values.campusId,
        programId: values.programId,
        specializationId: values.specializationId,
        semester: Number(values.semester),
        intakeYear: Number(values.intakeYear),
        isAlumni: Boolean(values.isAlumni),
        graduationYear:
          values.isAlumni && values.graduationYear ? Number(values.graduationYear) : undefined,
        bio: values.bio?.trim() || undefined,
      });
      showSuccess({
        title: 'Hồ sơ của bạn đã sẵn sàng',
        description: 'Hãy bắt đầu tìm mentor phù hợp với mục tiêu của bạn nhé!',
      });
      router.replace(`/${locale}/dashboard`);
    } catch (reason) {
      setError(getUserFriendlyErrorMessage(reason, 'Không thể lưu hồ sơ. Vui lòng thử lại.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard locale={locale}>
      <main className="relative min-h-screen overflow-hidden bg-[#f8fbff] px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <div
          className="pointer-events-none absolute -left-28 bottom-[-9rem] h-80 w-80 rounded-full bg-primary-light/80"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-primary-light/70"
          aria-hidden="true"
        />

        <div className="relative mx-auto flex w-full max-w-[1220px] items-center justify-between pb-4">
          <Image
            src="/images/SkillSwap_Logo_Text.png"
            alt="SkillSwap"
            width={220}
            height={68}
            priority
            className="h-[54px] w-[180px] object-cover object-center sm:h-[62px] sm:w-[205px]"
          />
          <p className="hidden items-center gap-2 rounded-full bg-primary-light px-5 py-2 text-xs font-semibold text-primary md:flex">
            <GraduationCap size={17} strokeWidth={2.25} aria-hidden="true" />
            Cùng nhau kiến tạo hành trình học tập tốt hơn
          </p>
        </div>

        <form
          className={`${styles.onboardingGrid} relative mx-auto w-full max-w-[1220px] overflow-hidden rounded-[22px] border border-solid border-[#e5edf7] bg-white shadow-[0_10px_35px_rgba(30,80,130,0.07)]`}
          onSubmit={handleSubmit(submit)}
          noValidate
          aria-labelledby="onboarding-title"
        >
          <div className={`${styles.formContent} min-w-0 px-5 py-6 sm:px-8 lg:px-9 lg:py-7`}>
            <section aria-label="Tiến độ hoàn thiện hồ sơ" className="mb-6">
              <div className="grid grid-cols-2 gap-3 sm:gap-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-white shadow-sm">
                    1
                  </span>
                  <span className="min-w-0">
                    <strong className="block text-xs font-extrabold text-text-main sm:text-sm">
                      Hồ sơ cơ bản
                    </strong>
                    <small className="hidden text-[10px] text-text-muted sm:block">
                      Cung cấp thông tin cá nhân và học tập
                    </small>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-solid border-[#d6e2ef] bg-[#f6f9fc] text-sm font-extrabold text-text-muted">
                    {progress === 100 ? <Check size={17} aria-hidden="true" /> : '2'}
                  </span>
                  <span className="min-w-0">
                    <strong className="block text-xs font-extrabold text-text-secondary sm:text-sm">
                      Hoàn tất
                    </strong>
                    <small className="hidden text-[10px] text-text-muted sm:block">
                      Bắt đầu kết nối mentor
                    </small>
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div
                  className="h-2 flex-1 overflow-hidden rounded-full bg-[#e8eef5]"
                  role="progressbar"
                  aria-label="Tiến độ hoàn thiện các trường bắt buộc"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#2eb7ef] to-primary transition-[width] duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <strong className="w-10 text-right text-xs text-text-secondary">{progress}%</strong>
              </div>
            </section>

            <header className="mb-5">
              <h1
                id="onboarding-title"
                className="m-0 text-[25px] font-extrabold leading-tight tracking-[-0.025em] text-text-main sm:text-[28px]"
              >
                Chào mừng bạn đến với SkillSwap!
                <Hand
                  size={27}
                  strokeWidth={2.25}
                  className="ml-2 inline-block align-[-0.12em] text-primary"
                  aria-hidden="true"
                />
              </h1>
              <p className="mb-0 mt-1.5 text-xs leading-relaxed text-text-secondary sm:text-sm">
                Hãy hoàn thiện một vài thông tin để tạo hồ sơ mentee và bắt đầu tìm kiếm mentor phù
                hợp nhé!
              </p>
            </header>

            {error && (
              <p
                className="mb-4 mt-0 rounded-xl border border-solid border-red-200 bg-danger-soft px-3.5 py-2.5 text-xs font-medium text-danger"
                role="alert"
              >
                {error}
              </p>
            )}

            <div className="flex flex-col gap-4">
              <section
                id="personal-section"
                className="rounded-2xl border border-solid border-[#e5edf7] bg-white p-4 sm:p-5"
              >
                <SectionHeading icon={<UserRound size={20} />} title="Thông tin cá nhân" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextField
                    label="Mã số sinh viên"
                    placeholder="Ví dụ: SE192621"
                    helperText="Nhập đúng mã số sinh viên để xác thực thông tin."
                    required
                    aria-required="true"
                    aria-invalid={Boolean(errors.studentCode)}
                    error={errors.studentCode?.message}
                    className={`${styles.onboardingField} !h-11`}
                    {...register('studentCode')}
                  />
                  <TextField
                    label="Tên hiển thị"
                    placeholder="Ví dụ: Nguyễn Văn A"
                    helperText="Tên này sẽ hiển thị với mentor và các thành viên khác."
                    required
                    aria-required="true"
                    aria-invalid={Boolean(errors.displayName)}
                    error={errors.displayName?.message}
                    className={`${styles.onboardingField} !h-11`}
                    {...register('displayName')}
                  />
                </div>
              </section>

              <section
                id="academic-section"
                className="rounded-2xl border border-solid border-[#e5edf7] bg-white p-4 sm:p-5"
              >
                <SectionHeading
                  icon={<GraduationCap size={21} />}
                  title="Thông tin học tập"
                  description="Cung cấp thông tin về trường, ngành học và quá trình học tập hiện tại."
                />
                <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
                  <Controller
                    name="campusId"
                    control={control}
                    render={({ field }) => (
                      <SelectField
                        id="campusId"
                        label="Cơ sở"
                        required
                        value={field.value}
                        onValueChange={selectCampus}
                        onBlur={field.onBlur}
                        placeholder={isLoadingCatalog ? 'Đang tải cơ sở...' : 'Chọn cơ sở'}
                        disabled={isLoadingCatalog}
                        error={errors.campusId?.message}
                        options={campuses.map((campus) => ({
                          value: campus.id,
                          label: campus.name,
                        }))}
                        triggerClassName={`${styles.onboardingField} !h-11`}
                      />
                    )}
                  />
                  <ArrowRight
                    size={16}
                    className="mt-9 hidden text-text-muted md:block"
                    aria-hidden="true"
                  />
                  <Controller
                    name="programId"
                    control={control}
                    render={({ field }) => (
                      <SelectField
                        id="programId"
                        label="Ngành học"
                        required
                        value={field.value}
                        onValueChange={(value) => void selectProgram(value)}
                        onBlur={field.onBlur}
                        placeholder={
                          isLoadingCatalog
                            ? 'Đang tải ngành học...'
                            : campusId
                              ? 'Chọn ngành học'
                              : 'Chọn cơ sở trước'
                        }
                        helperText={!campusId ? 'Vui lòng chọn cơ sở trước.' : undefined}
                        disabled={isLoadingCatalog || !campusId}
                        error={errors.programId?.message}
                        options={programs.map((program) => ({
                          value: program.id,
                          label: program.nameVi,
                        }))}
                        triggerClassName={`${styles.onboardingField} !h-11`}
                      />
                    )}
                  />
                  <ArrowRight
                    size={16}
                    className="mt-9 hidden text-text-muted md:block"
                    aria-hidden="true"
                  />
                  <Controller
                    name="specializationId"
                    control={control}
                    render={({ field }) => (
                      <SelectField
                        id="specializationId"
                        label="Chuyên ngành"
                        value={field.value || ''}
                        onValueChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder={
                          isLoadingSpecializations
                            ? 'Đang tải chuyên ngành...'
                            : programId
                              ? 'Chọn chuyên ngành'
                              : 'Chọn ngành học trước'
                        }
                        helperText={
                          !campusId || !programId
                            ? 'Vui lòng chọn cơ sở và ngành học trước.'
                            : 'Không bắt buộc.'
                        }
                        disabled={!campusId || !programId || isLoadingSpecializations}
                        error={errors.specializationId?.message}
                        options={specializations.map((specialization) => ({
                          value: specialization.id,
                          label: specialization.nameVi,
                        }))}
                        triggerClassName={`${styles.onboardingField} !h-11`}
                      />
                    )}
                  />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Controller
                    name="semester"
                    control={control}
                    render={({ field }) => (
                      <SelectField
                        id="semester"
                        label="Học kỳ hiện tại"
                        required
                        value={String(field.value)}
                        onValueChange={(value) => field.onChange(Number(value))}
                        onBlur={field.onBlur}
                        options={semesterOptions}
                        error={errors.semester?.message}
                        triggerClassName={`${styles.onboardingField} !h-11`}
                      />
                    )}
                  />
                  <TextField
                    label="Năm bắt đầu học tại FPT"
                    type="number"
                    min="2000"
                    max={new Date().getFullYear()}
                    placeholder="Ví dụ: 2023, 2024, 2025, 2026…"
                    required
                    aria-required="true"
                    aria-invalid={Boolean(errors.intakeYear)}
                    error={errors.intakeYear?.message}
                    className={`${styles.onboardingField} !h-11`}
                    {...register('intakeYear', { valueAsNumber: true })}
                  />
                </div>

                <div className="mt-4 rounded-xl bg-[#f8fbff] px-3.5 py-3">
                  <Checkbox label="Tôi đã tốt nghiệp" {...register('isAlumni')} />
                  <p className="mb-0 ml-6.5 mt-1 text-[11px] text-text-muted">
                    Tích chọn nếu bạn đã hoàn thành chương trình học tại FPT.
                  </p>
                  {isAlumni && (
                    <div className="mt-3 max-w-sm">
                      <TextField
                        label="Năm tốt nghiệp"
                        type="number"
                        min="2000"
                        max={new Date().getFullYear()}
                        required
                        aria-required="true"
                        aria-invalid={Boolean(errors.graduationYear)}
                        error={errors.graduationYear?.message}
                        className={`${styles.onboardingField} !h-11`}
                        {...register('graduationYear', { valueAsNumber: true })}
                      />
                    </div>
                  )}
                </div>
              </section>

              <section
                id="bio-section"
                className="rounded-2xl border border-solid border-[#e5edf7] bg-white p-4 sm:p-5"
              >
                <SectionHeading
                  icon={<MessageCircle size={20} />}
                  title="Giới thiệu bản thân"
                  description="Hãy chia sẻ một chút về bạn để mentor hiểu rõ hơn và dễ dàng kết nối nhé!"
                />
                <div className="relative">
                  <TextArea
                    rows={4}
                    maxLength={BIO_MAX_LENGTH}
                    placeholder="Giới thiệu ngắn về bản thân, mục tiêu học tập, những kỹ năng bạn muốn cải thiện hoặc lĩnh vực mentor mà bạn đang tìm kiếm…"
                    className={`${styles.onboardingField} !min-h-28 !pb-7`}
                    aria-label="Giới thiệu bản thân"
                    aria-invalid={Boolean(errors.bio)}
                    error={errors.bio?.message}
                    {...register('bio')}
                  />
                  <span className="pointer-events-none absolute bottom-7 right-3 text-[10px] font-medium text-text-muted">
                    {bio?.length ?? 0}/{BIO_MAX_LENGTH}
                  </span>
                </div>
                <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-primary-light/80 px-3.5 py-3 text-[11px] leading-relaxed text-text-secondary">
                  <Lightbulb
                    size={17}
                    className="mt-0.5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <p className="m-0">
                    <strong className="text-primary">Gợi ý:</strong> Bạn có thể chia sẻ về sở thích,
                    kỹ năng hiện có, mục tiêu nghề nghiệp hoặc những chủ đề bạn mong muốn được
                    mentor hỗ trợ.
                  </p>
                </div>
              </section>
            </div>
          </div>

          <aside
            className={`${styles.sidePanel} flex min-w-0 flex-col gap-4 border-t border-solid border-[#e5edf7] bg-[#f8fbff] p-4 sm:p-5 lg:border-l lg:border-t-0`}
          >
            <section className="relative overflow-hidden rounded-2xl border border-solid border-[#e5edf7] bg-gradient-to-br from-white to-[#eaf6ff] p-4">
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary-light"
                aria-hidden="true"
              />
              <div
                className={`${styles.speechBubble} relative z-10 ml-auto w-[82%] rounded-[20px] border border-solid border-[#e5edf7] bg-white px-4 py-3 shadow-xs`}
              >
                <strong className="block text-sm font-extrabold text-primary">
                  Chỉ còn một chút nữa thôi!
                </strong>
                <p className="mb-0 mt-1 text-[11px] leading-relaxed text-text-secondary">
                  Hoàn thiện hồ sơ để mình giúp bạn kết nối với những mentor phù hợp nhé! 💙
                </p>
              </div>
              <Image
                src="/images/Koko.png"
                alt="Koko, linh vật SkillSwap"
                width={300}
                height={300}
                priority
                className="student-onboarding-mascot relative z-0 mx-auto -mb-5 -mt-2 h-auto w-[190px] object-contain sm:w-[220px] lg:w-[230px]"
              />
            </section>

            <section className="rounded-2xl border border-solid border-[#e5edf7] bg-white p-4 shadow-xs">
              <header className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light text-primary">
                  <ClipboardCheck size={19} aria-hidden="true" />
                </span>
                <h2 className="m-0 flex-1 text-sm font-extrabold text-text-main">
                  Danh sách cần hoàn thành
                </h2>
                <strong className="text-xs text-text-muted">
                  {checklistCompleted}/{checklistItems.length}
                </strong>
              </header>
              <div
                className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e8eef5]"
                role="progressbar"
                aria-label="Tiến độ danh sách onboarding"
                aria-valuemin={0}
                aria-valuemax={checklistItems.length}
                aria-valuenow={checklistCompleted}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#2eb7ef] to-primary transition-[width] duration-300"
                  style={{ width: `${(checklistCompleted / checklistItems.length) * 100}%` }}
                />
              </div>
              <div className="mt-3 flex flex-col gap-1">
                {checklistItems.map((item) => {
                  const isCurrent = item.id === currentChecklistId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border-0 px-3 py-2.5 text-left text-[11px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-primary/20 ${isCurrent ? 'bg-primary-light text-primary' : 'bg-transparent text-text-secondary hover:bg-[#f7fafc]'}`}
                      onClick={() => focusChecklistTarget(item.targetId)}
                    >
                      {item.completed ? (
                        <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
                      ) : isCurrent ? (
                        <Circle size={18} className="shrink-0 text-primary" />
                      ) : (
                        <Circle size={18} className="shrink-0 text-[#c8d3df]" />
                      )}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <SupportFaq />
          </aside>

          <div
            className={`${styles.actionBar} flex flex-col gap-3 border-t border-solid border-[#e5edf7] bg-white px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-end lg:px-9`}
          >
            <p className="m-0 text-center text-[11px] leading-relaxed text-text-muted lg:mr-auto lg:whitespace-nowrap lg:text-left">
              Sau khi hoàn tất, bạn vẫn có thể cập nhật thông tin trong trang Hồ sơ.
            </p>
            <Button
              type="submit"
              size="lg"
              loading={isSubmitting}
              disabled={isLoadingCatalog}
              rightIcon={<ArrowRight size={18} aria-hidden="true" />}
              className="w-full !rounded-xl lg:w-auto lg:min-w-[330px]"
            >
              {isSubmitting ? 'Đang hoàn tất hồ sơ...' : 'Hoàn tất hồ sơ để bắt đầu tìm mentor'}
            </Button>
          </div>
        </form>
      </main>
    </AuthGuard>
  );
}
