import { notFound } from "next/navigation";
import { PostDetailView } from "@/views/mentee/post-detail/PostDetailView";
import { postRepo } from "@/repositories/postRepo";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  try {
    const { post, comments } = await postRepo.findById(id);
    return (
      <PostDetailView post={post} initialComments={comments} locale={locale} />
    );
  } catch {
    notFound();
  }
}
