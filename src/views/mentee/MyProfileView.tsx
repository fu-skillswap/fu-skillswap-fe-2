/**
 * @file MyProfileView.tsx
 * @description React Component màn hình Hồ sơ cá nhân của tôi (Mentee Profile View) sử dụng React Hook Form & Yup.
 * Hiển thị thông tin sinh viên, ngành học, cơ sở, mã sinh viên và cho phép cập nhật tên hiển thị, bio.
 */

'use client';

import { useMenteeShell } from '@/components/domain/mentee-shell/MenteeShell';
import { ApiClientError } from '@/models/apiClient';
import type {
  CreateMentorAchievementRequest,
  CreateMentorProjectRequest,
  MentorAchievementResponse,
  MentorProjectResponse,
  MentorProfileResponse,
  StudentProfileRequest,
  StudentProfileResponse,
} from '@/models/auth';
import {
  editProfileSchema,
  type EditProfileFormValues,
} from '@/models/schemas/studentProfileSchema';
import { authRepo } from '@/repositories/authRepo';
import { mentorProfileRepo } from '@/repositories/mentorProfileRepo';
import { studentProfileRepo } from '@/repositories/studentProfileRepo';
import { yupResolver } from '@hookform/resolvers/yup';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Award,
  Briefcase,
  Calendar,
  ExternalLink,
  Globe,
  Phone,
  Plus,
  Star,
  Trash2,
  Edit3,
  Code,
  BookOpen,
  Target,
  UserCheck,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

/** Tạo chữ viết tắt 2 ký tự làm Avatar */
function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'SS'
  );
}

/** Chuyển đổi dữ liệu hồ sơ cá nhân sang định dạng payload cập nhật */
function profileRequest(
  profile: StudentProfileResponse,
  values: EditProfileFormValues,
): StudentProfileRequest {
  return {
    studentCode: values.studentCode.trim(),
    displayName: values.displayName?.trim() || undefined,
    bio: values.bio?.trim() || undefined,
    avatarUrl: profile.avatarUrl || undefined,
    campusId: profile.campus.id,
    programId: profile.program.id,
    specializationId: profile.specialization.id,
    semester: profile.semester,
    intakeYear: profile.intakeYear,
    isAlumni: profile.alumni,
    graduationYear: profile.graduationYear || undefined,
  };
}

/**
 * Component xem và chỉnh sửa thông tin Hồ sơ cá nhân người dùng.
 */
export function MyProfileView() {
  const params = useParams();
  const locale = (params?.locale as string) || 'vi';
  const { setHeaderTitle } = useMenteeShell();
  const [profile, setProfile] = useState<StudentProfileResponse>();
  const [mentorProfile, setMentorProfile] = useState<MentorProfileResponse>();
  const [projects, setProjects] = useState<MentorProjectResponse[]>([]);
  const [achievements, setAchievements] = useState<MentorAchievementResponse[]>([]);
  const [isMentor, setIsMentor] = useState<boolean>(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();

  // State cho Modal Project
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<MentorProjectResponse | null>(null);
  const [projectForm, setProjectForm] = useState<CreateMentorProjectRequest>({
    title: '',
    content: '',
    projectDescription: '',
    liveDemoUrl: '',
  });
  const [projectSaving, setProjectSaving] = useState(false);

  // State cho Modal Achievement
  const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<MentorAchievementResponse | null>(
    null,
  );
  const [achievementForm, setAchievementForm] = useState<CreateMentorAchievementRequest>({
    title: '',
    awardDescription: '',
    achievedAt: '',
    productHeader: '',
    productDescription: '',
    demoUrl: '',
  });
  const [achievementSaving, setAchievementSaving] = useState(false);

  const form = useForm<EditProfileFormValues>({
    resolver: yupResolver(editProfileSchema),
    defaultValues: {
      displayName: '',
      studentCode: '',
      bio: '',
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  useEffect(() => {
    setHeaderTitle('Hồ sơ của tôi');
    return () => setHeaderTitle(undefined);
  }, [setHeaderTitle]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(undefined);

      const me = await authRepo.getMe().catch(() => null);
      const hasMentorRole = Boolean(me?.roles?.includes('MENTOR'));
      setIsMentor(hasMentorRole);

      if (hasMentorRole) {
        const [mentorData, studentData, projList, achList] = await Promise.all([
          mentorProfileRepo.get(true).catch(() => null),
          studentProfileRepo.get().catch(() => null),
          mentorProfileRepo.getProjects().catch(() => []),
          mentorProfileRepo.getAchievements().catch(() => []),
        ]);

        if (mentorData) {
          setMentorProfile(mentorData);
          if (mentorData.featuredProjects) setProjects(mentorData.featuredProjects);
          else if (projList.length) setProjects(projList);

          if (mentorData.achievements) setAchievements(mentorData.achievements);
          else if (achList.length) setAchievements(achList);
        } else {
          if (projList) setProjects(projList);
          if (achList) setAchievements(achList);
        }

        if (studentData) setProfile(studentData);

        const initialName =
          mentorData?.displayName || studentData?.displayName || me?.fullName || '';
        const initialCode = studentData?.studentCode || '';
        const initialBio =
          mentorData?.expertiseDescription || mentorData?.headline || studentData?.bio || '';

        reset({
          displayName: initialName,
          studentCode: initialCode,
          bio: initialBio,
        });
      } else {
        const data = await studentProfileRepo.get();
        setProfile(data);
        reset({
          displayName: data.displayName || '',
          studentCode: data.studentCode,
          bio: data.bio || '',
        });
      }
    } catch (reason) {
      setError(
        reason instanceof ApiClientError && reason.status === 404
          ? 'Bạn chưa có hồ sơ cá nhân. Vui lòng hoàn tất hồ sơ để tiếp tục.'
          : 'Không thể tải hồ sơ lúc này. Vui lòng thử lại.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayName = useMemo(() => {
    if (isMentor && mentorProfile) {
      return (
        mentorProfile.displayName ||
        profile?.displayName ||
        mentorProfile.email.split('@')[0] ||
        'SkillSwap Mentor'
      );
    }
    return profile?.displayName || profile?.email.split('@')[0] || 'SkillSwap Member';
  }, [isMentor, mentorProfile, profile]);

  const email = useMemo(() => {
    if (isMentor && mentorProfile) return mentorProfile.email;
    return profile?.email || '';
  }, [isMentor, mentorProfile, profile]);

  const avatarUrl = useMemo(() => {
    if (isMentor && mentorProfile?.avatarUrl) return mentorProfile.avatarUrl;
    return profile?.avatarUrl;
  }, [isMentor, mentorProfile, profile]);

  const bioText = useMemo(() => {
    if (isMentor && mentorProfile) {
      return (
        mentorProfile.expertiseDescription ||
        mentorProfile.headline ||
        profile?.bio ||
        'Hãy thêm một vài dòng giới thiệu về lĩnh vực và kinh nghiệm chuyên môn của bạn.'
      );
    }
    return (
      profile?.bio ||
      'Hãy thêm một vài dòng giới thiệu để các mentor hiểu hơn về mục tiêu học tập của bạn.'
    );
  }, [isMentor, mentorProfile, profile]);

  const save = async (values: EditProfileFormValues) => {
    setSaving(true);
    setError(undefined);
    try {
      if (isMentor && mentorProfile) {
        const updatedMentor = await mentorProfileRepo.save({
          headline: mentorProfile.headline || values.displayName || 'Mentor',
          expertiseDescription: values.bio || mentorProfile.expertiseDescription || '',
          isAvailable: mentorProfile.isAvailable ?? true,
          subjectResults: mentorProfile.subjectResults || [],
          foundationSupportLevel: mentorProfile.foundationSupportLevel || 5,
          outputReviewSupportLevel: mentorProfile.outputReviewSupportLevel || 5,
          directionSupportLevel: mentorProfile.directionSupportLevel || 5,
          githubUrl: mentorProfile.githubUrl || undefined,
          portfolioUrl: mentorProfile.portfolioUrl || undefined,
          phoneNumber: mentorProfile.phoneNumber || '',
          minimumBookingLeadTimeMinutes: mentorProfile.minimumBookingLeadTimeMinutes || 60,
          maximumBookingHorizonDays: mentorProfile.maximumBookingHorizonDays || 30,
          bookingTimezone: mentorProfile.bookingTimezone || 'Asia/Ho_Chi_Minh',
        });
        setMentorProfile(updatedMentor);
      }

      if (profile) {
        const updatedStudent = await studentProfileRepo.save(profileRequest(profile, values));
        setProfile(updatedStudent);
      }

      reset({
        displayName: values.displayName || '',
        studentCode: values.studentCode || '',
        bio: values.bio || '',
      });
      setEditing(false);
      setNotice('Hồ sơ của bạn đã được cập nhật thành công.');
    } catch (reason) {
      setError(
        reason instanceof ApiClientError
          ? reason.message
          : 'Không thể lưu thay đổi. Vui lòng thử lại.',
      );
    } finally {
      setSaving(false);
    }
  };

  // Quản lý CRUD Dự án
  const openProjectModal = (proj?: MentorProjectResponse) => {
    if (proj) {
      setEditingProject(proj);
      setProjectForm({
        title: proj.title || '',
        content: proj.content || '',
        projectDescription: proj.projectDescription || '',
        liveDemoUrl: proj.liveDemoUrl || '',
      });
    } else {
      setEditingProject(null);
      setProjectForm({ title: '', content: '', projectDescription: '', liveDemoUrl: '' });
    }
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = async () => {
    if (!projectForm.title.trim()) return;
    setProjectSaving(true);
    try {
      const projId = editingProject?.id || editingProject?.projectId;
      if (projId) {
        await mentorProfileRepo.updateProject(projId, projectForm);
      } else {
        await mentorProfileRepo.createProject(projectForm);
      }
      const updatedList = await mentorProfileRepo.getProjects().catch(() => []);
      setProjects(updatedList);
      setIsProjectModalOpen(false);
      setNotice('Đã lưu thông tin dự án.');
    } catch (err) {
      setError('Không thể lưu dự án. Vui lòng thử lại.');
    } finally {
      setProjectSaving(false);
    }
  };

  const handleDeleteProject = async (proj: MentorProjectResponse) => {
    const projId = proj.id || proj.projectId;
    if (!projId || !confirm(`Bạn có chắc chắn muốn xóa dự án "${proj.title}"?`)) return;
    try {
      await mentorProfileRepo.deleteProject(projId);
      const updatedList = await mentorProfileRepo.getProjects().catch(() => []);
      setProjects(updatedList);
      setNotice('Đã xóa dự án.');
    } catch (err) {
      setError('Không thể xóa dự án.');
    }
  };

  // Quản lý CRUD Thành tích
  const openAchievementModal = (ach?: MentorAchievementResponse) => {
    if (ach) {
      setEditingAchievement(ach);
      setAchievementForm({
        title: ach.title || '',
        awardDescription: ach.awardDescription || '',
        achievedAt: ach.achievedAt ? ach.achievedAt.split('T')[0] : '',
        productHeader: ach.productHeader || '',
        productDescription: ach.productDescription || '',
        demoUrl: ach.demoUrl || '',
      });
    } else {
      setEditingAchievement(null);
      setAchievementForm({
        title: '',
        awardDescription: '',
        achievedAt: '',
        productHeader: '',
        productDescription: '',
        demoUrl: '',
      });
    }
    setIsAchievementModalOpen(true);
  };

  const handleSaveAchievement = async () => {
    if (!achievementForm.title.trim()) return;
    setAchievementSaving(true);
    try {
      const achId = editingAchievement?.id || editingAchievement?.achievementId;
      if (achId) {
        await mentorProfileRepo.updateAchievement(achId, achievementForm);
      } else {
        await mentorProfileRepo.createAchievement(achievementForm);
      }
      const updatedList = await mentorProfileRepo.getAchievements().catch(() => []);
      setAchievements(updatedList);
      setIsAchievementModalOpen(false);
      setNotice('Đã lưu thông tin thành tích.');
    } catch (err) {
      setError('Không thể lưu thành tích. Vui lòng thử lại.');
    } finally {
      setAchievementSaving(false);
    }
  };

  const handleDeleteAchievement = async (ach: MentorAchievementResponse) => {
    const achId = ach.id || ach.achievementId;
    if (!achId || !confirm(`Bạn có chắc chắn muốn xóa thành tích "${ach.title}"?`)) return;
    try {
      await mentorProfileRepo.deleteAchievement(achId);
      const updatedList = await mentorProfileRepo.getAchievements().catch(() => []);
      setAchievements(updatedList);
      setNotice('Đã xóa thành tích.');
    } catch (err) {
      setError('Không thể xóa thành tích.');
    }
  };

  if (loading)
    return (
      <section className="p-8 text-center text-text-muted text-sm font-medium" aria-live="polite">
        Đang tải hồ sơ của bạn…
      </section>
    );

  if (!profile && !mentorProfile)
    return (
      <section className="p-8 text-center text-rose-500 text-sm font-medium flex flex-col gap-2" role="alert">
        <strong className="text-base font-bold">Không thể hiển thị hồ sơ</strong>
        <span>{error}</span>
      </section>
    );

  return (
    <section className="max-w-4xl mx-auto space-y-6 pb-12">
      {notice && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm font-semibold flex items-center gap-2" role="status">
          ✓ {notice}
        </div>
      )}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 text-rose-800 border border-rose-200 text-sm font-semibold" role="alert">
          {error}
        </div>
      )}

      {/* Main Profile Card */}
      <article className="bg-white rounded-3xl border border-solid border-border-light shadow-xs overflow-hidden">
        {/* Blue Cover Banner Header */}
        <div className="h-44 sm:h-52 bg-sky-500 relative p-6 flex items-start justify-end">
          <div className="flex items-center gap-3">
            {!isMentor && (
              <Link
                href={`/${locale}/mentor-registration`}
                className="bg-white hover:bg-sky-50 text-sky-600 font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-xs transition-all flex items-center gap-2 border-none no-underline cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-sky-600" /> Đăng ký làm mentor
              </Link>
            )}
            <button
              type="button"
              className="bg-white/90 hover:bg-white text-slate-800 font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-xs transition-all border-none cursor-pointer flex items-center gap-2"
              onClick={() => {
                setEditing((current) => !current);
                setError(undefined);
              }}
            >
              <Edit3 className="w-4 h-4 text-slate-600" />
              {editing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa hồ sơ'}
            </button>
          </div>
        </div>

        {/* Profile Content Body */}
        <div className="px-6 sm:px-8 pb-8 pt-0 relative">
          {/* Avatar Floating over Banner */}
          <div className="-mt-14 sm:-mt-16 mb-4 w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-solid border-white bg-slate-100 shadow-md relative overflow-hidden flex items-center justify-center shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
            ) : (
              <span className="w-full h-full rounded-full bg-gradient-to-br from-primary-light to-blue-100 text-primary font-black text-xl flex items-center justify-center">
                {initials(displayName)}
              </span>
            )}
          </div>

          {!editing ? (
            <>
              {/* Display Name & Badges */}
              <div className="flex flex-col gap-1 mb-3">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 m-0 tracking-tight">{displayName}</h2>
                <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                  <span className="px-3.5 py-1 rounded-full bg-sky-100 text-sky-700 font-bold text-xs">
                    {isMentor ? 'Mentor' : 'Mentee'}
                  </span>
                  <span className="px-3.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium text-xs">
                    {email}
                  </span>
                </div>
              </div>

              {/* Bio */}
              <p className="text-xs sm:text-sm text-text-muted mt-3 mb-6 leading-relaxed max-w-2xl">
                {bioText}
              </p>

              {/* Academic Details Grid (2 Rows x 3 Columns) */}
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-y-6 gap-x-6 pt-6 border-t border-solid border-border-light/60">
                <div>
                  <dt className="text-xs text-text-muted font-semibold mb-1 uppercase tracking-wider">
                    {isMentor ? 'Đánh giá trung bình' : 'Mã số sinh viên'}
                  </dt>
                  <dd className="text-sm sm:text-base font-black text-slate-800 m-0">
                    {isMentor
                      ? mentorProfile?.ratingAverage
                        ? `${mentorProfile.ratingAverage.toFixed(1)} ⭐ (${mentorProfile.reviewCount || 0} lượt)`
                        : '--'
                      : profile?.studentCode || 'SE201627'}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-text-muted font-semibold mb-1 uppercase tracking-wider">Cơ sở</dt>
                  <dd className="text-sm sm:text-base font-black text-slate-800 m-0">
                    {profile?.campus?.name || 'Đại học FPT TP. HCM'}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-text-muted font-semibold mb-1 uppercase tracking-wider">Ngành học</dt>
                  <dd className="text-sm sm:text-base font-black text-slate-800 m-0">
                    {profile?.program?.nameVi || 'Công nghệ truyền thông'}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-text-muted font-semibold mb-1 uppercase tracking-wider">
                    {isMentor ? 'Chuyên môn / Tiêu đề' : 'Chuyên ngành'}
                  </dt>
                  <dd className="text-sm sm:text-base font-black text-slate-800 m-0">
                    {isMentor
                      ? mentorProfile?.headline ||
                        mentorProfile?.subjectResults?.map((s) => s.subjectCode).join(', ') ||
                        profile?.specialization?.nameVi ||
                        'Chưa cập nhật tiêu đề'
                      : profile?.specialization?.nameVi || 'Quan hệ công chúng'}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-text-muted font-semibold mb-1 uppercase tracking-wider">
                    {isMentor ? 'Múi giờ' : 'Học kỳ'}
                  </dt>
                  <dd className="text-sm sm:text-base font-black text-slate-800 m-0">
                    {isMentor
                      ? mentorProfile?.bookingTimezone || 'Asia/Ho_Chi_Minh'
                      : profile?.semester === 0
                        ? 'Tiếng Anh dự bị'
                        : `Học kỳ ${profile?.semester || 2}`}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-text-muted font-semibold mb-1 uppercase tracking-wider">Khóa nhập học</dt>
                  <dd className="text-sm sm:text-base font-black text-slate-800 m-0">
                    {profile?.intakeYear || '2024'}
                  </dd>
                </div>
              </dl>

              {profile?.alumni && (
                <p className="mt-4 pt-4 border-t border-solid border-border-light/60 text-xs text-primary font-bold">
                  🎓 Cựu sinh viên · Tốt nghiệp năm {profile.graduationYear}
                </p>
              )}
            </>
          ) : (
            <form className="flex flex-col gap-4 mt-4" onSubmit={handleSubmit(save)} noValidate>
              <label className="flex flex-col gap-1 text-xs font-bold text-text-main">
                Tên hiển thị
                <input
                  className="h-10 px-3.5 rounded-xl border border-solid border-border-color focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none text-sm transition-all"
                  maxLength={150}
                  {...register('displayName')}
                />
                {errors.displayName && <small className="text-rose-500 font-normal">{errors.displayName.message}</small>}
              </label>
              <label className="flex flex-col gap-1 text-xs font-bold text-text-main">
                Mã số sinh viên
                <input
                  className="h-10 px-3.5 rounded-xl border border-solid border-border-color focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none text-sm transition-all"
                  {...register('studentCode')}
                />
                {errors.studentCode && <small className="text-rose-500 font-normal">{errors.studentCode.message}</small>}
              </label>
              <label className="flex flex-col gap-1 text-xs font-bold text-text-main">
                Giới thiệu bản thân / Kinh nghiệm
                <textarea
                  className="p-3.5 rounded-xl border border-solid border-border-color focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none text-sm transition-all"
                  rows={4}
                  placeholder="Mục tiêu học tập, kinh nghiệm chuyên môn và lĩnh vực bạn quan tâm…"
                  {...register('bio')}
                />
                {errors.bio && <small className="text-rose-500 font-normal">{errors.bio.message}</small>}
              </label>
              {profile && (
                <p className="text-xs text-text-muted">
                  Thông tin học thuật được xác thực: {profile.campus.name} · {profile.program.nameVi} · {profile.specialization.nameVi}
                </p>
              )}
              <button
                type="submit"
                disabled={saving}
                className="h-10 px-6 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-xs hover:shadow-md active:scale-[0.98] transition-all border-none cursor-pointer w-fit self-end"
              >
                {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
              </button>
            </form>
          )}
        </div>
      </article>

      {/* Segmented Profile Tabs */}
      <section className="bg-white rounded-2xl p-2 border border-solid border-border-light shadow-xs flex items-center justify-around text-center">
        <button
          className="px-6 py-2.5 text-xs sm:text-sm font-extrabold text-primary border-b-2 border-primary bg-transparent cursor-pointer"
          type="button"
        >
          {isMentor ? 'Thông tin Mentor' : 'Thông tin học thuật'}
        </button>
        <button
          className="px-6 py-2.5 text-xs sm:text-sm font-semibold text-text-muted bg-transparent cursor-pointer hover:text-text-main"
          type="button"
          disabled
        >
          Hoạt động gần đây
        </button>
        <button
          className="px-6 py-2.5 text-xs sm:text-sm font-semibold text-text-muted bg-transparent cursor-pointer hover:text-text-main"
          type="button"
          disabled
        >
          Lịch đặt
        </button>
      </section>

      {/* Thông tin mở rộng dành cho Mentor với thiết kế đồng bộ theme xanh biển */}
      {isMentor && (
        <div
          className="figma-mentor-profile-sections"
          style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}
        >
          {/* Thanh thống kê nhanh (Sessions, Phone, Socials) */}
          <div
            className="figma-mentor-stats-bar"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              background: '#fff',
              padding: '20px',
              borderRadius: '16px',
              border: '1px solid var(--figma-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  padding: '10px',
                  background: 'var(--figma-blue-light)',
                  borderRadius: '12px',
                  color: 'var(--figma-blue)',
                }}
              >
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <small style={{ color: 'var(--figma-muted)', fontSize: '12px' }}>
                  Buổi tư vấn đã hoàn thành
                </small>
                <div style={{ fontWeight: '700', fontSize: '15px' }}>
                  {mentorProfile?.completedSessions || 0} buổi
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  padding: '10px',
                  background: 'var(--figma-blue-light)',
                  borderRadius: '12px',
                  color: 'var(--figma-blue)',
                }}
              >
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <small style={{ color: 'var(--figma-muted)', fontSize: '12px' }}>
                  Số điện thoại liên hệ
                </small>
                <div style={{ fontWeight: '700', fontSize: '15px' }}>
                  {mentorProfile?.phoneNumber || 'Chưa cập nhật'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  padding: '10px',
                  background: 'var(--figma-blue-light)',
                  borderRadius: '12px',
                  color: 'var(--figma-blue)',
                }}
              >
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <small style={{ color: 'var(--figma-muted)', fontSize: '12px' }}>
                  Kênh truyền thông
                </small>
                <div style={{ display: 'flex', gap: '10px', marginTop: '2px' }}>
                  {mentorProfile?.githubUrl && (
                    <a
                      href={mentorProfile.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: 'var(--figma-blue)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        fontSize: '13px',
                        fontWeight: '600',
                      }}
                    >
                      <Code className="w-4 h-4" /> GitHub
                    </a>
                  )}
                  {mentorProfile?.portfolioUrl && (
                    <a
                      href={mentorProfile.portfolioUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: 'var(--figma-blue)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        fontSize: '13px',
                        fontWeight: '600',
                      }}
                    >
                      <ExternalLink className="w-4 h-4" /> Portfolio
                    </a>
                  )}
                  {!mentorProfile?.githubUrl && !mentorProfile?.portfolioUrl && (
                    <span style={{ fontSize: '13px', color: 'var(--figma-muted)' }}>
                      Chưa liên kết
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Môn học giảng dạy & Mức độ hỗ trợ */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px',
            }}
          >
            {/* Môn học đã duyệt */}
            <div
              style={{
                background: '#fff',
                padding: '20px',
                borderRadius: '16px',
                border: '1px solid var(--figma-border)',
              }}
            >
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--figma-text)',
                }}
              >
                <BookOpen className="w-5 h-5 text-[var(--figma-blue)]" /> Môn học giảng dạy (
                {mentorProfile?.subjectResults?.length || 0})
              </h3>
              {mentorProfile?.subjectResults?.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {mentorProfile.subjectResults.map((sub, idx) => (
                    <div
                      key={sub.id || idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        background: '#f8fafc',
                        borderRadius: '10px',
                        border: '1px solid #f1f5f9',
                      }}
                    >
                      <div>
                        <strong style={{ color: 'var(--figma-blue)', marginRight: '8px' }}>
                          {sub.subjectCode}
                        </strong>
                        <span style={{ fontSize: '13px', color: '#334155' }}>
                          {sub.subjectName}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: '700',
                          padding: '4px 8px',
                          background: 'var(--figma-blue-light)',
                          color: 'var(--figma-blue)',
                          borderRadius: '6px',
                        }}
                      >
                        Điểm: {sub.scoreValue?.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--figma-muted)', fontSize: '13px' }}>
                  Chưa có thông tin môn học giảng dạy.
                </p>
              )}
            </div>

            {/* Mức độ hỗ trợ (Scale 1-5) */}
            <div
              style={{
                background: '#fff',
                padding: '20px',
                borderRadius: '16px',
                border: '1px solid var(--figma-border)',
              }}
            >
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--figma-text)',
                }}
              >
                <Target className="w-5 h-5 text-[var(--figma-blue)]" /> Mức độ hỗ trợ tư vấn
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '13px',
                      marginBottom: '4px',
                    }}
                  >
                    <span>Hỗ trợ kiến thức căn bản</span>
                    <strong>{mentorProfile?.foundationSupportLevel || 0} / 5</strong>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      width: '100%',
                      background: '#e2e8f0',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${((mentorProfile?.foundationSupportLevel || 0) / 5) * 100}%`,
                        background: 'var(--figma-blue)',
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '13px',
                      marginBottom: '4px',
                    }}
                  >
                    <span>Review sản phẩm & đồ án</span>
                    <strong>{mentorProfile?.outputReviewSupportLevel || 0} / 5</strong>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      width: '100%',
                      background: '#e2e8f0',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${((mentorProfile?.outputReviewSupportLevel || 0) / 5) * 100}%`,
                        background: '#0284c7',
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '13px',
                      marginBottom: '4px',
                    }}
                  >
                    <span>Định hướng học tập & sự nghiệp</span>
                    <strong>{mentorProfile?.directionSupportLevel || 0} / 5</strong>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      width: '100%',
                      background: '#e2e8f0',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${((mentorProfile?.directionSupportLevel || 0) / 5) * 100}%`,
                        background: '#3b82f6',
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Phần Dự án tiêu biểu (Featured Projects) */}
          <div
            style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid var(--figma-border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  margin: 0,
                  color: 'var(--figma-text)',
                }}
              >
                <Briefcase className="w-5 h-5 text-[var(--figma-blue)]" /> Dự án nổi bật (
                {projects.length})
              </h3>
              <button
                type="button"
                onClick={() => openProjectModal()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  background: 'var(--figma-blue-light)',
                  color: 'var(--figma-blue)',
                  border: '1px solid var(--figma-blue-mid)',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <Plus className="w-4 h-4" /> Thêm dự án
              </button>
            </div>

            {projects.length ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '16px',
                }}
              >
                {projects.map((proj) => (
                  <div
                    key={proj.id || proj.projectId}
                    style={{
                      border: '1px solid var(--figma-border)',
                      padding: '16px',
                      borderRadius: '12px',
                      background: '#fafafa',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '8px',
                      }}
                    >
                      <h4
                        style={{
                          fontSize: '15px',
                          fontWeight: '700',
                          color: 'var(--figma-text)',
                          margin: 0,
                        }}
                      >
                        {proj.title}
                      </h4>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => openProjectModal(proj)}
                          style={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            color: 'var(--figma-muted)',
                          }}
                          title="Sửa dự án"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(proj)}
                          style={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            color: '#ef4444',
                          }}
                          title="Xóa dự án"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p
                      style={{
                        fontSize: '13px',
                        color: '#475569',
                        marginBottom: '8px',
                        fontWeight: '500',
                      }}
                    >
                      {proj.content}
                    </p>
                    {proj.projectDescription && (
                      <p
                        style={{
                          fontSize: '12px',
                          color: 'var(--figma-muted)',
                          marginBottom: '10px',
                        }}
                      >
                        {proj.projectDescription}
                      </p>
                    )}
                    {proj.liveDemoUrl && (
                      <a
                        href={proj.liveDemoUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: '12px',
                          color: 'var(--figma-blue)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: '600',
                        }}
                      >
                        <ExternalLink className="w-3 h-3" /> Xem Demo / Source
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--figma-muted)', fontSize: '13px', margin: 0 }}>
                Chưa có dự án tiêu biểu nào. Nhấn "+ Thêm dự án" để giới thiệu kinh nghiệm của bạn.
              </p>
            )}
          </div>

          {/* Phần Thành tích & Giải thưởng (Achievements) */}
          <div
            style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid var(--figma-border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  margin: 0,
                  color: 'var(--figma-text)',
                }}
              >
                <Award className="w-5 h-5 text-[var(--figma-blue)]" /> Thành tích & Giải thưởng (
                {achievements.length})
              </h3>
              <button
                type="button"
                onClick={() => openAchievementModal()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  background: 'var(--figma-blue-light)',
                  color: 'var(--figma-blue)',
                  border: '1px solid var(--figma-blue-mid)',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <Plus className="w-4 h-4" /> Thêm thành tích
              </button>
            </div>

            {achievements.length ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '16px',
                }}
              >
                {achievements.map((ach) => (
                  <div
                    key={ach.id || ach.achievementId}
                    style={{
                      border: '1px solid var(--figma-border)',
                      padding: '16px',
                      borderRadius: '12px',
                      background: '#fafafa',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '8px',
                      }}
                    >
                      <div>
                        <h4
                          style={{
                            fontSize: '15px',
                            fontWeight: '700',
                            color: 'var(--figma-text)',
                            margin: 0,
                          }}
                        >
                          {ach.title}
                        </h4>
                        {ach.achievedAt && (
                          <small
                            style={{
                              color: 'var(--figma-blue)',
                              fontSize: '11px',
                              fontWeight: '600',
                            }}
                          >
                            {ach.achievedAt}
                          </small>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => openAchievementModal(ach)}
                          style={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            color: 'var(--figma-muted)',
                          }}
                          title="Sửa thành tích"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAchievement(ach)}
                          style={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            color: '#ef4444',
                          }}
                          title="Xóa thành tích"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {ach.awardDescription && (
                      <p style={{ fontSize: '13px', color: '#475569', marginBottom: '8px' }}>
                        {ach.awardDescription}
                      </p>
                    )}
                    {ach.productHeader && (
                      <div
                        style={{
                          marginTop: '8px',
                          paddingTop: '8px',
                          borderTop: '1px dashed var(--figma-border)',
                        }}
                      >
                        <strong style={{ fontSize: '12px', color: 'var(--figma-blue)' }}>
                          Sản phẩm: {ach.productHeader}
                        </strong>
                        {ach.productDescription && (
                          <p
                            style={{
                              fontSize: '12px',
                              color: 'var(--figma-muted)',
                              margin: '2px 0 0',
                            }}
                          >
                            {ach.productDescription}
                          </p>
                        )}
                      </div>
                    )}
                    {ach.demoUrl && (
                      <a
                        href={ach.demoUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: '12px',
                          color: 'var(--figma-blue)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: '600',
                          marginTop: '8px',
                        }}
                      >
                        <ExternalLink className="w-3 h-3" /> Xem Chứng nhận / Minh chứng
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--figma-muted)', fontSize: '13px', margin: 0 }}>
                Chưa có thành tích hoặc giải thưởng. Nhấn "+ Thêm thành tích" để thêm mới.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Modal Thêm/Sửa Dự án */}
      {isProjectModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '500px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '700' }}>
              {editingProject ? 'Sửa thông tin dự án' : 'Thêm dự án nổi bật mới'}
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSaveProject();
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                Tên dự án *
                <input
                  required
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--figma-border)',
                    fontSize: '14px',
                  }}
                  value={projectForm.title}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                  placeholder="Ví dụ: SWP391 Booking Platform"
                />
              </label>
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                Vai trò / Công nghệ sử dụng *
                <input
                  required
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--figma-border)',
                    fontSize: '14px',
                  }}
                  value={projectForm.content}
                  onChange={(e) => setProjectForm({ ...projectForm, content: e.target.value })}
                  placeholder="Ví dụ: Fullstack Lead (ReactJS, Java Spring Boot)"
                />
              </label>
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                Mô tả dự án
                <textarea
                  rows={3}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--figma-border)',
                    fontSize: '14px',
                  }}
                  value={projectForm.projectDescription || ''}
                  onChange={(e) =>
                    setProjectForm({ ...projectForm, projectDescription: e.target.value })
                  }
                  placeholder="Mô tả bài toán, giải pháp và kết quả chính đạt được…"
                />
              </label>
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                Đường dẫn Live Demo / GitHub
                <input
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--figma-border)',
                    fontSize: '14px',
                  }}
                  value={projectForm.liveDemoUrl || ''}
                  onChange={(e) => setProjectForm({ ...projectForm, liveDemoUrl: e.target.value })}
                  placeholder="https://github.com/your-username/your-repo"
                />
              </label>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '10px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--figma-border)',
                    background: '#f8fafc',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={projectSaving}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--figma-blue)',
                    color: '#fff',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  {projectSaving ? 'Đang lưu…' : 'Lưu dự án'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Thêm/Sửa Thành tích */}
      {isAchievementModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '500px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '700' }}>
              {editingAchievement ? 'Sửa thông tin thành tích' : 'Thêm thành tích / giải thưởng'}
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSaveAchievement();
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                Tên giải thưởng / thành tích *
                <input
                  required
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--figma-border)',
                    fontSize: '14px',
                  }}
                  value={achievementForm.title}
                  onChange={(e) =>
                    setAchievementForm({ ...achievementForm, title: e.target.value })
                  }
                  placeholder="Ví dụ: NAB StarCamp Internship / Quán quân Hackathon"
                />
              </label>
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                Ngày / Thời điểm đạt được
                <input
                  type="date"
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--figma-border)',
                    fontSize: '14px',
                  }}
                  value={achievementForm.achievedAt || ''}
                  onChange={(e) =>
                    setAchievementForm({ ...achievementForm, achievedAt: e.target.value })
                  }
                />
              </label>
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                Mô tả chi tiết giải thưởng
                <textarea
                  rows={2}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--figma-border)',
                    fontSize: '14px',
                  }}
                  value={achievementForm.awardDescription || ''}
                  onChange={(e) =>
                    setAchievementForm({ ...achievementForm, awardDescription: e.target.value })
                  }
                  placeholder="Mô tả quy mô, thành tựu hoặc tổ chức trao giải…"
                />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    fontSize: '13px',
                    fontWeight: '600',
                  }}
                >
                  Tên sản phẩm liên quan
                  <input
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid var(--figma-border)',
                      fontSize: '14px',
                    }}
                    value={achievementForm.productHeader || ''}
                    onChange={(e) =>
                      setAchievementForm({ ...achievementForm, productHeader: e.target.value })
                    }
                    placeholder="Ví dụ: StarCamp"
                  />
                </label>
                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    fontSize: '13px',
                    fontWeight: '600',
                  }}
                >
                  Mô tả sản phẩm
                  <input
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid var(--figma-border)',
                      fontSize: '14px',
                    }}
                    value={achievementForm.productDescription || ''}
                    onChange={(e) =>
                      setAchievementForm({ ...achievementForm, productDescription: e.target.value })
                    }
                    placeholder="Ngắn gọn sản phẩm"
                  />
                </label>
              </div>
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                Đường dẫn minh chứng / Demo
                <input
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--figma-border)',
                    fontSize: '14px',
                  }}
                  value={achievementForm.demoUrl || ''}
                  onChange={(e) =>
                    setAchievementForm({ ...achievementForm, demoUrl: e.target.value })
                  }
                  placeholder="https://certificate-link-or-demo.com"
                />
              </label>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '10px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsAchievementModalOpen(false)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--figma-border)',
                    background: '#f8fafc',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={achievementSaving}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--figma-blue)',
                    color: '#fff',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  {achievementSaving ? 'Đang lưu…' : 'Lưu thành tích'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
