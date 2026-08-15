import { Component } from '@angular/core';
import { RbHomeDocs, appBaseUrl, buildDemoOpenUrl } from 'shared-ui';

@Component({
  selector: 'sb-home-page',
  imports: [RbHomeDocs],
  template: `
    <rb-home-docs
      brand="ScanBack"
      title="Scan a code and return it to the app you came from"
      lead="Camera barcode scanner that other web apps can open. After a successful scan, the value is returned via value + format."
      ctaLabel="Start scanning"
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
    '?returnUrl=<urlencoded-https-url>&state=<optional>&allowedOrigins=<optional>&delivery=query&formats=<optional>';
  readonly returnExample = '<returnUrl>?value=<payload>&format=scan.qr_code&state=<state>';
  readonly demoOpenUrl: string;
  readonly demoReturnUrl: string;

  constructor() {
    const base = appBaseUrl();
    this.demoOpenUrl = buildDemoOpenUrl(base, { delivery: 'query' });
    this.demoReturnUrl = `${base}/demo-caller?value=ABC-123&format=scan.qr_code&state=demo1`;
  }
}
