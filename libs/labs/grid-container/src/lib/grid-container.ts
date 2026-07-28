import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Layout component that allows for grid arrangement of child elements.
 */
@Component({
  selector: 'ang-grid-container',
  imports: [],
  template: '<ng-content />',
  styleUrl: './grid-container.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--ang-grid-container-item-min-width]': 'itemMinWidth()',
  },
})
export class GridContainer {
  /** Minimum item width */
  readonly itemMinWidth = input<string>();
}
