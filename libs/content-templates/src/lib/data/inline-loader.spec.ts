import { TestBed } from '@angular/core/testing';
import { ContentDataLoaderRegistry } from '../registries/data-loader-registry';
import { provideContentTemplates, withDataLoaders } from '../registries/providers';
import { ContentDataContext } from '../types/content-data';
import { InlineContentDataLoader } from './inline-loader';

const context: ContentDataContext = { node: { component: 'test' }, signal: new AbortController().signal };

describe('InlineContentDataLoader', () => {
  it('can be registered', async () => {
    TestBed.configureTestingModule({
      providers: [provideContentTemplates(withDataLoaders({ inline: () => new InlineContentDataLoader() }))],
    });

    await expect(TestBed.inject(ContentDataLoaderRegistry).get('inline')).resolves.toBeInstanceOf(
      InlineContentDataLoader,
    );
  });

  it('returns the configured value as is', () => {
    const value = { rows: [{ id: 1 }] };

    expect(new InlineContentDataLoader().load({ type: 'inline', value }, context)).toBe(value);
  });

  it('returns primitive values', () => {
    expect(new InlineContentDataLoader().load({ type: 'inline', value: null }, context)).toBeNull();
  });
});
