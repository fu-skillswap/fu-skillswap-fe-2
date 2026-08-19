import type { Post } from "@/models/entities";

const cvReviewComments = [
  {
    id: "comment-cv-thu",
    authorName: "Thu Ha",
    content: "Same experience! Her feedback is incredibly actionable.",
    createdAt: "3h ago",
  },
  {
    id: "comment-cv-alex",
    authorName: "Alex Kim",
    content: "Booked her last week, cannot recommend enough.",
    createdAt: "3h ago",
  },
];

/** Presentation-only feed records used to supply the visual density of the Figma demo. */
export const demoPosts: Post[] = [
  {
    id: "demo-cv-review",
    title: "CV Review with Sarah Chen",
    content:
      "Just had my first CV Review session with Sarah Chen and it was incredible. She pointed out things I had been missing for months. If you are targeting PM roles, she is the mentor to go to!",
    author: { id: "member-minh-duc", name: "Minh Duc" },
    tags: [],
    createdAt: "3h ago",
    likes: 47,
    commentCount: 2,
    previewComments: cvReviewComments,
    mediaUrl:
      "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=700&h=380&fit=crop&auto=format",
    showMascot: true,
    showTitle: false,
  },
  {
    id: "demo-pm-resume",
    title: "Three PM resume mistakes",
    content:
      "Top 3 mistakes I see on PM resumes:\n\n1. Listing responsibilities instead of outcomes\n2. No quantified impact (% growth, user numbers)\n3. Too much jargon, not enough story\n\nFix these and your response rate will jump.",
    author: { id: "mentor-sarah-chen", name: "Sarah Chen" },
    tags: ["Product Management", "Career Advice"],
    createdAt: "6h ago",
    likes: 182,
    commentCount: 1,
    previewComments: [
      {
        id: "comment-resume-minh",
        authorName: "Minh Duc",
        content: "This is gold. Fixing #2 right now.",
        createdAt: "6h ago",
      },
    ],
    showMascot: true,
    showTitle: false,
  },
  {
    id: "demo-system-design",
    title: "Preparing for system design interviews",
    content:
      "How do you all prepare for system design interviews? I have a senior backend role coming up and feeling overwhelmed. Any structured approach?",
    author: { id: "member-thu-ha", name: "Thu Ha" },
    tags: ["System Design", "Interview Prep"],
    createdAt: "1d ago",
    likes: 23,
    commentCount: 2,
    previewComments: [
      {
        id: "comment-system-alex",
        authorName: "Alex Kim",
        content:
          "Start with a clear framework, then practice drawing systems on whiteboards.",
        createdAt: "1d ago",
      },
      {
        id: "comment-system-sarah",
        authorName: "Sarah Chen",
        content:
          "I offer a Mock Interview session specifically for this. DM me!",
        createdAt: "1d ago",
      },
    ],
    showTitle: false,
  },
  {
    id: "demo-learning-plan",
    title: "A learning plan that finally sticks",
    content:
      "Sharing a small win: I finished my first 30-day Python learning plan. Weekly check-ins with a mentor made the goal feel manageable.",
    author: { id: "mentor-alex-kim", name: "Alex Kim" },
    tags: ["Python", "Learning Progress"],
    createdAt: "2d ago",
    likes: 64,
    commentCount: 0,
    showTitle: false,
  },
  {
    id: "demo-portfolio-feedback",
    title: "Portfolio feedback that changed my case study",
    content:
      "A great portfolio review is not about making everything prettier. It is about making your decisions and impact easy to understand.",
    author: { id: "mentor-linh-tran", name: "Linh Tran" },
    tags: ["UX Design", "Portfolio"],
    createdAt: "3d ago",
    likes: 96,
    commentCount: 1,
    previewComments: [
      {
        id: "comment-portfolio-minh",
        authorName: "Minh Duc",
        content: "This is exactly the feedback I needed for my case study.",
        createdAt: "3d ago",
      },
    ],
    showTitle: false,
  },
  {
    id: "demo-leadership",
    title: "The best career advice I received this month",
    content:
      "Career growth is easier when you can talk through the trade-offs with someone who has already made them. Thankful for the SkillSwap community.",
    author: { id: "mentor-tuan-hoang", name: "Tuan Hoang" },
    tags: ["Leadership", "Career Growth"],
    createdAt: "4d ago",
    likes: 71,
    commentCount: 0,
    showTitle: false,
  },
];

export function mergePosts(repositoryPosts: Post[], seededPosts = demoPosts) {
  return [
    ...seededPosts,
    ...repositoryPosts.filter(
      (post) => !seededPosts.some((seed) => seed.id === post.id),
    ),
  ];
}
