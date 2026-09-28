import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, model } from '@angular/core';
import { MatOption } from '@angular/material/core';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatActionList, MatListModule } from '@angular/material/list';
import { MatSelect } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltip } from '@angular/material/tooltip';
import { createSnackBarConfig, Snackbar } from '@atlasng/design-system/snackbar';

/** A downloadable representation of a version. */
export interface VersionControlDownloadOption {
  /** Displayed file format. */
  fileFormat: string;
  /** URL used to download the file. */
  downloadUrl: string;
}

/** A version and the files available for it. */
export interface VersionControlVersion {
  /** Displayed version identifier. */
  version: string;
  /** Files available for this version. */
  downloadOptions: readonly VersionControlDownloadOption[];
}

/** Supporting copy for a file format. */
export interface FileFormatDescription {
  /** File format matched against a download option. */
  fileFormat: string;
  /** Supporting text displayed under the file format. */
  supportingText: string;
}

/** Selects a version and downloads one of the files available for it. */
@Component({
  selector: 'ang-version-control',
  imports: [MatActionList, MatFormField, MatIcon, MatLabel, MatListModule, MatOption, MatSelect, MatTooltip],
  templateUrl: './version-control.html',
  styleUrl: './version-control.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ang-version-control',
  },
})
export class VersionControl {
  /** Versions and their available downloads. */
  readonly versions = input.required<readonly VersionControlVersion[]>();

  /** Supporting copy for each known file format. */
  readonly fileFormats = input.required<readonly FileFormatDescription[]>();

  /** Selected version identifier, defaulting to the first supplied version. */
  readonly selectedVersion = model<string>();

  /** Lookup of supporting copy by file format. */
  readonly #descriptions = computed(
    () => new Map(this.fileFormats().map(({ fileFormat, supportingText }) => [fileFormat, supportingText])),
  );

  /** Currently selected version and its download options. */
  protected readonly currentVersion = computed<VersionControlVersion | undefined>(() => {
    const versions = this.versions();
    return versions.find(({ version }) => version === this.selectedVersion()) ?? versions[0];
  });

  /** Browser document used to initiate native downloads. */
  readonly #document = inject(DOCUMENT);

  /** Snackbar service used for download confirmation. */
  readonly #snackbar = inject(MatSnackBar);

  /**
   * Gets the supporting copy for a file format.
   *
   * @param fileFormat File format to look up.
   * @returns Supporting text when the format is known.
   */
  protected descriptionFor(fileFormat: string): string | undefined {
    return this.#descriptions().get(fileFormat);
  }

  /**
   * Starts a browser download and announces it with a snackbar.
   *
   * @param option Download option selected by the user.
   */
  protected downloadFile(option: VersionControlDownloadOption): void {
    const link = this.#document.createElement('a');
    link.href = option.downloadUrl;
    link.download = '';
    link.hidden = true;
    this.#document.body.append(link);
    link.click();
    link.remove();

    this.#snackbar.openFromComponent(
      Snackbar,
      createSnackBarConfig('File downloaded', {
        duration: 2000,
        politeness: 'polite',
        verticalPosition: 'top',
      }),
    );
  }
}
