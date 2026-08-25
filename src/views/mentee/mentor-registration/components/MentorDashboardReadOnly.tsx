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
    <div style={{ display: 'grid', gap: '20px' }}>
      {/* CARD 1: THÔNG TIN CƠ BẢN & LIÊN HỆ */}
      <section
        className="card"
        style={{
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          background: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'grid',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <User size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              1. Thông tin vị trí & Chuyên môn
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Đã xác thực & cố định</span>
          </div>
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
            TIÊU ĐỀ VỊ TRÍ / CHUYÊN MÔN
          </label>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
            {headline || 'Chưa cập nhật'}
          </div>
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
            MÔ TẢ KINH NGHIỆM CHUYÊN MÔN
          </label>
          <div
            style={{
              fontSize: '14px',
              color: '#334155',
              lineHeight: '1.6',
              whiteSpace: 'pre-line',
              background: '#f8fafc',
              padding: '12px 16px',
              borderRadius: '10px',
              border: '1px solid #f1f5f9',
            }}
          >
            {expertiseDescription || 'Chưa cập nhật'}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '10px 14px', borderRadius: '10px' }}>
            <Phone size={16} color="#64748b" />
            <div>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Số điện thoại</span>
              <strong style={{ fontSize: '13px', color: '#0f172a' }}>{phoneNumber || 'Chưa cung cấp'}</strong>
            </div>
          </div>

          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: '#f8fafc',
                padding: '10px 14px',
                borderRadius: '10px',
                textDecoration: 'none',
                color: '#0f172a',
              }}
            >
              <GitBranch size={16} color="#334155" />
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>GitHub</span>
                <strong style={{ fontSize: '13px', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {githubUrl.replace('https://', '')} <ExternalLink size={12} />
                </strong>
              </div>
            </a>
          )}

          {portfolioUrl && (
            <a
              href={portfolioUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: '#f8fafc',
                padding: '10px 14px',
                borderRadius: '10px',
                textDecoration: 'none',
                color: '#0f172a',
              }}
            >
              <Globe size={16} color="#0284c7" />
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Portfolio</span>
                <strong style={{ fontSize: '13px', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {portfolioUrl.replace('https://', '')} <ExternalLink size={12} />
                </strong>
              </div>
            </a>
          )}
        </div>
      </section>

      {/* CARD 2: MÔN HỌC CHUYÊN MÔN */}
      <section
        className="card"
        style={{
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          background: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'grid',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#f0fdf4',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BookOpen size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              2. Môn học nhận hướng dẫn ({subjectResults.length})
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Danh mục môn học và điểm số đã duyệt</span>
          </div>
        </div>

        {subjectResults.length === 0 ? (
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Chưa đăng ký môn học hướng dẫn nào.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
            {subjectResults.map((sub, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#0284c7',
                      background: '#e0f2fe',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      display: 'inline-block',
                      marginBottom: '4px',
                    }}
                  >
                    {sub.subjectCode}
                  </span>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{sub.subjectName}</div>
                </div>
                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: 800,
                    color: '#16a34a',
                    background: '#dcfce7',
                    padding: '4px 10px',
                    borderRadius: '8px',
                  }}
                >
                  {sub.scoreValue}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CARD 3: CẤP ĐỘ NĂNG LỰC HỖ TRỢ */}
      <section
        className="card"
        style={{
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          background: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'grid',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#faf5ff',
              color: '#8b5cf6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sliders size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              3. Cấp độ năng lực hỗ trợ (Thang 1 - 5)
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Đánh giá khả năng đồng hành cùng Mentee</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
              Kiến thức căn bản
            </span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#7c3aed' }}>
              Mức {foundationSupportLevel || '-'} / 5
            </div>
          </div>

          <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
              Review Đồ án / Code
            </span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#2563eb' }}>
              Mức {outputReviewSupportLevel || '-'} / 5
            </div>
          </div>

          <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
              Định hướng phát triển
            </span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#059669' }}>
              Mức {directionSupportLevel || '-'} / 5
            </div>
          </div>
        </div>
      </section>

      {/* CARD 4: CẤU HÌNH ĐẶT LỊCH BOOKING */}
      <section
        className="card"
        style={{
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          background: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'grid',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#fff7ed',
              color: '#ea580c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Calendar size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              4. Cấu hình thời gian booking
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Quy định nhận lịch tư vấn từ Mentee</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
              Trạng thái nhận lịch
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 700,
                color: isAvailable ? '#15803d' : '#b91c1c',
                background: isAvailable ? '#dcfce7' : '#fee2e2',
                padding: '4px 12px',
                borderRadius: '8px',
              }}
            >
              <CheckCircle2 size={14} />
              {isAvailable ? 'Sẵn sàng nhận lịch tư vấn' : 'Tạm ngưng nhận lịch'}
            </span>
          </div>

          <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
              Báo trước tối thiểu
            </span>
            <strong style={{ fontSize: '15px', color: '#0f172a' }}>
              {minimumBookingLeadTimeMinutes ? `${minimumBookingLeadTimeMinutes} phút` : 'Chưa thiết lập'}
            </strong>
          </div>

          <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
              Hạn mở lịch tối đa
            </span>
            <strong style={{ fontSize: '15px', color: '#0f172a' }}>
              {maximumBookingHorizonDays ? `${maximumBookingHorizonDays} ngày` : 'Chưa thiết lập'}
            </strong>
          </div>
        </div>
      </section>

      {/* CARD 5: MINH CHỨNG ĐÃ ĐƯỢC PHÊ DUYỆT */}
      <section
        className="card"
        style={{
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          background: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'grid',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#f0fdf4',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileCheck size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              5. Tài liệu minh chứng đã xác thực
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Đã qua quy trình kiểm duyệt chính thức</span>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '10px' }}>
          {/* FPTU Proof */}
          {existingFptuDoc && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid #bbf7d0',
                background: '#f0fdf4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <GraduationCap size={20} color="#16a34a" />
                <div>
                  <strong style={{ fontSize: '13px', color: '#15803d', display: 'block' }}>
                    {existingFptuDoc.originalFilename || 'Minh chứng Sinh viên / Cựu SV FPTU'}
                  </strong>
                  <span style={{ fontSize: '12px', color: '#166534' }}>
                    Tư cách FPTU • Đã phê duyệt
                  </span>
                </div>
              </div>
              {existingFptuDoc.fileUrl && (
                <a
                  href={existingFptuDoc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#16a34a',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  Xem file <ExternalLink size={14} />
                </a>
              )}
            </div>
          )}

          {/* Expertise Proofs */}
          {existingExpertiseDocs.map((doc, idx) => (
            <div
              key={doc.id || idx}
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid #ddd6fe',
                background: '#faf5ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Award size={20} color="#7c3aed" />
                <div>
                  <strong style={{ fontSize: '13px', color: '#6d28d9', display: 'block' }}>
                    {doc.originalFilename || `Chứng chỉ chuyên môn #${idx + 1}`}
                  </strong>
                  <span style={{ fontSize: '12px', color: '#5b21b6' }}>
                    Chứng minh năng lực chuyên môn • Đã phê duyệt
                  </span>
                </div>
              </div>
              {doc.fileUrl && (
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#7c3aed',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  Xem file <ExternalLink size={14} />
                </a>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
