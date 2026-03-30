import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ang-common',
  imports: [],
  templateUrl: './common.html',
  styleUrl: './common.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Common {}
