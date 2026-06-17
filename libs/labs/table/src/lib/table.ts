import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ang-table',
  imports: [],
  templateUrl: './table.html',
  styleUrl: './table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Table {}
