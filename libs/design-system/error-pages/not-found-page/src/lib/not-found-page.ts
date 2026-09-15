import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { AnyLink } from '@atlasng/common';

@Component({
  selector: 'ang-not-found-page',
  imports: [MatButtonModule, RouterModule, AnyLink],
  templateUrl: './not-found-page.html',
  styleUrl: './not-found-page.scss',
})
export class NotFoundPage {}
