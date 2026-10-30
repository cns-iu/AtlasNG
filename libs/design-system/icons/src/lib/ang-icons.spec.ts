import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatIcon, MatIconRegistry } from '@angular/material/icon';
import { render, screen } from '@testing-library/angular';
import { firstValueFrom } from 'rxjs';
import {
  ANG_ICONS_FONT_CLASS,
  ANG_ICONS_FONT_SET,
  type AngIconsOptions,
  provideAngIcons,
  toAngIconName,
} from './ang-icons';

const HEART_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>';
const SPRITE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg"><symbol id="heart" viewBox="0 0 24 24"><path d="M1 1h22v22H1z"/></symbol></svg>';

function setup(options?: AngIconsOptions) {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), provideAngIcons(options)],
  });
  return {
    registry: TestBed.inject(MatIconRegistry),
    http: TestBed.inject(HttpTestingController),
  };
}

describe('provideAngIcons', () => {
  it('registers the font set alias', () => {
    const { registry } = setup();
    expect(registry.classNameForFontAlias(ANG_ICONS_FONT_SET)).toBe(ANG_ICONS_FONT_CLASS);
  });

  it('renders font ligature icons with the font class', async () => {
    await render(`<mat-icon fontSet="ang-icons">heart</mat-icon>`, {
      imports: [MatIcon],
      providers: [provideAngIcons()],
    });
    expect(screen.getByText('heart')).toHaveClass(ANG_ICONS_FONT_CLASS);
  });

  it('registers the sprite in the default namespace', async () => {
    const { registry, http } = setup({ spriteUrl: 'assets/ang-icons/sprite.svg' });
    const icon = firstValueFrom(registry.getNamedSvgIcon('heart', 'ang'));
    http.expectOne('assets/ang-icons/sprite.svg').flush(SPRITE_SVG);
    expect((await icon).querySelector('path')).toHaveAttribute('d', 'M1 1h22v22H1z');
    http.verify();
  });

  it('registers literals keyed by icon name or export name', async () => {
    const { registry } = setup({ literals: { heart: HEART_SVG, angIconLeftKidney: HEART_SVG } });
    await expect(firstValueFrom(registry.getNamedSvgIcon('heart', 'ang'))).resolves.toBeInstanceOf(SVGElement);
    await expect(firstValueFrom(registry.getNamedSvgIcon('left-kidney', 'ang'))).resolves.toBeInstanceOf(SVGElement);
  });

  it('uses a custom namespace', async () => {
    const { registry } = setup({ literals: { heart: HEART_SVG }, namespace: 'custom' });
    await expect(firstValueFrom(registry.getNamedSvgIcon('heart', 'custom'))).resolves.toBeInstanceOf(SVGElement);
    await expect(firstValueFrom(registry.getNamedSvgIcon('heart', 'ang'))).rejects.toThrow();
  });
});

describe('toAngIconName', () => {
  it.each([
    ['angIconHeart', 'heart'],
    ['angIconLeftKidney', 'left-kidney'],
    ['angIconOrgan2', 'organ2'],
    ['left-kidney', 'left-kidney'],
    ['angIcon', 'angIcon'],
  ])('converts %s to %s', (key, name) => {
    expect(toAngIconName(key)).toBe(name);
  });
});
