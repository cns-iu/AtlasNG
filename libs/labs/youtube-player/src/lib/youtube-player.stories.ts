import { Component, computed, inject, input } from '@angular/core';
import { PlaceholderImageQuality } from '@angular/youtube-player';
import { AnalyticsEventCategory } from '@atlasng/analytics/events';
import {
  AnalyticsPermissions,
  AnalyticsPermissionsManager,
  provideAnalyticsPermissionsManagerConfig,
  provideInitialAnalyticsPermissions,
} from '@atlasng/analytics/permissions';
import { applicationConfig, argsToTemplate, Meta, moduleMetadata, StoryObj } from '@storybook/angular';
import { YouTubePlayer } from './youtube-player';

@Component({
  selector: 'ang-youtube-player-permission-story',
  imports: [YouTubePlayer],
  template: `
    <button type="button" style="margin-bottom: 2rem;" [attr.aria-pressed]="enabled()" (click)="togglePermission()">
      {{ enabled() ? 'Disable' : 'Enable' }} marketing permission
    </button>

    <ang-youtube-player
      [videoId]="videoId()"
      [width]="width()"
      [height]="height()"
      [startSeconds]="startSeconds()"
      [endSeconds]="endSeconds()"
      [suggestedQuality]="suggestedQuality()"
      [playerVars]="playerVars()"
      [disablePlaceholder]="disablePlaceholder()"
      [placeholderButtonLabel]="placeholderButtonLabel()"
      [placeholderImageQuality]="placeholderImageQuality()"
      (enableRequest)="enablePermission()"
    />
  `,
})
class YouTubePlayerPermissionStoryComponent {
  readonly videoId = input.required<string>();
  readonly width = input.required<number>();
  readonly height = input.required<number>();
  readonly startSeconds = input<number>();
  readonly endSeconds = input<number>();
  readonly suggestedQuality = input<YT.SuggestedVideoQuality>();
  readonly playerVars = input<YT.PlayerVars>();
  readonly disablePlaceholder = input(false);
  readonly placeholderButtonLabel = input('Play video');
  readonly placeholderImageQuality = input<PlaceholderImageQuality>('standard');

  readonly #permissionsManager = inject(AnalyticsPermissionsManager);

  protected readonly enabled = computed(() =>
    this.#permissionsManager.permissions().isCategoryEnabled(AnalyticsEventCategory.Marketing),
  );

  protected togglePermission(): void {
    this.#permissionsManager.updatePermissions((permissions) =>
      permissions.toggleCategory(AnalyticsEventCategory.Marketing),
    );
  }

  protected enablePermission(): void {
    this.#permissionsManager.updatePermissions((permissions) =>
      permissions.enableCategory(AnalyticsEventCategory.Marketing),
    );
  }
}

const meta: Meta<YouTubePlayer> = {
  component: YouTubePlayer,
  title: 'Labs/YouTube Player',
  args: {
    videoId: 'pzUFmDhQEO8',
    width: 640,
    height: 390,
    startSeconds: undefined,
    endSeconds: undefined,
    suggestedQuality: 'default',
    playerVars: {},
    disablePlaceholder: false,
    placeholderButtonLabel: 'Play video',
    placeholderImageQuality: 'standard',
  },
  argTypes: {
    videoId: {
      control: 'text',
      description: 'YouTube video ID to load or link to.',
      table: { category: 'Inputs' },
    },
    width: {
      control: { type: 'number', min: 1 },
      description: 'Player and placeholder width in pixels.',
      table: { category: 'Inputs' },
    },
    height: {
      control: { type: 'number', min: 1 },
      description: 'Player and placeholder height in pixels.',
      table: { category: 'Inputs' },
    },
    startSeconds: {
      control: { type: 'number', min: 0 },
      description: 'Time, in seconds, at which playback begins.',
      table: { category: 'Inputs' },
    },
    endSeconds: {
      control: { type: 'number', min: 0 },
      description: 'Time, in seconds, at which playback stops.',
      table: { category: 'Inputs' },
    },
    suggestedQuality: {
      control: 'select',
      description: 'Suggested playback quality passed to the YouTube player.',
      options: ['default', 'small', 'medium', 'large', 'hd720', 'hd1080', 'highres'],
      table: { category: 'Inputs' },
    },
    playerVars: {
      control: 'object',
      description: 'YouTube IFrame Player API parameters merged over the component defaults.',
      table: { category: 'Inputs' },
    },
    disablePlaceholder: {
      control: 'boolean',
      description: "Whether Angular's built-in placeholder is disabled after the player is enabled.",
      table: { category: 'Inputs' },
    },
    placeholderButtonLabel: {
      control: 'text',
      description: 'Accessible label for the play control shown in either placeholder.',
      table: { category: 'Inputs' },
    },
    placeholderImageQuality: {
      control: 'select',
      description: 'Thumbnail quality used by the disabled and enabled player placeholders.',
      options: ['low', 'standard', 'high'],
      table: { category: 'Inputs' },
    },
    enableRequest: {
      control: false,
      description: 'Emitted when the default enable-request button is clicked.',
      table: { category: 'Outputs' },
    },
    ready: {
      control: false,
      description: 'Emits when the underlying YouTube player is initialized.',
      table: { category: 'Outputs' },
    },
    stateChange: {
      control: false,
      description: "Emits when the underlying player's playback state changes.",
      table: { category: 'Outputs' },
    },
    error: {
      control: false,
      description: 'Emits when the underlying player reports an error.',
      table: { category: 'Outputs' },
    },
    apiChange: {
      control: false,
      description: "Emits when the underlying player's API changes.",
      table: { category: 'Outputs' },
    },
    playbackQualityChange: {
      control: false,
      description: "Emits when the underlying player's playback quality changes.",
      table: { category: 'Outputs' },
    },
    playbackRateChange: {
      control: false,
      description: "Emits when the underlying player's playback rate changes.",
      table: { category: 'Outputs' },
    },
    ngPlayer: {
      table: { disable: true },
    },
  },
  decorators: [
    moduleMetadata({
      imports: [YouTubePlayerPermissionStoryComponent],
    }),
    applicationConfig({
      providers: [
        provideInitialAnalyticsPermissions(AnalyticsPermissions.FULL),
        provideAnalyticsPermissionsManagerConfig({
          changeEventName: false,
          storage: false,
          storageEvents: false,
        }),
      ],
    }),
  ],
};

export default meta;
type Story = StoryObj<YouTubePlayer>;

export const Default: Story = {};

export const PermissionRequired: Story = {
  decorators: [
    applicationConfig({
      providers: [provideInitialAnalyticsPermissions(AnalyticsPermissions.DEFAULT)],
    }),
  ],
};

export const PermissionToggle: Story = {
  decorators: [
    applicationConfig({
      providers: [provideInitialAnalyticsPermissions(AnalyticsPermissions.DEFAULT)],
    }),
  ],
  render: (args) => ({
    props: args,
    template: `<ang-youtube-player-permission-story ${argsToTemplate(args)} />`,
  }),
};
