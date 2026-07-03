"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

/** Module-level lock so two chapter videos can never play simultaneously. */
let activeVideo: HTMLVideoElement | null = null;

type VideoVariant = "alert" | "validation" | "quiet";

type VideoChapterProps = {
  src: string;
  logLabel: string;
  variant?: VideoVariant;
  className?: string;
  videoClassName?: string;
  withScanline?: boolean;
  hideTopLeftMark?: boolean;
  loop?: boolean;
  children?: ReactNode;
};

const cornerStyles: Record<VideoVariant, string> = {
  alert: "border-[#d3170c]/60",
  validation: "border-hud/60",
  quiet: "border-white/20",
};

const tintStyles: Record<VideoVariant, string> = {
  alert:
    "bg-[radial-gradient(ellipse_at_78%_20%,rgba(211,23,12,0.1),transparent_46%)]",
  validation:
    "bg-[radial-gradient(ellipse_at_78%_20%,rgba(216,179,95,0.08),transparent_46%)]",
  quiet: "",
};

/**
 * Full-bleed cinematic briefing video: the clip fills the whole section
 * (min 100svh, object-cover) behind overlaid content, under legibility
 * gradients, film grain, and HUD corner ticks. Always muted; plays only while
 * >=60% in the viewport, loops, pauses off-screen, and only one chapter video
 * plays page-wide. Under prefers-reduced-motion nothing autoplays — the play
 * control remains.
 */
export default function VideoChapter({
  src,
  logLabel,
  variant = "alert",
  className,
  videoClassName,
  withScanline = false,
  hideTopLeftMark = false,
  loop = true,
  children,
}: VideoChapterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const hasOverlayContent = Boolean(children);

  const startPlayback = useCallback(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (video.ended) {
      video.currentTime = 0;
    }

    video.muted = true;

    if (activeVideo && activeVideo !== video) {
      activeVideo.pause();
    }

    activeVideo = video;
    video.play().catch(() => {
      // Autoplay may be blocked; the manual control still works.
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;

    if (!container || !video) {
      return;
    }

    video.muted = true;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.6) {
          if (!prefersReducedMotion) {
            startPlayback();
          }
        } else {
          video.pause();
        }
      },
      { threshold: [0, 0.6] },
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
      video.pause();

      if (activeVideo === video) {
        activeVideo = null;
      }
    };
  }, [startPlayback]);

  const togglePlay = () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (video.paused) {
      startPlayback();
    } else {
      video.pause();
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "grain-overlay relative flex min-h-svh flex-col overflow-hidden bg-black",
        className,
      )}
    >
      {/* standby state behind the video's first frame */}
      <p
        className={cn(
          "absolute z-0 font-mono text-[11px] uppercase tracking-[0.3em] text-white/25",
          hasOverlayContent
            ? "bottom-6 left-5 md:left-10"
            : "inset-0 flex items-center justify-center",
        )}
      >
        {`${logLabel} // standby`}
      </p>

      <video
        ref={videoRef}
        src={src}
        muted
        playsInline
        loop={loop}
        preload="metadata"
        className={cn(
          "absolute inset-0 h-full w-full object-cover",
          videoClassName,
        )}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      {hideTopLeftMark ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0"
          style={{
            width: "clamp(15rem, 30vw, 24rem)",
            height: "clamp(22rem, 40vw, 28rem)",
            background:
              "linear-gradient(135deg, #000 0%, #000 56%, rgba(0, 0, 0, 0.96) 72%, rgba(0, 0, 0, 0) 100%), radial-gradient(ellipse at 0% 0%, #000 0%, #000 52%, rgba(0, 0, 0, 0) 82%)",
          }}
        />
      ) : null}

      {/* legibility overlay: darkened edges + top/bottom bands, clear center */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.74)_0%,rgba(0,0,0,0.38)_20%,rgba(0,0,0,0.08)_42%,rgba(0,0,0,0.08)_58%,rgba(0,0,0,0.38)_80%,rgba(0,0,0,0.72)_100%),linear-gradient(180deg,rgba(0,0,0,0.5)_0%,transparent_28%,transparent_66%,rgba(0,0,0,0.82)_100%)]"
      />
      {variant !== "quiet" ? (
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0",
            tintStyles[variant],
          )}
        />
      ) : null}

      {withScanline ? (
        <div aria-hidden="true" className="video-scanline" />
      ) : null}

      {/* HUD corner ticks */}
      {[
        "left-4 top-4 border-l border-t",
        "right-4 top-4 border-r border-t",
        "bottom-4 left-4 border-b border-l",
        "bottom-4 right-4 border-b border-r",
      ].map((corner) => (
        <span
          key={corner}
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute z-10 h-5 w-5",
            corner,
            cornerStyles[variant],
          )}
        />
      ))}

      {/* overlaid briefing content */}
      <div className="relative z-10 flex min-h-svh flex-1 flex-col justify-between px-5 pb-16 pt-24 md:px-10 md:pb-20 md:pt-36">
        <div className="flex-1">{children}</div>

        {/* control bar */}
        <div className="mx-auto mt-12 flex w-full max-w-6xl flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/45">
            {logLabel}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="min-h-9 border border-white/25 bg-black/50 px-3 font-mono text-[11px] uppercase tracking-[0.2em] text-white/75 transition-colors hover:border-white/60 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d3170c]"
            >
              {playing ? "Pause" : "Play"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
