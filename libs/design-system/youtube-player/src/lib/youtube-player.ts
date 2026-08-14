import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  inject,
  input,
  output,
  Provider,
  viewChild,
} from '@angular/core';
import { outputFromObservable, toObservable } from '@angular/core/rxjs-interop';
import { YouTubePlayer as NgYouTubePlayer, YOUTUBE_PLAYER_CONFIG, YouTubePlayerConfig } from '@angular/youtube-player';
import { AnalyticsEventCategory } from '@atlasng/analytics/events';
import { AnalyticsPermissionsManager } from '@atlasng/analytics/permissions';
import { EMPTY, Observable, switchMap } from 'rxjs';
import { ConditionalKeys } from 'type-fest';
import { YouTubePlayerPlaceholder } from './placeholder/youtube-player-placeholder';

/** Output names exposed by Angular's YouTube player as observables. */
type NgYouTubePlayerOutputs = ConditionalKeys<NgYouTubePlayer, Observable<unknown>>;

/** Default player width in pixels. */
const DEFAULT_PLAYER_WIDTH = 640;

/** Default player height in pixels. */
const DEFAULT_PLAYER_HEIGHT = 390;

/** Player parameters applied before consumer-provided overrides. */
const DEFAULT_PLAYER_VARS: YT.PlayerVars = {
  rel: 0,
  showinfo: 0,
};

/**
 * Provides the configuration used by this component and Angular's underlying YouTube player.
 *
 * @param config Default YouTube player configuration.
 * @returns A provider for {@link YOUTUBE_PLAYER_CONFIG}.
 */
export function provideYouTubePlayerConfig(config: YouTubePlayerConfig): Provider {
  return {
    provide: YOUTUBE_PLAYER_CONFIG,
    useValue: config,
  };
}

/**
 * Marks custom content to display beneath the disabled YouTube player placeholder.
 *
 * Project marked content into {@link YouTubePlayer} to replace its default enable-request
 * message. The consumer owns the custom content's interaction and can enable the required
 * marketing permission through its application-specific consent flow.
 */
@Directive({
  selector: '[angYouTubePlayerEnableRequest]',
  host: { class: 'ang-youtube-player--enable-request' },
})
export class YouTubePlayerEnableRequest {}

/**
 * Displays a permission-aware wrapper around Angular's YouTube player.
 *
 * The underlying player is rendered only when marketing permission is enabled. Otherwise, the
 * component displays a privacy-preserving placeholder that links to the video on YouTube and an
 * enable-request area beneath it. Consumers can replace that area with content marked by
 * {@link YouTubePlayerEnableRequest}.
 *
 * The current Angular player instance is exposed through {@link YouTubePlayer.ngPlayer}. Once the
 * player has been rendered, use `ngPlayer()` to access APIs such as `playVideo()`, `pauseVideo()`,
 * `seekTo()`, and the other methods provided by Angular's `YouTubePlayer` component.
 *
 * @see https://angular.dev/api/youtube-player/YouTubePlayer
 */
@Component({
  selector: 'ang-youtube-player',
  imports: [NgYouTubePlayer, YouTubePlayerPlaceholder],
  templateUrl: './youtube-player.html',
  styleUrl: './youtube-player.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YouTubePlayer {
  /** YouTube video ID to load or link to. */
  readonly videoId = input.required<string>();

  /** Player and placeholder width in pixels. */
  readonly width = input(DEFAULT_PLAYER_WIDTH);

  /** Player and placeholder height in pixels. */
  readonly height = input(DEFAULT_PLAYER_HEIGHT);

  /** Time, in seconds, at which playback should begin. */
  readonly startSeconds = input<number>();

  /** Time, in seconds, at which playback should stop. */
  readonly endSeconds = input<number>();

  /** Suggested playback quality passed to the underlying player. */
  readonly suggestedQuality = input<YT.SuggestedVideoQuality>();

  /** YouTube IFrame Player API parameters merged over the component defaults. */
  readonly playerVars = input<YT.PlayerVars>();

  /** Optional global defaults supplied through {@link YOUTUBE_PLAYER_CONFIG}. */
  readonly #config = inject(YOUTUBE_PLAYER_CONFIG, { optional: true });

  /** Whether Angular's built-in placeholder should be disabled after the player is enabled. */
  readonly disablePlaceholder = input(this.#config?.disablePlaceholder ?? false);

  /** Accessible label for the play control shown in either placeholder. */
  readonly placeholderButtonLabel = input(this.#config?.placeholderButtonLabel ?? 'Play video');

  /** Thumbnail quality used by the disabled and enabled player placeholders. */
  readonly placeholderImageQuality = input(this.#config?.placeholderImageQuality ?? 'standard');

  /**
   * Current underlying Angular YouTube player instance.
   *
   * The signal is `undefined` while marketing permission is disabled and before the player view
   * has initialized. Once available, call `ngPlayer()` to invoke player methods directly.
   */
  readonly ngPlayer = viewChild(NgYouTubePlayer);

  /** Observable form of {@link ngPlayer}, used to attach output forwarding lazily. */
  readonly #ngPlayer$ = toObservable(this.ngPlayer);

  /** Emitted when the default enable-request button is clicked. */
  readonly enableRequest = output<void>();

  /** Emits when the underlying YouTube player is initialized and ready to receive commands. */
  readonly ready = outputFromObservable<YT.PlayerEvent>(this.#getLazyOutputForwarding('ready'));

  /** Emits when the underlying player's playback state changes. */
  readonly stateChange = outputFromObservable<YT.OnStateChangeEvent>(this.#getLazyOutputForwarding('stateChange'));

  /** Emits when the underlying player reports an error. */
  readonly error = outputFromObservable<YT.OnErrorEvent>(this.#getLazyOutputForwarding('error'));

  /** Emits when the underlying player's API changes. */
  readonly apiChange = outputFromObservable<YT.PlayerEvent>(this.#getLazyOutputForwarding('apiChange'));

  /** Emits when the underlying player's playback quality changes. */
  readonly playbackQualityChange = outputFromObservable<YT.OnPlaybackQualityChangeEvent>(
    this.#getLazyOutputForwarding('playbackQualityChange'),
  );

  /** Emits when the underlying player's playback rate changes. */
  readonly playbackRateChange = outputFromObservable<YT.OnPlaybackRateChangeEvent>(
    this.#getLazyOutputForwarding('playbackRateChange'),
  );

  /** YouTube player parameters with component defaults applied before consumer overrides. */
  protected readonly playerVarsWithDefaults = computed(() => ({
    ...DEFAULT_PLAYER_VARS,
    ...this.playerVars(),
  }));

  /** Permission manager used to determine whether the embedded player may be rendered. */
  readonly #permissionsManager = inject(AnalyticsPermissionsManager);

  /** Whether marketing permission currently allows the embedded YouTube player. */
  protected readonly enabled = computed(() => {
    const permissions = this.#permissionsManager.permissions();
    return permissions.isCategoryEnabled(AnalyticsEventCategory.Marketing);
  });

  /**
   * Forwards an output from whichever underlying player instance is currently rendered.
   *
   * The returned observable remains silent while the permission-gated player is absent and
   * switches to the selected output when an instance becomes available.
   *
   * @param outputName Name of the Angular YouTube player output to forward.
   * @returns The selected output observable with its original event type.
   */
  #getLazyOutputForwarding<K extends NgYouTubePlayerOutputs>(outputName: K): NgYouTubePlayer[K] {
    return this.#ngPlayer$.pipe(switchMap((player) => player?.[outputName] ?? EMPTY)) as NgYouTubePlayer[K];
  }
}
