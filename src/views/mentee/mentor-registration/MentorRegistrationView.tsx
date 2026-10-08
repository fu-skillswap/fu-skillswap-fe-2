'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Clock3, Save, Send, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { SelectOption } from '@/components/ui/SelectField';
import { useAuth } from '@/providers/AuthProvider';
import { showWarning } from '@/utils/toast';
import { useMentorRegistration } from './useMentorRegistration';
import { useMentorDraft } from './hooks/useMentorDraft';
import { BasicInfoSection } from './components/BasicInfoSection';
import { SubjectResultsSection } from './components/SubjectResultsSection';
import { SupportLevelsSection } from './components/SupportLevelsSection';
import { FeaturedProjectsSection } from './components/FeaturedProjectsSection';
import { AchievementsSection } from './components/AchievementsSection';
import { BookingConfigSection } from './components/BookingConfigSection';
import { DocumentUploadSection } from './components/DocumentUploadSection';
import { MentorDashboardReadOnly } from './components/MentorDashboardReadOnly';
import { TermsModal } from './components/TermsModal';
import { MentorWizardStepper } from './components/MentorWizardStepper';
import { MentorBenefitsCard } from './components/MentorBenefitsCard';
import { ReviewStep } from './components/ReviewStep';
import { MENTOR_REVIEW_DURATION, MENTOR_STEPS, STEP_FIELDS } from './mentorRegistration.constants';

/** Required items counted on the review step (fields, evidence and terms). */
const REQUIRED_ITEM_COUNT = 11;

const levelOptions: SelectOption[] = [1, 2, 3, 4, 5].map((value) => ({
  value: String(value),
  label: `Mức ${value}`,
}));

export function MentorRegistrationView({ locale }: { locale: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const requestedStep = Number(searchParams.get('step') || 1);
  const step = requestedStep >= 1 && requestedStep <= 5 ? requestedStep : 1;
  const [showTermsModal, setShowTermsModal] = useState(false);

  const registration = useMentorRegistration();
  const {
    form,
    register,
    control,
    watch,
    errors,
    isSubmitting,
    isLoading,
    isExistingProfile,
    isPendingReview,
    isApproved,
    verificationData,
    serverError,
    selectedFptuFile,
    setSelectedFptuFile,
    fptuUploadError,
    selectedExpertiseFiles,
    expertiseUploadError,
    onAddExpertiseFiles,
    onRemoveExpertiseFile,
    fields,
    append,
    remove,
    projectFields,
    appendProject,
    removeProject,
    achievementFields,
    appendAchievement,
    removeAchievement,
    submitProfile,
    withdrawProfile,
  } = registration;
  const { setValue, getValues, reset, trigger } = form;
  const { saveDraft, lastSavedAt, clearDraft } = useMentorDraft({
    userId: user?.id,
    loading: isLoading,
    watch,
    getValues,
    reset,
  });

  const existingFptu =
    verificationData?.documents?.some(
      (item) => item.documentType === 'FPTU_AFFILIATION_PROOF' && item.isActive !== false,
    ) ?? false;
  const existingExpertiseCount =
    verificationData?.documents?.filter(
      (item) => item.documentType === 'EXPERTISE_PROOF' && item.isActive !== false,
    ).length ?? 0;
  const hasFptu = Boolean(selectedFptuFile || existingFptu || isExistingProfile);
  const hasExpertise =
    selectedExpertiseFiles.length + existingExpertiseCount > 0 || isExistingProfile;
  const current = MENTOR_STEPS[step - 1];
  const values = watch();

  const goToStep = (next: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('step', String(next));
    router.push(`${pathname}?${params.toString()}`, { scroll: true });
  };

  const nextStep = async () => {
    if (step === 4 && (!hasFptu || !hasExpertise)) {
      showWarning(
        !hasFptu
          ? 'Vui lòng tải lên minh chứng sinh viên/cựu sinh viên FPTU.'
          : 'Vui lòng tải lên ít nhất một minh chứng chuyên môn.',
      );
      return;
    }
    const valid =
      STEP_FIELDS[step].length === 0 || (await trigger(STEP_FIELDS[step], { shouldFocus: true }));
    if (!valid) return;
    saveDraft();
    goToStep(Math.min(5, step + 1));
  };

  useEffect(() => {
    if (isPendingReview) clearDraft();
  }, [clearDraft, isPendingReview]);

  const completedRequired = useMemo(() => {
    return [
      Boolean(values.headline),
      Boolean(values.expertiseDescription),
      Boolean(values.phoneNumber),
      Boolean(values.foundationSupportLevel),
      Boolean(values.outputReviewSupportLevel),
      Boolean(values.directionSupportLevel),
      Boolean(values.minimumBookingLeadTimeMinutes),
      Boolean(values.maximumBookingHorizonDays),
      hasFptu,
      hasExpertise,
      Boolean(values.agreeTerms),
    ].filter(Boolean).length;
  }, [hasExpertise, hasFptu, values]);

  if (isLoading)
    return (
      <main className="grid min-h-[60vh] place-items-center bg-slate-50 text-sm font-semibold text-slate-600">
        Đang tải dữ liệu hồ sơ Mentor...
      </main>
    );

  if (isPendingReview) return <StatusScreen locale={locale} onWithdraw={withdrawProfile} />;

  if (isApproved)
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-5xl space-y-5">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <h1 className="m-0 flex items-center gap-2 text-2xl font-bold text-emerald-900">
              <CheckCircle2 /> Hồ sơ Mentor đã được phê duyệt
            </h1>
            <p className="mb-0 mt-2 text-sm text-emerald-800">
              Thông tin xác thực đã được khóa. Bạn vẫn có thể cập nhật dự án và thành tích nổi bật.
            </p>
          </div>
          <MentorDashboardReadOnly watch={watch} verificationData={verificationData} />
          <FeaturedProjectsSection
            register={register}
            errors={errors}
            projectFields={projectFields}
            appendProject={appendProject}
            removeProject={removeProject}
          />
          <AchievementsSection
            register={register}
            errors={errors}
            achievementFields={achievementFields}
            appendAchievement={appendAchievement}
            removeAchievement={removeAchievement}
          />
        </div>
      </main>
    );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-[1180px]">
        <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <h1 className="m-0 text-2xl font-extrabold text-slate-950 sm:text-3xl">
              Đăng ký trở thành Mentor
            </h1>
            <p className="mb-0 mt-1 text-sm text-slate-600">
              Chia sẻ kinh nghiệm – Truyền cảm hứng – Cùng phát triển cộng đồng sinh viên FPT
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Clock3 className="h-4 w-4 text-sky-600" /> Thời gian hoàn thành:{' '}
            <strong className="text-sky-700">~5 phút</strong>
          </div>
        </header>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <MentorWizardStepper step={step} onGoBack={goToStep} />
        </section>

        <div className={`mt-5 grid gap-5 ${step <= 3 ? 'lg:grid-cols-[minmax(0,1fr)_280px]' : ''}`}>
          <form onSubmit={submitProfile} className="min-w-0 space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wide text-sky-600">
                Bước {step}/5
              </span>
              <h2 className="mb-0 mt-1 text-xl font-extrabold text-slate-950">{current.label}</h2>
              <p className="mb-0 mt-1 text-sm text-slate-600">{current.purpose}</p>
            </section>

            {step === 1 && (
              <BasicInfoSection
                register={register}
                errors={errors}
                watch={watch}
                setValue={setValue}
                disabled={isSubmitting}
              />
            )}
            {step === 2 && (
              <>
                <SubjectResultsSection
                  register={register}
                  errors={errors}
                  fields={fields}
                  append={append}
                  remove={remove}
                  disabled={isSubmitting}
                />
                <SupportLevelsSection
                  control={control}
                  errors={errors}
                  levelOptions={levelOptions}
                  disabled={isSubmitting}
                />
                <FeaturedProjectsSection
                  register={register}
                  errors={errors}
                  projectFields={projectFields}
                  appendProject={appendProject}
                  removeProject={removeProject}
                  disabled={isSubmitting}
                />
                <AchievementsSection
                  register={register}
                  errors={errors}
                  achievementFields={achievementFields}
                  appendAchievement={appendAchievement}
                  removeAchievement={removeAchievement}
                  disabled={isSubmitting}
                />
              </>
            )}
            {step === 3 && (
              <BookingConfigSection
                register={register}
                errors={errors}
                isAvailable={watch('isAvailable')}
                disabled={isSubmitting}
              />
            )}
            {step === 4 && (
              <DocumentUploadSection
                selectedFptuFile={selectedFptuFile}
                onSelectFptuFile={setSelectedFptuFile}
                selectedExpertiseFiles={selectedExpertiseFiles}
                onAddExpertiseFiles={onAddExpertiseFiles}
                onRemoveExpertiseFile={onRemoveExpertiseFile}
                verificationData={verificationData}
                disabled={isSubmitting}
                fptuError={fptuUploadError}
                expertiseError={expertiseUploadError}
              />
            )}
            {step === 5 && (
              <ReviewStep
                values={values}
                completed={completedRequired}
                total={REQUIRED_ITEM_COUNT}
                register={register}
                errors={errors}
                selectedFptuFile={selectedFptuFile}
                selectedExpertiseFiles={selectedExpertiseFiles}
                documents={verificationData?.documents ?? []}
                onEdit={goToStep}
                onTerms={() => setShowTermsModal(true)}
              />
            )}
            {serverError && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
              >
                {serverError}
              </div>
            )}

            <footer className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
              <div>
                <Button type="button" variant="outline" leftIcon={<Save />} onClick={saveDraft}>
                  Lưu nháp
                </Button>
                {lastSavedAt && (
                  <p className="mb-0 mt-1 text-[11px] text-slate-500">
                    Đã lưu nháp lúc{' '}
                    {lastSavedAt.toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={() => goToStep(step - 1)}>
                    ← Quay lại
                  </Button>
                )}
                {step < 5 ? (
                  <Button type="button" onClick={nextStep}>
                    Tiếp tục →
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting} leftIcon={<Send />}>
                    {isSubmitting ? 'Đang nộp...' : 'Nộp hồ sơ'}
                  </Button>
                )}
              </div>
            </footer>
          </form>
          {step <= 3 && <MentorBenefitsCard />}
        </div>
      </div>
      <TermsModal open={showTermsModal} onClose={() => setShowTermsModal(false)} />
    </main>
  );
}

function StatusScreen({ locale, onWithdraw }: { locale: string; onWithdraw: () => Promise<void> }) {
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    try {
      await onWithdraw();
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <main className="grid min-h-[70vh] place-items-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h1 className="mb-0 mt-4 text-2xl font-extrabold text-slate-950">Đã nộp hồ sơ!</h1>
        <p className="mx-auto mb-0 mt-2 max-w-lg text-sm leading-6 text-slate-600">
          Hồ sơ đang được xét duyệt trong {MENTOR_REVIEW_DURATION}. Bạn sẽ nhận kết quả qua email và
          thông báo trong ứng dụng.
        </p>
        <div className="mx-auto mt-7 grid max-w-lg grid-cols-3 text-xs font-bold">
          <span className="text-emerald-600">Đã nộp ✓</span>
          <span className="text-sky-600">Đang xét duyệt</span>
          <span className="text-slate-400">Kết quả</span>
        </div>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href={`/${locale}/settings?section=help`}
            className="inline-flex min-h-11 items-center rounded-xl border border-sky-200 px-4 text-sm font-bold text-sky-700 no-underline"
          >
            Trợ giúp & hỗ trợ
          </Link>
          <Button
            type="button"
            variant="secondary"
            loading={isWithdrawing}
            onClick={handleWithdraw}
            className="min-h-11 px-4 text-sm"
          >
            Rút hồ sơ
          </Button>
          <Link
            href={`/${locale}/dashboard`}
            className="inline-flex min-h-11 items-center rounded-xl bg-sky-600 px-5 text-sm font-bold text-white no-underline"
          >
            Về Bảng tin
          </Link>
        </div>
      </section>
    </main>
  );
}
