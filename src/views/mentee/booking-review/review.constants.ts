/**
 * @file review.constants.ts
 * @description Editable copy for the session review: the word for each star and the tag chips.
 */

export const REVIEW_MAX_STARS = 5;
export const REVIEW_COMMENT_MAX_LENGTH = 500;

/** Label shown next to the stars, index = rating - 1. */
export const RATING_WORDS = [
  'Không như mong đợi',
  'Chưa ổn',
  'Tạm được',
  'Tốt',
  'Rất tuyệt',
] as const;

export const RATING_EMPTY_LABEL = 'Chọn số sao';

/** Ratings at or below this value get the "Báo sự cố" note. */
export const REVIEW_INCIDENT_MAX_RATING = 2;

/** Ratings at or above this value use the positive tag group. */
export const REVIEW_POSITIVE_MIN_RATING = 4;

export const REVIEW_TAG_GROUPS = {
  positive: {
    question: 'Bạn thích điều gì?',
    tags: [
      'Giải thích dễ hiểu',
      'Đúng giờ',
      'Chuẩn bị kỹ',
      'Có bài tập, tài liệu',
      'Kinh nghiệm thực tế',
      'Thân thiện, dễ hỏi',
    ],
  },
  negative: {
    question: 'Điều gì chưa ổn?',
    tags: [
      'Vào trễ',
      'Giải thích khó hiểu',
      'Chưa đúng nội dung đã đặt',
      'Mạng, âm thanh kém',
      'Kết thúc sớm',
      'Thiếu chuẩn bị',
    ],
  },
} as const;

export type ReviewTagGroup = keyof typeof REVIEW_TAG_GROUPS;

export const tagGroupOf = (rating: number): ReviewTagGroup =>
  rating >= REVIEW_POSITIVE_MIN_RATING ? 'positive' : 'negative';

/** "Đánh giá 4 sao, tốt" */
export function starAriaLabel(rating: number) {
  const word = RATING_WORDS[rating - 1] ?? '';
  return `Đánh giá ${rating} sao, ${word.charAt(0).toLowerCase()}${word.slice(1)}`;
}

/** Parses `?rating=` into 1–5, or `0` when missing/invalid. */
export function parseRatingParam(value?: string | null) {
  const rating = Number(value);
  return Number.isInteger(rating) && rating >= 1 && rating <= REVIEW_MAX_STARS ? rating : 0;
}
