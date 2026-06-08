import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Directive, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Directive({
  selector: 'a[angSkipLinkTarget]',
  host: {
    '[attr.href]': 'target()',
  },
})
export class SkipLinkTargetDirective {
  readonly target = input<string>();
}

@Component({
  selector: 'ang-skip-link',
  imports: [CommonModule, MatButtonModule],
  templateUrl: './skip-link.html',
  styleUrl: './skip-link.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkipLink {
  readonly selector = input<string>();
  readonly label = input('Skip to main content');
}
