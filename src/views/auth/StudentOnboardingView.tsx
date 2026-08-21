/**
 * @file StudentOnboardingView.tsx
 * @description React Component màn hình Hoàn thiện Hồ sơ Sinh viên (Student Profile Onboarding View) sử dụng React Hook Form & Yup.
 * Cho phép sinh viên tạo hồ sơ ban đầu bằng cách chọn cơ sở (Campus), ngành học, chuyên ngành,
 * mã sinh viên và các thông tin học tập cần thiết để hoàn tất quy trình onboarding.
 */

'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { ApiClientError } from '@/models/apiClient';
import type {
  AcademicProgramResponse,
  CampusResponse,
  SpecializationResponse,
} from '@/models/auth';
import {
  studentOnboardingSchema,
  type StudentOnboardingFormValues,
} from "@/models/schemas/studentProfileSchema";
import { useAuth } from "@/providers/AuthProvider";
import { studentProfileRepo } from "@/repositories/studentProfileRepo";
import { yupResolver } from "@hookform/resolvers/yup";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

/**
 * Component hiển thị và xử lý form nhập Hồ sơ Sinh viên (Onboarding Step).
 * @param props.locale - Mã ngôn ngữ hiện tại của ứng dụng (ví dụ: "vi", "en")
 */
export function StudentOnboardingView({ locale }: { locale: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [campuses, setCampuses] = useState<CampusResponse[]>([]);
  const [programs, setPrograms] = useState<AcademicProgramResponse[]>([]);
  const [specializations, setSpecializations] = useState<SpecializationResponse[]>([]);

  const form = useForm<StudentOnboardingFormValues>({
    resolver: yupResolver(studentOnboardingSchema) as any,
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

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const isAlumni = watch('isAlumni');
  const selectedProgramId = watch('programId');

  useEffect(() => {
    if (user?.fullName) {
      setValue('displayName', user.fullName);
    }
  }, [user?.fullName, setValue]);

  const openCreateForm = async () => {
    setIsCreating(true);
    setError(undefined);
    if (campuses.length || programs.length) return;
    setIsLoadingCatalog(true);
    try {
      const [campusData, programData] = await Promise.all([
        studentProfileRepo.getCampuses(),
        studentProfileRepo.getPrograms(),
      ]);
      setCampuses(campusData);
      setPrograms(programData);
    } catch (reason) {
      setError(
        reason instanceof ApiClientError
          ? reason.message
          : 'Không thể tải danh mục học thuật. Vui lòng thử lại.',
      );
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  const selectProgram = async (programId: string) => {
    setValue('programId', programId);
    setValue('specializationId', '');
    setSpecializations([]);
    setError(undefined);
    if (!programId) return;
    try {
      const specs = await studentProfileRepo.getSpecializations(programId);
      setSpecializations(specs);
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
      if (reason instanceof ApiClientError) {
        setError(reason.message);
      } else setError('Không thể lưu hồ sơ. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard locale={locale}>
      <main className="figma-onboarding-page">
        <section className="figma-onboarding-card" aria-labelledby="onboarding-title">
          <span className="figma-onboarding-icon" aria-hidden="true">
            <CheckCircle2 />
          </span>
          <p className="figma-onboarding-eyebrow">ĐĂNG NHẬP THÀNH CÔNG</p>
          <h1 id="onboarding-title">Chào {user?.fullName || 'bạn'}!</h1>
          {!isCreating ? (
            <>
              <p>
                Tài khoản Google của bạn đã được xác thực, nhưng hồ sơ sinh viên chưa hoàn tất. Hãy
                tạo hồ sơ để tiếp tục sử dụng nền tảng.
              </p>
              <button
                className="figma-onboarding-action"
                type="button"
                onClick={() => {
                  void openCreateForm();
                }}
              >
                Tạo hồ sơ
              </button>
            </>
          ) : (
            <form className="figma-profile-form" onSubmit={handleSubmit(submit)} noValidate>
              <p>Điền thông tin sinh viên để hoàn tất hồ sơ Mentee.</p>
              {error && (
                <p className="figma-profile-error" role="alert">
                  {error}
                </p>
              )}
              {isLoadingCatalog ? (
                <p>Đang tải danh mục học thuật...</p>
              ) : (
                <>
                  <label>
                    Mã số sinh viên
                    <input placeholder="SE192621" {...register('studentCode')} />
                    {errors.studentCode && <small>{errors.studentCode.message}</small>}
                  </label>
                  <label>
                    Tên hiển thị
                    <input placeholder="Nguyễn Văn A" {...register('displayName')} />
                    {errors.displayName && <small>{errors.displayName.message}</small>}
                  </label>
                  <div className="figma-profile-grid">
                    <label>
                      Cơ sở
                      <select {...register('campusId')}>
                        <option value="">Chọn cơ sở</option>
                        {campuses.map((campus) => (
                          <option key={campus.id} value={campus.id}>
                            {campus.name} — {campus.city}
                          </option>
                        ))}
                      </select>
                      {errors.campusId && <small>{errors.campusId.message}</small>}
                    </label>
                    <label>
                      Ngành học
                      <select
                        {...register('programId', {
                          onChange: (e) => void selectProgram(e.target.value),
                        })}
                      >
                        <option value="">Chọn ngành</option>
                        {programs.map((program) => (
                          <option key={program.id} value={program.id}>
                            {program.code} — {program.nameVi}
                          </option>
                        ))}
                      </select>
                      {errors.programId && <small>{errors.programId.message}</small>}
                    </label>
                  </div>
                  <label>
                    Chuyên ngành
                    <select disabled={!selectedProgramId} {...register('specializationId')}>
                      <option value="">
                        {selectedProgramId ? 'Chọn chuyên ngành' : 'Chọn ngành trước'}
                      </option>
                      {specializations.map((specialization) => (
                        <option key={specialization.id} value={specialization.id}>
                          {specialization.code} — {specialization.nameVi}
                        </option>
                      ))}
                    </select>
                    {errors.specializationId && <small>{errors.specializationId.message}</small>}
                  </label>
                  <div className="figma-profile-grid">
                    <label>
                      Học kỳ
                      <select {...register('semester', { valueAsNumber: true })}>
                        {Array.from({ length: 10 }, (_, value) => (
                          <option key={value} value={value}>
                            {value === 0 ? '0 — Tiếng Anh dự bị' : `Học kỳ ${value}`}
                          </option>
                        ))}
                      </select>
                      {errors.semester && <small>{errors.semester.message}</small>}
                    </label>
                    <label>
                      Năm nhập học
                      <input
                        type="number"
                        min="2000"
                        max={new Date().getFullYear()}
                        {...register('intakeYear', { valueAsNumber: true })}
                      />
                      {errors.intakeYear && <small>{errors.intakeYear.message}</small>}
                    </label>
                  </div>
                  <label className="figma-profile-check">
                    <input type="checkbox" {...register('isAlumni')} /> Tôi đã tốt nghiệp
                  </label>
                  {isAlumni && (
                    <label>
                      Năm tốt nghiệp
                      <input
                        type="number"
                        min="2000"
                        {...register('graduationYear', { valueAsNumber: true })}
                      />
                      {errors.graduationYear && <small>{errors.graduationYear.message}</small>}
                    </label>
                  )}
                  <label>
                    Giới thiệu bản thân <em>(không bắt buộc)</em>
                    <textarea
                      rows={3}
                      placeholder="Kỹ năng và mục tiêu học tập của bạn"
                      {...register('bio')}
                    />
                    {errors.bio && <small>{errors.bio.message}</small>}
                  </label>
                  <button className="figma-onboarding-action" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Đang lưu hồ sơ...' : 'Hoàn tất hồ sơ'}
                  </button>
                </>
              )}
            </form>
          )}
        </section>
      </main>
    </AuthGuard>
  );
}
