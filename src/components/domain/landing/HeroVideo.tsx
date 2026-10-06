/**
 * @file HeroVideo.tsx
 * @description Video TVC giới thiệu SkillSwap trong hero landing page.
 */

const VIDEO_SOURCE = '/video/skillswap-tvc.mp4';

export function HeroVideo() {
  return (
    <div className="landing-load-reveal landing-load-from-right landing-load-delay-3 relative isolate mx-auto min-w-0 w-full max-w-[850px] xl:ml-auto">
      <div className="absolute top-[5%] left-[8%] -z-20 h-[72%] w-[82%] rounded-[50%] bg-[rgba(53,168,255,0.09)] blur-3xl" />
      <div className="absolute top-[8%] right-[4%] -z-10 h-36 w-36 rounded-full bg-[rgba(93,190,255,0.10)] sm:h-52 sm:w-52" />
      <div className="absolute bottom-[8%] left-[3%] -z-10 h-28 w-28 rounded-full bg-white/55 sm:h-44 sm:w-44" />

      <div className="relative overflow-hidden rounded-[20px] border border-white/95 bg-white/[0.72] p-1.5 shadow-[0_18px_45px_rgba(35,112,180,0.12)] backdrop-blur-sm sm:rounded-[30px] sm:p-3 sm:shadow-[0_24px_60px_rgba(35,112,180,0.12)]">
        <div className="relative aspect-video w-full overflow-hidden rounded-[16px] border border-[#dceaf6]/80 bg-[#eff8ff] sm:rounded-[24px]">
          {/* TODO: Thay poster tạm bằng key visual chính thức của TVC khi được cung cấp. */}
          <video
            controls
            playsInline
            preload="metadata"
            poster="/images/tvc-poster.jpg"
            aria-label="Video TVC giới thiệu SkillSwap"
            className="block aspect-video h-full w-full object-cover"
          >
            <source src={VIDEO_SOURCE} type="video/mp4" />
            {/* TODO: Thêm track phụ đề tiếng Việt khi có file captions chính thức. */}
            Không xem được video?{' '}
            <a href={VIDEO_SOURCE} download>
              Tải video về để xem
            </a>
          </video>
        </div>
      </div>
    </div>
  );
}
