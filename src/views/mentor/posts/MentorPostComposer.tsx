/**
 * @file MentorPostComposer.tsx
 * @description Trang soạn bài Blog của Mentor: thanh công cụ định dạng, chèn ảnh đúng vị trí con trỏ,
 * xem trước như người đọc và cột thiết lập (ảnh bìa, chủ đề, thẻ, quyền xem).
 * Lưu nháp / đăng bài dùng nguyên luồng của useMentorPosts.
 */

'use client';

import { ArrowLeft, ImagePlus, Lightbulb } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState, type DragEvent } from 'react';
import {
  BlogMarkdown,
  formatImageBlock,
  parseImageBlock,
  stripFormatting,
} from '@/components/domain/blog/BlogMarkdown';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { SelectField } from '@/components/ui/SelectField';
import type { BlogCategoryResponse, BlogTagResponse, MentorBlogVisibility } from '@/models/auth';
import { mentorPostRepo } from '@/repositories/mentorPostRepo';
import { confirmAction, showError } from '@/utils/toast';
import { EditorToolbar } from './editor/EditorToolbar';
import { ImageBlockToolbar } from './editor/ImageBlockToolbar';
import { ACCEPTED_IMAGE_TYPES, useInlineImageUpload } from './editor/useInlineImageUpload';
import { useMarkdownEditor } from './editor/useMarkdownEditor';
import type { MentorPostsController } from './useMentorPosts';

const VISIBILITY_OPTIONS = [
  { value: 'PUBLIC', label: 'Công khai' },
  { value: 'AUTHENTICATED', label: 'Người dùng đã đăng nhập' },
  { value: 'BOOKED_MEMBERS', label: 'Mentee đã đặt dịch vụ' },
];

const LAYOUT_STORAGE_KEY = 'skillswap.blog-editor.layout';
const WORDS_PER_MINUTE = 220;

const READABILITY_TIPS = [
  'Chia bài bằng Tiêu đề mục, chúng sẽ thành mục lục cho người đọc.',
  'Cứ 3–4 đoạn nên có một ảnh, ô ghi chú hoặc danh sách.',
  'Viết chú thích cho ảnh để người đọc hiểu vì sao có ảnh đó.',
];

function mentorBlogVisibilityOf(value: string): MentorBlogVisibility {
  if (value === 'AUTHENTICATED' || value === 'BOOKED_MEMBERS') return value;
  return 'PUBLIC';
}

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);
  return debounced;
}

function readLayout(): 'split' | 'write' {
  try {
    return window.localStorage.getItem(LAYOUT_STORAGE_KEY) === 'write' ? 'write' : 'split';
  } catch {
    return 'split';
  }
}

function formatTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(date);
}

const hasFiles = (event: DragEvent) => Array.from(event.dataTransfer.types).includes('Files');

export function MentorPostComposer({ posts }: { posts: MentorPostsController }) {
  const form = posts.form;
  const editor = useMarkdownEditor(form);
  const images = useInlineImageUpload(editor);
  const [categories, setCategories] = useState<BlogCategoryResponse[]>([]);
  const [tags, setTags] = useState<BlogTagResponse[]>([]);
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string>();
  const [layout, setLayout] = useState<'split' | 'write'>('split');
  const [mobileTab, setMobileTab] = useState<'write' | 'preview'>('write');
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [activeImage, setActiveImage] = useState<{ line: number; top: number }>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLTextAreaElement | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const title = form.watch('title') ?? '';
  const content = form.watch('contentMarkdown') ?? '';
  const previewContent = useDebouncedValue(content, 150);
  const isDirty = form.formState.isDirty;
  const isBusy = images.isUploading || isCoverUploading;
  const editingPost = posts.editingPost;
  const coverUrl = coverPreviewUrl ?? editingPost?.coverImageUrl ?? undefined;

  const wordCount = stripFormatting(previewContent).split(' ').filter(Boolean).length;
  const readingMinutes = Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));

  // useMentorPosts closes the composer after a save, so the saved time comes from the reopened draft.
  const statusText = isDirty
    ? 'Chưa lưu thay đổi'
    : editingPost?.status === 'DRAFT' && editingPost.updatedAt
      ? `Đã lưu nháp lúc ${formatTime(editingPost.updatedAt)}`
      : '';

  useEffect(() => {
    setLayout(readLayout());
    void mentorPostRepo
      .categories()
      .then(setCategories)
      .catch((reason) =>
        showError(reason, {
          title: 'Không thể tải chủ đề bài viết',
          description: 'Bạn vẫn có thể tiếp tục soạn và lưu bản nháp.',
        }),
      );
    // Tags are optional: without them the section stays hidden.
    void mentorPostRepo
      .tags()
      .then(setTags)
      .catch(() => setTags([]));
  }, []);

  // Free the local cover preview when it changes or the composer closes.
  useEffect(
    () => () => {
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    },
    [coverPreviewUrl],
  );

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  // Auto-grow the title field.
  useLayoutEffect(() => {
    const field = titleRef.current;
    if (!field) return;
    field.style.height = 'auto';
    field.style.height = `${field.scrollHeight}px`;
  }, [title]);

  // Keep the image toolbar next to its figure as the preview re-renders.
  useLayoutEffect(() => {
    if (!activeImage) return;
    const figure = previewRef.current?.querySelector<HTMLElement>(
      `figure[data-line="${activeImage.line}"]`,
    );
    if (!figure) {
      setActiveImage(undefined);
      return;
    }
    if (figure.offsetTop !== activeImage.top) {
      setActiveImage({ line: activeImage.line, top: figure.offsetTop });
    }
  }, [activeImage, previewContent]);

  const changeLayout = (next: 'split' | 'write') => {
    setLayout(next);
    try {
      window.localStorage.setItem(LAYOUT_STORAGE_KEY, next);
    } catch {
      // Storage can be blocked; the choice then lasts for this visit only.
    }
  };

  const goBack = async () => {
    if (
      isDirty &&
      !(await confirmAction({
        title: 'Rời trang soạn bài?',
        message: 'Bạn có thay đổi chưa lưu. Rời trang?',
        confirmText: 'Rời trang',
        cancelText: 'Ở lại',
        variant: 'warning',
      }))
    ) {
      return;
    }
    posts.closeEditor();
  };

  const uploadCover = async (file?: File) => {
    if (!file) return;
    setIsCoverUploading(true);
    try {
      const intent = await mentorPostRepo.createUploadIntent({
        filename: file.name,
        contentType: file.type,
      });
      await mentorPostRepo.uploadFile(intent, file);
      const asset = await mentorPostRepo.confirmUpload(intent.uploadIntentId);
      form.setValue('coverAssetId', asset.assetId, { shouldDirty: true });
      setCoverPreviewUrl(URL.createObjectURL(file));
    } catch (reason) {
      showError(reason, {
        title: 'Không thể tải ảnh lên',
        description: 'Vui lòng chọn ảnh khác hoặc thử lại.',
      });
    } finally {
      setIsCoverUploading(false);
    }
  };

  const openImageToolbar = (target: EventTarget) => {
    const figure = (target as HTMLElement).closest<HTMLElement>('figure[data-line]');
    if (!figure) return;
    setActiveImage({ line: Number(figure.dataset.line), top: figure.offsetTop });
  };

  // The toolbar edits the live content; it only shows while that line is still an image block.
  const activeLine = activeImage ? content.split('\n')[activeImage.line] : undefined;
  const activeBlock = activeLine !== undefined ? parseImageBlock(activeLine) : undefined;

  const contentField = form.register('contentMarkdown');
  const titleField = form.register('title');
  const showWrite = mobileTab === 'write';
  const isSplit = layout === 'split';

  const coverInput = (
    <input
      type="file"
      accept="image/*"
      className="sr-only"
      disabled={isCoverUploading}
      onChange={(event) => void uploadCover(event.target.files?.[0])}
    />
  );

  return (
    <form
      className="mx-auto w-full max-w-[1240px] space-y-5"
      onSubmit={posts.submitDraft}
      noValidate
    >
      <header className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void goBack()}
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-solid border-border-light bg-white text-text-secondary hover:border-primary-border hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Quay lại danh sách bài viết"
        >
          <ArrowLeft className="h-4.5 w-4.5" aria-hidden="true" />
        </button>
        <h1 className="m-0 text-xl font-extrabold text-text-main">
          {editingPost ? 'Chỉnh sửa bài viết' : 'Tạo bài viết'}
        </h1>
        <p
          className={`m-0 text-xs font-semibold ${isDirty ? 'text-amber-700' : 'text-emerald-700'}`}
          aria-live="polite"
        >
          {statusText}
        </p>
        <div className="ml-auto flex gap-2">
          <Button type="submit" variant="outline" loading={posts.isSaving} disabled={isBusy}>
            Lưu bản nháp
          </Button>
          <Button
            type="button"
            loading={posts.isSaving}
            disabled={isBusy}
            onClick={() => void posts.submitPublish()}
          >
            Đăng bài
          </Button>
        </div>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0 rounded-[20px] border border-solid border-border-light bg-white shadow-xs">
          <div className="space-y-4 p-5 sm:p-6">
            <div>
              <label htmlFor="mentor-post-title" className="text-xs font-semibold text-text-muted">
                Tiêu đề
              </label>
              <textarea
                id="mentor-post-title"
                rows={1}
                maxLength={220}
                placeholder="Ví dụ: 5 cách cải thiện kỹ năng thuyết trình cho sinh viên"
                aria-invalid={Boolean(form.formState.errors.title)}
                {...titleField}
                ref={(element) => {
                  titleField.ref(element);
                  titleRef.current = element;
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') event.preventDefault();
                }}
                className="mt-1 block w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-[26px] font-extrabold leading-tight text-text-main outline-none placeholder:text-text-muted/60"
              />
              {form.formState.errors.title && (
                <p className="m-0 mt-1 text-xs font-medium text-red-600" role="alert">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="mentor-post-excerpt"
                className="text-xs font-semibold text-text-muted"
              >
                Mô tả ngắn, hiện dưới tiêu đề
              </label>
              <textarea
                id="mentor-post-excerpt"
                rows={2}
                maxLength={500}
                placeholder="Tóm tắt giá trị chính người đọc sẽ nhận được"
                {...form.register('excerpt')}
                className="mt-1 block w-full resize-y border-0 bg-transparent p-0 text-[15px] leading-6 text-text-secondary outline-none placeholder:text-text-muted/60"
              />
              {form.formState.errors.excerpt && (
                <p className="m-0 mt-1 text-xs font-medium text-red-600" role="alert">
                  {form.formState.errors.excerpt.message}
                </p>
              )}
            </div>
          </div>

          <EditorToolbar
            editor={editor}
            onPickImage={() => fileInputRef.current?.click()}
            isLinkOpen={isLinkOpen}
            onLinkOpenChange={setIsLinkOpen}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            multiple
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => {
              if (event.target.files) images.uploadFiles(event.target.files);
              event.target.value = '';
            }}
          />

          <div
            className="flex border-0 border-b border-solid border-border-light lg:hidden"
            role="tablist"
            aria-label="Chế độ soạn bài"
          >
            {(
              [
                ['write', 'Soạn'],
                ['preview', 'Xem trước'],
              ] as const
            ).map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={mobileTab === tab}
                onClick={() => setMobileTab(tab)}
                className={`min-h-11 flex-1 cursor-pointer border-0 border-b-2 border-solid bg-transparent text-sm font-bold ${
                  mobileTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className={`grid ${isSplit ? 'lg:grid-cols-2' : ''}`}>
            <div
              className={`relative min-w-0 p-4 sm:p-5 ${showWrite ? '' : 'hidden'} lg:block ${
                isSplit ? 'lg:border-0 lg:border-r lg:border-solid lg:border-border-light' : ''
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <label htmlFor="mentor-post-content" className="text-xs font-bold text-text-main">
                  Soạn
                </label>
                <div className="hidden gap-1 rounded-lg bg-surface-subtle p-0.5 lg:flex">
                  {(
                    [
                      ['split', 'Soạn + xem trước'],
                      ['write', 'Chỉ soạn'],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={layout === value}
                      onClick={() => changeLayout(value)}
                      className={`h-7 cursor-pointer rounded-md border-0 px-2.5 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        layout === value
                          ? 'bg-white text-text-main shadow-xs'
                          : 'bg-transparent text-text-muted'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                id="mentor-post-content"
                placeholder="Chia sẻ kinh nghiệm, câu chuyện hoặc kiến thức của bạn…"
                {...contentField}
                ref={(element) => {
                  contentField.ref(element);
                  editor.textareaRef.current = element;
                }}
                onKeyDown={(event) => editor.onKeyDown(event, () => setIsLinkOpen(true))}
                onPaste={(event) => {
                  const files = Array.from(event.clipboardData.files).filter((file) =>
                    file.type.startsWith('image/'),
                  );
                  if (!files.length) return;
                  event.preventDefault();
                  images.uploadFiles(files);
                }}
                onDragOver={(event) => {
                  if (!hasFiles(event)) return;
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(event) => {
                  if (!hasFiles(event)) return;
                  event.preventDefault();
                  setIsDragging(false);
                  images.uploadFiles(event.dataTransfer.files);
                }}
                className="block min-h-[420px] w-full resize-y rounded-xl border border-solid border-border-color bg-white p-3.5 font-mono text-[14.5px] leading-[1.85] text-text-main outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 lg:min-h-[560px]"
              />
              {isDragging && (
                <div
                  className="pointer-events-none absolute inset-x-4 bottom-4 top-12 flex items-center justify-center rounded-xl border-2 border-dashed border-primary bg-primary-light/85 p-4 text-center text-sm font-bold text-primary sm:inset-x-5 sm:bottom-5"
                  aria-hidden="true"
                >
                  Thả ảnh vào đây để chèn đúng vị trí này
                </div>
              )}
              {form.formState.errors.contentMarkdown && (
                <p className="m-0 mt-1 text-xs font-medium text-red-600" role="alert">
                  {form.formState.errors.contentMarkdown.message}
                </p>
              )}
            </div>

            <div
              className={`min-w-0 p-4 sm:p-5 ${showWrite ? 'hidden' : ''} ${
                isSplit ? 'lg:block' : 'lg:hidden'
              }`}
            >
              <p className="m-0 mb-2 text-xs font-bold text-text-main">Xem trước như người đọc</p>
              <div
                ref={previewRef}
                className="relative min-h-[200px] rounded-xl bg-white px-5 py-1"
                onClick={(event) => openImageToolbar(event.target)}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' && event.key !== ' ') return;
                  const figure = (event.target as HTMLElement).closest('figure[data-line]');
                  if (!figure) return;
                  event.preventDefault();
                  openImageToolbar(figure);
                }}
              >
                {previewContent.trim() ? (
                  <BlogMarkdown content={previewContent} variant="preview" />
                ) : (
                  <p className="text-sm text-text-muted">Nội dung xem trước sẽ hiện ở đây.</p>
                )}
                {activeImage && activeBlock && (
                  <div
                    className="absolute left-1/2 z-10 -translate-x-1/2"
                    style={{ top: Math.max(0, activeImage.top - 52) }}
                  >
                    <ImageBlockToolbar
                      block={activeBlock}
                      onChange={(block) =>
                        editor.replaceLine(activeImage.line, formatImageBlock(block))
                      }
                      onDelete={() => {
                        editor.replaceLine(activeImage.line, null);
                        setActiveImage(undefined);
                      }}
                      onClose={() => setActiveImage(undefined)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-2 border-0 border-t border-solid border-border-light px-5 py-3 text-xs text-text-muted">
            <span>
              Kéo thả, dán ảnh (Ctrl+V) hoặc bấm Chèn ảnh: ảnh nằm đúng chỗ con trỏ đang đứng.
            </span>
            <span>
              {wordCount.toLocaleString('vi-VN')} chữ · khoảng {readingMinutes} phút đọc
            </span>
          </footer>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <section className="space-y-4 rounded-[20px] border border-solid border-border-light bg-white p-5 shadow-xs">
            <div>
              <p className="m-0 mb-2 text-xs font-bold text-text-main">Ảnh bìa</p>
              {coverUrl ? (
                <div className="relative overflow-hidden rounded-xl">
                  <img
                    src={coverUrl}
                    alt="Ảnh bìa hiện tại"
                    className="block aspect-[16/7] w-full object-cover"
                  />
                  <label className="absolute bottom-2 right-2 inline-flex min-h-9 cursor-pointer items-center rounded-lg bg-white/95 px-3 text-xs font-bold text-text-main shadow-xs focus-within:ring-2 focus-within:ring-primary">
                    {isCoverUploading ? 'Đang tải…' : 'Đổi ảnh'}
                    {coverInput}
                  </label>
                </div>
              ) : (
                <label className="flex aspect-[16/7] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-primary-border bg-primary-light/30 text-xs font-bold text-primary hover:bg-primary-light focus-within:ring-2 focus-within:ring-primary">
                  <ImagePlus className="h-5 w-5" aria-hidden="true" />
                  {isCoverUploading ? 'Đang tải ảnh…' : 'Thêm ảnh bìa'}
                  {coverInput}
                </label>
              )}
              <p className="m-0 mt-2 text-[11px] leading-4 text-text-muted">
                Tỉ lệ 16:7, nên tránh ảnh có chữ to vì sẽ lặp với tiêu đề.
              </p>
            </div>

            <SelectField
              id="mentor-post-category"
              label="Chủ đề"
              value={form.watch('categoryIds')?.[0]}
              options={categories.map((category) => ({
                value: category.id,
                label: category.name,
              }))}
              placeholder="Chọn chủ đề phù hợp"
              onValueChange={(value) =>
                form.setValue('categoryIds', [value], { shouldDirty: true })
              }
            />

            {/* TODO(api): no endpoint to create new tags; mentors can only pick existing ones. */}
            {tags.length > 0 && (
              <fieldset className="m-0 border-0 p-0">
                <legend className="mb-1.5 p-0 text-xs font-semibold text-text-secondary">
                  Thẻ
                </legend>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => {
                    const selected = (form.watch('tagIds') ?? []).includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          const current = form.getValues('tagIds') ?? [];
                          form.setValue(
                            'tagIds',
                            selected ? current.filter((id) => id !== tag.id) : [...current, tag.id],
                            { shouldDirty: true },
                          );
                        }}
                        className={`min-h-8 cursor-pointer rounded-full border border-solid px-3 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          selected
                            ? 'border-primary-border bg-primary-light text-sky-800'
                            : 'border-border-light bg-white text-text-secondary'
                        }`}
                      >
                        #{tag.name}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            <FormField label="Ai có thể xem" htmlFor="mentor-post-visibility">
              <SelectField
                id="mentor-post-visibility"
                value={form.watch('visibility')}
                options={VISIBILITY_OPTIONS}
                onValueChange={(value) =>
                  form.setValue('visibility', mentorBlogVisibilityOf(value), {
                    shouldDirty: true,
                  })
                }
              />
            </FormField>
          </section>

          <section className="rounded-[20px] border border-solid border-border-light bg-white p-5 shadow-xs">
            <h2 className="m-0 flex items-center gap-2 text-sm font-extrabold text-text-main">
              <Lightbulb className="h-4 w-4 text-amber-600" aria-hidden="true" />
              Trình bày cho dễ đọc
            </h2>
            <ul className="m-0 mt-3 space-y-2 pl-4 text-xs leading-5 text-text-secondary">
              {READABILITY_TIPS.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </form>
  );
}
