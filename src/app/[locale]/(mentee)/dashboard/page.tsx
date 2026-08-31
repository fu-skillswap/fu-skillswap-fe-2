/**
 * @file page.tsx
 * @description Route Bảng tin cộng đồng Mentee (`/[locale]/dashboard`).
 * Tải danh sách bài viết thảo luận và tin nổi bật từ `postRepo` để render giao diện Bảng tin.
 */

import { PostCard } from '@/components/domain/post-card/PostCard';
import { dashboardStories } from '@/data/demoMentors';
import { postRepo } from '@/repositories/postRepo';

/**
 * Server Component cho trang Bảng tin chính.
 */
export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const [{ locale }, posts] = await Promise.all([params, postRepo.list()]);
  return (
    <section className="space-y-6 max-w-2xl mx-auto py-2" aria-label="Community posts">
      {/* Instagram / Facebook Style Story Bar */}
      <div className="bg-white rounded-3xl p-4 border border-solid border-border-light shadow-xs overflow-hidden" aria-label="Community stories & ads">
        <div className="flex items-center gap-4 overflow-x-auto pb-1 scrollbar-none">
          {/* Add Story Button */}
          <div className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group">
            <div className="relative w-15 h-15 rounded-full p-0.5 border-2 border-dashed border-primary/60 flex items-center justify-center bg-primary-light group-hover:scale-105 transition-all">
              <span className="text-primary font-black text-xl">+</span>
            </div>
            <span className="text-xs font-bold text-text-main text-center truncate max-w-[70px]">Tạo tin</span>
          </div>

          {/* User & Ad Stories */}
          {dashboardStories.map((person) => {
            const initials = person.name
              .split(' ')
              .map((part) => part[0])
              .slice(0, 2)
              .join('');
            return (
              <div className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group" key={person.id}>
                <div
                  className={`p-0.5 rounded-full shadow-xs group-hover:scale-105 transition-all ${
                    person.isAd
                      ? 'bg-gradient-to-tr from-blue-600 to-indigo-600'
                      : 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600'
                  }`}
                >
                  <div className="w-14 h-14 rounded-full bg-white p-0.5 flex items-center justify-center">
                    {person.avatarUrl ? (
                      <img
                        src={person.avatarUrl}
                        alt={person.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="w-full h-full rounded-full bg-primary-light text-primary font-black text-xs flex items-center justify-center">
                        {initials}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs font-semibold text-text-main text-center truncate max-w-[70px]">
                  {person.isAd ? 'Quảng cáo' : person.name.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feed Posts (Instagram layout) */}
      <div className="flex flex-col gap-6">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} locale={locale} />
        ))}
      </div>
    </section>
  );
}
