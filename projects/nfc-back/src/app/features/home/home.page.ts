import { Component } from '@angular/core';
import { RbHomeDocs, appBaseUrl, buildDemoOpenUrl } from 'shared-ui';

@Component({
  selector: 'nb-home-page',
  imports: [RbHomeDocs],
  template: `
    <rb-home-docs
      brand="NfcBack"
      title="Read an NFC tag and return it to the app you came from"
      lead="Web NFC reader (Chrome/Android). Defaults to delivery=postMessage; falls back to hash redirect."
      ctaLabel="Start NFC scan"
      [openExample]="openExample"
      [returnExample]="returnExample"
      [demoOpenUrl]="demoOpenUrl"
      [demoReturnUrl]="demoReturnUrl"
      footnote="Requires HTTPS and Web NFC (Chrome on Android). Without returnUrl, the reading stays in the app."
    />
  `,
  host: { class: 'rb-page rb-page--home' },
})
export class HomePage {
  readonly openExample =
    '?returnUrl=<urlencoded-https-url>&state=<optional>&allowedOrigins=<optional>&delivery=postMessage';
  readonly returnExample =
    'postMessage { value, format: nfc.*, recordType, state } — or hash fallback';
  readonly demoOpenUrl: string;
  readonly demoReturnUrl: string;

  constructor() {
    const base = appBaseUrl();
    this.demoOpenUrl = buildDemoOpenUrl(base, { delivery: 'hash' });
    this.demoReturnUrl = `${base}/demo-caller#value=https://example.com&format=nfc.url&recordType=url&state=demo1`;
  }
}
