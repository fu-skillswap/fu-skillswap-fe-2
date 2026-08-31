/**
 * @file MentorPostsView.tsx
 * @description Màn quản lý bài viết Blog của Mentor.
 */

'use client';

import { Archive, CalendarDays, FileText, Pencil, Plus, Send, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { useMenteeShell } from '@/components/domain/mentee-shell/MenteeShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Modal } from '@/components/ui/Modal';
import { SelectField } from '@/components/ui/SelectField';
import { TextArea } from '@/components/ui/TextArea';
import { TextField } from '@/components/ui/TextField';
import type { MentorBlogPostDetailResponse, MentorBlogVisibility } from '@/models/auth';
import { useMentorPosts } from './useMentorPosts';

const VISIBILITY_OPTIONS = [
  { value: 'PUBLIC', label: 'Công khai' },
  { value: 'AUTHENTICATED', label: 'Người dùng đã đăng nhập' },
  { value: 'BOOKED_MEMBERS', label: 'Mentee đã đặt dịch vụ' },
];

function mentorBlogVisibilityOf(value: string): MentorBlogVisibility {
  if (value === 'AUTHENTICATED' || value === 'BOOKED_MEMBERS') return value;
  return 'PUBLIC';
}

function formatPostDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function MentorPostsView() {
  const { setHeaderTitle } = useMenteeShell();
  const posts = useMentorPosts();

  useEffect(() => {
    setHeaderTitle('Bài viết của tôi');
    return () => setHeaderTitle(undefined);
  }, [setHeaderTitle]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('create') === '1') posts.openCreate();
  }, [posts.openCreate]);

  return (
    <section className="space-y-6 max-w-7xl mx-auto">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-solid border-border-light shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-text-main m-0">Bài viết của tôi</h1>
          <p className="text-xs text-text-muted mt-1 m-0">
            {posts.counts.published} đã đăng <span className="mx-1">·</span> {posts.counts.draft} bản nháp
          </p>
        </div>
        <Button leftIcon={<Plus />} onClick={posts.openCreate}>
          Bài viết mới
        </Button>
      </header>

      {posts.error && (
        <div className="p-4 rounded-2xl bg-danger-soft border border-solid border-red-200 text-danger text-xs font-medium flex items-center justify-between gap-4" role="alert">
          <span>{posts.error}</span>
          <Button variant="outline" size="sm" onClick={() => void posts.refresh()}>
            Thử lại
          </Button>
        </div>
      )}

      {posts.isLoading ? (
        <div className="grid grid-cols-1 gap-4" aria-label="Đang tải bài viết">
          {[1, 2, 3].map((item) => (
            <div className="h-36 rounded-2xl bg-surface-subtle animate-pulse border border-solid border-border-light" key={item} />
          ))}
        </div>
      ) : posts.posts.length ? (
        <div className="grid grid-cols-1 gap-4">
          {posts.posts.map((post) => (
            <MentorPostCard
              key={post.id}
              post={post}
              onEdit={() => void posts.openEdit(post)}
              onArchive={() => posts.setArchiveTarget(post)}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-solid border-border-light shadow-xs flex flex-col items-center gap-3">
          <FileText className="w-12 h-12 text-text-muted" aria-hidden="true" />
          <strong className="text-sm font-bold text-text-main">Bạn chưa có bài viết nào.</strong>
          <span className="text-xs text-text-muted">Chia sẻ kinh nghiệm, kiến thức hoặc góc nhìn của bạn với mentee.</span>
          <Button leftIcon={<Plus />} onClick={posts.openCreate}>
            Tạo bài viết đầu tiên
          </Button>
        </div>
      )}

      <Modal
        open={posts.isEditorOpen}
        onClose={posts.closeEditor}
        title={posts.editingPost ? 'Chỉnh sửa bản nháp' : 'Tạo bài viết mới'}
      >
        <form className="flex flex-col gap-4" onSubmit={posts.submitDraft} noValidate>
          <TextField
            label="Tiêu đề"
            required
            maxLength={220}
            placeholder="Nhập tiêu đề bài viết"
            error={posts.form.formState.errors.title?.message}
            {...posts.form.register('title')}
          />
          <TextArea
            label="Mô tả ngắn"
            rows={3}
            maxLength={500}
            placeholder="Tóm tắt nội dung chính của bài viết"
            error={posts.form.formState.errors.excerpt?.message}
            {...posts.form.register('excerpt')}
          />
          <TextArea
            label="Nội dung"
            rows={10}
            placeholder="Chia sẻ kiến thức và kinh nghiệm của bạn..."
            error={posts.form.formState.errors.contentMarkdown?.message}
            {...posts.form.register('contentMarkdown')}
          />
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
          <footer className="flex items-center justify-between gap-3 pt-4 border-t border-solid border-border-light mt-2">
            <Button type="button" variant="outline" onClick={posts.closeEditor}>
              Hủy
            </Button>
            <div className="flex items-center gap-2">
              <Button type="submit" variant="secondary" loading={posts.isSaving}>
                Lưu bản nháp
              </Button>
              <Button
                type="button"
                leftIcon={<Send />}
                loading={posts.isSaving}
                onClick={() => void posts.submitPublish()}
              >
                Đăng bài
              </Button>
            </div>
          </footer>
        </form>
      </Modal>

      <Modal
        open={Boolean(posts.archiveTarget)}
        onClose={() => !posts.isSaving && posts.setArchiveTarget(undefined)}
        title="Xóa bài viết khỏi danh sách?"
      >
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-50 border border-solid border-amber-200 text-amber-900 text-xs">
          <Archive className="w-6 h-6 text-amber-600 shrink-0" aria-hidden="true" />
          <p className="m-0 leading-relaxed">Bài viết sẽ được chuyển vào lưu trữ theo chính sách hiện tại của hệ thống.</p>
        </div>
        <footer className="flex items-center justify-end gap-3 pt-4 border-t border-solid border-border-light mt-4">
          <Button
            variant="outline"
            disabled={posts.isSaving}
            onClick={() => posts.setArchiveTarget(undefined)}
          >
            Hủy
          </Button>
          <Button
            variant="destructive"
            loading={posts.isSaving}
            onClick={() => void posts.archive()}
          >
            Xóa khỏi danh sách
          </Button>
        </footer>
      </Modal>
    </section>
  );
}

function MentorPostCard({
  post,
  onEdit,
  onArchive,
}: {
  post: MentorBlogPostDetailResponse;
  onEdit: () => void;
  onArchive: () => void;
}) {
  const preview = post.contentMarkdown?.trim() || post.excerpt?.trim();
  return (
    <article className="bg-white p-6 rounded-2xl border border-solid border-border-light shadow-xs hover:border-primary-border/60 transition-all flex flex-col gap-3">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <Badge variant="info">{post.status === 'PUBLISHED' ? 'Đã đăng' : 'Bản nháp'}</Badge>
          <span className="flex items-center gap-1">
            <CalendarDays className="w-4 h-4 text-text-muted" aria-hidden="true" />
            {formatPostDate(post.publishedAt || post.updatedAt || post.createdAt)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {post.status === 'DRAFT' && (
            <Button variant="secondary" size="sm" leftIcon={<Pencil />} onClick={onEdit}>
              Chỉnh sửa
            </Button>
          )}
          <Button variant="destructive" size="sm" leftIcon={<Trash2 />} onClick={onArchive}>
            Xóa
          </Button>
        </div>
      </header>
      <h2 className="text-base font-bold text-text-main m-0">{post.title}</h2>
      {preview && <p className="text-xs text-text-secondary leading-relaxed line-clamp-3 m-0">{preview}</p>}
      {(post.categories?.length || post.tags?.length) && (
        <footer className="flex flex-wrap gap-1.5 pt-2 border-t border-solid border-border-light">
          {post.categories?.map((category) => (
            <span key={category.id} className="px-2.5 py-0.5 rounded-full bg-surface-subtle text-[11px] font-semibold text-text-secondary border border-solid border-border-color">{category.name}</span>
          ))}
          {post.tags?.map((tag) => (
            <span key={tag.id} className="px-2.5 py-0.5 rounded-full bg-surface-subtle text-[11px] font-semibold text-text-secondary border border-solid border-border-color">#{tag.name}</span>
          ))}
        </footer>
      )}
    </article>
  );
}
