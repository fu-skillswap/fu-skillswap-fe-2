const metrics = [
  ["Người dùng hoạt động", "1,248"],
  ["Bài viết chờ duyệt", "16"],
  ["Lịch hẹn tuần này", "84"],
];
export default function AdminDashboard() {
  return (
    <main className="page-shell">
      <section className="content-section">
        <span className="eyebrow">ADMIN PORTAL</span>
        <h1>Quản trị cộng đồng</h1>
        <div className="metric-grid">
          {metrics.map(([label, value]) => (
            <article className="card" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </div>
        <article className="card">
          <h2>Việc cần xử lý</h2>
          <ul>
            <li>Duyệt 16 bài viết mới.</li>
            <li>Kiểm tra 3 báo cáo nội dung.</li>
            <li>Xác nhận 8 mentor mới.</li>
          </ul>
        </article>
      </section>
    </main>
  );
}
