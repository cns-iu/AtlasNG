import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ang-cdk',
  imports: [],
  templateUrl: './cdk.html',
  styleUrl: './cdk.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cdk {}
