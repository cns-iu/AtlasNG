# @atlasng/cdk

Low-level building blocks for AtlasNG component authors. The CDK holds behavior and infrastructure that components share, with no visual design of its own.

## Installation

```bash
npm install @atlasng/cdk
```

## Usage

### Style loader

`StyleLoader` attaches a component's styles to the application once, without rendering the component anywhere in the page. This lets directives and other template-less features ship styles the same way components do. The service is adapted from an internal Angular CDK service.

Define a component that only carries styles, then load it where the styles are needed. Repeated calls with the same component have no further effect, and loaded styles are removed when the application is destroyed.

```ts
import { Component, Directive, inject, ViewEncapsulation } from '@angular/core';
import { StyleLoader } from '@atlasng/cdk';

@Component({
  template: '',
  styleUrl: './highlight.scss',
  encapsulation: ViewEncapsulation.None,
})
class HighlightStyles {}

@Directive({
  selector: '[appHighlight]',
  host: { class: 'app-highlight' },
})
export class Highlight {
  constructor() {
    inject(StyleLoader).load(HighlightStyles);
  }
}
```
