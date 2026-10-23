import { Component } from '@angular/core';

/**
 * Stand-in for the explorer filter menu until the filter form component is
 * available.
 */
@Component({
  selector: 'ang-kg-explorer-filter-menu-placeholder',
  template: `<p class="ang-kg-explorer-filter-menu-placeholder--label">Filter menu placeholder</p>`,
  styleUrl: './filter-menu-placeholder.scss',
  host: {
    class: 'ang-kg-explorer-filter-menu-placeholder',
  },
})
export class KgExplorerFilterMenuPlaceholder {}
