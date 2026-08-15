import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { appBaseUrl } from 'shared-ui';

@Component({
  selector: 'pb-home-page',
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
    this.demoOpenUrl = `${base}?returnUrl=${encodeURIComponent(returnUrl)}&state=demo1&allowedOrigins=${encodeURIComponent(origin)}&delivery=hash&length=4`;
    this.demoReturnUrl = `${base}/demo-caller#value=1234&format=pin.digits&state=demo1`;
  }
}
