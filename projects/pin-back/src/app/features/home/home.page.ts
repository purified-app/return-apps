import { Component } from '@angular/core';
import { RbHomeDocs, appBaseUrl, buildDemoOpenUrl } from 'shared-ui';

@Component({
  selector: 'pb-home-page',
  imports: [RbHomeDocs],
  template: `
    <rb-home-docs
      brand="PinBack"
      title="Enter a PIN and return it to the app you came from"
      lead="Fullscreen numeric keypad. After Done, the PIN is returned as value + format=pin.digits (hash by default)."
      ctaLabel="Enter PIN"
      [openExample]="openExample"
      [returnExample]="returnExample"
      [demoOpenUrl]="demoOpenUrl"
      [demoReturnUrl]="demoReturnUrl"
    />
  `,
  host: { class: 'rb-page rb-page--home' },
})
export class HomePage {
  readonly openExample =
    '?returnUrl=<url>&state=<optional>&allowedOrigins=<optional>&delivery=hash&length=<optional>&mask=<optional>';
  readonly returnExample = '<returnUrl>#value=<digits>&format=pin.digits&state=<state>';
  readonly demoOpenUrl: string;
  readonly demoReturnUrl: string;

  constructor() {
    const base = appBaseUrl();
    this.demoOpenUrl = buildDemoOpenUrl(base, {
      delivery: 'hash',
      params: { length: 4 },
    });
    this.demoReturnUrl = `${base}/demo-caller#value=1234&format=pin.digits&state=demo1`;
  }
}
