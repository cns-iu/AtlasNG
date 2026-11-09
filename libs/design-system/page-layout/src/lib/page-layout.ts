import { Component, Directive, input } from '@angular/core';

/**
 * Width of the page layout's side panel column from the `medium` breakpoint.
 *
 * - `medium`: fits a table of contents. The column is 15rem to 18.75rem wide and runs to the layout's edge.
 * - `large`: fits version control. The panel is 17.5rem to 25rem wide and stays inside the side padding.
 */
export type PageLayoutSidePanelWidth = 'medium' | 'large';

/**
 * Marks projected content as the page header, such as breadcrumbs, the page title, a description, and actions.
 * Works as an element or an attribute.
 */
@Directive({
  selector: 'ang-page-layout-header, [angPageLayoutHeader]',
})
export class PageLayoutHeader {}

/**
 * Marks projected content as the intro, such as a metadata page's first section. On narrow screens the intro
 * stays above the side panel, while the rest of the main content follows it.
 * Works as an element or an attribute.
 */
@Directive({
  selector: 'ang-page-layout-intro, [angPageLayoutIntro]',
})
export class PageLayoutIntro {}

/**
 * Marks projected content as the side panel, such as a table of contents or version control.
 * Works as an element or an attribute.
 */
@Directive({
  selector: 'ang-page-layout-side-panel, [angPageLayoutSidePanel]',
})
export class PageLayoutSidePanel {}

/**
 * Marks projected content as the end of the page, such as the date it was last updated.
 * Works as an element or an attribute.
 */
@Directive({
  selector: 'ang-page-layout-end, [angPageLayoutEnd]',
})
export class PageLayoutEnd {}

/**
 * Page body layout with page header, intro, main, side panel, and end slots.
 *
 * Unmarked content is projected into the main slot. From the `medium` breakpoint, the side panel is a sticky
 * column beside the page header, intro, main content, and end. Below it, the slots stack in a single column with
 * the side panel after the page header and intro. Empty slots take no space, but an empty side panel keeps its
 * column on wide screens so the main content width stays the same from page to page. Set `sidePanelWidth` to
 * `large` for wider side panel content, such as a metadata page's version control.
 *
 * The maximum width and side padding come from the `page-layout` tokens, which the `page-container` Sass mixin
 * shares with sections outside the layout.
 *
 * The layout adds no landmarks. The application shell owns the `main` landmark, as well as the header and footer
 * around the layout.
 */
@Component({
  selector: 'ang-page-layout',
  templateUrl: './page-layout.html',
  styleUrl: './page-layout.scss',
  host: {
    class: 'ang-page-layout',
    '[class]': '"ang-page-layout--side-panel-width-" + sidePanelWidth()',
  },
})
export class PageLayout {
  /** Width of the side panel column from the `medium` breakpoint. Use `large` for version control. */
  readonly sidePanelWidth = input<PageLayoutSidePanelWidth>('medium');
}
