import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { appBaseUrl } from 'shared-ui';

@Component({
  selector: 'cb-home-page',
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
    const origin = new URL(base).origin;
    this.demoOpenUrl = `${base}?returnUrl=${encodeURIComponent(returnUrl)}&state=demo1&allowedOrigins=${encodeURIComponent(origin)}`;
    this.demoReturnUrl = `${base}/demo-caller?value=%23c45c26&format=color.hex&rgb=196,92,38&state=demo1`;
  }
}
