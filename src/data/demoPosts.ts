import type { Post } from '@/models/entities';

const cvReviewComments = [
  {
    id: 'comment-cv-thu',
    authorName: 'Thu Hà',
    content: 'Cùng cảm nhận luôn! Góp ý của chỉ khai sáng cực.',
    createdAt: '3 giờ trước',
  },
  {
    id: 'comment-cv-alex',
    authorName: 'Alex Kim',
    content: 'Tui cũng vừa được tư vấn tuần trước, rất đáng tiền nha!',
    createdAt: '3 giờ trước',
  },
];

/** Presentation-only feed records used to supply the visual density of the Figma demo. */
export const demoPosts: Post[] = [
  {
    id: 'demo-cv-review',
    title: 'Review CV 1:1 cùng Sarah Chen',
    content:
      'Tui vừa xong một buổi Review CV 1:1 với chị Sarah Chen xong, đỉnh thực sự mọi người ơi! Chị chỉ ra những điểm còn thiếu sót mà trước giờ tui không hề nhận ra. Anh chị em nào đang chuẩn bị CV ứng tuyển vị trí PM thì rất nên đặt lịch với chị nhé!',
    author: { id: 'member-minh-duc', name: 'Minh Đức' },
    tags: ['Review CV', 'Product Management'],
    createdAt: '3 giờ trước',
    likes: 47,
    commentCount: 2,
    previewComments: cvReviewComments,
    mediaUrl:
      'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=700&h=380&fit=crop&auto=format',
    showMascot: true,
    showTitle: false,
  },
  {
    id: 'demo-pm-resume',
    title: '3 lỗi sai phổ biến nhất trên CV vị trí Product Manager',
    content:
      'Top 3 lỗi sai mình thường thấy nhất trên CV của các bạn ứng tuyển PM:\n\n1. Liệt kê trách nhiệm công việc thay vì tập trung vào kết quả đạt được\n2. Thiếu các con số chứng minh tác động thực tế (% tăng trưởng, số lượng người dùng)\n3. Dùng quá nhiều thuật ngữ chuyên ngành phức tạp thay vì kể một câu chuyện thuyết phục\n\nSửa lại những điểm này và tỷ lệ nhận được phản hồi từ nhà tuyển dụng sẽ tăng rõ rệt đấy!',
    author: { id: 'mentor-sarah-chen', name: 'Sarah Chen' },
    tags: ['Product Management', 'Tư vấn sự nghiệp'],
    createdAt: '6 giờ trước',
    likes: 182,
    commentCount: 1,
    previewComments: [
      {
        id: 'comment-resume-minh',
        authorName: 'Minh Đức',
        content: 'Bài viết quá hữu ích! Mình phải sửa lại mục số 2 trên CV ngay lập tức.',
        createdAt: '6 giờ trước',
      },
    ],
    showMascot: true,
    showTitle: false,
  },
  {
    id: 'demo-system-design',
    title: 'Kinh nghiệm chuẩn bị phỏng vấn System Design',
    content:
      'Mọi người thường chuẩn bị cho các buổi phỏng vấn Thiết kế Hệ thống (System Design) như thế nào vậy? Tuần tới mình có buổi phỏng vấn vị trí Senior Backend mà thấy ngợp quá. Có ai có phương pháp học hệ thống hiệu quả không ạ?',
    author: { id: 'member-thu-ha', name: 'Thu Hà' },
    tags: ['System Design', 'Phỏng vấn Tech'],
    createdAt: '1 ngày trước',
    likes: 23,
    commentCount: 2,
    previewComments: [
      {
        id: 'comment-system-alex',
        authorName: 'Alex Kim',
        content: 'Hãy bắt đầu bằng một khung tư duy rõ ràng, sau đó thực hành vẽ sơ đồ kiến trúc hệ thống trên bảng trắng nhiều vào nhé.',
        createdAt: '1 ngày trước',
      },
      {
        id: 'comment-system-sarah',
        authorName: 'Sarah Chen',
        content: 'Chị có mở dịch vụ Phỏng vấn thử (Mock Interview) chuyên sâu về mảng này đấy. Nhắn tin cho chị nhé!',
        createdAt: '1 ngày trước',
      },
    ],
    showTitle: false,
  },
  {
    id: 'demo-learning-plan',
    title: 'Lộ trình học tập hiệu quả giúp duy trì động lực',
    content:
      'Khoe với mọi người một thành tích nhỏ: Mình vừa hoàn thành lộ trình 30 ngày học Python đầu tiên! Nhờ có sự đồng hành và kiểm tra tiến độ hàng tuần từ Mentor mà mục tiêu học tập không còn thấy quá sức nữa.',
    author: { id: 'mentor-alex-kim', name: 'Alex Kim' },
    tags: ['Python', 'Tiến độ học tập'],
    createdAt: '2 ngày trước',
    likes: 64,
    commentCount: 0,
    showTitle: false,
  },
  {
    id: 'demo-portfolio-feedback',
    title: 'Góp ý Portfolio giúp thay đổi góc nhìn làm Case Study',
    content:
      'Một buổi review Portfolio chất lượng không chỉ là làm cho giao diện đẹp hơn. Điều quan trọng nhất là làm nổi bật được tư duy thiết kế và tác động thực tế từ những quyết định của bạn.',
    author: { id: 'mentor-linh-tran', name: 'Linh Trần' },
    tags: ['UX Design', 'Portfolio'],
    createdAt: '3 ngày trước',
    likes: 96,
    commentCount: 1,
    previewComments: [
      {
        id: 'comment-portfolio-minh',
        authorName: 'Minh Đức',
        content: 'Chính xác là những lời khuyên mình đang cần cho bài Case Study sắp tới!',
        createdAt: '3 ngày trước',
      },
    ],
    showTitle: false,
  },
  {
    id: 'demo-leadership',
    title: 'Lời khuyên phát triển sự nghiệp tâm đắc nhất tháng này',
    content:
      'Con đường phát triển sự nghiệp sẽ trở nên dễ dàng hơn nhiều khi bạn có cơ hội thảo luận và học hỏi từ những người đi trước đã từng trải qua thử thách đó. Rất cảm ơn cộng đồng SkillSwap!',
    author: { id: 'mentor-tuan-hoang', name: 'Tuấn Hoàng' },
    tags: ['Lãnh đạo', 'Phát triển sự nghiệp'],
    createdAt: '4 ngày trước',
    likes: 71,
    commentCount: 0,
    showTitle: false,
  },
];

export function mergePosts(repositoryPosts: Post[], seededPosts = demoPosts) {
  return [
    ...seededPosts,
    ...repositoryPosts.filter((post) => !seededPosts.some((seed) => seed.id === post.id)),
  ];
}
