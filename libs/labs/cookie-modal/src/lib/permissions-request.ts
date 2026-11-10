import { inject, Provider } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { provideAnalyticsPermissionsRequestHandler } from '@atlasng/analytics/permissions';
import { CookieModal, CookieModalData, CookieModalResult } from './cookie-modal';

/** Index of the modal's Details tab, the only tab with category toggles and "Allow Selection". */
const DETAILS_TAB_INDEX = 1;

/**
 * Makes `AnalyticsPermissionsManager.requestCategories()` open the {@link CookieModal} on its Details tab
 * with the requested categories toggled on and the first one scrolled into view, so the user sees and
 * approves them before they're granted. Add it to the application's root providers.
 *
 * @param data Logo and providers shown in the modal.
 * @returns Provider for the analytics permissions request handler.
 */
export function provideCookieModalPermissionsRequest(
  data: Pick<CookieModalData, 'logoSrc' | 'logoLabel' | 'providers'> = {},
): Provider {
  return provideAnalyticsPermissionsRequestHandler(() => {
    const dialog = inject(MatDialog);
    return (permissions, categories) =>
      dialog
        .open<CookieModal, CookieModalData, CookieModalResult>(CookieModal, {
          data: { ...data, permissions, activeTab: DETAILS_TAB_INDEX, scrollToCategory: categories[0] },
        })
        .afterClosed();
  });
}
