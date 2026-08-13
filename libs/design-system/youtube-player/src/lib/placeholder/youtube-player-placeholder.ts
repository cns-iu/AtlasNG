import { NgOptimizedImage } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { PlaceholderImageQuality } from '@angular/youtube-player';
import { AnyLink } from '@atlasng/common';

/** Allowed characters in a YouTube video ID interpolated into a thumbnail URL. */
const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]+$/;

/**
 * Displays a YouTube thumbnail that links to the video without embedding the YouTube player.
 *
 * This component is virtually a copy of Angular's `YouTubePlayerPlaceholder`, with adaptations
 * for the AtlasNG permission flow. It uses {@link NgOptimizedImage} for the thumbnail and an
 * accessible, full-size {@link AnyLink} so the video opens directly on YouTube instead of loading
 * the IFrame Player API in place.
 *
 * @see https://github.com/angular/components/blob/main/src/youtube-player/youtube-player-placeholder.ts
 */
@Component({
  selector: 'ang-youtube-player-placeholder, [angYouTubePlayerPlaceholder]',
  imports: [AnyLink, NgOptimizedImage],
  templateUrl: './youtube-player-placeholder.html',
  styleUrl: './youtube-player-placeholder.scss',
  host: {
    class: 'ang-youtube-player-placeholder',
    '[style.width.px]': 'width()',
    '[style.height.px]': 'height()',
  },
})
export class YouTubePlayerPlaceholder {
  /** YouTube video ID used to build the destination and thumbnail URLs. */
  readonly videoId = input.required<string>();

  /** Placeholder width in pixels. */
  readonly width = input.required<number>();

  /** Placeholder height in pixels. */
  readonly height = input.required<number>();

  /** Accessible label for the link represented by the centered play control. */
  readonly buttonLabel = input.required<string>();

  /** Requested YouTube thumbnail quality. */
  readonly quality = input.required<PlaceholderImageQuality>();

  /**
   * Thumbnail URL for the current video and requested quality.
   *
   * Invalid video IDs produce no URL so untrusted input cannot be interpolated into the image
   * source. A diagnostic is logged in development mode when this occurs.
   */
  protected readonly backgroundImage = computed(() => {
    const videoId = this.videoId();
    const quality = this.quality();

    if (!VIDEO_ID_REGEX.test(videoId)) {
      if (typeof ngDevMode === 'undefined' || ngDevMode) {
        // eslint-disable-next-line no-console
        console.error(`Skipping placeholder image generation for invalid YouTube video ID: ${videoId}`);
      }

      return null;
    }

    if (quality === 'low') {
      return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    } else if (quality === 'high') {
      return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
    }

    return `https://i.ytimg.com/vi_webp/${videoId}/sddefault.webp`;
  });
}
