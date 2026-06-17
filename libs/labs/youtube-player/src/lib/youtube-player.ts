import { ChangeDetectionStrategy, Component, computed, input, output, viewChild } from '@angular/core';
import { YouTubePlayer as Youtube } from '@angular/youtube-player';

@Component({
  selector: 'ang-youtube-player',
  imports: [Youtube],
  templateUrl: './youtube-player.html',
  styleUrl: './youtube-player.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YoutubePlayer {
  /** The ID of the YouTube video to play*/
  readonly videoId = input.required<string>();

  /** Label for the video used in accessibility text */
  readonly label = input.required<string>();

  /** Whether marketing cookies are enabled */
  readonly hasCookiesEnabled = input(false);

  /** Emits when the user enables cookies */
  readonly enableCookies = output();

  /** ViewChild reference to the YouTube player for programmatic control */
  readonly player = viewChild<Youtube>('player');

  /** Computed thumbnail URL */
  protected readonly thumbnailUrl = computed(() => `https://img.youtube.com/vi/${this.videoId()}/sddefault.jpg`);

  /** YouTube video URL */
  protected readonly videoUrl = computed(() => `https://www.youtube.com/watch?v=${this.videoId()}`);
}
