"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LogOut, Pause, Play, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type {
  InteractiveVideoChoice,
  InteractiveVideoPreviewModel,
  InteractiveVideoSegment,
  InteractiveVideoTimelineEvent,
} from "@/lib/interactive-video/preview";
import type { Lang } from "@/lib/i18n";

interface InteractiveVideoPlayerProps {
  model: InteractiveVideoPreviewModel;
  assetUrls: Record<string, string>;
  lang: Lang;
}

type LockableScreenOrientation = ScreenOrientation & {
  lock: (orientation: string) => Promise<void>;
  unlock: () => void;
};

function findVideoEvent(
  segment: InteractiveVideoSegment | undefined
): InteractiveVideoTimelineEvent | undefined {
  return segment?.timeline.find((event) => event.videoId);
}

function findChoice(
  segment: InteractiveVideoSegment | undefined,
  choiceId: string | undefined
): InteractiveVideoChoice | undefined {
  if (!segment || !choiceId) return undefined;
  return segment.choices.find((choice) => choice.id === choiceId);
}

function nextChoiceEvent(
  segment: InteractiveVideoSegment | undefined
): InteractiveVideoTimelineEvent | undefined {
  return segment?.timeline.find((event) => event.choiceId);
}

export function InteractiveVideoPlayer({
  model,
  assetUrls,
  lang,
}: InteractiveVideoPlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const segmentById = useMemo(
    () => new Map(model.segments.map((segment) => [segment.id, segment])),
    [model.segments]
  );
  const [started, setStarted] = useState(false);
  const [segmentId, setSegmentId] = useState(model.startSegmentId);
  const [pendingChoiceId, setPendingChoiceId] = useState<string | null>(null);
  const [ended, setEnded] = useState(false);
  const [paused, setPaused] = useState(false);

  const segment = segmentById.get(segmentId) ?? model.segments[0];
  const videoEvent = findVideoEvent(segment);
  const videoAsset = videoEvent?.videoId ? model.assets[videoEvent.videoId] : undefined;
  const videoSrc = videoEvent?.videoId ? assetUrls[videoEvent.videoId] : undefined;
  const choiceEvent = nextChoiceEvent(segment);
  const activeChoice = findChoice(segment, pendingChoiceId ?? choiceEvent?.choiceId);
  const choiceTime = choiceEvent?.at ?? Number.POSITIVE_INFINITY;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !started || !videoSrc) return;
    setPendingChoiceId(null);
    setEnded(false);
    setPaused(false);
    video.load();
    void video.play().catch(() => {
      /* The visible play button lets the user resume if autoplay is blocked. */
    });
  }, [segmentId, started, videoSrc]);

  async function enterImmersiveMode() {
    try {
      if (!document.fullscreenElement) {
        await playerRef.current?.requestFullscreen();
      }
    } catch {
      /* Fullscreen can be unavailable in embedded or restricted browser contexts. */
    }
    try {
      const orientation = screen.orientation as LockableScreenOrientation;
      await orientation.lock("landscape");
    } catch {
      /* Orientation lock is best-effort and may be unsupported on desktop. */
    }
  }

  async function exitImmersiveMode() {
    try {
      const orientation = screen.orientation as LockableScreenOrientation;
      orientation.unlock();
    } catch {
      /* Ignore unsupported orientation APIs. */
    }
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      /* The browser may already have left fullscreen. */
    }
  }

  async function startPlayback() {
    setStarted(true);
    setPaused(false);
    setEnded(false);
    setPendingChoiceId(null);
    await enterImmersiveMode();
    const video = videoRef.current;
    if (!video) return;
    void video.play().catch(() => undefined);
  }

  async function restart() {
    setSegmentId(model.startSegmentId);
    setPendingChoiceId(null);
    setEnded(false);
    await startPlayback();
    queueMicrotask(() => {
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = 0;
      void video.play().catch(() => undefined);
    });
  }

  async function exitPlayback() {
    const video = videoRef.current;
    if (video) video.pause();
    setStarted(false);
    setPendingChoiceId(null);
    setEnded(false);
    setPaused(false);
    await exitImmersiveMode();
  }

  function togglePause() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      setPaused(false);
      void video.play().catch(() => undefined);
    } else {
      video.pause();
      setPaused(true);
    }
  }

  function choose(next: string) {
    if (!segmentById.has(next)) {
      setPendingChoiceId(null);
      setEnded(true);
      void exitImmersiveMode();
      return;
    }
    setSegmentId(next);
    setPendingChoiceId(null);
    setEnded(false);
    setPaused(false);
  }

  function handleTimeUpdate() {
    const video = videoRef.current;
    if (!video || !choiceEvent?.choiceId || pendingChoiceId) return;
    if (video.currentTime >= choiceTime) {
      video.pause();
      setPaused(true);
      setPendingChoiceId(choiceEvent.choiceId);
    }
  }

  function handleEnded() {
    if (choiceEvent?.choiceId) {
      setPendingChoiceId(choiceEvent.choiceId);
      return;
    }
    setEnded(true);
    setPaused(false);
    void exitImmersiveMode();
  }

  const startLabel = lang === "zh" ? "开始" : "Start";
  const replayLabel = lang === "zh" ? "重新开始" : "Restart";
  const pauseLabel = lang === "zh" ? "暂停" : "Pause";
  const resumeLabel = lang === "zh" ? "继续" : "Resume";
  const exitLabel = lang === "zh" ? "中途退出" : "Exit";
  const finalExitLabel = lang === "zh" ? "退出预览" : "Exit preview";
  const missingVideoLabel = lang === "zh" ? "缺少视频资产" : "Missing video asset";
  const endingLabel = lang === "zh" ? "分支已结束" : "Branch ended";

  return (
    <div ref={playerRef} className="flex h-full min-h-0 flex-col bg-neutral-950 text-white">
      <div className="min-h-0 flex-1">
        <div className="relative flex h-full items-center justify-center bg-black">
          {videoSrc ? (
            <video
              ref={videoRef}
              src={videoSrc}
              className="h-full w-full object-contain"
              playsInline
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
              onPlay={() => setPaused(false)}
              onPause={() => setPaused(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-white/70">
              {missingVideoLabel}
              {videoAsset ? `: ${videoAsset.name}` : ""}
            </div>
          )}

          {!started && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/65 px-6">
              <Button size="lg" onClick={() => void startPlayback()}>
                <Play data-icon="inline-start" className="size-4" />
                {startLabel}
              </Button>
            </div>
          )}

          {started && !ended && (
            <div className="absolute right-3 top-3 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={togglePause}
                aria-label={paused ? resumeLabel : pauseLabel}
              >
                {paused ? (
                  <Play data-icon="inline-start" className="size-4" />
                ) : (
                  <Pause data-icon="inline-start" className="size-4" />
                )}
                {paused ? resumeLabel : pauseLabel}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void exitPlayback()}
                aria-label={exitLabel}
              >
                <LogOut data-icon="inline-start" className="size-4" />
                {exitLabel}
              </Button>
            </div>
          )}

          {started && activeChoice && pendingChoiceId && (
            <div className="absolute inset-x-0 bottom-0 bg-black/75 p-4 backdrop-blur">
              <div className="mx-auto max-w-3xl space-y-3">
                <p className="text-sm font-medium text-white">{activeChoice.prompt}</p>
                <div className="flex flex-wrap gap-2">
                  {activeChoice.options.map((option) => (
                    <Button
                      key={`${activeChoice.id}-${option.label}-${option.next}`}
                      variant="secondary"
                      onClick={() => choose(option.next)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {started && ended && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/65 px-6">
              <div className="space-y-3 text-center">
                <p className="text-sm font-medium text-white">{endingLabel}</p>
                <Button variant="secondary" onClick={restart}>
                  <RotateCcw data-icon="inline-start" className="size-4" />
                  {replayLabel}
                </Button>
                <Button variant="secondary" onClick={() => void exitPlayback()}>
                  <LogOut data-icon="inline-start" className="size-4" />
                  {finalExitLabel}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-xs text-white/70">
        <div className="min-w-0">
          <p className="truncate font-medium text-white">{segment?.title ?? model.title}</p>
          <p className="truncate">{videoAsset?.name ?? segment?.id}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={restart}
          className="text-white hover:bg-white/10 hover:text-white"
        >
          <RotateCcw data-icon="inline-start" className="size-4" />
          {replayLabel}
        </Button>
      </div>
    </div>
  );
}
