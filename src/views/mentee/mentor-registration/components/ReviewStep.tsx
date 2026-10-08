/**
 * @file ReviewStep.tsx
 * @description Bước 5 – Xem lại toàn bộ thông tin hồ sơ Mentor đã điền trước khi nộp.
 */

'use client';

import type { ReactNode } from 'react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import {
  AlertCircle,
  Award,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileCheck,
  FolderGit2,
  GraduationCap,
  Pencil,
  UserRound,
} from 'lucide-react';
import type { VerificationDocumentResponse } from '@/models/auth';
import type { MentorProfileFormValues } from '@/models/schemas/mentorProfileSchema';
import { MENTOR_REVIEW_DURATION } from '../mentorRegistration.constants';
import { EvidencePreview } from './EvidencePreview';
import { browsableUrl } from '@/utils/url';

type ReviewValues = Partial<MentorProfileFormValues>;

type ReviewStepProps = {
  values: ReviewValues;
  completed: number;
  total: number;
  register: UseFormRegister<MentorProfileFormValues>;
  errors: FieldErrors<MentorProfileFormValues>;
  selectedFptuFile: File | null;
  selectedExpertiseFiles: File[];
  documents: VerificationDocumentResponse[];
  onEdit: (step: number) => void;
  onTerms: () => void;
};

const SUPPORT_LEVELS: { key: keyof ReviewValues; label: string }[] = [
  { key: 'foundationSupportLevel', label: 'Kiến thức căn bản' },
  { key: 'outputReviewSupportLevel', label: 'Review đồ án / code' },
  { key: 'directionSupportLevel', label: 'Định hướng phát triển' },
];

function formatLeadTime(minutes?: number) {
  if (!minutes) return undefined;
  if (minutes % 60 === 0) return `${minutes / 60} giờ`;
  if (minutes > 60) return `${Math.floor(minutes / 60)} giờ ${minutes % 60} phút`;
  return `${minutes} phút`;
}

function formatSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ReviewStep({
  values,
  completed,
  total,
  register,
  errors,
  selectedFptuFile,
  selectedExpertiseFiles,
  documents,
  onEdit,
  onTerms,
}: ReviewStepProps) {
  const subjects = values.subjectResults ?? [];
  const projects = values.projects ?? [];
  const achievements = values.achievements ?? [];
  const activeDocs = documents.filter((doc) => doc.isActive !== false);
  const existingFptu = activeDocs.filter((doc) => doc.documentType === 'FPTU_AFFILIATION_PROOF');
  const existingExpertise = activeDocs.filter((doc) => doc.documentType === 'EXPERTISE_PROOF');

  // A newly selected file replaces the stored FPTU proof; new expertise files are added on submit.
  const fptuItems: EvidenceItem[] = selectedFptuFile
    ? [{ key: 'fptu-new', name: selectedFptuFile.name, file: selectedFptuFile, isNew: true }]
    : existingFptu.map(toEvidenceItem);
  const expertiseItems: EvidenceItem[] =
    selectedExpertiseFiles.length > 0
      ? selectedExpertiseFiles.map((file, index) => ({
          key: `exp-new-${index}`,
          name: file.name,
          file,
          isNew: true,
        }))
      : existingExpertise.map(toEvidenceItem);

  const basicComplete = Boolean(
    values.headline && values.expertiseDescription && values.phoneNumber,
  );
  const experienceComplete = SUPPORT_LEVELS.every(({ key }) => Boolean(values[key]));
  const bookingComplete = Boolean(
    values.minimumBookingLeadTimeMinutes && values.maximumBookingHorizonDays,
  );
  const evidenceComplete = fptuItems.length > 0 && expertiseItems.length > 0;
  const isReady = completed === total;

  return (
    <div className="space-y-4">
      <ReviewSection
        step={1}
        icon={<UserRound />}
        title="Thông tin cơ bản"
        complete={basicComplete}
        onEdit={onEdit}
      >
        <dl className="m-0 grid gap-4 sm:grid-cols-2">
          <Field label="Tiêu đề / chuyên môn" className="sm:col-span-2">
            <Value text={values.headline} required />
          </Field>
          <Field label="Giới thiệu ngắn về bản thân" className="sm:col-span-2">
            {values.expertiseDescription ? (
              <p className="m-0 whitespace-pre-line rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm leading-6 text-slate-800">
                {values.expertiseDescription}
              </p>
            ) : (
              <Value required />
            )}
          </Field>
          <Field label="Số điện thoại liên hệ">
            <Value text={values.phoneNumber} required />
          </Field>
          <Field label="GitHub">
            <LinkValue url={values.githubUrl} />
          </Field>
          <Field label="Portfolio">
            <LinkValue url={values.portfolioUrl} />
          </Field>
        </dl>
      </ReviewSection>

      <ReviewSection
        step={2}
        icon={<GraduationCap />}
        title="Kinh nghiệm & thế mạnh"
        complete={experienceComplete}
        onEdit={onEdit}
      >
        <div className="space-y-5">
          <SubBlock title="Mức độ hỗ trợ">
            <div className="grid gap-3 sm:grid-cols-3">
              {SUPPORT_LEVELS.map(({ key, label }) => (
                <LevelMeter key={key} label={label} level={Number(values[key]) || 0} />
              ))}
            </div>
          </SubBlock>

          <SubBlock title={`Môn học đã qua (${subjects.length})`}>
            {subjects.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[360px] border-collapse text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                    <tr>
                      <th className="px-3 py-2">Mã môn</th>
                      <th className="px-3 py-2">Tên môn</th>
                      <th className="px-3 py-2 text-right">Điểm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((subject, index) => (
                      <tr
                        key={`${subject.subjectCode}-${index}`}
                        className="border-t border-slate-100"
                      >
                        <td className="px-3 py-2 font-bold text-slate-900">
                          {subject.subjectCode}
                        </td>
                        <td className="px-3 py-2 text-slate-700">{subject.subjectName}</td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-900">
                          {subject.scoreValue ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty text="Chưa thêm môn học nào." />
            )}
          </SubBlock>

          <SubBlock title={`Dự án nổi bật (${projects.length})`}>
            {projects.length > 0 ? (
              <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
                {projects.map((project, index) => (
                  <li
                    key={project.id || index}
                    className="rounded-xl border border-slate-200 p-3 text-sm"
                  >
                    <div className="flex items-start gap-2">
                      <FolderGit2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                      <strong className="text-slate-900">{project.title}</strong>
                    </div>
                    {project.content && (
                      <p className="mb-0 mt-1.5 text-slate-700">{project.content}</p>
                    )}
                    {project.projectDescription && (
                      <p className="mb-0 mt-1 text-xs leading-5 text-slate-500">
                        {project.projectDescription}
                      </p>
                    )}
                    {project.liveDemoUrl && (
                      <div className="mt-2">
                        <LinkValue url={project.liveDemoUrl} label="Xem demo" />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <Empty text="Chưa thêm dự án nào (không bắt buộc)." />
            )}
          </SubBlock>

          <SubBlock title={`Thành tích (${achievements.length})`}>
            {achievements.length > 0 ? (
              <ul className="m-0 grid list-none gap-3 p-0">
                {achievements.map((achievement, index) => (
                  <li
                    key={achievement.id || index}
                    className="rounded-xl border border-slate-200 p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <span className="flex items-start gap-2">
                        <Award className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                        <strong className="text-slate-900">{achievement.title}</strong>
                      </span>
                      {achievement.achievedAt && (
                        <span className="text-xs font-semibold text-slate-500">
                          {achievement.achievedAt}
                        </span>
                      )}
                    </div>
                    {achievement.awardDescription && (
                      <p className="mb-0 mt-1.5 text-slate-700">{achievement.awardDescription}</p>
                    )}
                    {achievement.productHeader && (
                      <p className="mb-0 mt-2 text-xs font-semibold text-slate-800">
                        {achievement.productHeader}
                      </p>
                    )}
                    {achievement.productDescription && (
                      <p className="mb-0 mt-0.5 text-xs leading-5 text-slate-500">
                        {achievement.productDescription}
                      </p>
                    )}
                    {achievement.demoUrl && (
                      <div className="mt-2">
                        <LinkValue url={achievement.demoUrl} label="Xem chứng nhận" />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <Empty text="Chưa thêm thành tích nào (không bắt buộc)." />
            )}
          </SubBlock>
        </div>
      </ReviewSection>

      <ReviewSection
        step={3}
        icon={<CalendarClock />}
        title="Thời gian tư vấn"
        complete={bookingComplete}
        onEdit={onEdit}
      >
        <dl className="m-0 grid gap-4 sm:grid-cols-3">
          <Field label="Trạng thái nhận lịch">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                values.isAvailable
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${values.isAvailable ? 'bg-emerald-500' : 'bg-slate-400'}`}
                aria-hidden="true"
              />
              {values.isAvailable ? 'Sẵn sàng nhận lịch' : 'Chưa sẵn sàng'}
            </span>
          </Field>
          <Field label="Báo trước tối thiểu">
            <Value text={formatLeadTime(values.minimumBookingLeadTimeMinutes)} required />
          </Field>
          <Field label="Mở lịch tối đa">
            <Value
              text={
                values.maximumBookingHorizonDays
                  ? `${values.maximumBookingHorizonDays} ngày tới`
                  : undefined
              }
              required
            />
          </Field>
        </dl>
      </ReviewSection>

      <ReviewSection
        step={4}
        icon={<FileCheck />}
        title="Minh chứng"
        complete={evidenceComplete}
        onEdit={onEdit}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <SubBlock title="Minh chứng sinh viên / cựu sinh viên FPTU">
            <EvidenceList items={fptuItems} emptyText="Chưa tải lên minh chứng FPTU." />
          </SubBlock>
          <SubBlock title={`Chứng chỉ chuyên môn (${expertiseItems.length}/3)`}>
            <EvidenceList items={expertiseItems} emptyText="Chưa tải lên chứng chỉ chuyên môn." />
          </SubBlock>
        </div>
      </ReviewSection>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="flex cursor-pointer items-start gap-3 text-sm font-semibold text-slate-900">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-sky-600"
            {...register('agreeTerms')}
          />
          <span>
            Tôi đồng ý với{' '}
            <button
              type="button"
              onClick={onTerms}
              className="border-0 bg-transparent p-0 font-bold text-sky-600 underline"
            >
              Điều khoản vận hành
            </button>{' '}
            của SkillSwap <span className="text-red-600">*</span>
          </span>
        </label>
        {errors.agreeTerms && (
          <p role="alert" className="text-xs font-semibold text-red-600">
            {errors.agreeTerms.message}
          </p>
        )}
        <ul className="mb-0 mt-3 space-y-1 pl-7 text-xs leading-5 text-slate-600">
          <li>Tôi cam kết các thông tin và minh chứng cung cấp là chính xác.</li>
          <li>Tôi hiểu rằng hồ sơ sẽ được đội ngũ SkillSwap xét duyệt.</li>
          <li>Tôi đồng ý với chính sách bảo mật thông tin.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-sky-200 bg-sky-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <Clock3 className="h-6 w-6 shrink-0 text-sky-600" />
          <div>
            <strong className="text-sm text-sky-950">Thời gian xét duyệt dự kiến</strong>
            <p className="mb-0 mt-1 text-xs leading-5 text-sky-800">
              Hồ sơ sẽ được xét duyệt trong {MENTOR_REVIEW_DURATION}. Bạn sẽ nhận thông báo qua
              email và trong ứng dụng khi có kết quả.
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 text-xs font-bold ${isReady ? 'text-emerald-700' : 'text-amber-700'}`}
        >
          <Check className="mr-1 inline h-4 w-4" />
          Đã hoàn thành {completed}/{total} mục bắt buộc
        </span>
      </section>
    </div>
  );
}

function ReviewSection({
  step,
  icon,
  title,
  complete,
  onEdit,
  children,
}: {
  step: number;
  icon: ReactNode;
  title: string;
  complete: boolean;
  onEdit: (step: number) => void;
  children: ReactNode;
}) {
  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      aria-labelledby={`review-step-${step}`}
    >
      <header className="mb-4 flex flex-wrap items-center gap-3 border-b border-slate-100 pb-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600 [&>svg]:h-4.5 [&>svg]:w-4.5">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Bước {step}
          </span>
          <h3 id={`review-step-${step}`} className="m-0 text-base font-bold text-slate-900">
            {title}
          </h3>
        </div>
        {complete ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Đầy đủ
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
            <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" /> Còn thiếu
          </span>
        )}
        <button
          type="button"
          onClick={() => onEdit(step)}
          aria-label={`Sửa ${title}`}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-sky-700 transition-colors hover:border-sky-300 hover:bg-sky-50"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Sửa
        </button>
      </header>
      {children}
    </section>
  );
}

function Field({
  label,
  className = '',
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="m-0 mt-1 text-sm text-slate-900">{children}</dd>
    </div>
  );
}

function SubBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 mt-0 text-sm font-semibold text-slate-700">{title}</h4>
      {children}
    </div>
  );
}

function Value({ text, required = false }: { text?: string | number; required?: boolean }) {
  if (text !== undefined && text !== '') {
    return <span className="break-words font-semibold">{text}</span>;
  }
  return required ? (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700">
      <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" /> Chưa điền
    </span>
  ) : (
    <span className="text-sm text-slate-400">Chưa cung cấp</span>
  );
}

function LinkValue({ url, label }: { url?: string; label?: string }) {
  if (!url) return <Value />;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex max-w-full items-center gap-1 break-all text-sm font-semibold text-sky-700 hover:underline"
    >
      <span className="truncate">{label ?? url}</span>
      <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
    </a>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="m-0 rounded-xl border border-dashed border-slate-200 px-3 py-2.5 text-sm text-slate-500">
      {text}
    </p>
  );
}

function LevelMeter({ label, level }: { label: string; level: number }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-600">{label}</span>
        <span className={`text-xs font-bold ${level ? 'text-sky-700' : 'text-amber-700'}`}>
          {level ? `Mức ${level}/5` : 'Chưa chọn'}
        </span>
      </div>
      <div className="mt-2 flex gap-1" role="img" aria-label={`${label}: mức ${level} trên 5`}>
        {[1, 2, 3, 4, 5].map((step) => (
          <span
            key={step}
            className={`h-1.5 flex-1 rounded-full ${step <= level ? 'bg-sky-500' : 'bg-slate-200'}`}
          />
        ))}
      </div>
    </div>
  );
}

type EvidenceItem = {
  key: string;
  name: string;
  file?: File;
  url?: string;
  contentType?: string;
  sizeBytes?: number;
  isNew: boolean;
};

function toEvidenceItem(doc: VerificationDocumentResponse, index: number): EvidenceItem {
  return {
    key: doc.id || `doc-${index}`,
    name: doc.originalFilename || `Tài liệu #${index + 1}`,
    url: browsableUrl(doc.fileUrl),
    contentType: doc.contentType,
    sizeBytes: doc.sizeBytes,
    isNew: false,
  };
}

function EvidenceList({ items, emptyText }: { items: EvidenceItem[]; emptyText: string }) {
  if (items.length === 0) {
    return (
      <p className="m-0 flex items-center gap-1.5 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-3 py-2.5 text-sm font-semibold text-amber-700">
        <AlertCircle className="h-4 w-4" aria-hidden="true" /> {emptyText}
      </p>
    );
  }
  return (
    <ul className="m-0 list-none space-y-2 p-0">
      {items.map((item) => (
        <li
          key={item.key}
          className="flex items-center gap-3 rounded-xl border border-slate-200 p-2"
        >
          <EvidencePreview
            variant="thumb"
            file={item.file}
            url={item.url}
            contentType={item.contentType}
            name={item.name}
          />
          <div className="min-w-0">
            <p className="m-0 truncate text-sm font-semibold text-slate-900" title={item.name}>
              {item.name}
            </p>
            <p className="m-0 mt-0.5 text-xs text-slate-500">
              {[
                formatSize(item.file?.size ?? item.sizeBytes),
                item.isNew ? 'Sẽ tải lên khi nộp' : 'Đã tải lên',
              ]
                .filter(Boolean)
                .join(' • ')}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
