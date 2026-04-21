import { useEffect, useState } from "react";
import type { BackgroundDto } from "../../shared/types";
import { fetchBackground } from "../api";

const REFRESH_FALLBACK_MS = 60 * 60 * 1000;

function msUntilRefresh(dto: BackgroundDto): number {
  const refreshAt = Date.parse(dto.refreshAt);
  if (Number.isNaN(refreshAt)) return REFRESH_FALLBACK_MS;
  // Add a small jitter (5s) to avoid a thundering herd if many kiosks
  // happen to refresh at the exact same second.
  return Math.max(60_000, refreshAt - Date.now()) + 5_000;
}

export function Background(): JSX.Element | null {
  const [bg, setBg] = useState<BackgroundDto | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;

    const load = async (): Promise<void> => {
      const next = await fetchBackground();
      if (cancelled) return;
      setLoaded(false);
      setBg(next);
      const nextMs = next === null ? REFRESH_FALLBACK_MS : msUntilRefresh(next);
      timeoutId = window.setTimeout(load, nextMs);
    };

    void load();
    return () => {
      cancelled = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, []);

  if (bg === null) return null;

  return (
    <div className="background" style={{ backgroundColor: bg.color }}>
      <img
        className={`background__img${loaded ? " background__img--loaded" : ""}`}
        src={bg.url}
        alt=""
        onLoad={() => setLoaded(true)}
      />
      <div className="background__overlay" />
      <div className="background__credit">
        Photo by{" "}
        <a href={bg.photographerUrl} target="_blank" rel="noopener noreferrer">
          {bg.photographer}
        </a>{" "}
        on{" "}
        <a href={bg.photoPageUrl} target="_blank" rel="noopener noreferrer">
          Unsplash
        </a>
      </div>
    </div>
  );
}
