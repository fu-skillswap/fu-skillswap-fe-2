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
import { ApiClientError } from '@/models/apiClient';
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
import { yupResolver } from '@hookform/resolvers/yup';
import { ArrowRight, GraduationCap, Lightbulb } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

const semesterOptions = Array.from({ length: 10 }, (_, semester) => ({
  value: String(semester),
  label: semester === 0 ? '0 — Tiếng Anh dự bị' : `Học kỳ ${semester}`,
}));

export function StudentOnboardingView({ locale }: { locale: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
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
    formState: { errors },
  } = useForm<StudentOnboardingFormValues>({
    resolver: yupResolver(studentOnboardingSchema) as never,
    mode: 'onBlur',
    reValidateMode: 'onChange',
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

  const isAlumni = watch('isAlumni');
  const selectedProgramId = watch('programId');

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
            reason instanceof ApiClientError
              ? reason.message
              : 'Không thể tải danh mục học thuật. Vui lòng thử lại.',
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

  const selectProgram = async (programId: string) => {
    setValue('programId', programId, { shouldValidate: true });
    setValue('specializationId', '');
    setSpecializations([]);
    setError(undefined);
    if (!programId) return;
    try {
      setSpecializations(await studentProfileRepo.getSpecializations(programId));
    } catch (reason) {
      setError(
        reason instanceof ApiClientError ? reason.message : 'Không thể tải danh sách chuyên ngành.',
      );
    }
  };

  const submit = async (values: StudentOnboardingFormValues) => {
    setError(undefined);
    setIsSubmitting(true);
    try {
      await studentProfileRepo.save({
        studentCode: values.studentCode.trim(),
        displayName: values.displayName?.trim() || undefined,
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
      router.replace(`/${locale}/dashboard`);
    } catch (reason) {
      setError(
        reason instanceof ApiClientError
          ? reason.message
          : 'Không thể lưu hồ sơ. Vui lòng thử lại.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard locale={locale}>
      <main className="relative min-h-screen overflow-hidden bg-bg px-4 py-4 sm:px-6 lg:px-8">
        <div
          className="pointer-events-none absolute -left-24 bottom-[-9rem] h-80 w-80 rounded-full bg-primary-light"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-32 top-24 h-96 w-96 rounded-full bg-primary-light/70"
          aria-hidden="true"
        />

        <div className="relative mx-auto flex w-full max-w-[1160px] items-center justify-between pb-3 sm:pb-4">
          <Image
            src="/images/SkillSwap_Logo_Text.png"
            alt="SkillSwap"
            width={220}
            height={68}
            priority
            className="h-[60px] w-[195px] object-cover object-center sm:h-[68px] sm:w-[220px]"
          />
          <p className="hidden items-center gap-2 rounded-full bg-primary-light px-5 py-2 text-xs font-semibold text-primary md:flex">
            <GraduationCap size={18} strokeWidth={2.25} aria-hidden="true" />
            Cùng nhau kiến tạo hành trình học tập tốt hơn
          </p>
        </div>

        <section
          className="relative mx-auto grid w-full max-w-[1160px] overflow-hidden rounded-[22px] border border-solid border-border-color bg-white shadow-md lg:grid-cols-[64fr_36fr]"
          aria-labelledby="onboarding-title"
        >
          <div className="px-5 py-6 sm:px-8 lg:px-10 lg:py-7">
            <header className="mb-5">
              <h1
                id="onboarding-title"
                className="student-onboarding-reveal student-onboarding-reveal-1 m-0 text-[28px] font-extrabold leading-[1.15] tracking-[-0.025em] text-text-main sm:text-[32px]"
              >
                Chào {user?.fullName || 'bạn'}!
              </h1>
              <p className="student-onboarding-reveal student-onboarding-reveal-2 mb-0 mt-1.5 text-sm text-text-secondary">
                Điền thông tin sinh viên để hoàn tất hồ sơ Mentee.
              </p>
            </header>

            <form
              className="flex flex-col gap-3.5 text-left"
              onSubmit={handleSubmit(submit)}
              noValidate
            >
              {error && (
                <p
                  className="m-0 rounded-xl border border-solid border-red-200 bg-danger-soft px-3 py-2 text-xs font-medium text-danger"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <div className="student-onboarding-reveal student-onboarding-reveal-3">
                <TextField
                  label="Mã số sinh viên"
                  placeholder="SE192621"
                  required
                  aria-required="true"
                  error={errors.studentCode?.message}
                  className="!h-11"
                  {...register('studentCode')}
                />
              </div>
              <div className="student-onboarding-reveal student-onboarding-reveal-4">
                <TextField
                  label="Tên hiển thị"
                  placeholder="Nguyễn Văn A"
                  error={errors.displayName?.message}
                  className="!h-11"
                  {...register('displayName')}
                />
              </div>

              <div className="student-onboarding-reveal student-onboarding-reveal-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <Controller
                  name="campusId"
                  control={control}
                  render={({ field }) => (
                    <SelectField
                      id="campusId"
                      label="Cơ sở"
                      required
                      value={field.value}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder={isLoadingCatalog ? 'Đang tải...' : 'Chọn cơ sở'}
                      disabled={isLoadingCatalog}
                      error={errors.campusId?.message}
                      options={campuses.map((campus) => ({
                        value: campus.id,
                        label: `${campus.name} — ${campus.city}`,
                      }))}
                      triggerClassName="!h-11"
                    />
                  )}
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
                      placeholder={isLoadingCatalog ? 'Đang tải...' : 'Chọn ngành'}
                      disabled={isLoadingCatalog}
                      error={errors.programId?.message}
                      options={programs.map((program) => ({
                        value: program.id,
                        label: program.nameVi,
                      }))}
                      triggerClassName="!h-11"
                    />
                  )}
                />
              </div>

              <div className="student-onboarding-reveal student-onboarding-reveal-6">
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
                      placeholder={selectedProgramId ? 'Chọn chuyên ngành' : 'Chọn ngành trước'}
                      disabled={!selectedProgramId}
                      error={errors.specializationId?.message}
                      options={specializations.map((specialization) => ({
                        value: specialization.id,
                        label: specialization.nameVi,
                      }))}
                      triggerClassName="!h-11"
                    />
                  )}
                />
              </div>

              <div className="student-onboarding-reveal student-onboarding-reveal-7 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <Controller
                  name="semester"
                  control={control}
                  render={({ field }) => (
                    <SelectField
                      id="semester"
                      label="Học kỳ"
                      required
                      value={String(field.value)}
                      onValueChange={(value) => field.onChange(Number(value))}
                      onBlur={field.onBlur}
                      options={semesterOptions}
                      error={errors.semester?.message}
                      triggerClassName="!h-11"
                    />
                  )}
                />
                <TextField
                  label="Năm nhập học"
                  type="number"
                  min="2000"
                  max={new Date().getFullYear()}
                  required
                  aria-required="true"
                  error={errors.intakeYear?.message}
                  className="!h-11"
                  {...register('intakeYear', { valueAsNumber: true })}
                />
              </div>

              <div className="student-onboarding-reveal student-onboarding-reveal-8 flex flex-col gap-3.5">
                <Checkbox label="Tôi đã tốt nghiệp" {...register('isAlumni')} />
                {isAlumni && (
                  <TextField
                    label="Năm tốt nghiệp"
                    type="number"
                    min="2000"
                    required
                    aria-required="true"
                    error={errors.graduationYear?.message}
                    className="!h-11"
                    {...register('graduationYear', { valueAsNumber: true })}
                  />
                )}
              </div>

              <div className="student-onboarding-reveal student-onboarding-reveal-9">
                <TextArea
                  label={
                    <>
                      Giới thiệu bản thân{' '}
                      <span className="font-normal italic text-text-muted">(không bắt buộc)</span>
                    </>
                  }
                  rows={3}
                  placeholder="Kỹ năng và mục tiêu học tập của bạn"
                  className="!min-h-20"
                  error={errors.bio?.message}
                  {...register('bio')}
                />
              </div>

              <div className="student-onboarding-reveal student-onboarding-reveal-10">
                <Button
                  type="submit"
                  size="lg"
                  loading={isSubmitting}
                  rightIcon={<ArrowRight size={18} aria-hidden="true" />}
                  className="mt-0.5 w-full rounded-xl"
                >
                  {isSubmitting ? 'Đang lưu hồ sơ...' : 'Hoàn tất hồ sơ'}
                </Button>
              </div>
            </form>
          </div>

          <aside className="relative flex min-h-[520px] flex-col items-center justify-between overflow-hidden border-t border-solid border-border-color bg-primary-light/70 px-7 py-7 text-center lg:min-h-0 lg:border-l lg:border-t-0">
            <div
              className="pointer-events-none absolute right-[-4rem] top-24 h-56 w-56 rounded-full bg-white/55"
              aria-hidden="true"
            />
            <p className="relative z-10 m-0 max-w-[280px] text-xl font-bold leading-snug text-primary">
              Hoàn thiện hồ sơ
              <br />
              để bắt đầu kết nối
              <br />
              mentor nhé!
            </p>
            <Image
              src="/images/Koko.png"
              alt="Kookoo, linh vật của SkillSwap"
              width={340}
              height={340}
              priority
              className="student-onboarding-mascot relative z-10 my-1 h-auto w-[220px] object-contain sm:w-[260px] lg:w-[300px]"
            />
            <div className="student-onboarding-support relative z-10 w-full rounded-2xl bg-white/70 p-4 text-left shadow-xs backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Lightbulb size={20} aria-hidden="true" />
                </span>
                <p className="m-0 text-xs leading-relaxed text-text-secondary">
                  <strong className="block text-text-main">Một hồ sơ đầy đủ giúp bạn</strong>dễ dàng
                  kết nối với mentor phù hợp và khám phá nhiều cơ hội học tập hơn!
                </p>
              </div>
            </div>
            <p className="relative z-10 mb-0 mt-5 border-t border-solid border-primary/15 pt-4 text-[11px] text-text-muted">
              SkillSwap — Học hỏi. Kết nối. Phát triển.
            </p>
          </aside>
        </section>
      </main>
    </AuthGuard>
  );
}
