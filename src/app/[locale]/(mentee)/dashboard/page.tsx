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
    <section className="figma-feed" aria-label="Community posts">
      <div className="figma-stories" aria-label="Community members">
        {dashboardStories.map((person) => (
          <div className="figma-story" key={person.id}>
            <span className="figma-story-ring">
              <span className="figma-avatar">
                {person.name
                  .split(' ')
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join('')}
              </span>
            </span>
            <span>{person.name.split(' ')[0]}</span>
          </div>
        ))}
      </div>
      <div className="figma-post-list">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} locale={locale} />
        ))}
      </div>
    </section>
  );
}
