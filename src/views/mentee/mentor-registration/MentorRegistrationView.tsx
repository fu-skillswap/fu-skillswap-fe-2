/**
 * @file MentorRegistrationView.tsx
 * @description Giao diện Đăng ký / Cập nhật Hồ sơ Mentor (Mentor Registration View).
 * Hỗ trợ chế độ Dashboard Read-Only cho các thông tin đã xác thực khi hồ sơ ở trạng thái APPROVED,
 * đồng thời giữ mục Dự án tiêu biểu & Học vấn/Giải thưởng ở dạng Editable.
 */

'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SelectOption } from '@/components/ui/SelectField';
import { useMentorRegistration } from './useMentorRegistration';
import { BasicInfoSection } from './components/BasicInfoSection';
import { SubjectResultsSection } from './components/SubjectResultsSection';
import { SupportLevelsSection } from './components/SupportLevelsSection';
import { FeaturedProjectsSection } from './components/FeaturedProjectsSection';
import { AchievementsSection } from './components/AchievementsSection';
import { BookingConfigSection } from './components/BookingConfigSection';
import { DocumentUploadSection } from './components/DocumentUploadSection';
import { MentorDashboardReadOnly } from './components/MentorDashboardReadOnly';
import { TermsModal } from './components/TermsModal';

const levelOptions: SelectOption[] = [
  { value: '1', label: 'Mức 1' },
  { value: '2', label: 'Mức 2' },
  { value: '3', label: 'Mức 3' },
  { value: '4', label: 'Mức 4' },
  { value: '5', label: 'Mức 5' },
];

export function MentorRegistrationView({ locale }: { locale: string }) {
  const [showTermsModal, setShowTermsModal] = useState(false);

  const {
    form,
    register,
    control,
    watch,
    errors,
    isValid,
    isSubmitting,
    isLoading,
    isExistingProfile,
    isPendingReview,
    isApproved,
    verificationData,
    serverError,
    selectedFptuFile,
    setSelectedFptuFile,
    selectedExpertiseFiles,
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
  } = useMentorRegistration();

  const isAvailable = watch('isAvailable');
  const agreeTerms = watch('agreeTerms');

  const hasExistingExpertise =
    (verificationData?.documents?.filter(
      (d) => d.documentType === 'EXPERTISE_PROOF' && d.isActive !== false,
    ).length ?? 0) > 0;

  const isFormDisabled = isSubmitting || isPendingReview;
  const isSubmitDisabled =
    isFormDisabled ||
    !isValid ||
    !agreeTerms ||
    (!selectedFptuFile && !isExistingProfile) ||
    (selectedExpertiseFiles.length === 0 && !hasExistingExpertise && !isExistingProfile);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50/60 bg-[radial-gradient(#e2e8f0_1.2px,transparent_1.2px)] [background-size:16px_16px] py-16 px-4 flex items-center justify-center">
        <div className="text-center text-slate-500 text-sm font-medium">
          Đang tải dữ liệu hồ sơ Mentor...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50/60 bg-[radial-gradient(#e2e8f0_1.2px,transparent_1.2px)] [background-size:16px_16px] py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            {isApproved
              ? 'Quản lý Hồ sơ Mentor (Đã duyệt)'
              : isExistingProfile
                ? 'Cập nhật Hồ sơ Mentor'
                : 'Đăng ký trở thành Mentor'}
          </h1>
          <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
            {isApproved
              ? 'Hồ sơ chuyên môn của bạn đã được kiểm duyệt chính thức. Bạn có thể cập nhật danh sách các Dự án thực tế và Giải thưởng nổi bật.'
              : isExistingProfile
                ? 'Đăng ký thông tin năng lực, kinh nghiệm chuyên môn, minh chứng và thời gian có thể tư vấn của bạn.'
                : 'Chia sẻ kinh nghiệm, chuyên môn và thiết lập thời gian có thể tư vấn cho Mentee.'}
          </p>
        </div>

        {/* DÒNG TRẠNG THÁI HỒ SƠ ĐANG CHỜ DUYỆT */}
        {isPendingReview && (
          <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/80 border border-blue-200/80 text-blue-900 flex items-center gap-3.5 shadow-sm">
            <Clock className="w-6 h-6 text-blue-600 shrink-0" />
            <div>
              <strong className="block text-sm font-bold text-blue-800">
                Hồ sơ đang chờ duyệt
              </strong>
              <span className="text-xs text-blue-600">
                Hồ sơ đang chờ Admin xem xét đối soát, vui lòng đợi 1-2 ngày làm việc.
              </span>
            </div>
          </div>
        )}

        {/* DÒNG TRẠNG THÁI HỒ SƠ ĐÃ ĐƯỢC PHÊ DUYỆT (APPROVED) */}
        {isApproved && (
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-900 flex items-center gap-3.5 shadow-sm">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <strong className="block text-sm font-bold text-emerald-800">
                Hồ sơ Mentor đã được phê duyệt thành công
              </strong>
              <span className="text-xs text-emerald-700">
                Các thông tin cơ bản, tư cách FPTU và cài đặt thời gian đặt lịch đã được kiểm duyệt và
                khóa cố định. Bạn có thể tự do thêm, sửa hoặc xóa các Dự án tiêu biểu và Học vấn/Giải
                thưởng bên dưới.
              </span>
            </div>
          </div>
        )}

        <form onSubmit={submitProfile} className="space-y-6">
          {/* NẾU HỒ SƠ Ở TRẠNG THÁI APPROVED -> HIỂN THỊ DASHBOARD READ-ONLY CHO CÁC MỤC CỐ ĐỊNH */}
          {isApproved ? (
            <>
              <MentorDashboardReadOnly watch={watch} verificationData={verificationData} />

              {/* SECTION DỰ ÁN TIÊU BIỂU (EDITABLE) */}
              <FeaturedProjectsSection
                register={register}
                errors={errors}
                projectFields={projectFields}
                appendProject={appendProject}
                removeProject={removeProject}
                disabled={false}
              />

              {/* SECTION HỌC VẤN & GIẢI THƯỞNG NỔI BẬT (EDITABLE) */}
              <AchievementsSection
                register={register}
                errors={errors}
                achievementFields={achievementFields}
                appendAchievement={appendAchievement}
                removeAchievement={removeAchievement}
                disabled={false}
              />
            </>
          ) : (
            /* NẾU HỒ SƠ CHƯA APPROVED -> HIỂN THỊ DẠNG FORM CHỈNH SỬA ĐẦY ĐỦ */
            <>
              {/* SECTION 1: THÔNG TIN CƠ BẢN */}
              <BasicInfoSection register={register} errors={errors} disabled={isFormDisabled} />

              {/* SECTION 2: DANH MỤC MÔN HỌC & ĐIỂM SỐ */}
              <SubjectResultsSection
                register={register}
                errors={errors}
                fields={fields}
                append={append}
                remove={remove}
                disabled={isFormDisabled}
              />

              {/* SECTION 3: MỨC ĐỘ HỖ TRỢ */}
              <SupportLevelsSection
                control={control}
                errors={errors}
                levelOptions={levelOptions}
                disabled={isFormDisabled}
              />

              {/* SECTION 4: DỰ ÁN TIÊU BIỂU */}
              <FeaturedProjectsSection
                register={register}
                errors={errors}
                projectFields={projectFields}
                appendProject={appendProject}
                removeProject={removeProject}
                disabled={isFormDisabled}
              />

              {/* SECTION 5: HỌC VẤN & GIẢI THƯỞNG NỔI BẬT */}
              <AchievementsSection
                register={register}
                errors={errors}
                achievementFields={achievementFields}
                appendAchievement={appendAchievement}
                removeAchievement={removeAchievement}
                disabled={isFormDisabled}
              />

              {/* SECTION 6: CẤU HÌNH ĐẶT LỊCH */}
              <BookingConfigSection
                register={register}
                errors={errors}
                isAvailable={isAvailable}
                disabled={isFormDisabled}
              />

              {/* SECTION 7: TẢI LÊN MINH CHỨNG FPTU & CHỨNG CHỈ CHUYÊN MÔN */}
              <DocumentUploadSection
                selectedFptuFile={selectedFptuFile}
                onSelectFptuFile={setSelectedFptuFile}
                selectedExpertiseFiles={selectedExpertiseFiles}
                onAddExpertiseFiles={onAddExpertiseFiles}
                onRemoveExpertiseFile={onRemoveExpertiseFile}
                verificationData={verificationData}
                disabled={isFormDisabled}
              />

              {/* SECTION 8: XÁC NHẬN ĐIỀU KHOẢN VẬN HÀNH */}
              <fieldset
                disabled={isFormDisabled}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm disabled:opacity-75"
              >
                <label className="inline-flex items-center gap-2.5 cursor-pointer text-sm font-medium text-slate-800">
                  <input
                    type="checkbox"
                    className="w-4.5 h-4.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 accent-sky-600 cursor-pointer"
                    {...register('agreeTerms')}
                  />
                  <span>
                    Tôi đồng ý với{' '}
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setShowTermsModal(true)}
                      className="bg-transparent border-0 text-sky-600 font-bold underline p-0 cursor-pointer hover:text-sky-700 transition-colors"
                    >
                      điều khoản vận hành
                    </button>{' '}
                    của SkillSwap <span className="text-red-500 font-bold ml-0.5">*</span>
                  </span>
                </label>
                {errors.agreeTerms && (
                  <p className="text-xs font-medium text-red-500 mt-1">
                    {errors.agreeTerms.message}
                  </p>
                )}
              </fieldset>
            </>
          )}

          {/* HIỂN THỊ LỖI THẤT BẠI NGAY TRÊN NÚT SUBMIT NẾU CÓ */}
          {serverError && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-semibold">
              {serverError}
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="flex items-center justify-end gap-3 pt-2 pb-10">
            <Link
              href={`/${locale}/dashboard`}
              className="px-6 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors text-center inline-flex items-center justify-center decoration-0"
            >
              {isApproved ? 'Quay lại Dashboard' : 'Hủy bỏ'}
            </Link>
            {isPendingReview ? (
              <Button
                type="button"
                onClick={withdrawProfile}
                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm border-0"
              >
                Rút hồ sơ
              </Button>
            ) : isApproved ? (
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Hồ sơ đã phê duyệt
              </div>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitDisabled}
                className="px-6 py-2.5 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed border-0"
              >
                {isSubmitting ? 'Đang xử lý...' : 'Nộp hồ sơ mentor'}
              </Button>
            )}
          </div>
        </form>

        {/* MODAL POP-UP ĐIỀU KHOẢN VẬN HÀNH */}
        <TermsModal open={showTermsModal} onClose={() => setShowTermsModal(false)} />
      </div>
    </main>
  );
}
