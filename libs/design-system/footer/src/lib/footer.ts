import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ang-footer',
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {}
