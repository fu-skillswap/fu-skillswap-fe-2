"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { ApiClientError } from "@/models/apiClient";
import type { AcademicProgramResponse, CampusResponse, SpecializationResponse } from "@/models/auth";
import { useAuth } from "@/providers/AuthProvider";
import { studentProfileService } from "@/services/studentProfileService";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

type FormValues = { studentCode: string; displayName: string; campusId: string; programId: string; specializationId: string; semester: string; intakeYear: string; isAlumni: boolean; graduationYear: string; bio: string; };

export function StudentOnboardingView({ locale }: { locale: string }) {
  const { user } = useAuth(); const router = useRouter();
  const [isCreating, setIsCreating] = useState(false); const [isLoadingCatalog, setIsLoadingCatalog] = useState(false); const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>(); const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [campuses, setCampuses] = useState<CampusResponse[]>([]); const [programs, setPrograms] = useState<AcademicProgramResponse[]>([]); const [specializations, setSpecializations] = useState<SpecializationResponse[]>([]);
  const [form, setForm] = useState<FormValues>({ studentCode: "", displayName: user?.fullName ?? "", campusId: "", programId: "", specializationId: "", semester: "1", intakeYear: String(new Date().getFullYear()), isAlumni: false, graduationYear: "", bio: "" });

  useEffect(() => { if (user?.fullName) setForm((current) => current.displayName ? current : { ...current, displayName: user.fullName }); }, [user?.fullName]);
  const update = <K extends keyof FormValues>(key: K, value: FormValues[K]) => setForm((current) => ({ ...current, [key]: value }));

  const openCreateForm = async () => {
    setIsCreating(true); setError(undefined); if (campuses.length || programs.length) return;
    setIsLoadingCatalog(true);
    try { const [campusData, programData] = await Promise.all([studentProfileService.getCampuses(), studentProfileService.getPrograms()]); setCampuses(campusData); setPrograms(programData); }
    catch (reason) { setError(reason instanceof ApiClientError ? reason.message : "Không thể tải danh mục học thuật. Vui lòng thử lại."); }
    finally { setIsLoadingCatalog(false); }
  };

  const selectProgram = async (programId: string) => {
    update("programId", programId); update("specializationId", ""); setSpecializations([]); setError(undefined); if (!programId) return;
    try { setSpecializations(await studentProfileService.getSpecializations(programId)); }
    catch (reason) { setError(reason instanceof ApiClientError ? reason.message : "Không thể tải danh sách chuyên ngành."); }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(undefined); setFieldErrors({});
    const missing = ["studentCode", "campusId", "programId", "specializationId"].filter((key) => !form[key as keyof FormValues]);
    if (missing.length) { setError("Vui lòng điền đầy đủ các trường bắt buộc."); return; }
    if (form.isAlumni && !form.graduationYear) { setFieldErrors({ graduationYear: "Vui lòng nhập năm tốt nghiệp." }); return; }
    setIsSubmitting(true);
    try {
      await studentProfileService.save({ studentCode: form.studentCode.trim(), displayName: form.displayName.trim() || undefined, campusId: form.campusId, programId: form.programId, specializationId: form.specializationId, semester: Number(form.semester), intakeYear: Number(form.intakeYear), isAlumni: form.isAlumni, graduationYear: form.isAlumni ? Number(form.graduationYear) : undefined, bio: form.bio.trim() || undefined });
      router.replace(`/${locale}/dashboard`);
    } catch (reason) {
      if (reason instanceof ApiClientError) { setFieldErrors(Object.fromEntries((reason.data ?? []).filter((item) => item.field).map((item) => [item.field as string, item.message]))); setError(reason.message); }
      else setError("Không thể lưu hồ sơ. Vui lòng thử lại.");
    } finally { setIsSubmitting(false); }
  };

  return <AuthGuard locale={locale}><main className="figma-onboarding-page"><section className="figma-onboarding-card" aria-labelledby="onboarding-title">
    <span className="figma-onboarding-icon" aria-hidden="true">✓</span><p className="figma-onboarding-eyebrow">ĐĂNG NHẬP THÀNH CÔNG</p><h1 id="onboarding-title">Chào {user?.fullName || "bạn"}!</h1>
    {!isCreating ? <><p>Tài khoản Google của bạn đã được xác thực, nhưng hồ sơ sinh viên chưa hoàn tất. Hãy tạo hồ sơ để tiếp tục sử dụng nền tảng.</p><button className="figma-onboarding-action" type="button" onClick={() => { void openCreateForm(); }}>Tạo hồ sơ</button></> : <form className="figma-profile-form" onSubmit={submit} noValidate>
      <p>Điền thông tin sinh viên để hoàn tất hồ sơ Mentee.</p>{error && <p className="figma-profile-error" role="alert">{error}</p>}
      {isLoadingCatalog ? <p>Đang tải danh mục học thuật...</p> : <><label>Mã số sinh viên<input value={form.studentCode} onChange={(event) => update("studentCode", event.target.value)} placeholder="SE192621" required />{fieldErrors.studentCode && <small>{fieldErrors.studentCode}</small>}</label><label>Tên hiển thị<input value={form.displayName} onChange={(event) => update("displayName", event.target.value)} placeholder="Nguyễn Văn A" /></label>
      <div className="figma-profile-grid"><label>Cơ sở<select value={form.campusId} onChange={(event) => update("campusId", event.target.value)} required><option value="">Chọn cơ sở</option>{campuses.map((campus) => <option key={campus.id} value={campus.id}>{campus.name} — {campus.city}</option>)}</select>{fieldErrors.campusId && <small>{fieldErrors.campusId}</small>}</label><label>Ngành học<select value={form.programId} onChange={(event) => { void selectProgram(event.target.value); }} required><option value="">Chọn ngành</option>{programs.map((program) => <option key={program.id} value={program.id}>{program.code} — {program.nameVi}</option>)}</select>{fieldErrors.programId && <small>{fieldErrors.programId}</small>}</label></div>
      <label>Chuyên ngành<select value={form.specializationId} onChange={(event) => update("specializationId", event.target.value)} disabled={!form.programId} required><option value="">{form.programId ? "Chọn chuyên ngành" : "Chọn ngành trước"}</option>{specializations.map((specialization) => <option key={specialization.id} value={specialization.id}>{specialization.code} — {specialization.nameVi}</option>)}</select>{fieldErrors.specializationId && <small>{fieldErrors.specializationId}</small>}</label>
      <div className="figma-profile-grid"><label>Học kỳ<select value={form.semester} onChange={(event) => update("semester", event.target.value)}>{Array.from({ length: 10 }, (_, value) => <option key={value} value={value}>{value === 0 ? "0 — Tiếng Anh dự bị" : `Học kỳ ${value}`}</option>)}</select></label><label>Năm nhập học<input type="number" min="2000" max={new Date().getFullYear()} value={form.intakeYear} onChange={(event) => update("intakeYear", event.target.value)} required /></label></div>
      <label className="figma-profile-check"><input type="checkbox" checked={form.isAlumni} onChange={(event) => update("isAlumni", event.target.checked)} /> Tôi đã tốt nghiệp</label>{form.isAlumni && <label>Năm tốt nghiệp<input type="number" min={Number(form.intakeYear) + 2} value={form.graduationYear} onChange={(event) => update("graduationYear", event.target.value)} required />{fieldErrors.graduationYear && <small>{fieldErrors.graduationYear}</small>}</label>}
      <label>Giới thiệu bản thân <em>(không bắt buộc)</em><textarea value={form.bio} onChange={(event) => update("bio", event.target.value)} rows={3} placeholder="Kỹ năng và mục tiêu học tập của bạn" /></label><button className="figma-onboarding-action" type="submit" disabled={isSubmitting}>{isSubmitting ? "Đang lưu hồ sơ..." : "Hoàn tất hồ sơ"}</button></>}</form>}
  </section></main></AuthGuard>;
}
