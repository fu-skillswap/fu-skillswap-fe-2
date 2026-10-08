/**
 * @file koukouComment.ts
 * @description Nhận diện bình luận tự động của bot diễn đàn (KouKou / "SkillSwap AI").
 */

import type { Comment } from '@/models/entities';

/** Footer the AI forum bot appends (ai-skillswap app/prompts/forum.py). */
const BOT_FOOTER_MARKER = '— SkillSwap AI';

/**
 * True for the forum bot's comment. The backend will mark it with `authorRole: 'AI_BOT'`;
 * until then the footer line identifies it.
 */
export function isKouKouComment(comment: Pick<Comment, 'authorRole' | 'content'>) {
  return (
    comment.authorRole?.toUpperCase() === 'AI_BOT' ||
    comment.content.trimEnd().includes(BOT_FOOTER_MARKER)
  );
}

/** Removes the trailing "— SkillSwap AI 🤖 (…)" line (the footer is model-written, so match loosely). */
export function stripBotFooter(content: string) {
  const lines = content.trimEnd().split('\n');
  if (lines.length && lines[lines.length - 1].includes('SkillSwap AI')) lines.pop();
  return lines.join('\n').trimEnd();
}
