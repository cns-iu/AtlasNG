import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  model,
  output,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { MatOption } from '@angular/material/core';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatActionList, MatListModule } from '@angular/material/list';
import { MatSelect } from '@angular/material/select';
import { ScrollArea } from '@atlasng/design-system/scroll-area';

/**
 * A version and the file formats available for it.
 *
 * `T` is the format type, so consumers can attach extra data such as a download URL to each
 * format and get it back unchanged in the {@link VersionDownload} event.
 */
export interface VersionControlItem<T extends VersionControlFileFormat> {
  /** Displayed version identifier. */
  label: string;
  /** File formats available for this version, in display order. */
  formats: T[];
}

/** A file format offered for download. */
export interface VersionControlFileFormat {
  /** Displayed file format. */
  label: string;
  /** Supporting text displayed under the file format. Nothing is shown when it is empty. */
  description: string;
}

/** Emitted when a file format is chosen for download. */
export interface VersionDownload<T extends VersionControlFileFormat> {
  /** Version the format belongs to. */
  item: VersionControlItem<T>;
  /** File format to download. */
  format: T;
}

/**
 * Selects a version and requests a download of one of its file formats.
 *
 * The component does not download files itself. Choosing a format emits {@link VersionControl.download},
 * and the consumer performs the download.
 */
@Component({
  selector: 'ang-version-control',
  imports: [MatActionList, MatFormField, MatIcon, MatLabel, MatListModule, MatOption, MatSelect, ScrollArea],
  templateUrl: './version-control.html',
  styleUrl: './version-control.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ang-version-control',
  },
})
export class VersionControl<T extends VersionControlFileFormat = VersionControlFileFormat> {
  /** Heading displayed beside the version selector. */
  readonly tagline = input.required<string>();

  /** Versions and their available file formats. */
  readonly versions = input.required<readonly VersionControlItem<T>[]>();

  /** Selected version. Defaults to the first version. */
  readonly selectedVersion = model<VersionControlItem<T> | undefined>();

  /** Emits the version and file format whenever a download option is chosen. */
  readonly download = output<VersionDownload<T>>();

  /** Host element of the version select. */
  private readonly versionSelect = viewChild.required<MatSelect, ElementRef<HTMLElement>>(MatSelect, {
    read: ElementRef,
  });

  /**
   * Keeps the highlighted version option in view.
   *
   * `mat-select` scrolls its panel to show the highlighted option, but here the options scroll in an
   * `ang-scroll-area` inside the panel. The select names the highlighted option in its
   * `aria-activedescendant` whenever the panel opens or the highlight moves, including through
   * type-ahead, so watching that attribute covers every case.
   */
  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const select = this.versionSelect().nativeElement;
      const observer = new MutationObserver(() => {
        const id = select.getAttribute('aria-activedescendant');
        const option = id ? select.ownerDocument.getElementById(id) : null;
        option?.scrollIntoView({ block: 'nearest' });
      });

      observer.observe(select, { attributeFilter: ['aria-activedescendant'] });
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
