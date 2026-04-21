import type { BackgroundDto } from "../shared/types.js";

/**
 * Per Unsplash API guidelines, deep links to user/photo pages must include
 * a UTM source identifying our app. https://help.unsplash.com/en/articles/2511315
 */
const UTM = "utm_source=meet-dashboard&utm_medium=referral";
const UNSPLASH_RANDOM_URL =
  "https://api.unsplash.com/photos/random?orientation=landscape&content_filter=high&query=" +
  encodeURIComponent("landscape");

export interface BackgroundProvider {
  fetch(refreshAt: Date): Promise<BackgroundDto>;
}

interface UnsplashUser {
  readonly name?: string;
  readonly username?: string;
  readonly links?: { readonly html?: string };
}

interface UnsplashPhoto {
  readonly urls?: {
    readonly raw?: string;
    readonly full?: string;
    readonly regular?: string;
    readonly small?: string;
  };
  readonly links?: { readonly html?: string };
  readonly user?: UnsplashUser;
  readonly color?: string;
}

function withUtm(url: string): string {
  return url.includes("?") ? `${url}&${UTM}` : `${url}?${UTM}`;
}

function pickImageUrl(photo: UnsplashPhoto): string | null {
  return (
    photo.urls?.full ??
    photo.urls?.regular ??
    photo.urls?.raw ??
    photo.urls?.small ??
    null
  );
}

function toBackgroundDto(
  photo: UnsplashPhoto,
  refreshAt: Date
): BackgroundDto | null {
  const url = pickImageUrl(photo);
  if (url === null) return null;
  const photographer = photo.user?.name ?? photo.user?.username ?? "Unsplash";
  const photographerUrl = withUtm(
    photo.user?.links?.html ?? "https://unsplash.com"
  );
  const photoPageUrl = withUtm(photo.links?.html ?? "https://unsplash.com");
  return {
    url,
    photographer,
    photographerUrl,
    photoPageUrl,
    color: photo.color ?? "#0b0d12",
    refreshAt: refreshAt.toISOString(),
  };
}

export class UnsplashError extends Error {
  override readonly name = "UnsplashError";
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export interface UnsplashClientOptions {
  readonly accessKey: string;
  readonly fetchImpl?: typeof fetch;
}

export function createUnsplashProvider(
  opts: UnsplashClientOptions
): BackgroundProvider {
  const fetchImpl = opts.fetchImpl ?? fetch;
  return {
    async fetch(refreshAt: Date): Promise<BackgroundDto> {
      const res = await fetchImpl(UNSPLASH_RANDOM_URL, {
        headers: {
          Authorization: `Client-ID ${opts.accessKey}`,
          "Accept-Version": "v1",
        },
      });
      if (!res.ok) {
        throw new UnsplashError(
          `Unsplash returned HTTP ${res.status}`,
          res.status
        );
      }
      const photo = (await res.json()) as UnsplashPhoto;
      const dto = toBackgroundDto(photo, refreshAt);
      if (dto === null) {
        throw new UnsplashError(
          "Unsplash response did not contain a usable image URL",
          502
        );
      }
      return dto;
    },
  };
}
