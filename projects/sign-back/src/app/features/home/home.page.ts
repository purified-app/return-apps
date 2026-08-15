import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { appBaseUrl } from 'shared-ui';

@Component({
  selector: 'sb-home-page',
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
    this.demoOpenUrl = `${base}?returnUrl=${encodeURIComponent(returnUrl)}&state=demo1&allowedOrigins=${encodeURIComponent(origin)}&delivery=hash`;
    this.demoReturnUrl = `${base}/demo-caller#value=data:image/svg+xml,…&format=sign.svg&state=demo1`;
  }
}
