import { ChangeDetectionStrategy, Component, computed, inject, input, model, output } from '@angular/core';
import { MatOption } from '@angular/material/core';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatActionList, MatListModule } from '@angular/material/list';
import { MatSelect } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ScrollArea } from '@atlasng/design-system/scroll-area';
import { createSnackBarConfig, Snackbar } from '@atlasng/design-system/snackbar';

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
 * The component does not download files itself. Choosing a format shows a confirmation
 * snackbar and emits {@link VersionControl.download}, and the consumer performs the download.
 */
@Component({
  selector: 'ang-version-control',
  imports: [MatActionList, MatFormField, MatIcon, MatLabel, MatListModule, MatOption, MatSelect, ScrollArea],
  templateUrl: './version-control.html',
  styleUrl: './version-control.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VersionControl<T extends VersionControlFileFormat = VersionControlFileFormat> {
  /** Heading displayed beside the version selector. */
  readonly tagline = input.required<string>();

  /** Versions and their available file formats. */
  readonly versions = input.required<readonly VersionControlItem<T>[]>();

  /** Selected version, matched to {@link versions} by label. Defaults to the first version. */
  readonly selectedVersion = model<VersionControlItem<T> | undefined>();

  /** Emits the version and file format whenever a download option is chosen. */
  readonly download = output<VersionDownload<T>>();

  /** Selected version, falling back to the first version when none is selected or it is not found. */
  protected readonly currentVersion = computed<VersionControlItem<T> | undefined>(() => {
    const versions = this.versions();
    return versions.find(({ label }) => label === this.selectedVersion()?.label) ?? versions[0];
  });

  /** Snackbar service used for download confirmation. */
  readonly #snackbar = inject(MatSnackBar);

  /** Shows a snackbar confirming that a file was downloaded. */
  openSnackbar(): void {
    this.#snackbar.openFromComponent(
      Snackbar,
      createSnackBarConfig('File downloaded', {
        duration: 5000,
        verticalPosition: 'top',
      }),
    );
  }
}
