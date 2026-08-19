import Link from "next/link";

export default function NotFound() {
  return <main className="skillswap-not-found">
    <section className="skillswap-not-found-card" aria-labelledby="not-found-title">
      <div className="skillswap-not-found-copy">
        <p>SKILLSWAP</p>
        <h1 id="not-found-title">4<span>0</span>4</h1>
        <h2>Trang này đã bay mất rồi</h2>
        <p>Đường dẫn có thể không tồn tại hoặc đã được thay đổi. Cú nhỏ sẽ dẫn bạn quay lại bảng tin.</p>
        <Link href="/vi/dashboard">Về Bảng tin</Link>
      </div>
      <img src="/images/skillswap-owl-404.png" alt="Cú linh vật SkillSwap đội mũ tốt nghiệp" />
    </section>
  </main>;
}
