import { ChangeDetectionStrategy, Component, computed, inject, input, model, resource } from '@angular/core';
import { MatOption } from '@angular/material/core';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatActionList, MatListModule } from '@angular/material/list';
import { MatSelect } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { createSnackBarConfig, Snackbar } from '@atlasng/design-system/snackbar';
import { saveAs } from 'file-saver';
import { parse } from 'yaml';

/** Number of download options at which the list becomes scrollable. */
const SCROLLABLE_DOWNLOAD_OPTIONS_THRESHOLD = 12;

/** URL of the asset that describes each known file format. */
const FILE_FORMATS_URL = 'assets/file-formats.yaml';

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

/**
 * Loads the file-format descriptions from the shared asset.
 *
 * @returns File formats and their supporting copy.
 * @throws When the asset cannot be fetched.
 */
async function loadFileFormats(): Promise<readonly FileFormatDescription[]> {
  const response = await fetch(FILE_FORMATS_URL);
  if (!response.ok) {
    throw new Error(`Unable to load file-format descriptions: ${response.status}`);
  }

  const formats: unknown = parse(await response.text());
  return Array.isArray(formats) ? (formats as FileFormatDescription[]) : [];
}

/** Selects a version and downloads one of the files available for it. */
@Component({
  selector: 'ang-version-control',
  imports: [MatActionList, MatFormField, MatIcon, MatLabel, MatListModule, MatOption, MatSelect],
  templateUrl: './version-control.html',
  styleUrl: './version-control.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VersionControl {
  /** Snackbar service used for download confirmation. */
  readonly #snackbar = inject(MatSnackBar);

  /** Versions and their available downloads. */
  readonly versions = input.required<readonly VersionControlVersion[]>();

  /** Supporting copy for each known file format, loaded from the file-format asset. */
  protected readonly fileFormats = resource({ loader: loadFileFormats });

  /** Selected version identifier, defaulting to the first supplied version. */
  readonly selectedVersion = model<string>();

  /** Currently selected version and its download options. */
  protected readonly currentVersion = computed<VersionControlVersion | undefined>(() => {
    const versions = this.versions();
    return versions.find(({ version }) => version === this.selectedVersion()) ?? versions[0];
  });

  /** Whether the current version has enough download options to scroll the list. */
  protected readonly scrollable = computed(
    () => (this.currentVersion()?.downloadOptions.length ?? 0) >= SCROLLABLE_DOWNLOAD_OPTIONS_THRESHOLD,
  );

  /**
   * Gets the supporting copy for a file format.
   *
   * @param fileFormat File format to look up.
   * @returns Supporting text when the format is known.
   */
  protected descriptionFor(fileFormat: string): string | undefined {
    const formats = this.fileFormats.hasValue() ? this.fileFormats.value() : [];
    return formats.find((format) => format.fileFormat === fileFormat)?.supportingText;
  }

  /**
   * Downloads a file from the url and shows a confirmation snackbar.
   * @param url File url
   */
  download(url: string): void {
    saveAs(url, url.split('/').pop());
    this.#snackbar.openFromComponent(
      Snackbar,
      createSnackBarConfig('File downloaded', {
        duration: 5000,
        verticalPosition: 'top',
      }),
    );
  }
}
