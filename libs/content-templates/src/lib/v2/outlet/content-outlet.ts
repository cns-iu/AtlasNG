import { Directive, effect, input } from '@angular/core';
import { ContentDocument } from '@atlasng/content-templates/types';

@Directive({
  selector: 'ang-content-outlet, [angContentOutlet]',
  providers: [],
  host: { class: 'ang-content-outlet' },
})
export class ContentOutlet {
  readonly document = input.required<ContentDocument>();

  constructor() {
    effect((onCleanup) => {
      // const document = this.document();
      const controller = new AbortController();
      // TODO

      onCleanup(() => {
        controller.abort();
        // TODO
      });

      // TODO
    });
  }
}
