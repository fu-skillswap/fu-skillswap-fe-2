/**
 * @file HeroVideo.tsx
 * @description Trình phát TVC tích hợp trong mockup sản phẩm ở hero landing page.
 */

'use client';

import { Maximize, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { useRef, useState, type CSSProperties } from 'react';

function formatTime(value: number) {
  if (!Number.isFinite(value)) return '0:00';
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function HeroVideo() {
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) await video.play();
    else video.pause();
  };

  const toggleMuted = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const enterFullscreen = async () => {
    if (frameRef.current?.requestFullscreen) await frameRef.current.requestFullscreen();
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="landing-load-reveal landing-load-from-right landing-load-delay-3 relative isolate mx-auto min-w-0 w-full max-w-[850px] xl:ml-auto">
      <div className="absolute top-[5%] left-[8%] -z-20 h-[72%] w-[82%] rounded-[50%] bg-[rgba(53,168,255,0.09)] blur-3xl" />
      <div className="absolute top-[8%] right-[4%] -z-10 h-36 w-36 rounded-full bg-[rgba(93,190,255,0.10)] sm:h-52 sm:w-52" />
      <div className="absolute bottom-[8%] left-[3%] -z-10 h-28 w-28 rounded-full bg-white/55 sm:h-44 sm:w-44" />

      <div
        ref={frameRef}
        className="relative overflow-hidden rounded-[20px] border border-white/95 bg-white/[0.72] p-1.5 shadow-[0_18px_45px_rgba(35,112,180,0.12)] backdrop-blur-sm sm:rounded-[30px] sm:p-3 sm:shadow-[0_24px_60px_rgba(35,112,180,0.12)]"
      >
        <div className="relative overflow-hidden rounded-[16px] border border-[#dceaf6]/80 bg-[#eff8ff] sm:rounded-[24px]">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-label="Video TVC giới thiệu SkillSwap"
            className="block aspect-video h-full w-full object-cover"
            onClick={togglePlayback}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
            onDurationChange={(event) => setDuration(event.currentTarget.duration)}
            onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
          >
            <source src="/video/SKILLSWAP%20-%20TVC%20(1).mp4" type="video/mp4" />
            Trình duyệt của bạn không hỗ trợ phát video.
          </video>

          {!isPlaying && (
            <button
              type="button"
              onClick={togglePlayback}
              aria-label="Phát video"
              className="absolute top-1/2 left-1/2 z-20 grid h-[76px] w-[76px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary text-white shadow-[0_12px_30px_rgba(8,126,241,0.30)] transition hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/80"
            >
              <Play className="ml-1 h-8 w-8 fill-current" strokeWidth={1.8} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="relative z-20 -mt-1 flex h-12 items-center gap-2 rounded-b-[18px] bg-white/95 px-3 text-[#12386e] shadow-[0_-6px_18px_rgba(35,112,180,0.05)] sm:h-14 sm:gap-3 sm:px-4">
          <button
            type="button"
            onClick={togglePlayback}
            aria-label={isPlaying ? 'Tạm dừng video' : 'Phát video'}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#12386e] hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 fill-current" strokeWidth={1.8} aria-hidden="true" />
            ) : (
              <Play className="ml-0.5 h-4 w-4 fill-current" strokeWidth={1.8} aria-hidden="true" />
            )}
          </button>
          <span className="hidden shrink-0 text-[11px] font-semibold sm:inline">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(currentTime, duration || 0)}
            onChange={(event) => {
              const nextTime = Number(event.target.value);
              if (videoRef.current) videoRef.current.currentTime = nextTime;
              setCurrentTime(nextTime);
            }}
            aria-label="Tiến trình video"
            className="landing-video-progress min-w-0 flex-1"
            style={{ '--video-progress': `${progress}%` } as CSSProperties}
          />
          <button
            type="button"
            onClick={toggleMuted}
            aria-label={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {isMuted ? (
              <VolumeX className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
            ) : (
              <Volume2 className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            onClick={enterFullscreen}
            aria-label="Xem toàn màn hình"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Maximize className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
