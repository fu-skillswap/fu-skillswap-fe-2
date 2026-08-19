"use client";

import { ApiClientError } from "@/models/apiClient";
import type { StudentProfileRequest, StudentProfileResponse } from "@/models/auth";
import { studentProfileService } from "@/services/studentProfileService";
import { useMenteeShell } from "@/components/domain/mentee-shell/MenteeShell";
import { useEffect, useMemo, useState } from "react";

function initials(name: string) {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "SS";
}

function profileRequest(profile: StudentProfileResponse, values: { displayName: string; studentCode: string; bio: string }): StudentProfileRequest {
  return {
    studentCode: values.studentCode.trim(), displayName: values.displayName.trim() || undefined, bio: values.bio.trim() || undefined,
    avatarUrl: profile.avatarUrl || undefined, campusId: profile.campus.id, programId: profile.program.id,
    specializationId: profile.specialization.id, semester: profile.semester, intakeYear: profile.intakeYear,
    isAlumni: profile.alumni, graduationYear: profile.graduationYear || undefined,
  };
}

export function MyProfileView() {
  const { setHeaderTitle } = useMenteeShell();
  const [profile, setProfile] = useState<StudentProfileResponse>();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [values, setValues] = useState({ displayName: "", studentCode: "", bio: "" });

  useEffect(() => { setHeaderTitle("Hồ sơ của tôi"); return () => setHeaderTitle(undefined); }, [setHeaderTitle]);
  useEffect(() => {
    void (async () => {
      try {
        const data = await studentProfileService.get();
        setProfile(data); setValues({ displayName: data.displayName || "", studentCode: data.studentCode, bio: data.bio || "" });
      } catch (reason) {
        setError(reason instanceof ApiClientError && reason.status === 404 ? "Bạn chưa có hồ sơ học thuật. Vui lòng hoàn tất hồ sơ để tiếp tục." : "Không thể tải hồ sơ lúc này. Vui lòng thử lại.");
      } finally { setLoading(false); }
    })();
  }, []);

  const displayName = useMemo(() => profile?.displayName || profile?.email.split("@")[0] || "SkillSwap Member", [profile]);
  const update = (field: keyof typeof values, value: string) => setValues((current) => ({ ...current, [field]: value }));
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); if (!profile) return;
    setSaving(true); setError(undefined); setNotice(undefined);
    try {
      await studentProfileService.save(profileRequest(profile, values));
      const updated = await studentProfileService.get();
      setProfile(updated); setValues({ displayName: updated.displayName || "", studentCode: updated.studentCode, bio: updated.bio || "" });
      setEditing(false); setNotice("Hồ sơ của bạn đã được cập nhật.");
    } catch (reason) { setError(reason instanceof ApiClientError ? reason.message : "Không thể lưu thay đổi. Vui lòng thử lại."); }
    finally { setSaving(false); }
  };

  if (loading) return <section className="figma-my-profile-state" aria-live="polite">Đang tải hồ sơ của bạn…</section>;
  if (!profile) return <section className="figma-my-profile-state figma-my-profile-state-error" role="alert"><strong>Không thể hiển thị hồ sơ</strong><span>{error}</span></section>;

  return <section className="figma-my-profile">
    {notice && <div className="figma-my-profile-notice" role="status">✓ {notice}</div>}
    {error && <div className="figma-my-profile-error" role="alert">{error}</div>}
    <article className="figma-my-profile-card">
      <div className="figma-my-profile-cover" />
      <div className="figma-my-profile-content">
        <span className="figma-my-profile-avatar">{profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : initials(displayName)}</span>
        <button type="button" className="figma-my-profile-edit" onClick={() => { setEditing((current) => !current); setError(undefined); }}>{editing ? "Hủy chỉnh sửa" : "Chỉnh sửa hồ sơ"}</button>
        {!editing ? <>
          <h2>{displayName}</h2><div className="figma-my-profile-tags"><span>Mentee</span><em>{profile.email}</em></div>
          <p className="figma-my-profile-bio">{profile.bio || "Hãy thêm một vài dòng giới thiệu để các mentor hiểu hơn về mục tiêu học tập của bạn."}</p>
          <dl className="figma-my-profile-academic"><div><dt>Mã số sinh viên</dt><dd>{profile.studentCode}</dd></div><div><dt>Cơ sở</dt><dd>{profile.campus.name}</dd></div><div><dt>Ngành học</dt><dd>{profile.program.nameVi}</dd></div><div><dt>Chuyên ngành</dt><dd>{profile.specialization.nameVi}</dd></div><div><dt>Học kỳ</dt><dd>{profile.semester === 0 ? "Tiếng Anh dự bị" : `Học kỳ ${profile.semester}`}</dd></div><div><dt>Khóa nhập học</dt><dd>{profile.intakeYear}</dd></div></dl>
          {profile.alumni && <p className="figma-my-profile-alumni">Cựu sinh viên · Tốt nghiệp năm {profile.graduationYear}</p>}
        </> : <form className="figma-my-profile-form" onSubmit={save} noValidate>
          <label>Tên hiển thị<input value={values.displayName} onChange={(event) => update("displayName", event.target.value)} maxLength={150} /></label>
          <label>Mã số sinh viên<input value={values.studentCode} onChange={(event) => update("studentCode", event.target.value)} required /></label>
          <label>Giới thiệu bản thân<textarea value={values.bio} onChange={(event) => update("bio", event.target.value)} rows={4} placeholder="Mục tiêu học tập, kỹ năng và lĩnh vực bạn quan tâm…" /></label>
          <p>Thông tin học thuật được xác thực: {profile.campus.name} · {profile.program.nameVi} · {profile.specialization.nameVi}</p>
          <button type="submit" disabled={saving}>{saving ? "Đang lưu…" : "Lưu thay đổi"}</button>
        </form>}
      </div>
    </article>
    <section className="figma-my-profile-tabs"><button className="active" type="button">Thông tin học thuật</button><button type="button" disabled>Hoạt động gần đây</button><button type="button" disabled>Lịch đặt</button></section>
  </section>;
}
