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
      <main className="page-shell narrow">
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          Đang tải dữ liệu hồ sơ Mentor...
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell narrow">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
          {isApproved
            ? 'Quản lý Hồ sơ Mentor (Đã duyệt)'
            : isExistingProfile
              ? 'Cập nhật Hồ sơ Mentor'
              : 'Đăng ký trở thành Mentor'}
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
          {isApproved
            ? 'Hồ sơ chuyên môn của bạn đã được kiểm duyệt chính thức. Bạn có thể cập nhật danh sách các Dự án thực tế và Giải thưởng nổi bật.'
            : isExistingProfile
              ? 'Chỉnh sửa thông tin năng lực, kinh nghiệm chuyên môn và thời gian nhận lịch của bạn.'
              : 'Chia sẻ kinh nghiệm, chuyên môn và thiết lập thời gian nhận lịch tư vấn cho Mentee.'}
        </p>
      </div>

      {/* DÒNG TRẠNG THÁI HỒ SƠ ĐANG CHỜ DUYỆT */}
      {isPendingReview && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: '12px',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            color: '#1e40af',
            fontWeight: 600,
            fontSize: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.08)',
          }}
        >
          <Clock size={22} color="#2563eb" style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ display: 'block', fontSize: '14px', color: '#1d4ed8' }}>
              Hồ sơ đang chờ duyệt
            </strong>
            <span style={{ fontSize: '13px', color: '#1e40af' }}>
              Hồ sơ đang chờ Admin xem xét đối soát, vui lòng đợi 1-2 ngày làm việc.
            </span>
          </div>
        </div>
      )}

      {/* DÒNG TRẠNG THÁI HỒ SƠ ĐÃ ĐƯỢC PHÊ DUYỆT (APPROVED) */}
      {isApproved && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: '12px',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#15803d',
            fontWeight: 600,
            fontSize: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(22, 163, 74, 0.08)',
          }}
        >
          <CheckCircle2 size={24} color="#16a34a" style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ display: 'block', fontSize: '15px', color: '#15803d' }}>
              Hồ sơ Mentor đã được phê duyệt thành công
            </strong>
            <span style={{ fontSize: '13px', color: '#166534' }}>
              Các thông tin cơ bản, tư cách FPTU và cài đặt thời gian đặt lịch đã được kiểm duyệt và
              khóa cố định. Bạn có thể tự do thêm, sửa hoặc xóa các Dự án tiêu biểu và Học vấn/Giải
              thưởng bên dưới.
            </span>
          </div>
        </div>
      )}

      <form
        onSubmit={submitProfile}
        className="figma-profile-form"
        style={{ display: 'grid', gap: '20px' }}
      >
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
              className="card mentor-reg-card"
              disabled={isFormDisabled}
              style={{
                border: '1px solid #e2e8f0',
                padding: '16px 20px',
                background: '#f8fafc',
                borderRadius: '12px',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  color: '#1e293b',
                  fontWeight: 500,
                }}
              >
                <input
                  type="checkbox"
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    accentColor: '#0095f6',
                  }}
                  {...register('agreeTerms')}
                />
                <span>
                  Tôi đồng ý với{' '}
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setShowTermsModal(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0095f6',
                      textDecoration: 'underline',
                      fontWeight: 700,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      padding: 0,
                      font: 'inherit',
                    }}
                  >
                    điều khoản vận hành
                  </button>{' '}
                  của SkillSwap <span className="required-asterisk">*</span>
                </span>
              </label>
              {errors.agreeTerms && (
                <p
                  className="error"
                  style={{ color: '#ef4444', fontSize: '13px', marginTop: '6px' }}
                >
                  {errors.agreeTerms.message}
                </p>
              )}
            </fieldset>
          </>
        )}

        {/* HIỂN THỊ LỖI THẤT BẠI NGAY TRÊN NÚT SUBMIT NẾU CÓ */}
        {serverError && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#ef4444',
              fontSize: '14px',
              marginTop: '16px',
              fontWeight: 600,
            }}
          >
            {serverError}
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="mentor-actions-row">
          <Link
            href={`/${locale}/dashboard`}
            style={{
              padding: '10px 24px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              background: '#fff',
              color: '#475467',
              fontWeight: 700,
              fontSize: '14px',
              textDecoration: 'none',
            }}
          >
            {isApproved ? 'Quay lại Dashboard' : 'Hủy bỏ'}
          </Link>
          {isPendingReview ? (
            <Button
              type="button"
              onClick={withdrawProfile}
              style={{
                padding: '12px 32px',
                background: '#ea580c',
                borderColor: '#ea580c',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
                borderRadius: '10px',
                boxShadow: '0 2px 8px rgba(234, 88, 12, 0.25)',
              }}
            >
              Rút hồ sơ
            </Button>
          ) : isApproved ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '10px',
                background: '#dcfce7',
                color: '#15803d',
                fontWeight: 700,
                fontSize: '14px',
                border: '1px solid #bbf7d0',
              }}
            >
              <CheckCircle2 size={18} color="#16a34a" /> Hồ sơ đã phê duyệt
            </div>
          ) : (
            <Button
              type="submit"
              disabled={isSubmitDisabled}
              style={{
                padding: '12px 32px',
                opacity: isSubmitDisabled ? 0.5 : 1,
                cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? 'Đang xử lý...' : 'Nộp hồ sơ mentor'}
            </Button>
          )}
        </div>
      </form>

      {/* MODAL POP-UP ĐIỀU KHOẢN VẬN HÀNH */}
      <TermsModal open={showTermsModal} onClose={() => setShowTermsModal(false)} />
    </main>
  );
}
