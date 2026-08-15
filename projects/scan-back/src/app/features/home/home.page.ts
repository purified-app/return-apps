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
    this.demoOpenUrl = `${base}?returnUrl=${encodeURIComponent(returnUrl)}&state=demo1`;
    this.demoReturnUrl = `${base}/demo-caller?scanValue=ABC-123&format=QR_CODE&state=demo1`;
  }
}
