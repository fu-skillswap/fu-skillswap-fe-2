/**
 * @file MenteeQuestionModal.tsx
 * @description Modal đăng câu hỏi nhanh bằng Forum API dành cho Mentee.
 */

'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { CheckCircle2, Lightbulb, MessageSquareText, Send, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextArea } from '@/components/ui/TextArea';
import { TextField } from '@/components/ui/TextField';
import type { ForumPostResponse, ForumTopicResponse } from '@/models/auth';
import {
  forumQuestionSchema,
  type ForumQuestionFormValues,
} from '@/models/schemas/forumQuestionSchema';
import { postRepo } from '@/repositories/postRepo';
import { showError, showSuccess } from '@/utils/toast';

const EMPTY_QUESTION: ForumQuestionFormValues = {
  title: '',
  content: '',
  forumTopicId: '',
};

export function MenteeQuestionModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (post: ForumPostResponse) => void;
}) {
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [topics, setTopics] = useState<ForumTopicResponse[]>([]);
  const form = useForm<ForumQuestionFormValues>({
    resolver: yupResolver(forumQuestionSchema),
    defaultValues: EMPTY_QUESTION,
    mode: 'onChange',
  });
  const title = form.watch('title') ?? '';
  const content = form.watch('content') ?? '';

  useEffect(() => {
    if (!open) return;
    let active = true;
    setIsLoadingTopics(true);
    void postRepo
      .listTopics()
      .then((items) => {
        if (!active) return;
        const ordered = [...items].sort(
          (left, right) => (left.displayOrder ?? 0) - (right.displayOrder ?? 0),
        );
        setTopics(ordered);
        const questionTopic = ordered.find((topic) => topic.code === 'QUESTION');
        if (questionTopic) {
          form.setValue('forumTopicId', questionTopic.id, {
            shouldValidate: true,
          });
        } else {
          showError('Chủ đề hỏi đáp hiện chưa khả dụng.', {
            title: 'Chưa thể đăng câu hỏi',
          });
        }
      })
      .catch((reason) => {
        showError(reason, {
          title: 'Không thể tải chủ đề',
          description: 'Vui lòng đóng cửa sổ và thử lại.',
        });
      })
      .finally(() => active && setIsLoadingTopics(false));
    return () => {
      active = false;
    };
  }, [form, open]);

  useEffect(() => {
    if (!open) {
      form.reset(EMPTY_QUESTION);
      setTopics([]);
    }
  }, [form, open]);

  const submit = form.handleSubmit(async (values) => {
    try {
      const created = await postRepo.create({
        title: values.title.trim(),
        content: values.content.trim(),
        forumTopicId: values.forumTopicId,
      });
      onCreated(created);
      showSuccess({
        title: 'Câu hỏi của bạn đã được đăng.',
        description: 'Cộng đồng SkillSwap có thể bắt đầu thảo luận cùng bạn.',
      });
      onClose();
    } catch (reason) {
      showError(reason, {
        title: 'Không thể đăng câu hỏi',
        description: 'Vui lòng kiểm tra nội dung và thử lại.',
      });
    }
  });

  return (
    <Modal
      open={open}
      onClose={() => !form.formState.isSubmitting && onClose()}
      title="Đăng câu hỏi"
      hideHeader
      className="max-h-[calc(100dvh-48px)] max-w-[840px] max-sm:h-[calc(100dvh-8px)] max-sm:max-h-[calc(100dvh-8px)] max-sm:self-end max-sm:rounded-b-none"
      contentClassName="!p-0"
      overlayClassName="backdrop-blur-[2px] max-sm:!items-end max-sm:!p-0"
    >
      <form className="flex min-h-0 flex-1 flex-col" onSubmit={submit} noValidate>
        <header className="flex min-h-[76px] shrink-0 items-center justify-between gap-4 border-b border-solid border-border-light px-5 py-3.5 sm:px-7">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
              <MessageSquareText className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="m-0 text-lg font-extrabold text-text-main">Đăng câu hỏi</h2>
              <p className="mb-0 mt-0.5 text-xs text-text-secondary">
                Nhận hỗ trợ từ mentor phù hợp
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={form.formState.isSubmitting}
            className="flex h-9 w-9 items-center justify-center rounded-xl border-none bg-transparent text-text-muted hover:bg-surface-subtle hover:text-text-main"
            aria-label="Đóng cửa sổ đăng câu hỏi"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-7 sm:py-5">
          <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-primary-light/60 px-3.5 py-3 text-xs leading-5 text-text-secondary">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
            <span>
              <strong className="font-bold text-text-main">Mẹo nhỏ:</strong> Hỏi rõ bối cảnh + điều
              bạn đã thử để mentor hỗ trợ tốt hơn.
            </span>
          </div>

          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="space-y-4">
              <div className="relative pb-4">
                <TextField
                  autoFocus
                  label="Tiêu đề câu hỏi"
                  required
                  maxLength={200}
                  placeholder="Ví dụ: Làm sao để cải thiện kỹ năng thuyết trình?"
                  helperText="Tiêu đề ngắn gọn, mô tả rõ vấn đề chính của bạn."
                  error={form.formState.errors.title?.message}
                  {...form.register('title')}
                />
                <span className="absolute bottom-0 right-0 text-[10px] text-text-muted">
                  {title.length}/200
                </span>
              </div>

              <div className="relative pb-4">
                <TextArea
                  label="Mô tả vấn đề của bạn"
                  required
                  rows={6}
                  maxLength={5000}
                  placeholder="Hãy chia sẻ chi tiết về bối cảnh, những gì bạn đã thử và điều bạn đang gặp khó khăn…"
                  helperText="Càng chi tiết, mentor càng dễ đưa ra gợi ý phù hợp."
                  className="min-h-[144px] resize-y"
                  error={form.formState.errors.content?.message}
                  {...form.register('content')}
                />
                <span className="absolute bottom-0 right-0 text-[10px] text-text-muted">
                  {content.length}/5000
                </span>
              </div>

              <label className="block text-xs font-semibold text-text-secondary">
                Chủ đề <span className="text-danger">*</span>
                <select
                  {...form.register('forumTopicId')}
                  disabled={isLoadingTopics}
                  className="mt-2 h-11 w-full rounded-xl border border-solid border-border-light bg-white px-3 text-sm text-text-main outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-wait disabled:bg-surface-subtle"
                >
                  <option value="">
                    {isLoadingTopics ? 'Đang tải chủ đề…' : 'Chọn chủ đề phù hợp'}
                  </option>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.nameVi}
                    </option>
                  ))}
                </select>
                {form.formState.errors.forumTopicId && (
                  <span className="mt-1.5 block text-xs font-medium text-danger">
                    {form.formState.errors.forumTopicId.message}
                  </span>
                )}
              </label>
            </div>

            <QuestionGuidancePanel />
            <details className="rounded-2xl border border-solid border-primary/10 bg-primary-light/40 p-4 lg:hidden">
              <summary className="cursor-pointer text-xs font-bold text-text-main">
                Gợi ý đặt câu hỏi hiệu quả
              </summary>
              <GuidanceItems className="mt-4" />
            </details>
          </div>
        </div>

        <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-solid border-border-light bg-white px-5 py-4 sm:px-7">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={form.formState.isSubmitting}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            size="lg"
            leftIcon={<Send />}
            loading={form.formState.isSubmitting}
            disabled={!form.formState.isValid || isLoadingTopics}
          >
            {form.formState.isSubmitting ? 'Đang đăng…' : 'Đăng câu hỏi'}
          </Button>
        </footer>
      </form>
    </Modal>
  );
}

const GUIDANCE_ITEMS = [
  {
    title: 'Bối cảnh ngắn gọn',
    description: 'Ví dụ: bạn đang học gì, mục tiêu là gì?',
  },
  {
    title: 'Bạn đã thử gì',
    description: 'Chia sẻ những cách bạn đã làm nhưng chưa hiệu quả.',
  },
  {
    title: 'Điều bạn cần mentor hỗ trợ',
    description: 'Hỏi rõ bạn cần gợi ý, tài liệu hay hướng dẫn cụ thể.',
  },
] as const;

function GuidanceItems({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-4 ${className}`.trim()}>
      {GUIDANCE_ITEMS.map((item) => (
        <div key={item.title} className="flex items-start gap-2.5">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="m-0 text-xs font-bold text-text-main">{item.title}</p>
            <p className="mb-0 mt-1 text-[11px] leading-4 text-text-muted">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function QuestionGuidancePanel() {
  return (
    <aside className="hidden overflow-hidden rounded-2xl border border-solid border-primary/10 bg-primary-light/40 p-4 lg:block">
      <h3 className="m-0 text-sm font-extrabold text-text-main">Câu hỏi tốt thường có:</h3>
      <GuidanceItems className="mt-4" />
      <Image
        src="/images/form.png"
        alt="Minh họa cách đặt câu hỏi rõ ràng"
        width={240}
        height={320}
        className="mx-auto mt-3 h-36 w-full object-contain object-top"
      />
    </aside>
  );
}
