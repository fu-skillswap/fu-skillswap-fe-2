/**
 * @file page.tsx
 * @description Route Dashboard Quản trị Hệ thống (`/[locale]/sysadmin/dashboard`).
 * Hiển thị tình trạng hoạt động của các dịch vụ hệ thống (Web App, API, Database).
 */

const services = [
  ["Web application", "Hoạt động"],
  ["API backend", "Chưa kết nối"],
  ["Database", "Chưa kết nối"],
];

/**
 * Server Component cho trang Dashboard Quản trị Hệ thống (System Admin).
 */
export default function SysadminDashboard() {
  return (
    <main className="page-shell">
      <section className="content-section">
        <span className="eyebrow">SYSTEM ADMIN</span>
        <h1>Tình trạng hệ thống</h1>
        <div className="schedule-list">
          {services.map(([service, status]) => (
            <article className="card schedule-item" key={service}>
              <strong>{service}</strong>
              <span
                className={status === "Hoạt động" ? "status-ok" : "status-warn"}
              >
                {status}
              </span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
