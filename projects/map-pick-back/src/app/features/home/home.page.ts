import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { appBaseUrl } from 'shared-ui';

@Component({
  selector: 'mp-home-page',
  imports: [RouterLink],
  templateUrl: './home.page.html',
  host: { class: 'rb-page rb-page--home' },
})
export class HomePage {
  readonly demoOpenUrl: string;
  readonly demoReturnUrl: string;

  constructor() {
    const base = appBaseUrl();
    const returnUrl = `${base}/demo-caller`;
    this.demoOpenUrl = `${base}/map?returnUrl=${encodeURIComponent(returnUrl)}&state=demo1`;
    this.demoReturnUrl =
      `${base}/demo-caller?lat=59.9139&lng=10.7522&zoom=14&format=map-pin&state=demo1`;
  }
}
