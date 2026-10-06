/**
 * @file MentorPostComposer.tsx
 * @description Trang soạn bài chuyên sâu của Mentor, sử dụng trực tiếp blog draft/publish flow hiện có.
 */

'use client';

import {
  ArrowLeft,
  Bold,
  BriefcaseBusiness,
  FileText,
  Italic,
  ImagePlus,
  Lightbulb,
  Link as LinkIcon,
  List,
  ListOrdered,
  MessageSquareQuote,
  Send,
  Target,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { SelectField } from '@/components/ui/SelectField';
import { TextArea } from '@/components/ui/TextArea';
import { TextField } from '@/components/ui/TextField';
import type { MentorBlogVisibility } from '@/models/auth';
import type { BlogCategoryResponse } from '@/models/auth';
import { mentorPostRepo } from '@/repositories/mentorPostRepo';
import { showError } from '@/utils/toast';
import type { MentorPostsController } from './useMentorPosts';

const VISIBILITY_OPTIONS = [
  { value: 'PUBLIC', label: 'Công khai' },
  { value: 'AUTHENTICATED', label: 'Người dùng đã đăng nhập' },
  { value: 'BOOKED_MEMBERS', label: 'Mentee đã đặt dịch vụ' },
];

function mentorBlogVisibilityOf(value: string): MentorBlogVisibility {
  if (value === 'AUTHENTICATED' || value === 'BOOKED_MEMBERS') return value;
  return 'PUBLIC';
}

export function MentorPostComposer({ posts }: { posts: MentorPostsController }) {
  const [categories, setCategories] = useState<BlogCategoryResponse[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>();
  const title = posts.form.watch('title') ?? '';
  const content = posts.form.watch('contentMarkdown') ?? '';

  useEffect(() => {
    void mentorPostRepo
      .categories()
      .then(setCategories)
      .catch((reason) =>
        showError(reason, {
          title: 'Không thể tải chủ đề bài viết',
          description: 'Bạn vẫn có thể tiếp tục soạn và lưu bản nháp.',
        }),
      );
  }, []);

  const appendMarkdown = (prefix: string, suffix = '', placeholder = 'nội dung') => {
    const separator = content && !content.endsWith('\n') ? '\n' : '';
    posts.form.setValue(
      'contentMarkdown',
      `${content}${separator}${prefix}${placeholder}${suffix}`,
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  };

  const uploadCover = async (file?: File) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const intent = await mentorPostRepo.createUploadIntent({
        filename: file.name,
        contentType: file.type,
      });
      await mentorPostRepo.uploadFile(intent, file);
      const asset = await mentorPostRepo.confirmUpload(intent.uploadIntentId);
      posts.form.setValue('coverAssetId', asset.assetId, { shouldDirty: true });
      setUploadedFileName(file.name);
    } catch (reason) {
      showError(reason, {
        title: 'Không thể tải ảnh lên',
        description: 'Vui lòng chọn ảnh khác hoặc thử lại.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-[1240px] space-y-5">
      <header className="flex items-start gap-3">
        <button
          type="button"
          onClick={posts.closeEditor}
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-solid border-border-light bg-white text-text-secondary hover:border-primary-border hover:text-primary"
          aria-label="Quay lại danh sách bài viết"
        >
          <ArrowLeft className="h-4.5 w-4.5" aria-hidden="true" />
        </button>
        <div>
          <h1 className="m-0 text-2xl font-extrabold text-text-main">
            {posts.editingPost ? 'Chỉnh sửa bài viết' : 'Tạo bài viết'}
          </h1>
          <p className="mb-0 mt-1 text-sm text-text-secondary">
            Chia sẻ kiến thức và lan tỏa giá trị đến cộng đồng SkillSwap
          </p>
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_290px]">
        <form
          className="rounded-[20px] border border-solid border-border-light bg-white p-5 shadow-xs sm:p-6"
          onSubmit={posts.submitDraft}
          noValidate
        >
          <div className="space-y-5">
            <div className="relative">
              <TextField
                label="Tiêu đề bài viết"
                required
                maxLength={220}
                placeholder="Ví dụ: 5 cách cải thiện kỹ năng thuyết trình cho sinh viên"
                error={posts.form.formState.errors.title?.message}
                {...posts.form.register('title')}
              />
              <span className="absolute bottom-2 right-3 text-[10px] text-text-muted">
                {title.length}/220
              </span>
            </div>

            <TextArea
              label="Mô tả ngắn"
              rows={3}
              maxLength={500}
              placeholder="Tóm tắt giá trị chính người đọc sẽ nhận được"
              error={posts.form.formState.errors.excerpt?.message}
              {...posts.form.register('excerpt')}
            />

            <div className="space-y-1.5">
              <label
                htmlFor="mentor-post-content"
                className="text-xs font-semibold text-text-secondary"
              >
                Nội dung bài viết
              </label>
              <div className="overflow-hidden rounded-xl border border-solid border-border-color focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
                <div
                  className="flex flex-wrap gap-1 border-b border-solid border-border-light bg-surface-subtle/60 p-2"
                  aria-label="Công cụ định dạng Markdown"
                >
                  <EditorButton
                    label="In đậm"
                    icon={<Bold />}
                    onClick={() => appendMarkdown('**', '**')}
                  />
                  <EditorButton
                    label="In nghiêng"
                    icon={<Italic />}
                    onClick={() => appendMarkdown('_', '_')}
                  />
                  <EditorButton
                    label="Danh sách"
                    icon={<List />}
                    onClick={() => appendMarkdown('- ')}
                  />
                  <EditorButton
                    label="Danh sách đánh số"
                    icon={<ListOrdered />}
                    onClick={() => appendMarkdown('1. ')}
                  />
                  <EditorButton
                    label="Trích dẫn"
                    icon={<MessageSquareQuote />}
                    onClick={() => appendMarkdown('> ')}
                  />
                  <EditorButton
                    label="Liên kết"
                    icon={<LinkIcon />}
                    onClick={() => appendMarkdown('[', '](https://)', 'văn bản liên kết')}
                  />
                </div>
                <TextArea
                  id="mentor-post-content"
                  rows={13}
                  placeholder="Chia sẻ kinh nghiệm, câu chuyện hoặc kiến thức của bạn…"
                  error={posts.form.formState.errors.contentMarkdown?.message}
                  className="min-h-[280px] resize-y rounded-none border-0 focus:ring-0"
                  {...posts.form.register('contentMarkdown')}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                id="mentor-post-category"
                label="Chủ đề"
                value={posts.form.watch('categoryIds')?.[0]}
                options={categories.map((category) => ({
                  value: category.id,
                  label: category.name,
                }))}
                placeholder="Chọn chủ đề phù hợp"
                onValueChange={(value) =>
                  posts.form.setValue('categoryIds', [value], { shouldDirty: true })
                }
              />
              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-text-secondary">
                  Thêm ảnh (tùy chọn)
                </span>
                <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-primary-border bg-primary-light/30 px-3 text-xs font-bold text-primary hover:bg-primary-light">
                  <ImagePlus className="h-4 w-4" aria-hidden="true" />
                  <span>{isUploading ? 'Đang tải ảnh…' : uploadedFileName || 'Thêm ảnh'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={isUploading}
                    onChange={(event) => void uploadCover(event.target.files?.[0])}
                  />
                </label>
              </div>
            </div>

            <FormField label="Ai có thể xem" htmlFor="mentor-post-visibility">
              <SelectField
                id="mentor-post-visibility"
                value={posts.form.watch('visibility')}
                options={VISIBILITY_OPTIONS}
                onValueChange={(value) =>
                  posts.form.setValue('visibility', mentorBlogVisibilityOf(value), {
                    shouldDirty: true,
                  })
                }
              />
            </FormField>
          </div>

          <footer className="mt-6 flex flex-col-reverse justify-between gap-3 border-t border-solid border-border-light pt-5 sm:flex-row sm:items-center">
            <Button
              type="submit"
              variant="outline"
              loading={posts.isSaving}
              disabled={isUploading}
              leftIcon={<FileText />}
            >
              Lưu bản nháp
            </Button>
            <div className="flex gap-2 sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={posts.closeEditor}
                disabled={posts.isSaving}
                className="flex-1 sm:flex-none"
              >
                Hủy
              </Button>
              <Button
                type="button"
                leftIcon={<Send />}
                loading={posts.isSaving}
                disabled={isUploading}
                onClick={() => void posts.submitPublish()}
                className="flex-1 sm:flex-none"
              >
                Đăng bài chia sẻ
              </Button>
            </div>
          </footer>
        </form>

        <aside className="rounded-[18px] border border-solid border-border-light bg-white p-5 shadow-xs lg:sticky lg:top-24">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Lightbulb className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <h2 className="m-0 text-base font-extrabold text-text-main">Mẹo để bài viết hữu ích</h2>
          </div>
          <div className="mt-5 space-y-5">
            <Tip
              icon={<Target />}
              title="Tiêu đề rõ ràng, thu hút"
              description="Giúp người đọc dễ hiểu nội dung chính."
            />
            <Tip
              icon={<BriefcaseBusiness />}
              title="Chia sẻ kinh nghiệm thực tế"
              description="Ví dụ, case study hoặc bài học cá nhân sẽ giá trị hơn."
            />
            <Tip
              icon={<FileText />}
              title="Tổ chức nội dung dễ đọc"
              description="Chia đoạn và dùng danh sách cho những ý quan trọng."
            />
          </div>
        </aside>
      </div>
    </section>
  );
}

function EditorButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg border-none bg-transparent text-text-secondary hover:bg-white hover:text-primary [&>svg]:h-4 [&>svg]:w-4"
    >
      {icon}
    </button>
  );
}

function Tip({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary [&>svg]:h-4 [&>svg]:w-4">
        {icon}
      </span>
      <div>
        <h3 className="m-0 text-xs font-bold text-text-main">{title}</h3>
        <p className="mb-0 mt-1 text-[11px] leading-5 text-text-secondary">{description}</p>
      </div>
    </div>
  );
}
