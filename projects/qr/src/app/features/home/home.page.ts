import { Component } from '@angular/core';
import { RbHomeDocs } from 'shared-ui';

@Component({
  selector: 'qr-home-page',
  imports: [RbHomeDocs],
  template: `
    <rb-home-docs
      brand="QR"
      title="Generate a QR code and return it to the app you came from"
      lead="Type text or a URL. After Done, an SVG data URL is returned as value with format=qr.svg."
      ctaLabel="Generate QR"
      format="qr.svg"
      [openParamDocs]="['text']"
      demoValue="data:image/svg+xml,…"
    />
  `,
  host: { class: 'rb-page rb-page--home' },
})
export class HomePage {}
