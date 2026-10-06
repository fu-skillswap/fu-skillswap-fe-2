import { Award, MessageCircleHeart, Network, Presentation } from 'lucide-react';

const items = [
  [
    MessageCircleHeart,
    'Chia sẻ kinh nghiệm, giúp đỡ các bạn sinh viên FPT khác',
    'bg-pink-50 text-pink-600',
  ],
  [Network, 'Xây dựng thương hiệu cá nhân và mở rộng mạng lưới', 'bg-sky-50 text-sky-600'],
  [
    Presentation,
    'Rèn luyện kỹ năng giao tiếp, mentoring và lãnh đạo',
    'bg-purple-50 text-purple-600',
  ],
  [Award, 'Nhận huy hiệu Mentor trên SkillSwap', 'bg-amber-50 text-amber-600'],
] as const;

export function MentorBenefitsCard() {
  return (
    <aside className="rounded-2xl border border-sky-100 bg-sky-50/70 p-5 shadow-sm">
      <h2 className="m-0 text-base font-bold text-slate-900">Khi trở thành Mentor, bạn sẽ:</h2>
      <div className="mt-4 space-y-4">
        {items.map(([Icon, text, tone]) => (
          <div key={text} className="flex items-start gap-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <p className="m-0 text-sm font-medium leading-6 text-slate-700">{text}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}
