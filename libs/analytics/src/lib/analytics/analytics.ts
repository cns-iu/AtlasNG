import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ang-analytics',
  imports: [],
  templateUrl: './analytics.html',
  styleUrl: './analytics.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Analytics {}
