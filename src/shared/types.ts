export interface RoomDto {
  readonly id: string;
  readonly displayName: string;
}

export interface EventDto {
  readonly id: string;
  readonly title: string;
  readonly organizer?: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly meetUrl?: string;
  readonly isPrivate: boolean;
}

export interface EventsResponse {
  readonly roomId: string;
  readonly fetchedAt: string;
  readonly events: readonly EventDto[];
}

export interface ApiError {
  readonly error: {
    readonly code: string;
    readonly message: string;
  };
}

export interface BackgroundDto {
  readonly url: string;
  readonly photographer: string;
  readonly photographerUrl: string;
  /** Unsplash photo page URL, for the "on Unsplash" link. */
  readonly photoPageUrl: string;
  /** Hex color for solid placeholder while the image loads. */
  readonly color: string;
  /** ISO timestamp at which the backend will rotate to a new photo. */
  readonly refreshAt: string;
}
