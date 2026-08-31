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
    <section className="mentor-posts-page">
      <header className="mentor-posts-header">
        <div>
          <h1>Bài viết của tôi</h1>
          <p>
            {posts.counts.published} đã đăng <span>·</span> {posts.counts.draft} bản nháp
          </p>
        </div>
        <Button leftIcon={<Plus />} onClick={posts.openCreate}>
          Bài viết mới
        </Button>
      </header>

      {posts.error && (
        <div className="mentor-posts-error" role="alert">
          <span>{posts.error}</span>
          <Button variant="outline" size="sm" onClick={() => void posts.refresh()}>
            Thử lại
          </Button>
        </div>
      )}

      {posts.isLoading ? (
        <div className="mentor-posts-list" aria-label="Đang tải bài viết">
          {[1, 2, 3].map((item) => (
            <div className="mentor-post-skeleton" key={item} />
          ))}
        </div>
      ) : posts.posts.length ? (
        <div className="mentor-posts-list">
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
        <div className="mentor-posts-empty">
          <FileText aria-hidden="true" />
          <strong>Bạn chưa có bài viết nào.</strong>
          <span>Chia sẻ kinh nghiệm, kiến thức hoặc góc nhìn của bạn với mentee.</span>
          <Button leftIcon={<Plus />} onClick={posts.openCreate}>
            Tạo bài viết đầu tiên
          </Button>
        </div>
      )}

      <Modal
        open={posts.isEditorOpen}
        onClose={posts.closeEditor}
        title={posts.editingPost ? 'Chỉnh sửa bản nháp' : 'Tạo bài viết mới'}
        className="mentor-post-editor-modal"
      >
        <form className="mentor-post-editor" onSubmit={posts.submitDraft} noValidate>
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
          <footer className="mentor-post-editor-footer">
            <Button type="button" variant="outline" onClick={posts.closeEditor}>
              Hủy
            </Button>
            <div>
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
        className="mentor-post-confirm-modal"
      >
        <div className="mentor-post-confirm-content">
          <Archive aria-hidden="true" />
          <p>Bài viết sẽ được chuyển vào lưu trữ theo chính sách hiện tại của hệ thống.</p>
        </div>
        <footer className="mentor-post-confirm-footer">
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
    <article className="mentor-post-card">
      <header className="mentor-post-card-header">
        <div className="mentor-post-meta">
          <Badge variant="info">{post.status === 'PUBLISHED' ? 'Đã đăng' : 'Bản nháp'}</Badge>
          <span>
            <CalendarDays aria-hidden="true" />
            {formatPostDate(post.publishedAt || post.updatedAt || post.createdAt)}
          </span>
        </div>
        <div className="mentor-post-actions">
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
      <h2>{post.title}</h2>
      {preview && <p className="mentor-post-preview">{preview}</p>}
      {(post.categories?.length || post.tags?.length) && (
        <footer className="mentor-post-taxonomy">
          {post.categories?.map((category) => (
            <span key={category.id}>{category.name}</span>
          ))}
          {post.tags?.map((tag) => (
            <span key={tag.id}>#{tag.name}</span>
          ))}
        </footer>
      )}
    </article>
  );
}
