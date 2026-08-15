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
    this.demoOpenUrl = `${base}/color?returnUrl=${encodeURIComponent(returnUrl)}&state=demo1`;
    this.demoReturnUrl =
      `${base}/demo-caller?hex=%23c45c26&rgb=196%2C92%2C38&format=hex&state=demo1`;
  }
}
