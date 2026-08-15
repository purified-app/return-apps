import { Component } from '@angular/core';
import { RbHomeDocs, appBaseUrl, buildDemoOpenUrl } from 'shared-ui';

@Component({
  selector: 'sb-home-page',
  imports: [RbHomeDocs],
  template: `
    <rb-home-docs
      brand="SignBack"
      title="Capture a signature and return it to the app you came from"
      lead="Mobile-first signature pad that other web apps can open. After Done, the signature SVG is returned as value (hash delivery by default)."
      ctaLabel="Start signing"
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
    '?returnUrl=<urlencoded-https-url>&state=<optional>&allowedOrigins=<optional>&delivery=hash';
  readonly returnExample = '<returnUrl>#value=<svg-data-url>&format=sign.svg&state=<state>';
  readonly demoOpenUrl: string;
  readonly demoReturnUrl: string;

  constructor() {
    const base = appBaseUrl();
    this.demoOpenUrl = buildDemoOpenUrl(base, { delivery: 'hash' });
    this.demoReturnUrl = `${base}/demo-caller#value=data:image/svg+xml,…&format=sign.svg&state=demo1`;
  }
}
