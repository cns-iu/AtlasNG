import { EventEmitter } from '@angular/core';
import { By } from '@angular/platform-browser';
import { YouTubePlayer as NgYouTubePlayer } from '@angular/youtube-player';
import {
  AnalyticsPermissions,
  AnalyticsPermissionsManager,
  provideAnalyticsPermissionsManagerConfig,
  provideInitialAnalyticsPermissions,
} from '@atlasng/analytics/permissions';
import { ComponentInput, render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { provideYouTubePlayerConfig, YouTubePlayer, YouTubePlayerEnableRequest } from './youtube-player';

describe('YouTubePlayer', () => {
  const permissionsConfig = provideAnalyticsPermissionsManagerConfig({
    changeEventName: false,
    storage: false,
    storageEvents: false,
  });

  async function setup(
    options: {
      enabled?: boolean;
      inputs?: ComponentInput<YouTubePlayer>;
      onEnableRequest?: () => void;
    } = {},
  ) {
    const { enabled = false, inputs = {}, onEnableRequest } = options;
    const result = await render(YouTubePlayer, {
      inputs: {
        videoId: 'pzUFmDhQEO8',
        ...inputs,
      },
      on: onEnableRequest ? { enableRequest: onEnableRequest } : undefined,
      providers: [
        provideInitialAnalyticsPermissions(enabled ? AnalyticsPermissions.FULL : AnalyticsPermissions.DEFAULT),
        permissionsConfig,
      ],
    });

    return {
      ...result,
      permissionsManager: result.fixture.debugElement.injector.get(AnalyticsPermissionsManager),
      user: userEvent.setup(),
    };
  }

  function getNgPlayer(fixture: Awaited<ReturnType<typeof setup>>['fixture']): NgYouTubePlayer {
    return fixture.debugElement.query(By.directive(NgYouTubePlayer)).componentInstance as NgYouTubePlayer;
  }

  it('renders the privacy-preserving placeholder when marketing permission is disabled', async () => {
    const { fixture } = await setup();

    expect(screen.getByRole('link', { name: 'Play video' })).toHaveAttribute(
      'href',
      'https://www.youtube.com/watch?v=pzUFmDhQEO8',
    );
    expect(screen.getByRole('button', { name: 'Enable cookies' })).toBeVisible();
    expect(fixture.debugElement.query(By.directive(NgYouTubePlayer))).toBeNull();
    expect(fixture.componentInstance.ngPlayer()).toBeUndefined();
  });

  it('emits enableRequest when the default request button is clicked', async () => {
    const enableRequest = vi.fn();
    const { user } = await setup({ onEnableRequest: enableRequest });

    await user.click(screen.getByRole('button', { name: 'Enable cookies' }));

    expect(enableRequest).toHaveBeenCalledOnce();
  });

  it('projects custom enable-request content instead of the default message', async () => {
    await render(
      `<ang-youtube-player videoId="pzUFmDhQEO8">
        <button angYouTubePlayerEnableRequest>Review privacy settings</button>
      </ang-youtube-player>`,
      {
        imports: [YouTubePlayer, YouTubePlayerEnableRequest],
        providers: [provideInitialAnalyticsPermissions(AnalyticsPermissions.DEFAULT), permissionsConfig],
      },
    );

    expect(screen.getByRole('button', { name: 'Review privacy settings' })).toHaveClass(
      'ang-youtube-player--enable-request',
    );
    expect(screen.queryByRole('button', { name: 'Enable cookies' })).not.toBeInTheDocument();
  });

  it('uses global placeholder configuration when inputs are not provided', async () => {
    await render(YouTubePlayer, {
      inputs: { videoId: 'pzUFmDhQEO8' },
      providers: [
        provideInitialAnalyticsPermissions(AnalyticsPermissions.DEFAULT),
        permissionsConfig,
        provideYouTubePlayerConfig({
          disablePlaceholder: true,
          placeholderButtonLabel: 'Watch the example',
          placeholderImageQuality: 'high',
        }),
      ],
    });

    expect(screen.getByRole('link', { name: 'Watch the example' })).toBeVisible();
    expect(screen.getByRole('presentation')).toHaveAttribute(
      'src',
      'https://i.ytimg.com/vi/pzUFmDhQEO8/maxresdefault.jpg',
    );
  });

  it('renders and exposes the underlying player when marketing permission is enabled', async () => {
    const { fixture } = await setup({ enabled: true });
    const ngPlayer = getNgPlayer(fixture);

    expect(ngPlayer).toBeTruthy();
    expect(fixture.componentInstance.ngPlayer()).toBe(ngPlayer);
    expect(screen.queryByRole('button', { name: 'Enable cookies' })).not.toBeInTheDocument();
  });

  it('forwards inputs and merges player variable defaults into the underlying player', async () => {
    const { fixture } = await setup({
      enabled: true,
      inputs: {
        videoId: 'dQw4w9WgXcQ',
        width: 800,
        height: 450,
        startSeconds: 10,
        endSeconds: 45,
        suggestedQuality: 'hd720',
        playerVars: { autoplay: 1, rel: 1 },
        disablePlaceholder: true,
        placeholderButtonLabel: 'Play demo',
        placeholderImageQuality: 'high',
      },
    });
    const ngPlayer = getNgPlayer(fixture);

    expect(ngPlayer.videoId).toBe('dQw4w9WgXcQ');
    expect(ngPlayer.width).toBe(800);
    expect(ngPlayer.height).toBe(450);
    expect(ngPlayer.startSeconds).toBe(10);
    expect(ngPlayer.endSeconds).toBe(45);
    expect(ngPlayer.suggestedQuality).toBe('hd720');
    expect(ngPlayer.playerVars).toEqual({ autoplay: 1, rel: 1, showinfo: 0 });
    expect(ngPlayer.disablePlaceholder).toBe(true);
    expect(ngPlayer.placeholderButtonLabel).toBe('Play demo');
    expect(ngPlayer.placeholderImageQuality).toBe('high');
    expect(ngPlayer.disableCookies).toBe(true);
    expect(ngPlayer.loadApi).toBe(true);
  });

  it('reacts to marketing permission changes', async () => {
    const { fixture, permissionsManager } = await setup();

    permissionsManager.setFullPermissions();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.ngPlayer()).toBe(getNgPlayer(fixture));

    permissionsManager.setDefaultPermissions();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.debugElement.query(By.directive(NgYouTubePlayer))).toBeNull();
    expect(fixture.componentInstance.ngPlayer()).toBeUndefined();
  });

  it('forwards events from the current underlying player', async () => {
    const ready = vi.fn();
    const { fixture } = await render(YouTubePlayer, {
      inputs: { videoId: 'pzUFmDhQEO8' },
      on: { ready },
      providers: [provideInitialAnalyticsPermissions(AnalyticsPermissions.FULL), permissionsConfig],
    });
    const ngPlayer = getNgPlayer(fixture);
    const event = { target: {} } as YT.PlayerEvent;

    (ngPlayer.ready as EventEmitter<YT.PlayerEvent>).emit(event);

    await waitFor(() => expect(ready).toHaveBeenCalledWith(event));
  });
});
