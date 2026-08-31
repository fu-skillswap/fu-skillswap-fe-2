/**
 * @file MentorDashboardReadOnly.tsx
 * @description Sub-component hiển thị các mục thông tin cố định trong Hồ sơ Mentor dạng Dashboard Read-Only khi ở trạng thái APPROVED.
 */

'use client';

import React from 'react';
import {
  User,
  Phone,
  Globe,
  GitBranch,
  BookOpen,
  Sliders,
  Calendar,
  FileCheck,
  ExternalLink,
  GraduationCap,
  Award,
  CheckCircle2,
} from 'lucide-react';
import type { UseFormWatch } from 'react-hook-form';
import type { MentorVerificationResponse } from '@/models/auth';
import type { MentorProfileFormValues } from '@/models/schemas/mentorProfileSchema';

interface MentorDashboardReadOnlyProps {
  watch: UseFormWatch<MentorProfileFormValues>;
  verificationData?: MentorVerificationResponse | null;
}

export function MentorDashboardReadOnly({ watch, verificationData }: MentorDashboardReadOnlyProps) {
  const headline = watch('headline');
  const expertiseDescription = watch('expertiseDescription');
  const phoneNumber = watch('phoneNumber');
  const githubUrl = watch('githubUrl');
  const portfolioUrl = watch('portfolioUrl');
  const foundationSupportLevel = watch('foundationSupportLevel');
  const outputReviewSupportLevel = watch('outputReviewSupportLevel');
  const directionSupportLevel = watch('directionSupportLevel');
  const isAvailable = watch('isAvailable');
  const minimumBookingLeadTimeMinutes = watch('minimumBookingLeadTimeMinutes');
  const maximumBookingHorizonDays = watch('maximumBookingHorizonDays');
  const subjectResults = watch('subjectResults') || [];

  const existingFptuDoc = verificationData?.documents?.find(
    (d) => d.documentType === 'FPTU_AFFILIATION_PROOF' && d.isActive !== false,
  );
  const existingExpertiseDocs =
    verificationData?.documents?.filter(
      (d) => d.documentType === 'EXPERTISE_PROOF' && d.isActive !== false,
    ) || [];

  return (
    <div className="space-y-6">
      {/* CARD 1: THÔNG TIN CƠ BẢN & LIÊN HỆ */}
      <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 m-0">
              1. Thông tin vị trí & Chuyên môn
            </h3>
            <span className="text-xs text-slate-500">Đã xác thực & cố định</span>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            TIÊU ĐỀ VỊ TRÍ / CHUYÊN MÔN
          </label>
          <div className="text-base font-bold text-slate-900">
            {headline || 'Chưa cập nhật'}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            MÔ TẢ KINH NGHIỆM CHUYÊN MÔN
          </label>
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100">
            {expertiseDescription || 'Chưa cập nhật'}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="flex items-center gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <Phone className="w-4 h-4 text-slate-500 shrink-0" />
            <div className="min-w-0">
              <span className="text-[11px] text-slate-500 block">Số điện thoại</span>
              <strong className="text-xs font-bold text-slate-900 truncate block">
                {phoneNumber || 'Chưa cung cấp'}
              </strong>
            </div>
          </div>

          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors"
            >
              <GitBranch className="w-4 h-4 text-slate-600 shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] text-slate-500 block">GitHub</span>
                <strong className="text-xs font-bold text-blue-600 flex items-center gap-1 truncate">
                  {githubUrl.replace('https://', '')} <ExternalLink className="w-3 h-3" />
                </strong>
              </div>
            </a>
          )}

          {portfolioUrl && (
            <a
              href={portfolioUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors"
            >
              <Globe className="w-4 h-4 text-sky-600 shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] text-slate-500 block">Portfolio</span>
                <strong className="text-xs font-bold text-sky-600 flex items-center gap-1 truncate">
                  {portfolioUrl.replace('https://', '')} <ExternalLink className="w-3 h-3" />
                </strong>
              </div>
            </a>
          )}
        </div>
      </section>

      {/* CARD 2: MÔN HỌC CHUYÊN MÔN */}
      <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 m-0">
              2. Môn học nhận hướng dẫn ({subjectResults.length})
            </h3>
            <span className="text-xs text-slate-500">
              Danh mục môn học và điểm số đã duyệt
            </span>
          </div>
        </div>

        {subjectResults.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa đăng ký môn học hướng dẫn nào.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {subjectResults.map((sub, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-sky-600 bg-sky-100 px-2 py-0.5 rounded-md inline-block mb-1">
                    {sub.subjectCode}
                  </span>
                  <div className="text-xs font-semibold text-slate-800 truncate">
                    {sub.subjectName}
                  </div>
                </div>
                <div className="text-sm font-extrabold text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-lg shrink-0">
                  {sub.scoreValue}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CARD 3: CẤP ĐỘ NĂNG LỰC HỖ TRỢ */}
      <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 m-0">
              3. Cấp độ năng lực hỗ trợ (Thang 1 - 5)
            </h3>
            <span className="text-xs text-slate-500">
              Đánh giá khả năng đồng hành cùng Mentee
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-500 block mb-1">Kiến thức căn bản</span>
            <div className="text-lg font-extrabold text-purple-600">
              Mức {foundationSupportLevel || '-'} / 5
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-500 block mb-1">Review Đồ án / Code</span>
            <div className="text-lg font-extrabold text-blue-600">
              Mức {outputReviewSupportLevel || '-'} / 5
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-500 block mb-1">Định hướng phát triển</span>
            <div className="text-lg font-extrabold text-emerald-600">
              Mức {directionSupportLevel || '-'} / 5
            </div>
          </div>
        </div>
      </section>

      {/* CARD 4: CẤU HÌNH ĐẶT LỊCH BOOKING */}
      <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 m-0">
              4. Cấu hình thời gian booking
            </h3>
            <span className="text-xs text-slate-500">
              Quy định nhận lịch tư vấn từ Mentee
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-500 block mb-1">Trạng thái nhận lịch</span>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-lg ${
                isAvailable ? 'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isAvailable ? 'Sẵn sàng nhận lịch' : 'Tạm ngưng'}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-500 block mb-1">Báo trước tối thiểu</span>
            <strong className="text-base font-bold text-slate-900">
              {minimumBookingLeadTimeMinutes
                ? `${minimumBookingLeadTimeMinutes} phút`
                : 'Chưa thiết lập'}
            </strong>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-500 block mb-1">Hạn mở lịch tối đa</span>
            <strong className="text-base font-bold text-slate-900">
              {maximumBookingHorizonDays ? `${maximumBookingHorizonDays} ngày` : 'Chưa thiết lập'}
            </strong>
          </div>
        </div>
      </section>

      {/* CARD 5: MINH CHỨNG ĐÃ ĐƯỢC PHÊ DUYỆT */}
      <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 m-0">
              5. Tài liệu minh chứng đã xác thực
            </h3>
            <span className="text-xs text-slate-500">
              Đã qua quy trình kiểm duyệt chính thức
            </span>
          </div>
        </div>

        <div className="space-y-2.5">
          {/* FPTU Proof */}
          {existingFptuDoc && (
            <div className="p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/70 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <GraduationCap className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <strong className="text-sm font-bold text-emerald-800 truncate block">
                    {existingFptuDoc.originalFilename || 'Minh chứng Sinh viên / Cựu SV FPTU'}
                  </strong>
                  <span className="text-xs text-emerald-600">Tư cách FPTU • Đã phê duyệt</span>
                </div>
              </div>
              {existingFptuDoc.fileUrl && (
                <a
                  href={existingFptuDoc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 shrink-0"
                >
                  Xem file <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}

          {/* Expertise Proofs */}
          {existingExpertiseDocs.map((doc, idx) => (
            <div
              key={doc.id || idx}
              className="p-4 rounded-xl border border-purple-200/80 bg-purple-50/70 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Award className="w-5 h-5 text-purple-600 shrink-0" />
                <div className="min-w-0">
                  <strong className="text-sm font-bold text-purple-900 truncate block">
                    {doc.originalFilename || `Chứng chỉ chuyên môn #${idx + 1}`}
                  </strong>
                  <span className="text-xs text-purple-600">
                    Chứng minh năng lực chuyên môn • Đã phê duyệt
                  </span>
                </div>
              </div>
              {doc.fileUrl && (
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1 shrink-0"
                >
                  Xem file <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
