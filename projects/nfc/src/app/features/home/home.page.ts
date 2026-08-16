import { Component } from '@angular/core';
import { RbHomeDocs } from 'shared-ui';

@Component({
  selector: 'nb-home-page',
  imports: [RbHomeDocs],
  template: `
    <rb-home-docs
      brand="NFC"
      title="Read an NFC tag and return it to the app you came from"
      lead="Web NFC reader/writer (Chrome/Android). Returns value + format=nfc.* with recordType."
      ctaLabel="Start NFC scan"
      format="nfc.url"
      [openParamDocs]="['mode', 'text']"
      demoValue="https://example.com"
      [returnExtras]="{ recordType: 'url' }"
      footnote="Requires HTTPS and Web NFC (Chrome on Android)."
    />
  `,
  host: { class: 'rb-page rb-page--home' },
})
export class HomePage {}
