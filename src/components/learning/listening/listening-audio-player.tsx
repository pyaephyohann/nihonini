"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ListeningAudioPlayerProps = {
  audioUrl: string;
  title: string;
  durationSeconds?: number | null;
};

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function ListeningAudioPlayer({
  audioUrl,
  title,
  durationSeconds,
}: ListeningAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds ?? 0);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => {
      if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnded);
    };
  }, [audioUrl]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };

  const handleSeek = (value: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(duration) || duration <= 0) return;
    const nextTime = (value / 100) * duration;
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const handleVolume = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextVolume = value / 100;
    audio.volume = nextVolume;
    setVolume(nextVolume);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <section
      aria-label={`Audio player for ${title}`}
      className="rounded-xl border border-border bg-card p-6 shadow-sm"
    >
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause audio" : "Play audio"}
          className={cn(
            "flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground",
            "transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          )}
        >
          {isPlaying ? (
            <Pause className="size-7" aria-hidden="true" />
          ) : (
            <Play className="size-7 translate-x-0.5" aria-hidden="true" />
          )}
        </button>

        <p className="text-sm text-muted-foreground" aria-live="polite">
          {isPlaying ? "Playing" : "Paused"} · {formatTime(currentTime)} / {formatTime(duration)}
        </p>

        <div className="w-full">
          <label htmlFor="audio-seek" className="sr-only">
            Seek audio
          </label>
          <input
            id="audio-seek"
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={progress}
            onChange={(event) => handleSeek(Number(event.target.value))}
            className="h-2 w-full cursor-pointer accent-primary"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
          />
        </div>

        <div className="flex w-full items-center gap-3">
          <Volume2 className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <label htmlFor="audio-volume" className="sr-only">
            Volume
          </label>
          <input
            id="audio-volume"
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(volume * 100)}
            onChange={(event) => handleVolume(Number(event.target.value))}
            className="h-2 w-full cursor-pointer accent-primary"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(volume * 100)}
          />
        </div>
      </div>
    </section>
  );
}
